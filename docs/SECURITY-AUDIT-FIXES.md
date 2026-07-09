# Security Audit Remediation Changelog

**Source report:** [SECURITY-AUDIT-REPORT.md](./SECURITY-AUDIT-REPORT.md)  
**Remediation date:** 2026-07-09  
**Status:** All 17 findings addressed (SEC-001 through SEC-017)

---

## HIGH (P0)

### SEC-001 — Acceptance gate bypass via `PATCH /api/versions/[id]` ✅ RESOLVED

| | |
|---|---|
| **Fix** | `ACCEPTED` / `REJECTED` PATCH requests route through `acceptCoiVersion` / `rejectCoiVersion`; `updateVersionStatus` rejects those statuses directly |
| **Files** | `app/api/versions/[id]/route.ts`, `lib/services/version.ts` |
| **Tests** | `lib/services/version.test.ts` |

### SEC-002 — Unauthenticated AgentMail webhook ✅ RESOLVED

| | |
|---|---|
| **Fix** | `AGENTMAIL_WEBHOOK_SECRET` required in production; verified via `Authorization: Bearer` or `X-AgentMail-Webhook-Secret` before processing |
| **Files** | `lib/security/webhook-auth.ts`, `app/api/webhooks/agentmail/route.ts`, `lib/env.ts` |
| **Tests** | `lib/security/webhook-auth.test.ts` |

### SEC-003 — Login brute force ✅ RESOLVED

| | |
|---|---|
| **Fix** | Redis/in-memory rate limiting (default 5 attempts / 15 min per IP+email); production requires `ADMIN_PASSWORD_HASH` only (plaintext password rejected) |
| **Files** | `lib/security/login-rate-limit.ts`, `app/api/auth/login/route.ts`, `lib/auth.ts`, `lib/env.ts` |

### SEC-004 — Webhook dedup TOCTOU race ✅ RESOLVED

| | |
|---|---|
| **Fix** | Atomic `ProcessedWebhookEvent.create` at webhook start; unique constraint returns `duplicate` immediately |
| **Files** | `lib/services/webhook-intake.ts`, `lib/security/prisma-errors.ts` |

---

## MEDIUM (P1)

### SEC-005 — Public health endpoints ✅ RESOLVED

| | |
|---|---|
| **Fix** | Removed `/api/health` from public middleware paths; requires admin session or `Authorization: Bearer ${HEALTH_CHECK_SECRET}` |
| **Files** | `middleware.ts`, `lib/security/health-auth.ts`, `lib/env.ts` |

### SEC-006 — LLM content in outbound emails ✅ RESOLVED

| | |
|---|---|
| **Fix** | `llmTenantEmailGuard` runs on all outbound emails; fail closed on LLM parse errors |
| **Files** | `lib/services/admin-outbound-guardrail.ts` |

### SEC-007 — Weak injection guards on 3/5 agents ✅ RESOLVED

| | |
|---|---|
| **Fix** | `includeLlmSafety: true` on extraction, checklist, and risk agents; Unicode NFKC normalization in `ruleBasedInjectionGuard` |
| **Files** | `lib/ai/agents.ts`, `lib/ai/guardrails.ts` |

### SEC-008 — Guards fail open on JSON parse errors ✅ RESOLVED

| | |
|---|---|
| **Fix** | `llmSafetyGuard` and `llmTenantEmailGuard` tripwire (fail closed) when Groq returns non-JSON |
| **Files** | `lib/ai/guardrails.ts`, `lib/services/admin-outbound-guardrail.ts` |
| **Tests** | `lib/ai/guardrails.test.ts` |

### SEC-009 — Auto-intake emails skip outbound guardrails ✅ RESOLVED

| | |
|---|---|
| **Fix** | `sendAutoIntakeEmail` calls `validateOutboundEmailContent` before delivery |
| **Files** | `lib/services/intake-email.ts` |

### SEC-010 — MIME-only upload validation ✅ RESOLVED

| | |
|---|---|
| **Fix** | Magic-byte validation via `assertBufferMatchesMimeType` on buffer uploads and dashboard uploads |
| **Files** | `lib/security/file-magic.ts`, `lib/services/coi.ts` |
| **Tests** | `lib/security/file-magic.test.ts`, `lib/services/coi.test.ts` |

### SEC-011 — Audit export over-collects platform data ✅ RESOLVED

| | |
|---|---|
| **Fix** | Removed global `templatesSnapshot` and `checklistSnapshot`; export includes `documentChecklistItems` scoped to checklist results for the document only |
| **Files** | `lib/services/audit-export.ts` |

### SEC-012 — Checklist text injected into AI prompts ✅ RESOLVED

| | |
|---|---|
| **Fix** | Sanitize and injection-guard checklist fields on CRUD; sanitize fields embedded in checklist-agent prompts |
| **Files** | `lib/security/checklist-sanitize.ts`, `lib/services/checklist.ts`, `lib/ai/agents.ts` |
| **Tests** | `lib/security/checklist-sanitize.test.ts` |

### SEC-013 — DLQ retry without rate limits ✅ RESOLVED

| | |
|---|---|
| **Fix** | Per-IP and per-job Redis/in-memory rate limits on DLQ retry endpoint |
| **Files** | `lib/security/dlq-rate-limit.ts`, `app/api/jobs/dlq/[id]/retry/route.ts`, `lib/env.ts` |

---

## LOW (P3)

### SEC-014 — No security headers ✅ RESOLVED

| | |
|---|---|
| **Fix** | CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS (production) |
| **Files** | `next.config.ts` |

### SEC-015 — JWT not revocable ✅ RESOLVED

| | |
|---|---|
| **Fix** | Session TTL reduced to 24h (configurable via `SESSION_MAX_AGE_SECONDS`); Redis denylist on logout using JWT `jti` |
| **Files** | `lib/auth.ts`, `lib/security/session-revocation.ts`, `app/api/auth/logout/route.ts`, `lib/env.ts` |

### SEC-016 — Webhook 500 leaks errors ✅ RESOLVED

| | |
|---|---|
| **Fix** | Generic `"Webhook processing failed."` returned to clients; details logged server-side only |
| **Files** | `app/api/webhooks/agentmail/route.ts` |

### SEC-017 — Legacy `agent.py` unauthenticated webhook ✅ RESOLVED

| | |
|---|---|
| **Fix** | `/webhook` returns HTTP 410 Gone with deprecation message |
| **Files** | `agent.py` |

---

## New environment variables

| Variable | Required (prod) | Purpose |
|----------|-----------------|---------|
| `AGENTMAIL_WEBHOOK_SECRET` | Yes | Webhook authentication |
| `HEALTH_CHECK_SECRET` | Yes | Bearer token for health probes |
| `ADMIN_PASSWORD_HASH` | Yes | Bcrypt hash (plaintext `ADMIN_PASSWORD` disallowed) |
| `LOGIN_RATE_LIMIT_MAX` | No | Default `5` |
| `LOGIN_RATE_LIMIT_WINDOW_SECONDS` | No | Default `900` |
| `SESSION_MAX_AGE_SECONDS` | No | Default `86400` (24h) |
| `DLQ_RETRY_RATE_LIMIT_MAX` | No | Default `10` per IP per hour |
| `DLQ_RETRY_PER_JOB_MAX` | No | Default `3` per job per day |

---

## Run 2 — POST-001 through POST-018 (2026-07-09)

**Source report:** [SECURITY-AUDIT-REPORT.md](./SECURITY-AUDIT-REPORT.md) (Run 2)  
**Status:** All 18 post-remediation findings addressed

### POST-001 — Revoked sessions still work on API routes ✅ RESOLVED

| | |
|---|---|
| **Fix** | `requireApiSession()` / `requireHealthOrAdminSession()` on all API route handlers; uses `verifySessionToken` with Redis denylist (not Edge-only JWT decode) |
| **Files** | `lib/api/require-api-session.ts`, all `app/api/**/route.ts` (except login/logout/webhook) |

### POST-002 — Public Cloudinary URLs for COI documents ✅ RESOLVED

| | |
|---|---|
| **Fix** | Uploads use `type: authenticated`; UI and exports use `/api/coi/[id]/asset` and `/api/coi/[id]/pdf` with session + signed Cloudinary URLs |
| **Files** | `lib/services/cloudinary.ts`, `app/api/coi/[id]/asset/route.ts`, `app/api/coi/[id]/pdf/route.ts`, `lib/coi-asset-path.ts`, dashboard components |
| **Tests** | `lib/services/cloudinary.test.ts`, `lib/coi-asset-path.test.ts` |

### POST-003 — Webhook sender from JSON, not AgentMail API ✅ RESOLVED

| | |
|---|---|
| **Fix** | `fetchVerifiedSenderEmail()` calls AgentMail `messages.get` instead of trusting webhook `from` field |
| **Files** | `lib/services/agentmail.ts`, `lib/services/webhook-intake.ts` |

### POST-004 — LLM fields unsanitized in email templates ✅ RESOLVED

| | |
|---|---|
| **Fix** | `sanitizeTemplateVariable` / `sanitizeSuggestedEmailBody` strip URLs and payment instructions before template render |
| **Files** | `lib/security/template-sanitize.ts`, `lib/services/email-templates.ts` |
| **Tests** | `lib/security/template-sanitize.test.ts` |

### POST-005 — Webhook claim not released on processing failure ✅ RESOLVED

| | |
|---|---|
| **Fix** | `releaseWebhookClaim()` deletes dedup row on intake failure so retries can succeed |
| **Files** | `lib/services/webhook-intake.ts` |

### POST-006 — Redis optional in production ✅ RESOLVED

| | |
|---|---|
| **Fix** | `parseEnv()` requires `REDIS_URL` when `NODE_ENV=production` |
| **Files** | `lib/env.ts` |

### POST-007 — Webhook auth disabled when secret unset (non-production) ✅ RESOLVED

| | |
|---|---|
| **Fix** | Fail closed unless `DATABASE_URL` is local or `ALLOW_INSECURE_WEBHOOK=true`; timing-safe secret compare |
| **Files** | `lib/security/webhook-auth.ts`, `lib/env.ts` |
| **Tests** | `lib/security/webhook-auth.test.ts` |

### POST-008 — Authenticated webhook → outbound email abuse ✅ RESOLVED

| | |
|---|---|
| **Fix** | Per-IP intake and per-sender auto-reply rate limits |
| **Files** | `lib/security/webhook-rate-limit.ts`, `lib/services/webhook-intake.ts`, `lib/env.ts` |

### POST-009 — Unbounded `message.text` → LLM cost exhaustion ✅ RESOLVED

| | |
|---|---|
| **Fix** | `capWebhookText()` truncates to `WEBHOOK_MAX_TEXT_CHARS` (default 32 KB) before enqueue |
| **Files** | `lib/services/webhook-intake.ts`, `lib/env.ts` |

### POST-010 — Report `suggestedEmailBody` has no output guardrail ✅ RESOLVED

| | |
|---|---|
| **Fix** | `suggestedEmailBodyOutputGuardrail()` blocks injection, URLs, and payment patterns |
| **Files** | `lib/ai/guardrails.ts`, `lib/ai/agents.ts` |
| **Tests** | `lib/ai/guardrails.test.ts` |

### POST-011 — `guardrail_blocked` emails leak pipeline internals ✅ RESOLVED

| | |
|---|---|
| **Fix** | Tenant-safe `guardrail_blocked` template without agent step names or guardrail citations |
| **Files** | `lib/services/email-templates.ts`, `lib/services/guardrail-email.ts` |

### POST-012 — IP rate-limit bypass via spoofed `X-Forwarded-For` ✅ RESOLVED

| | |
|---|---|
| **Fix** | `getClientIp()` trusts forwarded headers only when `TRUSTED_PROXY_IPS` is set |
| **Files** | `lib/security/trusted-proxy.ts`, `lib/security/login-rate-limit.ts` |
| **Tests** | `lib/security/trusted-proxy.test.ts` |

### POST-013 — Internal error messages in API 500 responses ✅ RESOLVED

| | |
|---|---|
| **Fix** | `jsonInternalError()` returns generic message; details logged server-side |
| **Files** | `lib/api/handle-route-error.ts`, `app/api/**/route.ts` |

### POST-014 — Permissive CSP weakens XSS containment ✅ RESOLVED

| | |
|---|---|
| **Fix** | Production CSP drops `unsafe-eval`; `connect-src` narrowed to Groq, Cloudinary, LlamaIndex |
| **Files** | `next.config.ts` |

### POST-015 — Short-input LLM safety bypass (≤200 chars) ✅ RESOLVED

| | |
|---|---|
| **Fix** | Removed short-input skip in `coiLlmSafetyInputGuardrail`; rule guard always runs |
| **Files** | `lib/ai/guardrails.ts` |

### POST-016 — `WORKER_FORCE_FAIL` not blocked in production ✅ RESOLVED

| | |
|---|---|
| **Fix** | `parseEnv()` rejects `WORKER_FORCE_FAIL=true` in production |
| **Files** | `lib/env.ts` |

### POST-017 — Legacy `agent.py` still deployable ✅ RESOLVED

| | |
|---|---|
| **Fix** | Process exits unless `AGENT_PY_ENABLED=true` (local dev only); webhook remains 410 |
| **Files** | `agent.py` |

### POST-018 — `Content-Disposition` filename not sanitized ✅ RESOLVED

| | |
|---|---|
| **Fix** | `sanitizeDownloadFilename` + RFC 5987 `filename*` in PDF download header |
| **Files** | `lib/security/safe-filename.ts`, `app/api/coi/[id]/pdf/route.ts` |
| **Tests** | `lib/security/safe-filename.test.ts` |

---

## New environment variables (Run 2)

| Variable | Required (prod) | Purpose |
|----------|-----------------|---------|
| `REDIS_URL` | Yes | Session revocation, queues, rate limits |
| `WEBHOOK_MAX_TEXT_CHARS` | No | Default `32768` |
| `WEBHOOK_INTAKE_RATE_LIMIT_MAX` | No | Default `60` per IP per hour |
| `WEBHOOK_AUTOREPLY_RATE_LIMIT_MAX` | No | Default `10` per sender per hour |
| `TRUSTED_PROXY_IPS` | No | Comma-separated proxy IPs for `X-Forwarded-For` trust |
| `ALLOW_INSECURE_WEBHOOK` | No | Opt-in unsigned webhooks on non-local DB (dev only) |
| `AGENT_PY_ENABLED` | No | Must be `true` to run legacy `agent.py` locally |

---

*Re-run the security audit after deploying Run 2 fixes to production.*
