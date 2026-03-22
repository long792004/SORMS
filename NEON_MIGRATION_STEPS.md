# Migrate data local PostgreSQL -> Neon

## 1) Start Docker Desktop
- Open Docker Desktop
- Wait until status is "Engine running"

## 2) Run migration script

From project root `D:\SORMS`:

```powershell
Set-Location D:\SORMS
.\scripts\migrate-local-to-neon.ps1 -TargetConnection "postgresql://neondb_owner:<YOUR_PASSWORD>@ep-purple-boat-adrsd35t-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

If your local source DB is not `postgres/postgres@localhost:5432/sorms`, run with custom source:

```powershell
Set-Location D:\SORMS
.\scripts\migrate-local-to-neon.ps1 -SourceConnection "postgresql://<LOCAL_USER>:<LOCAL_PASS>@host.docker.internal:5432/<LOCAL_DB>" -TargetConnection "postgresql://neondb_owner:<YOUR_PASSWORD>@ep-purple-boat-adrsd35t-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## 3) Verify app connects Neon
- Development connection string was updated in `SORMS.API/appsettings.Development.json`.
- For Render production, set env var `ConnectionStrings__DefaultConnection` to your Neon connection string.

## 4) Safety note
- Rotate Neon password after migration if it has been shared in chat or committed anywhere.
