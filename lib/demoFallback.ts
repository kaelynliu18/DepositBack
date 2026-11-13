// SERVER ONLY. Decides whether a failed request may fall back to the demo fixtures.
// Rule: only serve fixture data when the user actually sent the sample files.
// Otherwise a real user's statement could come back with Bayview's charges.
import "server-only";

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import clerkFixture from "@/public/demo/clerk.json";
import type { LineItem } from "./types";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const cache = new Map<string, string>();

/** Hash of a file in public/demo, as base64 (same encoding the browser sends). */
function sampleHash(name: string): string | null {
  if (!cache.has(name)) {
    try {
      cache.set(name, sha(readFileSync(join(process.cwd(), "public/demo", name)).toString("base64")));
    } catch {
      return null;
    }
  }
  return cache.get(name) ?? null;
}

/** True if `data` (base64) is exactly public/demo/<name>. */
export function isSampleFile(data: string | undefined, name: string): boolean {
  if (!data) return false;
  const h = sampleHash(name);
  return h !== null && sha(data) === h;
}

/** True if every charge sent to court matches a charge in the demo Clerk fixture (same id + amount). */
export function isSampleDocket(items: Pick<LineItem, "id" | "amount">[]): boolean {
  return (
    items.length > 0 &&
    items.every((i) => clerkFixture.lineItems.some((f) => f.id === i.id && f.amount === i.amount))
  );
}
