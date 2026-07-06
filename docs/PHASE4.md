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

Each agent run has **input + output guardrails** (OpenAI Agents SDK pattern). Guardrail tripwires stop the pipeline early and are recorded on `AgentStep`.

## Key files

| Path | Purpose |
|------|---------|
| `lib/ai/llamaparse.ts` | LlamaParse OCR |
| `lib/ai/groq-client.ts` | Groq OpenAI client + model fallback chain |
| `lib/ai/schemas.ts` | Zod schemas for all agent outputs |
| `lib/ai/guardrails.ts` | Rule + LLM input guards, schema validation |
| `lib/ai/agents.ts` | Five agents via `@openai/agents` |
| `lib/ai/pipeline.ts` | Orchestrator |
| `lib/services/ai-run.ts` | `AiRun` / `AgentStep` persistence |
| `lib/services/intake-email.ts` | Auto emails (Missing Attachment, Receipt, Processing Error) |
| `lib/workers/process-coi.ts` | Worker handler |
| `instrumentation.ts` | Logfire for Next.js |
| `instrumentation/worker.ts` | Logfire for worker |

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

## Manual test checklist

1. **No attachment email** — send email without PDF → tenant gets Missing Attachment reply; no COI row created
2. **Valid COI email** — attach PDF → Receipt Acknowledged + job queued → worker runs pipeline → dashboard shows extraction, checklist, risk, report
3. **Dashboard upload** — upload PDF with tenant email → same pipeline without auto emails
4. **DLQ** — set `WORKER_FORCE_FAIL=true`, upload → job fails → Processing Error email (if sender email on job)
5. **Logfire** — confirm trace for one completed job

## Not in Phase 4

- Admin report edit UI
- Accept / Reject actions
- Editable email templates (hardcoded defaults for auto emails only)
- Final AgentMail send after admin edit

See README Phase 5 for review and outbound email completion.
