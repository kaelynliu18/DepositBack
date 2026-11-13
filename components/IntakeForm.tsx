"use client";

import { useState } from "react";
import { useFileInput } from "@/hooks/useFileInput";
import type { CaseInput } from "@/lib/types";
import Bubble from "./Bubble";
import DropZone from "./DropZone";
import Mascot from "./Mascot";

const inputCls =
  "w-full rounded-xl border-[2.5px] border-ink bg-white px-4 py-3 text-lg font-medium outline-none transition-shadow focus:shadow-[3px_3px_0_var(--color-accent)]";

const STEPS = [
  { agent: "clerk" as const, title: "Upload", body: "Add the statement your landlord sent you." },
  { agent: "judge" as const, title: "Watch", body: "A team of AI agents checks every charge against California law." },
  { agent: "paralegal" as const, title: "Send", body: "Get a ready-to-send letter, email and reminder." },
];

export default function IntakeForm({ onSubmit }: { onSubmit: (input: CaseInput) => void }) {
  const stmt = useFileInput();
  const [tenantName, setName] = useState("");
  const [deposit, setDeposit] = useState("");
  const [moveOut, setMoveOut] = useState("");
  const [months, setMonths] = useState("");
  const [err, setErr] = useState<string | null>(null);

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
    <div className="rise grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      <header className="space-y-7 lg:sticky lg:top-8">
        <h1 className="display text-6xl sm:text-7xl">
          Get your <span className="marker">security deposit back.</span>
        </h1>
        <p className="max-w-md text-xl font-medium leading-relaxed text-muted">California renters lose deposits to illegal deductions every move-out.</p>

        <div className="dotgrid pop space-y-3 p-4">
          <div className="flex items-end gap-2">
            <Mascot agent="clerk" mood="done" size={56} className="shrink-0" />
            <Bubble className="flex-1">
              <p className="text-base font-bold">Found 5 charges. Two look illegal.</p>
            </Bubble>
          </div>
          <div className="flex items-end gap-2 sm:pl-10">
            <Mascot agent="judge" mood="done" size={56} className="shrink-0" />
            <Bubble tone="sun" className="flex-1">
              <p className="text-base font-bold">Repainting between tenants is routine upkeep. Not allowed.</p>
            </Bubble>
          </div>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="pop-sm flex gap-3 p-3 sm:flex-col">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-sun text-sm font-black">{i + 1}</span>
                <span className="text-lg font-black">{s.title}</span>
              </div>
              <p className="text-base leading-snug text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </header>

      <form onSubmit={submit} className="pop space-y-6 p-5 sm:p-7">
        <h2 className="display text-3xl">Start your case</h2>
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
          {stmt.error && <p className="font-medium text-warn">{stmt.error}</p>}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-base font-bold">Your name</span>
            <input required className={inputCls} value={tenantName} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="space-y-1">
            <span className="text-base font-bold">Deposit you paid ($)</span>
            <input required type="number" min="0" step="any" inputMode="decimal" className={inputCls} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-base font-bold">Months lived there</span>
            <input required type="number" min="0" inputMode="numeric" className={inputCls} value={months} onChange={(e) => setMonths(e.target.value)} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-base font-bold">Move-out date</span>
            <input required type="date" className={inputCls} value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
          </label>
        </section>

        {err && <p className="font-medium text-warn">{err}</p>}
        <button type="submit" className="btn-pop w-full bg-accent px-6 py-5 text-2xl font-black">
          Start my case
        </button>
      </form>
    </div>
  );
}
