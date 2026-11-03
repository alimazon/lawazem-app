$out = "project-export-small.md"
"# Project Export: lawazem-app`n" | Out-File -FilePath $out -Encoding utf8
# استثناء كل ما هو ضخم أو غير ضروري للذكاء الاصطناعي
$exclude = "node_modules|\.next|\.git|\.vercel|_tools|_compress_tmp|_tmp_check|\.env\.local|package-lock|\.png$|\.jpg$|\.jpeg$|\.mp3$|\.pdf$|\.zip$|\.svg$|\.ico$|\.woff|\.ttf|\.json$|\.md$"
Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch $exclude } | ForEach-Object {
    # تجاهل أي ملف حجمه أكبر من 200 كيلوبايت (لتجنب الملفات الضخمة)
    if ($_.Length -lt 200KB) {
        $rel = $_.FullName.Substring((Get-Location).Path.Length + 1)
        "## $rel`n" | Out-File -FilePath $out -Append -Encoding utf8
        '```' + $_.Extension.TrimStart('.') | Out-File -FilePath $out -Append -Encoding utf8
        Get-Content -Path $_.FullName -Encoding utf8 | Out-File -FilePath $out -Append -Encoding utf8
        '```' | Out-File -FilePath $out -Append -Encoding utf8
        "" | Out-File -FilePath $out -Append -Encoding utf8
    }
}
Write-Host "Done! Small export created." -ForegroundColor Green
