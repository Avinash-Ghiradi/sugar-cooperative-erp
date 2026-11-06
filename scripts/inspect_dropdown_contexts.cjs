const fs = require('fs');

const files = [
  'client/src/components/Shareholders/ShareholderList.jsx',
  'client/src/components/Reports/ShareholderReports.jsx',
  'client/src/components/IDCards/IDCardGenerator.jsx',
  'client/src/components/Shareholders/ShareholderForm.jsx',
  'client/src/components/Varasa/VarasaTransferModal.jsx',
  'client/src/components/Vargavane/VargavaneTransferModal.jsx'
];

files.forEach(f => {
  console.log('=== ' + f + ' ===');
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('villages.map') || l.includes('places.map') || l.includes('All Places') || l.includes('All Villages')) {
      console.log(`Line ${idx+1}:`);
      for (let j = Math.max(0, idx - 2); j <= Math.min(lines.length - 1, idx + 4); j++) {
        console.log(`  ${j+1}: ${lines[j]}`);
      }
    }
  });
});
