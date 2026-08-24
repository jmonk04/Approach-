# Approach

A single-file household budgeting app. Tracks discretionary spending against
self-set monthly ceilings, identifies recurring bills, and projects cash forward.

Live: `https://jmonk04.github.io/<repo>/`
Source: `index.html` — one file, no build step, no dependencies, no CDN calls.

---

## Why this exists

Commercial budgeting apps auto-categorize with false confidence and can't express
household-specific accounting rules. Approach inverts that: when it isn't sure, it
**stops and asks**, and holds the transaction out of every total until the question
is answered. That review queue is the point of the app, not a feature of it.

The tradeoff accepted: no automatic bank sync. Data arrives by import or paste.

---

## Deploying

1. Upload `index.html` to the repo root. The filename must be lowercase `index.html`
   — GitHub Pages is case-sensitive and `Index.html` returns 404.
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Updates: open `index.html` → pencil → select all → paste new version → Commit.
   Redeploys in about a minute.

On iPhone, open the URL and **Add to Home Screen** for a full-screen launch.

### Public repo is fine

The app ships no data. All transactions live in the browser's `localStorage` on the
device. A stranger who finds the URL gets an empty app. Do not put statements,
exports, balances, or account numbers in this repo.

---

## Accounting rules

These are decisions, not defaults. Changing them changes what the numbers mean.

| Rule | Behavior |
|---|---|
| Month assignment | By **transaction date**, never posting date |
| Refunds | Linked to the originating charge and applied to **that** month, day and category, up to 120 days back |
| Card payments | Detected on both sides and excluded — an Amex payment appears as a lump outflow at the bank *and* as individual charges on the card. Counting both doubles spending |
| Uncertain transactions | **Held out of every total** until resolved. Never silently guessed |
| Nothing is deleted | Duplicates and ambiguities are flagged for review, not dropped |
| Income | Larger of the stated take-home or detected deposits — never the sum, which would double-count |
| Sign convention | The **account** decides it. A file overrides only on overwhelming evidence, and says so when it does |

### Categories

Four discretionary ceilings, user-editable, plus any custom ones added in Plan:

- Groceries/Household
- Lifestyle/Personal
- Dining/Coffee
- Flex/Buffer *(a set amount for random/quasi-discretionary items — gifts, one-offs)*

Two non-discretionary categories, which come out **before** the ceilings and are not
counted against them:

- Housing
- Bills *(utilities, insurance, loans — one bucket, deliberately)*

### Standing rules

Target, Amazon, Costco, Walmart, and ~30 grocery chains always route to
Groceries/Household without asking. Category is settled; **amount is not** — an
outlier charge at those merchants still surfaces for review.

---

## Accounts and import

| Account | Sign convention | Paths |
|---|---|---|
| Amex | charges positive | CSV export; screenshot paste |
| Navy Federal | debits negative | OFX / QFX / QIF from desktop site; screen paste; declared bills |

Format is detected from the file. **Sign convention is not** — the account's declared
convention wins by default, because getting it backwards inverts every number
downstream and looks entirely plausible while doing it. The file only overrides the
label when it has at least 8 rows, at least 80% of them point one way, and that
direction contradicts the label. When an override does fire, the import toast names
it. If you ever see that message on a file you didn't expect it on, undo before
trusting anything.

**Navy Federal has no Amex-style CSV.** On a laptop, Account History → Download offers
OFX or QIF. On mobile, request the desktop site — the mobile site usually only gives
PDF. Failing that, copy the transaction rows off the screen and paste them.

**Cash on hand** is read from a running-balance column when the file has one, and from
`<LEDGERBAL>` in OFX/QFX, which is where the bank actually puts it — the balance never
appears on the individual transactions. QIF carries no balance at all; on that path,
projections start from zero until you import something that does.

**Screenshots**: iOS Live Text (long-press → Select All → Copy) produces real text.
The paste box reads stacked merchant/date/amount layouts and ignores app chrome.
Tick *"These are pending charges"* so posted versions replace the placeholders rather
than doubling them — handles exact matches, small authorization holds settling higher,
and tips up to 30% above the hold.

---

## Review queue triggers

A transaction is held when:

- The merchant has never been seen
- The amount is far outside that merchant's own history
- A refund has no charge to attach to
- It duplicates a transaction already on file — **including deposits and transfers**,
  which used to be waved through on type alone and quietly inflated detected income
- Same merchant, same day, close but unequal amount, over $25 *(catches re-imported
  overlapping statements)*

Resolving one writes a rule, so it asks once per merchant, not once per transaction.

---

## Recurring detection

Groups by normalized merchant, then looks for consistent spacing and amounts.
Three occurrences confirms; two shows as "suspected". Reports cadence, monthly
equivalent, next expected date, price changes, and no-shows.

Bills are split by behavior, not category:

- **Fixed** — same figure monthly (mortgage, insurance)
- **Varies** — shown with low/average/high and six months of bars (utilities)

Budget against the high figure. Averages hide the problem — a utility running
$215–$302 will leave you short in most months if you plan against $244.

**Declared bills** let you enter known charges directly. They count immediately and
stop counting separately the moment a real charge matches them.

---

## Glideslope

The primary visual. Cumulative discretionary spend against a linear burn from zero on
day 1 to the sum of the four ceilings on the last day. Above the line means spending
faster than plan. Dashed projection shows month-end landing.

Toggles between **Spent** and **Left** — Left inverts the line to descend toward zero,
fuel-gauge style, and reports end-of-month spare or shortfall.

Held transactions are explicitly **not** on the slope, with a note saying so. The line
should never quietly flatter you.

---

## Ceilings card

The same two readings as the glideslope, per category, on a **Pace / Left** toggle.

- **Pace** — the bar fills as you spend. Tick sits at the fraction of the month
  elapsed. Right-hand figure is your distance from plan.
- **Left** — the bar drains. Tick moves to `1 − pace`, so the read is unchanged in
  both modes: **fill past the tick is good.** Right-hand figure becomes the daily
  allowance for the days remaining — green if that's at or above your planned daily
  rate, amber if the rest of the month has to run leaner than plan.

Held money shows as a hatched band at the **tip** of the tank: not spent, but spoken
for. Only holds whose category is already settled are attributed to a ceiling. A new
or ambiguous merchant defaults to Flex/Buffer internally, and pinning it there would
be precisely the silent guess the review queue exists to prevent — those appear on the
header total only.

---

## Known gotchas

- **Variable merchants at regular intervals** can register as recurring (a weekly
  grocery run that happens to land monthly in sparse data). Tap the row to strike it.
- **Gas stations** authorize $1 and settle later, so pending data understates fuel for
  a day or two. A pending row is superseded by a real charge at the same merchant
  within 7 days if the amounts match, if the charge is up to 30% higher (tips), or if
  the pending row is $2 or less (authorization holds). That last threshold is
  deliberately tight — at $5 an unrelated $45 charge could swallow a pending coffee.
- **Storage is device-local.** No sync between phone and laptop. Export a backup from
  Data after any real import session.
- **Suggested targets** from history beat round numbers. Ceilings set well above actual
  behavior make the glideslope permanently flattering.
- **No undo on import.** A bad file has to be cleared row by row. Restore a backup
  instead if an import goes wrong.

---

## Corrections already made

Listed because they all produced plausible-looking wrong answers rather than visible
failures, and because a future reader should not reintroduce them.

- `resolve()` carried a block copy-pasted out of `assess()` referencing an
  out-of-scope `pool`. Any review-queue decision on a charge over $25 threw, after
  the transaction had already been marked resolved but before the save. The card
  stayed put and no rule was learned.
- Sign convention was inferred from a bare count of negatives over 60%, overriding
  the account label. A five-row bank export containing two paychecks read the
  mortgage as a refund and the paycheck as spending.
- OFX and QIF hardcoded a null balance, so cash on hand never populated on the
  primary Navy Federal download path and every projection started from zero.
- Duplicate detection ran after the type check, so re-imported deposits and transfers
  were never flagged.
- `S.settings` was a shallow copy of the defaults object, so learned rules wrote into
  the literal itself and survived "Erase everything."
- Backdated refunds plotted on the glideslope at their own date, producing a dip
  weeks before the charge they reversed.

---

## Working on this with an AI assistant

Paste this file at the start of a new conversation. It carries the decisions that
aren't inferable from the code — why refunds backdate, why card payments are excluded
twice, why Amazon is a standing rule but its amounts still get checked, why the
account label beats the file on sign convention.

Ask for changes as a full replacement `index.html`. Verify anything that touches
parsing or math against real data before trusting the numbers — several bugs in this
codebase produced plausible-looking wrong answers rather than visible failures, which
is the dangerous kind.
