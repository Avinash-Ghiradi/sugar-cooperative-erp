const fs = require('fs');
const path = require('path');

const officialCircle = require('../client/src/services/officialCircleData.json');
console.log('Official Circle count:', officialCircle.length);
console.log('Sample entries:', officialCircle.slice(0, 5));

// Check mockShareholders place values
const mockShareholdersPath = path.join(__dirname, '../client/src/services/mockShareholders.json');
if (fs.existsSync(mockShareholdersPath)) {
  const shs = require(mockShareholdersPath);
  console.log('MockShareholders count:', shs.length);
  const places = new Map();
  shs.forEach(s => {
    const p = (s.place || s.village_name || '').trim();
    if (p) {
      places.set(p, (places.get(p) || 0) + 1);
    }
  });
  console.log('Unique places count in mockShareholders:', places.size);
  const samplePlaces = Array.from(places.entries()).slice(0, 20);
  console.log('Sample places in mockShareholders:', samplePlaces);

  // Check if there is an entry with comma or street address
  const suspicious = Array.from(places.keys()).filter(p => p.includes(',') || p.includes('/') || /\d/.test(p));
  console.log('Suspicious places with comma/slash/number:', suspicious);
} else {
  console.log('mockShareholders.json does not exist directly, checking data sources...');
}
