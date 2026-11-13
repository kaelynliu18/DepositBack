"use client";

import { createContext, useContext } from "react";

/** The section the current tip is about (or null). Provided by the page. */
export const ActiveTipSection = createContext<string | null>(null);

/** Marks a part of the page as tip-able and rings it while its tip is showing. */
export default function TipTarget({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  const active = useContext(ActiveTipSection) === id;
  return (
    <div
      data-tip-section={id}
      className={`rounded-[24px] transition-[outline-color,outline-offset] duration-300 ${active ? "outline outline-4 outline-offset-[6px] outline-accent" : "outline outline-4 outline-offset-[6px] outline-transparent"} ${className}`}
    >
      {children}
    </div>
  );
}
