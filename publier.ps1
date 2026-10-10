param([string]$Message = "mise a jour")
$scope = "wm-3858"

function Get-TopDeploy {
  $out = npx vercel ls --scope $scope 2>&1 | Out-String
  $line = ($out -split "`n" | Where-Object { $_ -match 'https://\S+\.vercel\.app' } | Select-Object -First 1)
  if (-not $line) { return @{ url = ""; status = "inconnu" } }
  $url = [regex]::Match($line, 'https://\S+\.vercel\.app').Value
  $st = "EnCours"
  if ($line -match 'Error') { $st = "Error" } elseif ($line -match 'Ready') { $st = "Ready" }
  return @{ url = $url; status = $st }
}

$branch = (git branch --show-current).Trim()
if ($branch -ne "six-piliers") { Write-Host "Vous etes sur '$branch', pas sur six-piliers. Rien n'a ete publie." -ForegroundColor Red; exit 1 }

Write-Host "1/5 Verification du code (tsc)..."
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { Write-Host "ERREURS DE CODE ci-dessus. Rien n'a ete publie. Collez-les moi." -ForegroundColor Red; exit 1 }

$before = (Get-TopDeploy).url

Write-Host "2/5 Enregistrement..."
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -m $Message } else { Write-Host "Rien de nouveau a enregistrer." }

Write-Host "3/5 Envoi sur GitHub..."
git push origin six-piliers
if ($LASTEXITCODE -ne 0) { Write-Host "Echec du push. Rien n'a ete publie." -ForegroundColor Red; exit 1 }

Write-Host "4/5 Attente du build Vercel (jusqu'a 6 minutes)..."
$d = $null
for ($i = 0; $i -lt 36; $i++) {
  Start-Sleep -Seconds 10
  $d = Get-TopDeploy
  if ($d.url -and $d.url -ne $before) {
    if ($d.status -eq "Ready") { break }
    if ($d.status -eq "Error") { Write-Host "Le build Vercel a echoue: $($d.url)" -ForegroundColor Red; Write-Host "Lancez: npx vercel logs $($d.url) --scope $scope"; exit 1 }
  }
  Write-Host "  ... en cours ($($i + 1)/36)"
}
if (-not $d -or $d.url -eq $before -or $d.status -ne "Ready") { Write-Host "Pas de nouveau deploiement pret apres 6 minutes. Verifiez: npx vercel ls --scope $scope" -ForegroundColor Red; exit 1 }

Write-Host "5/5 Mise en production de $($d.url)"
npx vercel promote $d.url --scope $scope
Write-Host "Termine. Rechargez le site avec Ctrl + Shift + R." -ForegroundColor Green