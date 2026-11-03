Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\scripts\extracted_logos\bsskn_emblem_hq.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

function GenerateAppIcon($size, $destPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Calculate emblem positioning: 90% of size for maximum visibility and clarity on desktop
    $padding = [Math]::Round($size * 0.05)
    $drawSize = $size - ($padding * 2)
    
    # Optional subtle soft glow/shadow behind emblem for contrast against light/dark wallpapers
    $cx = $size / 2.0
    $cy = $size / 2.0
    $r = $drawSize / 2.0

    # Draw subtle soft circular backdrop so it looks crisp on any desktop
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse([float]($cx - $r), [float]($cy - $r), [float]($r * 2), [float]($r * 2))
    
    # Soft emerald aura
    $auraBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 5, 150, 105))
    $g.FillPath($auraBrush, $path)
    $auraBrush.Dispose()

    # Draw the official high-resolution emblem
    $destRect = New-Object System.Drawing.Rectangle($padding, $padding, $drawSize, $drawSize)
    $g.DrawImage($src, $destRect)

    $path.Dispose()
    $g.Dispose()

    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generated: $destPath ($size x $size)"
}

$destinations = @(
    "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\icon-192.png",
    "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\icon-512.png",
    "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\id_assets\icon-192.png",
    "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\id_assets\icon-512.png"
)

GenerateAppIcon 192 "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\icon-192.png"
GenerateAppIcon 512 "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\icon-512.png"

# Copy 192 and 512 to id_assets
Copy-Item "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\icon-192.png" "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\id_assets\icon-192.png" -Force
Copy-Item "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\icon-512.png" "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\id_assets\icon-512.png" -Force

# Replace bsskn_logo.png and bsskn_logo_transparent.png with the official 240x240 emblem!
Copy-Item $srcPath "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\id_assets\bsskn_logo.png" -Force
Copy-Item $srcPath "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\id_assets\bsskn_logo_transparent.png" -Force

# Also generate favicon.ico / 48x48 icon for browser tabs & Windows shortcut
GenerateAppIcon 48 "C:\Users\New\.gemini\antigravity\scratch\sugar_cooperative_erp\client\public\icon-48.png"

$src.Dispose()
Write-Output "All icons generated and updated successfully!"
