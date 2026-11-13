import { formatMoney } from "@/lib/compute";
import type { LineItem, Verdict } from "@/lib/types";
import type { ChargeMeta } from "@/hooks/useCaseState";
import { AGENTS } from "./agents";

const VERDICT: Record<Verdict, { label: string; rail: string; pill: string; dot: string }> = {
  allowed: { label: "Allowed", rail: "border-l-ok", pill: "bg-ok-soft text-ok", dot: "bg-ok" },
  questionable: { label: "Questionable", rail: "border-l-warn", pill: "bg-warn-soft text-warn", dot: "bg-warn" },
  not_allowed: { label: "Not allowed", rail: "border-l-bad", pill: "bg-bad-soft text-bad", dot: "bg-bad" },
};

export function ChargeSkeleton() {
  return <div className="h-32 animate-pulse rounded-2xl border border-line border-l-8 border-l-line bg-paper" aria-hidden />;
}

export interface ChargePhotos { moveIn: string; moveOut: string }

export default function ChargeCard({ item, meta, photos }: { item: LineItem; meta?: ChargeMeta; photos?: ChargePhotos }) {
  const v = VERDICT[item.verdict];
  const o = meta?.override;
  const changed = o && o.from !== o.to;
  const decider = AGENTS[item.decidedBy];
  const byLabel = o?.by === "judge" ? "Judge" : "Inspector";

  return (
    <article className={`relative h-full rounded-2xl border border-line border-l-8 bg-white p-4 transition-colors duration-[600ms] sm:p-5 ${v.rail}`}>
      {changed && <span key={o.at} className="glow pointer-events-none absolute inset-0 rounded-2xl" aria-hidden />}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-xl font-semibold leading-snug">{item.description}</h3>
        <p className="shrink-0 text-2xl font-bold tabular-nums">{formatMoney(item.amount)}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-base font-semibold transition-colors duration-[600ms] ${v.pill}`}>
          <span className={`h-2 w-2 rounded-full transition-colors duration-[600ms] ${v.dot}`} />
          {v.label}
        </span>
        {changed && <span className="text-sm text-muted line-through">was: {VERDICT[o.from].label}</span>}
        {o && !changed && <span className="rounded-full bg-paper px-2.5 py-1 text-sm font-medium text-ink">✓ confirmed by {byLabel}</span>}
      </div>

      <p className="mt-3 text-base leading-relaxed text-muted">{item.reason}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm text-muted">
        <span className="max-w-full break-words">{item.rule}</span>
        <span className="font-medium text-ink">
          {decider.emoji} {decider.label}
        </span>
      </div>

      {(meta?.inspector || photos) && (
        <div className="mt-3 space-y-2 rounded-xl bg-paper p-3">
          {photos && (
            <div className="grid grid-cols-2 gap-2">
              {([["Move-in", photos.moveIn], ["Move-out", photos.moveOut]] as const).map(([label, src]) => (
                <figure key={label} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${label} photo`} className="aspect-[4/3] w-full rounded-lg object-cover" />
                  <figcaption className="text-sm font-medium">{label}</figcaption>
                </figure>
              ))}
            </div>
          )}
          {meta?.inspector?.changeObserved && <p className="text-base">🔍 {meta.inspector.changeObserved}</p>}
        </div>
      )}
      {meta?.photosSkipped && <p className="mt-2 text-sm text-muted">photos skipped</p>}
    </article>
  );
}
