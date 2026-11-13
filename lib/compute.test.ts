// Run: npx tsx lib/compute.test.ts
// Checks the pure math against the demo fixtures.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildIcs, buildLetter, buildMailto, daysToStatement, isLate, mergeVerdicts, totals } from "./compute";
import type { ClerkResponse, CourtroomResponse, InspectorResponse } from "./types";

const load = <T>(name: string): T => JSON.parse(readFileSync(join(__dirname, "../public/demo", name), "utf8")) as T;
const clerk = load<ClerkResponse>("clerk.json");
const court = load<CourtroomResponse>("courtroom.json");
const photo = load<InspectorResponse>("inspector.json");

// li3 goes to the Inspector; the court takes the 2 highest-dollar contested charges (li4 $900, li2 $600).
// li1 and li5 keep the Clerk's verdict.
const rulings = court.rulings.filter((r) => r.lineItemId === "li4" || r.lineItemId === "li2");
const items = mergeVerdicts(clerk.lineItems, rulings, [photo]);

const { strongClaim, possibleClaim } = totals(items);
assert.equal(strongClaim, 780, "strongClaim");
assert.equal(possibleClaim, 2030, "possibleClaim");

const days = daysToStatement("2026-10-01", clerk.statementDate);
assert.equal(days, 27, "daysToStatement");
assert.equal(isLate(days), true, "isLate");
assert.equal(isLate(21), false, "21 days is on time");
assert.equal(daysToStatement("2026-10-01", null), null, "missing statement date");

assert.equal(items.find((i) => i.id === "li3")?.decidedBy, "inspector");
assert.equal(items.find((i) => i.id === "li2")?.decidedBy, "judge");
assert.equal(items.find((i) => i.id === "li5")?.decidedBy, "clerk");
assert.equal(items.find((i) => i.id === "li1")?.decidedBy, "clerk");

const letter = buildLetter({ clerk, items, moveOutDate: "2026-10-01", tenantName: "Alex Chen", strongClaim, days, late: true, today: "2026-11-13" });
assert.match(letter, /Dear Bayview Property Management,/);
assert.match(letter, /Please return \$780 within 14 days/);
assert.match(letter, /27 days after I moved out/);
assert.match(letter, /Carpet replacement \(8-year-old carpet\) — \$900:/);
assert.doesNotMatch(letter, /Broken window blinds/, "allowed items are not disputed");

const onTime = buildLetter({ clerk, items, moveOutDate: "2026-10-01", tenantName: "Alex Chen", strongClaim, days: 10, late: false });
assert.doesNotMatch(onTime, /21-day deadline/);

const mailto = buildMailto(clerk.landlordEmail, "Security deposit", letter);
assert.ok(mailto.startsWith("mailto:deposits@bayviewpm.example.com?subject=Security%20deposit&body="));

// Null landlord email -> empty To:
assert.ok(buildMailto(null, "S", "B").startsWith("mailto:?subject="));

// Null address / statement date / landlord name must not crash
const sparse = buildLetter({ clerk: { ...clerk, landlordName: null, propertyAddress: null, statementDate: null, landlordEmail: null }, items, moveOutDate: "2026-10-01", tenantName: "Alex Chen", strongClaim, days: null, late: false });
assert.match(sparse, /Dear Property Manager,/);
assert.match(sparse, /moved out of my rental unit/);

const ics = buildIcs({ strongClaim, landlordName: clerk.landlordName, today: "2026-11-13" });
assert.match(ics, /DTSTART;VALUE=DATE:20261127/);
assert.match(ics, /SUMMARY:Follow up on deposit — \$780/);

console.log("✓ compute tests passed: strongClaim 780, possibleClaim 2030, daysToStatement 27, isLate true");
console.log("\n--- letter preview ---\n" + letter);
