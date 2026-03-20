param(
  [Parameter(Mandatory = $false)]
  [string]$SourceConnection = "postgresql://postgres:postgres@host.docker.internal:5432/sorms",

  [Parameter(Mandatory = $true)]
  [string]$TargetConnection,

  [Parameter(Mandatory = $false)]
  [string]$DumpPath = "D:/SORMS/sorms.dump"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/4] Checking Docker engine..."
try {
  docker info | Out-Null
} catch {
  Write-Error "Docker engine is not running. Please open Docker Desktop and wait until it is fully started."
  exit 1
}

Write-Host "[2/4] Exporting local database to dump file..."
docker run --rm -v D:/SORMS:/work postgres:16-alpine sh -lc "pg_dump '$SourceConnection' --format=custom --no-owner --no-privileges --file='/work/$(Split-Path -Leaf $DumpPath)'"

Write-Host "[3/4] Restoring dump into Neon target database..."
docker run --rm -v D:/SORMS:/work postgres:16-alpine sh -lc "pg_restore --clean --if-exists --no-owner --no-privileges --dbname='$TargetConnection' '/work/$(Split-Path -Leaf $DumpPath)'"

Write-Host "[4/4] Done. Data migrated to Neon successfully."
