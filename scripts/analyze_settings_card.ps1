Add-Type -AssemblyName System.Drawing

$outDir = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos"
$uploadDir = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded"

# Let's inspect settings_card.png
$settingsImg = [System.Drawing.Bitmap]::FromFile((Join-Path $outDir "settings_card.png"))

# In SettingsModule.jsx:
# The preview image is in a circular or rounded box inside the card.
# Let's inspect colors across the image to find the logo coordinates
for ($y = 10; $y -lt $settingsImg.Height; $y += 20) {
    for ($x = 10; $x -lt $settingsImg.Width; $x += 30) {
        $c = $settingsImg.GetPixel($x, $y)
        # If green or gold or colorful
        if ($c.G -gt 100 -and $c.R -lt 150) {
            Write-Output "Greenish pixel at ($x, $y): R=$($c.R), G=$($c.G), B=$($c.B)"
        }
    }
}
$settingsImg.Dispose()
