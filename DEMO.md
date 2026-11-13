# DepositBack+ — Demo Script & Judge Prep

**Panel (4:00, Chou N100):** Jay Patel (Co-founder & CTO, VoiceBit) · Ajay Kamat (Partner, Pear VC) · Ye Wang (Founder & CEO, EverCurrent) · Ayush Malhotra (Co-founder, Talkhappi)

What to expect: two technical founders who will push on *does the AI actually work and how do you know*, a VC who will push on *market, wedge and risk*, and founders who will push on *the user and why they'd come back*. Every number below was measured today. Don't round up, and don't invent stats on stage.

---

## 0. Pre-flight (do at 3:45, not 3:59)

- [ ] Laptop plugged in, Wi-Fi on, **Do Not Disturb on**, notifications off
- [ ] `cd depositback && git pull && npm run dev` → open **http://localhost:3000** (fresh tab, zoom 125%)
- [ ] Signed into **Gmail + Google Calendar** in the same browser (Email/Reminder buttons open new tabs)
- [ ] Second tab ready: **http://localhost:3000/?demo=1** (the backup, already loaded)
- [ ] Finder window open at `public/demo/` (for the live "different statement" upload: `sunrise-statement.pdf`)
- [ ] Do ONE full live run at 3:45 to warm up the server (first request after start compiles routes and is slower)
- [ ] Tips: decide on/off (top-right toggle). Recommend **off** for the demo so bubbles don't cover content.
- [ ] Roles: **Presenter** talks, **Driver** clicks. Never the same person. Third person watches the clock and holds the backup tab.

---

## 1. The 3-minute demo

> Timings assume a ~15s live agent run (measured 13–16s). Narration is written to fill that wait. Don't stand in silence while agents work.

### 0:00–0:25 · Hook (Presenter, no screen yet)
> "Every year, students move out and get a letter like this." *(hold up / show the Bayview statement)*
> "$2,115 of their $2,400 deposit is gone: cleaning, repainting, new carpet. Most people just eat it, because fighting it means reading Civil Code §1950.5, figuring out which charges are illegal, and writing a legal letter. **DepositBack+ is a team of AI agents that does that whole job for you, and finishes it.**"

### 0:25–0:45 · Intake (Driver clicks)
- Click **Use sample statement** → fill: *Alex Chen · $2,400 · 11 months · Oct 1, 2026* → **Start my case**
> "Alex uploads the photo of the letter and four facts. That's all the user does."

### 0:45–1:20 · Agents working (talk over the live feed)
> "Watch the left side. That's a team of Claude agents, not one chatbot.
> The **Clerk** reads the statement, pulls out all five charges and the landlord's details, and gives each one a first verdict.
> It sees the statement was sent **27 days** after move-out. California's deadline is 21. That's already a problem for the landlord."
- Photo request pops up → click **Use sample photos**
> "For the $180 'wall hole' charge, photos would settle it. So the agent **asks the user for evidence**: move-in versus move-out."

> "Meanwhile the two biggest contested charges go to **court**. A Landlord's Advocate and a Tenant's Advocate argue in parallel, and then a **Judge** rules."

### 1:20–2:10 · The result (scroll slowly)
- Point at **$780 (up to $2,030)**
> "Strong claim: $780. Up to $2,030 if the questionable ones go Alex's way."
- Point at the **wall charge** with both photos
> "The Inspector compared the photos: light scuffs, no hole. That's normal wear, so it's **not allowed**. The landlord charged $180 for a hole that doesn't exist."
- Point at **In court → Carpet**
> "Both sides argued the $900 carpet. The Judge ruled it questionable: an 8-year-old carpet has to be prorated, not fully replaced. Every verdict cites the specific rule."
- Point at the **27-day banner**
> "And the late statement is flagged. In court that can count as bad faith."

### 2:10–2:45 · It finishes the job (the track!)
- Scroll to **Claude finished the job** → click **Email landlord** (Gmail draft opens) → back → click **Add reminder** (Calendar opens)
> "This is the part most AI tools skip. It doesn't just tell Alex what's wrong. It **writes the demand letter**, opens it as a **Gmail draft** addressed to the landlord, and puts the **14-day deadline on their calendar**. Alex reviews it and hits send. Two minutes, start to finish."

### 2:45–3:00 · Close
> "Five agent calls, about fifteen seconds, about ten cents. The math, dates and letter are plain code, never the model, so the numbers can't be made up. **DepositBack+ gets students their money back.**"

**If they give you 5 minutes:** after the close, do the **"not hardcoded" act** (§3): upload `sunrise-statement.pdf`, a different landlord with different charges, live.

---

## 2. Backup plan (rehearse this once)

| If… | Then… (Driver, don't apologize, keep talking) |
|---|---|
| Anything spins >25s, errors, or Wi-Fi dies | Switch to the **`?demo=1` tab** and rerun the same clicks. Same flow, about 6s, no network needed. Presenter: *"Let me show you the saved run so we stay on time."* |
| Gmail/Calendar tab asks to log in | Close it, click **Copy letter**, and say *"it opens as a Gmail draft. Here's the letter it writes."* |
| "We couldn't read the amounts…" | Only happens with a blurry upload. Use **Use sample statement**. (Turn it into a feature: *"it refuses to guess numbers it can't read."*) |
| Projector cuts off the right side | Zoom to 100%. The layout is responsive. |

---

## 3. The "is it hardcoded?" act (have this loaded and ready)

Upload **`public/demo/sunrise-statement.pdf`** → *Priya Patel · $2,000 · 14 months · Oct 20, 2026*.
- Different landlord (Sunrise Apartments, Davis), **6 charges**, a PDF instead of a photo, **no landlord email**, sent on time (14 days, so no late banner).
- **Two photo prompts will appear** (tile stain, repaint): click **Skip** on both. The sample wall photos don't match those charges.
- What happens (tested): the Clerk extracts all 6 amounts correctly and flags the **$150 "administrative fee" as not allowed**. The landlord also claims the tenant *owes* $285 beyond the deposit, and the letter handles that case ("Your statement keeps my full $2,000 deposit and says I owe $285 more…"). The Judge's exact rulings on rent/cleaning can vary run to run, so don't promise a specific total for this one.
- Say: *"Different landlord, different format, different charges. The Clerk reads whatever you give it. Demo mode is only a safety net for stage Wi-Fi."*

---

## 4. Tough questions & answers

### "Does the AI actually work?" (expect from Jay and the technical founders)

**Q: Why five agent calls instead of one prompt? Isn't this agent-washing?**
> Fair challenge. Three real reasons. (1) **Different inputs**: the Inspector needs two photos and the Clerk needs the statement. (2) **Adversarial structure**: forcing a landlord-side and a tenant-side argument before a ruling surfaces the best case for each, and the user sees *why*, not just a verdict. (3) **Cost control**: only the 2 highest-dollar contested charges go to court, and obvious ones are settled by the Clerk. The orchestration is plain code, not an LLM deciding what to do next, so it's predictable.

**Q: How do you stop it from hallucinating legal stuff or numbers?**
> - **Code does all math, dates and the letter.** The model never adds up a dollar amount. Totals, the 27-day calculation and the letter template are deterministic and unit-tested.
> - **Schema-enforced outputs**: every agent answers through a strict JSON schema, so no free text gets parsed.
> - **Closed rulebook**: agents may only apply six written rules from §1950.5, and every verdict cites which one.
> - **Refuses to guess**: we tested a blurry 160px statement. The first version *invented* a $1,200 charge, so we added unreadable detection, and now it rejects the upload and asks for a clearer photo (2/2 rejected; clear images still read perfectly).

**Q: How consistent is it? Run it twice, same answer?**
> We ran every agent 3× on the demo inputs: **identical verdicts every time** for the Clerk, Inspector and Judge. When we found drift (the carpet flipping between "questionable" and "not allowed") we pinned it with an explicit rule: old items that weren't prorated are questionable.

**Q: What model, what latency, what cost?**
> Claude Sonnet 5.5. Clerk 7–12s, advocates about 3s in parallel, Inspector 3–6s, Judge about 3s. **Full case about 13–16s, about $0.10.**

**Q: What happens when the API fails?**
> One retry per agent. If a later agent still fails, the case continues on the Clerk's verdict and the feed shows the error, so it never crashes mid-case. If the Clerk itself fails, the user gets a clear "try again". We never show someone else's data: the demo fallback only triggers for the sample file.

**Q: What does "finishes the task" actually mean here? It doesn't send the email.**
> On purpose. It does everything up to the irreversible step: analysis, letter, an addressed Gmail draft, and a calendar deadline. The human presses send. For a legal demand with your name on it, a human-in-the-loop final step is the right design, not a gap.

### "Is this a business?" (expect from Ajay / Pear)

**Q: Who's the user and why now?**
> College renters in California first: they move every year, have small deposits that matter a lot to them, and have no lawyer. *Why now*: AB 2801 added photo-documentation requirements for landlords, so there are more rules a landlord can break, and vision models can now actually compare move-in/move-out photos.
> *(Team: if you cite a market-size number, have a source on your phone. Don't guess.)*

**Q: How do you make money?** *(Hypotheses. Say them as hypotheses.)*
> Options we'd test: a free analysis with a small fee or a % of the recovered amount for the letter kit; distribution through **university housing offices / student unions** (B2B2C); later, the landlord side (pre-checking statements for compliance before sending).

**Q: What's the moat? Anyone can call an LLM.**
> Honestly, early on it's execution and distribution, not the model. Defensibility over time: (1) a growing dataset of real statements and which charges actually get refunded, which improves verdicts; (2) the move-in photo habit: if students document move-in *with us*, we own the evidence at move-out; (3) partnerships with campuses.

**Q: Isn't this the unauthorized practice of law? What about DoNotPay?**
> We're careful here. It's a **document assistant that applies the statute's published rules and shows its reasoning**. It doesn't represent anyone, says "not legal advice" on every result, and the user sends the letter themselves. Consumer legal AI has drawn regulator attention for *overclaiming* ("robot lawyer"), and we deliberately don't make those claims.

**Q: Why only California?**
> A focused wedge: one statute, one set of rules, testable. The architecture is the same in every state. The rulebook is a single prompt file, so adding a state means writing that state's rules and an eval set.

### "Would users come back?" (expect from Ye, Ayush and the other founders)

**Q: This is used once a year. Retention?**
> True for deposits. That's why the move-in side matters: guided move-in photos when you sign a lease, reminders before move-out, then the dispute flow. It's one renter journey, not a single moment.

**Q: What if the landlord ignores the letter?**
> That's what the calendar deadline is for. On day 14 the user comes back, and the app has a small-claims section ready (we show an SC-100 preview card). Next feature: a pre-filled follow-up and the small-claims packet.

**Q: What was the hardest bug?** *(technical judges love this. Pick one and tell it as a story.)*
> The blurry-photo hallucination: the model confidently invented a $1,200 repaint charge from a 160-pixel image. We caught it with a failure drill, added an "unreadable" field to the schema, and now it refuses rather than guesses. *Alternative:* the carpet verdict flip-flopping between runs, fixed by making the proration rule explicit and re-running 3× until stable.

**Q: What would you build next with more time?**
> (1) An eval set of 50+ real (anonymized) statements with known outcomes; (2) the move-in photo flow; (3) the small-claims packet; (4) more states.

---

## 5. Lines to avoid

- ❌ "It's a lawyer" / "guaranteed refund" / "legal advice" → ✅ "applies the statute and drafts the letter"
- ❌ Made-up stats ("70% of renters…") → ✅ only numbers in this doc, or ones you can source on the spot
- ❌ "It sends the email automatically" → ✅ "it opens a ready-to-send draft; you press send"
- ❌ Apologizing when switching to demo mode → ✅ "here's the saved run so we stay on time"

## 6. Numbers cheat sheet

| | |
|---|---|
| Demo case | Bayview · deposit $2,400 · $2,115 withheld · 5 charges |
| Result | **$780 strong claim, up to $2,030** · statement **27 days** late (limit 21) |
| Agents | Clerk · Landlord's Advocate · Tenant's Advocate · Judge · Inspector (+ Case Manager & Paralegal in plain code) |
| Model | Claude Sonnet 5.5 |
| Speed | full live case **~13–16s** · demo mode ~6s |
| Cost | **~$0.10 per case** |
| Stability | 3/3 identical verdicts per agent on demo inputs |
| Safety | math/dates/letter in code · strict schemas · 6-rule closed rulebook · refuses unreadable uploads |
