# Vercel deployment

## Why you might see 500 Internal Server Error

The app validates environment variables at runtime. In **production**, missing or invalid env vars cause API routes and authenticated pages to fail. Common causes on Vercel:

| Missing / wrong var | Symptom |
|---------------------|---------|
| `JWT_SECRET` (min 32 chars) | Login/session fails |
| `ADMIN_PASSWORD_HASH` | Login returns 500 (plaintext `ADMIN_PASSWORD` is rejected in production) |
| `DATABASE_URL` | Dashboard and data pages return 500 |
| `REDIS_URL` | Env validation fails; queues/sessions break |
| `AGENTMAIL_WEBHOOK_SECRET` | Env validation fails in production |
| `HEALTH_CHECK_SECRET` | Env validation fails in production |
| `CLOUDINARY_*` | Uploads and COI assets fail |

Public routes (`/`, `/login`) should load once env validation no longer crashes startup (see `instrumentation.ts`).

## Required Vercel environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview):

### Core (required)

```
DATABASE_URL=postgresql://...
JWT_SECRET=<random string, at least 32 characters>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD_HASH=<bcrypt hash — see below>
REDIS_URL=rediss://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
AGENTMAIL_WEBHOOK_SECRET=<random secret>
HEALTH_CHECK_SECRET=<random secret>
```

### Generate `ADMIN_PASSWORD_HASH`

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 12).then(console.log)"
```

Paste the output into `ADMIN_PASSWORD_HASH`. **Do not** set `ADMIN_PASSWORD` in production.

### Optional but recommended

```
AGENTMAIL_API_KEY=...
GROQ_API_KEY=...
LLAMA_CLOUD_API_KEY=...
DIRECT_URL=...          # Neon direct connection (migrations)
```

## Deploy checklist

1. Add all required env vars above in Vercel.
2. Connect a Postgres database (Neon recommended) and set `DATABASE_URL`.
3. Connect Redis (Upstash recommended) and set `REDIS_URL`.
4. Run `npx prisma db push` or migrations against production DB once.
5. Redeploy after env changes (Vercel → Deployments → Redeploy).
6. Worker/cron (`npm run worker`, `npm run cron`) run **outside** Vercel — use Railway, Fly.io, or a VPS.

## Verify after deploy

- `https://your-app.vercel.app/` — marketing page loads
- `https://your-app.vercel.app/login` — login form loads
- Sign in with `ADMIN_EMAIL` + password used to generate the hash
- `/dashboard` — portfolio loads after auth

## Health checks

`/api/health` requires `Authorization: Bearer <HEALTH_CHECK_SECRET>` or an admin session cookie.
