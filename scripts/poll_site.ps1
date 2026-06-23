$url = 'https://oasisr0yale.netlify.app/'
for ($i = 0; $i -lt 6; $i++) {
  Write-Output "--- check $i ---"
  try {
    $res = curl.exe -s -I $url
    Write-Output $res
  } catch {
    Write-Output "curl failed: $_"
  }
  Start-Sleep -Seconds 20
}
