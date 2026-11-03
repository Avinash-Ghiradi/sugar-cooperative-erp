Add-Type -AssemblyName System.Drawing

$uploadDir = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded"
$files = @(
  "media_1793252564595_170eb034.png",
  "media_1793183707364_eb592ceb.png",
  "media_1793183707402_bc5a7ec3.png",
  "media_1793184933064_9638fd39.png",
  "media_1793263162308_df54feb9.png",
  "media_1793440230199_a28219cc.jpg",
  "media_1793440230204_1f0fcf00.jpg",
  "media_1793425130048_76f5830f.png"
)

foreach ($f in $files) {
    $full = Join-Path $uploadDir $f
    if (Test-Path $full) {
        $img = [System.Drawing.Image]::FromFile($full)
        Write-Output "$f : $($img.Width)x$($img.Height)"
        $img.Dispose()
    }
}
