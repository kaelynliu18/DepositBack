import { formatMoney } from "@/lib/compute";
import type { LineItem, Verdict } from "@/lib/types";
import type { ChargeMeta } from "@/hooks/useCaseState";
import { AGENTS } from "./agents";

const VERDICT: Record<Verdict, { label: string; border: string; pill: string }> = {
  allowed: { label: "Allowed", border: "border-l-emerald-500", pill: "bg-emerald-100 text-emerald-800" },
  questionable: { label: "Questionable", border: "border-l-amber-500", pill: "bg-amber-100 text-amber-800" },
  not_allowed: { label: "Not allowed", border: "border-l-red-500", pill: "bg-red-100 text-red-800" },
};

export function ChargeSkeleton() {
  return (
    <div className="h-28 animate-pulse rounded-2xl border border-slate-200 border-l-8 border-l-slate-200 bg-slate-100" aria-hidden />
  );
}

export interface ChargePhotos { moveIn: string; moveOut: string }

export default function ChargeCard({ item, meta, photos }: { item: LineItem; meta?: ChargeMeta; photos?: ChargePhotos }) {
  const v = VERDICT[item.verdict];
  const o = meta?.override;
  const changed = o && o.from !== o.to;
  const decider = AGENTS[item.decidedBy === "clerk" ? "clerk" : item.decidedBy];
  const byLabel = o?.by === "judge" ? "Judge" : "Inspector";

  return (
    <article
      className={`relative rounded-2xl border border-slate-200 border-l-8 bg-white p-4 shadow-sm transition-colors duration-[600ms] sm:p-5 ${v.border}`}
    >
      {changed && <span key={o.at} className="glow pointer-events-none absolute inset-0 rounded-2xl" aria-hidden />}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-xl font-semibold leading-snug text-slate-900">{item.description}</h3>
        <p className="shrink-0 text-2xl font-bold text-slate-900">{formatMoney(item.amount)}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-[600ms] ${v.pill}`}>{v.label}</span>
        {changed && <span className="text-sm text-slate-500 line-through">was: {VERDICT[o.from].label}</span>}
        {o && !changed && (
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-sm text-teal-800">✓ confirmed by {byLabel}</span>
        )}
      </div>

      <p className="mt-3 text-base leading-relaxed text-slate-700">{item.reason}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{item.rule}</span>
        <span>
          decided by {decider.emoji} {decider.label}
        </span>
      </div>

      {(meta?.inspector || photos) && (
        <div className="mt-3 space-y-2 rounded-xl bg-cyan-50 p-3">
          {photos && (
            <div className="grid grid-cols-2 gap-2">
              {([["Move-in", photos.moveIn], ["Move-out", photos.moveOut]] as const).map(([label, src]) => (
                <figure key={label} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${label} photo`} className="aspect-[4/3] w-full rounded-lg object-cover" />
                  <figcaption className="text-xs font-medium text-cyan-900">{label}</figcaption>
                </figure>
              ))}
            </div>
          )}
          {meta?.inspector?.changeObserved && <p className="text-sm text-cyan-900">🔍 {meta.inspector.changeObserved}</p>}
        </div>
      )}
      {meta?.photosSkipped && <p className="mt-2 text-xs text-slate-400">photos skipped</p>}
    </article>
  );
}
