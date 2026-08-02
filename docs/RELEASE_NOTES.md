# Release Notes

Plain-language summaries of each release, for stakeholders who don't need the full technical
changelog. See [CHANGELOG.md](../CHANGELOG.md) for the developer-facing version.

## v0.16.0 — Payment & Subscription Management

**What shipped:** EduPilot can now bill schools for their own subscription to the platform —
plans, invoices, online payments via Razorpay, and the day-to-day tools to manage all of it.

**For EduPilot staff (Platform Admin):**
- A new admin area to see every school's subscription status at a glance — who's active, who's on
  a trial, who's fallen behind on payment, and this month's revenue.
- Suspend or reactivate a school's account directly.
- Define and price subscription plans (Free/Basic/Pro/Enterprise), and control exactly which
  features each plan unlocks.
- Run monthly billing in batches, generating every school's invoice for the period in one action.
- Collection, outstanding-balance, and monthly revenue reports.

**For schools (School Admin):**
- See your invoices, pay them online (via Razorpay), and download PDF receipts and tax invoices.
- View your current plan, upgrade to a different one, or renew before it expires.
- See exactly which features your plan includes.
- Automatic email/in-app reminders before your subscription renews, if payment is overdue, and
  before your account would expire.

**What to know before relying on this:**
- Renewals aren't fully automatic yet — the system prepares the next invoice for you, but someone
  still needs to complete the payment. Full unattended auto-charging is a future improvement.
- The system that actually receives Razorpay's payment confirmations (the "webhook") is built and
  tested, but isn't connected to a live web address yet — that's the next piece of work.
- The three daily maintenance jobs (checking for expired trials, processing renewals, flagging
  overdue accounts) are built and ready, but nothing is scheduling them to run automatically yet.

**Nothing about any existing school feature changed.** This release only adds EduPilot's own
billing relationship with each school — it doesn't touch student records, fees, attendance, or
anything else already in use.

---

## v0.15.0 — Communication Hub

Adds message templates, a scheduling/retry queue for notifications, and delivery reporting on top
of the notification system every module already used. No new external email/SMS/WhatsApp service
is connected yet — the wiring is ready, but nothing goes out through a real provider this release.

## v0.14.0 — Finance & Accounts

A simple day-to-day cash and bank ledger for the school's own income and expenses — not a full
accounting system. Track money in and out, see running balances, and pull income/expense reports
by category or month.
