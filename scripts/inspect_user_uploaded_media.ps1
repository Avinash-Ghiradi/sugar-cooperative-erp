Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded\media_1793692923832_81224c7b.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
Write-Output "media_1793692923832_81224c7b.png: $($img.Width)x$($img.Height)"

# Inspect pixels
for ($y = 0; $y -lt $img.Height; $y += 5) {
    $line = ""
    for ($x = 0; $x -lt $img.Width; $x += 3) {
        $c = $img.GetPixel($x, $y)
        if ($c.G -gt 100 -and $c.R -lt 50) { $line += "G" } # Green
        elseif ($c.R -gt 150 -and $c.G -gt 120 -and $c.B -lt 60) { $line += "Y" } # Gold
        elseif ($c.B -gt 150 -and $c.R -lt 100) { $line += "B" } # Blue (shortcut arrow)
        elseif ($c.R -gt 200 -and $c.G -gt 200 -and $c.B -gt 200) { $line += "W" }
        elseif ($c.R -lt 30 -and $c.G -lt 30 -and $c.B -lt 40) { $line += " " }
        else { $line += "." }
    }
    if ($line.Trim().Length -gt 0) {
        Write-Output ("{0:D3}: {1}" -f $y, $line)
    }
}
$img.Dispose()
