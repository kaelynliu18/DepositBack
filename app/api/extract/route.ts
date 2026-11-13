// Quick extraction for form autofill: reads tenant name, deposit and move-out date off the
// statement as soon as it's dropped in. Small, fast Claude call (effort "low").
// Never errors to the UI: on any failure it returns nulls and the user just types the fields.
import { NextResponse } from "next/server";
import { callTool, fileBlock, type ObjectSchema } from "@/lib/claude";
import type { FileInput } from "@/lib/types";

export const maxDuration = 30;

export interface ExtractResponse {
  tenantName: string | null;
  moveOutDate: string | null; // YYYY-MM-DD
  depositAmount: number | null;
}

const SCHEMA: ObjectSchema = {
  type: "object",
  properties: {
    tenantName: { type: ["string", "null"] },
    moveOutDate: { type: ["string", "null"], description: "YYYY-MM-DD" },
    depositAmount: { type: ["number", "null"], description: "security deposit held, in dollars" },
  },
  required: ["tenantName", "moveOutDate", "depositAmount"],
  additionalProperties: false,
};

const SYSTEM = `You read a landlord's security-deposit statement and copy three facts exactly as printed:
the tenant's name, the move-out date (as YYYY-MM-DD) and the security deposit amount held (a number).
Use null for anything not clearly printed. Never guess. Call the report_details tool exactly once.`;

const EMPTY: ExtractResponse = { tenantName: null, moveOutDate: null, depositAmount: null };
const DEMO: ExtractResponse = { tenantName: "Alex Chen", moveOutDate: "2026-10-01", depositAmount: 2400 };

export async function POST(req: Request) {
  if (new URL(req.url).searchParams.get("demo") === "1") return NextResponse.json(DEMO);
  const body = (await req.json().catch(() => null)) as { statement?: FileInput } | null;
  if (!body?.statement?.data) return NextResponse.json(EMPTY);
  try {
    const r = await callTool<ExtractResponse>(SYSTEM, [fileBlock(body.statement), { type: "text", text: "Read the three facts." }], "report_details", SCHEMA, {
      description: "Report the tenant name, move-out date and deposit amount.",
      effort: "low",
      maxTokens: 2000,
    });
    return NextResponse.json({
      tenantName: r.tenantName?.trim() || null,
      moveOutDate: r.moveOutDate && /^\d{4}-\d{2}-\d{2}$/.test(r.moveOutDate) ? r.moveOutDate : null,
      depositAmount: typeof r.depositAmount === "number" && r.depositAmount > 0 ? r.depositAmount : null,
    } satisfies ExtractResponse);
  } catch (err) {
    console.warn("[extract] failed, user will type the fields:", (err as Error).message);
    return NextResponse.json(EMPTY);
  }
}
