const fs = require('fs');
const lines = fs.readFileSync('C:/Users/New/.gemini/antigravity/brain/09c94240-fca2-4544-9ada-6347d9444fbf/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');

const uploadedImages = [];

for (const line of lines) {
  try {
    const obj = JSON.parse(line.trim());
    if (obj.source === 'USER_EXPLICIT' && obj.media) {
      for (const m of obj.media) {
        uploadedImages.push({
          step: obj.step_index,
          time: obj.created_at,
          text: (obj.content || '').replace(/\n+/g, ' ').slice(0, 150),
          file: m.uri.split(/[/\\]/).pop(),
          uri: m.uri
        });
      }
    }
  } catch (e) {}
}

console.log('Total user media uploads in history:', uploadedImages.length);

// Filter uploads where user mentioned logo, design, emblem, image, icon, print, or id
const relevant = uploadedImages.filter(u => {
  const t = u.text.toLowerCase();
  return t.includes('logo') || t.includes('design') || t.includes('clear') || t.includes('icon') || t.includes('card') || t.includes('format') || t.includes('print');
});

relevant.forEach(r => {
  console.log(`[Step ${r.step} | ${r.time?.slice(0,10)}] ${r.file} => "${r.text.slice(0, 80)}..."`);
});
