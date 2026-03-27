# SORMS Deployment Guide (Backend + Frontend)

This guide helps you deploy the full system with:
- Backend API on Render (Docker)
- Frontend on Vercel (Vite)

## 1) Pre-deploy checklist

- Push source code to GitHub.
- Prepare a PostgreSQL database (Neon, Supabase, Render Postgres, etc.).
- Prepare production secrets:
  - JWT key (>= 32 chars)
  - PayOS credentials
  - Gemini API key
  - SMTP credentials
  - Cloudinary credentials

## 2) Backend deployment (Render)

The project already includes:
- `Dockerfile`
- `render.yaml`
- Health endpoint: `/health`

### Create service

1. In Render, click **New +** -> **Blueprint**.
2. Connect your GitHub repository.
3. Render will detect `render.yaml` and create service `sorms-api`.
4. Open service settings and fill all `sync: false` environment variables.

Use `SORMS.API/.env.example` as the source of truth for required keys.

### Required environment variables

At minimum, set these correctly:
- `ConnectionStrings__DefaultConnection`
- `Jwt__Key`
- `AdminAccount__Email`
- `AdminAccount__Password`
- `PayOS__ClientId`
- `PayOS__ApiKey`
- `PayOS__ChecksumKey`
- `PayOS__WebhookUrl`
- `PublicApiUrl`
- `GeminiApiKey`
- `Cloudinary__CloudName`
- `Cloudinary__ApiKey`
- `Cloudinary__ApiSecret`
- `Smtp__Username`
- `Smtp__Password`
- `Smtp__From`

### Verify backend

After deploy is green:
- Check health: `https://<your-render-domain>/health`
- Open Swagger: `https://<your-render-domain>/swagger`

## 3) Frontend deployment (Vercel)

The frontend is in `sorms-fe` and already has `vercel.json`.

### Create project

1. In Vercel, import the same GitHub repository.
2. Set **Root Directory** = `sorms-fe`.
3. Build command: `npm run build`.
4. Output directory: `dist`.

### Frontend environment variables

Set in Vercel project settings:

- `VITE_API_BASE_URL=https://<your-render-domain>/api`

(Optional) for consistency in assets URL handling:
- `VITE_API_ORIGIN=https://<your-render-domain>`

### Verify frontend

- Open deployed Vercel URL.
- Test login/register.
- Test room list load.
- Test payment redirect flow.

## 4) Payment webhook setup

In PayOS dashboard, configure webhook URL to:

`https://<your-render-domain>/api/payment/webhook`

Also ensure this matches Render env var:
- `PayOS__WebhookUrl`

## 5) First deploy smoke test

Run these checks in order:

1. `GET /health` returns 200.
2. Frontend can call API (no CORS errors in browser console).
3. Login issues JWT successfully.
4. Booking flow reaches payment page.
5. PayOS callback updates payment status in backend.

## 6) Security notes (important)

- Rotate any secrets that were ever committed to source control.
- Do not store production secrets in `appsettings*.json`.
- Keep secrets only in Render/Vercel environment variables.

## 7) Local build validation commands

Run before pushing a release:

### Backend

```powershell
cd SORMS.API
dotnet restore
dotnet build -c Release
```

### Frontend

```powershell
cd sorms-fe
npm ci
npm run build
```

If both builds pass, deployment should be stable.
