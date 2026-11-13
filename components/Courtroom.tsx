import type { AgentEvent, LineItem, Verdict } from "@/lib/types";

const LABEL: Record<Verdict, string> = { allowed: "Allowed", questionable: "Questionable", not_allowed: "Not allowed" };
const BANNER: Record<Verdict, string> = {
  allowed: "bg-ok-soft text-ok",
  questionable: "bg-warn-soft text-warn",
  not_allowed: "bg-bad-soft text-bad",
};

interface Case {
  id: string;
  landlord?: string;
  tenant?: string;
  ruling?: NonNullable<AgentEvent["payload"]>["ruling"];
}

/** Builds one entry per contested charge from events, in arrival order. */
function deriveCases(events: AgentEvent[]): Case[] {
  const byId = new Map<string, Case>();
  for (const e of events) {
    const p = e.payload;
    if (!e.lineItemId || !p || (!p.landlordArgument && !p.tenantArgument && !p.ruling)) continue;
    const c = byId.get(e.lineItemId) ?? { id: e.lineItemId };
    if (p.landlordArgument) c.landlord = p.landlordArgument;
    if (p.tenantArgument) c.tenant = p.tenantArgument;
    if (p.ruling) c.ruling = p.ruling;
    byId.set(e.lineItemId, c);
  }
  return [...byId.values()];
}

export default function Courtroom({ events, items }: { events: AgentEvent[]; items: LineItem[] | null }) {
  const cases = deriveCases(events);
  if (cases.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-3xl font-bold">⚖️ In court</h2>
      {cases.map((c) => {
        const item = items?.find((i) => i.id === c.id);
        return (
          <div key={c.id} className="rise space-y-3 rounded-2xl border border-line bg-white p-4 sm:p-5">
            {item && <h3 className="text-xl font-semibold">{item.description}</h3>}
            <div className="grid gap-3 sm:grid-cols-2">
              {c.landlord && (
                <blockquote className="slide-in border-l-4 border-ink/30 pl-3">
                  <p className="text-sm font-semibold text-muted">🏢 Landlord&apos;s Advocate</p>
                  <p className="mt-1 text-base leading-relaxed">{c.landlord}</p>
                </blockquote>
              )}
              {c.tenant && (
                <blockquote className="slide-in border-l-4 border-accent pl-3 sm:col-start-2">
                  <p className="text-sm font-semibold text-accent">🎓 Tenant&apos;s Advocate</p>
                  <p className="mt-1 text-base leading-relaxed">{c.tenant}</p>
                </blockquote>
              )}
            </div>
            {c.ruling && (
              <div className={`rise rounded-xl p-4 ${BANNER[c.ruling.verdict]}`}>
                <p className="text-lg font-bold">⚖️ Judge: {LABEL[c.ruling.verdict]}</p>
                <p className="mt-1 text-base text-ink">{c.ruling.reason}</p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
