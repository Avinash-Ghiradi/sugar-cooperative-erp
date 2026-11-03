Add-Type -AssemblyName System.Drawing

$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"
$img = [System.Drawing.Bitmap]::FromFile((Join-Path $outDir "header_right_logo.png"))

# Find bounding box
$minX = $img.Width; $maxX = 0
$minY = $img.Height; $maxY = 0

for ($y = 0; $y -lt $img.Height; $y++) {
    for ($x = 0; $x -lt $img.Width; $x++) {
        $c = $img.GetPixel($x, $y)
        $isBg = ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240) -or ($c.A -lt 10)
        if (-not $isBg) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Right logo bounding box: X=$minX..$maxX, Y=$minY..$maxY (W=$($maxX-$minX), H=$($maxY-$minY))"
if ($maxX -gt $minX -and $maxY -gt $minY) {
    $cropW = $maxX - $minX + 1
    $cropH = $maxY - $minY + 1
    $rect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
    $cropped = $img.Clone($rect, $img.PixelFormat)
    $cropped.Save((Join-Path $outDir "cropped_right_logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Output "Saved cropped_right_logo.png ($cropW x $cropH)"
}

$img.Dispose()
