const fs = require('fs');
const uploadDir = 'C:/Users/New/.gemini/antigravity/brain/09c94240-fca2-4544-9ada-6347d9444fbf/.user_uploaded';

const files = [
  'media_1793183707364_eb592ceb.png',
  'media_1793183707402_bc5a7ec3.png',
  'media_1793184933064_9638fd39.png',
  'media_1793185739829_0a66f735.png',
  'media_1793187700428_1759b140.png',
  'media_1793252564595_170eb034.png',
  'media_1793263162308_df54feb9.png',
  'media_1793425130048_76f5830f.png',
  'media_1793440230199_a28219cc.jpg',
  'media_1793440230204_1f0fcf00.jpg'
];

files.forEach(f => {
  const p = uploadDir + '/' + f;
  if (!fs.existsSync(p)) return;
  const stat = fs.statSync(p);
  console.log(`\n=== ${f} (${stat.size} bytes) ===`);
  // Let's inspect step text when this was uploaded
});
