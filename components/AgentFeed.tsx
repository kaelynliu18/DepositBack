"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "@/lib/types";
import { AGENTS } from "./agents";

function Dots() {
  return (
    <span className="ml-1 inline-flex gap-1 align-middle" aria-label="working">
      {[0, 1, 2].map((i) => (
        <span key={i} className="dot h-1.5 w-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}

function FeedRow({ e }: { e: AgentEvent }) {
  const a = AGENTS[e.agent];
  const working = e.status === "working";
  const error = e.status === "error";
  return (
    <li className="slide-in relative flex gap-3 pb-5 last:pb-1">
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white text-xl ${
          working ? "pulse-ring border-accent" : error ? "border-warn" : "border-line"
        }`}
      >
        {a.emoji}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="flex items-center gap-2 text-base font-semibold text-ink">
          {a.label}
          {e.status === "done" && <span className="text-ok" aria-label="done">✓</span>}
          {error && <span className="text-warn" aria-label="problem">!</span>}
        </p>
        <p className={`text-base leading-snug ${error ? "text-warn" : "text-muted"}`}>
          {e.message}
          {working && <Dots />}
        </p>
      </div>
    </li>
  );
}

/** Vertical timeline of agent events. Auto-scrolls to the newest row. */
export default function AgentFeed({ events }: { events: AgentEvent[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [events]);

  return (
    <div ref={scroller} className="max-h-[40vh] overflow-y-auto pr-1 sm:max-h-[55vh] lg:max-h-[calc(100vh-14rem)]">
      <ul className="relative">
        <span className="absolute bottom-3 left-5 top-3 w-px -translate-x-1/2 bg-line" aria-hidden />
        {events.map((e) => (
          <FeedRow key={e.id} e={e} />
        ))}
      </ul>
    </div>
  );
}
