"use client";

import { useState } from "react";
import { buildMailto } from "@/lib/compute";
import type { CaseResult } from "@/lib/types";

const btn = "flex min-h-14 items-center justify-center rounded-xl px-5 py-3 text-center text-lg font-semibold transition active:translate-y-px";

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ActionKit({ result }: { result: CaseResult }) {
  const [letter, setLetter] = useState(result.letter);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  // Rebuild from the (possibly edited) letter so the email matches what's on screen.
  const mailto = letter === result.letter ? result.mailto : buildMailto(result.clerk.landlordEmail ?? null, "Security deposit: request for return", letter);

  return (
    <section className="space-y-5 rounded-[28px] bg-ink p-5 text-white sm:p-8">
      <h2 className="font-display text-4xl font-bold">Claude finished the job:</h2>
      <textarea
        value={letter}
        onChange={(e) => setLetter(e.target.value)}
        rows={16}
        aria-label="Demand letter"
        className="w-full rounded-2xl bg-white p-5 font-display text-lg leading-relaxed text-ink outline-none focus:ring-4 focus:ring-accent"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <a href={mailto} className={`${btn} bg-accent text-white hover:bg-accent-dark`}>
          Email landlord
        </a>
        <button onClick={() => copy("letter", letter)} className={`${btn} border-2 border-white/40 hover:bg-white/10`}>
          {copied === "letter" ? "Copied ✓" : "Copy letter"}
        </button>
        <button onClick={() => download("depositback-followup.ics", result.ics, "text/calendar")} className={`${btn} border-2 border-white/40 hover:bg-white/10`}>
          Add day-14 follow-up
        </button>
      </div>
      {result.followUpEmail && (
        <button onClick={() => copy("followup", result.followUpEmail)} className={`${btn} w-full border-2 border-white/40 hover:bg-white/10`}>
          {copied === "followup" ? "Copied ✓" : "Copy follow-up email"}
        </button>
      )}
      <p className="text-sm text-white/60">Not legal advice. Review before sending. California only.</p>
    </section>
  );
}
