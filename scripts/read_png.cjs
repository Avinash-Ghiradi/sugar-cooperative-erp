const fs = require('fs');
const { PNG } = require('./client/node_modules/pngjs');

const buf = fs.readFileSync('C:/Users/New/.gemini/antigravity/brain/09c94240-fca2-4544-9ada-6347d9444fbf/.user_uploaded/media_1793252564595_170eb034.png');
const png = PNG.sync.read(buf);

console.log('Image dimensions:', png.width, 'x', png.height);
