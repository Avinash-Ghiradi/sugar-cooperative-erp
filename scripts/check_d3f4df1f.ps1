Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded\media_1792295000205_d3f4df1f.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
Write-Output "media_1792295000205_d3f4df1f.png: $($img.Width)x$($img.Height)"
$img.Dispose()
