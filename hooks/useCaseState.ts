"use client";

import { useMemo } from "react";
import type { AgentEvent, InspectorResponse, LineItem, Verdict } from "@/lib/types";

export interface ChargeMeta {
  /** Latest Judge/Inspector decision on this charge, if any. */
  override?: { by: "judge" | "inspector"; from: Verdict; to: Verdict; at: number };
  inspector?: InspectorResponse;
  photosSkipped?: boolean;
}

export interface CaseView {
  items: LineItem[] | null;
  meta: Record<string, ChargeMeta>;
}

/** Derives live charge cards from the event stream (no need to wait for the final result). */
export function deriveCase(events: AgentEvent[]): CaseView {
  let items: LineItem[] | null = null;
  const meta: Record<string, ChargeMeta> = {};

  for (const e of events) {
    const p = e.payload;
    if (p?.lineItems && !items) items = p.lineItems.map((i) => ({ ...i }));
    if (!items || !e.lineItemId) continue;
    const id = e.lineItemId;
    const m = (meta[id] ??= {});

    if (p?.inspector) m.inspector = p.inspector;
    if (e.agent === "case_manager" && e.status === "done" && !p) m.photosSkipped = true;

    if (p?.newVerdict && (e.agent === "judge" || e.agent === "inspector") && e.status === "done") {
      const item = items.find((i) => i.id === id);
      if (!item) continue;
      const from = p.previousVerdict ?? item.verdict;
      item.verdict = p.newVerdict;
      item.decidedBy = e.agent;
      m.override = { by: e.agent, from, to: p.newVerdict, at: e.at };
    }
  }
  return { items, meta };
}

export function useCaseState(events: AgentEvent[]): CaseView {
  return useMemo(() => deriveCase(events), [events]);
}
