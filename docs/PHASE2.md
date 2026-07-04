# Phase 2 — Run & Verify Guide

## Goal

AgentMail email intake + BullMQ job queue with exponential backoff, DLQ, and job status UI.

## Prerequisites

1. **Phase 1 complete** — login, upload, Cloudinary, Neon working
2. **Redis** — local (`redis-server`) or managed (Upstash, Redis Cloud)
3. **AgentMail** — inbox `maniranjan@agentmail.to`, API key
4. **ngrok** (email intake only) — public URL so AgentMail can POST webhooks to your local app

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

> **Note:** `WEBHOOK_DOMAIN` is domain only — **no** `https://` prefix. The Next.js app does not read this for routing; it is optional documentation. Webhook delivery is configured in the **AgentMail dashboard** (see below).

## Install & setup

```powershell
npm install bullmq ioredis agentmail
npx prisma db push
```

## Run locally

### Dashboard upload only (no ngrok)

If you only test **dashboard upload** + job queue + DLQ, you do **not** need ngrok or AgentMail webhook setup.

```powershell
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — BullMQ worker
npm run worker
```

Use **Upstash Redis** or local `redis-server` — set `REDIS_URL` in `.env`.

### Full Phase 2 — dashboard + email intake (4 terminals)

Email intake requires a **public URL** because AgentMail servers cannot reach `localhost`.

```powershell
# Terminal 1 — Next.js (port 3000)
npm run dev

# Terminal 2 — BullMQ worker
npm run worker

# Terminal 3 — ngrok tunnel to Next.js
ngrok http 3000
# Or with a reserved domain:
# ngrok http --url=your-subdomain.ngrok-free.dev 3000
```

Copy the ngrok **Forwarding** URL (e.g. `https://997d-2a09-bac5-3ae8-1a96-00-2a6-48.ngrok-free.app`).

---

## AgentMail webhook setup (email intake)

Register the webhook in the **AgentMail dashboard** (not only in `.env`).

### Webhook URL format

Use the **full URL** with `https://` and the API path:

```
https://<your-ngrok-domain>/api/webhooks/agentmail
```

**Example:**

```
https://997d-2a09-bac5-3ae8-1a96-00-2a6-48.ngrok-free.app/api/webhooks/agentmail
```

| Setting | Correct? |
|---------|----------|
| Domain only in AgentMail | ❌ |
| `https://...ngrok-free.app` (root, no path) | ❌ — hits login page |
| `https://...ngrok-free.app/api/webhooks/agentmail` | ✅ |

### AgentMail dashboard settings

1. Open your AgentMail inbox settings for `maniranjan@agentmail.to`
2. Add webhook URL: `https://<ngrok-domain>/api/webhooks/agentmail`
3. Event type: **`message.received`**
4. Save

### `.env` vs AgentMail dashboard

| Where | What to put |
|-------|-------------|
| **`.env` `WEBHOOK_DOMAIN`** | Domain only, no `https://` (optional for Next.js) |
| **AgentMail webhook URL** | Full `https://` URL + `/api/webhooks/agentmail` (required) |

Do **not** use `/webhook` — that path was for the old `agent.py` prototype. Phase 2 uses `/api/webhooks/agentmail`.

---

## Test email intake → dashboard

1. Keep **all three** running: `npm run dev`, `npm run worker`, `ngrok http 3000`
2. Confirm AgentMail webhook URL matches your **current** ngrok URL (free ngrok URLs change unless you use a reserved domain)
3. Send an email to **`maniranjan@agentmail.to`**
4. **Attach a PDF** (or JPEG, PNG, WebP) — plain text without attachment is ignored (`no_valid_attachment`)
5. Watch the **`npm run dev` terminal** for `POST /api/webhooks/agentmail`
6. Watch the **worker terminal** for `processing job ...`
7. Open **`/dashboard`** and **refresh** — new row with source **email**, job status **Queued** → **Processing** → **Ready for Review**

### What you should see

| Location | Expected |
|----------|----------|
| Dev server logs | Webhook POST to `/api/webhooks/agentmail` |
| Worker logs | Job picked up and completed |
| Dashboard | COI from source `EMAIL`, sender email populated |
| Job Queue (`/dashboard/jobs`) | Matching job with status updates |

---

## Verification checklist

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Upload COI on dashboard | Job appears with status **Queued** → **Processing** → **Ready for Review** |
| 2 | Email PDF to `maniranjan@agentmail.to` | Webhook creates COI + job; visible on dashboard after refresh |
| 3 | Check Redis | Jobs present on `coi-jobs` queue during processing |
| 4 | Force worker error (test mode) | Retries with exponential backoff in logs |
| 5 | After max attempts | Job in `coi-jobs-dlq`; dashboard shows **DLQ** status |
| 6 | Retry from DLQ | Job re-enqueued to `coi-jobs` via **Retry** button on `/dashboard/jobs` |

---

## Troubleshooting email intake

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| No webhook hit in dev logs | Wrong URL in AgentMail | Use full `https://.../api/webhooks/agentmail` |
| Webhook hit, no COI created | No valid attachment | Attach PDF or image |
| COI created, stuck **Queued** | Worker not running | Run `npm run worker` |
| Worked before, stopped after restart | ngrok URL changed | Update AgentMail webhook with new ngrok URL |
| 500 on webhook | DB / Cloudinary / API key | Check Neon, Cloudinary, `AGENTMAIL_API_KEY` in `.env` |

---

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
- DLQ routing + inspection UI + manual retry
- Stub worker (no full AI — that's Phase 4)

## Deferred to later phases

- Full 5-agent AI pipeline (Phase 4)
- `send-template-email` on `coi-jobs` (Phase 5)
- `reminder-jobs` + node-cron (Phase 6)
- Checklist & versioning (Phase 3)
