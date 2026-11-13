"use client";

import { useCallback, useEffect, useState } from "react";
import type { CaseView } from "@/hooks/useCaseState";
import type { AgentEvent, CaseResult } from "@/lib/types";

export interface Tip {
  id: string;
  title: string;
  body: string;
  /** The page section this tip points at: it gets a ring and the tip pops up beside it. */
  section?: string;
  /** True for tips triggered by what the reader is scrolled to (they outrank the timeline tips). */
  scroll?: boolean;
}

const STORE_KEY = "depositback-tips";

/** What each part of the page is, in plain words. Shown when the reader pauses on it. */
const SECTION_TIPS: Tip[] = [
  { id: "feed", title: "The team's chat", body: "Each bubble is one agent reporting what it found. The newest message is at the bottom." },
  { id: "claim", title: "Your total", body: "This is what you can most likely get back. The number in brackets also counts the questionable charges, if they go your way." },
  { id: "court", title: "The courtroom", body: "For the biggest disputed charges, one advocate argues for the landlord and one for you. Then the Judge rules, which can change a verdict." },
  { id: "charges", title: "Your charge cards", body: "One card per line on the statement. The colored edge is the verdict, and the name at the bottom is who decided it. On a phone, swipe sideways." },
  { id: "letter", title: "Step 1: your letter", body: "Written from the final verdicts, citing the charges you're disputing. You can edit anything, and your edits carry into the email." },
  { id: "send", title: "Step 2: send it", body: "Opens a Gmail draft addressed to your landlord. Nothing is sent until you press send in Gmail." },
  { id: "remind", title: "Step 3: the reminder", body: "Adds the deadline to Google Calendar so you remember to follow up if your landlord goes quiet." },
  { id: "smallclaims", title: "If they ignore you", body: "Your backup plan: small claims court. This shows the details you'd put on California form SC-100." },
];

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORE_KEY) !== "off";
  } catch {
    return true;
  }
}

/** One-time coaching tips, each shown once at the moment it becomes relevant. */
export function useTour(p: { live: boolean; events: AgentEvent[]; view: CaseView; result: CaseResult | null; blocked: boolean; focus: string | null }) {
  const [enabled, setEnabledState] = useState(readEnabled);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const hasOverride = Object.values(p.view.meta).some((m) => m.override && m.override.from !== m.override.to);

  // First tip whose moment has arrived and that hasn't been shown yet.
  const sectionTips: (Tip & { when: boolean })[] = SECTION_TIPS.map((t) => ({ ...t, section: t.id, scroll: true, when: p.focus === t.id }));
  const tips: (Tip & { when: boolean })[] = [
    {
      id: "start",
      section: "now",
      when: p.live && p.events.length > 0 && !p.view.items, // stale once charges appear
      title: "Your AI team is on it",
      body: "Nothing to do yet. The top panel shows who is working and what step you're on. I'll tell you if I need anything.",
    },
    {
      id: "charges-intro",
      section: "charges",
      when: !!p.view.items,
      title: "These are your landlord's charges",
      body: "Green means fair, amber means worth arguing, red means likely illegal. Colors can change as the team rules, and your total updates with them.",
    },
    {
      id: "override",
      section: "charges",
      when: hasOverride,
      title: "A verdict just changed",
      body: "The Judge or Inspector looked closer and changed a charge. The old verdict is crossed out, and your total moves with it.",
    },
    {
      id: "result",
      section: "claim",
      when: !!p.result,
      title: "All done. Your turn.",
      body: "Follow the three steps below: read the letter, send it, set the reminder. Then you're finished.",
    },
    ...sectionTips,
  ];
  // The final tip jumps the queue so it is never stale; the rest show in order.
  const ready = tips.filter((t) => t.when && !seen.has(t.id));
  // Order: the final tip, then whatever section the reader is looking at, then the timeline tips.
  const pick = ready.find((t) => t.id === "result") ?? ready.find((t) => t.scroll) ?? ready[0] ?? null;
  const current = enabled && !p.blocked && !(seen.has("result") && !pick?.scroll) ? pick : null;

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
    if (on) setSeen(new Set()); // turning tips back on replays them
    try {
      localStorage.setItem(STORE_KEY, on ? "on" : "off");
    } catch {}
  }, []);

  const reset = useCallback(() => setSeen(new Set()), []);

  return { tip: current ? { id: current.id, title: current.title, body: current.body, section: current.section } : null, dismiss, enabled, setEnabled, reset };
}
