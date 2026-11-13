import type { AgentName } from "@/lib/types";

export const AGENTS: Record<AgentName, { label: string; emoji: string }> = {
  case_manager: { label: "Case Manager", emoji: "📋" },
  clerk: { label: "Clerk", emoji: "🗂️" },
  landlord_advocate: { label: "Landlord's Advocate", emoji: "🏢" },
  tenant_advocate: { label: "Tenant's Advocate", emoji: "🎓" },
  judge: { label: "Judge", emoji: "⚖️" },
  inspector: { label: "Inspector", emoji: "🔍" },
  paralegal: { label: "Paralegal", emoji: "✍️" },
};
