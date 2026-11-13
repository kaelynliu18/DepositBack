import type { AgentName } from "@/lib/types";

export const AGENTS: Record<AgentName, { label: string; emoji: string; color: string; job: string }> = {
  case_manager: { label: "Case Manager", emoji: "📋", color: "#4b5bff", job: "Runs your case and keeps things moving" },
  clerk: { label: "Clerk", emoji: "🗂️", color: "#5cc8ff", job: "Reads the statement and checks each charge" },
  landlord_advocate: { label: "Landlord's Advocate", emoji: "🏢", color: "#ff9f43", job: "Argues the landlord's side" },
  tenant_advocate: { label: "Tenant's Advocate", emoji: "🎓", color: "#ffd84d", job: "Argues your side" },
  judge: { label: "Judge", emoji: "⚖️", color: "#9b72ff", job: "Rules on the disputed charges" },
  inspector: { label: "Inspector", emoji: "🔍", color: "#2ec4b6", job: "Compares your move-in and move-out photos" },
  paralegal: { label: "Paralegal", emoji: "✍️", color: "#ff7eb6", job: "Writes your letter and reminder" },
};
