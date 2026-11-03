Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos\bsskn_emblem_hq.png"
$img = [System.Drawing.Bitmap]::FromFile($p)

# Check colors around the perimeter of the circle (radius ~ 118)
$cx = 120; $cy = 120
$angles = 0..12 | ForEach-Object { $_ * 30 }

foreach ($a in $angles) {
    $rad = $a * [Math]::PI / 180
    $x = [int]($cx + 115 * [Math]::Cos($rad))
    $y = [int]($cy + 115 * [Math]::Sin($rad))
    if ($x -ge 0 -and $x -lt $img.Width -and $y -ge 0 -and $y -lt $img.Height) {
        $c = $img.GetPixel($x, $y)
        Write-Output ("Angle {0:D3} deg at ({1},{2}): R={3}, G={4}, B={5}, A={6}" -f $a, $x, $y, $c.R, $c.G, $c.B, $c.A)
    }
}

$img.Dispose()
