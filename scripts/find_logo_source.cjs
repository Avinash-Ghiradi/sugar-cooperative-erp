const fs = require('fs');
const path = require('path');

const uploadDir = 'C:/Users/New/.gemini/antigravity/brain/09c94240-fca2-4544-9ada-6347d9444fbf/.user_uploaded';
const files = fs.readdirSync(uploadDir);

// Let's inspect where logo or id card appears
console.log('Searching all files in user_uploaded...');

for (const f of files) {
  const p = path.join(uploadDir, f);
  const s = fs.statSync(p);
  // Check if file is between 20KB and 500KB and not a full 1024x576 screenshot if possible
  const buf = fs.readFileSync(p);
  if (f.endsWith('.png') && buf.length > 24) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    // If it's a square or near-square logo
    const ratio = w / h;
    if (ratio > 0.7 && ratio < 1.4 && w > 80 && w < 1000) {
      console.log('Square-ish PNG:', f, `${w}x${h}`, s.size);
    }
  } else if (f.endsWith('.jpg')) {
    console.log('JPG:', f, s.size);
  }
}
