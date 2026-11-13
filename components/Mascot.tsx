import type { AgentName } from "@/lib/types";
import { AGENTS } from "./agents";

export type MascotMood = "idle" | "working" | "done" | "error";

const INK = "#1b1340";

/** Body outline for each agent: a different silhouette so they read apart at a glance. */
function Body({ agent, fill }: { agent: AgentName; fill: string }) {
  const p = { fill, stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const };
  switch (agent) {
    case "case_manager":
      return <rect x="22" y="8" width="56" height="84" rx="28" {...p} />;
    case "clerk":
      return <rect x="12" y="14" width="76" height="76" rx="22" {...p} />;
    case "landlord_advocate":
      return (
        <g {...p}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <circle key={a} cx={50 + 32 * Math.cos((a * Math.PI) / 180)} cy={52 + 32 * Math.sin((a * Math.PI) / 180)} r="15" />
          ))}
          <circle cx="50" cy="52" r="34" stroke="none" />
        </g>
      );
    case "tenant_advocate":
      return (
        <g>
          <circle cx="50" cy="56" r="38" {...p} />
          <polygon points="50,6 86,22 50,36 14,22" fill={INK} />
          <rect x="44" y="30" width="12" height="8" fill={INK} />
        </g>
      );
    case "judge":
      return (
        <g>
          <rect x="16" y="20" width="68" height="72" rx="18" {...p} />
          <circle cx="12" cy="40" r="12" fill="#fff" stroke={INK} strokeWidth="4" />
          <circle cx="88" cy="40" r="12" fill="#fff" stroke={INK} strokeWidth="4" />
        </g>
      );
    case "inspector":
      return <circle cx="50" cy="52" r="42" {...p} />;
    case "paralegal":
      return <path d="M50 6 C78 30 90 48 90 64 C90 82 72 94 50 94 C28 94 10 82 10 64 C10 48 22 30 50 6 Z" {...p} />;
  }
}

/** A tiny character with eyes and a mood. Offset shadow echoes the card style. */
export default function Mascot({ agent, mood = "idle", size = 56, className = "" }: { agent: AgentName; mood?: MascotMood; size?: number; className?: string }) {
  const color = AGENTS[agent].color;
  const mouth =
    mood === "done" ? <path d="M36 66 Q50 82 64 66" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    : mood === "working" ? <circle cx="50" cy="68" r="4.5" fill={INK} />
    : mood === "error" ? <path d="M38 72 Q50 62 62 72" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    : <path d="M40 66 Q50 73 60 66" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
  return (
    <svg viewBox="-4 -4 112 112" width={size} height={size} className={`${mood === "working" ? "bob" : ""} ${className}`} role="img" aria-label={`${AGENTS[agent].label} (${mood})`}>
      <g transform="translate(5 5)" aria-hidden>
        <Body agent={agent} fill={INK} />
      </g>
      <Body agent={agent} fill={color} />
      <g>
        <ellipse className="eye" cx="38" cy="48" rx="9" ry="10" fill="#fff" stroke={INK} strokeWidth="3" />
        <ellipse className="eye" cx="62" cy="48" rx="9" ry="10" fill="#fff" stroke={INK} strokeWidth="3" />
        <circle cx={mood === "working" ? 41 : 39} cy="50" r="4" fill={INK} />
        <circle cx={mood === "working" ? 65 : 63} cy="50" r="4" fill={INK} />
        {mouth}
        {agent === "inspector" && (
          <g>
            <circle cx="38" cy="48" r="15" fill="none" stroke={INK} strokeWidth="4" />
            <line x1="26" y1="60" x2="16" y2="74" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          </g>
        )}
        {agent === "paralegal" && <path d="M78 80 L92 66" stroke={INK} strokeWidth="5" strokeLinecap="round" />}
      </g>
    </svg>
  );
}
