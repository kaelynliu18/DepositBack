import type { AgentEvent, AgentName } from "@/lib/types";
import { AGENTS } from "./agents";

const STAGES = ["Read statement", "Build both sides", "Rule", "Draft letter"];
const STAGE_OF: Partial<Record<AgentName, number>> = {
  clerk: 0,
  landlord_advocate: 1,
  tenant_advocate: 1,
  inspector: 1,
  judge: 2,
  paralegal: 3,
};

/** What is happening right now, plus a 4-stage progress strip. */
export default function NowBar({ events, waitingForPhotos, finished }: { events: AgentEvent[]; waitingForPhotos: boolean; finished: boolean }) {
  const stage = events.reduce((s, e) => Math.max(s, STAGE_OF[e.agent] ?? 0), 0);
  const current = [...events].reverse().find((e) => e.status === "working") ?? events[events.length - 1];
  const a = current ? AGENTS[current.agent] : AGENTS.case_manager;
  const message = waitingForPhotos ? "Waiting for your photos. Add them or skip." : (current?.message ?? "Opening your case…");

  return (
    <section className="rise rounded-[28px] bg-ink p-5 text-white sm:p-7" aria-live="polite">
      <div className="flex items-start gap-4">
        <div className="pulse-ring flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-3xl">{waitingForPhotos ? "🔍" : a.emoji}</div>
        <div className="min-w-0">
          <p className="text-base text-white/60">{waitingForPhotos ? "Inspector" : a.label}</p>
          <p className="text-xl font-semibold leading-snug sm:text-2xl">{message}</p>
        </div>
      </div>
      <ol className="mt-6 grid grid-cols-4 gap-2">
        {STAGES.map((label, i) => {
          const done = finished || i < stage;
          const active = !finished && i === stage;
          return (
            <li key={label} className="space-y-2">
              <div className={`h-1.5 rounded-full ${done ? "bg-white" : active ? "shimmer" : "bg-white/20"}`} />
              <p className={`text-sm leading-tight ${done || active ? "text-white" : "text-white/45"}`}>{label}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
