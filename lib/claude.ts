// SERVER ONLY. Holds the Anthropic SDK and reads ANTHROPIC_API_KEY.
// Import this only from app/api/**. The "server-only" import makes the build fail
// if any browser code (components, hooks, lib/client.ts, lib/caseManager.ts) imports it.
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { BetaContentBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { FileInput } from "./types";

export const MODEL = "claude-sonnet-5-5";
const ATTEMPT_TIMEOUT_MS = 30_000;

// We retry ourselves (once), so the SDK doesn't add hidden retries on top.
const client = new Anthropic({ timeout: ATTEMPT_TIMEOUT_MS, maxRetries: 0 });

export type Content = BetaContentBlockParam[];
export type Effort = "low" | "medium" | "high";

/** JSON Schema for a tool's input. Strict mode needs additionalProperties: false on every object. */
export interface ObjectSchema {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
  [key: string]: unknown; // matches the SDK's InputSchema index signature
}

/** Turn an uploaded file into an image block or a PDF "document" block. */
export function fileBlock(file: FileInput): BetaContentBlockParam {
  if (file.mediaType === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.data } };
  }
  return { type: "image", source: { type: "base64", media_type: file.mediaType, data: file.data } };
}

/**
 * One agent call that must end in a single tool call.
 * Sonnet 5.5 rejects forced tool_choice, so we use tool_choice "auto" + strict: true
 * (schema-valid input guaranteed) + a prompt that names the tool, and retry once if
 * no tool call came back or a required field is missing. Each attempt has a 30s timeout.
 */
export async function callTool<T>(
  system: string,
  content: Content,
  toolName: string,
  inputSchema: ObjectSchema,
  opts: { description?: string; effort?: Effort; maxTokens?: number } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const started = Date.now();
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: opts.maxTokens ?? 8000,
        // Rare safety refusals get re-run on a fallback model inside the same call.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: opts.effort ?? "medium" },
        system,
        tools: [
          {
            name: toolName,
            description: opts.description ?? `Report your results with ${toolName}.`,
            strict: true,
            input_schema: inputSchema,
          },
        ],
        tool_choice: { type: "auto" },
        messages: [{ role: "user", content }],
      });

      if (res.stop_reason === "refusal") throw new Error(`${toolName}: model refused`);
      if (res.stop_reason === "max_tokens") throw new Error(`${toolName}: ran out of tokens`);

      const block = res.content.find((b) => b.type === "tool_use" && b.name === toolName);
      if (!block || block.type !== "tool_use") throw new Error(`${toolName}: no tool call in response`);

      const input = block.input as Record<string, unknown>;
      const missing = inputSchema.required.filter((k) => !(k in input));
      if (missing.length) throw new Error(`${toolName}: missing fields ${missing.join(", ")}`);

      console.log(`[claude] ${toolName} ok in ${Date.now() - started}ms (attempt ${attempt}, ${res.usage.output_tokens} out tokens)`);
      return input as T;
    } catch (err) {
      lastError = err;
      console.warn(`[claude] ${toolName} attempt ${attempt} failed:`, (err as Error).message);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
