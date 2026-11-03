const fs = require('fs');
const uploadDir = 'C:/Users/New/.gemini/antigravity/brain/09c94240-fca2-4544-9ada-6347d9444fbf/.user_uploaded';

const list = [
  'media_1793183707364_eb592ceb.png',
  'media_1793183707402_bc5a7ec3.png',
  'media_1793184933064_9638fd39.png',
  'media_1793185739829_0a66f735.png',
  'media_1793187700428_1759b140.png',
  'media_1793252564595_170eb034.png',
  'media_1793263162308_df54feb9.png',
  'media_1792237094400_379ab4d7.jpg'
];

list.forEach(name => {
  const p = uploadDir + '/' + name;
  if (fs.existsSync(p)) {
    const s = fs.statSync(p);
    console.log(name, s.size, 'bytes');
  } else {
    console.log(name, 'NOT FOUND');
  }
});
