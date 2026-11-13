// Inspector: compares a move-in photo with a move-out photo of the same spot.
// ?demo=1 returns the fixture. If Claude fails twice, the fixture is returned ONLY for the
// sample photos; otherwise 502 (the case keeps the Clerk's verdict for that charge).
import { NextResponse } from "next/server";
import fixture from "@/public/demo/inspector.json";
import { callTool, fileBlock, type ObjectSchema } from "@/lib/claude";
import { INSPECTOR_PROMPT } from "@/lib/prompts";
import { isSampleFile } from "@/lib/demoFallback";
import type { InspectorRequest } from "@/lib/client";
import type { InspectorResponse } from "@/lib/types";

export const maxDuration = 60;

const SCHEMA: ObjectSchema = {
  type: "object",
  properties: {
    sameLocation: { type: "boolean" },
    changeObserved: { type: "string" },
    classification: { type: "string", enum: ["normal_wear", "damage", "unclear"] },
    verdict: { type: "string", enum: ["allowed", "questionable", "not_allowed"] },
    reason: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["sameLocation", "changeObserved", "classification", "verdict", "reason", "confidence"],
  additionalProperties: false,
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as InspectorRequest | null;
  const lineItemId = body?.lineItem?.id ?? fixture.lineItemId;
  const fallback = () =>
    NextResponse.json({ ...fixture, lineItemId }, { headers: { "x-demo-fallback": "1" } });

  if (new URL(req.url).searchParams.get("demo") === "1") return fallback();
  if (!body?.moveIn?.data || !body?.moveOut?.data || body.moveIn.mediaType === "application/pdf" || body.moveOut.mediaType === "application/pdf") {
    return NextResponse.json({ error: "Send { lineItem, tenancyMonths, moveIn, moveOut } with two images" }, { status: 400 });
  }

  try {
    const r = await callTool<Omit<InspectorResponse, "lineItemId">>(
      INSPECTOR_PROMPT,
      [
        {
          type: "text",
          text: `Charge: "${body.lineItem.description}" for $${body.lineItem.amount}. Tenancy length: ${body.tenancyMonths} months.`,
        },
        { type: "text", text: "MOVE-IN photo:" },
        fileBlock(body.moveIn),
        { type: "text", text: "MOVE-OUT photo:" },
        fileBlock(body.moveOut),
      ],
      "report_photo_verdict",
      SCHEMA,
      { description: "Report what changed between the two photos and your verdict.", effort: "medium" },
    );

    // Enforce the rules in code so verdicts stay consistent run to run.
    const classification = r.sameLocation ? r.classification : "unclear";
    const verdict =
      classification === "normal_wear" ? "not_allowed" : classification === "unclear" ? "questionable" : r.verdict === "not_allowed" ? "questionable" : r.verdict;
    const result: InspectorResponse = { ...r, lineItemId, classification, verdict };
    return NextResponse.json(result);
  } catch (err) {
    if (isSampleFile(body.moveIn.data, "wall-movein.jpg") && isSampleFile(body.moveOut.data, "wall-moveout.jpg")) {
      console.error("[inspector] failed twice on the sample photos, serving fixture:", err);
      return fallback();
    }
    console.error("[inspector] failed twice:", err);
    return NextResponse.json({ error: "Couldn't compare the photos." }, { status: 502 });
  }
}
