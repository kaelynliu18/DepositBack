// Clerk: reads the statement, extracts every charge, gives a verdict + route for each.
// ?demo=1, or Claude failing twice, returns the fixture with header x-demo-fallback: 1.
import { NextResponse } from "next/server";
import fixture from "@/public/demo/clerk.json";
import { callTool, fileBlock, type ObjectSchema } from "@/lib/claude";
import { CLERK_PROMPT } from "@/lib/prompts";
import type { ClerkRequest } from "@/lib/client";
import type { ClerkResponse, LineItem } from "@/lib/types";

export const maxDuration = 60;

const VERDICTS = ["allowed", "questionable", "not_allowed"];
const nullableString = { type: ["string", "null"] };

const SCHEMA: ObjectSchema = {
  type: "object",
  properties: {
    landlordName: nullableString,
    landlordEmail: nullableString,
    propertyAddress: nullableString,
    statementDate: { type: ["string", "null"], description: "YYYY-MM-DD" },
    lineItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          amount: { type: "number" },
          category: { type: "string", enum: ["cleaning", "repair", "paint", "carpet", "rent", "fee", "other"] },
          hasReceipt: { type: "boolean" },
          verdict: { type: "string", enum: VERDICTS },
          reason: { type: "string" },
          rule: { type: "string" },
          route: { type: "string", enum: ["settled", "courtroom", "inspector"] },
        },
        required: ["id", "description", "amount", "category", "hasReceipt", "verdict", "reason", "rule", "route"],
        additionalProperties: false,
      },
    },
    otherIssues: { type: "array", items: { type: "string" } },
  },
  required: ["landlordName", "landlordEmail", "propertyAddress", "statementDate", "lineItems", "otherIssues"],
  additionalProperties: false,
};

const fallback = () => NextResponse.json(fixture, { headers: { "x-demo-fallback": "1" } });

export async function POST(req: Request) {
  if (new URL(req.url).searchParams.get("demo") === "1") return fallback();

  let body: ClerkRequest;
  try {
    body = await req.json();
    if (!body?.statement?.data) throw new Error("missing statement");
  } catch {
    return NextResponse.json({ error: "Send { statement, depositAmount, moveOutDate, tenancyMonths, tenantName }" }, { status: 400 });
  }

  try {
    const raw = await callTool<Omit<ClerkResponse, "lineItems"> & { lineItems: Omit<LineItem, "decidedBy">[] }>(
      CLERK_PROMPT,
      [
        fileBlock(body.statement),
        {
          type: "text",
          text: `Deposit: $${body.depositAmount}. Move-out date: ${body.moveOutDate}. Tenancy length: ${body.tenancyMonths} months.`,
        },
      ],
      "report_charges",
      SCHEMA,
      { description: "Report every deduction on the statement plus the landlord details.", effort: "medium" },
    );

    // Clean up in code: stable ids, real numbers, decidedBy, valid date.
    const result: ClerkResponse = {
      landlordName: raw.landlordName || null,
      landlordEmail: raw.landlordEmail && raw.landlordEmail.includes("@") ? raw.landlordEmail.trim() : null,
      propertyAddress: raw.propertyAddress || null,
      statementDate: raw.statementDate && /^\d{4}-\d{2}-\d{2}$/.test(raw.statementDate) ? raw.statementDate : null,
      lineItems: raw.lineItems.map((li, i) => ({
        ...li,
        id: `li${i + 1}`,
        amount: Math.abs(Number(li.amount) || 0),
        decidedBy: "clerk" as const,
      })),
      otherIssues: raw.otherIssues ?? [],
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("[clerk] failed twice, serving fixture:", err);
    return fallback();
  }
}
