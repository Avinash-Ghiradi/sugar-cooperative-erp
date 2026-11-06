const fs = require('fs');
const api = fs.readFileSync('client/src/services/api.js', 'utf8');

// Search for where place or village_name or circleDirectory is updated
const lines = api.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('mockCircleDirectory.push') || l.includes('sync') && l.includes('Circle') || l.includes('villageMap.set')) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
