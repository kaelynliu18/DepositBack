import { stripRuleLabels } from "@/lib/compute";
import type { AgentEvent, LineItem, Verdict } from "@/lib/types";
import Bubble from "./Bubble";
import Mascot from "./Mascot";
import TipTarget from "./TipTarget";

const LABEL: Record<Verdict, string> = { allowed: "Allowed", questionable: "Questionable", not_allowed: "Not allowed" };
const BANNER: Record<Verdict, string> = {
  allowed: "bg-ok-soft",
  questionable: "bg-warn-soft",
  not_allowed: "bg-bad-soft",
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
    if (p.landlordArgument) c.landlord = stripRuleLabels(p.landlordArgument);
    if (p.tenantArgument) c.tenant = stripRuleLabels(p.tenantArgument);
    if (p.ruling) c.ruling = p.ruling;
    byId.set(e.lineItemId, c);
  }
  return [...byId.values()];
}

export default function Courtroom({ events, items }: { events: AgentEvent[]; items: LineItem[] | null }) {
  const cases = deriveCases(events);
  if (cases.length === 0) return null;

  return (
    <TipTarget id="court">
    <section className="space-y-4">
      <div>
        <h2 className="display text-3xl">In court</h2>
        <p className="mt-1 text-base text-muted">For the biggest disputed charges, each side makes a case and the Judge rules.</p>
      </div>
      {cases.map((c) => {
        const item = items?.find((i) => i.id === c.id);
        return (
          <div key={c.id} className="pop rise dotgrid space-y-4 p-4 sm:p-5">
            {item && <h3 className="text-xl font-extrabold tracking-tight">{item.description}</h3>}
            <div className="grid gap-4 sm:grid-cols-2">
              {c.landlord && (
                <div className="flex items-start gap-2">
                  <Mascot agent="landlord_advocate" size={44} className="mt-1 shrink-0" />
                  <Bubble className="flex-1">
                    <p className="font-mono text-xs font-semibold text-muted">Landlord&apos;s Advocate</p>
                    <p className="mt-0.5 text-base leading-relaxed">{c.landlord}</p>
                  </Bubble>
                </div>
              )}
              {c.tenant && (
                <div className="flex items-start gap-2">
                  <Mascot agent="tenant_advocate" size={44} className="mt-1 shrink-0" />
                  <Bubble tone="sun" className="flex-1">
                    <p className="font-mono text-xs font-semibold">Tenant&apos;s Advocate (you)</p>
                    <p className="mt-0.5 text-base leading-relaxed">{c.tenant}</p>
                  </Bubble>
                </div>
              )}
            </div>
            {c.ruling && (
              <div className={`pop-sm rise flex items-start gap-3 p-4 ${BANNER[c.ruling.verdict]}`}>
                <Mascot agent="judge" mood="done" size={52} className="shrink-0" />
                <div>
                  <p className="text-lg font-black">Judge: {LABEL[c.ruling.verdict]}</p>
                  <p className="mt-1 text-base">{stripRuleLabels(c.ruling.reason)}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
    </TipTarget>
  );
}
