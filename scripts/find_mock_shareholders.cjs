const fs = require('fs');

const apiContent = fs.readFileSync('client/src/services/api.js', 'utf8');
const lines = apiContent.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('export let mockShareholders') || line.includes('mockShareholders =') || line.includes('import.*shareholder') || line.includes('generated_shareholders')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
