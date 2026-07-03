# Phase 2 — Run & Verify Guide

## Goal

AgentMail email intake + BullMQ job queue with exponential backoff, DLQ, and job status UI.

## Prerequisites

1. **Phase 1 complete** — login, upload, Cloudinary, Neon working
2. **Redis** — local (`redis-server`) or managed (Upstash, Redis Cloud)
3. **AgentMail** — inbox `maniranjan@agentmail.to`, API key
4. **ngrok** — public URL for webhook (`WEBHOOK_DOMAIN`)

Add to `.env` (see README Environment Variables):

```env
REDIS_URL=redis://localhost:6379
BULLMQ_COI_QUEUE=coi-jobs
BULLMQ_COI_DLQ=coi-jobs-dlq
BULLMQ_REMINDER_QUEUE=reminder-jobs
BULLMQ_REMINDER_DLQ=reminder-jobs-dlq
JOB_MAX_ATTEMPTS=5
JOB_BACKOFF_DELAY_MS=5000
AGENTMAIL_API_KEY=...
INBOX_ID=maniranjan@agentmail.to
WEBHOOK_DOMAIN=your-subdomain.ngrok-free.dev
```

## Install & setup

```powershell
npm install bullmq ioredis agentmail
npx prisma db push
```

## Run (3 terminals + ngrok)

```powershell
# Terminal 1 — Redis
redis-server

# Terminal 2 — Next.js
npm run dev

# Terminal 3 — BullMQ worker
npm run worker

# Terminal 4 — ngrok webhook tunnel
ngrok http --url=your-subdomain.ngrok-free.dev 3000
```

Register webhook URL: `https://your-subdomain.ngrok-free.dev/api/webhooks/agentmail`

## Verification checklist

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Upload COI on dashboard | Job appears with status **Queued** → **Processing** → **Ready for Review** |
| 2 | Email PDF to `maniranjan@agentmail.to` | Webhook creates COI + job; visible on dashboard |
| 3 | Check Redis | Jobs present on `coi-jobs` queue during processing |
| 4 | Force worker error (test mode) | Retries with exponential backoff in logs |
| 5 | After max attempts | Job in `coi-jobs-dlq`; dashboard shows **DLQ** status |
| 6 | Retry from DLQ (if implemented) | Job re-enqueued to `coi-jobs` |

## Queues (Phase 2)

| Queue | Used in Phase 2? | Purpose |
|-------|------------------|---------|
| `coi-jobs` | Yes | `process-coi` from upload + webhook |
| `coi-jobs-dlq` | Yes | Failed COI jobs |
| `reminder-jobs` | No (Phase 6) | Renewal reminders |
| `reminder-jobs-dlq` | No (Phase 6) | Failed reminders |

## What Phase 2 includes

- AgentMail webhook → Neon + Cloudinary + enqueue `coi-jobs`
- Dashboard upload enqueues same job type
- `CoiJob` model + job status UI
- Exponential backoff retries
- DLQ routing + inspection UI
- Stub worker (no full AI — that's Phase 4)

## Deferred to later phases

- Full 5-agent AI pipeline (Phase 4)
- `send-template-email` on `coi-jobs` (Phase 5)
- `reminder-jobs` + node-cron (Phase 6)
- Checklist & versioning (Phase 3)
