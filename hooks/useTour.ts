"use client";

import { useCallback, useEffect, useState } from "react";
import type { CaseView } from "@/hooks/useCaseState";
import type { AgentEvent, CaseResult } from "@/lib/types";

export interface Tip {
  id: string;
  title: string;
  body: string;
}

const STORE_KEY = "depositback-tips";

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORE_KEY) !== "off";
  } catch {
    return true;
  }
}

/** One-time coaching tips, each shown once at the moment it becomes relevant. */
export function useTour(p: { live: boolean; events: AgentEvent[]; view: CaseView; result: CaseResult | null; blocked: boolean }) {
  const [enabled, setEnabledState] = useState(readEnabled);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const hasOverride = Object.values(p.view.meta).some((m) => m.override && m.override.from !== m.override.to);

  // First tip whose moment has arrived and that hasn't been shown yet.
  const tips: (Tip & { when: boolean })[] = [
    {
      id: "start",
      when: p.live && p.events.length > 0 && !p.view.items, // stale once charges appear
      title: "Your AI team is on it",
      body: "Nothing to do yet. The top panel shows who is working and what step you're on. I'll tell you if I need anything.",
    },
    {
      id: "charges",
      when: !!p.view.items,
      title: "These are your landlord's charges",
      body: "Green means fair, amber means worth arguing, red means likely illegal. Colors can change as the team rules, and your total updates with them.",
    },
    {
      id: "override",
      when: hasOverride,
      title: "A verdict just changed",
      body: "The Judge or Inspector looked closer and changed a charge. The old verdict is crossed out, and your total moves with it.",
    },
    {
      id: "result",
      when: !!p.result,
      title: "All done. Your turn.",
      body: "Follow the three steps below: read the letter, send it, set the reminder. Then you're finished.",
    },
  ];
  // The final tip jumps the queue so it is never stale; the rest show in order.
  const ready = tips.filter((t) => t.when && !seen.has(t.id));
  const current = enabled && !p.blocked && !seen.has("result") ? (ready.find((t) => t.id === "result") ?? ready[0] ?? null) : null;

  const dismiss = useCallback(() => {
    if (current) setSeen((s) => new Set(s).add(current.id));
  }, [current]);

  // Tips go away on their own so they never pile up.
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setSeen((s) => new Set(s).add(current.id)), 10000);
    return () => clearTimeout(t);
  }, [current]);

  const setEnabled = useCallback((on: boolean) => {
    setEnabledState(on);
    try {
      localStorage.setItem(STORE_KEY, on ? "on" : "off");
    } catch {}
  }, []);

  const reset = useCallback(() => setSeen(new Set()), []);

  return { tip: current ? { id: current.id, title: current.title, body: current.body } : null, dismiss, enabled, setEnabled, reset };
}
