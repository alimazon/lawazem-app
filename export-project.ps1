$exclude = @('node_modules', '.next', '.git', '.env.local', 'package-lock.json', 'public\notes', '.ico')
$outputFile = "project-export.md"
$root = (Get-Location).Path

if (Test-Path $outputFile) { Remove-Item $outputFile }

$sb = New-Object System.Text.StringBuilder

Get-ChildItem -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    $skip = $false
    foreach ($ex in $exclude) {
        if ($rel -like "*$ex*") { $skip = $true }
    }
    -not $skip
} | Sort-Object FullName | ForEach-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    $content = [System.IO.File]::ReadAllText($_.FullName)
    [void]$sb.AppendLine("`n## $rel`n")
    [void]$sb.AppendLine('```')
    [void]$sb.AppendLine($content)
    [void]$sb.AppendLine('```')
}

[System.IO.File]::WriteAllText("$root\$outputFile", $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "تم إنشاء الملف: $outputFile"