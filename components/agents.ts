import type { AgentName } from "@/lib/types";

export const AGENTS: Record<AgentName, { label: string; emoji: string; ring: string; bg: string; text: string }> = {
  case_manager: { label: "Case Manager", emoji: "📋", ring: "border-slate-400", bg: "bg-slate-50", text: "text-slate-700" },
  clerk: { label: "Clerk", emoji: "🗂️", ring: "border-sky-400", bg: "bg-sky-50", text: "text-sky-800" },
  landlord_advocate: { label: "Landlord's Advocate", emoji: "🏢", ring: "border-orange-400", bg: "bg-orange-50", text: "text-orange-800" },
  tenant_advocate: { label: "Tenant's Advocate", emoji: "🎓", ring: "border-indigo-400", bg: "bg-indigo-50", text: "text-indigo-800" },
  judge: { label: "Judge", emoji: "⚖️", ring: "border-purple-400", bg: "bg-purple-50", text: "text-purple-800" },
  inspector: { label: "Inspector", emoji: "🔍", ring: "border-cyan-500", bg: "bg-cyan-50", text: "text-cyan-800" },
  paralegal: { label: "Paralegal", emoji: "✍️", ring: "border-rose-400", bg: "bg-rose-50", text: "text-rose-800" },
};
