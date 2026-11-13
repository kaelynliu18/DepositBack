// Pure functions: all money math, date math, and document text.
// Claude never does any of this. Safe to import on client or server.

import type { ClerkResponse, InspectorResponse, LineItem, Ruling } from "./types";

/** Days the landlord gets to pay after the demand letter. The letter, reminder and button all use this. */
export const FOLLOW_UP_DAYS = 14;

// ---------- helpers ----------

/** $1,234 (adds cents only when there are any: $1,234.50) */
export function formatMoney(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

const roundCents = (n: number) => Math.round(n * 100) / 100;

/** Parse "YYYY-MM-DD" as a UTC date (no timezone drift). Returns null if invalid. */
function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return isNaN(d.getTime()) ? null : d;
}

/** Today's local date as YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "2026-10-01" + 14 -> "2026-10-15" */
export function addDays(iso: string, days: number): string {
  const d = parseDate(iso) ?? parseDate(todayISO())!;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "2026-10-01" -> "October 1, 2026" (falls back to the raw string) */
export function formatDate(iso: string | null): string {
  const d = parseDate(iso);
  if (!d) return iso ?? "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

// ---------- verdicts ----------

/** Final verdict per charge: Inspector and Judge override the Clerk; everything else keeps the Clerk's. */
export function mergeVerdicts(clerkItems: LineItem[], rulings: Ruling[], photos: InspectorResponse[]): LineItem[] {
  return clerkItems.map((item) => {
    const photo = photos.find((p) => p.lineItemId === item.id);
    if (photo) {
      return { ...item, verdict: photo.verdict, reason: photo.reason, rule: item.rule, route: "inspector", decidedBy: "inspector" };
    }
    const ruling = rulings.find((r) => r.lineItemId === item.id);
    if (ruling) {
      return { ...item, verdict: ruling.verdict, reason: ruling.reason, rule: ruling.rule, route: "courtroom", decidedBy: "judge" };
    }
    return item; // no override: the Clerk's verdict is final
  });
}

// ---------- totals & dates ----------

export function totals(items: LineItem[]): { strongClaim: number; possibleClaim: number } {
  const sum = (v: LineItem["verdict"]) =>
    items.filter((i) => i.verdict === v).reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const strongClaim = roundCents(sum("not_allowed"));
  const possibleClaim = roundCents(strongClaim + sum("questionable"));
  return { strongClaim, possibleClaim };
}

/** Calendar days from move-out to the statement date (null if either is missing). */
export function daysToStatement(moveOutDate: string, statementDate: string | null): number | null {
  const a = parseDate(moveOutDate);
  const b = parseDate(statementDate);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Late = more than 21 days (Civil Code §1950.5(g)). */
export function isLate(days: number | null): boolean {
  return days !== null && days > 21;
}

// ---------- documents ----------

export interface LetterInput {
  clerk: ClerkResponse;
  items: LineItem[];
  moveOutDate: string;
  tenantName: string;
  strongClaim: number;
  days: number | null;
  late: boolean;
  depositAmount?: number; // enables the "you say I owe more than my deposit" wording
  today?: string; // YYYY-MM-DD, defaults to today
}

/**
 * What the tenant should actually ask for, given the deposit.
 * - refundDue: extra money the landlord must send back if the strong-claim charges are removed.
 * - claimedBalance: what the landlord says the tenant owes beyond the deposit (0 if none).
 * - correctedBalance: that balance once the strong-claim charges are removed.
 * Bayview: deposit 2400, deductions 2115, strong 780 -> refundDue 780, no balance.
 * Tenant owes: deposit 2000, deductions 2285, strong 150 -> refundDue 0, balance 285 -> 135.
 */
export function demandAmounts(items: LineItem[], strongClaim: number, depositAmount: number) {
  const total = roundCents(items.reduce((acc, i) => acc + (Number(i.amount) || 0), 0));
  const alreadyRefunded = Math.max(0, depositAmount - total);
  const fairDeductions = total - strongClaim;
  const refundDue = roundCents(Math.max(0, depositAmount - fairDeductions) - alreadyRefunded);
  const claimedBalance = roundCents(Math.max(0, total - depositAmount));
  const correctedBalance = roundCents(Math.max(0, fairDeductions - depositAmount));
  return { refundDue, claimedBalance, correctedBalance };
}

/**
 * Judge reasons start with who won ("The tenant wins: ..."). That's great in the UI
 * but odd in a letter to the landlord, so drop the prefix there.
 */
export function letterReason(reason: string): string {
  const stripped = reason.replace(/^\s*(the (tenant|landlord)('s argument)? wins[^:]*|neither side wins[^:]*):\s*/i, "");
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

export function buildLetter(p: LetterInput): string {
  const disputed = p.items.filter((i) => i.verdict === "not_allowed" || i.verdict === "questionable");
  const address = p.clerk.propertyAddress ?? "my rental unit";
  const stmt = p.clerk.statementDate ? `your itemized statement dated ${formatDate(p.clerk.statementDate)}` : "your itemized statement";

  const lines: string[] = [
    formatDate(p.today ?? todayISO()),
    "",
    `Dear ${p.clerk.landlordName ?? "Property Manager"},`,
    "",
    `I moved out of ${address} on ${formatDate(p.moveOutDate)}. I have reviewed ${stmt} under California Civil Code §1950.5 and dispute the following deductions:`,
    "",
    ...disputed.map((i) => `• ${i.description} — ${formatMoney(i.amount)}: ${letterReason(i.reason)}`),
    "",
  ];
  if (p.late && p.days !== null) {
    lines.push(`Your statement was sent ${p.days} days after I moved out, past the 21-day deadline in §1950.5(g).`, "");
  }
  // Normal case: ask for the strong claim back. If the landlord says the tenant owes MORE than
  // the deposit, removing bad charges may only shrink that bill, so say that instead.
  const d = p.depositAmount && p.depositAmount > 0 ? demandAmounts(p.items, p.strongClaim, p.depositAmount) : null;
  if (d && d.claimedBalance > 0) {
    lines.push(
      `Your statement keeps my full ${formatMoney(p.depositAmount!)} deposit and says I owe ${formatMoney(d.claimedBalance)} more. ` +
        (d.correctedBalance > 0
          ? `Without the charges disputed above, that balance should be no more than ${formatMoney(d.correctedBalance)}, and I will not pay the disputed amounts.`
          : `Without the charges disputed above, I owe nothing more.`),
      "",
    );
  }
  const ask =
    d && d.refundDue <= 0
      ? `Please send me a corrected itemized statement within ${FOLLOW_UP_DAYS} days of this letter.`
      : `Please return ${formatMoney(d ? d.refundDue : p.strongClaim)} within ${FOLLOW_UP_DAYS} days of this letter.`;
  lines.push(
    `${ask} If we cannot resolve this, I am prepared to file in small claims court, where a court may award up to twice the deposit for bad-faith retention.`,
    "",
    "Sincerely,",
    p.tenantName,
  );
  return lines.join("\n");
}

export function buildMailto(to: string | null, subject: string, body: string): string {
  // Address stays readable; subject/body must be percent-encoded (spaces as %20, not +).
  return `mailto:${(to ?? "").trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Text for the follow-up reminder (used by the Google Calendar link and the .ics file). */
export function reminderText(strongClaim: number, landlordName: string | null): { title: string; details: string } {
  const who = landlordName ?? "your landlord";
  return {
    title: `Follow up on deposit — ${formatMoney(strongClaim)}`,
    details:
      `${FOLLOW_UP_DAYS} days have passed since you sent your demand letter to ${who}. ` +
      `If you haven't received ${formatMoney(strongClaim)}, send a short follow-up and consider filing in small claims court.`,
  };
}

/**
 * Gmail compose link (opens in the browser, signed-in Gmail account, no mail app needed).
 * `to` may be null: Gmail opens with an empty To: field.
 */
export function buildGmailUrl(to: string | null, subject: string, body: string): string {
  const q = new URLSearchParams({ view: "cm", fs: "1", to: (to ?? "").trim(), su: subject, body });
  // URLSearchParams encodes spaces as "+", which Gmail shows literally in some fields; use %20.
  return `https://mail.google.com/mail/?${q.toString().replace(/\+/g, "%20")}`;
}

/** Date of the follow-up reminder (YYYY-MM-DD): FOLLOW_UP_DAYS after today. */
export function followUpDate(today?: string): string {
  return addDays(today ?? todayISO(), FOLLOW_UP_DAYS);
}

/** Google Calendar "new event" link: all-day event on followUpDate(), prefilled. Nothing is downloaded. */
export function buildGcalUrl(p: { strongClaim: number; landlordName: string | null; today?: string }): string {
  const start = followUpDate(p.today);
  const end = addDays(start, 1); // all-day events end the next day (exclusive)
  const { title, details } = reminderText(p.strongClaim, p.landlordName);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start.replace(/-/g, "")}/${end.replace(/-/g, "")}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${q.toString().replace(/\+/g, "%20")}`;
}

/** Escape text for an iCalendar TEXT value. */
function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold lines longer than 75 chars (RFC 5545). Continuation lines start with a space. */
function icsFold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

export interface IcsInput {
  strongClaim: number;
  landlordName: string | null;
  today?: string; // YYYY-MM-DD, defaults to today
}

/** All-day reminder on followUpDate() (the deadline in the demand letter). */
export function buildIcs(p: IcsInput): string {
  const { title, details: description } = reminderText(p.strongClaim, p.landlordName);
  const start = followUpDate(p.today);
  const end = addDays(start, 1); // all-day events end the next day (exclusive)
  const ymd = (iso: string) => iso.replace(/-/g, "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DepositBack+//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:depositback-${Date.now()}@depositback.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(start)}`,
    `DTEND;VALUE=DATE:${ymd(end)}`,
    `SUMMARY:${icsEscape(title)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(icsFold).join("\r\n") + "\r\n";
}
