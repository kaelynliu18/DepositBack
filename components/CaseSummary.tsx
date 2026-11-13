import { formatMoney } from "@/lib/compute";
import type { LineItem } from "@/lib/types";

export default function CaseSummary({ items, landlordName }: { items: LineItem[]; landlordName?: string | null }) {
  const withheld = items.reduce((s, i) => s + i.amount, 0);
  const parts = [`${items.length} charge${items.length === 1 ? "" : "s"}`, `${formatMoney(withheld)} withheld`];
  if (landlordName) parts.push(landlordName);
  return <p className="text-lg font-bold text-ink">{parts.join(" · ")}</p>;
}
