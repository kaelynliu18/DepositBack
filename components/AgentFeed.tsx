"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "@/lib/types";
import { AGENTS } from "./agents";
import Bubble from "./Bubble";
import Mascot from "./Mascot";

function Dots() {
  return (
    <span className="ml-1 inline-flex gap-1 align-middle" aria-label="working">
      {[0, 1, 2].map((i) => (
        <span key={i} className="dot h-2 w-2 rounded-full bg-ink" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}

function FeedRow({ e }: { e: AgentEvent }) {
  const a = AGENTS[e.agent];
  const mood = e.status === "working" ? "working" : e.status === "error" ? "error" : "done";
  return (
    <li className="flex items-start gap-3">
      <Mascot agent={e.agent} mood={mood} size={48} className="mt-1 shrink-0" />
      <Bubble tone={e.status === "error" ? "warn" : "white"} className="min-w-0 flex-1">
        <p className="font-mono text-xs font-semibold text-muted">
          {a.label}
          {e.status === "done" && <span className="ml-2 text-ok">✓ done</span>}
          {e.status === "error" && <span className="ml-2 text-warn">! problem</span>}
        </p>
        <p className="mt-0.5 text-base font-medium leading-snug">
          {e.message}
          {e.status === "working" && <Dots />}
        </p>
      </Bubble>
    </li>
  );
}

/** The agents' conversation, newest at the bottom. Auto-scrolls. */
export default function AgentFeed({ events }: { events: AgentEvent[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [events]);

  return (
    <div ref={scroller} className="max-h-[40vh] overflow-y-auto py-1 pl-1 pr-2 sm:max-h-[55vh] lg:max-h-[calc(100vh-15rem)]">
      <ul className="space-y-4">
        {events.map((e) => (
          <FeedRow key={e.id} e={e} />
        ))}
      </ul>
    </div>
  );
}
