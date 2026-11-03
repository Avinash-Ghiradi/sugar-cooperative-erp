Add-Type -AssemblyName System.Drawing

$p = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\Default_img_0.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
Write-Output "Image dimensions: $($img.Width)x$($img.Height)"

# Let's inspect the circular emblem:
# Scan for the gold rim or green outer ring
$cx = [int]($img.Width / 2)
Write-Output "Center X: $cx"

# Find top of circle, bottom of circle, left, right
$minX = $img.Width; $maxX = 0
$minY = $img.Height; $maxY = 0

for ($y = 0; $y -lt 220; $y++) {
    for ($x = 0; $x -lt $img.Width; $x++) {
        $c = $img.GetPixel($x, $y)
        # Check if not dark background (R>50 or G>50 or B>50)
        if ($c.R -gt 50 -or $c.G -gt 50 -or $c.B -gt 50) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Emblem bounds: X=$minX..$maxX (W=$($maxX-$minX)), Y=$minY..$maxY (H=$($maxY-$minY))"

$img.Dispose()
