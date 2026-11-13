// STUB (Step 1): returns the demo fixture. Step 4 replaces this with the real Inspector.
import { NextResponse } from "next/server";
import fixture from "@/public/demo/inspector.json";
import type { InspectorRequest } from "@/lib/client";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<InspectorRequest>;
  const lineItemId = body.lineItem?.id ?? fixture.lineItemId;
  return NextResponse.json({ ...fixture, lineItemId }, { headers: { "x-demo-fallback": "1" } });
}
