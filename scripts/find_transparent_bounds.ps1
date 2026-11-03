Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\Default_img_0.png"
$img = [System.Drawing.Bitmap]::FromFile($p)

$minX = $img.Width; $maxX = 0
$minY = $img.Height; $maxY = 0

for ($y = 0; $y -lt $img.Height; $y++) {
    for ($x = 0; $x -lt $img.Width; $x++) {
        $c = $img.GetPixel($x, $y)
        if ($c.A -gt 20) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Overall visible content: X=$minX..$maxX (W=$($maxX-$minX+1)), Y=$minY..$maxY (H=$($maxY-$minY+1))"

# Check emblem (upper part) vs text (lower part)
# Look at row-by-row pixel count
for ($y = $minY; $y -le $maxY; $y += 5) {
    $count = 0
    for ($x = $minX; $x -le $maxX; $x++) {
        if ($img.GetPixel($x, $y).A -gt 20) { $count++ }
    }
    Write-Output ("Y={0:D3}: visible_pixels={1}" -f $y, $count)
}

$img.Dispose()
