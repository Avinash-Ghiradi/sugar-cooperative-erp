Add-Type -AssemblyName System.Drawing

$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"
$img = [System.Drawing.Bitmap]::FromFile((Join-Path $outDir "header_left_logo.png"))

for ($y = 0; $y -lt $img.Height; $y += 5) {
    $row = ""
    for ($x = 0; $x -lt $img.Width; $x += 5) {
        $c = $img.GetPixel($x, $y)
        if ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240) {
            $row += " "
        } else {
            $row += "#"
        }
    }
    if ($row -match "#") {
        Write-Output ("Line {0:D3}: {1}" -f $y, $row)
    }
}
$img.Dispose()
