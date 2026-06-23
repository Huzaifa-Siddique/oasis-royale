Set-Location 'D:\HUZAIFA\Oasis Royale'
Write-Output '--- remotes ---'
git remote -v
Write-Output '--- check-ignore ---'
$r = & git check-ignore -v src/types 2>$null
if ($LASTEXITCODE -eq 0) { Write-Output $r } else { Write-Output 'src/types not ignored or not present in .gitignore' }
Write-Output '--- ls-files for src/types ---'
& git ls-files src/types 2>$null
if ($LASTEXITCODE -eq 0) { Write-Output 'src/types is tracked' } else { Write-Output 'src/types not tracked' }
