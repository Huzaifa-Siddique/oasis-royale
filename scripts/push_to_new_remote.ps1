$repo = 'D:\HUZAIFA\Oasis Royale'
Set-Location -LiteralPath $repo
Write-Output "Current branch: $(git rev-parse --abbrev-ref HEAD)"
Write-Output "--- git status ---"
git status --porcelain
Write-Output "--- check src/types presence ---"
if (Test-Path -LiteralPath 'src\types') {
  Write-Output "src/types exists locally"
} else {
  Write-Output "src/types does not exist locally"
}
Write-Output "--- check if src/types is tracked ---"
git ls-files --error-unmatch src/types 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Output "src/types is tracked; removing from index..."
  git rm -r --cached src/types
} else {
  Write-Output "src/types is not tracked"
}
Write-Output "--- ensure .gitignore contains src/types ---"
$gitignorePath = Join-Path $repo '.gitignore'
$contains = $false
if (Test-Path -LiteralPath $gitignorePath) {
  $lines = Get-Content -LiteralPath $gitignorePath -ErrorAction SilentlyContinue
  if ($lines -and ($lines -contains 'src/types')) { $contains = $true }
}
if (-not $contains) {
  Write-Output "Adding src/types to .gitignore"
  Add-Content -LiteralPath $gitignorePath -Value 'src/types'
  git add .gitignore
  $null = git commit -m "chore: ignore src/types" 2>$null
  if ($LASTEXITCODE -ne 0) { Write-Output "No changes to commit for .gitignore" }
} else {
  Write-Output ".gitignore already ignores src/types"
}
Write-Output "--- commit any staged removals ---"
git add -A
$null = git commit -m "chore: remove src/types from tracking" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Output "No staged removals to commit" }

$remoteName = 'neworigin'
$remoteUrl = 'https://github.com/Huzaifa-Siddique/oasisroayel.git'
Write-Output "--- remote setup ---"
try {
  git remote get-url $remoteName 2>$null
  if ($LASTEXITCODE -eq 0) { Write-Output "Remote $remoteName already exists" } else { throw "no remote" }
} catch {
  Write-Output "Adding remote $remoteName -> $remoteUrl"
  git remote add $remoteName $remoteUrl
}
Write-Output "--- pushing to $remoteName main ---"
# Push current HEAD to main on the new remote
git push $remoteName HEAD:main -u
Write-Output "--- done ---"
