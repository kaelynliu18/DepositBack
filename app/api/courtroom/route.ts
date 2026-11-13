// STUB (Step 1): streams the demo fixture as NDJSON. Step 3 replaces this with the real
// Landlord's Advocate + Tenant's Advocate (parallel) -> Judge.
// Wire format: one JSON object per line (see CourtroomStreamEvent in lib/client.ts).
import fixture from "@/public/demo/courtroom.json";
import type { CourtroomRequest, CourtroomStreamEvent } from "@/lib/client";
import type { Ruling } from "@/lib/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({ items: [] }))) as Partial<CourtroomRequest>;
  const ids = new Set((body.items ?? []).map((i) => i.id));
  const rulings = (fixture.rulings as Ruling[]).filter((r) => ids.has(r.lineItemId));

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: CourtroomStreamEvent) => controller.enqueue(new TextEncoder().encode(JSON.stringify(e) + "\n"));
      for (const r of rulings) {
        await sleep(400);
        send({ type: "argument", side: "landlord", lineItemId: r.lineItemId, argument: r.landlordArgument });
        send({ type: "argument", side: "tenant", lineItemId: r.lineItemId, argument: r.tenantArgument });
      }
      for (const r of rulings) {
        await sleep(400);
        send({ type: "ruling", ruling: r });
      }
      send({ type: "done", rulings });
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "x-demo-fallback": "1" } });
}
