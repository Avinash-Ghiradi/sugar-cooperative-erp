Add-Type -AssemblyName System.Drawing

$uploadDir = "C:\Users\New\.gemini\antigravity\brain\09c94240-fca2-4544-9ada-6347d9444fbf\.user_uploaded"
$img = [System.Drawing.Bitmap]::FromFile((Join-Path $uploadDir "media_1793263162308_df54feb9.png"))

Write-Output "Image size: $($img.Width)x$($img.Height)"

# Grid scan: find colorful clusters
for ($y = 0; $y -lt $img.Height; $y += 10) {
    $row = ""
    for ($x = 0; $x -lt $img.Width; $x += 15) {
        $c = $img.GetPixel($x, $y)
        $isWhiteOrGrey = ([Math]::Abs($c.R - $c.G) -lt 15) -and ([Math]::Abs($c.G - $c.B) -lt 15)
        if ($isWhiteOrGrey) {
            $row += " "
        } else {
            $row += "C"
        }
    }
    if ($row -match "C") {
        Write-Output ("Y={0:D3}: {1}" -f $y, $row)
    }
}
$img.Dispose()
