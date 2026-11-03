Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded\media_1792421474973_e1f2b742.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
Write-Output "e1f2b742.png: $($img.Width)x$($img.Height)"
$img.Dispose()
