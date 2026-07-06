# Phase 5 — Admin Review, Email Automation & Operations UI

Phase 5 closes the COI loop: admins edit AI draft reports (including citations), outbound emails pass a final guardrail, templated tenant notifications go out via AgentMail, and accept/reject only when checklist and expiration rules pass.

## Prerequisites

- Phase 4 complete (AI pipeline, draft report on `CoiVersion`)
- `.env` with AgentMail (`AGENTMAIL_API_KEY`, `INBOX_ID`)
- Optional signatory placeholders: `EMAIL_SIGNATORY_NAME`, `EMAIL_SIGNATORY_TITLE`, `EMAIL_COMPANY_NAME`
- Worker + dev server running

## Setup

```bash
cd Email-agent
npm install --legacy-peer-deps
npx prisma db push
npx prisma generate
npm run worker   # seeds email templates on start
npm run dev
```

---

## Feature summary

### Core — Admin review & email

| Feature | Description |
|---------|-------------|
| **Editable draft report** | Summary, recommendation reason, missing items, tenant email body on COI detail |
| **Citations editor** | Add/edit/remove `{ claim, quote }` evidence pairs; persisted on `CoiVersion.draftReport` |
| **Accept / Reject** | Accept blocked until mandatory checklist PASS + valid expiration; reject requires reason |
| **Send email** | Render DB template + placeholders → output guardrail → AgentMail |
| **Admin-send output guardrail** | Final subject/body checked before every outbound send (Send, Accept, Reject) |
| **Email templates** | Admin CRUD at `/templates` with live preview |
| **Outbound audit** | `OutboundEmail` record per send (QUEUED / SENT / FAILED) |
| **Email signatures** | `{{signatory_name}}`, `{{signatory_title}}`, `{{company_name}}` from `.env` |

### Automation & guardrails

| Feature | Description |
|---------|-------------|
| **`guardrail_blocked` template** | Auto-email tenant when AI pipeline trips a guardrail |
| **Guardrail email service** | Parses tripwire, formats citations, persists block on version |
| **BullMQ `send-template-email`** | Async or sync compliance email jobs on `coi-jobs` |
| **Acceptance gates** | Mandatory checklist, expiry, 300-day term, expiration item PASS |

### Operations UI (Phase 5 additions)

| Feature | Description |
|---------|-------------|
| **Portfolio dashboard** | SaaS-style hero, stats cards, card-based submissions, search & filters |
| **COI detail workspace** | Two-column layout: PDF preview + pipeline / activity / review |
| **AI pipeline timeline** | Horizontal step timeline; click completed step → agent input/output dialog |
| **Tenant Activity** | `/tenants` — full timeline per sender (uploads, emails, AI steps, versions) |
| **SessionNavBar sidebar** | Hover-expand navigation |
| **Workspace header** | Breadcrumbs, product branding, stable SSR pathname |
| **Toasts** | Sonner toasts; delete confirm via toast (no `window.confirm`) |
| **Loading buttons** | Spinner on upload, send, accept, reject, delete |

### Reliability

| Feature | Description |
|---------|-------------|
| **Neon DB retry** | `withDbRetry` / `ensureDatabaseReady` for cold-start resilience |
| **Middleware `x-pathname`** | Stable breadcrumb hydration across layouts |

---

## Admin-send output guardrail

Runs in `lib/services/admin-outbound-guardrail.ts` before `sendTemplatedEmail()` sends via AgentMail.

**Checks on final rendered subject + body:**

1. Non-empty subject and body
2. Prompt-injection patterns
3. Unresolved `{{placeholders}}`
4. Internal-only leaks (`[Your Name]`, `Agent 5`, `draftReport`, etc.)
5. LLM tenant-email safety (stricter when admin supplied `customBody`)

**On block:** API returns `400`, UI shows red **Outbound email blocked by guardrail** banner; no email sent.

**Applies to:** Send email, Accept COI (approval email), Reject (rejection email), and worker-driven sends.

---

## Citations editor

On COI detail → **Admin review & email**:

- View AI-generated citations (`claim` + `quote` from COI)
- Add, edit, or remove citation rows
- Saved via `PATCH /api/coi/[id]/draft-report` with `citations[]`

---

## Acceptance gates (Accept COI)

Accept is **disabled** until:

1. Every **mandatory** checklist item = `PASS`
2. **Expiration date** present and **not in the past**
3. Policy term ≥ **300 days** (when effective date available)
4. Expiration checklist item = `PASS` (includes renewed COI after expiry)

---

## Email templates

| Key | When used |
|-----|-----------|
| `clauses_missing` | Checklist failures — admin Send |
| `all_matched` | All checklist passed — awaiting review |
| `invalid_document` | Not a COI |
| `approved` | Admin Accept |
| `rejected` | Admin Reject |
| `guardrail_blocked` | Pipeline guardrail trip — auto or admin |
| `missing_attachment` / `receipt_acknowledged` / `processing_error` | Phase 4 intake (editable in DB) |
| `renewal_reminder` | Template stored; **cron send = Phase 6** |

---

## Key files

| Path | Purpose |
|------|---------|
| `lib/services/review-actions.ts` | Accept, reject, send, draft update |
| `lib/services/acceptance-gates.ts` | Accept eligibility rules |
| `lib/services/admin-outbound-guardrail.ts` | Final outbound email guardrail |
| `lib/services/email-send.ts` | Guardrail → AgentMail → `OutboundEmail` |
| `lib/services/email-templates.ts` | Template CRUD + seed |
| `lib/services/guardrail-email.ts` | Guardrail trip → tenant notification |
| `lib/services/template-render.ts` | Placeholder + signature rendering |
| `lib/services/tenant-activity.ts` | Per-tenant activity aggregation |
| `lib/services/dashboard-stats.ts` | Portfolio stats for dashboard hero |
| `lib/workers/send-template-email.ts` | BullMQ email job handler |
| `components/coi/review-actions-panel.tsx` | Admin review, citations, guardrail UI |
| `components/coi/coi-pipeline-panel.tsx` | Live pipeline timeline |
| `components/coi/coi-portfolio.tsx` | SaaS portfolio submissions list |
| `components/dashboard/portfolio-hero.tsx` | Dashboard stats hero |
| `components/tenants/` | Tenant list + activity timeline |
| `components/templates/template-manager.tsx` | Template editor |
| `components/layout/workspace-header.tsx` | SaaS workspace breadcrumbs |
| `app/tenants/` | Tenant activity pages |
| `app/api/coi/[id]/accept` | Accept API |
| `app/api/coi/[id]/reject` | Reject API |
| `app/api/coi/[id]/send-email` | Send compliance email |
| `app/api/coi/[id]/draft-report` | Save draft + citations |
| `app/api/tenants` | Tenant activity API |

---

## How to test

### 1. Email templates page

1. Open **Email Templates** in sidebar → `/templates`
2. Select **Clauses / Items Missing**
3. Click **Preview with sample data** — placeholders should fill in
4. Edit subject/body → **Save template**

### 2. Clauses missing flow

1. Upload `coi-sample-noncompliant.pdf` (dashboard or email)
2. Wait for job **Ready for review**
3. On COI detail → **Admin review & email** panel
4. Confirm yellow banner: **Accept blocked** with failed checklist items
5. Edit citations and tenant email body if needed
6. Template = **Clauses / Items Missing** → **Send email**
7. Check AgentMail inbox / tenant email received

### 3. Outbound guardrail block

1. In tenant email body, leave `{{sender_name}}` unresolved or add `[Your Name]`
2. Click **Send email** — should block with guardrail error banner
3. Fix text → send succeeds

### 4. Guardrail blocked auto-email

1. Upload `coi-sample-guardrail-block.pdf`
2. Pipeline stops early → worker queues `guardrail_blocked` email to tenant
3. Check Tenant Activity for the event

### 5. Full accept flow (compliant COI)

1. Upload `coi-sample-compliant.pdf`
2. Wait for pipeline → all checklist **PASS**
3. Banner turns green: **Ready to accept**
4. Click **Accept COI** → status **ACCEPTED**, **Approved** email sent

### 6. Reject + resubmit

1. Enter rejection reason → **Reject & notify tenant**
2. Status **REJECTED**, tenant gets **Rejected** email
3. Use **Upload next version** → new version v2; pipeline re-runs

### 7. Tenant activity

1. Sidebar → **Tenant Activity** → `/tenants`
2. Open a tenant → full timeline (uploads, emails, AI steps)
3. Filter tabs: All, Uploads, Emails, AI steps, etc.

### 8. Automated tests

```bash
npm test -- lib/services/acceptance-gates.test.ts
npm test -- lib/services/admin-outbound-guardrail.test.ts
npm test -- lib/services/template-render.test.ts
npm test -- lib/services/guardrail-email.test.ts
```

---

## Exit criteria

> Admin edits draft (including citations) → outbound guardrail passes → sends **Clauses Missing** → tenant resubmits → pipeline re-runs → **all checklist PASS** + **valid future expiration** → admin **Accept** → **Approved** email with matched checklist summary.

---

## Not in Phase 5 (Phase 6)

- Renewal reminder cron (`node-cron` → `reminder-jobs`)
- Metrics dashboard (`/metrics`)
- Full immutable audit export UI
