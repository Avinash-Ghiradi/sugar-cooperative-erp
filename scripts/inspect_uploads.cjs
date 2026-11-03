const fs = require('fs');
const path = require('path');

const uploadDir = 'C:/Users/New/.gemini/antigravity/brain/09c94240-fca2-4544-9ada-6347d9444fbf/.user_uploaded';
const files = fs.readdirSync(uploadDir);

console.log('Total files in .user_uploaded:', files.length);

const results = [];
for (const f of files) {
  const full = path.join(uploadDir, f);
  const stat = fs.statSync(full);
  // Read first 30 bytes to get image dimensions
  const buf = fs.readFileSync(full);
  let dim = '';
  if (f.endsWith('.png') && buf.length > 24) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    dim = `${w}x${h}`;
  } else if (f.endsWith('.jpg') || f.endsWith('.jpeg')) {
    dim = 'JPG';
  }
  results.push({ name: f, size: stat.size, dim, mtime: stat.mtime });
}

results.sort((a,b) => b.mtime - a.mtime);
results.slice(0, 30).forEach(r => {
  console.log(`${r.name} | ${r.size}B | ${r.dim} | ${r.mtime.toISOString().slice(0, 16)}`);
});
