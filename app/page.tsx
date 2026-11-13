"use client";

import { useRef, useState } from "react";
import ActionKit from "@/components/ActionKit";
import AgentFeed from "@/components/AgentFeed";
import CaseSummary from "@/components/CaseSummary";
import ChargeCard, { ChargeSkeleton, type ChargePhotos } from "@/components/ChargeCard";
import DeadlineBanner from "@/components/DeadlineBanner";
import ErrorCard from "@/components/ErrorCard";
import Courtroom from "@/components/Courtroom";
import Headline from "@/components/Headline";
import IntakeForm from "@/components/IntakeForm";
import PhotoRequest from "@/components/PhotoRequest";
import { useCaseState } from "@/hooks/useCaseState";
import { runCase } from "@/lib/caseManager";
import { totals } from "@/lib/compute";
import type { AgentEvent, CaseInput, CaseResult, FileInput, LineItem, PhotoPair } from "@/lib/types";

type Phase = "intake" | "live" | "result";
interface PendingPhotos { item: LineItem; resolve: (p: PhotoPair | null) => void }

const dataUrl = (f: FileInput) => `data:${f.mediaType};base64,${f.data}`;

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intake");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingPhotos | null>(null);
  const [photos, setPhotos] = useState<Record<string, ChargePhotos>>({});
  const runId = useRef(0);
  const pendingRef = useRef<PendingPhotos | null>(null);
  const { items: liveItems, meta } = useCaseState(events);

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

  // Pauses the case until the user sends photos (or skips).
  function askForPhotos(item: LineItem) {
    return new Promise<PhotoPair | null>((resolve) => {
      const p = { item, resolve };
      pendingRef.current = p;
      setPending(p);
    });
  }

  function answerPhotos(pair: PhotoPair | null) {
    const p = pendingRef.current;
    if (!p) return;
    if (pair) setPhotos((prev) => ({ ...prev, [p.item.id]: { moveIn: dataUrl(pair.moveIn), moveOut: dataUrl(pair.moveOut) } }));
    pendingRef.current = null;
    setPending(null);
    p.resolve(pair);
  }

  async function start(input: CaseInput) {
    const id = ++runId.current;
    setEvents([]);
    setResult(null);
    setError(null);
    setPhotos({});
    setPhase("live");
    try {
      const r = await runCase(input, { onEvent, onNeedPhotos: askForPhotos });
      if (id === runId.current) {
        setResult(r);
        setPhase("result");
      }
    } catch (e) {
      answerPhotos(null);
      if (id === runId.current) setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  function reset() {
    runId.current++;
    answerPhotos(null);
    setPhase("intake");
    setEvents([]);
    setResult(null);
    setError(null);
  }

  const items = result?.items ?? liveItems;
  const { strongClaim, possibleClaim } = result ?? (items ? totals(items) : { strongClaim: 0, possibleClaim: 0 });

  const cards = (
    <div className="space-y-3">
      {items ? items.map((i) => <ChargeCard key={i.id} item={i} meta={meta[i.id]} photos={photos[i.id]} />) : Array.from({ length: 5 }, (_, k) => <ChargeSkeleton key={k} />)}
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {pending && <PhotoRequest key={pending.item.id} item={pending.item} onDone={answerPhotos} />}
      {phase !== "intake" && (
        <button onClick={reset} className="mb-4 text-sm text-slate-500 underline">
          Start over
        </button>
      )}

      {phase === "intake" && <IntakeForm onSubmit={start} />}

      {phase === "live" && error && <ErrorCard message={error} onReset={reset} />}

      {phase === "live" && !error && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <AgentFeed events={events} />
          <div className="space-y-5">
            {items && <CaseSummary items={items} />}
            {items && <Headline strongClaim={strongClaim} possibleClaim={possibleClaim} />}
            <Courtroom events={events} items={items} />
            {cards}
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div className="mx-auto max-w-3xl space-y-6">
          {result.isLate && result.daysToStatement !== null && <DeadlineBanner days={result.daysToStatement} />}
          <CaseSummary items={result.items} landlordName={result.clerk.landlordName} />
          <Headline strongClaim={result.strongClaim} possibleClaim={result.possibleClaim} />
          <Courtroom events={events} items={items} />
          {cards}
          <ActionKit result={result} />
          <details className="rounded-2xl border border-slate-200 p-4">
            <summary className="cursor-pointer text-lg font-medium text-slate-700">See how the agents worked</summary>
            <div className="mt-4">
              <AgentFeed events={events} />
            </div>
          </details>
        </div>
      )}
    </main>
  );
}
