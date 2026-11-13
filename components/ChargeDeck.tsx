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
    const step = (el.firstElementChild as HTMLElement).offsetWidth + 12;
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
        className="no-scrollbar -mx-4 flex snap-x items-start snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:block lg:space-y-3 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {children.map((c, i) => (
          <div key={i} className="w-[88%] shrink-0 snap-center lg:w-auto">
            {c}
          </div>
        ))}
      </div>
      {count > 1 && (
        <p className="mt-2 text-center text-sm text-muted lg:hidden" aria-hidden>
          {active + 1} of {count}: swipe for more
        </p>
      )}
    </div>
  );
}
