"use client";

import { useState } from "react";
import { useFileInput } from "@/hooks/useFileInput";
import { loadSampleStatement } from "@/lib/client";
import type { CaseInput } from "@/lib/types";
import DropZone from "./DropZone";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20";

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
    <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-8">
      <header className="space-y-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          <span className="text-teal-800">DepositBack</span> — get your security deposit back.
        </h1>
        <p className="text-xl text-slate-600">California renters lose deposits to illegal deductions every move-out.</p>
      </header>

      <section className="space-y-3">
        <DropZone
          label="Drop your landlord's statement here"
          hint="Photo, screenshot or PDF — or tap to browse"
          accept="image/*,application/pdf"
          picked={stmt.picked}
          busy={stmt.busy}
          onFile={stmt.pick}
          onClear={stmt.clear}
        />
        {stmt.error && <p className="text-amber-700">{stmt.error}</p>}
        <button
          type="button"
          onClick={useSample}
          disabled={sampleBusy}
          className="w-full rounded-xl border border-teal-700 px-4 py-3 text-lg font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60"
        >
          {sampleBusy ? "Loading…" : "Use sample statement"}
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-base font-medium text-slate-700">Your name</span>
          <input required className={inputCls} value={tenantName} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="space-y-1">
          <span className="text-base font-medium text-slate-700">Deposit you paid ($)</span>
          <input required type="number" min="0" step="any" inputMode="decimal" className={inputCls} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-base font-medium text-slate-700">Months lived there</span>
          <input required type="number" min="0" inputMode="numeric" className={inputCls} value={months} onChange={(e) => setMonths(e.target.value)} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-base font-medium text-slate-700">Move-out date</span>
          <input required type="date" className={inputCls} value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
        </label>
      </section>

      {err && <p className="text-amber-700">{err}</p>}
      <button type="submit" className="w-full rounded-2xl bg-teal-800 px-6 py-5 text-2xl font-bold text-white shadow-lg transition hover:bg-teal-900 active:scale-[0.99]">
        Start my case
      </button>
    </form>
  );
}
