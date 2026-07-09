# Phase 6 — Renewal, Metrics, Audit & Ops

Phase 6 adds automated renewal reminders, a live metrics dashboard, per-COI immutable audit export, and production-grade queue/cron operations tooling.

## Features

| # | Feature | Status | Deliverable |
|---|---------|--------|-------------|
| 1 | Expiry scan + renewal reminders | ✅ | `node-cron` → `reminder-jobs` at 30/14/7/3 days |
| 2 | Metrics dashboard | ✅ | `/metrics` + `GET /api/metrics` |
| 3 | Full audit export | ✅ | `GET /api/coi/[id]/audit-export` + UI button on COI detail |
| 9 | Worker concurrency | ✅ | Tunable COI + reminder worker parallelism |
| 10 | Email rate limiting | ✅ | BullMQ limiter on reminder worker |
| 11 | Distributed lock renewal | ✅ | Token-based Redis lock with TTL renewal |
| 12 | Retry + jitter | ✅ | Exponential backoff with 25% jitter |
| 13 | Queue monitoring | ✅ | `GET /api/queues/metrics` + Jobs dashboard panel |
| 14 | Health endpoints | ✅ | `/api/health`, `/database`, `/redis`, `/queue` |
| 15 | Structured logging | ✅ | JSON-style logs + Logfire spans + `CronScanLog` |
| 16 | DLQ dashboard | ✅ | Filter by queue, retry, dismiss, cron history |

## Admin email actions (async queue)

Accept, reject, and manual **Send email** on the COI review panel enqueue a `SEND_TEMPLATE_EMAIL` BullMQ job and return immediately. The worker sends via AgentMail in the background — the UI shows a toast right away (e.g. “COI accepted. Approval email is being sent.”) instead of waiting for AgentMail to finish.

## New schema

- `ReminderLog` — idempotent reminder tracking (`coiDocumentId` + `daysBefore` unique)
- `CoiVersion.expirationDate` — indexed expiry column for fast cron scans
- `CronScanLog` — persisted cron run metrics (duration, counts, errors, lock skips)

```bash
npm run db:push
```

## Environment variables

```env
# Core Phase 6
CRON_SCHEDULE=0 9 * * *
REMINDER_DAYS_BEFORE=30,14,7,3
MANUAL_REVIEW_MINUTES=20
HOURLY_RATE_USD=45
PLATFORM_COST_ANNUAL_USD=1200

# Ops optimizations (9–16)
WORKER_COI_CONCURRENCY=2
WORKER_REMINDER_CONCURRENCY=3
REMINDER_EMAIL_RATE_LIMIT_MAX=100
REMINDER_EMAIL_RATE_LIMIT_MS=60000
CRON_LOCK_TTL_SECONDS=1800
```

## Processes

Run three background processes alongside `npm run dev`:

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — BullMQ workers (COI + reminders)
npm run worker

# Terminal 3 — ngrok for AgentMail webhooks (local dev)
ngrok http 3000
```

## Verify

```bash
npm run db:push
npm run worker
npm run test:ops
```

---

## Feature details (9–16)

### 9. Worker concurrency

`WORKER_COI_CONCURRENCY` and `WORKER_REMINDER_CONCURRENCY` control parallel job processing per worker process.

### 10. Email rate limiting

Reminder worker uses BullMQ `limiter` (`REMINDER_EMAIL_RATE_LIMIT_MAX` per `REMINDER_EMAIL_RATE_LIMIT_MS` window).

### 11. Distributed lock (cron)

Renewal cron acquires a Redis lock with TTL renewal so only one scan runs across multiple cron instances.

### 12. Retry + jitter

Both COI and reminder workers use exponential backoff with 25% jitter (`lib/queue/backoff.ts`).

### 13. Queue monitoring

`GET /api/queues/metrics` returns waiting/active/completed/failed counts. Jobs dashboard shows live panel.

### 14. Health endpoints

Public probes: `/api/health`, `/api/health/database`, `/api/health/redis`, `/api/health/queue`.

### 15. Structured logging

Cron and reminder events log as structured JSON; optional Logfire integration; `CronScanLog` table persists scan results.

### 16. DLQ dashboard

Jobs page filters COI vs reminder DLQ, retry/dismiss actions, cron scan history table.

---

## API reference (Phase 6)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/metrics` | GET | Platform metrics snapshot |
| `/api/coi/[id]/audit-export` | GET | Full COI audit JSON export |
| `/api/queues/metrics` | GET | BullMQ queue counts |
| `/api/health` | GET | Liveness probe |
| `/api/health/database` | GET | Postgres connectivity |
| `/api/health/redis` | GET | Redis connectivity |
| `/api/health/queue` | GET | Queue connectivity |

---

## Renewal reminder flow

1. `node-cron` triggers daily scan (`CRON_SCHEDULE`, default 09:00).
2. Distributed lock prevents duplicate scans.
3. COIs expiring in 30/14/7/3 days get `reminder-jobs` enqueued.
4. Reminder worker sends templated email via AgentMail (rate-limited).
5. `ReminderLog` prevents duplicate sends for same document + day window.

---

## Metrics dashboard

`/metrics` shows compliance health, automation coverage, turnaround times, and ROI estimates from env-configured hourly rate and platform cost.

---

## Audit export

`GET /api/coi/[id]/audit-export` returns immutable JSON: document metadata, version, jobs, AI runs/steps, outbound emails, reminder logs, activity timeline, checklist/template snapshots.

Download button on COI detail page.
