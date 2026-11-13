"use client";

import { useEffect, useState } from "react";

/**
 * Which [data-tip-section] is under the middle of the screen, once the reader has paused on it.
 * Re-checks on scroll, resize and when `watch` changes (new sections appearing).
 */
export function useSectionFocus(enabled: boolean, watch: string): string | null {
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;

    const measure = () => {
      const mid = window.innerHeight * 0.5;
      let best: string | null = null;
      let bestDist = Infinity;
      document.querySelectorAll<HTMLElement>("[data-tip-section]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height === 0) return;
        // Distance from the screen's middle line to the section (0 when it crosses it).
        const dist = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (dist < bestDist && dist < window.innerHeight * 0.3) {
          best = el.dataset.tipSection ?? null;
          bestDist = dist;
        }
      });
      setFocus(best);
    };
    // Wait for the reader to pause so fast scrolling doesn't flash tips.
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        clearTimeout(timer);
        timer = setTimeout(measure, 600);
      });
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled, watch]);

  return enabled ? focus : null;
}
