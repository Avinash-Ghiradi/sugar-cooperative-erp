Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\Default_img_0.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"

# 1. Emblem circle crop:
# Center is approx (200, 122). Radius is approx 120.
# Box from X=80 to X=320 (width 240), Y=2 to Y=242 (height 240)
$emblemRect = New-Object System.Drawing.Rectangle(80, 2, 240, 240)
$emblem = $img.Clone($emblemRect, $img.PixelFormat)
$emblem.Save((Join-Path $outDir "bsskn_emblem_hq.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$emblem.Dispose()
Write-Output "Saved bsskn_emblem_hq.png (240x240)"

# 2. Also save full high-res logo trimmed
$img.Save((Join-Path $outDir "bsskn_full_logo_hq.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved bsskn_full_logo_hq.png (400x312)"

$img.Dispose()
