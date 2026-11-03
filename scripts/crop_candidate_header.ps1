Add-Type -AssemblyName System.Drawing

$uploadDir = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded"
$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"

$img = [System.Drawing.Bitmap]::FromFile((Join-Path $uploadDir "media_1793265647601_4b40f068.png"))
Write-Output "Image size: $($img.Width)x$($img.Height)"

# Crop left 165x165
$rect = New-Object System.Drawing.Rectangle(0, 0, 165, 165)
$crop = $img.Clone($rect, $img.PixelFormat)
$crop.Save((Join-Path $outDir "crop_4b40f068_left.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$img.Dispose()
Write-Output "Saved crop_4b40f068_left.png"

# Also check media_1793274504610_b49cc326.png (518x210)
$img2 = [System.Drawing.Bitmap]::FromFile((Join-Path $uploadDir "media_1793274504610_b49cc326.png"))
$img2.Save((Join-Path $outDir "b49cc326_full.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$img2.Dispose()
Write-Output "Saved b49cc326_full.png"
