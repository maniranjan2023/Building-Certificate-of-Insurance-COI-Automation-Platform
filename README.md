# COI Compliance Automation Platform

> Every rental property needs proof of insurance. This platform replaces manual PDF review with automated intake, AI validation, and tenant communication — so landlords stay compliant without drowning in paperwork.

---

## Table of Contents

- [Why This Product Exists](#why-this-product-exists)
- [The Problem in Detail](#the-problem-in-detail)
- [Who This Is For](#who-this-is-for)
- [The Solution](#the-solution)
- [How It Works](#how-it-works)
- [Core Features](#core-features)
- [Multi-Agent AI Pipeline](#multi-agent-ai-pipeline)
- [Email Automation](#email-automation)
- [COI Versioning](#coi-versioning)
- [Checklist Engine](#checklist-engine)
- [Editable Email Templates](#editable-email-templates)
- [Metrics & ROI](#metrics--roi)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Phased Roadmap](#phased-roadmap)
- [Success Criteria](#success-criteria)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

---

## Why This Product Exists

When a landlord rents out a condo in Florida, a retail unit in Toronto, or an apartment building in Vancouver, the lease almost always requires one thing before keys are handed over: a **Certificate of Insurance (COI)**.

A COI is not the insurance policy itself. It is a one-page summary that proves the tenant (or their business) carries active liability coverage — and that the landlord is protected if something goes wrong on the property.

**That single document creates a recurring compliance burden that grows with every unit you own.**

| Portfolio size | COIs to manage per year | Manual effort (at ~20 min each) |
|----------------|-------------------------|----------------------------------|
| 10 units | ~20 (move-in + renewal) | ~7 hours |
| 50 units | ~100 | ~33 hours |
| 200 units | ~400 | ~133 hours (~17 working days) |

Most landlords and property managers still handle this the same way they did ten years ago: **email inboxes, PDF attachments, and a human opening every file by hand.** That process breaks the moment you scale beyond a handful of tenants.

**This product exists because COI compliance is mandatory, repetitive, high-risk, and completely unsuited to manual work at scale.**

---

## The Problem in Detail

### What landlords are legally and contractually required to verify

Before accepting a tenant — and again at every policy renewal — the landlord must confirm:

| Requirement | What can go wrong if missed |
|-------------|---------------------------|
| **Liability limits** | Coverage below lease minimum ($1M USD / $2M CAD) — landlord exposed in a claim |
| **Additional insured** | Landlord not named on the policy — no protection during incidents |
| **Policy dates** | Gap between expiry and renewal — property operates uninsured |
| **Required endorsements** | Missing waiver of subrogation or primary/non-contributory clause — lease violation |
| **Certificate holder** | Wrong name or address — document may not be legally binding |
| **Carrier validity** | Unknown or non-admitted insurer — coverage may not pay out |

Each COI is a PDF with different formatting from different insurers. No two look the same. A property manager must read every line, cross-check against the lease, and decide: accept or reject.

### What the current process looks like

```
Tenant emails COI PDF
        ↓
Email sits in shared inbox (hours or days)
        ↓
Property manager opens PDF manually
        ↓
Compares against checklist (spreadsheet / memory / lease binder)
        ↓
Maybe accepts, maybe sends vague "please fix" email
        ↓
Tenant resubmits — often the same mistake
        ↓
No one tracks when the policy expires
        ↓
Coverage lapses silently
        ↓
Incident happens — landlord discovers tenant was uninsured
```

This cycle repeats for **every tenant, every year, every property**.

### Where the current approach fails

| Failure | What happens | Real-world impact |
|---------|--------------|-------------------|
| **No central tracking** | COIs scattered across email threads | Documents lost; compliance status unknown |
| **Inconsistent review** | Different staff apply different standards | Some tenants slip through with deficient coverage |
| **Slow turnaround** | 15–30 minutes per COI, done when someone has time | Move-ins delayed; tenants frustrated |
| **Vague rejections** | "Your COI is not acceptable" with no specifics | Tenants resubmit wrong documents; cycle repeats |
| **No version history** | Re-submissions treated as new emails | No record of what was wrong or what changed |
| **No expiry monitoring** | Nobody tracks renewal dates proactively | Properties operate with lapsed coverage |
| **No audit trail** | Decisions made in email, not logged | Disputes, lender audits, and legal claims become unwinnable |

### The cost is not just time — it is uncovered liability

**In the USA (e.g. Florida, Texas):**
- Slip-and-fall or property damage claim hits an uninsured tenant → landlord's own policy may not cover it
- Lenders and HOAs require proof of tenant insurance — non-compliance blocks refinancing or sale
- Lease default grounds if tenant fails to maintain required coverage
- Florida condo associations and property managers often require COIs before tenant move-in

**In Canada (e.g. Ontario, British Columbia):**
- Commercial and residential leases require tenants to carry liability insurance and name the landlord as additional insured
- Condo corporations and property management firms mandate COIs for vendors, contractors, and commercial tenants
- Provincial tenancy and commercial lease standards tie insurance proof to ongoing compliance
- Uninsured contractor or tenant incident → landlord bears the financial and legal burden

> **One missed clause on one tenant's COI can cost more than a year of property management fees.**

Spreadsheets, shared inboxes, and manual PDF review do not fail because people are careless. They fail because **the process was never designed to scale**.

---

## Who This Is For

- **Individual landlords** managing 5–50+ rental units across one or more properties
- **Property managers** handling COI compliance for multiple owners
- **Small portfolio operators** who need one place to see what is compliant, what is expiring, and what was rejected

At launch, a **single admin login** runs the entire platform — upload, review, approve, and configure. No complex role hierarchy until the product matures.

---

## The Solution

### One platform. Full COI lifecycle. Minimal manual work.

This product replaces the broken email-and-spreadsheet workflow with a **single automated pipeline** — from the moment a tenant sends a COI to the moment compliance is tracked on a live dashboard.

```
BEFORE (today)                          AFTER (this platform)
─────────────────                       ─────────────────────
Email inbox full of PDFs        →       Dedicated intake (email + dashboard)
Someone opens each PDF by hand  →       AI reads, extracts, and validates
Checklist in someone's head     →       Editable checklist enforced on every doc
Vague rejection emails            →       Specific deficiency emails (editable templates)
Re-submissions get lost           →       Version history per tenant (v1, v2, v3…)
Nobody tracks expiry              →       Auto reminders at 30 / 15 / 7 days
No compliance visibility          →       Live dashboard with metrics and audit trail
```

### How each problem maps to a product capability

| Problem today | How this product solves it |
|---------------|---------------------------|
| COIs lost in email threads | Dedicated inbox (`maniranjan@agentmail.to`) + dashboard — every document stored in Cloudinary with a database record |
| Manual PDF review takes 15–30 min each | Multi-agent AI pipeline reads the document, extracts fields, and compares against your checklist in minutes |
| Inconsistent review standards | Same editable checklist applied to every COI — no human variance in what gets checked |
| Vague rejection emails | Editable email templates with exact missing items, rejection reasons, and policy details |
| Re-submissions treated as new cases | COI versioning per sender — v1 rejected, v2 re-uploaded, full history and comparison |
| No expiry tracking | AI extracts expiry date; automatic renewal reminders; expired COIs flagged non-compliant |
| No audit trail | Every upload, AI step, email, and admin decision logged with timestamps |
| No portfolio visibility | Metrics dashboard — compliance %, expiring soon, ROI, turnaround time |

### The end-to-end flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTAKE                                    │
│  Tenant emails COI  ──┐                                         │
│  Admin uploads COI  ──┼──►  Store in Cloudinary  ──►  Queue job │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI REVIEW (automated)                          │
│  Classify document → OCR if needed → Extract fields →           │
│  Compare checklist → Flag risks → Generate recommendation       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   HUMAN REVIEW (2 min, not 20)                     │
│  Admin sees AI summary + risks + recommendation →               │
│  Accept or Reject with reason                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TENANT COMMUNICATION (automated)               │
│  Approved → acceptance email                                    │
│  Rejected → deficiency email with exact missing items            │
│  Missing attachment → request email                             │
│  Expiring soon → renewal reminder with policy details           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   COMPLIANCE TRACKING (always on)                │
│  Dashboard status · Expiry monitoring · Metrics · Audit log     │
└─────────────────────────────────────────────────────────────────┘
```

### The core principle

**You define the compliance rules once — in the checklist and email templates. The system enforces them on every document, forever.**

- AI does the reading and comparison
- Admin does the final decision (accept / reject)
- Tenants get clear, specific communication automatically
- Nothing expires without a reminder
- Every action is logged

**Result:** Review time drops from ~20 minutes to ~2 minutes per COI. Compliance becomes visible, consistent, and auditable — not a guessing game in a shared inbox.

---

## How It Works

### Intake (two channels, one pipeline)

1. **Email** — Tenants forward COIs to `maniranjan@agentmail.to`. AgentMail webhook delivers body + attachments to the backend.
2. **Dashboard** — Admin uploads COIs directly from the web UI.

Both paths create a database record, upload the file to **Cloudinary**, and enqueue a **BullMQ** job. Same processing. Same standards. No channel bias.

### Processing (multi-agent AI)

A chain of specialized AI agents runs **sequentially** (Groq models via OpenAI SDK):

1. **Document Agent** — Is this a valid COI? OCR if scanned.
2. **Extraction Agent** — Carrier, limits, dates, named insured, policy number, endorsements.
3. **Checklist Agent** — Every requirement pass/fail against your editable checklist.
4. **Risk & Gap Agent** — Missing mandatory clauses, low-confidence fields, compliance risks.
5. **Report Agent** — Summary, accept/reject recommendation, citations, confidence score.

### Human-in-the-loop

AI **recommends**. Admin **decides**.

Accept or reject with a reason. Rejection triggers a detailed, templated email listing exactly what's wrong.

### Versioning

Tenant uploads → rejected → uploads again?

That's **Version 2** (not a new case). Full history per sender. Compare what changed. Never lose the original.

### Renewal

AI extracts expiry date. Automatic reminders at **30, 15, and 7 days**. Expired COIs flagged **non-compliant** until a new version is accepted.

---

## Core Features

### 1. Admin Login (Simple)

- Single admin account with full platform access
- No multi-role system at launch (Executive, Department Head, Auditor deferred)
- JWT-based session authentication

### 2. COI Dashboard

- Upload COIs manually from the web UI
- Receive COIs via forwarded email
- Search, filter, and sort all submissions
- Status tracking:
  - **Pending Review** — AI done or in progress, awaiting admin
  - **Accepted** — Admin approved
  - **Rejected** — Admin rejected with reason
  - **Expiring Soon** — Within 30-day renewal window
  - **Expired** — Past expiry date, non-compliant
- View documents inline (served from Cloudinary)
- View AI review results (risks, missing items, summary, recommendation)
- Internal notes per COI
- Event timeline (upload → AI → decision → emails → reminders)
- Export compliance data

### 3. Cloudinary Document Storage

- Every COI version stored in Cloudinary
- Original file never overwritten
- Secure URL + metadata stored in Neon PostgreSQL
- Supports PDF and common document formats

### 4. COI Versioning (Per Sender)

- Each tenant/sender has one COI case with multiple versions
- **Version 1** uploaded → rejected → **Version 2** re-uploaded → tracked independently
- Side-by-side version comparison (what changed between uploads)
- Latest version = current active submission
- Older versions preserved in full history
- Timeline per version: upload → AI review → decision → re-upload

### 5. Editable Checklist Engine

- Dedicated **Checklist** section in admin
- View all checklist requirements
- **Add** new requirements
- **Edit** existing requirements (name, expected value, mandatory flag, category)
- **Delete / disable** requirements
- Optional import from PDF, DOCX, or CSV as a starting point
- Checklist is the source of truth for every AI review

Each checklist item contains:

| Field | Description |
|-------|-------------|
| Requirement | Name of the clause or field to verify |
| Expected Value | What the value should be (e.g. "$1M", "Landlord name") |
| Mandatory | Whether failure blocks acceptance |
| Category | Grouping (e.g. Liability, Dates, Endorsements) |

### 6. BullMQ Job Processing

- Unified queue for **dashboard upload** and **email intake**
- Same job type, same pipeline, regardless of source
- Job statuses:
  - **Queued** — Waiting to be picked up
  - **Processing** — AI agent chain running
  - **Ready for Review** — AI complete, awaiting admin
  - **Failed** — Error occurred, can be retried
- Failed jobs retried automatically
- Real-time status visible on dashboard

### 7. AgentMail Email Intake

- Monitors `maniranjan@agentmail.to`
- Webhook receives email body + attachments on `message.received`
- Missing attachment → immediate templated reply
- Valid attachment → acknowledge receipt, upload to Cloudinary, enqueue BullMQ job
- All emails linked to COI record and version on dashboard
- Outbound replies sent via AgentMail API

### 8. Multi-Agent AI Review

- Sequential specialist agents (not one monolithic prompt)
- Document classification and OCR for scanned PDFs
- Structured field extraction (carrier, limits, dates, policy #, named insured)
- Checklist comparison with per-item pass/fail
- Risk detection and missing clause identification
- Confidence scoring per finding
- AI summary with source citations
- Accept/reject recommendation for admin

### 9. Admin Review & Decision

- Review full AI output per COI version
- **Accept** or **Reject** with mandatory rejection reason
- Decision applies to that specific version
- If rejected, sender can submit a new version (creates next version number)
- All decisions logged permanently in audit trail
- Triggers appropriate email template automatically

### 10. Editable Email Templates

Admin-editable templates with defined placeholders for every scenario. Preview with sample data before saving.

| Template | When Sent |
|----------|-----------|
| **Missing Attachment** | Email received with no COI file attached |
| **Receipt Acknowledged** | Valid attachment received, processing started |
| **Clauses / Items Missing** | Checklist failed — lists exactly what's missing or not found |
| **All Matched — Awaiting Review** | Checklist passed — waiting for admin decision |
| **Approved** | Admin accepted — includes matched checklist summary |
| **Rejected** | Admin rejected — includes rejection reason + deficient items |
| **Renewal Reminder** | 30 / 15 / 7 days before expiry — policy details + resubmit instructions |
| **Processing Error** | Job failed — notify sender of delay |

**Available placeholders:**

| Placeholder | Description |
|-------------|-------------|
| `{{sender_name}}` | Tenant/sender display name |
| `{{sender_email}}` | Tenant email address |
| `{{property_name}}` | Property or unit identifier |
| `{{expiry_date}}` | Policy expiration date |
| `{{policy_number}}` | Insurance policy number |
| `{{carrier_name}}` | Insurance carrier name |
| `{{missing_items}}` | List of failed/missing checklist items |
| `{{rejection_reason}}` | Admin's rejection reason |
| `{{version_number}}` | Current COI version (v1, v2, etc.) |
| `{{submission_date}}` | Date COI was received |
| `{{matched_items}}` | List of passed checklist items |
| `{{ai_summary}}` | AI-generated document summary |

### 11. Expiry & Renewal Engine

- Expiry date extracted by AI from each accepted COI
- Scheduled reminders at **30, 15, and 7 days** before expiry
- Uses **Renewal Reminder** email template with full policy details
- Expired COIs marked **non-compliant**
- Non-compliant until new version uploaded and accepted by admin

### 12. Metrics Dashboard

| Widget | Description |
|--------|-------------|
| Portfolio Compliance % | % of active COIs that are accepted |
| Total COIs | All COIs ever received |
| Active COIs | Accepted and not yet expired |
| Rejected COIs | Count of rejected submissions |
| Expiring Soon | COIs within 30-day window |
| ROI | Return on platform investment |
| Cost Savings | Dollar value of hours saved |
| Capacity Created | Total hours freed from manual review |
| Agent Response Time | AI processing speed |
| Compliance Resolution Time | End-to-end cycle time |
| Workload Automation % | % of reviews handled without manual PDF reading |

### 13. Audit & Compliance History

- Immutable original documents in Cloudinary (never overwritten)
- Full audit log:
  - Document uploads (dashboard + email)
  - BullMQ job lifecycle
  - Each AI agent step and output
  - Emails sent (template used, recipient, timestamp)
  - Admin decisions (accept/reject + reason)
  - Checklist changes
  - Email template edits
- Complete timeline per COI and per sender

---

## Multi-Agent AI Pipeline

```
┌─────────────────┐
│  COI Document   │  (PDF upload or email attachment)
└────────┬────────┘
         ▼
┌─────────────────┐
│  Agent 1        │  Document classification + OCR
│  Document/OCR   │  → Is it a COI? Extract raw text.
└────────┬────────┘
         ▼
┌─────────────────┐
│  Agent 2        │  Structured field extraction
│  Extraction     │  → Carrier, limits, dates, insured, policy #
└────────┬────────┘
         ▼
┌─────────────────┐
│  Agent 3        │  Checklist comparison
│  Checklist      │  → Pass/fail per requirement, missing clauses
└────────┬────────┘
         ▼
┌─────────────────┐
│  Agent 4        │  Risk & gap analysis
│  Risk & Gaps    │  → Mandatory failures, confidence flags
└────────┬────────┘
         ▼
┌─────────────────┐
│  Agent 5        │  Final report
│  Report         │  → Summary, recommendation, citations
└────────┬────────┘
         ▼
┌─────────────────┐
│  Admin Review   │  Accept / Reject → Email → Dashboard
└─────────────────┘
```

### Agent Details

| Agent | Input | Output | Early Exit |
|-------|-------|--------|------------|
| **Document/OCR** | Raw PDF/file | Clean text, document type, OCR if scanned | Stops chain if not a COI |
| **Extraction** | Clean text | Structured JSON: carrier, limits, dates, policy #, insured | — |
| **Checklist** | Extracted fields + checklist rules | Per-item pass/fail, missing clauses list | — |
| **Risk & Gaps** | Checklist results + extracted fields | Risk flags, mandatory failures, confidence scores | — |
| **Report** | All prior agent outputs | Summary, recommendation, citations, overall confidence | — |

Each agent's output is stored independently in the database — full transparency, full auditability.

**AI Provider:** Groq LLM models accessed via OpenAI SDK (compatible API).

---

## Email Automation

Tenants never need to log in. They email COIs. The system handles the rest.

```
Tenant emails COI to maniranjan@agentmail.to
      │
      ├─ No attachment?     → "Please resend with your COI attached"
      ├─ Attachment received → "Received, we're reviewing your COI"
      ├─ Checklist failed   → "Missing: [detailed list of deficiencies]"
      ├─ Checklist passed   → "Under review, we'll confirm shortly"
      ├─ Admin approved     → "Your COI has been accepted"
      ├─ Admin rejected     → "Rejected: [reason + what to fix]"
      ├─ Expiry approaching → "Your COI expires on [date], please renew"
      └─ Processing error   → "We're experiencing a delay, hang tight"
```

All templates are **editable by admin** with live placeholder preview.

---

## COI Versioning

### Example lifecycle for one tenant

```
Sender: john@tenant.com
Property: Unit 4B, Oak Street Apartments

Version 1 (Jan 5)
  ├── Uploaded via email
  ├── AI: Missing additional insured clause
  ├── Admin: REJECTED — "Landlord not listed as additional insured"
  └── Email: Rejection template sent with missing items

Version 2 (Jan 12)
  ├── Re-uploaded via email
  ├── AI: All checklist items pass
  ├── Admin: ACCEPTED
  └── Email: Approval template sent

Version 3 (Dec 1 — renewal)
  ├── Uploaded before expiry
  ├── AI: Processing...
  └── Status: Pending Review
```

- All versions visible in dashboard under one sender record
- Compare v1 vs v2 to see what the tenant fixed
- Only the latest accepted version counts as compliant
- Expired versions do not count toward compliance %

---

## Checklist Engine

### Default checklist categories

| Category | Example Requirements |
|----------|---------------------|
| **General Liability** | Minimum limit ($1M / $2M), occurrence vs aggregate |
| **Additional Insured** | Landlord named as additional insured |
| **Policy Dates** | Effective date, expiration date, covers lease term |
| **Endorsements** | Waiver of subrogation, primary & non-contributory |
| **Carrier** | AM Best rating, admitted carrier |
| **Certificate Holder** | Correct landlord name and address |

### How matching works

1. AI extracts values from the COI document
2. Each checklist requirement is compared against the extracted value
3. Result per item: **Pass**, **Fail**, or **Not Found**
4. Mandatory failures block acceptance
5. All results stored and shown to admin with citations

---

## Editable Email Templates

Templates are stored in the database and editable from the admin settings page.

### Template editor features

- Rich text or plain text editing
- Placeholder picker (insert `{{placeholder}}` with one click)
- Live preview with sample data
- Version history of template changes (audit log)

### Example: Rejection template

```
Hi {{sender_name}},

Thank you for submitting your Certificate of Insurance for {{property_name}}.

After review, we were unable to accept your COI (Version {{version_number}}) for the following reasons:

{{rejection_reason}}

Missing or deficient items:
{{missing_items}}

Please correct these issues and resubmit your updated COI by replying to this email with the corrected document attached.

Best regards,
Property Management
```

---

## Metrics & ROI

### Calculations

| Metric | Formula | Why It Matters |
|--------|---------|----------------|
| **Compliance %** | `(Accepted Active COIs ÷ Total Active COIs) × 100` | Portfolio health at a glance |
| **ROI** | `(Total Savings ÷ Platform Cost) × 100` | Justify the platform to stakeholders |
| **Cost Savings** | `Hours Saved × Hourly Rate` | Quantify manual work eliminated |
| **Capacity Created** | `Total Hours Saved` | PM time freed for higher-value work |
| **Working Days Saved** | `Hours Saved ÷ 8` | Executive-friendly reporting |
| **Agent Response Time** | `AI Completion Time − Email Received Time` | Tenant experience SLA |
| **Compliance Resolution Time** | `Final Acceptance Date − First Submission Date` | End-to-end cycle time |
| **Workload Automation %** | `(COIs reviewed by AI only ÷ Total COIs) × 100` | How much manual PDF reading was eliminated |

### Definitions

- **Active COI** = Accepted and not yet expired
- **Expiring Soon** = Expiry within the 30-day reminder window
- **Expired** = Past expiry date; treated as non-compliant until replaced and accepted

### Example ROI

```
200 tenants × 20 min manual review = 66+ hours per renewal cycle
At $50/hr = $3,300 saved per cycle
× 2 renewal cycles/year = $6,600/year in labor savings
Before counting risk reduction from missed expiries
```

---

## Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui | Admin dashboard, COI viewer, checklist editor, template editor, metrics |
| **Backend** | TypeScript (Node.js), Fastify or Express | REST API, webhooks, business logic, auth |
| **Database** | Neon PostgreSQL | COI records, versions, checklist, templates, audit logs, metrics |
| **ORM** | Prisma or Drizzle | Schema management, migrations, type-safe queries |
| **File Storage** | Cloudinary | Immutable COI originals, secure URLs, PDF delivery |
| **Job Queue** | BullMQ + Redis | Async AI processing for all intake channels |
| **AI** | OpenAI SDK → Groq LLM | Multi-agent sequential pipeline |
| **Email** | AgentMail (`maniranjan@agentmail.to`) | Inbound COI intake + outbound templated replies |
| **Auth** | JWT | Single admin session |

---

## Architecture Overview

```
                    ┌──────────────────────────────────────┐
                    │           Next.js Frontend           │
                    │  Dashboard · Checklist · Templates │
                    │  Metrics · COI Viewer · Notes        │
                    └──────────────────┬───────────────────┘
                                       │ REST API
                    ┌──────────────────▼───────────────────┐
                    │        TypeScript Backend            │
                    │  Auth · COI CRUD · Webhooks · Jobs   │
                    └──┬──────────────┬──────────────┬─────┘
                       │              │              │
              ┌────────▼───┐  ┌───────▼──────┐  ┌───▼────────┐
              │ Neon PG    │  │  Cloudinary  │  │   BullMQ     │
              │ (records)  │  │  (documents) │  │   (jobs)     │
              └────────────┘  └──────────────┘  └───┬──────────┘
                                                     │
                              ┌──────────────────────▼──────────┐
                              │     Multi-Agent AI Workers      │
                              │  Groq LLM via OpenAI SDK        │
                              │  Agent 1 → 2 → 3 → 4 → 5       │
                              └──────────────────────┬──────────┘
                                                     │
                              ┌──────────────────────▼──────────┐
                              │  AgentMail (inbound + outbound) │
                              │  maniranjan@agentmail.to        │
                              └─────────────────────────────────┘
```

### Design Principles

- **Single pipeline** — email and dashboard intake converge at BullMQ; no duplicate logic
- **Immutable documents** — Cloudinary stores originals; new versions are new uploads, not overwrites
- **Human-in-the-loop** — AI recommends; admin decides; tenants are never auto-accepted without review
- **Audit everything** — every agent step, email, and decision is logged with timestamp
- **Sequential agents** — each agent has one job; output feeds the next; early exit on invalid documents
- **Editable config** — checklist and email templates managed by admin without code changes

### Data Flow

```
1. INTAKE
   Email (AgentMail webhook) ──┐
                               ├──► Create COI record in Neon
   Dashboard upload ───────────┘    Upload file to Cloudinary
                                    Enqueue BullMQ job

2. PROCESSING (BullMQ Worker)
   Job picked up ──► Agent 1 (Document/OCR)
                 ──► Agent 2 (Extraction)
                 ──► Agent 3 (Checklist)
                 ──► Agent 4 (Risk/Gaps)
                 ──► Agent 5 (Report)
                 ──► Save all outputs to Neon
                 ──► Update status: Ready for Review
                 ──► Send "Awaiting Review" or "Items Missing" email

3. ADMIN REVIEW
   Admin views AI results ──► Accept or Reject with reason
                          ──► Send Approved or Rejected email
                          ──► Update COI status
                          ──► Log decision in audit trail

4. RENEWAL (Scheduled Jobs)
   Daily cron ──► Check expiry dates
              ──► Send 30/15/7 day reminders
              ──► Mark expired COIs as non-compliant
              ──► Update metrics dashboard
```

---

## Phased Roadmap

Each phase delivers a working increment. 2–3 features per phase, ordered by dependency and complexity.

---

### Phase 1 — Foundation

**Complexity: Low · Estimated: 1–2 weeks**

| # | Feature | Deliverable |
|---|---------|-------------|
| 1 | Admin login | Secure single-admin auth on Next.js + TypeScript API with JWT |
| 2 | Neon DB + Cloudinary | Schema design, COI record model, file upload to Cloudinary |
| 3 | Basic COI dashboard | Upload COI, list all submissions, view document, basic status |

**Problem solved:** Admin can log in, upload a COI, and see it stored securely. No more lost PDFs in email threads.

**Exit criteria:** Upload a PDF → appears in dashboard → opens from Cloudinary URL.

---

### Phase 2 — Intake & Job Queue

**Complexity: Medium · Estimated: 1–2 weeks**

| # | Feature | Deliverable |
|---|---------|-------------|
| 1 | AgentMail webhook | `maniranjan@agentmail.to` receives emails + attachments → Neon + Cloudinary |
| 2 | BullMQ pipeline | Dashboard upload and email intake both enqueue the same job type |
| 3 | Job status UI | Real-time Queued / Processing / Ready / Failed on dashboard |

**Problem solved:** Tenants can email COIs directly. Both intake channels feed one reliable processing queue.

**Exit criteria:** Email a COI to the inbox → job appears on dashboard → status updates as it processes.

**Note:** Builds on existing `agent.py` AgentMail webhook pattern — migrated to TypeScript backend.

---

### Phase 3 — Checklist & Versioning

**Complexity: Medium · Estimated: 1–2 weeks**

| # | Feature | Deliverable |
|---|---------|-------------|
| 1 | Editable checklist | Admin UI to add, edit, delete requirements with mandatory flags and categories |
| 2 | COI versioning | Per-sender version history (v1, v2, v3), compare versions side by side |
| 3 | Job-to-version linking | Every queue job tied to correct sender and version number |

**Problem solved:** Repeat submissions from the same tenant are tracked cleanly. Landlord defines compliance rules once.

**Exit criteria:** Reject v1 → tenant resubmits → v2 appears linked to same sender with full history.

---

### Phase 4 — Multi-Agent AI Pipeline

**Complexity: High · Estimated: 2–3 weeks**

| # | Feature | Deliverable |
|---|---------|-------------|
| 1 | Document + OCR agent | Classify COI validity, OCR scanned PDFs via Groq |
| 2 | Extraction + Checklist agents | Structured fields + per-requirement pass/fail against checklist |
| 3 | Risk + Report agents | Gaps, summary, recommendation, citations displayed on dashboard |

**Problem solved:** 20-minute manual review becomes a 2-minute admin confirmation. Every clause checked consistently against the same checklist.

**Exit criteria:** Upload COI → AI runs full 5-agent chain → dashboard shows extraction, checklist results, risks, and recommendation.

---

### Phase 5 — Review & Email Automation

**Complexity: Medium–High · Estimated: 1–2 weeks**

| # | Feature | Deliverable |
|---|---------|-------------|
| 1 | Admin accept/reject | Decision with mandatory rejection reason per version |
| 2 | Editable email templates | All 8 templates with placeholders, live preview in admin |
| 3 | Auto-send via AgentMail | Correct template sent automatically per outcome |

**Problem solved:** Tenants get clear, specific feedback instantly. No more vague "please fix your COI" emails.

**Exit criteria:** Admin rejects v1 → tenant receives detailed deficiency email → resubmits → receives acknowledgment → admin accepts → tenant receives approval email.

---

### Phase 6 — Renewal, Metrics & Audit

**Complexity: Medium · Estimated: 1–2 weeks**

| # | Feature | Deliverable |
|---|---------|-------------|
| 1 | Expiry + renewal reminders | 30/15/7 day scheduled emails with policy details via renewal template |
| 2 | Metrics dashboard | Compliance %, ROI, savings, turnaround, automation % with live calculations |
| 3 | Full audit log | Immutable files, agent steps, emails, decisions, checklist/template changes |

**Problem solved:** No more lapsed coverage surprises. Landlord sees portfolio compliance health and quantified ROI.

**Exit criteria:** COI nearing expiry triggers reminder emails → metrics dashboard reflects live compliance state → full audit trail retrievable per COI.

---

### Roadmap at a Glance

```
Phase 1          Phase 2          Phase 3          Phase 4          Phase 5          Phase 6
────────         ────────         ────────         ────────         ────────         ────────
Admin Login      AgentMail        Editable         Document/OCR     Accept/Reject    Expiry
Neon +           Webhook          Checklist        Agent            + Email          Reminders
Cloudinary       BullMQ Queue     COI Versioning   Extract +        Templates        Metrics
Basic Dashboard  Job Status UI    Job Linking      Checklist Agents Auto-send        Audit Log
                                                     Risk + Report
                                                     Agents
```

**Total estimated timeline: 8–12 weeks** for a production-ready v1.

---

## Success Criteria

| Goal | Target |
|------|--------|
| COI review time reduction | > 70% vs manual PDF review |
| Automatic expiry reminders | 100% of active COIs monitored |
| Centralized compliance tracking | Single dashboard for entire portfolio |
| Executive visibility | Live metrics without spreadsheets |
| Complete audit history | Every action logged and retrievable |
| Manual intervention | Minimal — admin only approves/rejects |
| Tenant communication | Automated, specific, templated emails for every case |
| Version tracking | Full history per sender, no lost submissions |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Neon PostgreSQL account ([neon.tech](https://neon.tech))
- Cloudinary account ([cloudinary.com](https://cloudinary.com))
- Redis instance (local or cloud — for BullMQ)
- Groq API key ([console.groq.com](https://console.groq.com))
- AgentMail account with inbox `maniranjan@agentmail.to`

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/coi_db?sslmode=require

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis / BullMQ
REDIS_URL=redis://localhost:6379

# AI (Groq via OpenAI SDK)
GROQ_API_KEY=gsk_xxx
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile

# AgentMail
AGENTMAIL_API_KEY=your_agentmail_key
INBOX_ID=maniranjan@agentmail.to
WEBHOOK_DOMAIN=your-ngrok-or-production-domain

# Auth
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD_HASH=bcrypt_hash_here
JWT_SECRET=your_jwt_secret

# App
PORT=8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run Locally

```bash
# 1. Start Redis
redis-server

# 2. Backend API
cd backend
npm install
npx prisma migrate dev
npm run dev

# 3. BullMQ Worker (separate terminal)
cd backend
npm run worker

# 4. Frontend (separate terminal)
cd frontend
npm install
npm run dev

# 5. AgentMail webhook tunnel (separate terminal)
ngrok http --url=your-domain.ngrok-free.dev 8000
```

### Current Prototype

The `agent.py` file in this repo is a **Phase 2 prototype** that demonstrates:

- AgentMail inbox setup and webhook registration
- Email receive → attachment save → AI reply via Groq
- ngrok tunnel for webhook delivery

This will be migrated to the TypeScript backend in Phase 2.

---

## Project Structure

```
coi-platform/
├── frontend/                  # Next.js 15 app
│   ├── app/
│   │   ├── (auth)/login/      # Admin login page
│   │   ├── dashboard/         # COI list, search, filter
│   │   ├── coi/[id]/          # COI detail, versions, AI results
│   │   ├── checklist/         # Editable checklist management
│   │   ├── templates/         # Email template editor
│   │   └── metrics/           # Compliance dashboard
│   ├── components/            # shadcn/ui components
│   └── lib/                   # API client, auth helpers
│
├── backend/                   # TypeScript API + workers
│   ├── src/
│   │   ├── routes/            # REST endpoints
│   │   ├── webhooks/          # AgentMail webhook handler
│   │   ├── workers/           # BullMQ job processors
│   │   ├── agents/            # AI agent chain (1–5)
│   │   ├── services/          # Cloudinary, email, checklist logic
│   │   └── db/                # Prisma schema + migrations
│   └── prisma/
│       └── schema.prisma      # Neon PostgreSQL schema
│
├── agent.py                   # Phase 2 prototype (AgentMail + Groq)
├── .env                       # Environment variables
└── README.md                  # This file
```

---

## Why This Matters

Landlords with multiple properties are **underinsured against their own tenants' insurance gaps**. The COI is the only proof of coverage — and today, verifying it is a manual, error-prone, unscalable process.

This platform turns that process into:

- **Minutes instead of hours** per renewal cycle
- **Zero missed expiries** with automated reminders
- **Consistent enforcement** of your checklist on every document
- **Clear tenant communication** with specific, actionable feedback
- **Full audit trail** for lenders, HOAs, legal disputes, and compliance audits
- **Quantified ROI** so you know exactly what manual work costs

**Define your rules once. Let the system enforce them forever.**

---

*Built for landlords who have better things to do than open PDFs all day.*
