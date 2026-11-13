"use client";

import { useEffect, useState } from "react";
import { useFileInput } from "@/hooks/useFileInput";
import { extractDetails } from "@/lib/client";
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

/** Field label with a required asterisk; shows a flag when autofill couldn't fill the field. */
function FieldLabel({ text, flagged, note }: { text: string; flagged: boolean; note?: string }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 text-base font-bold">
      <span>
        {text} <span className="text-bad">*</span>
      </span>
      {flagged && <span className="text-sm font-bold text-warn">⚠ {note ?? "Please add"}</span>}
    </span>
  );
}

export default function IntakeForm({ onSubmit }: { onSubmit: (input: CaseInput) => void }) {
  const stmt = useFileInput();
  const [tenantName, setName] = useState("");
  const [deposit, setDeposit] = useState("");
  const [moveOut, setMoveOut] = useState("");
  const [months, setMonths] = useState("");
  const [err, setErr] = useState<string | null>(null);
  // Autofill: when a statement is dropped, read name / deposit / move-out date off it.
  // Only fills fields that are still empty, so it never overwrites what the user typed.
  const [fill, setFill] = useState<{ forData: string; ok: boolean } | null>(null);
  const pickedData = stmt.picked?.file.data;
  useEffect(() => {
    if (!stmt.picked || !pickedData) return;
    let stale = false;
    extractDetails(stmt.picked.file).then((d) => {
      if (stale) return;
      if (d.tenantName) setName((v) => v || d.tenantName!);
      if (d.depositAmount) setDeposit((v) => v || String(d.depositAmount));
      if (d.moveOutDate) setMoveOut((v) => v || d.moveOutDate!);
      setFill({ forData: pickedData, ok: !!(d.tenantName || d.depositAmount || d.moveOutDate) });
    });
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedData]);
  const autofill = !pickedData ? "idle" : fill?.forData !== pickedData ? "reading" : fill.ok ? "done" : "none";

  // After autofill runs, any field still empty gets flagged so the user knows to fill it in.
  const flag = (v: string) => (autofill === "done" || autofill === "none") && !v.trim();
  const flaggedCount = [tenantName, deposit, months, moveOut].filter(flag).length;
  const anyFlagged = flaggedCount > 0;
  const fieldCls = (v: string) => (flag(v) ? `${inputCls} !border-warn !bg-warn-soft` : inputCls);

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
            label="Drop your landlord's statement here *"
            hint="Photo, screenshot or PDF. Or tap to browse."
            accept="image/*,application/pdf"
            picked={stmt.picked}
            busy={stmt.busy}
            onFile={stmt.pick}
            onClear={stmt.clear}
          />
          {stmt.error && <p className="font-medium text-warn">{stmt.error}</p>}
          {autofill === "reading" && <p className="text-base font-medium text-muted">Autofilling based on your statement…</p>}
          {autofill === "done" && (
            <p className="text-base font-bold">
              ✓ Filled in from your statement.{" "}
              {anyFlagged ? <span className="text-warn">Add the highlighted field{flaggedCount > 1 ? "s" : ""} below.</span> : "Check it's right."}
            </p>
          )}
          {autofill === "none" && <p className="text-base font-bold text-warn">Couldn&apos;t read your details. Please fill in the highlighted fields.</p>}
        </section>

        <p className="text-sm font-medium text-muted">
          <span className="text-bad">*</span> Required
        </p>
        <section className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <FieldLabel text="Your name" flagged={flag(tenantName)} />
            <input required className={fieldCls(tenantName)} value={tenantName} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="space-y-1">
            <FieldLabel text="Deposit you paid ($)" flagged={flag(deposit)} />
            <input required type="number" min="0" step="any" inputMode="decimal" className={fieldCls(deposit)} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          </label>
          <label className="space-y-1">
            <FieldLabel text="Months lived there" flagged={flag(months)} note="Not on statements" />
            <input required type="number" min="1" inputMode="numeric" className={fieldCls(months)} value={months} onChange={(e) => setMonths(e.target.value)} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <FieldLabel text="Move-out date" flagged={flag(moveOut)} />
            <input required type="date" className={fieldCls(moveOut)} value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
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
