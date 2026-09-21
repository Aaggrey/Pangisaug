param([string]$Work = 'C:\Code\Pangisaug')

$ErrorActionPreference = 'Continue'
$env:Work = $Work

$raw = Get-Content (Join-Path $Work '.env') -Raw
$m = [regex]::Match($raw, "DATABASE_URL=['""]?([^'""\r\n]+)")
$base = $m.Groups[1].Value.Trim()
Write-Output "current_base=$base"

$direct = $base -replace '-pooler', ''
$pooler = $base -replace '-pooler', '-pooler'

if ($pooler -notmatch '\?') {
  $pooler = "$pooler?pgbouncer=true&connection_limit=1"
} elseif ($pooler -notmatch 'pgbouncer') {
  $pooler = "$pooler&pgbouncer=true&connection_limit=1"
}

Write-Output '=== push using POOLER + pgbouncer=true ==='
Push-Location $Work
try {
  npx prisma db push 2>&1 | Out-String -Width 240 | Select-Object -Last 6
  Write-Output "push_exit=$LASTEXITCODE"
} finally { Pop-Location }
