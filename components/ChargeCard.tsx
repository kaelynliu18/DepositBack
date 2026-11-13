import { formatMoney, lawLabel, stripRuleLabels } from "@/lib/compute";
import type { LineItem, Verdict } from "@/lib/types";
import type { ChargeMeta } from "@/hooks/useCaseState";
import { AGENTS } from "./agents";
import Mascot from "./Mascot";

const VERDICT: Record<Verdict, { label: string; bar: string; pill: string }> = {
  allowed: { label: "Allowed", bar: "bg-ok", pill: "bg-ok-soft text-ok" },
  questionable: { label: "Questionable", bar: "bg-[#e59b00]", pill: "bg-warn-soft text-warn" },
  not_allowed: { label: "Not allowed", bar: "bg-bad", pill: "bg-bad-soft text-bad" },
};

export function ChargeSkeleton() {
  return <div className="pop-sm h-36 animate-pulse bg-white/60" aria-hidden />;
}

export interface ChargePhotos { moveIn: string; moveOut: string }

export default function ChargeCard({ item, meta, photos }: { item: LineItem; meta?: ChargeMeta; photos?: ChargePhotos }) {
  const v = VERDICT[item.verdict];
  const o = meta?.override;
  const changed = o && o.from !== o.to;
  const decider = AGENTS[item.decidedBy];
  const byLabel = o?.by === "judge" ? "Judge" : "Inspector";

  return (
    <article className="pop relative flex h-full overflow-hidden">
      {changed && <span key={o.at} className="glow pointer-events-none absolute inset-0 z-10 rounded-[17px]" aria-hidden />}
      <div className={`w-3 shrink-0 border-r-[2.5px] border-ink transition-colors duration-[600ms] ${v.bar}`} />
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-xl font-extrabold leading-snug tracking-tight">{item.description}</h3>
          <p className="shrink-0 text-2xl font-black tabular-nums tracking-tight">{formatMoney(item.amount)}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border-2 border-ink px-3 py-0.5 text-base font-bold transition-colors duration-[600ms] ${v.pill}`}>{v.label}</span>
          {changed && <span className="text-sm font-medium text-muted line-through">was: {VERDICT[o.from].label}</span>}
          {o && !changed && <span className="rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-sm font-bold">✓ confirmed by {byLabel}</span>}
        </div>

        <p className="mt-3 text-base leading-relaxed text-muted">{stripRuleLabels(item.reason)}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-soft pt-3 text-sm">
          <span className="max-w-full break-words font-mono text-xs text-muted">{lawLabel(item.rule)}</span>
          <span className="flex items-center gap-1.5 font-bold">
            <Mascot agent={item.decidedBy} size={26} />
            {decider.label}
          </span>
        </div>

        {(meta?.inspector || photos) && (
          <div className="mt-3 space-y-2 rounded-xl border-2 border-ink bg-paper p-3">
            {photos && (
              <div className="grid grid-cols-2 gap-2">
                {([["Move-in", photos.moveIn], ["Move-out", photos.moveOut]] as const).map(([label, src]) => (
                  <figure key={label} className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${label} photo`} className="aspect-[4/3] w-full rounded-lg border-2 border-ink object-cover" />
                    <figcaption className="text-sm font-bold">{label}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            {meta?.inspector?.changeObserved && <p className="text-base font-medium">🔍 {meta.inspector.changeObserved}</p>}
          </div>
        )}
        {meta?.photosSkipped && <p className="mt-2 text-sm text-muted">photos skipped</p>}
      </div>
    </article>
  );
}
