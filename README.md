# DepositBack+

A California student renter uploads their landlord's security-deposit deduction statement. A small team of Claude agents reviews every charge under Civil Code §1950.5 (as amended by AB 2801), asks for photo evidence where it helps, rules on each charge, and then finishes the job: a demand letter, an email to the landlord, a day-14 calendar reminder, and a follow-up email draft.

## Setup

```bash
git clone <repo-url> && cd depositback
npm install
cp .env.example .env.local   # paste ANTHROPIC_API_KEY=...
npm run dev                  # http://localhost:3000
```

## Demo mode: `?demo=1`

Open **http://localhost:3000/?demo=1**. The wrappers in `lib/client.ts` skip the API and return the fixtures in `public/demo/*.json` after a fake delay (Clerk 2.5s, Courtroom 3s, Inspector 2s), so the live agent feed still animates. You don't need an API key or network. **Use this if anything breaks on stage.**

The API routes also fall back to the fixtures (with response header `x-demo-fallback: 1`) if Claude fails twice.

## File ownership (strict, to prevent merge conflicts)

| Owner | Files |
|---|---|
| **Builder A** (API / logic) | `app/api/**`, `lib/**`, `public/demo/**`, `package.json`, `package-lock.json`, `.env.example`, `README.md` |
| **Builder B** (UI) | `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/**`, `hooks/**` |

- Never edit the other builder's files after the first commit. Ask instead.
- **Need a dependency? Ask Builder A to add it** (A owns `package.json`).
- `lib/types.ts` is the shared contract. Changing it means telling everyone.

## How the UI uses it

```ts
import { runCase } from "@/lib/caseManager";

const result = await runCase(input, {
  onEvent: (e) => setEvents((prev) => [...prev, e]),      // live activity feed
  onNeedPhotos: (item) => askUserForPhotos(item),          // resolve PhotoPair, or null to skip
});
// result.letter, result.mailto, result.ics (download as .ics), result.followUpEmail, result.strongClaim …
```

### Events Builder B can render (`AgentEvent.payload`)
| When | Event | Payload |
|---|---|---|
| Clerk finishes | `clerk` / done | `lineItems`: render all charge cards immediately |
| Each argument arrives | `landlord_advocate` or `tenant_advocate` / done, `lineItemId` | `landlordArgument` / `tenantArgument` |
| Each ruling arrives | `judge` / done, `lineItemId` | `ruling`, `previousVerdict`, `newVerdict` |
| Photo verdict | `inspector` / done, `lineItemId` | `inspector`, `previousVerdict`, `newVerdict` |

`previousVerdict === newVerdict` means "confirmed by Judge/Inspector". Key courtroom UI by `lineItemId` (a retry can resend the same argument).

### Sample buttons
`loadSampleStatement()` and `loadSamplePhotos()` from `@/lib/client` return ready-to-use `FileInput` / `PhotoPair` (from `public/demo/*.jpg`).

### Routing
- Clerk routes each charge: `inspector` (photos would settle it), `courtroom` (contested), or `settled`.
- Only the **2 highest-dollar `courtroom` charges** go to court. All others keep the Clerk's verdict.
- Skipped photos mean the Clerk's verdict stands (never sent to court).
- `ENABLE_COURTROOM` in `lib/caseManager.ts` turns the court off entirely.
- `followUpEmail` is always `""` (dropped from scope).

`runCase` throws a clear `Error` if the Clerk can't read the statement or the case uses more than 60s of agent time (time waiting for the user's photos doesn't count). Every later agent failure becomes an `error` event and the case continues with the Clerk's preliminary verdicts.

## Agents

| Agent | What it does | Where |
|---|---|---|
| Case Manager | Orchestration in code, routes by the Clerk's `route` | `lib/caseManager.ts` |
| Clerk | Extracts charges + landlord info, gives a preliminary verdict and route | `app/api/clerk` |
| Landlord's / Tenant's Advocate | Argue each contested charge (run in parallel) | `app/api/courtroom` |
| Judge | Rules on each contested charge | `app/api/courtroom` |
| Inspector | Compares move-in vs move-out photos | `app/api/inspector` |
| Paralegal | Letter, mailto, .ics, follow-up email (pure code) | `lib/compute.ts` |

## 🚨 If the demo breaks on stage

| Symptom | Do this |
|---|---|
| Anything weird, slow, or erroring | Add **`?demo=1`** to the URL and rerun with "Use sample statement" + "Use sample photos". No API calls, same story, ~7s. |
| "We couldn't read the amounts…" | The photo is too blurry/small. Use the sample statement or a PDF. |
| Wrong API key / no credits / Claude down | The **sample** statement and photos still work (server falls back to `public/demo/*.json`). Other uploads show a "try again" card, never someone else's data. |
| Case takes >60s | `runCase` throws a timeout error; the error card offers demo mode. |

**Live timings** (Sonnet 5.5, measured): Clerk 7–12s, advocates 3s (parallel), Inspector 3–6s, Judge 3s → full case ~13–16s.

## Testing the API directly

```bash
npm run dev
# Clerk with the sample statement (expect 5 charges; header x-demo-fallback absent = real Claude)
python3 -c "import base64,json;print(json.dumps({'statement':{'mediaType':'image/jpeg','data':base64.b64encode(open('public/demo/statement.jpg','rb').read()).decode()},'depositAmount':2400,'moveOutDate':'2026-10-01','tenancyMonths':11,'tenantName':'Alex Chen'}))" > /tmp/clerk.json
curl -s -D - -X POST localhost:3000/api/clerk -H 'content-type: application/json' --data @/tmp/clerk.json
```

Server logs print one line per Claude call: `[claude] report_charges ok in 8587ms (attempt 1, …)`.

## Tests

```bash
npm test    # npx tsx lib/compute.test.ts: expects strongClaim 780, possibleClaim 2030, 27 days, late
```
