Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\Default_img_0.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
Write-Output "Default_img_0.png: $($img.Width)x$($img.Height)"

# Sample colors across image
for ($y = 0; $y -lt $img.Height; $y += 20) {
    $line = ""
    for ($x = 0; $x -lt $img.Width; $x += 15) {
        $c = $img.GetPixel($x, $y)
        if ($c.G -gt 120 -and $c.R -lt 80) { $line += "G" } # Green
        elseif ($c.R -gt 150 -and $c.G -gt 120 -and $c.B -lt 60) { $line += "Y" } # Gold
        elseif ($c.R -gt 220 -and $c.G -gt 220 -and $c.B -gt 220) { $line += "." } # White/light
        elseif ($c.R -lt 40 -and $c.G -lt 40 -and $c.B -lt 40) { $line += "D" }
        else { $line += "#" }
    }
    Write-Output ("{0:D3}: {1}" -f $y, $line)
}
$img.Dispose()
