Add-Type -AssemblyName System.Drawing

$uploadDir = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded"
$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"

$img = [System.Drawing.Bitmap]::FromFile((Join-Path $uploadDir "media_1793183707402_bc5a7ec3.png"))
Write-Output "Image size: $($img.Width)x$($img.Height)"

$crop = $img.Clone((New-Object System.Drawing.Rectangle(250, 50, 550, 450)), $img.PixelFormat)
$crop.Save((Join-Path $outDir "bc5a7ec3_center.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$img.Dispose()
Write-Output "Cropped bc5a7ec3 successfully!"
