const fs = require('fs');
const path = require('path');

const apiPath = path.resolve('client/src/services/api.js');
let apiCode = fs.readFileSync(apiPath, 'utf8');

// 1. Ensure ensureDBReady doesn't re-download 28.4MB if IndexedDB has records
const target1 = 'if ((records.length < 17000 || needsBooksMigration) && !isBlankReset) {';
if (apiCode.includes(target1)) {
  apiCode = apiCode.replace(target1, 'if (records.length < 1000 && !isBlankReset) {');
  console.log('Target 1 replaced!');
} else {
  console.log('Target 1 already replaced or not found.');
}

// 2. Add background save when needsBooksMigration on existing >= 17000 records
const target2 = 'records = dedupedRecords;\r\n            }\r\n\r\n            // Build high-speed search index';
const target2Alt = 'records = dedupedRecords;\n            }\n\n            // Build high-speed search index';
const replacement2 = `records = dedupedRecords;
            }

            if (needsBooksMigration && records.length >= 17000) {
              saveToIndexedDB(records).catch(() => {});
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('sugar_erp_books_v4_applied', 'true');
              }
            }

            // Build high-speed search index`;

if (apiCode.includes(target2)) {
  apiCode = apiCode.replace(target2, replacement2.replace(/\n/g, '\r\n'));
  console.log('Target 2 replaced (CRLF)!');
} else if (apiCode.includes(target2Alt)) {
  apiCode = apiCode.replace(target2Alt, replacement2);
  console.log('Target 2 replaced (LF)!');
} else {
  console.log('Target 2 already replaced or not found.');
}

// 3. Add getShareholderOwnershipBatch function right after getShareholderOwnership
const getBatchCode = `
export function getShareholderOwnershipBatch(records, varasaList = null, vargavaneList = null) {
  if (!Array.isArray(records) || records.length === 0) return [];
  const vTrans = varasaList || mockVarasaTransfers || [];
  const vgTrans = vargavaneList || mockVargavaneTransfers || [];

  if ((!vTrans || vTrans.length === 0) && (!vgTrans || vgTrans.length === 0)) {
    return records.map(s => {
      const rawOwn = String(s.ownership || s.relationship || '').trim();
      let own = 'ಸ್ವಂತ (Self)';
      if (rawOwn && (rawOwn.includes('ವಾರಸ') || rawOwn.includes('ವರ್ಗಾವಣೆ'))) {
        own = rawOwn;
      } else if (rawOwn && !rawOwn.toLowerCase().includes('self') && !rawOwn.includes('ಸ್ವಂತ') && rawOwn !== '—' && rawOwn !== '-') {
        own = rawOwn;
      }
      return {
        ...s,
        ownership: own,
        relationship: own,
        member_type: getMemberTypeByCategory(s.schedule_cast, s.member_type)
      };
    });
  }

  const varasaShareMap = new Map();
  const varasaIdMap = new Map();
  const varasaNameMap = new Map();

  for (let i = 0; i < vTrans.length; i++) {
    const v = vTrans[i];
    const rel = (v.heir_relationship || 'ಮಗ').trim();
    const label = \`ವಾರಸದಾರರು (\${rel})\`;
    const sNo = String(v.share_no || v.existing_share_number || '').trim();
    const sId = String(v.existing_shareholder_id || '').trim();
    const hName = String(v.varasa_member || v.heir_name || '').trim().toLowerCase();
    if (sNo) varasaShareMap.set(sNo, label);
    if (sId) varasaIdMap.set(sId, label);
    if (hName) varasaNameMap.set(hName, label);
  }

  const vargavaneShareMap = new Map();
  const vargavaneNameMap = new Map();

  for (let i = 0; i < vgTrans.length; i++) {
    const vg = vgTrans[i];
    const rel = (vg.transferee_relationship || 'ಖರೀದಿದಾರರು').trim();
    const label = \`ವರ್ಗಾವಣೆದಾರರು (\${rel})\`;
    const sNo = String(vg.share_no || '').trim();
    const tName = String(vg.transferee_name || '').trim().toLowerCase();
    if (sNo) vargavaneShareMap.set(sNo, label);
    if (tName) vargavaneNameMap.set(tName, label);
  }

  return records.map(sh => {
    const rawOwn = String(sh.ownership || sh.relationship || '').trim();
    if (rawOwn && (rawOwn.includes('ವಾರಸ') || rawOwn.includes('ವರ್ಗಾವಣೆ'))) {
      return {
        ...sh,
        ownership: rawOwn,
        relationship: rawOwn,
        member_type: getMemberTypeByCategory(sh.schedule_cast, sh.member_type)
      };
    }
    if (rawOwn && !rawOwn.toLowerCase().includes('self') && !rawOwn.includes('ಸ್ವಂತ') && rawOwn !== '—' && rawOwn !== '-') {
      return {
        ...sh,
        ownership: rawOwn,
        relationship: rawOwn,
        member_type: getMemberTypeByCategory(sh.schedule_cast, sh.member_type)
      };
    }

    const shNo = String(sh.share_no || sh.share_number || '').trim();
    const shId = String(sh.shareholder_id || '').trim();
    const shName = String(sh.shareholder_name || sh.name || '').trim().toLowerCase();

    let own = rawOwn || 'ಸ್ವಂತ (Self)';
    if (shNo && varasaShareMap.has(shNo)) {
      own = varasaShareMap.get(shNo);
    } else if (shId && varasaIdMap.has(shId)) {
      own = varasaIdMap.get(shId);
    } else if (shName && varasaNameMap.has(shName)) {
      own = varasaNameMap.get(shName);
    } else if (shNo && vargavaneShareMap.has(shNo)) {
      own = vargavaneShareMap.get(shNo);
    } else if (shName && vargavaneNameMap.has(shName)) {
      own = vargavaneNameMap.get(shName);
    }

    return {
      ...sh,
      ownership: own,
      relationship: own,
      member_type: getMemberTypeByCategory(sh.schedule_cast, sh.member_type)
    };
  });
}
`;

const endOfGetOwnership = "  return rawOwn || 'ಸ್ವಂತ (Self)';\r\n}";
const endOfGetOwnershipAlt = "  return rawOwn || 'ಸ್ವಂತ (Self)';\n}";

if (apiCode.includes(endOfGetOwnership)) {
  apiCode = apiCode.replace(endOfGetOwnership, endOfGetOwnership + '\r\n' + getBatchCode.replace(/\n/g, '\r\n'));
  console.log('Batch ownership function added (CRLF)!');
} else if (apiCode.includes(endOfGetOwnershipAlt)) {
  apiCode = apiCode.replace(endOfGetOwnershipAlt, endOfGetOwnershipAlt + '\n' + getBatchCode);
  console.log('Batch ownership function added (LF)!');
} else {
  console.error('endOfGetOwnership not found in api.js!');
  process.exit(1);
}

// 4. Update getAllShareholdersRaw to use batch and cache
const oldGetAllRaw = `  async getAllShareholdersRaw() {
    await ensureDBReady();
    if (!mockShareholders || mockShareholders.length === 0) {
      console.warn('[SugarERP] mockShareholders is empty in getAllShareholdersRaw, attempting emergency reload...');
      const emergencyData = await fetchOfficialShareholdersFallback();
      if (emergencyData && emergencyData.length > 0) {
        mockShareholders = emergencyData;
        saveToIndexedDB(mockShareholders).catch(() => {});
        isDBReady = true;
      } else if (CloudDbService.isEnabled()) {
        try {
          const cloudRes = await CloudDbService.getShareholders({ page: 1, limit: 324 });
          if (cloudRes && cloudRes.success && Array.isArray(cloudRes.data) && cloudRes.data.length > 0) {
            return cloudRes.data.map(s => {
              const own = getShareholderOwnership(s);
              return {
                ...s,
                ownership: own,
                relationship: own,
                member_type: getMemberTypeByCategory(s.schedule_cast, s.member_type)
              };
            });
          }
        } catch (e) {}
      }
    }
    return (mockShareholders || []).map(s => {
      const own = getShareholderOwnership(s);
      return {
        ...s,
        ownership: own,
        relationship: own,
        member_type: getMemberTypeByCategory(s.schedule_cast, s.member_type)
      };
    });
  },`;

const newGetAllRaw = `  async getAllShareholdersRaw() {
    await ensureDBReady();
    if (_cachedRawShareholders && _cachedRawShareholders.length >= 17000 && (Date.now() - _cachedRawShareholdersTime < 300000)) {
      return _cachedRawShareholders;
    }
    if (!mockShareholders || mockShareholders.length === 0) {
      console.warn('[SugarERP] mockShareholders is empty in getAllShareholdersRaw, attempting emergency reload...');
      const emergencyData = await fetchOfficialShareholdersFallback();
      if (emergencyData && emergencyData.length > 0) {
        mockShareholders = emergencyData;
        saveToIndexedDB(mockShareholders).catch(() => {});
        isDBReady = true;
      } else if (CloudDbService.isEnabled()) {
        try {
          const cloudRes = await CloudDbService.getShareholders({ page: 1, limit: 324 });
          if (cloudRes && cloudRes.success && Array.isArray(cloudRes.data) && cloudRes.data.length > 0) {
            return getShareholderOwnershipBatch(cloudRes.data);
          }
        } catch (e) {}
      }
    }
    const result = getShareholderOwnershipBatch(mockShareholders || []);
    if (result && result.length >= 17000) {
      _cachedRawShareholders = result;
      _cachedRawShareholdersTime = Date.now();
    }
    return result;
  },`;

if (apiCode.includes(oldGetAllRaw)) {
  apiCode = apiCode.replace(oldGetAllRaw, newGetAllRaw);
  console.log('getAllShareholdersRaw updated (LF)!');
} else if (apiCode.includes(oldGetAllRaw.replace(/\n/g, '\r\n'))) {
  apiCode = apiCode.replace(oldGetAllRaw.replace(/\n/g, '\r\n'), newGetAllRaw.replace(/\n/g, '\r\n'));
  console.log('getAllShareholdersRaw updated (CRLF)!');
} else {
  console.error('oldGetAllRaw not found in api.js!');
  process.exit(1);
}

// 5. Replace _cachedFilterOptions = null with invalidateShareholderCaches()
apiCode = apiCode.replace(/_cachedFilterOptions = null;/g, 'invalidateShareholderCaches();');
console.log('Replaced cache invalidations!');

fs.writeFileSync(apiPath, apiCode, 'utf8');
console.log('Successfully patched client/src/services/api.js!');
