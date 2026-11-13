"use client";

import { useState } from "react";
import { useFileInput } from "@/hooks/useFileInput";
import { loadSampleStatement } from "@/lib/client";
import type { CaseInput } from "@/lib/types";
import DropZone from "./DropZone";

const inputCls =
  "w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-lg text-ink outline-none transition-colors focus:border-accent";

const STEPS = [
  "Upload your landlord's statement.",
  "AI agents check every charge against California law.",
  "Send the demand letter they write for you.",
];

export default function IntakeForm({ onSubmit }: { onSubmit: (input: CaseInput) => void }) {
  const stmt = useFileInput();
  const [tenantName, setName] = useState("");
  const [deposit, setDeposit] = useState("");
  const [moveOut, setMoveOut] = useState("");
  const [months, setMonths] = useState("");
  const [sampleBusy, setSampleBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function useSample() {
    setSampleBusy(true);
    setErr(null);
    try {
      stmt.setFile(await loadSampleStatement(), "sample-statement.jpg");
    } catch {
      setErr("Couldn't load the sample statement.");
    } finally {
      setSampleBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stmt.picked) return setErr("Add your landlord's statement first.");
    setErr(null);
    onSubmit({
      statement: stmt.picked.file,
      depositAmount: Number(deposit),
      moveOutDate: moveOut,
      tenancyMonths: Number(months),
      tenantName: tenantName.trim(),
    });
  }

  return (
    <div className="rise grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <header className="space-y-6 lg:sticky lg:top-12">
        <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
          Get your security deposit back.
        </h1>
        <p className="max-w-md text-xl leading-relaxed text-muted">California renters lose deposits to illegal deductions every move-out.</p>
        <ol className="max-w-md space-y-3 border-l-2 border-accent pl-5">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 text-lg">
              <span className="font-bold text-accent">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </header>

      <form onSubmit={submit} className="space-y-6 rounded-[28px] border-2 border-ink bg-white p-5 sm:p-7">
        <section className="space-y-3">
          <DropZone
            label="Drop your landlord's statement here"
            hint="Photo, screenshot or PDF. Or tap to browse."
            accept="image/*,application/pdf"
            picked={stmt.picked}
            busy={stmt.busy}
            onFile={stmt.pick}
            onClear={stmt.clear}
          />
          {stmt.error && <p className="text-warn">{stmt.error}</p>}
          <button
            type="button"
            onClick={useSample}
            disabled={sampleBusy}
            className="w-full rounded-xl border-2 border-ink px-4 py-3 text-lg font-semibold transition-colors hover:bg-ink hover:text-white disabled:opacity-60"
          >
            {sampleBusy ? "Loading…" : "Use sample statement"}
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-base font-semibold">Your name</span>
            <input required className={inputCls} value={tenantName} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="space-y-1">
            <span className="text-base font-semibold">Deposit you paid ($)</span>
            <input required type="number" min="0" step="any" inputMode="decimal" className={inputCls} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-base font-semibold">Months lived there</span>
            <input required type="number" min="0" inputMode="numeric" className={inputCls} value={months} onChange={(e) => setMonths(e.target.value)} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-base font-semibold">Move-out date</span>
            <input required type="date" className={inputCls} value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
          </label>
        </section>

        {err && <p className="text-warn">{err}</p>}
        <button type="submit" className="w-full rounded-2xl bg-accent px-6 py-5 text-2xl font-bold text-white transition hover:bg-accent-dark active:translate-y-px">
          Start my case
        </button>
      </form>
    </div>
  );
}
