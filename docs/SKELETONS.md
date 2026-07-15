# Skeleton loading (boneyard-js)

Pixel-perfect route skeletons for sidebar navigation and client-side panels.

## Quick start

```bash
npm install
npx playwright install chromium   # once per machine
npm run dev
```

Log in, copy your `coi_session` cookie into `.env` as `BONEYARD_SESSION_TOKEN`, then:

```bash
npm run bones:build
```

This visits `/bones-capture` (all route fixtures) and `/dashboard/jobs` (panel skeletons), then writes `bones/*.bones.json` and updates `bones/registry.ts`. Re-run after any layout change.

`boneyard.config.json` auth cookies need `domain` and `path` (e.g. `localhost` / `/`) so Playwright can set `coi_session`.

## Where skeletons appear

| Trigger | Location |
|---------|----------|
| Sidebar / in-app navigation | Shared workspace shell shows shadcn `Skeleton` page layouts until content paints |
| Next.js `loading.tsx` | Same shadcn page skeletons under `components/skeletons/shadcn-page-skeletons.tsx` |
| Queue metrics fetch | `QueueMetricsSkeleton` |
| Cron scan fetch | `CronScanSkeleton` |

Loading uses [shadcn/ui Skeleton](https://ui.shadcn.com/docs/components/skeleton) only — no blank screens and no route-level spinners.

## Skeleton names (for `bones:build`)

Route fixtures are captured from `/bones-capture` (dev-only, not in sidebar).

- `dashboard-portfolio` — `/dashboard`
- `dashboard-jobs` — `/dashboard/jobs`
- `coi-detail` — `/dashboard/[id]`
- `dashboard-compare` — `/dashboard/compare`
- `tenants-list` — `/tenants`
- `tenant-detail` — `/tenants/[senderId]`
- `checklist` — `/checklist`
- `templates` — `/templates`
- `metrics` — `/metrics`
- `queue-metrics-panel` — jobs page panel
- `cron-scan-panel` — jobs page panel

Fixtures live in `components/skeletons/fixtures/` and are only rendered during the build CLI capture.

## Config

See `boneyard.config.json` — dark theme, shimmer animation, auth cookie for protected routes.
