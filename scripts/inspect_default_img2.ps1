Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\Default_img_2.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
Write-Output "Default_img_2.png: $($img.Width)x$($img.Height)"
$img.Dispose()
