const fs = require('fs');
const raw = fs.readFileSync('client/public/officialShareholdersData.json', 'utf8');
const data = JSON.parse(raw);

const mockVarasa = [];
for (let i = 0; i < 30; i++) {
  mockVarasa.push({
    share_no: `SH-${i}`,
    existing_shareholder_id: `ID-${i}`,
    varasa_member: `ವ್ಯಕ್ತಿ ${i}`,
    heir_relationship: 'ಮಗ'
  });
}
const mockVg = [];
for (let i = 0; i < 20; i++) {
  mockVg.push({
    share_no: `SH-VG-${i}`,
    transferee_name: `ವರ್ಗ ${i}`,
    transferee_relationship: 'ಖರೀದಿದಾರರು'
  });
}

function slowOwnership(sh) {
  const shNo = String(sh.share_no || sh.share_number || '').trim();
  const shId = String(sh.shareholder_id || '').trim();
  const shName = String(sh.shareholder_name || sh.name || '').trim().toLowerCase().normalize('NFC');

  const vMatch = mockVarasa.find(v => {
    const vShareNo = String(v.share_no || v.existing_share_number || '').trim();
    const vShId = String(v.existing_shareholder_id || '').trim();
    const vHeirName = String(v.varasa_member || v.heir_name || '').trim().toLowerCase().normalize('NFC');
    const matchesShare = (shNo && vShareNo && shNo === vShareNo) || (shId && vShId && shId === vShId);
    const isHeir = vHeirName && shName && (vHeirName === shName || shName.includes(vHeirName) || vHeirName.includes(shName));
    return matchesShare || isHeir;
  });
  if (vMatch) return 'ವಾರಸ';

  const vgMatch = mockVg.find(vg => {
    const vgShareNo = String(vg.share_no || '').trim();
    const vgTeeName = String(vg.transferee_name || '').trim().toLowerCase().normalize('NFC');
    const matchesShare = shNo && vgShareNo && shNo === vgShareNo;
    const isTransferee = vgTeeName && shName && (vgTeeName === shName || shName.includes(vgTeeName) || vgTeeName.includes(shName));
    return matchesShare || isTransferee;
  });
  if (vgMatch) return 'ವರ್ಗಾವಣೆ';

  return 'ಸ್ವಂತ (Self)';
}

console.time('Slow loop with 17,085 items');
for (let i = 0; i < data.length; i++) {
  slowOwnership(data[i]);
}
console.timeEnd('Slow loop with 17,085 items');
