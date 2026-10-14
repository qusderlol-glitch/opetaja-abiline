# Õpetaja Abiline – one-click Cloudflare deploy of the "site key" Worker (Windows PowerShell).
# Run from the repo folder:  powershell -ExecutionPolicy Bypass -File worker\deploy.ps1
# You will: (1) log in to Cloudflare in the browser, (2) paste your Gemini key (it is hidden and goes only to Cloudflare).
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Step($n, $text) { Write-Host ""; Write-Host "[$n] $text" -ForegroundColor Magenta }

Step 1 'Checking Node.js'
try { $v = (& node -v) } catch { $v = $null }
if (-not $v) { Write-Host 'Node.js is not installed. Install the LTS version from https://nodejs.org and run this script again.' -ForegroundColor Red; exit 1 }
Write-Host "Node $v found"

Step 2 'Logging in to Cloudflare (a browser window opens - press Allow)'
& npx.cmd --yes wrangler@4 login
if ($LASTEXITCODE -ne 0) { Write-Host 'Login failed.' -ForegroundColor Red; exit 1 }

Step 3 'Creating the storage for the daily limits (KV "RATE")'
$kvId = $null
$out = (& npx.cmd --yes wrangler@4 kv namespace create RATE 2>&1 | Out-String)
Write-Host $out
if ($out -match '"?id"?\s*[=:]\s*"([0-9a-f]{32})"') { $kvId = $Matches[1] }
if (-not $kvId) {
  Write-Host 'Looking for an existing namespace...'
  $list = (& npx.cmd --yes wrangler@4 kv namespace list 2>$null | Out-String)
  try {
    $items = $list | ConvertFrom-Json
    $hit = $items | Where-Object { $_.title -like '*RATE*' } | Select-Object -First 1
    if ($hit) { $kvId = $hit.id }
  } catch { }
}
if (-not $kvId) { Write-Host 'Could not create or find the KV namespace. Send the text above to Claude.' -ForegroundColor Red; exit 1 }
Write-Host "KV id: $kvId"

Step 4 'Writing wrangler.toml'
$toml = @"
name = "opetaja-abiline"
main = "worker.js"
compatibility_date = "2025-01-01"

[[kv_namespaces]]
binding = "RATE"
id = "$kvId"

# [vars]
# DAY_LIMIT_IP = "30"
# DAY_LIMIT_TOTAL = "250"
# MODEL = "gemini-3.5-flash"
"@
Set-Content -Path (Join-Path $PSScriptRoot 'wrangler.toml') -Value $toml -Encoding UTF8

Step 5 'Deploying the Worker (if asked to pick a workers.dev name - choose any, e.g. your name)'
$dep = (& npx.cmd --yes wrangler@4 deploy 2>&1 | Out-String)
Write-Host $dep
$url = $null
if ($dep -match 'https://[a-z0-9\-\.]+\.workers\.dev') { $url = $Matches[0] }
if (-not $url) { Write-Host 'Deploy did not print an address. Send the text above to Claude.' -ForegroundColor Red; exit 1 }

Step 6 'Secret Gemini key (get one free at https://aistudio.google.com/apikey)'
$sec = Read-Host 'Paste your Gemini key here and press Enter (nothing will be shown)' -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
$plain = ($plain -replace '[\s"''`]', '')
if (-not $plain) { Write-Host 'No key entered.' -ForegroundColor Red; exit 1 }
$plain | & npx.cmd --yes wrangler@4 secret put GEMINI_KEY
if ($LASTEXITCODE -ne 0) { Write-Host 'Saving the secret failed.' -ForegroundColor Red; exit 1 }
$plain = $null

Step 7 'Checking'
Start-Sleep -Seconds 4
try {
  $h = Invoke-RestMethod -Uri ($url + '/health') -TimeoutSec 20
  Write-Host ("health: ok={0} key={1} kv={2}" -f $h.ok, $h.key, $h.kv)
} catch { Write-Host "Health check did not answer yet ($($_.Exception.Message)). Open $url/health in the browser in a minute." -ForegroundColor Yellow }

Set-Content -Path (Join-Path $PSScriptRoot 'worker-url.txt') -Value $url -Encoding ASCII
try { Set-Clipboard -Value $url } catch { }
Write-Host ""
Write-Host "DONE. Your Worker address (copied to the clipboard):" -ForegroundColor Green
Write-Host $url -ForegroundColor Green
Write-Host "Send this address to Claude - it goes into js/config.js and the 'site key' mode turns on for everyone."
