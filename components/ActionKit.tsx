"use client";

import { useState } from "react";
import { buildMailto } from "@/lib/compute";
import type { CaseResult } from "@/lib/types";
import Mascot from "./Mascot";

const btn = "btn-pop flex min-h-14 items-center justify-center px-5 py-3 text-center text-lg font-extrabold";

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

function Step({ n, title, hint, children }: { n: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="pop-sm space-y-3 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun text-lg font-black">{n}</span>
        <div>
          <h3 className="text-xl font-black leading-tight">{title}</h3>
          <p className="text-base text-muted">{hint}</p>
        </div>
      </div>
      {children}
    </div>
  );
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
    <section className="pop dotgrid space-y-4 p-4 sm:p-7">
      <div className="flex items-center gap-3">
        <Mascot agent="paralegal" mood="done" size={64} className="shrink-0" />
        <div>
          <h2 className="display text-3xl sm:text-4xl">Claude finished the job:</h2>
          <p className="text-base font-medium text-muted">Three quick steps left. About two minutes.</p>
        </div>
      </div>

      <Step n={1} title="Read your letter" hint="Fix anything that isn't right. Your edits carry into the email.">
        <textarea
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          rows={14}
          aria-label="Demand letter"
          className="w-full rounded-xl border-[2.5px] border-ink bg-[#fffdf5] p-4 text-base leading-relaxed outline-none focus:shadow-[3px_3px_0_var(--color-accent)]"
        />
      </Step>

      <Step n={2} title="Send it" hint="Opens your email app with the letter filled in, or copy it to send your own way.">
        <div className="grid gap-3 sm:grid-cols-2">
          <a href={mailto} className={`${btn} nudge bg-accent`}>
            Email landlord
          </a>
          <button onClick={() => copy("letter", letter)} className={`${btn} bg-white`}>
            {copied === "letter" ? "Copied ✓" : "Copy letter"}
          </button>
        </div>
      </Step>

      <Step n={3} title="Set a reminder" hint="Your landlord gets 14 days to answer. This puts the day on your calendar.">
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => download("depositback-followup.ics", result.ics, "text/calendar")} className={`${btn} bg-white`}>
            Add day-14 follow-up
          </button>
          {result.followUpEmail && (
            <button onClick={() => copy("followup", result.followUpEmail)} className={`${btn} bg-white`}>
              {copied === "followup" ? "Copied ✓" : "Copy follow-up email"}
            </button>
          )}
        </div>
      </Step>

      <p className="text-sm font-medium text-muted">Not legal advice. Review before sending. California only.</p>
    </section>
  );
}
