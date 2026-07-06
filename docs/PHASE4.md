# Phase 4 — Multi-Agent AI Pipeline

Phase 4 replaces the stub COI worker with a full AI pipeline: LlamaParse OCR, five Groq-backed agents with guardrails, structured JSON persistence, Logfire observability, hybrid auto-emails, and dashboard AI results.

## Prerequisites

- Phase 3 complete (checklist, versioning, BullMQ worker)
- `.env` configured with Phase 4 variables (see README **Environment Variables**)
- Redis running for BullMQ
- Worker process running separately from Next.js dev server

## Setup

```bash
cd Email-agent
npm install --legacy-peer-deps
npx prisma db push
npx prisma generate
```

> **Note:** `@openai/agents` requires **Zod v4**. Use `--legacy-peer-deps` if npm reports peer dependency conflicts.

Start the app and worker in separate terminals:

```bash
npm run dev
npm run worker
```

## Architecture

```
Upload / Email webhook
        │
        ▼
Pre-check (webhook only)
  · No attachment → auto Missing Attachment email (no agents)
  · Valid attachment → Receipt Acknowledged email + enqueue process-coi
        │
        ▼
BullMQ worker (process-coi)
        │
        ├─ LlamaParse OCR (PDF + optional email body)
        ├─ Agent 1: Document classification
        ├─ Agent 2: Field extraction
        ├─ Agent 3: Checklist (PASS / FAIL / MISSING only)
        ├─ Agent 4: Risk analysis
        └─ Agent 5: Draft report + suggested template
        │
        ▼
Persist AiRun, AgentStep, CoiVersion JSON fields
        │
        ▼
Job status → READY_FOR_REVIEW (dashboard shows results)
```

Each agent run has **input + output guardrails** following the [OpenAI Agents SDK guardrails guide](https://openai.github.io/openai-agents-js/guides/guardrails/). When a guardrail trips, the SDK throws `InputGuardrailTripwireTriggered` or `OutputGuardrailTripwireTriggered`; the pipeline stops early, sets `AiRun` status to `STOPPED_EARLY`, and records the tripwire on `AgentStep`.

## Guardrails (OpenAI Agents SDK)

Guardrails use `defineInputGuardrail` / `defineOutputGuardrail` and official tripwire exceptions. Input guardrails run with `runInParallel: false` so the model is not called until checks pass.

### Input guardrails

| Name | Where | What it checks |
|------|-------|----------------|
| `coi_prompt_injection` | All agents | Rule-based blocklist (e.g. `ignore previous instructions`, `jailbreak`, `system prompt`) |
| `coi_llm_safety` | Document + report agents only | Groq classifier flags unsafe/off-topic OCR text |
| `checklist_not_empty` | Checklist agent | Rejects empty checklist before LLM call |

### Output guardrails

| Name | Where | What it checks |
|------|-------|----------------|
| `zod_<agent-name>` | All agents | Zod schema validation on JSON output |
| `checklist_items` | Checklist agent | Exact item count + only `PASS` / `FAIL` / `MISSING` statuses |
| `report_missing_items` | Report agent | `missingItems` must use checklist requirement labels (not field names) |

### Tripwire behavior

- Failed step: `AgentStep.guardrailPassed = false`, `tripwireReason` set (e.g. `[input] coi_prompt_injection: …`)
- Run: `AiRun.status = STOPPED_EARLY` (guardrail) vs `FAILED` (other errors)
- Dashboard **AI Pipeline** panel shows per-step guardrail status

## Key files

| Path | Purpose |
|------|---------|
| `lib/ai/llamaparse.ts` | LlamaParse OCR |
| `lib/ai/groq-client.ts` | Groq OpenAI client + model fallback chain |
| `lib/ai/schemas.ts` | Zod schemas for all agent outputs |
| `lib/ai/agents-sdk.ts` | SDK-compatible guardrail helpers + tripwire types |
| `lib/ai/guardrails.ts` | Input/output guardrail definitions |
| `lib/ai/guardrail-runner.ts` | Executes guardrails; throws official tripwire exceptions |
| `lib/ai/agents.ts` | Five agents with guardrail integration |
| `lib/ai/pipeline.ts` | Orchestrator |
| `lib/services/ai-run.ts` | `AiRun` / `AgentStep` persistence |
| `lib/services/intake-email.ts` | Auto emails (Missing Attachment, Receipt, Processing Error) |
| `lib/workers/process-coi.ts` | Worker handler |
| `instrumentation.ts` | Logfire for Next.js |
| `instrumentation/worker.ts` | Logfire for worker |
| `scripts/test-guardrails.ts` | Fast guardrail smoke test (no LLM) |
| `scripts/generate-guardrail-test-pdf.py` | Generates `coi-sample-guardrail-block.pdf` |
| `coi-sample-guardrail-block.pdf` | Test PDF with prompt-injection text for E2E guardrail testing |

## Hybrid auto-email (Phase 4)

| Template | Trigger | Sends via |
|----------|---------|-----------|
| Missing Attachment | Webhook, no PDF/image attachment | AgentMail reply |
| Receipt Acknowledged | Valid attachment received | AgentMail reply |
| Processing Error | OCR failure or job moved to DLQ | AgentMail reply/send |

All other templates (clauses missing, approved, rejected, etc.) are **Phase 5** — draft report is stored on `CoiVersion` for admin review.

## Database

New models: `AiRun`, `AgentStep`

New `CoiVersion` fields:

- `rawOcrText`
- `extractedFields` (JSON)
- `checklistResults` (JSON)
- `riskAnalysis` (JSON)
- `draftReport` (JSON)
- `aiSuggestedTemplate`

## Observability

- **Next.js**: `instrumentation.ts` + `@vercel/otel` when `LOGFIRE_TOKEN` is set
- **Worker**: `instrumentation/worker.ts` + `@pydantic/logfire-node`
- Pipeline spans: `coi.pipeline`, `llamaparse.parse`

View traces at [logfire.pydantic.dev](https://logfire.pydantic.dev).

## Testing guardrails

### Automated (no LLM, ~5 seconds)

```bash
npm run test:guardrails          # smoke test
npm test -- lib/ai/guardrails.test.ts   # unit tests
```

### End-to-end with test PDF

1. Ensure worker + dev server are running.
2. Upload or email **`coi-sample-guardrail-block.pdf`** (regenerate with `python scripts/generate-guardrail-test-pdf.py`).
3. Open the COI dashboard → **AI Pipeline** panel.

**Expected:** pipeline stops at `document-agent` with `guardrailPassed: false` and tripwire reason containing `coi_prompt_injection` / `ignore previous instructions`. Run status: `STOPPED_EARLY`.

### Other sample PDFs

| File | Purpose |
|------|---------|
| `coi-sample-compliant.pdf` | Full pipeline success path |
| `coi-sample-noncompliant.pdf` | Checklist failures + report output |
| `coi-sample-guardrail-block.pdf` | Input guardrail tripwire test |

## Manual test checklist

1. **No attachment email** — send email without PDF → tenant gets Missing Attachment reply; no COI row created
2. **Valid COI email** — attach PDF → Receipt Acknowledged + job queued → worker runs pipeline → dashboard shows extraction, checklist, risk, report
3. **Dashboard upload** — upload PDF with tenant email → same pipeline without auto emails
4. **Guardrail block** — upload `coi-sample-guardrail-block.pdf` → pipeline stops at document-agent with tripwire recorded
5. **DLQ** — set `WORKER_FORCE_FAIL=true`, upload → job fails → Processing Error email (if sender email on job)
6. **Logfire** — confirm trace for one completed job

## Not in Phase 4

- Admin report edit UI
- Accept / Reject actions
- Editable email templates (hardcoded defaults for auto emails only)
- Final AgentMail send after admin edit

See README Phase 5 for review and outbound email completion.
