Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos\bsskn_emblem_hq.png"
$img = [System.Drawing.Bitmap]::FromFile($p)

# Find exact bounding box of non-transparent pixels in bsskn_emblem_hq.png
$minX = $img.Width; $maxX = 0
$minY = $img.Height; $maxY = 0

for ($y = 0; $y -lt $img.Height; $y++) {
    for ($x = 0; $x -lt $img.Width; $x++) {
        $c = $img.GetPixel($x, $y)
        if ($c.A -gt 25) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Emblem bounds: X=$minX..$maxX (W=$($maxX-$minX+1)), Y=$minY..$maxY (H=$($maxY-$minY+1))"
$img.Dispose()
