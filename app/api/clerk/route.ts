// Clerk: reads the statement, extracts every charge, gives a verdict + route for each.
// ?demo=1 returns the fixture. If Claude fails twice, the fixture is returned ONLY when the
// upload is the sample statement; any other upload gets a 502 so the UI shows "try again".
import { NextResponse } from "next/server";
import fixture from "@/public/demo/clerk.json";
import { callTool, fileBlock, type ObjectSchema } from "@/lib/claude";
import { CLERK_PROMPT } from "@/lib/prompts";
import { isSampleFile } from "@/lib/demoFallback";
import type { ClerkRequest } from "@/lib/client";
import type { ClerkResponse, LineItem } from "@/lib/types";

export const maxDuration = 60;

const VERDICTS = ["allowed", "questionable", "not_allowed"];
const nullableString = { type: ["string", "null"] };

const SCHEMA: ObjectSchema = {
  type: "object",
  properties: {
    unreadable: { type: "boolean", description: "true if the text or amounts can't be read clearly" },
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
  required: ["unreadable", "landlordName", "landlordEmail", "propertyAddress", "statementDate", "lineItems", "otherIssues"],
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
    const raw = await callTool<Omit<ClerkResponse, "lineItems"> & { unreadable: boolean; lineItems: Omit<LineItem, "decidedBy">[] }>(
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

    // Unreadable upload: tell the user right away (no retry, no fixture).
    if (raw.unreadable || raw.lineItems.length === 0) {
      console.warn("[clerk] statement unreadable or no charges found");
      return NextResponse.json({ error: "unreadable" }, { status: 422 });
    }

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
    if (isSampleFile(body.statement.data, "statement.jpg")) {
      console.error("[clerk] failed twice on the sample, serving fixture:", err);
      return fallback();
    }
    console.error("[clerk] failed twice:", err);
    return NextResponse.json({ error: "Couldn't read the statement. Please try again." }, { status: 502 });
  }
}
