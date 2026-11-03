Add-Type -AssemblyName System.Drawing

$uploadDir = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded"
$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"

$img = [System.Drawing.Bitmap]::FromFile((Join-Path $uploadDir "media_1793425130048_76f5830f.png"))
Write-Output "ID card banner size: $($img.Width)x$($img.Height)"

# Crop left 200x200
$rect = New-Object System.Drawing.Rectangle(0, 0, 200, [Math]::Min(200, $img.Height))
$crop = $img.Clone($rect, $img.PixelFormat)
$crop.Save((Join-Path $outDir "id_card_crop_left.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$img.Dispose()
Write-Output "Saved id_card_crop_left.png"
