$out = "project-export.md"
"# Project Export: lawazem-app`n" | Out-File -FilePath $out -Encoding utf8
$exclude = "node_modules|\.next|\.git|\.vercel|_tools|_compress_tmp|_tmp_check|\.env\.local|package-lock|\.png$|\.jpg$|\.jpeg$|\.mp3$|\.pdf$|\.zip$|\.svg$|\.ico$"
Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch $exclude } | ForEach-Object {
    $rel = $_.FullName.Substring((Get-Location).Path.Length + 1)
    "## $rel`n" | Out-File -FilePath $out -Append -Encoding utf8
    '```' + $_.Extension.TrimStart('.') | Out-File -FilePath $out -Append -Encoding utf8
    Get-Content -Path $_.FullName -Encoding utf8 | Out-File -FilePath $out -Append -Encoding utf8
    '```' | Out-File -FilePath $out -Append -Encoding utf8
    "" | Out-File -FilePath $out -Append -Encoding utf8
}
Write-Host "Done! project-export.md created." -ForegroundColor Green
