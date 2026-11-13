// Courtroom: Landlord's Advocate + Tenant's Advocate run in parallel, then the Judge.
// Streams NDJSON (one CourtroomStreamEvent per line) so the UI shows each argument and
// ruling the moment it exists. Last line is { type: "done", rulings }.
// ?demo=1, or the Judge failing twice, streams the fixture rulings instead.
import fixture from "@/public/demo/courtroom.json";
import { callTool, type ObjectSchema } from "@/lib/claude";
import { JUDGE_PROMPT, LANDLORD_ADVOCATE_PROMPT, TENANT_ADVOCATE_PROMPT } from "@/lib/prompts";
import type { CourtroomRequest, CourtroomStreamEvent } from "@/lib/client";
import type { LineItem, Ruling, Verdict } from "@/lib/types";

export const maxDuration = 60;

const ARGUMENTS_SCHEMA: ObjectSchema = {
  type: "object",
  properties: {
    arguments: {
      type: "array",
      items: {
        type: "object",
        properties: { lineItemId: { type: "string" }, argument: { type: "string" } },
        required: ["lineItemId", "argument"],
        additionalProperties: false,
      },
    },
  },
  required: ["arguments"],
  additionalProperties: false,
};

const RULINGS_SCHEMA: ObjectSchema = {
  type: "object",
  properties: {
    rulings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lineItemId: { type: "string" },
          verdict: { type: "string", enum: ["allowed", "questionable", "not_allowed"] },
          reason: { type: "string" },
          rule: { type: "string" },
        },
        required: ["lineItemId", "verdict", "reason", "rule"],
        additionalProperties: false,
      },
    },
  },
  required: ["rulings"],
  additionalProperties: false,
};

type Args = { arguments: { lineItemId: string; argument: string }[] };
type JudgeOut = { rulings: { lineItemId: string; verdict: Verdict; reason: string; rule: string }[] };

/** The facts every courtroom agent sees. */
function caseFacts(items: LineItem[], tenancyMonths: number, moveOutDate: string): string {
  const lines = items.map(
    (i) =>
      `- ${i.id}: "${i.description}", $${i.amount}, category ${i.category}, ${i.hasReceipt ? "receipt included" : "no receipt"}. Clerk's note: ${i.reason}`,
  );
  return `Tenancy length: ${tenancyMonths} months. Move-out date: ${moveOutDate}.\nCharges:\n${lines.join("\n")}`;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CourtroomRequest | null;
  const items = (body?.items ?? []).filter((i) => i?.id);
  const ids = new Set(items.map((i) => i.id));
  const demo = new URL(req.url).searchParams.get("demo") === "1";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: CourtroomStreamEvent) => controller.enqueue(new TextEncoder().encode(JSON.stringify(e) + "\n"));
      const serveFixture = () => {
        const rulings = (fixture.rulings as Ruling[]).filter((r) => ids.has(r.lineItemId));
        for (const r of rulings) {
          send({ type: "argument", side: "landlord", lineItemId: r.lineItemId, argument: r.landlordArgument });
          send({ type: "argument", side: "tenant", lineItemId: r.lineItemId, argument: r.tenantArgument });
        }
        for (const r of rulings) send({ type: "ruling", ruling: r });
        send({ type: "done", rulings });
      };

      try {
        if (demo || items.length === 0 || !body) {
          serveFixture();
          return;
        }
        const started = Date.now();
        const facts = caseFacts(items, body.tenancyMonths, body.moveOutDate);
        const landlord: Record<string, string> = {};
        const tenant: Record<string, string> = {};

        // 1. Both advocates in parallel; stream each side's arguments as soon as it finishes.
        const advocate = async (side: "landlord" | "tenant") => {
          const store = side === "landlord" ? landlord : tenant;
          try {
            const out = await callTool<Args>(
              side === "landlord" ? LANDLORD_ADVOCATE_PROMPT : TENANT_ADVOCATE_PROMPT,
              [{ type: "text", text: facts }],
              "submit_arguments",
              ARGUMENTS_SCHEMA,
              { description: "Submit one argument per charge.", effort: "low", maxTokens: 4000 },
            );
            for (const a of out.arguments) {
              if (!ids.has(a.lineItemId)) continue;
              store[a.lineItemId] = a.argument;
              send({ type: "argument", side, lineItemId: a.lineItemId, argument: a.argument });
            }
          } catch (err) {
            console.error(`[courtroom] ${side} advocate failed twice:`, err);
          }
          // Any charge this side didn't argue gets a placeholder so the Judge still rules.
          for (const id of ids) store[id] ??= "No argument was made.";
        };
        await Promise.all([advocate("landlord"), advocate("tenant")]);
        console.log(`[courtroom] advocates done in ${Date.now() - started}ms`);

        // 2. Judge reads both sides.
        const transcript = items
          .map((i) => `${i.id} ("${i.description}")\n  Landlord's Advocate: ${landlord[i.id]}\n  Tenant's Advocate: ${tenant[i.id]}`)
          .join("\n\n");
        let judged: JudgeOut;
        try {
          judged = await callTool<JudgeOut>(
            JUDGE_PROMPT,
            [{ type: "text", text: `${facts}\n\nARGUMENTS:\n${transcript}` }],
            "submit_rulings",
            RULINGS_SCHEMA,
            { description: "Submit one ruling per charge.", effort: "medium", maxTokens: 6000 },
          );
        } catch (err) {
          console.error("[courtroom] judge failed twice, serving fixture:", err);
          serveFixture();
          return;
        }

        const rulings: Ruling[] = [];
        for (const r of judged.rulings) {
          if (!ids.has(r.lineItemId) || rulings.some((x) => x.lineItemId === r.lineItemId)) continue;
          const ruling: Ruling = {
            lineItemId: r.lineItemId,
            landlordArgument: landlord[r.lineItemId],
            tenantArgument: tenant[r.lineItemId],
            verdict: r.verdict,
            reason: r.reason,
            rule: r.rule,
          };
          rulings.push(ruling);
          send({ type: "ruling", ruling });
        }
        console.log(`[courtroom] full round in ${Date.now() - started}ms`);
        send({ type: "done", rulings });
      } catch (err) {
        console.error("[courtroom] unexpected error:", err);
        send({ type: "error", message: "The courtroom hit an error." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache", ...(demo ? { "x-demo-fallback": "1" } : {}) },
  });
}
