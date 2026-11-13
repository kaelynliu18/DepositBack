"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "@/lib/types";
import { AGENTS } from "./agents";

function Dots() {
  return (
    <span className="ml-1 inline-flex gap-1 align-middle" aria-label="working">
      {[0, 1, 2].map((i) => (
        <span key={i} className="dot h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}

function FeedCard({ e }: { e: AgentEvent }) {
  const a = AGENTS[e.agent];
  const working = e.status === "working";
  const error = e.status === "error";
  return (
    <li
      className={`slide-in flex gap-3 rounded-2xl border p-4 shadow-sm ${
        error ? "border-amber-300 bg-amber-50" : `${a.ring} ${a.bg}`
      } ${working ? "pulse-soft" : ""}`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm">{a.emoji}</div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold uppercase tracking-wide ${error ? "text-amber-800" : a.text}`}>{a.label}</p>
        <p className={`text-lg leading-snug ${error ? "text-amber-900" : "text-slate-800"}`}>
          {e.message}
          {working && <Dots />}
        </p>
      </div>
      {e.status === "done" && <span className="text-xl text-teal-700" aria-label="done">✓</span>}
      {error && <span className="text-xl text-amber-600" aria-label="problem">!</span>}
    </li>
  );
}

/** Vertical timeline of agent events. Auto-scrolls to the newest card. */
export default function AgentFeed({ events }: { events: AgentEvent[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [events]);

  return (
    <div ref={scroller} className="max-h-[45vh] overflow-y-auto pr-1 sm:max-h-[60vh] lg:max-h-[calc(100vh-10rem)]">
      <ul className="space-y-3 pb-2">
        {events.map((e) => (
          <FeedCard key={e.id} e={e} />
        ))}
      </ul>
    </div>
  );
}
