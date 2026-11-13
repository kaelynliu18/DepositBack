const ITEMS = [
  { label: "Allowed", meaning: "a fair charge", dot: "bg-ok" },
  { label: "Questionable", meaning: "worth arguing", dot: "bg-[#e59b00]" },
  { label: "Not allowed", meaning: "likely illegal", dot: "bg-bad" },
];

/** What the colors mean, in plain words. */
export default function ChargeLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="Color legend">
      {ITEMS.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-full border-2 border-ink ${i.dot}`} />
          <b className="text-ink">{i.label}</b> {i.meaning}
        </span>
      ))}
    </div>
  );
}
