const fs = require('fs');

console.time('Load official dataset (17,085 items)');
const raw = fs.readFileSync('client/public/officialShareholdersData.json', 'utf8');
const data = JSON.parse(raw);
console.timeEnd('Load official dataset (17,085 items)');

// Import batch ownership logic
function getShareholderOwnershipBatch(records, vTrans = [], vgTrans = []) {
  if (!Array.isArray(records) || records.length === 0) return [];
  if (vTrans.length === 0 && vgTrans.length === 0) {
    return records.map(s => {
      const rawOwn = String(s.ownership || s.relationship || '').trim();
      let own = rawOwn || 'ಸ್ವಂತ (Self)';
      return { ...s, ownership: own, relationship: own };
    });
  }
  const varasaShareMap = new Map();
  const varasaIdMap = new Map();
  const varasaNameMap = new Map();
  for (let i = 0; i < vTrans.length; i++) {
    const v = vTrans[i];
    const rel = (v.heir_relationship || 'ಮಗ').trim();
    const label = `ವಾರಸದಾರರು (${rel})`;
    const sNo = String(v.share_no || v.existing_share_number || '').trim();
    const sId = String(v.existing_shareholder_id || '').trim();
    const hName = String(v.varasa_member || v.heir_name || '').trim().toLowerCase();
    if (sNo) varasaShareMap.set(sNo, label);
    if (sId) varasaIdMap.set(sId, label);
    if (hName) varasaNameMap.set(hName, label);
  }

  return records.map(sh => {
    const rawOwn = String(sh.ownership || sh.relationship || '').trim();
    if (rawOwn && (rawOwn.includes('ವಾರಸ') || rawOwn.includes('ವರ್ಗಾವಣೆ'))) return sh;
    const shNo = String(sh.share_no || sh.share_number || '').trim();
    const shId = String(sh.shareholder_id || '').trim();
    const shName = String(sh.shareholder_name || sh.name || '').trim().toLowerCase();
    let own = rawOwn || 'ಸ್ವಂತ (Self)';
    if (shNo && varasaShareMap.has(shNo)) own = varasaShareMap.get(shNo);
    else if (shId && varasaIdMap.has(shId)) own = varasaIdMap.get(shId);
    else if (shName && varasaNameMap.has(shName)) own = varasaNameMap.get(shName);
    return { ...sh, ownership: own, relationship: own };
  });
}

console.time('Batch Ownership Mapping');
const mapped = getShareholderOwnershipBatch(data, [{ share_no: '1', varasa_member: 'test', heir_relationship: 'ಮಗ' }]);
console.timeEnd('Batch Ownership Mapping');

console.time('Compute KPIs');
const totalShares = mapped.reduce((sum, s) => sum + (parseInt(s.number_of_shares, 10) || 1), 0);
const totalAmount = mapped.reduce((sum, s) => sum + (parseFloat(s.total_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000)), 0);
console.timeEnd('Compute KPIs');

console.time('Placewise Tab Aggregation');
const map = new Map();
mapped.forEach(s => {
  const place = (s.place || s.village_name || 'ಗೊತ್ತಿಲ್ಲದ ಗ್ರಾಮ').trim();
  const shares = parseInt(s.number_of_shares, 10) || 1;
  const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (shares * 2000);
  if (!map.has(place)) map.set(place, { count: 0, totalShares: 0, totalAmount: 0 });
  const rec = map.get(place);
  rec.count++;
  rec.totalShares += shares;
  rec.totalAmount += amt;
});
console.timeEnd('Placewise Tab Aggregation');

console.log(`Results: ${mapped.length} records, ${totalShares} total shares, ₹${totalAmount.toLocaleString('en-IN')} total amount, ${map.size} places`);
