"use client";

import { useRef, useState } from "react";
import AgentFeed from "@/components/AgentFeed";
import IntakeForm from "@/components/IntakeForm";
import { runCase } from "@/lib/caseManager";
import type { AgentEvent, CaseInput, CaseResult } from "@/lib/types";

type Phase = "intake" | "live" | "result";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intake");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);

  // Same id replaces the earlier event (working -> done).
  function onEvent(e: AgentEvent) {
    setEvents((prev) => {
      const i = prev.findIndex((p) => p.id === e.id);
      if (i === -1) return [...prev, e];
      const next = prev.slice();
      next[i] = e;
      return next;
    });
  }

  async function start(input: CaseInput) {
    const id = ++runId.current;
    setEvents([]);
    setResult(null);
    setError(null);
    setPhase("live");
    try {
      const r = await runCase(input, { onEvent, onNeedPhotos: async () => null });
      if (id === runId.current) {
        setResult(r);
        setPhase("result");
      }
    } catch (e) {
      if (id === runId.current) setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  function reset() {
    runId.current++;
    setPhase("intake");
    setEvents([]);
    setResult(null);
    setError(null);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {phase !== "intake" && (
        <button onClick={reset} className="mb-4 text-sm text-slate-500 underline">
          Start over
        </button>
      )}
      {phase === "intake" ? (
        <IntakeForm onSubmit={start} />
      ) : (
        <div className="max-w-2xl">
          <AgentFeed events={events} />
          {error && <p className="mt-4 text-amber-700">{error}</p>}
        </div>
      )}
    </main>
  );
}
