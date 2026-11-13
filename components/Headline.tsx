"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/compute";

/** Animates from the previously shown number to `target`. */
function useCountUp(target: number, ms = 700) {
  const [value, setValue] = useState(target);
  const shown = useRef(target);

  useEffect(() => {
    const from = shown.current;
    if (from === target) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const v = from + (target - from) * (1 - Math.pow(1 - t, 3));
      shown.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return Math.round(value);
}

export default function Headline({ strongClaim, possibleClaim }: { strongClaim: number; possibleClaim: number }) {
  const strong = useCountUp(strongClaim);
  const possible = useCountUp(possibleClaim);
  return (
    <section className="rounded-[28px] bg-accent p-6 text-white sm:p-8" aria-live="polite">
      <p className="text-xl text-white/80">You can claim</p>
      <p className="font-display text-7xl font-bold leading-none tracking-tight tabular-nums sm:text-8xl">{formatMoney(strong)}</p>
      {possibleClaim > strongClaim && <p className="mt-3 text-xl text-white/80">(up to {formatMoney(possible)})</p>}
    </section>
  );
}
