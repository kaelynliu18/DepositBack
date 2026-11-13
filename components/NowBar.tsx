import type { AgentEvent, AgentName } from "@/lib/types";
import { AGENTS } from "./agents";
import Mascot from "./Mascot";

const STAGES = [
  { label: "Read", does: "The Clerk reads every line of your landlord's statement." },
  { label: "Argue", does: "Two advocates argue each disputed charge, one for the landlord and one for you." },
  { label: "Rule", does: "The Judge decides charge by charge. Verdicts below may change." },
  { label: "Draft", does: "The Paralegal writes your letter and reminder." },
];
const STAGE_OF: Partial<Record<AgentName, number>> = { clerk: 0, landlord_advocate: 1, tenant_advocate: 1, inspector: 1, judge: 2, paralegal: 3 };

/** The "what is happening right now" panel: one speaker, one sentence, one progress strip. */
export default function NowBar({ events, waitingForPhotos }: { events: AgentEvent[]; waitingForPhotos: boolean }) {
  const stage = events.reduce((s, e) => Math.max(s, STAGE_OF[e.agent] ?? 0), 0);
  const current = [...events].reverse().find((e) => e.status === "working") ?? events[events.length - 1];
  const agent: AgentName = waitingForPhotos ? "inspector" : (current?.agent ?? "case_manager");
  const message = waitingForPhotos ? "I need a hand. Add photos of that spot, or skip." : (current?.message ?? "Opening your case…");

  return (
    <section className="pop rise dotgrid p-4 sm:p-6" aria-live="polite">
      <div className="flex items-start gap-4">
        <Mascot agent={agent} mood={waitingForPhotos ? "idle" : "working"} size={84} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-muted">{AGENTS[agent].label} is on it</p>
          <p className="mt-1 text-xl font-bold leading-snug sm:text-2xl">{message}</p>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-4 gap-2">
        {STAGES.map((s, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <li key={s.label} className="space-y-1.5">
              <div className={`h-3 rounded-full border-2 border-ink ${done ? "bg-ink" : active ? "working-strip" : "bg-white"}`} />
              <p className={`flex items-center gap-1.5 text-sm font-bold ${active ? "text-ink" : done ? "text-ink" : "text-muted"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink text-xs ${active ? "bg-sun" : done ? "bg-ink text-white" : "bg-white"}`}>
                  {done ? "✓" : i + 1}
                </span>
                {s.label}
              </p>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-base text-muted">
        <span className="font-bold text-ink">Step {stage + 1} of 4.</span> {STAGES[stage].does}
      </p>
    </section>
  );
}
