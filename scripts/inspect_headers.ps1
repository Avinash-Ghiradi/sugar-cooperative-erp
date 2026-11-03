Add-Type -AssemblyName System.Drawing

$uploadDir = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded"
$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"

$inspectFiles = @(
  "media_1793274504610_b49cc326.png",
  "media_1793265647601_4b40f068.png",
  "media_1793268872745_d63cd9fe.png",
  "media_1793270888763_d8b73359.png"
)

foreach ($f in $inspectFiles) {
    $full = Join-Path $uploadDir $f
    if (Test-Path $full) {
        $img = [System.Drawing.Image]::FromFile($full)
        Write-Output "$f : $($img.Width)x$($img.Height)"
        $img.Dispose()
    }
}
