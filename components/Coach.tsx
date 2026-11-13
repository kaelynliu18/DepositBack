"use client";

import { useEffect, useRef, useState } from "react";
import type { Tip } from "@/hooks/useTour";
import Mascot from "./Mascot";

const WIDTH = 300;
const GAP = 18;

interface Pos { x: number; y: number; arrow: "left" | "right" | "none" }

/** Where to float the tip: beside its section on wide screens, otherwise null (docked at the top). */
function place(section: string | undefined, height: number): Pos | null {
  if (!section || window.innerWidth < 768) return null;
  const el = document.querySelector<HTMLElement>(`[data-tip-section="${section}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampY = (y: number) => Math.min(Math.max(y, 12), vh - height - 12);
  // Line up with the visible top of the section so the tip points at what it's describing.
  const y = clampY(Math.max(r.top, 12) + 8);
  if (r.right + GAP + WIDTH <= vw - 8) return { x: r.right + GAP, y, arrow: "left" };
  if (r.left - GAP - WIDTH >= 8) return { x: r.left - GAP - WIDTH, y, arrow: "right" };
  return { x: vw - WIDTH - 16, y: clampY(Math.max(r.top, 12) + 16), arrow: "none" };
}

/** A pop-up tip from the Case Manager, placed next to the section it explains. */
export default function Coach({ tip, onDismiss, onTurnOff }: { tip: Tip | null; onDismiss: () => void; onTurnOff: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);

  const section = tip?.section;
  useEffect(() => {
    if (!tip) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setPos(place(section, box.current?.offsetHeight ?? 220)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [tip, section]);

  if (!tip) return null;
  const floating = pos !== null;

  return (
    <div
      ref={box}
      key={tip.id}
      role="status"
      aria-live="polite"
      style={floating ? { left: pos.x, top: pos.y, width: WIDTH } : undefined}
      className={`pop pop-in fixed z-40 flex items-start gap-3 bg-sun p-4 ${floating ? "" : "inset-x-3 top-3 sm:left-auto sm:right-6 sm:top-6 sm:w-[300px]"}`}
    >
      {floating && pos.arrow !== "none" && (
        <span
          aria-hidden
          className={`absolute top-6 h-4 w-4 rotate-45 border-ink bg-sun ${pos.arrow === "left" ? "-left-[10px] border-b-[2.5px] border-l-[2.5px]" : "-right-[10px] border-r-[2.5px] border-t-[2.5px]"}`}
        />
      )}
      <Mascot agent="case_manager" mood="idle" size={44} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-lg font-black leading-tight">{tip.title}</p>
        <p className="mt-1 text-base leading-snug">{tip.body}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={onDismiss} className="btn-pop bg-white px-4 py-1.5 text-base font-extrabold">
            Got it
          </button>
          <button onClick={onTurnOff} className="text-sm font-bold underline">
            Turn off tips
          </button>
        </div>
      </div>
    </div>
  );
}
