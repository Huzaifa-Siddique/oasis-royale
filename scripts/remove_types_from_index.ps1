Set-Location 'D:\HUZAIFA\Oasis Royale'
Write-Output '--- tracked files under src/types ---'
git ls-files -- "src/types" "src/types/*" 2>$null
Write-Output '--- removing src/types from index (cached) ---'
git rm -r --cached "src/types" 2>$null
$null = git commit -m "chore: remove src/types from repo" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Output "No commit was created (nothing staged)" } else { Write-Output "Committed removal of src/types" }
Write-Output '--- pushing commit to origin main ---'
git push origin HEAD:refs/heads/main -u
Write-Output '--- done ---'
