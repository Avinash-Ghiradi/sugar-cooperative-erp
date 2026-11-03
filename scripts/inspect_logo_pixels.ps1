Add-Type -AssemblyName System.Drawing

$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"

# Let's inspect cropped_factory_logo.png (163x130)
$logo = [System.Drawing.Bitmap]::FromFile((Join-Path $outDir "cropped_factory_logo.png"))
Write-Output "cropped_factory_logo.png: $($logo.Width)x$($logo.Height)"

# Print center colors
$cx = [int]($logo.Width / 2)
$cy = [int]($logo.Height / 2)
for ($y = $cy - 20; $y -le $cy + 20; $y += 5) {
    $row = ""
    for ($x = $cx - 30; $x -le $cx + 30; $x += 5) {
        $c = $logo.GetPixel($x, $y)
        if ($c.G -gt 150 -and $c.R -lt 100) { $row += "G" }
        elseif ($c.R -gt 180 -and $c.G -gt 140 -and $c.B -lt 100) { $row += "Y" } # Gold
        elseif ($c.R -gt 200 -and $c.G -gt 200 -and $c.B -gt 200) { $row += "W" }
        elseif ($c.R -lt 60 -and $c.G -lt 60 -and $c.B -lt 60) { $row += "D" }
        else { $row += "." }
    }
    Write-Output $row
}
$logo.Dispose()
