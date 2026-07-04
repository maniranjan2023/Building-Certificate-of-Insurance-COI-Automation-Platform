# Phase 3 — Run & Verify Guide

## Goal

Editable compliance checklist, per-tenant COI versioning (v1, v2, v3), and job-to-version linking.

## Prerequisites

1. **Phase 2 complete** — intake, BullMQ worker, AgentMail webhook
2. **Neon database** — run schema update + backfill (below)

## Database setup

```powershell
cd Email-agent
npx prisma db push
npm run db:phase3
```

`db:phase3` will:

- Create `Sender` + `CoiVersion` records for existing COI documents
- Link existing `CoiJob` rows to versions
- Seed 9 default checklist items (if checklist is empty)

Restart **dev server** and **worker** after schema changes.

---

## What Phase 3 includes

| Feature | Where |
|---------|--------|
| Editable checklist | `/checklist` + `CRUD /api/checklist` |
| COI versioning | `Sender`, `CoiVersion` models; version badges on dashboard |
| Version history | COI detail page — all versions for same tenant |
| Side-by-side compare | `/dashboard/compare?a=<docId>&b=<docId>` |
| Resubmit (next version) | COI detail → **Upload new version** |
| Job → version link | Job queue shows tenant + **v1**, **v2**, … |
| Reject for testing | COI detail → **Mark as rejected** (Phase 5 adds emails) |

---

## How to test

### 1. Checklist (editable requirements)

1. Open **http://localhost:3000/checklist**
2. Confirm **9 default items** appear (6 categories)
3. Click **Add item** — fill requirement, expected value, category, mandatory
4. **Edit** an existing item → save → refresh → change persists
5. **Delete** an item → it disappears (soft-disabled in DB)

**Expected:** Checklist is the admin source of truth for Phase 4 AI validation.

---

### 2. Version tracking (dashboard upload)

1. Go to **Dashboard**
2. Upload a COI with tenant email `tenant-a@test.com`
3. Confirm table shows **v1**, tenant email, **Dashboard Upload** badge
4. Upload another file with the **same email**
5. Confirm new row shows **v2** for the same tenant

**Expected:** Same email → incrementing version numbers.

---

### 3. Reject v1 → resubmit v2 (exit criteria)

1. Open the **v1** COI detail page
2. Enter a rejection reason → **Mark as rejected**
3. Status badge turns **Rejected**
4. Scroll to **Upload new version** → attach a new PDF → submit
5. You are redirected to the **v2** detail page
6. **Version history** shows both v1 (rejected) and v2 (pending)

**Expected:** Full history linked to the same sender.

---

### 4. Email intake versioning

1. Email a PDF to `maniranjan@agentmail.to` from `tenant-b@test.com`
2. Dashboard shows **v1** with **Email (AgentMail)** badge
3. Email again from the same address → **v2** appears

---

### 5. Compare versions side-by-side

1. On a COI with v2+, open **Version history**
2. Click **Compare** on v2 (compares v1 vs v2)
3. Or visit: `/dashboard/compare?a=<v1-doc-id>&b=<v2-doc-id>`

**Expected:** Two PDF previews side by side for the same tenant.

---

### 6. Job queue → version linking

1. Open **Job Queue** (`/dashboard/jobs`)
2. Each job row shows **Tenant**, **Version** (v1/v2), and **Source**

**Expected:** Every BullMQ job is tied to a specific version, not just a file.

---

## API routes (Phase 3)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/checklist` | GET, POST | List / create checklist items |
| `/api/checklist/[id]` | GET, PATCH, DELETE | Read / update / soft-delete item |
| `/api/coi/[id]/versions` | GET, POST | Version history / resubmit |
| `/api/versions/[id]` | PATCH | Update version status (reject for testing) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Upload fails “Tenant email required” | Fill tenant email on dashboard upload form |
| No version badge on old COIs | Run `npm run db:phase3` |
| Checklist page empty | Visit `/checklist` once (auto-seeds) or run `npm run db:phase3` |
| Jobs fail after schema change | Restart worker — jobs need `coiVersionId` |
| Compare page error | Both document IDs must belong to the **same tenant** |

---

## Deferred to later phases

- **Phase 4** — AI agents validate COI against checklist
- **Phase 5** — Accept/reject with automated tenant emails
- **Phase 6** — Renewal reminders + metrics
