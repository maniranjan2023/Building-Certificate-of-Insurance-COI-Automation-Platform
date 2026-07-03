# Phase 1 — Run & Verify Guide

## Prerequisites

1. **Neon PostgreSQL** — create a project and copy pooled + direct connection strings.
2. **Cloudinary** — create an account and copy cloud name, API key, and API secret.
3. Copy `.env.example` → `.env` and fill in all Phase 1 variables.

Generate a JWT secret (PowerShell):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Install & database setup

```powershell
cd C:\Users\Rahul-PC\OneDrive\Desktop\newi\Email-agent
npm install
npx prisma db push
npm run dev
```

Open **http://localhost:3000**

## Verification checklist

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open `/login` | SaaS-style admin sign-in page |
| 2 | Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Redirect to `/dashboard` |
| 3 | Upload a PDF COI | Success message; row appears in table |
| 4 | Check status column | Shows **Pending Review** |
| 5 | Click **View** | Detail page with metadata + inline preview |
| 6 | Click **Open** / **Open in Cloudinary** | Document opens from Cloudinary URL |
| 7 | Click **Sign out** | Returned to login; `/dashboard` redirects to login |

## API smoke tests (optional)

```powershell
# Login (sets cookie — use browser or curl with cookie jar)
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"your-password"}'

# List COIs (requires session cookie)
curl http://localhost:3000/api/coi
```

## What Phase 1 includes

- Next.js 15 full-stack app (UI + API routes)
- Single admin JWT auth (httpOnly cookie)
- Prisma + Neon `CoiDocument` model
- Cloudinary upload for COI files
- Dashboard: upload, list, view, basic status

## What is deferred to Phase 2+

- AgentMail webhook intake
- BullMQ job queue (`coi-jobs`, `coi-jobs-dlq`, `reminder-jobs`, `reminder-jobs-dlq` — see README)
- Checklist editor & COI versioning
- AI agent pipeline
- Email templates & auto-send
- Metrics & expiry reminders (node-cron schedules at 30/14/7/3 days → BullMQ worker sends email)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Invalid environment configuration` | Fill all vars in `.env` per `.env.example` |
| Prisma connection error | Check `DATABASE_URL` / `DIRECT_URL`; ensure Neon DB is active |
| Cloudinary upload failed | Verify API credentials and that the folder is allowed |
| Login always fails | Confirm `ADMIN_EMAIL` matches exactly; check password or hash |
