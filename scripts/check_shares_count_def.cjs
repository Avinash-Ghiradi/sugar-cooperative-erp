const fs = require('fs');
const path = require('path');

function checkFile(p) {
  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('getShareholderSharesCount')) {
      console.log(`${p}:${i + 1}: ${l.trim()}`);
    }
  });
}

checkFile('client/src/components/Common/RegisterListPrintModal.jsx');
checkFile('client/src/components/Shareholders/ShareholderList.jsx');
