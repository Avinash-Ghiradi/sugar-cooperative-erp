Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\Default_img_0.png"
$img = [System.Drawing.Bitmap]::FromFile($p)

Write-Output "Top-left pixel: $($img.GetPixel(0,0))"
Write-Output "Top-right pixel: $($img.GetPixel(399,0))"
Write-Output "Bottom-left pixel: $($img.GetPixel(0,311))"
Write-Output "Bottom-right pixel: $($img.GetPixel(399,311))"
Write-Output "Center pixel: $($img.GetPixel(200,100))"

# Check if transparent or solid background
$isTransparent = ($img.GetPixel(0,0).A -lt 255)
Write-Output "Is transparent at (0,0): $isTransparent (Alpha = $($img.GetPixel(0,0).A))"

$img.Dispose()
