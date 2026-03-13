# SORMS Deployment Steps (BE first)

## 1) Initialize git and create first commit for BE
Run at repository root:

```powershell
git init
git checkout -b main
git add "Smart Office Resource Management System.sln" "SORMS.API" "render.yaml" ".gitignore"
git commit -m "chore(be): fix solution and prepare Render deployment"
```

## 2) Create GitHub repo and push BE first
Create an empty repo on GitHub (example: `sorms-be-fe`). Then run:

```powershell
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 3) Deploy BE to Render (using `render.yaml`)
- In Render, choose **New +** → **Blueprint**.
- Connect the GitHub repo and select this repository.
- Render will detect `render.yaml` and create service `sorms-api`.
- Confirm build/start commands:
  - Build: `dotnet restore && dotnet publish -c Release -o ./publish`
  - Start: `dotnet ./publish/SORMS.API.dll`

### Required environment variables on Render
Set values in Render dashboard (the keys already exist in `render.yaml`):
- `ConnectionStrings__DefaultConnection`
- `Jwt__Key`
- `AdminAccount__Email`
- `AdminAccount__Password`
- `PayOS__ClientId`
- `PayOS__ApiKey`
- `PayOS__ChecksumKey`
- `PayOS__WebhookUrl`
- `PublicApiUrl` = `https://<your-render-domain>`

## 4) Verify BE is live
After deploy finishes, open:
- `https://<your-render-domain>/swagger` (if enabled in environment)
- Or hit API endpoint health/auth route you are using.

## 5) Prepare FE for Vercel
In Vercel project settings (for `sorms-fe`), add:
- `VITE_API_BASE_URL=https://<your-render-domain>/api`
- `VITE_API_ORIGIN=https://<your-render-domain>`

`vercel.json` is already added to support SPA routing.

## 6) Deploy FE on Vercel
- Import project from GitHub.
- Set **Root Directory** to `sorms-fe`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Deploy.

## 7) Optional second commit for FE updates
After BE is confirmed, push FE-specific deployment changes:

```powershell
git add sorms-fe/src/api/client.ts sorms-fe/src/pages/rooms/RoomDetailPage.tsx sorms-fe/src/pages/rooms/RoomFormPage.tsx sorms-fe/src/pages/rooms/RoomListPage.tsx sorms-fe/vercel.json sorms-fe/.env.example DEPLOYMENT_STEPS.md
git commit -m "chore(fe): make API URLs env-driven and add Vercel config"
git push
```
