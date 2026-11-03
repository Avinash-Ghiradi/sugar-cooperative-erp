Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded\media_1792295000205_d3f4df1f.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
$crop = $img.Clone((New-Object System.Drawing.Rectangle(0, 0, 80, 78)), $img.PixelFormat)
$crop.Save("C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos\id_header_logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$img.Dispose()
Write-Output "Saved id_header_logo.png"
