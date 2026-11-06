const fs = require('fs');

const raw = fs.readFileSync('client/public/officialShareholdersData.json', 'utf8');
const data = JSON.parse(raw);

// Suppose there are 50 varasa transfers
const mockVarasa = [];
for (let i = 0; i < 50; i++) {
  mockVarasa.push({
    share_no: `SH-${i}`,
    existing_shareholder_id: `ID-${i}`,
    varasa_member: `ವ್ಯಕ್ತಿ ${i}`,
    heir_relationship: 'ಮಗ'
  });
}

function getShareholderOwnershipSlow(sh, vTrans) {
  if (!sh) return 'ಸ್ವಂತ (Self)';
  const rawOwn = String(sh.ownership || sh.relationship || '').trim();
  if (rawOwn && (rawOwn.includes('ವಾರಸ') || rawOwn.includes('ವರ್ಗಾವಣೆ'))) return rawOwn;
  if (rawOwn && !rawOwn.toLowerCase().includes('self') && !rawOwn.includes('ಸ್ವಂತ') && rawOwn !== '—' && rawOwn !== '-') return rawOwn;

  const shNo = String(sh.share_no || sh.share_number || '').trim();
  const shId = String(sh.shareholder_id || '').trim();
  const shName = String(sh.shareholder_name || sh.name || '').trim().toLowerCase().normalize('NFC');

  if (Array.isArray(vTrans) && vTrans.length > 0 && (shNo || shId || shName)) {
    const vMatch = vTrans.find(v => {
      const vShareNo = String(v.share_no || v.existing_share_number || '').trim();
      const vShId = String(v.existing_shareholder_id || '').trim();
      const vHeirName = String(v.varasa_member || v.heir_name || '').trim().toLowerCase().normalize('NFC');
      const matchesShare = (shNo && vShareNo && shNo === vShareNo) || (shId && vShId && shId === vShId);
      const isHeir = vHeirName && shName && (vHeirName === shName || shName.includes(vHeirName) || vHeirName.includes(shName));
      return matchesShare || isHeir;
    });
    if (vMatch) return `ವಾರಸದಾರರು (${vMatch.heir_relationship || 'ಮಗ'})`;
  }
  return 'ಸ್ವಂತ (Self)';
}

console.time('Slow loop with 17,085 items');
data.forEach(s => getShareholderOwnershipSlow(s, mockVarasa));
console.timeEnd('Slow loop with 17,085 items');
