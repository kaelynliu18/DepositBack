"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Charges as a vertical list on laptops and a swipeable snap deck on phones,
 * with a position counter. Scrolls to a card when the Judge or Inspector changes it.
 */
export default function ChargeDeck({ children, focusIndex }: { children: React.ReactNode[]; focusIndex?: number | null }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = children.length;

  function onScroll() {
    const el = track.current;
    if (!el || !el.firstElementChild) return;
    const step = (el.firstElementChild as HTMLElement).offsetWidth + 16;
    setActive(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  }

  useEffect(() => {
    if (focusIndex == null || !window.matchMedia("(max-width: 1023px)").matches) return;
    const el = track.current?.children[focusIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [focusIndex]);

  return (
    <div>
      <div
        ref={track}
        onScroll={onScroll}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-3 pt-1 lg:mx-0 lg:block lg:space-y-4 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {children.map((c, i) => (
          <div key={i} className="w-[86%] shrink-0 snap-center pr-1 lg:w-auto lg:pr-0">
            {c}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2 lg:hidden" aria-hidden>
          {children.map((_, i) => (
            <span key={i} className={`h-2.5 rounded-full border-2 border-ink transition-all ${i === active ? "w-6 bg-ink" : "w-2.5 bg-white"}`} />
          ))}
          <span className="ml-2 text-sm font-semibold text-muted">swipe</span>
        </div>
      )}
    </div>
  );
}
