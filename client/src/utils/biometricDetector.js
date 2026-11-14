/**
 * Biometric Detection & Image Processing Utility for Sugar Cooperative ERP
 * 
 * Provides automated AI / Computer Vision detection and cropping for:
 * 1. Face / Shareholder Photo (Shape Detection API + Skin/Contour Fallback)
 * 2. Signature on Paper (Ink stroke clustering & paper background isolation)
 * 3. Thumb Impression (Fingerprint ink density boundary detection)
 * 4. Image Enhancement (Ink clean, background whitening, auto levels, rotation)
 */

/**
 * Helper to get a downscaled canvas for fast image analysis
 */
function getScaledCanvas(source, maxDim = 300) {
  const w = source.naturalWidth || source.videoWidth || source.width;
  const h = source.naturalHeight || source.videoHeight || source.height;
  if (!w || !h) return null;

  let scale = 1;
  if (Math.max(w, h) > maxDim) {
    scale = maxDim / Math.max(w, h);
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx, origW: w, origH: h, scale };
}

/**
 * 1. AI FACE DETECTION & AUTO-CROP
 * Detects shareholder face, centers and crops with standard passport margins (3:4 ratio).
 */
export async function detectFace(sourceImage) {
  const origW = sourceImage.naturalWidth || sourceImage.videoWidth || sourceImage.width;
  const origH = sourceImage.naturalHeight || sourceImage.videoHeight || sourceImage.height;
  if (!origW || !origH) return getFallbackCrop(origW, origH, 3 / 4);

  // A. Check for Native Browser FaceDetector (Chromium / Android Chrome)
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(sourceImage);
      if (faces && faces.length > 0) {
        const box = faces[0].boundingBox;
        // Add passport margins: head room on top, shoulders on bottom, sides
        const topMargin = box.height * 0.45;
        const bottomMargin = box.height * 0.65;
        const sideMargin = box.width * 0.35;

        const cropY = Math.max(0, box.y - topMargin);
        const cropH = Math.min(origH - cropY, box.height + topMargin + bottomMargin);
        const targetW = cropH * (3 / 4);
        const centerX = box.x + box.width / 2;
        const cropX = Math.max(0, Math.min(origW - targetW, centerX - targetW / 2));

        return {
          x: Math.round(cropX),
          y: Math.round(cropY),
          width: Math.round(Math.min(targetW, origW - cropX)),
          height: Math.round(cropH),
          type: 'face',
          confidence: 0.95
        };
      }
    } catch (e) {
      // Fall through to Canvas Computer Vision
    }
  }

  // B. Fast Pure-JS Canvas Computer Vision (Skin Tone & Head Cluster Profiler)
  const scaled = getScaledCanvas(sourceImage, 240);
  if (!scaled) return getFallbackCrop(origW, origH, 3 / 4);

  const { ctx, canvas, scale } = scaled;
  const sw = canvas.width;
  const sh = canvas.height;
  const imgData = ctx.getImageData(0, 0, sw, sh).data;

  // We scan for skin tone pixels in YCbCr color space
  const skinPixels = [];
  const xProfile = new Int32Array(sw);
  const yProfile = new Int32Array(sh);

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = (y * sw + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];

      // YCbCr conversion
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      // Skin chromaticity check
      const isSkin = cb >= 77 && cb <= 128 && cr >= 132 && cr <= 174 && r > 60 && r > g && (r - g) > 10;
      if (isSkin) {
        skinPixels.push({ x, y });
        xProfile[x]++;
        yProfile[y]++;
      }
    }
  }

  // If sufficient skin pixels found, locate cluster
  if (skinPixels.length > 150) {
    let minX = sw, maxX = 0, minY = sh, maxY = 0;
    let sumX = 0, sumY = 0;

    // Filter outliers: use 10th to 90th percentile to ignore hands or background
    skinPixels.sort((a, b) => a.y - b.y);
    const startIdx = Math.floor(skinPixels.length * 0.1);
    const endIdx = Math.floor(skinPixels.length * 0.9);
    const corePixels = skinPixels.slice(startIdx, endIdx);

    for (const p of corePixels) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
    }

    const faceCenterY = (sumY / corePixels.length) / scale;
    const faceCenterX = (sumX / corePixels.length) / scale;
    const faceW = Math.max(origW * 0.25, (maxX - minX) / scale);
    const faceH = Math.max(origH * 0.25, (maxY - minY) / scale);

    // Build passport crop box (3:4 ratio)
    const cropH = Math.min(origH, faceH * 2.0);
    const cropW = Math.min(origW, cropH * (3 / 4));
    const cropX = Math.max(0, Math.min(origW - cropW, faceCenterX - cropW / 2));
    const cropY = Math.max(0, Math.min(origH - cropH, faceCenterY - cropH * 0.4));

    return {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropW),
      height: Math.round(cropH),
      type: 'face',
      confidence: 0.82
    };
  }

  // Fallback centered passport crop
  return getFallbackCrop(origW, origH, 3 / 4);
}

/**
 * 2. AI SIGNATURE DETECTION & AUTO-CROP
 * Detects ink stroke boundary on paper, removes empty borders, and crops tightly (3:1 or 4:2 ratio).
 */
export function detectSignature(sourceImage) {
  const origW = sourceImage.naturalWidth || sourceImage.videoWidth || sourceImage.width;
  const origH = sourceImage.naturalHeight || sourceImage.videoHeight || sourceImage.height;
  if (!origW || !origH) return getFallbackCrop(origW, origH, 3 / 1);

  const scaled = getScaledCanvas(sourceImage, 360);
  if (!scaled) return getFallbackCrop(origW, origH, 3 / 1);

  const { ctx, canvas, scale } = scaled;
  const sw = canvas.width;
  const sh = canvas.height;
  const imgData = ctx.getImageData(0, 0, sw, sh).data;

  // 1. Sample corners to estimate background paper luminance
  let bgSum = 0;
  let bgSamples = 0;
  const cornerSize = Math.max(5, Math.floor(Math.min(sw, sh) * 0.08));

  for (let y = 0; y < sh; y += 2) {
    for (let x = 0; x < sw; x += 2) {
      const isCorner =
        (x < cornerSize && y < cornerSize) ||
        (x > sw - cornerSize && y < cornerSize) ||
        (x < cornerSize && y > sh - cornerSize) ||
        (x > sw - cornerSize && y > sh - cornerSize) ||
        (x < 10) || (x > sw - 10) || (y < 10) || (y > sh - 10);

      if (isCorner) {
        const idx = (y * sw + x) * 4;
        const lum = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
        bgSum += lum;
        bgSamples++;
      }
    }
  }

  const avgBg = bgSamples > 0 ? (bgSum / bgSamples) : 220;
  // Ink pixels are darker than background by threshold or have strong dark ink colors (blue/black)
  const inkThreshold = Math.max(70, Math.min(180, avgBg - 35));

  const inkPoints = [];
  for (let y = 5; y < sh - 5; y++) {
    for (let x = 5; x < sw - 5; x++) {
      const idx = (y * sw + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Check for ink: darker than paper or blue ink pen saturation
      const isDarkInk = lum < inkThreshold;
      const isBlueInk = (b > r + 20 && b > g + 10 && lum < avgBg - 20);

      if (isDarkInk || isBlueInk) {
        inkPoints.push({ x, y });
      }
    }
  }

  // If ink strokes detected
  if (inkPoints.length > 50) {
    // Trim top/bottom 3% outliers (dust, paper borders)
    inkPoints.sort((a, b) => a.x - b.x);
    const xMin = inkPoints[Math.floor(inkPoints.length * 0.02)].x;
    const xMax = inkPoints[Math.floor(inkPoints.length * 0.98)].x;

    inkPoints.sort((a, b) => a.y - b.y);
    const yMin = inkPoints[Math.floor(inkPoints.length * 0.02)].y;
    const yMax = inkPoints[Math.floor(inkPoints.length * 0.98)].y;

    // Convert to original coordinates
    const origMinX = xMin / scale;
    const origMaxX = xMax / scale;
    const origMinY = yMin / scale;
    const origMaxY = yMax / scale;

    const rawW = origMaxX - origMinX;
    const rawH = origMaxY - origMinY;

    // If detected ink spans almost the whole document page (e.g. form with printed rows),
    // prevent full-page selection and provide a centered focused signature strip instead
    if (rawH > origH * 0.65 && rawW > origW * 0.65) {
      const defaultW = Math.round(origW * 0.80);
      const defaultH = Math.round(defaultW / 2.8);
      return {
        x: Math.round((origW - defaultW) / 2),
        y: Math.round((origH - defaultH) / 2),
        width: defaultW,
        height: Math.min(origH, defaultH),
        type: 'signature',
        confidence: 0.70
      };
    }

    // Add 15% breathing room around signature
    const padX = rawW * 0.15;
    const padY = rawH * 0.20;

    let cropX = Math.max(0, origMinX - padX);
    let cropY = Math.max(0, origMinY - padY);
    let cropW = Math.min(origW - cropX, rawW + padX * 2);
    let cropH = Math.min(origH - cropY, rawH + padY * 2);

    // Maintain a comfortable wide signature strip (approx 2.5:1 to 3:1)
    if (cropW < cropH * 2.0) {
      const desiredW = cropH * 2.4;
      cropX = Math.max(0, Math.min(origW - desiredW, cropX - (desiredW - cropW) / 2));
      cropW = Math.min(origW - cropX, desiredW);
    }

    return {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropW),
      height: Math.round(cropH),
      type: 'signature',
      confidence: 0.90
    };
  }

  // Fallback centered horizontal strip for signature
  const defaultW = Math.round(origW * 0.85);
  const defaultH = Math.round(defaultW / 2.8);
  return {
    x: Math.round((origW - defaultW) / 2),
    y: Math.round((origH - defaultH) / 2),
    width: defaultW,
    height: Math.min(origH, defaultH),
    type: 'signature',
    confidence: 0.60
  };
}

/**
 * 3. AI THUMB IMPRESSION DETECTION & AUTO-CROP
 * Detects fingerprint ink cluster (blue/purple/black ink), centers fingerprint, crops 4:5 ratio.
 */
export function detectThumbImpression(sourceImage) {
  const origW = sourceImage.naturalWidth || sourceImage.videoWidth || sourceImage.width;
  const origH = sourceImage.naturalHeight || sourceImage.videoHeight || sourceImage.height;
  if (!origW || !origH) return getFallbackCrop(origW, origH, 4 / 5);

  const scaled = getScaledCanvas(sourceImage, 320);
  if (!scaled) return getFallbackCrop(origW, origH, 4 / 5);

  const { ctx, canvas, scale } = scaled;
  const sw = canvas.width;
  const sh = canvas.height;
  const imgData = ctx.getImageData(0, 0, sw, sh).data;

  // Fingerprint ink stamp typically has:
  // Concentrated cluster of ink (blue/purple/black stamp ink)
  const inkPixels = [];
  let sumX = 0, sumY = 0;

  for (let y = 10; y < sh - 10; y++) {
    for (let x = 10; x < sw - 10; x++) {
      const idx = (y * sw + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Ink stamp criteria: dark or deep blue/purple stamp pad ink
      const isStampInk =
        lum < 160 ||
        (b > r + 15 && b > g + 15 && lum < 200) ||
        (r > g + 15 && b > g + 15 && lum < 180); // purple stamp ink

      if (isStampInk) {
        inkPixels.push({ x, y, lum });
        sumX += x;
        sumY += y;
      }
    }
  }

  if (inkPixels.length > 80) {
    const avgX = sumX / inkPixels.length;
    const avgY = sumY / inkPixels.length;

    // Calculate spread from center to find thumbprint oval
    let maxDistX = 0;
    let maxDistY = 0;
    const validPixels = [];

    // Filter pixels reasonably close to centroid
    for (const p of inkPixels) {
      const dx = Math.abs(p.x - avgX);
      const dy = Math.abs(p.y - avgY);
      if (dx < sw * 0.4 && dy < sh * 0.4) {
        validPixels.push(p);
      }
    }

    if (validPixels.length > 50) {
      validPixels.sort((a, b) => a.x - b.x);
      const minX = validPixels[Math.floor(validPixels.length * 0.05)].x;
      const maxX = validPixels[Math.floor(validPixels.length * 0.95)].x;

      validPixels.sort((a, b) => a.y - b.y);
      const minY = validPixels[Math.floor(validPixels.length * 0.05)].y;
      const maxY = validPixels[Math.floor(validPixels.length * 0.95)].y;

      const rawW = (maxX - minX) / scale;
      const rawH = (maxY - minY) / scale;

      // If detected pixels span whole page, return a focused centered thumb box
      if (rawH > origH * 0.65 && rawW > origW * 0.65) {
        const defaultH = Math.round(origH * 0.60);
        const defaultW = Math.round(defaultH * (4 / 5));
        return {
          x: Math.round((origW - defaultW) / 2),
          y: Math.round((origH - defaultH) / 2),
          width: Math.min(origW, defaultW),
          height: Math.min(origH, defaultH),
          type: 'thumb',
          confidence: 0.70
        };
      }

      const pad = Math.max(rawW, rawH) * 0.20;

      const targetH = rawH + pad * 2;
      const targetW = targetH * (4 / 5); // 4:5 vertical portrait aspect ratio

      const centerX = (minX + maxX) / (2 * scale);
      const centerY = (minY + maxY) / (2 * scale);

      const cropX = Math.max(0, Math.min(origW - targetW, centerX - targetW / 2));
      const cropY = Math.max(0, Math.min(origH - targetH, centerY - targetH / 2));

      return {
        x: Math.round(cropX),
        y: Math.round(cropY),
        width: Math.round(Math.min(targetW, origW - cropX)),
        height: Math.round(Math.min(targetH, origH - cropY)),
        type: 'thumb',
        confidence: 0.88
      };
    }
  }

  // Fallback centered 4:5 portrait crop
  return getFallbackCrop(origW, origH, 4 / 5);
}

/**
 * Fallback centered crop for any target aspect ratio
 */
function getFallbackCrop(w, h, targetAspect) {
  const origW = w || 400;
  const origH = h || 400;

  let cropW, cropH;
  if (origW / origH > targetAspect) {
    cropH = Math.round(origH * 0.85);
    cropW = Math.round(cropH * targetAspect);
  } else {
    cropW = Math.round(origW * 0.85);
    cropH = Math.round(cropW / targetAspect);
  }

  const cropX = Math.round((origW - cropW) / 2);
  const cropY = Math.round((origH - cropH) / 2);

  return {
    x: Math.max(0, cropX),
    y: Math.max(0, cropY),
    width: Math.min(origW, cropW),
    height: Math.min(origH, cropH),
    confidence: 0.50
  };
}

/**
 * 4. ADVANCED INK CLEANING & ENHANCEMENT FILTER
 * Cleans paper background to pure white `#FFFFFF` and darkens ink strokes for official document clarity.
 */
export function applyInkEnhancement(canvas, mode = 'signature') {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Compute paper background luminance
  let totalLum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 16) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    totalLum += lum;
    count++;
  }
  const avgLum = count > 0 ? totalLum / count : 200;
  // Threshold separating paper from ink
  const cutoff = Math.max(120, avgLum - (mode === 'thumb' ? 25 : 35));

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum > cutoff) {
      // Paper background -> turn to pure clean white
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    } else {
      // Ink stroke -> boost ink darkness & contrast
      const factor = Math.max(0, (lum / cutoff));
      if (mode === 'signature') {
        // Deep blue/black signature ink
        data[i] = Math.round(r * factor * 0.6);
        data[i + 1] = Math.round(g * factor * 0.6);
        data[i + 2] = Math.min(120, Math.round(b * factor * 0.9));
      } else if (mode === 'thumb') {
        // High contrast fingerprint ridge
        const ridgeVal = Math.round(lum * factor * 0.7);
        data[i] = ridgeVal;
        data[i + 1] = ridgeVal;
        data[i + 2] = Math.min(160, ridgeVal + 20); // subtle blue stamp ink tone
      } else {
        // Photo auto-levels
        data[i] = Math.round(r * 0.9);
        data[i + 1] = Math.round(g * 0.9);
        data[i + 2] = Math.round(b * 0.9);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * 5. PHOTO AUTO-LEVELS & CONTRAST FILTER
 */
export function applyPhotoAutoLevels(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Find min and max luminance for histogram stretch
  let minLum = 255, maxLum = 0;
  for (let i = 0; i < data.length; i += 16) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  const range = Math.max(1, maxLum - minLum);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const val = data[i + c];
      const stretched = ((val - minLum) / range) * 255;
      data[i + c] = Math.max(0, Math.min(255, Math.round(stretched * 1.05)));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Rotate an Image or Canvas by degrees (90, 180, 270)
 */
export function rotateCanvas(source, degrees) {
  const normDeg = ((degrees % 360) + 360) % 360;
  if (normDeg === 0) return source;

  const w = source.width;
  const h = source.height;
  const canvas = document.createElement('canvas');

  if (normDeg === 90 || normDeg === 270) {
    canvas.width = h;
    canvas.height = w;
  } else {
    canvas.width = w;
    canvas.height = h;
  }

  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((normDeg * Math.PI) / 180);
  ctx.drawImage(source, -w / 2, -h / 2);

  return canvas;
}

/**
 * Render cropped image from source onto target canvas and return Base64 DataURL
 */
export function cropAndExport(source, cropBox, options = {}) {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.85,
    format = 'image/jpeg',
    enhancement = 'none', // 'none' | 'ink_clean' | 'auto_levels'
    mode = 'photo' // 'photo' | 'signature' | 'thumb'
  } = options;

  let { x, y, width, height } = cropBox;
  x = Math.max(0, Math.round(x));
  y = Math.max(0, Math.round(y));
  width = Math.max(20, Math.round(width));
  height = Math.max(20, Math.round(height));

  // Determine export dimensions preserving aspect ratio
  let outW = width;
  let outH = height;
  if (outW > maxWidth || outH > maxHeight) {
    const scale = Math.min(maxWidth / outW, maxHeight / outH);
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');

  // Fill pure white background in case of transparent borders or non-square crops
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);

  // Draw cropped region
  ctx.drawImage(source, x, y, width, height, 0, 0, outW, outH);

  // Apply requested enhancements
  if (enhancement === 'ink_clean') {
    applyInkEnhancement(canvas, mode);
  } else if (enhancement === 'auto_levels') {
    applyPhotoAutoLevels(canvas);
  }

  return canvas.toDataURL(format, quality);
}
