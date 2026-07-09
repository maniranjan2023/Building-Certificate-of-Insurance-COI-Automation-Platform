# COI Automation Platform — Full Security Audit Report (Run 2)

**Repository:** Building-Certificate-of-Insurance-COI-Automation-Platform  
**Path:** `E:\newi\Email-agent`  
**Audit date:** 2026-07-09  
**Run:** 2 (post-remediation re-audit)  
**Methodology:** Cloudflare security-audit-skill (6-phase manual audit)  
**Scope:** Full codebase — Next.js 15 API, middleware (Edge), AI pipeline (Groq/LlamaParse), BullMQ workers/cron, webhooks, Prisma/Neon, Cloudinary, legacy `agent.py`

**Prior run:** Run 1 identified SEC-001–SEC-017. Remediation completed per `docs/SECURITY-AUDIT-FIXES.md`.

---

## Executive Summary

This is a **single-admin COI compliance automation platform**. After remediation of 17 original findings, security posture improved from **moderate** to **moderate-to-good**, but **exploitable gaps remain** in session revocation, document access control, and webhook sender verification.

| Severity | Original (Run 1) | Remaining (Run 2) |
|----------|------------------|-------------------|
| **CRITICAL** | 0 | 0 |
| **HIGH** | 4 | 3 |
| **MEDIUM** | 9 | 8 |
| **LOW** | 4 | 7 |
| **Hardening** | 8 | 6 |

### Top 3 priorities before production

1. **Enforce session revocation** — logout must invalidate API access, not only `/api/auth/me`
2. **Stop exposing COI documents via public Cloudinary URLs** — use authenticated/private assets + signed URLs
3. **Verify webhook sender via AgentMail API** — do not trust JSON `from` field

### Use with Cursor Agent

> Fix all **remaining** findings in `docs/SECURITY-AUDIT-REPORT.md` (POST-001 onward) in priority order. Implement fixes, add tests, and log in `docs/SECURITY-AUDIT-FIXES.md`.

---

## Run 1 Remediation Status (SEC-001 → SEC-017)

| ID | Original severity | Status | Notes |
|----|-------------------|--------|-------|
| SEC-001 | HIGH | ✅ **Fixed** | PATCH ACCEPTED/REJECTED routes through accept/reject services |
| SEC-002 | HIGH | ⚠️ **Partial** | Webhook secret added; sender still from webhook JSON → POST-003 |
| SEC-003 | HIGH | ✅ **Fixed** (prod) | Rate limit + bcrypt-only in production; degrades without Redis → POST-006 |
| SEC-004 | HIGH | ✅ **Fixed** | Atomic dedup at webhook start; side effect → POST-005 |
| SEC-005 | MEDIUM | ✅ **Fixed** | Health endpoints require bearer or admin session |
| SEC-006 | MEDIUM | ⚠️ **Partial** | Outbound LLM guard runs; template vars unsanitized → POST-004 |
| SEC-007 | MEDIUM | ⚠️ **Partial** | LLM safety on all agents; substring guard bypassable → POST-009 |
| SEC-008 | MEDIUM | ✅ **Fixed** | Guards fail closed on LLM parse errors |
| SEC-009 | MEDIUM | ✅ **Fixed** | Auto-intake emails pass outbound guardrails |
| SEC-010 | MEDIUM | ✅ **Fixed** | Magic-byte validation on uploads |
| SEC-011 | MEDIUM | ✅ **Fixed** | Audit export scoped to document-local checklist |
| SEC-012 | MEDIUM | ✅ **Fixed** | Checklist CRUD + agent prompts sanitized |
| SEC-013 | MEDIUM | ✅ **Fixed** (with Redis) | DLQ retry limits; in-memory fallback → POST-006 |
| SEC-014 | LOW | ⚠️ **Partial** | Headers added; CSP still permissive → POST-008 |
| SEC-015 | LOW | ⚠️ **Partial** | Redis denylist exists; middleware ignores it → POST-001 |
| SEC-016 | LOW | ✅ **Fixed** (webhooks) | Generic webhook errors; other routes still leak → POST-011 |
| SEC-017 | LOW | ✅ **Fixed** | `agent.py` webhook returns HTTP 410 |

**Summary:** 11 fully fixed, 6 partially open (regressions or incomplete implementation).

---

# Remaining Findings (Run 2)

---

## POST-001: Revoked sessions still authorize all API routes

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **CWE** | CWE-613 (Insufficient Session Expiration) |
| **Files** | `middleware.ts`, `lib/auth-jwt.ts`, `lib/auth.ts`, `lib/security/session-revocation.ts`, all `app/api/**` |

### Problem

Logout writes JWT `jti` to Redis denylist, but **middleware uses `lib/auth-jwt.ts`**, which explicitly skips revocation. No API route calls `requireSession()` except `/api/auth/me`.

### Attack

1. Attacker steals admin `coi_session` cookie.
2. Admin logs out (Redis denylist updated).
3. Attacker continues `PATCH /api/coi/...`, `POST /api/coi/{id}/accept`, etc. until JWT expires (default 24h).
4. `/api/auth/me` returns 401; all other APIs return 200.

### Fix

- Edge-compatible revocation check in middleware (e.g. Upstash Redis REST), **or**
- Call `requireSession()` from `@/lib/auth` in every API handler, **or**
- Short JWT TTL (15–60 min) + refresh flow.

---

## POST-002: COI documents publicly accessible via Cloudinary URL

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **CWE** | CWE-284 / CWE-200 |
| **Files** | `lib/services/cloudinary.ts`, `prisma/schema.prisma`, `app/dashboard/[id]/page.tsx`, `lib/services/audit-export.ts` |

### Problem

Uploads use default **public** Cloudinary delivery. `cloudinaryUrl` is stored in DB and rendered in UI/exports. Anyone with the URL fetches insurance documents without authentication.

### Attack

- URL from browser devtools, screen share, proxy logs, audit export JSON, or referrer leak.
- Permanent access until asset deleted.

### Fix

Use `type: "authenticated"` or private assets; serve via **short-lived signed URLs** from a server route that checks admin session.

---

## POST-003: Webhook sender email trusted from payload (SEC-002 incomplete)

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **CWE** | CWE-345 |
| **Files** | `lib/services/webhook-intake.ts`, `lib/services/agentmail.ts` |

### Problem

Attachments fetched via AgentMail API, but `senderEmail` parsed from webhook JSON `from` / `from_`.

### Attack

With `AGENTMAIL_WEBHOOK_SECRET`, attacker POSTs real `message_id` + `attachment_id` but forged `from`. COI attributed to wrong tenant; emails sent to attacker.

### Fix

After atomic claim, call AgentMail `messages.get(inboxId, messageId)` and use API-returned sender; ignore webhook `from`.

---

## POST-004: LLM-extracted fields in outbound templates (SEC-006 incomplete)

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **CWE** | CWE-74 |
| **Files** | `lib/services/email-templates.ts`, `lib/services/email-send.ts`, `lib/ai/agents.ts`, `lib/services/admin-outbound-guardrail.ts` |

### Problem

`buildTemplateVariables()` injects raw extraction/report fields into `{{carrier_name}}`, `{{ai_summary}}`, etc. Final LLM guard is probabilistic; no sanitization of template variables or output guardrail on `suggestedEmailBody`.

### Attack

Adversarial PDF text → extraction fields → admin sends approved template → platform-branded phishing/fraud content to tenant.

### Fix

Sanitize template variables (strip URLs, payment patterns); add output guardrail on report `suggestedEmailBody`; deny-list wire/transfer language.

---

## POST-005: Atomic webhook claim causes permanent message loss on failure

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **CWE** | CWE-400 (Uncontrolled Resource Consumption) |
| **Files** | `lib/services/webhook-intake.ts` |

### Problem

`ProcessedWebhookEvent.create` runs before download/processing. Failure after claim = message never retried.

### Attack

Attacker with webhook secret floods invalid payloads for observed `message_id` values → legitimate emails never processed.

### Fix

Use `processing` status with claim release on failure, or claim only after successful attachment download.

---

## POST-006: Security controls noop without Redis in production

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **CWE** | CWE-778 |
| **Files** | `lib/env.ts`, `lib/security/redis-client.ts`, `lib/security/login-rate-limit.ts`, `lib/security/session-revocation.ts`, `lib/security/dlq-rate-limit.ts` |

### Problem

`REDIS_URL` optional in production. Without Redis: revocation noop, per-process rate limits (bypass across instances), DLQ limits ineffective.

### Fix

Require `REDIS_URL` in `parseEnv()` when `NODE_ENV=production`.

---

## POST-007: Webhook auth disabled when secret unset (non-production)

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Files** | `lib/security/webhook-auth.ts` |

### Problem

If `AGENTMAIL_WEBHOOK_SECRET` unset and `NODE_ENV !== production`, webhook accepts any POST.

### Attack

Internet-exposed staging/preview → full intake abuse without credentials.

### Fix

Require secret for any non-local `DATABASE_URL`, or explicit `ALLOW_INSECURE_WEBHOOK=true` opt-in.

---

## POST-008: Authenticated webhook → outbound email abuse

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Files** | `lib/services/webhook-intake.ts`, `lib/services/intake-email.ts` |

### Problem

Each unique `message_id` without attachment triggers `missing_attachment` email to webhook-declared `from`.

### Attack

N webhooks with unique IDs, forged `from` → N platform emails harassing target.

### Fix

Rate-limit webhooks per sender/IP; cap auto-replies per hour.

---

## POST-009: Unbounded `message.text` → LLM cost exhaustion

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Files** | `lib/services/webhook-intake.ts`, `lib/ai/pipeline.ts`, `lib/workers/process-coi.ts` |

### Problem

`message.text` stored in job data with no length cap; triggers full LlamaParse + 5 Groq agents per webhook.

### Fix

Cap `message.text` length (e.g. 32 KB); reject oversized payloads before enqueue.

---

## POST-010: Report `suggestedEmailBody` has no output guardrail

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Files** | `lib/ai/agents.ts`, `lib/services/review-actions.ts` |

### Problem

Report agent emits unconstrained `suggestedEmailBody`; admin one-click send uses it as `customBody`.

### Fix

Add output guardrail on report agent for `suggestedEmailBody`; block URLs/payment instructions.

---

## POST-011: `guardrail_blocked` emails leak pipeline internals

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Files** | `lib/services/email-templates.ts`, `lib/services/guardrail-email.ts` |

### Problem

Auto-emails include `{{agent_step}}`, guardrail citations, agent names — aids adversarial tuning.

### Fix

Tenant-safe template without internal agent/guardrail names.

---

## POST-012: IP rate-limit bypass via spoofed `X-Forwarded-For`

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Files** | `lib/security/login-rate-limit.ts` |

### Problem

`getClientIp` trusts first `X-Forwarded-For` without trusted-proxy validation.

### Fix

Only trust forwarded headers from known proxy; else use socket address.

---

## POST-013: Internal error messages in API 500 responses

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Files** | Most `app/api/**/route.ts` catch blocks |

### Problem

Routes return `error.message` on 500s (Prisma/Redis strings may leak).

### Fix

Generic client message; log details server-side only.

---

## POST-014: Permissive CSP weakens XSS containment

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Files** | `next.config.ts` |

### Problem |

CSP allows `'unsafe-inline'` and `'unsafe-eval'`; `connect-src https:` is broad.

### Fix

Nonces/hashes for scripts; narrow `connect-src`.

---

## POST-015: Short-input LLM safety bypass (≤200 chars)

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Files** | `lib/ai/guardrails.ts` |

### Problem |

`coiLlmSafetyInputGuardrail` skips LLM check when input ≤200 characters.

### Fix

Always run rule-based guard; lower threshold or fail closed on short OCR snippets.

---

## POST-016: `WORKER_FORCE_FAIL` not blocked in production

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Files** | `lib/env.ts`, `lib/workers/process-coi.ts` |

### Problem |

`WORKER_FORCE_FAIL=true` forces all COI jobs to DLQ; no production guard.

### Fix |

Reject in `parseEnv()` when `NODE_ENV=production`.

---

## POST-017: Legacy `agent.py` still deployable

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Files** | `agent.py` |

### Problem |

Webhook disabled (410) but Flask app still registers ngrok, saves attachments, calls Groq.

### Fix |

Remove from production images or dev-only gate.

---

## POST-018: `Content-Disposition` filename not sanitized

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Files** | `app/api/coi/[id]/pdf/route.ts` |

### Problem |

User-controlled `fileName` in PDF download header.

### Fix |

RFC 5987 `filename*` or alphanumeric-only filename.

---

# Positive Security Patterns (Verified)

| Control | Location |
|---------|----------|
| HS256 JWT via `jose` with expiry + role check | `lib/auth-jwt.ts`, `lib/auth.ts` |
| httpOnly, secure (prod), SameSite=Lax cookies | `lib/auth-jwt.ts` |
| Acceptance eligibility gates on accept route | `lib/services/acceptance-gates.ts` |
| Atomic webhook dedup | `lib/services/webhook-intake.ts` |
| Webhook bearer secret (production) | `lib/security/webhook-auth.ts` |
| Login rate limiting | `lib/security/login-rate-limit.ts` |
| Magic-byte file validation | `lib/security/file-magic.ts` |
| Checklist reconciliation (deterministic) | `lib/ai/checklist-rules.ts` |
| Outbound guardrails on all email paths | `email-send.ts`, `intake-email.ts` |
| Health endpoints protected | `middleware.ts`, `lib/security/health-auth.ts` |
| Prisma ORM only (no dynamic raw SQL) | codebase-wide |
| HTML escaping in outbound email | `lib/email/plain-text-html.ts` |
| Redis distributed lock with token verification | `lib/queue/redis-lock.ts` |
| Zod validation on API bodies | API routes |
| Security headers + HSTS (prod) | `next.config.ts` |

---

# Remediation Priority Matrix (Run 2)

| Priority | Finding IDs | Effort |
|----------|-------------|--------|
| **P0 — This week** | POST-001, POST-002, POST-003 | 2–3 days |
| **P1 — Before prod** | POST-004, POST-005, POST-006, POST-007 | 2 days |
| **P2 — Soon after** | POST-008–POST-011 | 1–2 days |
| **P3 — Backlog** | POST-012–POST-018 | 1 day |

---

# Appendix: Public vs Protected Routes

### Public (no authentication)

- `GET /` — marketing
- `GET/POST /login`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/webhooks/agentmail` — requires `AGENTMAIL_WEBHOOK_SECRET` in production

### Protected (admin JWT or health bearer)

- `GET /api/health/*` — bearer `HEALTH_CHECK_SECRET` or admin session
- All other `/api/*` and app pages

### Infrastructure trust boundaries

- **Cloudinary:** public URLs bypass app auth (POST-002)
- **Redis:** compromised Redis → arbitrary job enqueue
- **Groq/LlamaParse:** webhook-authenticated cost burn (POST-009)

---

# File Index for Cursor Fixes

| File | Findings |
|------|----------|
| `middleware.ts` | POST-001 |
| `lib/auth.ts`, `lib/auth-jwt.ts` | POST-001 |
| `lib/services/cloudinary.ts` | POST-002 |
| `lib/services/webhook-intake.ts`, `lib/services/agentmail.ts` | POST-003, POST-005, POST-008, POST-009 |
| `lib/services/email-templates.ts`, `lib/services/email-send.ts` | POST-004 |
| `lib/ai/agents.ts` | POST-004, POST-010 |
| `lib/env.ts` | POST-006, POST-007, POST-016 |
| `lib/security/webhook-auth.ts` | POST-007 |
| `lib/security/login-rate-limit.ts` | POST-012 |
| `next.config.ts` | POST-014 |
| `lib/ai/guardrails.ts` | POST-015 |
| `agent.py` | POST-017 |
| `app/api/coi/[id]/pdf/route.ts` | POST-018 |

---

*End of report. Run 2 post-remediation audit. Generated 2026-07-09. Re-run after P0 fixes.*
