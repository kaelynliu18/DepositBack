// Case Manager: orchestration in plain code (no Claude call here).
// Clerk -> photo requests -> Courtroom (top 2 "courtroom" charges by $) & Inspector -> merge -> compute.
// Skipped photos keep the Clerk's verdict; they are never sent to court.
//
// KEY SAFETY: runs in the browser and ONLY talks to /api/* through lib/client.ts.
//
// Rules:
//  - The Clerk gives a verdict for EVERY charge, so the case is complete even with no courtroom.
//  - Any later agent that fails twice emits an error event; its charges keep the Clerk's verdict.
//  - 60s budget of agent time (time spent waiting for the user's photos doesn't count).

import * as api from "./client";
import { buildIcs, buildLetter, buildMailto, daysToStatement, formatMoney, isLate, mergeVerdicts, totals } from "./compute";
import type {
  AgentEvent,
  AgentEventPayload,
  AgentName,
  CaseInput,
  CaseResult,
  ClerkResponse,
  InspectorResponse,
  LineItem,
  PhotoPair,
  Ruling,
} from "./types";

/** Flip to false if the courtroom isn't ready at the 2:00 checkpoint. */
export const ENABLE_COURTROOM = true;
/** At most this many charges go to court (highest dollar amount first). */
export const MAX_COURT_CHARGES = 2;
/** Total agent time allowed per case. */
export const CASE_TIMEOUT_MS = 60_000;

export interface CaseHooks {
  onEvent: (e: AgentEvent) => void;
  onNeedPhotos: (item: LineItem) => Promise<PhotoPair | null>;
}

let seq = 0;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Try once, retry once. Throws the last error if both fail. */
async function twice<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (first) {
    console.warn("Agent call failed, retrying once:", first);
    return fn();
  }
}

export async function runCase(input: CaseInput, hooks: CaseHooks): Promise<CaseResult> {
  let timedOut = false;
  /**
   * Emit an event and return its id. Pass `replaceId` to update an earlier event in place
   * (the UI replaces events with the same id, so "working…" turns into "done").
   */
  const emit = (agent: AgentName, status: AgentEvent["status"], message: string, lineItemId?: string, payload?: AgentEventPayload, replaceId?: string): string => {
    const id = replaceId ?? `ev${++seq}`;
    if (timedOut) return id; // stragglers after a timeout stay out of the feed
    hooks.onEvent({ id, agent, status, message, lineItemId, at: Date.now(), payload });
    return id;
  };

  // ---- 60s agent-time budget ----
  let budgetMs = CASE_TIMEOUT_MS;
  /** Race a phase against the remaining budget; subtract the time it used. */
  async function timed<T>(p: Promise<T>): Promise<T> {
    const start = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        reject(new Error("The case took longer than 60 seconds. Please try again, or add ?demo=1 to the URL to run the demo."));
      }, Math.max(budgetMs, 0));
    });
    try {
      return await Promise.race([p, timeout]);
    } finally {
      clearTimeout(timer);
      budgetMs -= Date.now() - start;
    }
  }

  const caseId = emit("case_manager", "working", `Opening a case for ${input.tenantName}`);

  // ---- 1. Clerk ----
  const clerkId = emit("clerk", "working", "Reading the deduction statement…");
  let clerk: ClerkResponse;
  try {
    clerk = await timed(twice(() => api.clerk(input)));
  } catch (err) {
    // Without the Clerk there are no charges to work on, so this is the one fatal error.
    timedOut = false; // make sure the failure itself always reaches the feed
    emit("clerk", "error", "Couldn't read the statement. Try a clearer photo or PDF.", undefined, undefined, clerkId);
    emit("case_manager", "error", (err as Error).message, undefined, undefined, caseId);
    throw err instanceof Error ? err : new Error(String(err));
  }
  const who = clerk.landlordName ? `${clerk.landlordName}'s statement` : "the statement";
  // Charge cards can render right away from payload.lineItems.
  emit("clerk", "done", `Read ${who}: found ${plural(clerk.lineItems.length, "charge")}`, undefined, { lineItems: clerk.lineItems }, clerkId);

  // ---- 2. Ask the user for photos (one item at a time; not counted against the budget) ----
  const toInspector = clerk.lineItems.filter((i) => i.route === "inspector");
  const photoJobs: { item: LineItem; pair: PhotoPair }[] = [];
  for (const item of toInspector) {
    const askId = emit("inspector", "working", `Asking you for move-in and move-out photos of "${item.description}"`, item.id);
    let pair: PhotoPair | null = null;
    try {
      pair = await hooks.onNeedPhotos(item);
    } catch {
      pair = null;
    }
    if (pair?.moveIn?.data && pair?.moveOut?.data) {
      photoJobs.push({ item, pair });
      emit("inspector", "done", `Got your photos of "${item.description}"`, item.id, undefined, askId);
    } else {
      emit("inspector", "done", `Photos skipped for "${item.description}"`, item.id, undefined, askId);
      // Skipped photos: keep the Clerk's verdict (never sent to court).
      emit("case_manager", "done", `No photos for "${item.description}", so the Clerk's verdict stands`, item.id);
    }
  }

  // ---- 3. Pick the court docket: top N "courtroom" charges by dollar amount ----
  const contested = clerk.lineItems.filter((i) => i.route === "courtroom");
  const docket = ENABLE_COURTROOM ? [...contested].sort((a, b) => b.amount - a.amount).slice(0, MAX_COURT_CHARGES) : [];
  const settledCount = clerk.lineItems.length - docket.length - photoJobs.length;
  const parts = [
    docket.length && `${plural(docket.length, "contested charge")} to court`,
    photoJobs.length && `${photoJobs.length} to the Inspector`,
    settledCount && `${settledCount} decided by the Clerk`,
  ].filter(Boolean);
  emit("case_manager", "done", `Sending ${parts.join(", ") || "nothing onward"}`);

  // ---- 4. Courtroom and Inspector run at the same time ----
  const desc = (id: string) => clerk.lineItems.find((i) => i.id === id)?.description ?? id;
  const clerkVerdict = (id: string) => clerk.lineItems.find((i) => i.id === id)?.verdict;

  const runCourt = async (): Promise<Ruling[]> => {
    if (docket.length === 0) return [];
    const n = plural(docket.length, "charge");
    // The first argument from each side replaces its "working" event; later ones are new events.
    let landlordSlot: string | undefined = emit("landlord_advocate", "working", `Building the landlord's case on ${n}…`);
    let tenantSlot: string | undefined = emit("tenant_advocate", "working", `Building your case on ${n}…`);
    let judgeSlot: string | undefined;
    let judgeStarted = false;
    try {
      const res = await twice(() =>
        api.courtroom({ items: docket, tenancyMonths: input.tenancyMonths, moveOutDate: input.moveOutDate }, (u) => {
          // Live courtroom: one event per argument / ruling, the moment it arrives.
          if (u.type === "argument") {
            if (u.side === "landlord") {
              emit("landlord_advocate", "done", `On "${desc(u.lineItemId)}": ${u.argument}`, u.lineItemId, { landlordArgument: u.argument }, landlordSlot);
              landlordSlot = undefined;
            } else {
              emit("tenant_advocate", "done", `On "${desc(u.lineItemId)}": ${u.argument}`, u.lineItemId, { tenantArgument: u.argument }, tenantSlot);
              tenantSlot = undefined;
            }
          } else if (u.type === "ruling") {
            if (judgeSlot === undefined && !judgeStarted) {
              judgeStarted = true;
              judgeSlot = emit("judge", "working", "Weighing both sides against §1950.5…");
            }
            const v = { allowed: "allowed", questionable: "questionable", not_allowed: "not allowed" }[u.ruling.verdict];
            // Always announce, even if unchanged, so the UI can show "confirmed by Judge".
            emit("judge", "done", `"${desc(u.ruling.lineItemId)}" is ${v}. ${u.ruling.reason}`, u.ruling.lineItemId, {
              ruling: u.ruling,
              previousVerdict: clerkVerdict(u.ruling.lineItemId),
              newVerdict: u.ruling.verdict,
            }, judgeSlot);
            judgeSlot = undefined;
          }
        }),
      );
      return res.rulings;
    } catch (err) {
      console.error("Courtroom failed twice:", err);
      if (landlordSlot) emit("landlord_advocate", "error", "No argument made", undefined, undefined, landlordSlot);
      if (tenantSlot) emit("tenant_advocate", "error", "No argument made", undefined, undefined, tenantSlot);
      emit("judge", "error", "The court couldn't rule. Keeping the Clerk's verdicts", undefined, undefined, judgeSlot);
      return [];
    }
  };

  const runInspections = (): Promise<(InspectorResponse | null)[]> =>
    Promise.all(
      photoJobs.map(async ({ item, pair }) => {
        const compareId = emit("inspector", "working", `Comparing move-in vs move-out photos of "${item.description}"…`, item.id);
        try {
          const r = await twice(() =>
            api.inspector({
              lineItem: { id: item.id, description: item.description, amount: item.amount },
              tenancyMonths: input.tenancyMonths,
              moveIn: pair.moveIn,
              moveOut: pair.moveOut,
            }),
          );
          const label = { normal_wear: "normal wear", damage: "damage", unclear: "unclear" }[r.classification];
          emit("inspector", "done", `${r.changeObserved} → ${label}`, item.id, {
            inspector: r,
            previousVerdict: item.verdict,
            newVerdict: r.verdict,
          }, compareId);
          return r;
        } catch (err) {
          console.error("Inspector failed twice:", err);
          emit("inspector", "error", `Couldn't compare photos for "${item.description}". Keeping the Clerk's verdict`, item.id, undefined, compareId);
          return null;
        }
      }),
    );

  // If this phase blows the budget, runCase throws the timeout Error.
  const [rulings, photoResults] = await timed(Promise.all([runCourt(), runInspections()]));
  const photos = photoResults.filter((p): p is InspectorResponse => p !== null);

  // ---- 5. Merge + compute (pure code) ----
  const items = mergeVerdicts(clerk.lineItems, rulings, photos);
  const { strongClaim, possibleClaim } = totals(items);
  const days = daysToStatement(input.moveOutDate, clerk.statementDate ?? null);
  const late = isLate(days);

  const paraId = emit("paralegal", "working", "Drafting the demand letter, email and reminder…");
  const letter = buildLetter({ clerk, items, moveOutDate: input.moveOutDate, tenantName: input.tenantName, strongClaim, days, late });
  const mailto = buildMailto(clerk.landlordEmail ?? null, "Security deposit: request for return", letter);
  const ics = buildIcs({ strongClaim, landlordName: clerk.landlordName ?? null });
  emit("paralegal", "done", "Letter drafted", undefined, undefined, paraId);
  emit("case_manager", "done", `Case ready: ${formatMoney(strongClaim)} strong claim, up to ${formatMoney(possibleClaim)}`, undefined, undefined, caseId);

  return {
    clerk,
    items,
    rulings,
    photos,
    strongClaim,
    possibleClaim,
    daysToStatement: days,
    isLate: late,
    letter,
    mailto,
    ics,
    followUpEmail: "", // dropped from scope
  };
}
