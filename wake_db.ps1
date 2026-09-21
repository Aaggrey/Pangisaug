param([string]$Work = "C:\Code\Pangisaug")
$raw = (Get-Content (Join-Path $Work ".env") -Raw)
$m = [regex]::Match($raw, "DATABASE_URL=['""]?([^'""\r\n]+)")
$baseVer = $m.Groups[1].Value.Trim()
$pool = $baseVer
if ($pool -notmatch '\?') { $pool = "$pool?pgbouncer=true&connection_limit=1" }
elseif ($pool -notmatch 'pgbouncer') { $pool = "$pool&pgbouncer=true&connection_limit=1" }

$cands = @(
  @{ n="pooler+pgbouncer";  u=$pool },
  @{ n="pooler+poolerhost"; u=$pool },
  @{ n="direct";            u=$baseVer },
  @{ n="direct+sslmode";    u=($baseVer + $(if($baseVer -match '\?ssl'){''}else{'?sslmode=require'})) }
)
Push-Location $Work
try {
  $ok = $false
  foreach ($c in $cands) {
    Write-Output ("--- try {0}: {1} ---" -f $c.n, ([regex]::Replace($c.u, '(//[^:]+):[^@]+@', '$1:***@')))
    'SELECT 1 AS alive;' | npx prisma db execute --stdin --url $c.u 2>&1 | Out-String -Width 220 | Set-Content "$env:TEMP\cand.txt"
    $code = $LASTEXITCODE
    if ($code -eq 0) { Write-Output "OK_n=$($c.n)"; $ok=$true; break }
    Get-Content "$env:TEMP\cand.txt" | Where-Object { $_ -match 'P1001|P1017|P5001|Error' } | Select-Object -Last 2
    Write-Output "code=$code"
  }
  if ($ok) {
    Write-Output '=== db push ==='
    npx prisma db push 2>&1 | Out-String -Width 220 | Set-Content "$env:TEMP\wpush.txt"
    Get-Content "$env:TEMP\wpush.txt" | Where-Object { $_ -match 'in sync|Done in|Error|P1001|P1017' } | Select-Object -Last 3
    Write-Output "push_exit=$LASTEXITCODE"
  } else {
    Write-Output 'ALL_CANDIDATES_FAILED'
  }
} finally { Pop-Location }
