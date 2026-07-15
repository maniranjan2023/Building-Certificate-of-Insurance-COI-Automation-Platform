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
| Sidebar navigation | Shared `app/(workspace)/layout.tsx` keeps the shell mounted; each route’s `loading.tsx` shows instantly |
| Queue metrics fetch | `components/jobs/queue-metrics-panel.tsx` |
| Cron scan fetch | `components/jobs/cron-scan-panel.tsx` |

If bones snapshots are missing, `RouteSkeleton` falls back to the route fixture (pulsing layout) instead of a blank gray panel.

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
