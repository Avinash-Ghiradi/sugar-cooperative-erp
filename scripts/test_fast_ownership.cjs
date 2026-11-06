const fs = require('fs');

const raw = fs.readFileSync('client/public/officialShareholdersData.json', 'utf8');
const data = JSON.parse(raw);

const mockVarasa = [];
for (let i = 0; i < 50; i++) {
  mockVarasa.push({
    share_no: `SH-${i}`,
    existing_shareholder_id: `ID-${i}`,
    varasa_member: `ವ್ಯಕ್ತಿ ${i}`,
    heir_relationship: 'ಮಗ'
  });
}

function getShareholderOwnershipBatchTest(shareholders, vTrans) {
  const shareMap = new Map();
  const idMap = new Map();
  const nameMap = new Map();

  for (let i = 0; i < vTrans.length; i++) {
    const v = vTrans[i];
    const rel = (v.heir_relationship || 'ಮಗ').trim();
    const label = `ವಾರಸದಾರರು (${rel})`;
    const sNo = String(v.share_no || v.existing_share_number || '').trim();
    const sId = String(v.existing_shareholder_id || '').trim();
    const hName = String(v.varasa_member || v.heir_name || '').trim().toLowerCase();
    if (sNo) shareMap.set(sNo, label);
    if (sId) idMap.set(sId, label);
    if (hName) nameMap.set(hName, label);
  }

  return shareholders.map(sh => {
    const rawOwn = String(sh.ownership || sh.relationship || '').trim();
    if (rawOwn && (rawOwn.includes('ವಾರಸ') || rawOwn.includes('ವರ್ಗಾವಣೆ'))) return sh;
    if (rawOwn && !rawOwn.toLowerCase().includes('self') && !rawOwn.includes('ಸ್ವಂತ') && rawOwn !== '—' && rawOwn !== '-') return sh;

    const shNo = String(sh.share_no || sh.share_number || '').trim();
    const shId = String(sh.shareholder_id || '').trim();
    const shName = String(sh.shareholder_name || sh.name || '').trim().toLowerCase();

    let own = 'ಸ್ವಂತ (Self)';
    if (shNo && shareMap.has(shNo)) {
      own = shareMap.get(shNo);
    } else if (shId && idMap.has(shId)) {
      own = idMap.get(shId);
    } else if (shName && nameMap.has(shName)) {
      own = nameMap.get(shName);
    }

    return {
      ...sh,
      ownership: own,
      relationship: own
    };
  });
}

console.time('Batch loop with 17,085 items');
getShareholderOwnershipBatchTest(data, mockVarasa);
console.timeEnd('Batch loop with 17,085 items');
