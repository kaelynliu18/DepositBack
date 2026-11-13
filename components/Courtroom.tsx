import type { AgentEvent, LineItem, Verdict } from "@/lib/types";

const LABEL: Record<Verdict, string> = { allowed: "Allowed", questionable: "Questionable", not_allowed: "Not allowed" };
const BANNER: Record<Verdict, string> = {
  allowed: "border-emerald-300 bg-emerald-50 text-emerald-900",
  questionable: "border-amber-300 bg-amber-50 text-amber-900",
  not_allowed: "border-red-300 bg-red-50 text-red-900",
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

// Arguments from the agent come as `On "<charge>": <text>`; the card heading already names the charge.
export default function Courtroom({ events, items }: { events: AgentEvent[]; items: LineItem[] | null }) {
  const cases = deriveCases(events);
  if (cases.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">⚖️ In court</h2>
      {cases.map((c) => {
        const item = items?.find((i) => i.id === c.id);
        return (
          <div key={c.id} className="slide-in space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            {item && <h3 className="text-lg font-semibold text-slate-900">{item.description}</h3>}
            <div className="grid gap-3 sm:grid-cols-2">
              {c.landlord && (
                <div className="slide-in rounded-xl bg-orange-50 p-3">
                  <p className="text-sm font-semibold uppercase tracking-wide text-orange-800">🏢 Landlord&apos;s Advocate</p>
                  <p className="mt-1 text-base leading-relaxed text-slate-800">{c.landlord}</p>
                </div>
              )}
              {c.tenant && (
                <div className="slide-in rounded-xl bg-indigo-50 p-3 sm:col-start-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-indigo-800">🎓 Tenant&apos;s Advocate</p>
                  <p className="mt-1 text-base leading-relaxed text-slate-800">{c.tenant}</p>
                </div>
              )}
            </div>
            {c.ruling && (
              <div className={`slide-in rounded-xl border p-4 ${BANNER[c.ruling.verdict]}`}>
                <p className="text-lg font-bold">⚖️ Judge: {LABEL[c.ruling.verdict]}</p>
                <p className="mt-1 text-base">{c.ruling.reason}</p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
