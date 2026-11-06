const fs = require('fs');
const content = fs.readFileSync('client/src/services/api.js', 'utf8');
const lines = content.split('\n');
const targets = [1295, 3373, 4495, 5481, 5554, 5609, 5641, 6939];
targets.forEach(t => {
  console.log(`--- Line ${t} ---`);
  for (let i = Math.max(0, t - 5); i <= Math.min(lines.length - 1, t + 4); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
});
