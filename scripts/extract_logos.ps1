Add-Type -AssemblyName System.Drawing

$uploadDir = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded"
$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 1. Inspect media_1793263162308_df54feb9.png (886x170)
$headerImg = [System.Drawing.Bitmap]::FromFile((Join-Path $uploadDir "media_1793263162308_df54feb9.png"))
Write-Output "Header image: $($headerImg.Width)x$($headerImg.Height)"

# Crop left logo (approx 170x170)
$leftRect = New-Object System.Drawing.Rectangle(0, 0, 170, 170)
$leftLogo = $headerImg.Clone($leftRect, $headerImg.PixelFormat)
$leftLogo.Save((Join-Path $outDir "header_left_logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$leftLogo.Dispose()

# Crop right logo (approx 170x170 from right side)
$rightRect = New-Object System.Drawing.Rectangle(716, 0, 170, 170)
$rightLogo = $headerImg.Clone($rightRect, $headerImg.PixelFormat)
$rightLogo.Save((Join-Path $outDir "header_right_logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$rightLogo.Dispose()
$headerImg.Dispose()

# 2. Inspect media_1793252564595_170eb034.png (462x275)
$settingsImg = [System.Drawing.Bitmap]::FromFile((Join-Path $uploadDir "media_1793252564595_170eb034.png"))
Write-Output "Settings card: $($settingsImg.Width)x$($settingsImg.Height)"
$settingsImg.Save((Join-Path $outDir "settings_card.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$settingsImg.Dispose()

Write-Output "Saved extractions successfully!"
