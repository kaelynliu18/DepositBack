/** Speech bubble with a tail pointing left (toward the speaker). */
export default function Bubble({ children, tone = "white", className = "" }: { children: React.ReactNode; tone?: "white" | "warn" | "sun"; className?: string }) {
  const bg = tone === "warn" ? "bg-warn-soft" : tone === "sun" ? "bg-sun" : "bg-white";
  return (
    <div className={`pop-sm pop-in relative ${bg} px-4 py-3 ${className}`}>
      <span className={`absolute -left-[9px] top-5 h-4 w-4 rotate-45 border-b-[2.5px] border-l-[2.5px] border-ink ${bg}`} aria-hidden />
      {children}
    </div>
  );
}
