"use client";

import { useState } from "react";
import { buildGcalUrl, buildGmailUrl } from "@/lib/compute";
import type { CaseResult } from "@/lib/types";

const btn =
  "flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-center text-lg font-semibold transition active:scale-[0.99]";

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

  // Gmail draft built from the (possibly edited) letter, so the email matches what's on screen.
  const gmail = buildGmailUrl(result.clerk.landlordEmail ?? null, "Security deposit: request for return", letter);
  // Google Calendar "new event" page for day 14 (nothing is downloaded).
  const gcal = buildGcalUrl({ strongClaim: result.strongClaim, landlordName: result.clerk.landlordName ?? null });

  return (
    <section className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/50 p-5 shadow-sm sm:p-6">
      <h2 className="text-3xl font-bold text-teal-900">Claude finished the job:</h2>
      <textarea
        value={letter}
        onChange={(e) => setLetter(e.target.value)}
        rows={16}
        aria-label="Demand letter"
        className="w-full rounded-xl border border-slate-300 bg-white p-4 text-base leading-relaxed text-slate-800 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <button onClick={() => copy("letter", letter)} className={`${btn} border border-teal-800 text-teal-900 hover:bg-white`}>
          {copied === "letter" ? "Copied ✓" : "Copy letter"}
        </button>
        <a href={gmail} target="_blank" rel="noopener noreferrer" className={`${btn} bg-teal-800 text-white hover:bg-teal-900`}>
          Email landlord
        </a>
        <a href={gcal} target="_blank" rel="noopener noreferrer" className={`${btn} border border-teal-800 text-teal-900 hover:bg-white`}>
          Add day-14 follow-up
        </a>
      </div>
      {result.followUpEmail && (
        <button onClick={() => copy("followup", result.followUpEmail)} className={`${btn} w-full border border-slate-300 text-slate-700 hover:bg-white`}>
          {copied === "followup" ? "Copied ✓" : "Copy follow-up email"}
        </button>
      )}
      <p className="text-sm text-slate-500">Not legal advice. Review before sending. California only.</p>
    </section>
  );
}
