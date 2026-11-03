Add-Type -AssemblyName System.Drawing

$uploadDir = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded"
$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"

$img = [System.Drawing.Bitmap]::FromFile((Join-Path $uploadDir "media_1793183707364_eb592ceb.png"))
Write-Output "Image size: $($img.Width)x$($img.Height)"

# In this screenshot, the user is showing their browser where they uploaded logo, background, and sign!
# Let's crop the main sections of the screen
# Usually ID card generator or settings preview is around center
$crop1 = $img.Clone((New-Object System.Drawing.Rectangle(0, 0, 500, 500)), $img.PixelFormat)
$crop1.Save((Join-Path $outDir "eb592ceb_topleft.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$crop1.Dispose()

$crop2 = $img.Clone((New-Object System.Drawing.Rectangle(300, 100, 500, 400)), $img.PixelFormat)
$crop2.Save((Join-Path $outDir "eb592ceb_center.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$crop2.Dispose()

$img.Dispose()
Write-Output "Cropped eb592ceb successfully!"
