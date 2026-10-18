// Data Service Layer supporting both backend REST API and clean client-side storage
// Official 357-Village Circle Directory mapping provided by user
import officialCircleData from './officialCircleData.json';

const API_BASE = '/api';

const STORAGE_KEY_SH = 'sugar_erp_clean_shareholders_v3';
const STORAGE_KEY_TX = 'sugar_erp_clean_tx_v3';
const STORAGE_KEY_SA = 'sugar_erp_clean_allotments_v3';
const STORAGE_KEY_VT = 'sugar_erp_clean_varasa_v4';
const STORAGE_KEY_VG = 'sugar_erp_clean_vargavane_v4';
const STORAGE_KEY_ENROLLMENT = 'sugar_erp_clean_enrollment_v2';
const STORAGE_KEY_EMP = 'sugar_erp_clean_emp_v3';
const STORAGE_KEY_LOGS = 'sugar_erp_clean_logs_v3';
const STORAGE_KEY_MERGE_REQ = 'sugar_erp_clean_merge_requests_v1';

// Clear legacy mock cache keys
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('sugar_erp_clean_varasa_v3');
    localStorage.removeItem('sugar_erp_clean_vargavane_v3');
    localStorage.removeItem('sugar_erp_clean_enrollment_v1');
  }
} catch (e) {}

function loadStoredData(key, fallback = []) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveStoredData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

// Helper: Determine if a shareholder record genuinely has a 2nd installment
export function hasSecondInstallment(sh) {
  if (!sh) return false;
  const amt2 = parseFloat(sh.amount) || 0;
  const rec2 = String(sh.reciept || '').trim();
  const rec1 = String(sh.receipt_no || '').trim();
  const amt1 = parseFloat(sh.receipt_amount) || 0;
  const totAmt = parseFloat(sh.total_amount) || 0;

  // If amt2 is 0 or empty, and rec2 is empty or '—'
  if (amt2 <= 0 && (!rec2 || rec2 === '—' || rec2 === '-')) {
    return false;
  }

  // If rec2 is identical to rec1 AND amt2 is identical to amt1 AND totAmt <= amt1
  // (legacy duplicate fallback), it is NOT a second installment!
  if (rec2 === rec1 && amt2 === amt1 && totAmt <= amt1) {
    return false;
  }

  // If amount2 is positive and total amount exceeds receipt_amount
  if (amt2 > 0 && totAmt > amt1) {
    return true;
  }

  // If there is a distinct positive amount or distinct receipt number
  if (amt2 > 0 && rec2 && rec2 !== '—' && rec2 !== rec1) {
    return true;
  }

  return false;
}

// Zero-dependency IndexedDB storage for massive datasets (17k - 100k+ records)
const DB_NAME = 'SugarCooperativeERP_DB_v2';
const DB_VERSION = 2;
const STORE_NAME = 'shareholders';
const CIRCLE_STORE = 'circle_directory';
const STORAGE_KEY_CIRCLE_DIR = 'sugar_erp_circle_directory_clean';

function openERPDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(CIRCLE_STORE)) {
          db.createObjectStore(CIRCLE_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function saveToIndexedDB(records) {
  try {
    const db = await openERPDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (let i = 0; i < records.length; i++) {
        store.put(records[i]);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

async function loadFromIndexedDB() {
  try {
    const db = await openERPDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

async function saveCircleDirectoryToDB(records) {
  try {
    saveStoredData(STORAGE_KEY_CIRCLE_DIR, records);
    const db = await openERPDB();
    if (!db) return true;
    return new Promise((resolve) => {
      const tx = db.transaction([CIRCLE_STORE], 'readwrite');
      const store = tx.objectStore(CIRCLE_STORE);
      store.clear();
      for (let i = 0; i < records.length; i++) {
        store.put(records[i]);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(true);
    });
  } catch (err) {
    return true;
  }
}

async function loadCircleDirectoryFromDB() {
  try {
    const db = await openERPDB();
    if (!db || !db.objectStoreNames.contains(CIRCLE_STORE)) {
      return loadStoredData(STORAGE_KEY_CIRCLE_DIR, officialCircleData);
    }
    return new Promise((resolve) => {
      const tx = db.transaction([CIRCLE_STORE], 'readonly');
      const store = tx.objectStore(CIRCLE_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const res = req.result || [];
        // If empty or legacy mock, initialize with official 357 records
        if (!res || res.length === 0 || (res.length === 26 && res[0]?.address === 'ಅಗರಖೇಡ')) {
          try {
            saveCircleDirectoryToDB(officialCircleData);
          } catch (e) {}
          resolve(officialCircleData);
          return;
        }
        resolve(res);
      };
      req.onerror = () => resolve(loadStoredData(STORAGE_KEY_CIRCLE_DIR, officialCircleData));
    });
  } catch (err) {
    return loadStoredData(STORAGE_KEY_CIRCLE_DIR, officialCircleData);
  }
}

async function clearIndexedDB(includeCircles = true) {
  try {
    const db = await openERPDB();
    if (!db) return;
    const stores = [STORE_NAME];
    if (includeCircles && db.objectStoreNames.contains(CIRCLE_STORE)) {
      stores.push(CIRCLE_STORE);
    }
    const tx = db.transaction(stores, 'readwrite');
    stores.forEach(s => {
      try { tx.objectStore(s).clear(); } catch (e) {}
    });
  } catch (e) {}
}

// Initial Official Circle & Village Directory mapping (357 villages across 9 circles)
export const initialCircleDirectory = officialCircleData;

export let mockCircleDirectory = loadStoredData(STORAGE_KEY_CIRCLE_DIR, officialCircleData);

// Circles Master (Empty initial state - 100% clean)
export const mockCircles = [];

// Villages / Places Master (Empty initial state - 100% clean)
export const placesList = [];

export const mockVillages = [];

// Real Live Datasets (Initialized as clean empty arrays - zero mock records)
let mockShareholders = loadStoredData(STORAGE_KEY_SH, []);
let isDBReady = false;
let dbInitPromise = null;

async function fetchOfficialShareholdersFallback() {
  try {
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    let res = null;
    try {
      res = await fetch(`${cleanBase}officialShareholdersData.json`);
    } catch (e1) {}
    if (!res || !res.ok) {
      try {
        res = await fetch('./officialShareholdersData.json');
      } catch (e2) {}
    }
    if (res && res.ok) {
      const officialData = await res.json();
      if (Array.isArray(officialData) && officialData.length > 0) {
        return officialData;
      }
    }
  } catch (err) {
    console.warn('Auto-seed fetch failed:', err);
  }
  return null;
}

export function ensureDBReady() {
  if (isDBReady) return Promise.resolve(mockShareholders);
  if (!dbInitPromise) {
    if (typeof window !== 'undefined' && window.indexedDB) {
      dbInitPromise = Promise.all([
        loadFromIndexedDB(),
        loadCircleDirectoryFromDB()
      ]).then(async ([dbData, circleData]) => {
        if (circleData && Array.isArray(circleData) && circleData.length > 0) {
          mockCircleDirectory = circleData;
        }

        let records = (dbData && Array.isArray(dbData)) ? dbData : [];
        // Cross-device automatic synchronization:
        // If IndexedDB has no records or only a small mock set (<500 records), auto-fetch official 17,076 dataset!
        if (records.length < 500) {
          const officialData = await fetchOfficialShareholdersFallback();
          if (officialData && officialData.length > 0) {
            records = officialData;
            await saveToIndexedDB(records).catch(() => {});
          }
        }

        if (records && records.length > 0) {
          mockShareholders = records;
          // STRICT RULE: Do not consider circle column from shareholder list. Derive strictly from place -> Circle Directory
          const placeMap = new Map();
          mockCircleDirectory.forEach(cd => {
            const p = (cd.address || '').trim().toLowerCase().normalize('NFC');
            if (p) placeMap.set(p, cd);
          });
          let modified = false;
          mockShareholders.forEach(s => {
            const plKey = (s.place || s.village_name || '').trim().toLowerCase().normalize('NFC');
            let m = placeMap.get(plKey);
            if (!m && plKey) {
              for (const [k, v] of placeMap.entries()) {
                if (plKey === k || plKey.startsWith(k) || k.startsWith(plKey) || plKey.includes(k) || k.includes(plKey)) {
                  m = v;
                  break;
                }
              }
            }
            const expectedCircle = (m && m.circle_name) ? m.circle_name.trim().normalize('NFC') : 'ಇತರೆ (Other)';
            if (s.circle !== expectedCircle) {
              s.circle = expectedCircle;
              s.circle_name = expectedCircle;
              modified = true;
            }
            if (m) {
              if (m.taluk && (!s.taluk || s.taluk === 'ಇಂಡಿ' || s.taluk !== m.taluk)) {
                s.taluk = m.taluk;
                modified = true;
              }
              if (m.district && (!s.district || s.district === 'ವಿಜಯಪುರ' || s.district !== m.district)) {
                s.district = m.district;
                modified = true;
              }
              if (m.pincode && (!s.pin_code || s.pin_code === '586 117' || s.pin_code !== m.pincode)) {
                s.pin_code = m.pincode;
                modified = true;
              }
            }

            // Clean up artificial duplicate 2nd installments:
            if (s.reciept && s.reciept === s.receipt_no && parseFloat(s.amount) === parseFloat(s.receipt_amount) && parseFloat(s.total_amount) <= parseFloat(s.receipt_amount)) {
              s.reciept = '';
              s.amount = 0;
              s.date = '';
              modified = true;
            }
          });
          if (modified) {
            saveToIndexedDB(mockShareholders).catch(() => {});
          }
        }
        isDBReady = true;
        return mockShareholders;
      }).catch(async () => {
        if (mockShareholders.length < 500) {
          const officialData = await fetchOfficialShareholdersFallback();
          if (officialData && officialData.length > 0) {
            mockShareholders = officialData;
          }
        }
        isDBReady = true;
        return mockShareholders;
      });
    } else {
      // In environments without IndexedDB (e.g. strict private browsing)
      dbInitPromise = (async () => {
        if (mockShareholders.length < 500) {
          const officialData = await fetchOfficialShareholdersFallback();
          if (officialData && officialData.length > 0) {
            mockShareholders = officialData;
          }
        }
        isDBReady = true;
        return mockShareholders;
      })();
    }
  }
  return dbInitPromise;
}

// Immediate eager initialization of IndexedDB
if (typeof window !== 'undefined') {
  ensureDBReady();
}

export const initialVarasaTransfers = [];
let mockTransactions = loadStoredData(STORAGE_KEY_TX, []);
let mockSugarAllotments = loadStoredData(STORAGE_KEY_SA, []);
let mockVarasaTransfers = loadStoredData(STORAGE_KEY_VT, []);

export const initialVargavaneTransfers = [];
let mockVargavaneTransfers = loadStoredData(STORAGE_KEY_VG, []);

export const initialNewEnrollments = [];
let mockEnrollments = loadStoredData(STORAGE_KEY_ENROLLMENT, []);
let mockEmployees = loadStoredData(STORAGE_KEY_EMP, []);
let mockAuditLogs = loadStoredData(STORAGE_KEY_LOGS, []);
let mockMergeRequests = loadStoredData(STORAGE_KEY_MERGE_REQ, []);

// Helper API execution with auto backend failover
async function fetchApi(endpoint, options = {}) {
  // On static hosts like GitHub Pages, immediately bypass network to eliminate 404 delays
  const isStaticHost = typeof window !== 'undefined' && (
    window.location.hostname.includes('github.io') ||
    window.location.protocol === 'file:'
  );
  if (isStaticHost) return null;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User': localStorage.getItem('sugar_erp_username') || 'admin',
        ...options.headers
      },
      ...options
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Backend offline -> Fallback to client data engine seamlessly
  }
  return null;
}

export const ApiService = {
  async getDashboardStats() {
    await ensureDBReady();
    const apiRes = await fetchApi('/dashboard/stats');
    if (apiRes && apiRes.success) return apiRes;

    // Village breakdown
    const vCounts = {};
    mockShareholders.forEach(s => {
      const v = (s.place || s.village_name || '').trim() || 'ಇತರೆ (Other)';
      vCounts[v] = (vCounts[v] || 0) + 1;
    });
    const shareholdersByVillage = Object.keys(vCounts)
      .map(v => ({ village_name: v, total: vCounts[v] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Circle lookup from Circle Directory: Address (Place) -> Circle Name
    const dirPlaceToCircle = new Map();
    mockCircleDirectory.forEach(cd => {
      const pl = (cd.address || '').trim().toLowerCase().normalize('NFC');
      const c = (cd.circle_name || '').trim().normalize('NFC');
      if (pl && c) dirPlaceToCircle.set(pl, c);
    });

    const getCircleFromPlace = (rawPlace) => {
      if (!rawPlace) return 'ಇತರೆ (Other)';
      const pKey = rawPlace.trim().toLowerCase().normalize('NFC');
      if (dirPlaceToCircle.has(pKey)) return dirPlaceToCircle.get(pKey);
      for (const [k, v] of dirPlaceToCircle.entries()) {
        if (pKey === k || pKey.startsWith(k) || k.startsWith(pKey) || pKey.includes(k) || k.includes(pKey)) {
          return v;
        }
      }
      return 'ಇತರೆ (Other)';
    };

    // Circle breakdown - STRICT RULE: Never consider circle column from shareholder list. Derive strictly from Place -> Circle Directory
    const cCounts = {};
    mockShareholders.forEach(s => {
      const pl = (s.place || s.village_name || '').trim();
      const c = getCircleFromPlace(pl);
      cCounts[c] = (cCounts[c] || 0) + 1;
    });
    const shareholdersByCircle = Object.keys(cCounts)
      .map(c => ({ circle_name: c, total: cCounts[c] }))
      .sort((a, b) => b.total - a.total);

    // Schedule Cast / ವರ್ಗ breakdown (Statutory Cooperative Demographics)
    const scCounts = {};
    const scShares = {};
    mockShareholders.forEach(s => {
      const rawSc = (s.schedule_cast || 'ಅ - ವರ್ಗ').trim().normalize('NFC');
      const sc = rawSc || 'ಅ - ವರ್ಗ';
      const shares = parseInt(s.number_of_shares) || 1;
      scCounts[sc] = (scCounts[sc] || 0) + 1;
      scShares[sc] = (scShares[sc] || 0) + shares;
    });

    const scheduleCastBreakdown = Object.keys(scCounts).map(sc => ({
      category: sc,
      name: sc,
      count: scCounts[sc],
      shares: scShares[sc],
      percentage: mockShareholders.length > 0 ? ((scCounts[sc] / mockShareholders.length) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.count - a.count);

    // Dynamic unique collections across actual dataset and uploaded circle directory
    const uniquePlaces = new Set();
    const uniqueCircles = new Set();
    const uniqueBooks = new Set();

    mockShareholders.forEach(s => {
      const p = (s.place || s.village_name || '').trim();
      if (p) {
        uniquePlaces.add(p.toLowerCase().normalize('NFC'));
        const resolvedC = getCircleFromPlace(p);
        if (resolvedC && resolvedC !== 'ಇತರೆ (Other)') {
          uniqueCircles.add(resolvedC.toLowerCase().normalize('NFC'));
        }
      }
      const b = (s.book_no || '').trim();
      if (b) uniqueBooks.add(b);
    });

    mockCircleDirectory.forEach(cd => {
      if (cd.address) uniquePlaces.add(cd.address.trim().toLowerCase().normalize('NFC'));
      if (cd.circle_name) uniqueCircles.add(cd.circle_name.trim().toLowerCase().normalize('NFC'));
    });

    const calculatedVillages = uniquePlaces.size;
    const calculatedCircles = uniqueCircles.size;
    const calculatedBooks = uniqueBooks.size;

    return {
      success: true,
      stats: {
        totalShareholders: mockShareholders.length,
        activeShareholders: mockShareholders.filter(s => s.status === 'Active').length,
        inactiveShareholders: mockShareholders.filter(s => s.status === 'Inactive').length,
        totalShares: mockShareholders.reduce((acc, s) => acc + (parseInt(s.number_of_shares) || 1), 0),
        totalVillages: calculatedVillages,
        totalCircles: calculatedCircles,
        totalBooks: calculatedBooks,
        totalCategories: scheduleCastBreakdown.length,
        topCategory: scheduleCastBreakdown.length > 0 ? `${scheduleCastBreakdown[0].category} (${scheduleCastBreakdown[0].count.toLocaleString()})` : '—',
        pendingVarasa: mockVarasaTransfers.filter(v => v.approval_status !== 'Completed').length,
        completedVarasa: mockVarasaTransfers.filter(v => v.approval_status === 'Completed').length,
        totalVargavane: mockVargavaneTransfers.length,
        pendingVargavane: mockVargavaneTransfers.filter(v => v.approval_status !== 'Completed').length,
        completedVargavane: mockVargavaneTransfers.filter(v => v.approval_status === 'Completed').length,
        totalEnrollments: mockEnrollments.length,
        totalEnrollmentShares: mockEnrollments.reduce((acc, e) => acc + (parseInt(e.no_shares) || 1), 0),
        totalEnrollmentAmount: mockEnrollments.reduce((acc, e) => acc + (parseFloat(e.total_amount) || 0), 0),
        approvedEnrollments: mockEnrollments.filter(e => (e.approval_status || '').includes('Approved') || (e.approval_status || '').includes('Issued')).length,
        todayTx: mockTransactions.length,
        todayAttendance: 0,
        totalSugarAlloted: mockSugarAllotments.reduce((acc, a) => acc + (parseFloat(a.issued_quantity_kg) || 0), 0),
        totalEmployees: mockEmployees.length
      },
      charts: {
        shareholdersByVillage,
        shareholdersByCircle,
        scheduleCastBreakdown,
        shareRange: [
          { range: '1 Share (ಅ)', count: mockShareholders.filter(s => (parseInt(s.number_of_shares) || 1) === 1).length },
          { range: '2-4 Shares', count: mockShareholders.filter(s => (parseInt(s.number_of_shares) || 1) >= 2 && (parseInt(s.number_of_shares) || 1) <= 4).length },
          { range: '5-10 Shares', count: mockShareholders.filter(s => (parseInt(s.number_of_shares) || 1) >= 5 && (parseInt(s.number_of_shares) || 1) <= 10).length },
          { range: '14+ Shares', count: mockShareholders.filter(s => (parseInt(s.number_of_shares) || 1) > 10).length }
        ],
        varasaStatusBreakdown: [
          { status: 'Application Received', count: mockVarasaTransfers.filter(v => v.approval_status === 'Application Received').length },
          { status: 'Under Verification', count: mockVarasaTransfers.filter(v => v.approval_status === 'Under Verification').length },
          { status: 'Approved', count: mockVarasaTransfers.filter(v => v.approval_status === 'Approved').length },
          { status: 'Completed', count: mockVarasaTransfers.filter(v => v.approval_status === 'Completed').length }
        ],
        vargavaneStatusBreakdown: [
          { status: 'Application Received', count: mockVargavaneTransfers.filter(v => v.approval_status === 'Application Received').length },
          { status: 'Under Verification', count: mockVargavaneTransfers.filter(v => v.approval_status === 'Under Verification').length },
          { status: 'Approved', count: mockVargavaneTransfers.filter(v => v.approval_status === 'Approved').length },
          { status: 'Completed', count: mockVargavaneTransfers.filter(v => v.approval_status === 'Completed').length }
        ]
      }
    };
  },

  async getShareholders({ page = 1, limit = 20, search = '', village_id = '', circle_id = '', status = '', book_no = '', schedule_cast = '', sortBy = '', sortOrder = 'asc' }) {
    await ensureDBReady();
    const apiRes = await fetchApi(`/shareholders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&village_id=${village_id}&circle_id=${circle_id}&status=${status}&book_no=${book_no}&schedule_cast=${encodeURIComponent(schedule_cast)}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
    if (apiRes && apiRes.success) return apiRes;

    let filtered = mockShareholders;
    if (search) {
      const q = search.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(s => {
        const shName = (s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
        const shId = (s.shareholder_id || '').toLowerCase();
        const shNo = (s.share_no || s.share_number || '').toLowerCase();
        const bNo = (s.book_no || '').toLowerCase();
        const mob = (s.mobile_no || s.mobile || '');
        const aadh = (s.aadhaar_card_no || s.aadhaar_ref || '');
        const plc = (s.place || s.village_name || '').toLowerCase().normalize('NFC');
        const tlk = (s.taluk || '').toLowerCase().normalize('NFC');
        const cir = (s.circle || s.circle_name || '').toLowerCase().normalize('NFC');
        const nom = (s.nominee_name || '').toLowerCase().normalize('NFC');

        return shName.includes(q) ||
          shId.includes(q) ||
          shNo.includes(q) ||
          bNo.includes(q) ||
          mob.includes(q) ||
          aadh.includes(q) ||
          plc.includes(q) ||
          tlk.includes(q) ||
          cir.includes(q) ||
          nom.includes(q);
      });
    }
    if (village_id) {
      const vq = village_id.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(s =>
        (s.village_id && s.village_id.toLowerCase() === vq) ||
        (s.place && s.place.trim().toLowerCase().normalize('NFC') === vq) ||
        (s.village_name && s.village_name.trim().toLowerCase().normalize('NFC') === vq)
      );
    }
    if (circle_id) {
      const cq = circle_id.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(s =>
        (s.circle_id && s.circle_id.toLowerCase() === cq) ||
        (s.circle && s.circle.trim().toLowerCase().normalize('NFC') === cq) ||
        (s.circle_name && s.circle_name.trim().toLowerCase().normalize('NFC') === cq) ||
        (s.circle && s.circle.toLowerCase().includes(cq)) ||
        (cq.includes(s.circle && s.circle.toLowerCase()))
      );
    }
    if (status) {
      filtered = filtered.filter(s => s.status === status);
    }
    if (book_no) {
      const bq = book_no.trim().toLowerCase();
      filtered = filtered.filter(s => s.book_no && s.book_no.trim().toLowerCase() === bq);
    }
    if (schedule_cast) {
      const scq = schedule_cast.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(s => (s.schedule_cast || '').trim().toLowerCase().normalize('NFC') === scq);
    }

    if (sortBy) {
      const dir = sortOrder === 'desc' ? -1 : 1;
      filtered = [...filtered].sort((a, b) => {
        if (sortBy === 'place' || sortBy === 'village') {
          const valA = (a.place || a.village_name || '').trim();
          const valB = (b.place || b.village_name || '').trim();
          return dir * valA.localeCompare(valB, 'kn');
        }
        if (sortBy === 'circle') {
          const valA = (a.circle || a.circle_name || '').trim();
          const valB = (b.circle || b.circle_name || '').trim();
          return dir * valA.localeCompare(valB, 'kn');
        }
        if (sortBy === 'address') {
          const valA = (a.address || '').trim();
          const valB = (b.address || '').trim();
          return dir * valA.localeCompare(valB, 'kn');
        }
        if (sortBy === 'name') {
          const valA = (a.shareholder_name || a.name || '').trim();
          const valB = (b.shareholder_name || b.name || '').trim();
          return dir * valA.localeCompare(valB, 'kn');
        }
        if (sortBy === 'share_no') {
          const numA = parseInt(String(a.share_no || a.share_number || '').replace(/\D/g, '')) || 0;
          const numB = parseInt(String(b.share_no || b.share_number || '').replace(/\D/g, '')) || 0;
          return dir * (numA - numB);
        }
        return 0;
      });
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  },

  async getShareholderById(id) {
    await ensureDBReady();
    const apiRes = await fetchApi(`/shareholders/${id}`);
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => 
      s.shareholder_id === id || 
      String(s.id) === String(id) || 
      String(s.share_no) === String(id) || 
      String(s.share_number) === String(id)
    );
    if (!sh) return { success: false, message: 'Not found' };

    const shNo = String(sh.share_no || sh.share_number || '').trim();
    const shName = (sh.shareholder_name || sh.name || '').trim().toLowerCase().normalize('NFC');

    const txs = mockTransactions.filter(t => t.shareholder_id === sh.shareholder_id);
    const allotments = mockSugarAllotments.filter(a => a.shareholder_id === sh.shareholder_id);

    // Find any Varasa transfers where this shareholder is either deceased holder or heir
    const varasaMatches = mockVarasaTransfers.filter(v => {
      const vShareNo = String(v.share_no || v.existing_share_number || '').trim();
      const vShName = (v.shareholder_name || v.existing_shareholder_name || '').trim().toLowerCase().normalize('NFC');
      const vHeirName = (v.heir_name || v.varasa_member || '').trim().toLowerCase().normalize('NFC');
      return (shNo && vShareNo === shNo) || (shName && (vShName.includes(shName) || shName.includes(vShName) || vHeirName.includes(shName) || shName.includes(vHeirName)));
    });

    // Find any Vargavane transfers where this shareholder is either transferor or transferee
    const vargavaneMatches = mockVargavaneTransfers.filter(v => {
      const vShareNo = String(v.share_no || '').trim();
      const vTransferor = (v.transferor_name || v.shareholder_name || '').trim().toLowerCase().normalize('NFC');
      const vTransferee = (v.transferee_name || '').trim().toLowerCase().normalize('NFC');
      return (shNo && vShareNo === shNo) || (shName && (vTransferor.includes(shName) || shName.includes(vTransferor) || vTransferee.includes(shName) || shName.includes(vTransferee)));
    });

    // Find any Enrollment application
    const enrollmentMatches = mockEnrollments.filter(e => {
      const eShareNo = String(e.share_no || '').trim();
      const eName = (e.full_name || '').trim().toLowerCase().normalize('NFC');
      return (shNo && eShareNo === shNo) || (shName && (eName.includes(shName) || shName.includes(eName)));
    });

    // Unified Chronological Audit Trail
    const timeline = [];

    // 1. Any direct audit_history entries
    if (Array.isArray(sh.audit_history)) {
      sh.audit_history.forEach(aud => {
        timeline.push({
          id: aud.id || `aud-${Math.random()}`,
          date: aud.timestamp || aud.date || '—',
          type: aud.type || 'AUDIT_LOG',
          title: aud.title || 'ಮಾಹಿತಿ ದಾಖಲಾತಿ',
          description: aud.description || '',
          performed_by: aud.performed_by || 'Admin',
          details: aud.details || {},
          badgeColor: 'emerald'
        });
      });
    }

    // 2. Varasa transfers
    varasaMatches.forEach(v => {
      timeline.push({
        id: `var-${v.transfer_id || v.id}`,
        date: v.receipt_date || v.application_date || '—',
        type: 'VARASA_TRANSFER',
        title: `ವಾರಸುದಾರರ ವರ್ಗಾವಣೆ (${v.approval_status || 'ನೋಂದಣಿ'})`,
        description: `ಮೂಲ ಶೇರುದಾರರು: ${v.shareholder_name || '—'} (${v.dod ? `ನಿಧನ: ${v.dod}` : ''}) ➔ ವಾರಸುದಾರರು: ${v.heir_name} (${v.heir_relationship || 'ವಾರಸುದಾರರು'}). ರಶೀದಿ ನಂ: ${v.receipt_no || '—'}, ಶುಲ್ಕ: ₹${v.fees || 570}.`,
        performed_by: v.approved_by || 'Admin (System Administrator)',
        details: {
          transfer_id: v.transfer_id,
          share_no: v.share_no,
          deceased_holder: v.shareholder_name,
          heir_name: v.heir_name,
          relationship: v.heir_relationship,
          dod: v.dod,
          receipt_no: v.receipt_no,
          status: v.approval_status
        },
        badgeColor: 'amber'
      });
    });

    // 3. Vargavane transfers
    vargavaneMatches.forEach(v => {
      timeline.push({
        id: `vg-${v.transfer_id || v.id}`,
        date: v.receipt_date || v.application_date || '—',
        type: 'VARGAVANE_TRANSFER',
        title: `ನೇರ ಶೇರು ವರ್ಗಾವಣೆ (${v.approval_status || 'ನೋಂದಣಿ'})`,
        description: `ವರ್ಗಾವಣೆದಾರರು: ${v.transferor_name || '—'} ➔ ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರು: ${v.transferee_name} (${v.transferee_relationship || 'ಸಂಬಂಧ'}). ${v.no_of_shares || 1} ಶೇರು, ರಶೀದಿ ನಂ: ${v.receipt_no || '—'}.`,
        performed_by: v.approved_by || 'Admin (System Administrator)',
        details: {
          transfer_id: v.transfer_id,
          share_no: v.share_no,
          transferor: v.transferor_name,
          transferee: v.transferee_name,
          relationship: v.transferee_relationship,
          receipt_no: v.receipt_no,
          status: v.approval_status
        },
        badgeColor: 'cyan'
      });
    });

    // 4. Enrollment record
    enrollmentMatches.forEach(e => {
      timeline.push({
        id: `enr-${e.enrollment_id || e.id}`,
        date: e.date || '—',
        type: 'NEW_ENROLLMENT',
        title: `ಹೊಸ ಶೇರು ನೋಂದಣಿ ಮತ್ತು ಪ್ರವೇಶ (${e.approval_status || 'ಮಂಜೂರಾಗಿದೆ'})`,
        description: `ಸದಸ್ಯರ ಹೆಸರು: ${e.full_name}, ಸ್ಥಳ: ${e.place}. ₹${Number(e.share_amount || 24000).toLocaleString()} ಶೇರು ಬಂಡವಾಳ + ₹${e.admission_fee || 570} ಪ್ರವೇಶ ಶುಲ್ಕ. ಒಟ್ಟು: ₹${Number(e.total_amount || 24570).toLocaleString()}. ಠರಾವು ನಂ: ${e.tharava_no || '05(8)'}, ಠರಾವು ದಿನಾಂಕ: ${e.tharava_date || '—'}.`,
        performed_by: e.approved_by || 'Admin (System Administrator)',
        details: {
          enrollment_id: e.enrollment_id,
          share_no: e.share_no,
          tharava_no: e.tharava_no,
          tharava_date: e.tharava_date,
          receipt_no: e.receipt_no,
          status: e.approval_status
        },
        badgeColor: 'emerald'
      });
    });

    // If no explicit enrollment entry exists yet, synthesize default admission entry from member details
    if (timeline.length === 0) {
      timeline.push({
        id: `orig-${sh.id || 1}`,
        date: sh.date_of_joining || sh.admission_date || 'ಮೂಲ ಸದಸ್ಯತ್ವ',
        type: 'INITIAL_MEMBERSHIP',
        title: 'ಮೂಲ ಸದಸ್ಯತ್ವ ನೋಂದಣಿ (Original Statutory Membership)',
        description: `ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204 ಅಧಿಕೃತ ಶೇರುದಾರರಾಗಿ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿದ್ದಾರೆ. ಶೇರು ನಂ: #${shNo}, ಶೇರುಗಳು: ${sh.number_of_shares || 1}, ವರ್ಗ: ${sh.schedule_cast || 'ಅ - ವರ್ಗ'}, ಪುಸ್ತಕ ನಂ: ${sh.book_no || '1'}.`,
        performed_by: 'Authorized Secretary / Admin',
        details: {
          share_no: shNo,
          shares: sh.number_of_shares || 1,
          category: sh.schedule_cast || 'ಅ - ವರ್ಗ',
          book_no: sh.book_no
        },
        badgeColor: 'emerald'
      });
    }

    // If shareholder has merged holdings or multiple amounts, ensure timeline displays it
    if (sh.merged_holdings && sh.merged_holdings.length > 0) {
      const alreadyLogged = timeline.some(t => t.type === 'MERGE_SHARES');
      if (!alreadyLogged) {
        timeline.unshift({
          id: `merge-${sh.id}`,
          date: sh.merged_holdings[1]?.receipt_date || sh.reg_date || '—',
          type: 'MERGE_SHARES',
          title: 'ಬಹು-ಶೇರುಗಳು ಮತ್ತು ಮೊತ್ತಗಳ ಅಧಿಕೃತ ವಿಲೀನ (Multiple Shares Merged)',
          description: `ಶೇರುದಾರರ ಹೆಸರಿನಲ್ಲಿದ್ದ ${sh.merged_holdings.length} ಪ್ರತ್ಯೇಕ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್‌ಗಳು (#${(sh.all_share_numbers || [sh.share_no]).join(', #')}) ಮತ್ತು ಮೊತ್ತಗಳನ್ನು ವಿಲೀನಗೊಳಿಸಿ ಏಕೀಕೃತ ಖಾತೆಯಾಗಿ (ಒಟ್ಟು ${sh.number_of_shares} ಶೇರುಗಳು, ₹${Number(sh.total_amount || 0).toLocaleString()}) ನವೀಕರಿಸಲಾಗಿದೆ.`,
          performed_by: 'Admin (System Administrator)',
          details: {
            merged_certificates: sh.all_share_numbers || [sh.share_no],
            total_shares: sh.number_of_shares,
            total_amount: sh.total_amount,
            holdings: sh.merged_holdings
          },
          badgeColor: 'amber'
        });
      }
    } else if ((parseFloat(sh.receipt_amount) > 0 && parseFloat(sh.amount) > 0) || parseFloat(sh.total_amount) > parseFloat(sh.receipt_amount)) {
      const hasInstallment = timeline.some(t => t.type === 'MULTIPLE_AMOUNTS');
      if (!hasInstallment) {
        timeline.push({
          id: `amt-${sh.id}`,
          date: sh.date || sh.reg_date || '—',
          type: 'MULTIPLE_AMOUNTS',
          title: 'ಬಹು ಕಂತುಗಳ ಶೇರು ಪಾವತಿ (Multiple Share Installments Recorded)',
          description: `1ನೇ ರಶೀದಿ #${sh.receipt_no || '—'}: ₹${Number(sh.receipt_amount || 0).toLocaleString()} ಮತ್ತು 2ನೇ ರಶೀದಿ #${sh.reciept || '—'}: ₹${Number(sh.amount || 0).toLocaleString()} ಸೇರಿದಂತೆ ಒಟ್ಟು ₹${Number(sh.total_amount || 0).toLocaleString()} ಮೊತ್ತ ಜಮೆಯಾಗಿದೆ.`,
          performed_by: 'Accountant / Admin',
          details: {
            receipt_1: sh.receipt_no,
            amount_1: sh.receipt_amount,
            receipt_2: sh.reciept,
            amount_2: sh.amount,
            total: sh.total_amount
          },
          badgeColor: 'cyan'
        });
      }
    }

    return {
      success: true,
      shareholder: sh,
      history: {
        transactions: txs,
        sugarAllotments: allotments,
        varasaHistory: varasaMatches,
        vargavaneHistory: vargavaneMatches,
        enrollmentHistory: enrollmentMatches,
        timeline,
        attendance: []
      }
    };
  },

  async addShareholdersBulk(records) {
    await ensureDBReady();
    if (!Array.isArray(records) || records.length === 0) {
      return { success: true, count: 0 };
    }

    // Quick lookup map from Circle Directory: Address (Place) -> Circle details
    const circleLookup = new Map();
    mockCircleDirectory.forEach(cd => {
      const k = (cd.address || '').trim().toLowerCase().normalize('NFC');
      if (k) circleLookup.set(k, cd);
    });

    let maxId = 0;
    for (let i = 0; i < mockShareholders.length; i++) {
      const mid = Number(mockShareholders[i]?.id);
      if (mid > maxId) maxId = mid;
    }
    const startId = maxId + 1;
    const nowStr = new Date().toLocaleDateString('en-GB');

    const newShItems = records.map((data, idx) => {
      const currentId = startId + idx;
      const shId = data.shareholder_id || `SH-${String(currentId).padStart(5, '0')}`;
      const shName = (data.shareholder_name || data.name || `ಷೇರುದಾರ ${currentId}`).normalize('NFC');
      const shareNo = data.share_no || String(currentId);
      const bookNo = data.book_no || 'B.No: 1';
      const receiptNo = data.receipt_no || String(currentId);
      const receiptAmt = parseFloat(data.receipt_amount) || 2000;
      const numShares = parseInt(data.number_of_shares) || 1;
      const totalAmt = parseFloat(data.total_amount) || parseFloat(data.amount) || (numShares * 2000);

      const rawPlace = (data.place || data.village_name || '').trim().normalize('NFC');
      const placeKey = rawPlace.toLowerCase();
      let match = circleLookup.get(placeKey);
      if (!match && placeKey) {
        for (const [k, v] of circleLookup.entries()) {
          if (placeKey === k || placeKey.startsWith(k) || k.startsWith(placeKey) || placeKey.includes(k) || k.includes(placeKey)) {
            match = v;
            break;
          }
        }
      }
      if (!match && !placeKey && data.address) {
        const addrKey = data.address.trim().toLowerCase().normalize('NFC');
        for (const [k, v] of circleLookup.entries()) {
          if (addrKey === k || addrKey.includes(k)) {
            match = v;
            break;
          }
        }
      }

      const finalPlace = rawPlace || (match ? match.address : '') || (data.address ? data.address.split(',')[0].trim() : '');
      // STRICT RULE: Do not consider circle column from shareholder list. Derive strictly from place matching against Circle Directory.
      const finalCircle = ((match && match.circle_name) ? match.circle_name.trim() : 'ಇತರೆ (Other)').normalize('NFC');
      const finalTaluk = ((match && match.taluk) ? match.taluk : (data.taluk || '')).normalize('NFC');
      const finalDistrict = ((match && match.district) ? match.district : (data.district || '')).normalize('NFC');
      const finalPin = (match && match.pincode) ? match.pincode : (data.pin_code || '');

      return {
        id: currentId,
        shareholder_id: shId,
        book_no: bookNo,
        sl_no: data.sl_no || currentId,
        share_no: shareNo,
        shareholder_name: shName,
        name: shName,
        father_husband_name: data.father_husband_name || '',
        gender: data.gender || 'M',
        aadhaar_card_no: data.aadhaar_card_no || '',
        aadhaar_ref: data.aadhaar_card_no || '',
        reg_date: data.reg_date || nowStr,
        registration_date: data.reg_date || nowStr,
        receipt_no: receiptNo,
        receipt_amount: receiptAmt,
        date: data.date || '',
        reciept: (data.reciept && String(data.reciept).trim() !== String(receiptNo).trim()) ? String(data.reciept).trim() : (parseFloat(data.amount) > 0 && totalAmt > receiptAmt ? String(data.reciept || '') : ''),
        amount: (parseFloat(data.amount) > 0 && (String(data.reciept).trim() !== String(receiptNo).trim() || totalAmt > receiptAmt)) ? parseFloat(data.amount) : 0,
        total_amount: totalAmt,
        number_of_shares: numShares,
        share_value: totalAmt,
        schedule_cast: (data.schedule_cast || 'ಅ - ವರ್ಗ').normalize('NFC'),
        address: (data.address || '').normalize('NFC'),
        nagara: (data.nagara || '').normalize('NFC'),
        road: (data.road || '').normalize('NFC'),
        place: finalPlace,
        village_name: finalPlace,
        village_id: data.village_id || '',
        taluk: finalTaluk,
        district: finalDistrict,
        pin_code: finalPin,
        circle: finalCircle,
        circle_name: finalCircle,
        circle_id: data.circle_id || '',
        member_type: (data.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)').normalize('NFC'),
        relationship: (data.relationship || 'ಸ್ವಂತ (Self)').normalize('NFC'),
        tharava_date: data.tharava_date || data.reg_date || nowStr,
        tharava_no: data.tharava_no || `TR-${currentId}/2026`,
        mobile_no: data.mobile_no || data.mobile || '',
        mobile: data.mobile_no || data.mobile || '',
        photo_url: data.photo_url || '',
        signature_url: data.signature_url || '',
        thumb_url: data.thumb_url || '',
        photo_updated: data.photo_updated || 'No',
        signature_updated: data.signature_updated || 'No',
        thumb_updated: data.thumb_updated || 'No',
        nominee_name: (data.nominee_name || '').normalize('NFC'),
        nominee_aadhaar_no: data.nominee_aadhaar_no || '',
        nominee_mobile_no: data.nominee_mobile_no || '',
        nominee_address: (data.nominee_address || '').normalize('NFC'),
        status: data.status || 'Active',
        remarks: data.remarks || ''
      };
    });

    // Instant in-memory batch prepend
    mockShareholders = [...newShItems, ...mockShareholders];

    // Asynchronously save to IndexedDB (handles 17k - 100k+ records instantly)
    saveToIndexedDB(mockShareholders).catch(() => {});

    // Save small sets to localStorage for backwards compatibility
    if (mockShareholders.length < 2500) {
      saveStoredData(STORAGE_KEY_SH, mockShareholders);
    }

    return { success: true, count: newShItems.length };
  },

  async addShareholder(data) {
    await ensureDBReady();
    const isStatic = typeof window !== 'undefined' && (window.location.hostname.includes('github.io') || window.location.protocol === 'file:');
    if (!isStatic) {
      try {
        const apiRes = await fetchApi('/shareholders', { method: 'POST', body: JSON.stringify(data) });
        if (apiRes && apiRes.success) return apiRes;
      } catch (e) {}
    }

    let maxId = 0;
    for (let i = 0; i < mockShareholders.length; i++) {
      const mid = Number(mockShareholders[i]?.id);
      if (mid > maxId) maxId = mid;
    }
    const nextId = maxId + 1;
    const nowStr = new Date().toLocaleDateString('en-GB');
    const rawPlace = (data.place || data.village_name || '').trim().normalize('NFC');
    const placeKey = rawPlace.toLowerCase();
    let match = null;
    for (let i = 0; i < mockCircleDirectory.length; i++) {
      const cd = mockCircleDirectory[i];
      const cdAddr = (cd.address || '').trim().toLowerCase().normalize('NFC');
      if (placeKey && (cdAddr === placeKey || placeKey.startsWith(cdAddr) || cdAddr.startsWith(placeKey) || placeKey.includes(cdAddr) || cdAddr.includes(placeKey))) {
        match = cd;
        break;
      }
      if (!placeKey && data.address && cdAddr && data.address.toLowerCase().normalize('NFC').includes(cdAddr)) {
        match = cd;
        break;
      }
    }

    const finalPlace = rawPlace || (match ? match.address : '') || (data.address ? data.address.split(',')[0].trim() : '');
    // STRICT RULE: Do not consider circle column from shareholder list. Derive strictly from place matching against Circle Directory.
    const finalCircle = ((match && match.circle_name) ? match.circle_name.trim() : 'ಇತರೆ (Other)').normalize('NFC');
    const finalTaluk = ((match && match.taluk) ? match.taluk : (data.taluk || '')).normalize('NFC');
    const finalDistrict = ((match && match.district) ? match.district : (data.district || '')).normalize('NFC');
    const finalPin = (match && match.pincode) ? match.pincode : (data.pin_code || '');

    const newSh = {
      id: nextId,
      shareholder_id: data.shareholder_id || `SH-${String(nextId).padStart(5, '0')}`,
      book_no: data.book_no || 'B.No: 1',
      sl_no: data.sl_no || nextId,
      share_no: data.share_no || String(nextId),
      shareholder_name: (data.shareholder_name || data.name || `ಷೇರುದಾರ ${nextId}`).normalize('NFC'),
      name: (data.shareholder_name || data.name || `ಷೇರುದಾರ ${nextId}`).normalize('NFC'),
      father_husband_name: data.father_husband_name || '',
      gender: data.gender || 'M',
      aadhaar_card_no: data.aadhaar_card_no || '',
      aadhaar_ref: data.aadhaar_card_no || '',
      reg_date: data.reg_date || nowStr,
      registration_date: data.reg_date || nowStr,
      receipt_no: data.receipt_no || String(nextId),
      receipt_amount: parseFloat(data.receipt_amount) || 2000,
      date: data.date || '',
      reciept: (data.reciept && String(data.reciept).trim() !== String(data.receipt_no || '').trim()) ? String(data.reciept).trim() : (parseFloat(data.amount) > 0 && parseFloat(data.total_amount) > (parseFloat(data.receipt_amount) || 0) ? String(data.reciept || '') : ''),
      amount: (parseFloat(data.amount) > 0 && (String(data.reciept).trim() !== String(data.receipt_no || '').trim() || parseFloat(data.total_amount) > (parseFloat(data.receipt_amount) || 0))) ? parseFloat(data.amount) : 0,
      total_amount: parseFloat(data.total_amount) || (parseFloat(data.number_of_shares) || 1) * 2000,
      number_of_shares: parseInt(data.number_of_shares) || 1,
      share_value: parseFloat(data.total_amount) || (parseFloat(data.number_of_shares) || 1) * 2000,
      schedule_cast: (data.schedule_cast || 'ಅ - ವರ್ಗ').normalize('NFC'),
      address: (data.address || '').normalize('NFC'),
      nagara: (data.nagara || '').normalize('NFC'),
      road: (data.road || '').normalize('NFC'),
      place: finalPlace,
      village_name: finalPlace,
      village_id: data.village_id || '',
      taluk: finalTaluk,
      district: finalDistrict,
      pin_code: finalPin,
      circle: finalCircle,
      circle_name: finalCircle,
      circle_id: data.circle_id || '',
      member_type: (data.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)').normalize('NFC'),
      relationship: (data.relationship || 'ಸ್ವಂತ (Self)').normalize('NFC'),
      tharava_date: data.tharava_date || data.reg_date || nowStr,
      tharava_no: data.tharava_no || `TR-${nextId}/2026`,
      mobile_no: data.mobile_no || data.mobile || '',
      mobile: data.mobile_no || data.mobile || '',
      photo_url: data.photo_url || '',
      signature_url: data.signature_url || '',
      thumb_url: data.thumb_url || '',
      photo_updated: data.photo_updated || 'No',
      signature_updated: data.signature_updated || 'No',
      thumb_updated: data.thumb_updated || 'No',
      nominee_name: (data.nominee_name || '').normalize('NFC'),
      nominee_aadhaar_no: data.nominee_aadhaar_no || '',
      nominee_mobile_no: data.nominee_mobile_no || '',
      nominee_address: (data.nominee_address || '').normalize('NFC'),
      status: data.status || 'Active',
      remarks: data.remarks || ''
    };

    mockShareholders.unshift(newSh);
    saveToIndexedDB(mockShareholders).catch(() => {});
    if (mockShareholders.length < 2500) {
      saveStoredData(STORAGE_KEY_SH, mockShareholders);
    }
    return { success: true, shareholder_id: newSh.shareholder_id };
  },

  async updateShareholder(id, data) {
    await ensureDBReady();
    const isStatic = typeof window !== 'undefined' && (window.location.hostname.includes('github.io') || window.location.protocol === 'file:');
    if (!isStatic) {
      try {
        const apiRes = await fetchApi(`/shareholders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (apiRes && apiRes.success) return apiRes;
      } catch (e) {}
    }

    const index = mockShareholders.findIndex(s => s.id === Number(id) || s.shareholder_id === id || s.share_no === String(id));
    if (index === -1) {
      return { success: false, message: 'Shareholder not found.' };
    }

    const current = mockShareholders[index];
    const rawPlace = (data.place || current.place || '').trim().normalize('NFC');
    const circleInfo = this.resolveCircleForPlace(rawPlace);

    const updated = {
      ...current,
      ...data,
      id: current.id,
      shareholder_id: current.shareholder_id || data.shareholder_id,
      shareholder_name: (data.shareholder_name || data.name || current.shareholder_name || '').normalize('NFC'),
      name: (data.shareholder_name || data.name || current.name || '').normalize('NFC'),
      place: rawPlace,
      village_name: rawPlace,
      circle: (circleInfo && circleInfo.circle_name !== 'ಇತರೆ (Other)') ? circleInfo.circle_name : (current.circle || 'ಇತರೆ (Other)'),
      circle_name: (circleInfo && circleInfo.circle_name !== 'ಇತರೆ (Other)') ? circleInfo.circle_name : (current.circle || 'ಇತರೆ (Other)'),
      taluk: (circleInfo && circleInfo.taluk) ? circleInfo.taluk : (data.taluk || current.taluk || ''),
      district: (circleInfo && circleInfo.district) ? circleInfo.district : (data.district || current.district || ''),
      pin_code: (circleInfo && circleInfo.pincode) ? circleInfo.pincode : (data.pin_code || current.pin_code || ''),
      photo_url: data.photo_url !== undefined ? data.photo_url : current.photo_url,
      signature_url: data.signature_url !== undefined ? data.signature_url : current.signature_url,
      thumb_url: data.thumb_url !== undefined ? data.thumb_url : current.thumb_url,
      photo_updated: data.photo_updated || (data.photo_url ? 'Yes' : current.photo_updated || 'No'),
      signature_updated: data.signature_updated || (data.signature_url ? 'Yes' : current.signature_updated || 'No'),
      thumb_updated: data.thumb_updated || (data.thumb_url ? 'Yes' : current.thumb_updated || 'No'),
    };

    mockShareholders[index] = updated;
    await saveToIndexedDB(mockShareholders);
    if (mockShareholders.length < 2500) {
      saveStoredData(STORAGE_KEY_SH, mockShareholders);
    }
    return { success: true, data: updated };
  },

  async clearAllShareholders() {
    await ensureDBReady();
    mockShareholders = [];
    saveStoredData(STORAGE_KEY_SH, []);
    await clearIndexedDB(false);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY_SH);
        localStorage.removeItem('sugar_erp_clean_shareholders_v2');
        localStorage.removeItem('sugar_erp_shareholders');
      }
    } catch (e) {}
    return { success: true, message: 'All shareholder records have been permanently erased.' };
  },

  async clearAllData() {
    await ensureDBReady();
    mockShareholders = [];
    mockCircleDirectory = [];
    mockTransactions = [];
    mockSugarAllotments = [];
    mockVarasaTransfers = [];
    mockEmployees = [];
    mockAuditLogs = [];
    saveStoredData(STORAGE_KEY_SH, []);
    saveStoredData(STORAGE_KEY_CIRCLE_DIR, []);
    saveStoredData(STORAGE_KEY_TX, []);
    saveStoredData(STORAGE_KEY_SA, []);
    saveStoredData(STORAGE_KEY_VT, []);
    saveStoredData(STORAGE_KEY_EMP, []);
    saveStoredData(STORAGE_KEY_LOGS, []);
    await clearIndexedDB(true);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('sugar_erp_') && k !== 'sugar_erp_user') {
            localStorage.removeItem(k);
          }
        });
      }
    } catch (e) {}
    return { success: true, message: 'Entire database wiped and reset to a clean state.' };
  },

  async restoreOfficialData() {
    try {
      mockCircleDirectory = officialCircleData;
      await saveCircleDirectoryToDB(officialCircleData);

      const officialData = await fetchOfficialShareholdersFallback();
      if (officialData && officialData.length > 0) {
        mockShareholders = officialData;
        await saveToIndexedDB(mockShareholders);
        return { success: true, count: mockShareholders.length };
      }
      return { success: false, message: 'Could not load official dataset' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  async getTransactions({ page = 1, limit = 20, search = '' }) {
    await ensureDBReady();
    const apiRes = await fetchApi(`/transactions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    if (apiRes && apiRes.success) return apiRes;

    let filtered = mockTransactions;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t => t.shareholder_id.toLowerCase().includes(q) || t.shareholder_name.toLowerCase().includes(q) || t.reference_no.toLowerCase().includes(q));
    }
    return {
      success: true,
      data: filtered.slice((page - 1) * limit, page * limit),
      pagination: { total: filtered.length, page, limit, totalPages: Math.max(1, Math.ceil(filtered.length / limit)) }
    };
  },

  async addTransaction(data) {
    await ensureDBReady();
    const apiRes = await fetchApi('/transactions', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === data.shareholder_id);
    const newTx = {
      id: mockTransactions.length + 1,
      transaction_id: `TX-${Date.now()}`,
      ...data,
      shareholder_name: sh ? (sh.shareholder_name || sh.name) : 'Shareholder',
      date: new Date().toISOString()
    };
    mockTransactions.unshift(newTx);
    saveStoredData(STORAGE_KEY_TX, mockTransactions);
    return { success: true, transaction_id: newTx.transaction_id };
  },

  async getSugarAllotments({ page = 1, limit = 20, search = '' }) {
    await ensureDBReady();
    const apiRes = await fetchApi(`/sugar-allotment?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    if (apiRes && apiRes.success) return apiRes;

    return {
      success: true,
      data: mockSugarAllotments.slice((page - 1) * limit, page * limit),
      pagination: { total: mockSugarAllotments.length, page, limit, totalPages: Math.max(1, Math.ceil(mockSugarAllotments.length / limit)) }
    };
  },

  async addSugarAllotment(data) {
    await ensureDBReady();
    const apiRes = await fetchApi('/sugar-allotment', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === data.shareholder_id);
    const newSa = {
      id: mockSugarAllotments.length + 1,
      allotment_id: `SA-${Date.now()}`,
      ...data,
      shareholder_name: sh ? (sh.shareholder_name || sh.name) : 'Shareholder',
      share_number: sh ? (sh.share_no || sh.share_number) : 'SN-1000',
      village_name: sh ? (sh.place || sh.village_name) : 'Gaon',
      remaining_quantity_kg: data.sugar_quantity_kg - (data.issued_quantity_kg || 0)
    };
    mockSugarAllotments.unshift(newSa);
    saveStoredData(STORAGE_KEY_SA, mockSugarAllotments);
    return { success: true, allotment_id: newSa.allotment_id };
  },

  async getVarasaTransfers({ search = '', status = '', taluk = '' } = {}) {
    await ensureDBReady();
    const apiRes = await fetchApi('/varasa');
    if (apiRes && apiRes.success) return apiRes;

    let filtered = mockVarasaTransfers;
    if (search) {
      const q = search.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(v => {
        const vMember = (v.varasa_member || v.heir_name || '').toLowerCase().normalize('NFC');
        const shName = (v.shareholder_name || v.existing_shareholder_name || '').toLowerCase().normalize('NFC');
        const shNo = String(v.share_no || v.existing_share_number || '').toLowerCase();
        const mob = String(v.heir_mobile || '').toLowerCase();
        const aadh = String(v.heir_aadhaar || '').toLowerCase();
        const rNo = String(v.receipt_no || '').toLowerCase();
        const hPlace = (v.heir_place || '').toLowerCase().normalize('NFC');
        const sPlace = (v.shareholder_place || '').toLowerCase().normalize('NFC');
        const tId = (v.transfer_id || '').toLowerCase();

        return vMember.includes(q) || shName.includes(q) || shNo.includes(q) ||
          mob.includes(q) || aadh.includes(q) || rNo.includes(q) ||
          hPlace.includes(q) || sPlace.includes(q) || tId.includes(q);
      });
    }
    if (status) {
      filtered = filtered.filter(v => v.approval_status === status);
    }
    if (taluk) {
      const tq = taluk.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(v => 
        (v.heir_taluk && v.heir_taluk.toLowerCase().normalize('NFC').includes(tq)) ||
        (v.shareholder_taluk && v.shareholder_taluk.toLowerCase().normalize('NFC').includes(tq))
      );
    }

    return { success: true, data: filtered };
  },

  async addVarasaTransfer(data) {
    await ensureDBReady();
    const apiRes = await fetchApi('/varasa', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const nextSl = mockVarasaTransfers.length > 0 ? Math.max(...mockVarasaTransfers.map(v => parseInt(v.sl_no) || 0)) + 1 : 1;
    const nextId = mockVarasaTransfers.length > 0 ? Math.max(...mockVarasaTransfers.map(v => parseInt(v.id) || 0)) + 1 : 1;
    const transferId = data.transfer_id || `VAR-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`;
    
    // Auto lookup shareholder if existing_shareholder_id provided
    const sh = data.existing_shareholder_id ? mockShareholders.find(s => s.shareholder_id === data.existing_shareholder_id) : null;

    const newV = {
      id: nextId,
      sl_no: data.sl_no ? parseInt(data.sl_no) : nextSl,
      transfer_id: transferId,
      varasa_member: (data.varasa_member || data.heir_name || '').normalize('NFC'),
      heir_name: (data.varasa_member || data.heir_name || '').normalize('NFC'),
      heir_place: (data.heir_place || '').normalize('NFC'),
      heir_taluk: (data.heir_taluk || '').normalize('NFC'),
      heir_district: (data.heir_district || 'ವಿಜಯಪುರ').normalize('NFC'),
      heir_relationship: (data.heir_relationship || 'ಮಗ').normalize('NFC'),
      heir_age: data.heir_age || '',
      heir_mobile: data.heir_mobile || '',
      heir_aadhaar: data.heir_aadhaar || '',
      heir_photo: data.heir_photo || '',
      shareholder_name: (data.shareholder_name || data.existing_shareholder_name || (sh ? (sh.shareholder_name || sh.name) : '')).normalize('NFC'),
      existing_shareholder_name: (data.shareholder_name || data.existing_shareholder_name || (sh ? (sh.shareholder_name || sh.name) : '')).normalize('NFC'),
      existing_shareholder_id: data.existing_shareholder_id || (sh ? sh.shareholder_id : ''),
      shareholder_place: (data.shareholder_place || (sh ? sh.place : '')).normalize('NFC'),
      shareholder_taluk: (data.shareholder_taluk || (sh ? sh.taluk : '')).normalize('NFC'),
      shareholder_district: (data.shareholder_district || (sh ? sh.district : 'ವಿಜಯಪುರ')).normalize('NFC'),
      shareholder_relationship: (data.shareholder_relationship || 'ತಂದೆ').normalize('NFC'),
      dod: data.dod || '',
      share_no: String(data.share_no || data.existing_share_number || (sh ? sh.share_no : '')),
      existing_share_number: String(data.share_no || data.existing_share_number || (sh ? sh.share_no : '')),
      category: data.category || (sh ? sh.schedule_cast : 'ಅ - ವರ್ಗ'),
      no_of_shares: parseInt(data.no_of_shares) || parseInt(data.existing_shares) || (sh ? parseInt(sh.number_of_shares) : 1) || 1,
      existing_shares: parseInt(data.no_of_shares) || parseInt(data.existing_shares) || (sh ? parseInt(sh.number_of_shares) : 1) || 1,
      fees: parseFloat(data.fees) !== undefined && !isNaN(parseFloat(data.fees)) ? parseFloat(data.fees) : 570,
      receipt_no: String(data.receipt_no || ''),
      receipt_date: data.receipt_date || new Date().toLocaleDateString('en-GB'),
      application_date: data.application_date || new Date().toLocaleDateString('en-GB'),
      approval_status: data.approval_status || 'Application Received',
      documents_verified: data.documents_verified || 'Pending',
      remarks: data.remarks || '',
      created_at: new Date().toISOString()
    };
    mockVarasaTransfers.unshift(newV);
    saveStoredData(STORAGE_KEY_VT, mockVarasaTransfers);
    return { success: true, transfer_id: newV.transfer_id, data: newV };
  },

  async updateVarasaTransfer(idOrTransferId, data) {
    await ensureDBReady();
    const idx = mockVarasaTransfers.findIndex(v => String(v.id) === String(idOrTransferId) || v.transfer_id === idOrTransferId);
    if (idx !== -1) {
      mockVarasaTransfers[idx] = { ...mockVarasaTransfers[idx], ...data };
      saveStoredData(STORAGE_KEY_VT, mockVarasaTransfers);
      return { success: true, data: mockVarasaTransfers[idx] };
    }
    return { success: false, message: 'Transfer record not found' };
  },

  async deleteVarasaTransfer(idOrTransferId) {
    await ensureDBReady();
    const idx = mockVarasaTransfers.findIndex(v => String(v.id) === String(idOrTransferId) || v.transfer_id === idOrTransferId);
    if (idx !== -1) {
      mockVarasaTransfers.splice(idx, 1);
      saveStoredData(STORAGE_KEY_VT, mockVarasaTransfers);
      return { success: true };
    }
    return { success: false, message: 'Transfer record not found' };
  },

  async updateVarasaStatus(transfer_id, approval_status) {
    await ensureDBReady();
    const apiRes = await fetchApi(`/varasa/${transfer_id}/status`, { method: 'PUT', body: JSON.stringify({ approval_status }) });
    if (apiRes && apiRes.success) return apiRes;

    const item = mockVarasaTransfers.find(v => v.transfer_id === transfer_id || String(v.id) === String(transfer_id));
    if (item) {
      item.approval_status = approval_status;
      saveStoredData(STORAGE_KEY_VT, mockVarasaTransfers);
    }
    return { success: true };
  },

  async addVarasaTransfersBulk(records) {
    await ensureDBReady();
    if (!Array.isArray(records) || records.length === 0) return { success: true, count: 0 };
    let maxId = mockVarasaTransfers.reduce((m, v) => Math.max(m, parseInt(v.id) || 0), 0);
    let maxSl = mockVarasaTransfers.reduce((m, v) => Math.max(m, parseInt(v.sl_no) || 0), 0);

    const items = records.map((r, i) => {
      const id = maxId + i + 1;
      const sl = r.sl_no ? parseInt(r.sl_no) : (maxSl + i + 1);
      return {
        id,
        sl_no: sl,
        transfer_id: r.transfer_id || `VAR-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`,
        varasa_member: (r.varasa_member || r.heir_name || '').normalize('NFC'),
        heir_name: (r.varasa_member || r.heir_name || '').normalize('NFC'),
        heir_place: (r.heir_place || '').normalize('NFC'),
        heir_taluk: (r.heir_taluk || '').normalize('NFC'),
        heir_district: (r.heir_district || 'ವಿಜಯಪುರ').normalize('NFC'),
        heir_relationship: (r.heir_relationship || 'ಮಗ').normalize('NFC'),
        heir_age: r.heir_age || '',
        heir_mobile: r.heir_mobile || '',
        heir_aadhaar: r.heir_aadhaar || '',
        heir_photo: r.heir_photo || '',
        shareholder_name: (r.shareholder_name || r.existing_shareholder_name || '').normalize('NFC'),
        existing_shareholder_name: (r.shareholder_name || r.existing_shareholder_name || '').normalize('NFC'),
        existing_shareholder_id: r.existing_shareholder_id || '',
        shareholder_place: (r.shareholder_place || '').normalize('NFC'),
        shareholder_taluk: (r.shareholder_taluk || '').normalize('NFC'),
        shareholder_district: (r.shareholder_district || 'ವಿಜಯಪುರ').normalize('NFC'),
        shareholder_relationship: (r.shareholder_relationship || 'ತಂದೆ').normalize('NFC'),
        dod: r.dod || '',
        share_no: String(r.share_no || r.existing_share_number || ''),
        existing_share_number: String(r.share_no || r.existing_share_number || ''),
        category: r.category || 'ಅ - ವರ್ಗ',
        no_of_shares: parseInt(r.no_of_shares) || 1,
        existing_shares: parseInt(r.no_of_shares) || 1,
        fees: parseFloat(r.fees) || 570,
        receipt_no: String(r.receipt_no || ''),
        receipt_date: r.receipt_date || new Date().toLocaleDateString('en-GB'),
        application_date: r.application_date || new Date().toLocaleDateString('en-GB'),
        approval_status: r.approval_status || 'Application Received',
        documents_verified: r.documents_verified || 'Pending',
        remarks: r.remarks || '',
        created_at: new Date().toISOString()
      };
    });

    mockVarasaTransfers = [...items, ...mockVarasaTransfers];
    saveStoredData(STORAGE_KEY_VT, mockVarasaTransfers);
    return { success: true, count: items.length };
  },

  async searchShareholderForVarasa(query) {
    await ensureDBReady();
    if (!query || query.trim().length < 1) return [];
    const q = query.trim().toLowerCase().normalize('NFC');
    return mockShareholders.filter(s => {
      const sNo = String(s.share_no || '').toLowerCase();
      const sName = (s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
      const sId = (s.shareholder_id || '').toLowerCase();
      const sMob = String(s.mobile_no || s.mobile || '');
      return sNo === q || sNo.startsWith(q) || sName.includes(q) || sId === q || sMob.includes(q);
    }).slice(0, 8);
  },

  async getVargavaneTransfers({ search = '', status = '', taluk = '' } = {}) {
    await ensureDBReady();
    const apiRes = await fetchApi('/vargavane');
    if (apiRes && apiRes.success) return apiRes;

    let filtered = mockVargavaneTransfers;
    if (search) {
      const q = search.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(v => {
        const torName = (v.transferor_name || v.shareholder_name || '').toLowerCase().normalize('NFC');
        const teeName = (v.transferee_name || '').toLowerCase().normalize('NFC');
        const shNo = String(v.share_no || '').toLowerCase();
        const torMob = String(v.transferor_mobile || '').toLowerCase();
        const teeMob = String(v.transferee_mobile || '').toLowerCase();
        const torAadh = String(v.transferor_aadhaar || '').toLowerCase();
        const teeAadh = String(v.transferee_aadhaar || '').toLowerCase();
        const rNo = String(v.receipt_no || '').toLowerCase();
        const torPlace = (v.transferor_place || '').toLowerCase().normalize('NFC');
        const teePlace = (v.transferee_place || '').toLowerCase().normalize('NFC');
        const tId = (v.transfer_id || '').toLowerCase();

        return torName.includes(q) || teeName.includes(q) || shNo.includes(q) ||
          torMob.includes(q) || teeMob.includes(q) || torAadh.includes(q) || teeAadh.includes(q) ||
          rNo.includes(q) || torPlace.includes(q) || teePlace.includes(q) || tId.includes(q);
      });
    }
    if (status) {
      filtered = filtered.filter(v => v.approval_status === status);
    }
    if (taluk) {
      const tq = taluk.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(v =>
        (v.transferor_taluk && v.transferor_taluk.toLowerCase().normalize('NFC').includes(tq)) ||
        (v.transferee_taluk && v.transferee_taluk.toLowerCase().normalize('NFC').includes(tq))
      );
    }

    return { success: true, data: filtered };
  },

  async addVargavaneTransfer(data) {
    await ensureDBReady();
    const nextSl = mockVargavaneTransfers.length > 0 ? Math.max(...mockVargavaneTransfers.map(v => parseInt(v.sl_no) || 0)) + 1 : 1;
    const nextId = mockVargavaneTransfers.length > 0 ? Math.max(...mockVargavaneTransfers.map(v => parseInt(v.id) || 0)) + 1 : 1;
    const transferId = data.transfer_id || `VGN-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`;

    const newV = {
      id: nextId,
      sl_no: data.sl_no ? parseInt(data.sl_no) : nextSl,
      transfer_id: transferId,
      // 1. Transferor
      transferor_name: (data.transferor_name || data.shareholder_name || '').normalize('NFC'),
      shareholder_name: (data.transferor_name || data.shareholder_name || '').normalize('NFC'),
      transferor_place: (data.transferor_place || '').normalize('NFC'),
      transferor_taluk: (data.transferor_taluk || '').normalize('NFC'),
      transferor_district: (data.transferor_district || 'ವಿಜಯಪುರ').normalize('NFC'),
      transferor_relationship: (data.transferor_relationship || 'ಸ್ವಂತ').normalize('NFC'),
      transferor_age: data.transferor_age || '',
      transferor_aadhaar: data.transferor_aadhaar || '',
      transferor_mobile: data.transferor_mobile || '',
      // 2. Transferee (Vargavane Madikolluvaru)
      transferee_name: (data.transferee_name || '').normalize('NFC'),
      transferee_place: (data.transferee_place || '').normalize('NFC'),
      transferee_taluk: (data.transferee_taluk || '').normalize('NFC'),
      transferee_district: (data.transferee_district || 'ವಿಜಯಪುರ').normalize('NFC'),
      transferee_relationship: (data.transferee_relationship || 'ಮಗ').normalize('NFC'),
      transferee_aadhaar: data.transferee_aadhaar || '',
      transferee_mobile: data.transferee_mobile || '',
      transferee_photo: data.transferee_photo || '',
      // 3. Share & Fee
      share_no: String(data.share_no || ''),
      category: data.category || 'ಅ - ವರ್ಗ',
      no_of_shares: parseInt(data.no_of_shares) || 1,
      fees: parseFloat(data.fees) !== undefined && !isNaN(parseFloat(data.fees)) ? parseFloat(data.fees) : 570,
      receipt_no: String(data.receipt_no || ''),
      receipt_date: data.receipt_date || new Date().toLocaleDateString('en-GB'),
      application_date: data.application_date || new Date().toLocaleDateString('en-GB'),
      approval_status: data.approval_status || 'Application Received',
      documents_verified: data.documents_verified || 'Pending',
      remarks: data.remarks || '',
      created_at: new Date().toISOString()
    };
    mockVargavaneTransfers.unshift(newV);
    saveStoredData(STORAGE_KEY_VG, mockVargavaneTransfers);
    return { success: true, transfer_id: newV.transfer_id, data: newV };
  },

  async updateVargavaneTransfer(idOrTransferId, data) {
    await ensureDBReady();
    const idx = mockVargavaneTransfers.findIndex(v => String(v.id) === String(idOrTransferId) || v.transfer_id === idOrTransferId);
    if (idx !== -1) {
      mockVargavaneTransfers[idx] = { ...mockVargavaneTransfers[idx], ...data };
      saveStoredData(STORAGE_KEY_VG, mockVargavaneTransfers);
      return { success: true, data: mockVargavaneTransfers[idx] };
    }
    return { success: false, message: 'Record not found' };
  },

  async deleteVargavaneTransfer(idOrTransferId) {
    await ensureDBReady();
    const idx = mockVargavaneTransfers.findIndex(v => String(v.id) === String(idOrTransferId) || v.transfer_id === idOrTransferId);
    if (idx !== -1) {
      mockVargavaneTransfers.splice(idx, 1);
      saveStoredData(STORAGE_KEY_VG, mockVargavaneTransfers);
      return { success: true };
    }
    return { success: false, message: 'Record not found' };
  },

  async updateVargavaneStatus(transfer_id, approval_status) {
    await ensureDBReady();
    const item = mockVargavaneTransfers.find(v => v.transfer_id === transfer_id || String(v.id) === String(transfer_id));
    if (item) {
      item.approval_status = approval_status;
      saveStoredData(STORAGE_KEY_VG, mockVargavaneTransfers);
      return { success: true };
    }
    return { success: false };
  },

  async addVargavaneTransfersBulk(records) {
    await ensureDBReady();
    if (!Array.isArray(records) || records.length === 0) return { success: true, count: 0 };
    let maxId = mockVargavaneTransfers.reduce((m, v) => Math.max(m, parseInt(v.id) || 0), 0);
    let maxSl = mockVargavaneTransfers.reduce((m, v) => Math.max(m, parseInt(v.sl_no) || 0), 0);

    const items = records.map((r, i) => {
      const id = maxId + i + 1;
      const sl = r.sl_no ? parseInt(r.sl_no) : (maxSl + i + 1);
      return {
        id,
        sl_no: sl,
        transfer_id: r.transfer_id || `VGN-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`,
        transferor_name: (r.transferor_name || r.shareholder_name || '').normalize('NFC'),
        shareholder_name: (r.transferor_name || r.shareholder_name || '').normalize('NFC'),
        transferor_place: (r.transferor_place || '').normalize('NFC'),
        transferor_taluk: (r.transferor_taluk || '').normalize('NFC'),
        transferor_district: (r.transferor_district || 'ವಿಜಯಪುರ').normalize('NFC'),
        transferor_relationship: (r.transferor_relationship || 'ಸ್ವಂತ').normalize('NFC'),
        transferor_age: r.transferor_age || '',
        transferor_aadhaar: r.transferor_aadhaar || '',
        transferor_mobile: r.transferor_mobile || '',
        transferee_name: (r.transferee_name || '').normalize('NFC'),
        transferee_place: (r.transferee_place || '').normalize('NFC'),
        transferee_taluk: (r.transferee_taluk || '').normalize('NFC'),
        transferee_district: (r.transferee_district || 'ವಿಜಯಪುರ').normalize('NFC'),
        transferee_relationship: (r.transferee_relationship || 'ಮಗ').normalize('NFC'),
        transferee_aadhaar: r.transferee_aadhaar || '',
        transferee_mobile: r.transferee_mobile || '',
        transferee_photo: r.transferee_photo || '',
        share_no: String(r.share_no || ''),
        category: r.category || 'ಅ - ವರ್ಗ',
        no_of_shares: parseInt(r.no_of_shares) || 1,
        fees: parseFloat(r.fees) || 570,
        receipt_no: String(r.receipt_no || ''),
        receipt_date: r.receipt_date || new Date().toLocaleDateString('en-GB'),
        application_date: r.application_date || new Date().toLocaleDateString('en-GB'),
        approval_status: r.approval_status || 'Application Received',
        documents_verified: r.documents_verified || 'Pending',
        remarks: r.remarks || '',
        created_at: new Date().toISOString()
      };
    });

    mockVargavaneTransfers = [...items, ...mockVargavaneTransfers];
    saveStoredData(STORAGE_KEY_VG, mockVargavaneTransfers);
    return { success: true, count: items.length };
  },

  // ==========================================
  // NEW SHAREHOLDER ENROLLMENT (ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ)
  // ==========================================
  async getEnrollments({ search = '', category = '', status = '', page = 1, limit = 20 } = {}) {
    await ensureDBReady();
    let filtered = mockEnrollments;

    if (search) {
      const q = search.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(item => {
        const name = (item.full_name || '').toLowerCase().normalize('NFC');
        const place = (item.place || '').toLowerCase().normalize('NFC');
        const taluk = (item.taluk || '').toLowerCase().normalize('NFC');
        const dist = (item.dist || '').toLowerCase().normalize('NFC');
        const shareNo = String(item.share_no || '');
        const rcpt = String(item.receipt_no || '');
        const tharavaNo = String(item.tharava_no || '').toLowerCase();
        const aadh = (item.aadhaar_no || '').replace(/\s/g, '');
        const mob = (item.mobile_no || '');
        const cleanQ = q.replace(/\s/g, '');

        return name.includes(q) ||
          place.includes(q) ||
          taluk.includes(q) ||
          dist.includes(q) ||
          shareNo.includes(q) ||
          rcpt.includes(q) ||
          tharavaNo.includes(q) ||
          (cleanQ.length > 2 && aadh.includes(cleanQ)) ||
          mob.includes(q);
      });
    }

    if (category && category !== 'All') {
      const catKey = category.trim().normalize('NFC');
      filtered = filtered.filter(item => (item.category || '').normalize('NFC') === catKey);
    }

    if (status && status !== 'All') {
      filtered = filtered.filter(item => (item.approval_status || '').toLowerCase().includes(status.toLowerCase()));
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const stats = {
      totalEnrolled: mockEnrollments.length,
      totalShares: mockEnrollments.reduce((acc, e) => acc + (parseInt(e.no_shares) || 1), 0),
      totalShareCapital: mockEnrollments.reduce((acc, e) => acc + (parseFloat(e.share_amount) || 0), 0),
      totalAdmissionFees: mockEnrollments.reduce((acc, e) => acc + (parseFloat(e.admission_fee) || 0), 0),
      totalAmountCollected: mockEnrollments.reduce((acc, e) => acc + (parseFloat(e.total_amount) || 0), 0),
      boardApprovedCount: mockEnrollments.filter(e => (e.approval_status || '').includes('Approved')).length,
      sharesIssuedCount: mockEnrollments.filter(e => (e.approval_status || '').includes('Issued')).length,
    };

    return {
      success: true,
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats
    };
  },

  async addEnrollment(data) {
    await ensureDBReady();
    const nextId = mockEnrollments.reduce((m, e) => Math.max(m, parseInt(e.id) || 0), 0) + 1;
    const nextSl = mockEnrollments.reduce((m, e) => Math.max(m, parseInt(e.sl_no) || 0), 0) + 1;
    const year = new Date().getFullYear();

    const noShares = parseInt(data.no_shares) || 1;
    const shareAmount = parseFloat(data.share_amount) !== undefined && !isNaN(parseFloat(data.share_amount))
      ? parseFloat(data.share_amount)
      : (noShares * 24000);
    const admissionFee = parseFloat(data.admission_fee) !== undefined && !isNaN(parseFloat(data.admission_fee))
      ? parseFloat(data.admission_fee)
      : (noShares * 570);
    const totalAmount = parseFloat(data.total_amount) !== undefined && !isNaN(parseFloat(data.total_amount))
      ? parseFloat(data.total_amount)
      : (shareAmount + admissionFee);

    const newE = {
      id: nextId,
      sl_no: nextSl,
      enrollment_id: `ENR-${year}-${String(nextId).padStart(3, '0')}`,
      date: data.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      full_name: (data.full_name || '').normalize('NFC'),
      place: (data.place || '').normalize('NFC'),
      taluk: (data.taluk || 'ಚಡಚಣ').normalize('NFC'),
      dist: (data.dist || 'ವಿಜಯಪುರ').normalize('NFC'),
      share_amount: shareAmount,
      admission_fee: admissionFee,
      total_amount: totalAmount,
      receipt_no: String(data.receipt_no || ''),
      no_shares: noShares,
      category: data.category || 'ಅ ವರ್ಗ',
      tharava_date: data.tharava_date || '',
      tharava_no: data.tharava_no || '',
      share_no: String(data.share_no || ''),
      aadhaar_no: data.aadhaar_no || '',
      mobile_no: data.mobile_no || '',
      photo: data.photo || '',
      signature: data.signature || '',
      thumb_impression: data.thumb_impression || '',
      bank_name: data.bank_name || '',
      bank_account: data.bank_account || '',
      ifsc_code: data.ifsc_code || '',
      approval_status: data.approval_status || 'Application Submitted',
      remarks: data.remarks || '',
      created_at: new Date().toISOString()
    };

    mockEnrollments.unshift(newE);
    saveStoredData(STORAGE_KEY_ENROLLMENT, mockEnrollments);
    return { success: true, enrollment_id: newE.enrollment_id, data: newE };
  },

  async updateEnrollment(idOrEnrollmentId, data) {
    await ensureDBReady();
    const idx = mockEnrollments.findIndex(e => String(e.id) === String(idOrEnrollmentId) || e.enrollment_id === idOrEnrollmentId);
    if (idx !== -1) {
      const existing = mockEnrollments[idx];
      const noShares = data.no_shares !== undefined ? (parseInt(data.no_shares) || 1) : existing.no_shares;
      const shareAmount = data.share_amount !== undefined ? parseFloat(data.share_amount) : existing.share_amount;
      const admissionFee = data.admission_fee !== undefined ? parseFloat(data.admission_fee) : existing.admission_fee;
      const totalAmount = data.total_amount !== undefined ? parseFloat(data.total_amount) : (shareAmount + admissionFee);

      mockEnrollments[idx] = {
        ...existing,
        ...data,
        no_shares: noShares,
        share_amount: shareAmount,
        admission_fee: admissionFee,
        total_amount: totalAmount
      };
      saveStoredData(STORAGE_KEY_ENROLLMENT, mockEnrollments);
      return { success: true, data: mockEnrollments[idx] };
    }
    return { success: false, message: 'Record not found' };
  },

  async deleteEnrollment(idOrEnrollmentId) {
    await ensureDBReady();
    const idx = mockEnrollments.findIndex(e => String(e.id) === String(idOrEnrollmentId) || e.enrollment_id === idOrEnrollmentId);
    if (idx !== -1) {
      mockEnrollments.splice(idx, 1);
      saveStoredData(STORAGE_KEY_ENROLLMENT, mockEnrollments);
      return { success: true };
    }
    return { success: false, message: 'Record not found' };
  },

  async updateEnrollmentStatus(idOrEnrollmentId, approval_status, extra = {}) {
    await ensureDBReady();
    const item = mockEnrollments.find(e => String(e.id) === String(idOrEnrollmentId) || e.enrollment_id === idOrEnrollmentId);
    if (item) {
      item.approval_status = approval_status;
      if (extra.share_no !== undefined) item.share_no = String(extra.share_no);
      if (extra.tharava_no !== undefined) item.tharava_no = extra.tharava_no;
      if (extra.tharava_date !== undefined) item.tharava_date = extra.tharava_date;
      saveStoredData(STORAGE_KEY_ENROLLMENT, mockEnrollments);
      return { success: true, data: item };
    }
    return { success: false, message: 'Record not found' };
  },

  // 1. Approve New Shareholder Enrollment by Admin
  async approveEnrollmentByAdmin({ enrollmentId, shareNo, adminUser = 'Admin', tharavaNo, tharavaDate, remarks }) {
    await ensureDBReady();
    const item = mockEnrollments.find(e => String(e.id) === String(enrollmentId) || e.enrollment_id === enrollmentId);
    if (!item) return { success: false, message: 'Enrollment record not found' };

    const assignedShareNo = String(shareNo || item.share_no || '').trim();
    if (!assignedShareNo) {
      return { success: false, message: 'ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (Please assign Share Certificate Number)' };
    }

    // Check if share_number already exists in active master database
    const existingSh = mockShareholders.find(s => String(s.share_number || s.share_no) === assignedShareNo);
    if (existingSh) {
      return { success: false, message: `ಶೇರು ಸಂಖ್ಯೆ ${assignedShareNo} ಈಗಾಗಲೇ "${existingSh.shareholder_name}" ಅವರಿಗೆ ನಿಯೋಜಿತವಾಗಿದೆ (Already assigned)` };
    }

    // Auto resolve circle from place
    const resolvedCircle = this.resolveCircleForPlace(item.place);

    let maxId = 0;
    for (let i = 0; i < mockShareholders.length; i++) {
      const mid = Number(mockShareholders[i]?.id);
      if (mid > maxId) maxId = mid;
    }
    const nextId = maxId + 1;
    const finalTharavaNo = tharavaNo || item.tharava_no || '05(8)';
    const finalTharavaDate = tharavaDate || item.tharava_date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    const newMember = {
      id: nextId,
      share_number: assignedShareNo,
      share_no: assignedShareNo,
      shareholder_id: `SH-${String(nextId).padStart(5, '0')}`,
      shareholder_name: item.full_name,
      name: item.full_name,
      place: item.place,
      village_name: item.place,
      taluk: item.taluk || resolvedCircle.taluk || 'ಚಡಚಣ',
      district: item.dist || resolvedCircle.district || 'ವಿಜಯಪುರ',
      circle: resolvedCircle.circle_name || 'ಇತರೆ (Other)',
      circle_name: resolvedCircle.circle_name || 'ಇತರೆ (Other)',
      number_of_shares: parseInt(item.no_shares) || 1,
      schedule_cast: item.category || 'ಅ ವರ್ಗ',
      status: 'Active',
      mobile_number: item.mobile_no || '',
      mobile_no: item.mobile_no || '',
      aadhaar_number: item.aadhaar_no || '',
      aadhaar_card_no: item.aadhaar_no || '',
      photo: item.photo || '',
      photo_url: item.photo || '',
      signature: item.signature || '',
      signature_url: item.signature || '',
      thumb_impression: item.thumb_impression || '',
      thumb_url: item.thumb_impression || '',
      date_of_joining: item.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      book_no: finalTharavaNo ? `ಠರಾವು-${finalTharavaNo}` : 'BOOK-1',
      notes: `ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ: ${item.enrollment_id}, ರಶೀದಿ ನಂ: ${item.receipt_no || '—'}. Admin (${adminUser}) ಮಂಜೂರು ಮಾಡಿದ್ದಾರೆ.`,
      audit_history: [
        {
          id: `AUD-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          performed_by: adminUser || 'System Administrator (Admin)',
          type: 'NEW_ENROLLMENT',
          title: 'ಹೊಸ ಶೇರು ನೋಂದಣಿ & ಮಂಜೂರಾತಿ (New Share Enrollment Approved)',
          description: `ಆಡಳಿತ ಮಂಡಳಿ ಅನುಮೋದನೆ ಮೇರೆಗೆ ₹${Number(item.share_amount || 24000).toLocaleString()} ಶೇರು ಬಂಡವಾಳ ಮತ್ತು ₹${item.admission_fee || 570} ಪ್ರವೇಶ ಶುಲ್ಕ ಸ್ವೀಕರಿಸಿ ಅಧಿಕೃತ ಶೇರು ಸಂಖ್ಯೆ #${assignedShareNo} ನೀಡಿ ಮಾಸ್ಟರ್ ಶೇರುದಾರರ ಪಟ್ಟಿಗೆ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ.`,
          details: {
            enrollment_id: item.enrollment_id,
            share_no: assignedShareNo,
            shares: item.no_shares || 1,
            category: item.category || 'ಅ ವರ್ಗ',
            total_amount: item.total_amount,
            receipt_no: item.receipt_no,
            tharava_no: finalTharavaNo,
            tharava_date: finalTharavaDate,
            approved_by: adminUser
          }
        }
      ]
    };

    mockShareholders.unshift(newMember);
    await saveToIndexedDB(mockShareholders);

    // Update enrollment status
    item.share_no = assignedShareNo;
    item.tharava_no = finalTharavaNo;
    item.tharava_date = finalTharavaDate;
    item.approval_status = 'Approved & Active in Master (ಮಂಜೂರಾಗಿದೆ)';
    item.approved_by = adminUser;
    item.approved_at = new Date().toISOString();
    saveStoredData(STORAGE_KEY_ENROLLMENT, mockEnrollments);

    return { success: true, share_no: assignedShareNo, shareholder: newMember };
  },

  async promoteEnrollmentToShareholder(idOrEnrollmentId, shareNo, adminUser = 'Admin') {
    return this.approveEnrollmentByAdmin({ enrollmentId: idOrEnrollmentId, shareNo, adminUser });
  },

  // 2. Approve Varasa Legal-Heir Transfer by Admin
  async approveVarasaTransferByAdmin({ transferId, adminUser = 'Admin', remarks = '' }) {
    await ensureDBReady();
    const item = mockVarasaTransfers.find(v => String(v.id) === String(transferId) || v.transfer_id === transferId);
    if (!item) return { success: false, message: 'Varasa transfer record not found' };

    const targetShareNo = String(item.share_no || item.existing_share_number || '').trim();
    const rawTargetName = (item.shareholder_name || item.existing_shareholder_name || '').trim().toLowerCase().normalize('NFC');

    // Find original shareholder in master database
    let sh = mockShareholders.find(s => {
      const sNo = String(s.share_no || s.share_number || '').trim();
      return targetShareNo && sNo === targetShareNo;
    });

    if (!sh && rawTargetName) {
      sh = mockShareholders.find(s => {
        const sName = (s.shareholder_name || s.name || '').trim().toLowerCase().normalize('NFC');
        return sName === rawTargetName || sName.includes(rawTargetName) || rawTargetName.includes(sName);
      });
    }

    const prevHolderName = sh ? (sh.shareholder_name || sh.name) : (item.shareholder_name || 'ಮೂಲ ಶೇರುದಾರರು');
    const newHeirName = item.heir_name || item.varasa_member;

    if (sh) {
      if (!Array.isArray(sh.audit_history)) sh.audit_history = [];
      sh.audit_history.unshift({
        id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        performed_by: adminUser || 'System Administrator (Admin)',
        type: 'VARASA_TRANSFER',
        title: 'ವಾರಸುದಾರರ ವರ್ಗಾವಣೆ ಮಂಜೂರಾತಿ (Varasa Legal-Heir Transfer Approved)',
        description: `ಮೂಲ ಶೇರುದಾರರಾದ ಶ್ರೀ/ಶ್ರೀಮತಿ ${prevHolderName} ಅವರ ನಿಧನದ ನಂತರ (ಮರಣ ದಿನಾಂಕ: ${item.dod || '—'}), ಅವರ ಕಾನೂನುಬದ್ಧ ವಾರಸುದಾರರಾದ ಶ್ರೀ/ಶ್ರೀಮತಿ ${newHeirName} (${item.heir_relationship || 'ವಾರಸುದಾರರು'}) ಅವರ ಹೆಸರಿಗೆ ಶೇರು ಸಂಖ್ಯೆ #${sh.share_no || targetShareNo} ರ ${item.no_of_shares || sh.number_of_shares || 1} ಶೇರುಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ವರ್ಗಾವಣೆ ಮಾಡಲಾಗಿದೆ. ಶುಲ್ಕ: ₹${item.fees || 570}, ರಶೀದಿ ನಂ: ${item.receipt_no || '—'}.`,
        details: {
          transfer_id: item.transfer_id,
          share_no: sh.share_no || targetShareNo,
          previous_shareholder: prevHolderName,
          heir_name: newHeirName,
          relationship: item.heir_relationship,
          dod: item.dod,
          receipt_no: item.receipt_no,
          receipt_date: item.receipt_date,
          fee: item.fees || 570,
          approved_by: adminUser
        }
      });

      sh.shareholder_name = newHeirName;
      sh.name = newHeirName;
      if (item.heir_place) {
        sh.place = item.heir_place;
        sh.village_name = item.heir_place;
      }
      if (item.heir_taluk) sh.taluk = item.heir_taluk;
      if (item.heir_district) sh.district = item.heir_district;
      if (item.heir_mobile) {
        sh.mobile_number = item.heir_mobile;
        sh.mobile_no = item.heir_mobile;
      }
      if (item.heir_aadhaar) {
        sh.aadhaar_number = item.heir_aadhaar;
        sh.aadhaar_card_no = item.heir_aadhaar;
      }
      if (item.heir_photo) {
        sh.photo = item.heir_photo;
        sh.photo_url = item.heir_photo;
      }
      sh.notes = `ವಾರಸು ವರ್ಗಾವಣೆ: ${prevHolderName} (ನಿಧನ: ${item.dod || '—'}) ಇವರ ವಾರಸುದಾರರಾದ ${newHeirName} (${item.heir_relationship || 'ವಾರಸುದಾರರು'}) ಇವರಿಗೆ ವರ್ಗಾಯಿಸಲಾಗಿದೆ. Admin (${adminUser}) ಮಂಜೂರು ಮಾಡಿದ್ದಾರೆ.`;

      await saveToIndexedDB(mockShareholders);
    } else {
      const resolvedCircle = this.resolveCircleForPlace(item.heir_place || item.shareholder_place);
      let maxId = 0;
      for (let i = 0; i < mockShareholders.length; i++) {
        const mid = Number(mockShareholders[i]?.id);
        if (mid > maxId) maxId = mid;
      }
      const nextId = maxId + 1;
      const createdSh = {
        id: nextId,
        share_number: targetShareNo || String(nextId),
        share_no: targetShareNo || String(nextId),
        shareholder_id: `SH-${String(nextId).padStart(5, '0')}`,
        shareholder_name: newHeirName,
        name: newHeirName,
        place: item.heir_place || item.shareholder_place || '',
        village_name: item.heir_place || item.shareholder_place || '',
        taluk: item.heir_taluk || resolvedCircle.taluk || 'ಇಂಡಿ',
        district: item.heir_district || resolvedCircle.district || 'ವಿಜಯಪುರ',
        circle: resolvedCircle.circle_name || 'ಇತರೆ (Other)',
        circle_name: resolvedCircle.circle_name || 'ಇತರೆ (Other)',
        number_of_shares: parseInt(item.no_of_shares) || 1,
        schedule_cast: item.category || 'ಅ - ವರ್ಗ',
        status: 'Active',
        mobile_number: item.heir_mobile || '',
        aadhaar_number: item.heir_aadhaar || '',
        photo: item.heir_photo || '',
        notes: `ವಾರಸು ವರ್ಗಾವಣೆ: ${prevHolderName} (ನಿಧನ: ${item.dod || '—'}) ಇವರ ವಾರಸುದಾರರಾದ ${newHeirName} (${item.heir_relationship}) ಇವರಿಗೆ ವರ್ಗಾಯಿಸಲಾಗಿದೆ.`,
        audit_history: [
          {
            id: `AUD-${Date.now()}-1`,
            timestamp: new Date().toISOString(),
            performed_by: adminUser || 'System Administrator (Admin)',
            type: 'VARASA_TRANSFER',
            title: 'ವಾರಸುದಾರರ ವರ್ಗಾವಣೆ ಮಂಜೂರಾತಿ (Varasa Transfer Approved)',
            description: `ಮೂಲ ಶೇರುದಾರರಾದ ಶ್ರೀ/ಶ್ರೀಮತಿ ${prevHolderName} ಅವರ ನಿಧನದ ನಂತರ ${newHeirName} ಹೆಸರಿಗೆ ಶೇರು ವರ್ಗಾಯಿಸಲಾಗಿದೆ.`,
            details: {
              transfer_id: item.transfer_id,
              previous_holder: prevHolderName,
              heir_name: newHeirName,
              relationship: item.heir_relationship,
              approved_by: adminUser
            }
          }
        ]
      };
      mockShareholders.unshift(createdSh);
      await saveToIndexedDB(mockShareholders);
    }

    item.approval_status = 'Completed';
    item.approved_by = adminUser;
    item.approved_at = new Date().toISOString();
    saveStoredData(STORAGE_KEY_VT, mockVarasaTransfers);

    return { success: true, heir_name: newHeirName, previous_holder: prevHolderName };
  },

  // 3. Approve Vargavane Transfer by Admin
  async approveVargavaneTransferByAdmin({ transferId, adminUser = 'Admin', remarks = '' }) {
    await ensureDBReady();
    const item = mockVargavaneTransfers.find(v => String(v.id) === String(transferId) || v.transfer_id === transferId);
    if (!item) return { success: false, message: 'Vargavane transfer record not found' };

    const targetShareNo = String(item.share_no || '').trim();
    const rawTransferor = (item.transferor_name || item.shareholder_name || '').trim().toLowerCase().normalize('NFC');
    const newTransfereeName = item.transferee_name;

    // Find original transferor in master database
    let sh = mockShareholders.find(s => {
      const sNo = String(s.share_no || s.share_number || '').trim();
      return targetShareNo && sNo === targetShareNo;
    });

    if (!sh && rawTransferor) {
      sh = mockShareholders.find(s => {
        const sName = (s.shareholder_name || s.name || '').trim().toLowerCase().normalize('NFC');
        return sName === rawTransferor || sName.includes(rawTransferor) || rawTransferor.includes(sName);
      });
    }

    const prevHolderName = sh ? (sh.shareholder_name || sh.name) : (item.transferor_name || 'ಮೂಲ ಶೇರುದಾರರು');

    if (sh) {
      if (!Array.isArray(sh.audit_history)) sh.audit_history = [];
      sh.audit_history.unshift({
        id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        performed_by: adminUser || 'System Administrator (Admin)',
        type: 'VARGAVANE_TRANSFER',
        title: 'ನೇರ ಶೇರು ವರ್ಗಾವಣೆ ಮಂಜೂರಾತಿ (Vargavane Transfer Approved)',
        description: `ಮೂಲ ಶೇರುದಾರರಾದ ಶ್ರೀ/ಶ್ರೀಮತಿ ${prevHolderName} ಅವರಿಂದ ಅವರ ${item.transferee_relationship || 'ಸಂಬಂಧ'} ಆದ ಶ್ರೀ/ಶ್ರೀಮತಿ ${newTransfereeName} ಅವರ ಹೆಸರಿಗೆ ಶೇರು ಸಂಖ್ಯೆ #${sh.share_no || targetShareNo} ರ ${item.no_of_shares || sh.number_of_shares || 1} ಶೇರುಗಳನ್ನು Admin ಅನುಮೋದನೆ ಮೇರೆಗೆ ವರ್ಗಾವಣೆ ಮಾಡಲಾಗಿದೆ. ರಶೀದಿ ನಂ: ${item.receipt_no || '—'}, ಶುಲ್ಕ: ₹${item.fees || 570}.`,
        details: {
          transfer_id: item.transfer_id,
          share_no: sh.share_no || targetShareNo,
          transferor: prevHolderName,
          transferee: newTransfereeName,
          relationship: item.transferee_relationship,
          receipt_no: item.receipt_no,
          receipt_date: item.receipt_date,
          fee: item.fees || 570,
          approved_by: adminUser
        }
      });

      sh.shareholder_name = newTransfereeName;
      sh.name = newTransfereeName;
      if (item.transferee_place) {
        sh.place = item.transferee_place;
        sh.village_name = item.transferee_place;
      }
      if (item.transferee_taluk) sh.taluk = item.transferee_taluk;
      if (item.transferee_district) sh.district = item.transferee_district;
      if (item.transferee_mobile) {
        sh.mobile_number = item.transferee_mobile;
        sh.mobile_no = item.transferee_mobile;
      }
      if (item.transferee_aadhaar) {
        sh.aadhaar_number = item.transferee_aadhaar;
        sh.aadhaar_card_no = item.transferee_aadhaar;
      }
      if (item.transferee_photo) {
        sh.photo = item.transferee_photo;
        sh.photo_url = item.transferee_photo;
      }
      sh.notes = `ವರ್ಗಾವಣೆ: ${prevHolderName} ಇವರಿಂದ ${newTransfereeName} (${item.transferee_relationship || 'ವರ್ಗಾವಣೆ'}) ಇವರಿಗೆ ವರ್ಗಾಯಿಸಲಾಗಿದೆ. Admin (${adminUser}) ಮಂಜೂರು ಮಾಡಿದ್ದಾರೆ.`;

      await saveToIndexedDB(mockShareholders);
    } else {
      const resolvedCircle = this.resolveCircleForPlace(item.transferee_place || item.transferor_place);
      let maxId = 0;
      for (let i = 0; i < mockShareholders.length; i++) {
        const mid = Number(mockShareholders[i]?.id);
        if (mid > maxId) maxId = mid;
      }
      const nextId = maxId + 1;
      const createdSh = {
        id: nextId,
        share_number: targetShareNo || String(nextId),
        share_no: targetShareNo || String(nextId),
        shareholder_id: `SH-${String(nextId).padStart(5, '0')}`,
        shareholder_name: newTransfereeName,
        name: newTransfereeName,
        place: item.transferee_place || item.transferor_place || '',
        village_name: item.transferee_place || item.transferor_place || '',
        taluk: item.transferee_taluk || resolvedCircle.taluk || 'ಚಡಚಣ',
        district: item.transferee_district || resolvedCircle.district || 'ವಿಜಯಪುರ',
        circle: resolvedCircle.circle_name || 'ಇತರೆ (Other)',
        circle_name: resolvedCircle.circle_name || 'ಇತರೆ (Other)',
        number_of_shares: parseInt(item.no_of_shares) || 1,
        schedule_cast: item.category || 'ಅ - ವರ್ಗ',
        status: 'Active',
        mobile_number: item.transferee_mobile || '',
        aadhaar_number: item.transferee_aadhaar || '',
        photo: item.transferee_photo || '',
        notes: `ವರ್ಗಾವಣೆ: ${prevHolderName} ಇವರಿಂದ ${newTransfereeName} (${item.transferee_relationship}) ಇವರಿಗೆ ವರ್ಗಾಯಿಸಲಾಗಿದೆ.`,
        audit_history: [
          {
            id: `AUD-${Date.now()}-1`,
            timestamp: new Date().toISOString(),
            performed_by: adminUser || 'System Administrator (Admin)',
            type: 'VARGAVANE_TRANSFER',
            title: 'ನೇರ ಶೇರು ವರ್ಗಾವಣೆ ಮಂಜೂರಾತಿ (Vargavane Transfer Approved)',
            description: `ಮೂಲ ಶೇರುದಾರರಾದ ಶ್ರೀ/ಶ್ರೀಮತಿ ${prevHolderName} ಅವರಿಂದ ${newTransfereeName} ಹೆಸರಿಗೆ ಶೇರು ವರ್ಗಾಯಿಸಲಾಗಿದೆ.`,
            details: {
              transfer_id: item.transfer_id,
              transferor: prevHolderName,
              transferee: newTransfereeName,
              relationship: item.transferee_relationship,
              approved_by: adminUser
            }
          }
        ]
      };
      mockShareholders.unshift(createdSh);
      await saveToIndexedDB(mockShareholders);
    }

    item.approval_status = 'Completed';
    item.approved_by = adminUser;
    item.approved_at = new Date().toISOString();
    saveStoredData(STORAGE_KEY_VG, mockVargavaneTransfers);

    return { success: true, transferee_name: newTransfereeName, previous_holder: prevHolderName };
  },

  async addEnrollmentsBulk(records) {
    await ensureDBReady();
    if (!Array.isArray(records) || records.length === 0) return { success: true, count: 0 };
    let maxId = mockEnrollments.reduce((m, e) => Math.max(m, parseInt(e.id) || 0), 0);
    let maxSl = mockEnrollments.reduce((m, e) => Math.max(m, parseInt(e.sl_no) || 0), 0);
    const year = new Date().getFullYear();

    const items = records.map((r, i) => {
      const id = maxId + i + 1;
      const sl = r.sl_no ? parseInt(r.sl_no) : (maxSl + i + 1);
      const noShares = parseInt(r.no_shares || r['No. Shares'] || r.no_of_shares) || 1;
      const shareAmt = parseFloat(r.share_amount || r['Share amount']) || (noShares * 24000);
      const fee = parseFloat(r.admission_fee || r['Admission Fee'] || r.fee) || (noShares * 570);
      const totAmt = parseFloat(r.total_amount || r['Total Amount']) || (shareAmt + fee);

      return {
        id,
        sl_no: sl,
        enrollment_id: r.enrollment_id || `ENR-${year}-${String(id).padStart(3, '0')}`,
        date: r.date || r.Date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        full_name: (r.full_name || r['Full Name'] || '').normalize('NFC'),
        place: (r.place || r.Place || '').normalize('NFC'),
        taluk: (r.taluk || r.Taluk || 'ಚಡಚಣ').normalize('NFC'),
        dist: (r.dist || r.Dist || r.district || 'ವಿಜಯಪುರ').normalize('NFC'),
        share_amount: shareAmt,
        admission_fee: fee,
        total_amount: totAmt,
        receipt_no: String(r.receipt_no || r['Reciept No'] || r['Receipt No'] || ''),
        no_shares: noShares,
        category: r.category || r.Category || 'ಅ ವರ್ಗ',
        tharava_date: r.tharava_date || r['Tharava Date'] || '',
        tharava_no: r.tharava_no || r['Tharava No'] || '',
        share_no: String(r.share_no || r['Share No'] || ''),
        aadhaar_no: r.aadhaar_no || '',
        mobile_no: r.mobile_no || '',
        photo: r.photo || '',
        signature: r.signature || '',
        thumb_impression: r.thumb_impression || '',
        approval_status: r.approval_status || (r.share_no ? 'Share Issued (ಶೇರು ವಿತರಿಸಲಾಗಿದೆ)' : 'Board Approved (ಠರಾವು ಮಂಜೂರು)'),
        created_at: new Date().toISOString()
      };
    });

    mockEnrollments = [...items, ...mockEnrollments];
    saveStoredData(STORAGE_KEY_ENROLLMENT, mockEnrollments);
    return { success: true, count: items.length };
  },

  async getVillages() {
    await ensureDBReady();
    const apiRes = await fetchApi('/villages');
    if (apiRes && apiRes.success) return apiRes;

    const placeMap = new Map();

    const placeToCircle = new Map();
    mockCircleDirectory.forEach(cd => {
      const pl = (cd.address || '').trim().toLowerCase().normalize('NFC');
      const cName = (cd.circle_name || '').trim().normalize('NFC');
      if (pl && cName) placeToCircle.set(pl, cName);
    });

    // 1. Seed from Circle Directory (uploaded address mappings e.g. 26+ places)
    mockCircleDirectory.forEach((cd, idx) => {
      const rawPlace = (cd.address || '').trim().normalize('NFC');
      if (!rawPlace) return;
      const key = rawPlace.toLowerCase();
      placeMap.set(key, {
        village_id: `VIL-${String(idx + 1).padStart(3, '0')}`,
        name: rawPlace,
        taluk: cd.taluk || '',
        district: cd.district || '',
        circle_name: cd.circle_name || 'ಇತರೆ',
        pin_code: cd.pincode || '',
        circle_in_charge: cd.circle_in_charge || '',
        contact_no: cd.contact_no || '',
        shareholder_count: 0,
        total_shares: 0
      });
    });

    // 2. Also seed with master reference places
    mockVillages.forEach(v => {
      const key = v.name.trim().toLowerCase().normalize('NFC');
      if (!placeMap.has(key)) {
        placeMap.set(key, {
          village_id: v.village_id,
          name: v.name.trim().normalize('NFC'),
          taluk: v.taluk || '',
          district: v.district || '',
          circle_name: v.circle_name || 'ಇತರೆ',
          pin_code: v.pin_code || '',
          circle_in_charge: '',
          contact_no: '',
          shareholder_count: 0,
          total_shares: 0
        });
      }
    });

    // 3. Dynamically aggregate all unique places from actual shareholder records (supports 300+ places)
    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const rawPlace = (s.place || s.village_name || '').trim().normalize('NFC');
      if (!rawPlace) continue;
      const key = rawPlace.toLowerCase();
      const shares = parseInt(s.number_of_shares) || 1;

      if (placeMap.has(key)) {
        const item = placeMap.get(key);
        item.shareholder_count++;
        item.total_shares += shares;
        if (s.taluk && !item.taluk) item.taluk = s.taluk.trim();
        if (s.district && !item.district) item.district = s.district.trim();
        // Circle is strictly derived from placeToCircle (Circle Directory)
        if (placeToCircle.has(key)) {
          item.circle_name = placeToCircle.get(key);
        }
        if (s.pin_code && !item.pin_code) item.pin_code = s.pin_code.trim();
      } else {
        // STRICT RULE: Do not consider circle column from shareholder list. Derive strictly from place matching in Circle Directory.
        let resolvedCircle = placeToCircle.get(key);
        if (!resolvedCircle && key) {
          for (const [k, v] of placeToCircle.entries()) {
            if (key === k || key.startsWith(k) || k.startsWith(key) || key.includes(k) || k.includes(key)) {
              resolvedCircle = v;
              break;
            }
          }
        }
        if (!resolvedCircle) resolvedCircle = 'ಇತರೆ (Other)';

        placeMap.set(key, {
          village_id: s.village_id || `VIL-${String(placeMap.size + 1).padStart(3, '0')}`,
          name: rawPlace,
          taluk: (s.taluk || '').trim().normalize('NFC'),
          district: (s.district || '').trim().normalize('NFC'),
          circle_name: resolvedCircle,
          pin_code: s.pin_code || '',
          circle_in_charge: '',
          contact_no: '',
          shareholder_count: 1,
          total_shares: shares
        });
      }
    }

    const list = Array.from(placeMap.values())
      .filter(v => v.shareholder_count > 0 || mockShareholders.length === 0 || mockCircleDirectory.length > 0)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'kn'));

    return { success: true, data: list };
  },

  async getCircles() {
    await ensureDBReady();
    const apiRes = await fetchApi('/circles');
    if (apiRes && apiRes.success) return apiRes;

    const circleMap = new Map();
    const circleVillagesMap = new Map();

    // Map each Address (Place) to its Circle Name from mockCircleDirectory
    const placeToCircle = new Map();
    mockCircleDirectory.forEach(cd => {
      const pl = (cd.address || '').trim().toLowerCase().normalize('NFC');
      const cName = (cd.circle_name || '').trim().normalize('NFC');
      if (pl && cName) placeToCircle.set(pl, cName);
    });

    // 1. Seed from Circle Directory (uploaded address & circle mapping)
    mockCircleDirectory.forEach(cd => {
      const cName = (cd.circle_name || 'ಇತರೆ').trim().normalize('NFC');
      if (!cName) return;
      const key = cName.toLowerCase();
      if (!circleMap.has(key)) {
        circleMap.set(key, {
          circle_id: `CIR-${String(circleMap.size + 1).padStart(3, '0')}`,
          name: cName,
          description: `${cName} ಆಡಳಿತ ವಲಯ`,
          taluk: cd.taluk || '',
          district: cd.district || '',
          pincode: cd.pincode || '',
          circle_in_charge: cd.circle_in_charge || '',
          contact_no: cd.contact_no || '',
          villages: [],
          village_count: 0,
          shareholder_count: 0,
          total_shares: 0
        });
      }
      const cObj = circleMap.get(key);
      if (cd.circle_in_charge && !cObj.circle_in_charge) cObj.circle_in_charge = cd.circle_in_charge;
      if (cd.contact_no && !cObj.contact_no) cObj.contact_no = cd.contact_no;
      if (cd.taluk && !cObj.taluk) cObj.taluk = cd.taluk;
      if (cd.district && !cObj.district) cObj.district = cd.district;
      if (cd.pincode && !cObj.pincode) cObj.pincode = cd.pincode;

      if (!circleVillagesMap.has(key)) {
        circleVillagesMap.set(key, new Set());
      }
      if (cd.address) {
        circleVillagesMap.get(key).add(cd.address.trim().normalize('NFC'));
      }
    });

    // 2. Map shareholders: identify their place and attribute them to the circle
    const villageCounts = new Map();
    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const rawPlace = (s.place || s.village_name || '').trim().normalize('NFC');
      const plKey = rawPlace.toLowerCase();

      // Connect shareholder to circle: STRICTLY via place lookup in circle directory (never consider s.circle)
      let rawCircle = placeToCircle.get(plKey);
      if (!rawCircle && plKey) {
        for (const [k, v] of placeToCircle.entries()) {
          if (plKey === k || plKey.startsWith(k) || k.startsWith(plKey) || plKey.includes(k) || k.includes(plKey)) {
            rawCircle = v;
            break;
          }
        }
      }
      if (!rawCircle) rawCircle = 'ಇತರೆ (Other)';

      const key = rawCircle.toLowerCase();
      const shares = parseInt(s.number_of_shares) || 1;

      if (!circleVillagesMap.has(key)) {
        circleVillagesMap.set(key, new Set());
      }
      if (rawPlace) {
        circleVillagesMap.get(key).add(rawPlace);
        villageCounts.set(plKey, (villageCounts.get(plKey) || 0) + 1);
      }

      if (circleMap.has(key)) {
        const item = circleMap.get(key);
        item.shareholder_count++;
        item.total_shares += shares;
      } else {
        circleMap.set(key, {
          circle_id: s.circle_id || `CIR-${String(circleMap.size + 1).padStart(3, '0')}`,
          name: rawCircle,
          description: `${rawCircle} ವಲಯ (Zone)`,
          taluk: s.taluk || '',
          district: s.district || '',
          pincode: s.pin_code || '',
          circle_in_charge: '',
          contact_no: '',
          villages: [],
          village_count: 0,
          shareholder_count: 1,
          total_shares: shares
        });
      }
    }

    circleMap.forEach((item, key) => {
      if (circleVillagesMap.has(key)) {
        const arr = Array.from(circleVillagesMap.get(key)).sort((a, b) => a.localeCompare(b, 'kn'));
        item.villages = arr;
        item.village_count = arr.length;
        item.villagesWithCount = arr.map(v => ({
          name: v,
          count: villageCounts.get(v.toLowerCase()) || 0
        }));
        item.villagesWithDetails = arr.map(v => {
          const vKey = v.toLowerCase().normalize('NFC');
          const detail = mockCircleDirectory.find(d => (d.address || '').trim().toLowerCase().normalize('NFC') === vKey);
          return {
            name: v,
            address: v,
            taluk: detail?.taluk || item.taluk || '',
            district: detail?.district || item.district || '',
            pincode: detail?.pincode || '',
            circle_in_charge: detail?.circle_in_charge || item.circle_in_charge || '',
            contact_no: detail?.contact_no || item.contact_no || '',
            shareholder_count: villageCounts.get(vKey) || 0
          };
        });
      }
    });

    const list = Array.from(circleMap.values())
      .sort((a, b) => {
        if (a.name === 'Post' && b.name !== 'Post') return 1;
        if (b.name === 'Post' && a.name !== 'Post') return -1;
        return (a.name || '').localeCompare(b.name || '', 'kn');
      });

    return { success: true, data: list };
  },

  async getCircleDirectory({ search = '', circle = '', taluk = '' } = {}) {
    await ensureDBReady();
    let filtered = mockCircleDirectory;
    if (search) {
      const q = search.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(item =>
        (item.address || '').toLowerCase().normalize('NFC').includes(q) ||
        (item.circle_name || '').toLowerCase().normalize('NFC').includes(q) ||
        (item.taluk || '').toLowerCase().normalize('NFC').includes(q) ||
        (item.district || '').toLowerCase().normalize('NFC').includes(q) ||
        (item.circle_in_charge || '').toLowerCase().normalize('NFC').includes(q) ||
        (item.pincode || '').includes(q)
      );
    }
    if (circle) {
      const cq = circle.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(item => (item.circle_name || '').trim().toLowerCase().normalize('NFC') === cq);
    }
    if (taluk) {
      const tq = taluk.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(item => (item.taluk || '').trim().toLowerCase().normalize('NFC') === tq);
    }

    // Connect shareholder counts for each Address (Place)
    const placeCountMap = new Map();
    const placeSharesMap = new Map();
    mockShareholders.forEach(s => {
      const pl = (s.place || s.village_name || '').trim().toLowerCase().normalize('NFC');
      if (pl) {
        placeCountMap.set(pl, (placeCountMap.get(pl) || 0) + 1);
        placeSharesMap.set(pl, (placeSharesMap.get(pl) || 0) + (parseInt(s.number_of_shares) || 1));
      }
    });

    const enriched = filtered.map(item => {
      const k = (item.address || '').trim().toLowerCase().normalize('NFC');
      return {
        ...item,
        shareholder_count: placeCountMap.get(k) || 0,
        total_shares: placeSharesMap.get(k) || 0
      };
    }).sort((a, b) => (a.address || '').localeCompare(b.address || '', 'kn'));

    return { success: true, data: enriched, total: enriched.length };
  },

  async addCircleDirectoryBulk(records) {
    await ensureDBReady();
    if (!Array.isArray(records) || records.length === 0) return { success: true, count: 0 };

    const dirMap = new Map();
    mockCircleDirectory.forEach(item => {
      const key = (item.address || '').trim().toLowerCase().normalize('NFC');
      if (key) dirMap.set(key, item);
    });

    let nextId = mockCircleDirectory.length + 1;
    records.forEach(r => {
      const rawAddr = (r.address || r.place || r.village_name || r.name || '').trim().normalize('NFC');
      if (!rawAddr) return;
      const key = rawAddr.toLowerCase();
      const existing = dirMap.get(key);
      const entry = {
        id: existing ? existing.id : nextId++,
        address: rawAddr,
        circle_name: (r.circle_name || r.circle || 'ಇತರೆ').trim().normalize('NFC'),
        taluk: (r.taluk || '').trim().normalize('NFC'),
        district: (r.district || '').trim().normalize('NFC'),
        pincode: (r.pincode || r.pin_code || '').trim(),
        circle_in_charge: (r.circle_in_charge || r.in_charge || '').trim().normalize('NFC'),
        contact_no: (r.contact_no || r.mobile_no || r.contact || '').trim()
      };
      dirMap.set(key, entry);
    });

    mockCircleDirectory = Array.from(dirMap.values());
    await saveCircleDirectoryToDB(mockCircleDirectory);

    // Auto-enrich existing shareholders whose Place matches Address from this Circle Directory
    let shUpdated = false;
    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const plKey = (s.place || s.village_name || '').trim().toLowerCase().normalize('NFC');
      const addrKey = (s.address || '').trim().toLowerCase().normalize('NFC');
      let match = dirMap.get(plKey);
      if (!match && plKey) {
        for (const [k, v] of dirMap.entries()) {
          if (plKey === k || plKey.startsWith(k) || k.startsWith(plKey) || plKey.includes(k) || k.includes(plKey)) {
            match = v;
            break;
          }
        }
      }
      if (!match && addrKey) {
        for (const [k, v] of dirMap.entries()) {
          if (addrKey === k || addrKey.includes(k)) {
            match = v;
            if (!s.place) {
              s.place = v.address;
              s.village_name = v.address;
            }
            break;
          }
        }
      }
      if (match) {
        if (match.circle_name && s.circle !== match.circle_name) {
          s.circle = match.circle_name;
          s.circle_name = match.circle_name;
          shUpdated = true;
        }
        if (match.taluk && (!s.taluk || s.taluk === 'ಇಂಡಿ' || s.taluk !== match.taluk)) {
          s.taluk = match.taluk;
          shUpdated = true;
        }
        if (match.district && (!s.district || s.district === 'ವಿಜಯಪುರ' || s.district !== match.district)) {
          s.district = match.district;
          shUpdated = true;
        }
        if (match.pincode && (!s.pin_code || s.pin_code === '586 117' || s.pin_code !== match.pincode)) {
          s.pin_code = match.pincode;
          shUpdated = true;
        }
      }
    }
    if (shUpdated) {
      await saveToIndexedDB(mockShareholders);
    }

    return { success: true, count: records.length, total: mockCircleDirectory.length };
  },

  async resetCircleDirectory() {
    mockCircleDirectory = [...officialCircleData];
    saveStoredData(STORAGE_KEY_CIRCLE_DIR, mockCircleDirectory);
    await saveCircleDirectoryToDB(mockCircleDirectory);
    return { success: true, count: mockCircleDirectory.length };
  },

  async clearCircleDirectory() {
    mockCircleDirectory = [];
    saveStoredData(STORAGE_KEY_CIRCLE_DIR, []);
    await saveCircleDirectoryToDB([]);
    return { success: true };
  },

  async getBooks() {
    await ensureDBReady();
    const bookSet = new Set();
    for (let i = 0; i < mockShareholders.length; i++) {
      const b = (mockShareholders[i].book_no || '').trim();
      if (b) bookSet.add(b);
    }
    if (bookSet.size === 0) {
      return { success: true, data: [] };
    }
    const list = Array.from(bookSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB || a.localeCompare(b);
    });
    return { success: true, data: list };
  },

  async getScheduleCasts() {
    await ensureDBReady();
    const scSet = new Set();
    for (let i = 0; i < mockShareholders.length; i++) {
      const c = (mockShareholders[i].schedule_cast || '').trim().normalize('NFC');
      if (c) scSet.add(c);
    }
    if (scSet.size === 0) {
      return { success: true, data: ['ಅ - ವರ್ಗ', 'ಬ - ವರ್ಗ', 'ಕ - ವರ್ಗ', 'ಡ - ವರ್ಗ'] };
    }
    const list = Array.from(scSet).sort((a, b) => a.localeCompare(b, 'kn'));
    return { success: true, data: list };
  },

  async getEmployees() {
    const apiRes = await fetchApi('/employees');
    if (apiRes && apiRes.success) return apiRes;

    return { success: true, data: mockEmployees };
  },

  async addEmployee(data) {
    const apiRes = await fetchApi('/employees', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const nextId = mockEmployees.length + 1;
    const newEmp = {
      id: nextId,
      employee_id: `EMP-${String(nextId).padStart(3, '0')}`,
      ...data,
      status: 'Active'
    };
    mockEmployees.unshift(newEmp);
    saveStoredData(STORAGE_KEY_EMP, mockEmployees);
    return { success: true, employee_id: newEmp.employee_id };
  },

  resolveCircleForPlace(place) {
    if (!place) return { circle_name: 'ಇತರೆ (Other)', taluk: '', district: '', pincode: '' };
    const pKey = place.trim().toLowerCase().normalize('NFC');
    for (let i = 0; i < mockCircleDirectory.length; i++) {
      const cd = mockCircleDirectory[i];
      const addr = (cd.address || '').trim().toLowerCase().normalize('NFC');
      if (addr === pKey) return cd;
    }
    for (let i = 0; i < mockCircleDirectory.length; i++) {
      const cd = mockCircleDirectory[i];
      const addr = (cd.address || '').trim().toLowerCase().normalize('NFC');
      if (addr && (pKey.startsWith(addr) || addr.startsWith(pKey) || pKey.includes(addr) || addr.includes(pKey))) {
        return cd;
      }
    }
    return { circle_name: 'ಇತರೆ (Other)', taluk: '', district: '', pincode: '' };
  },

  async getAuditLogs() {
    const apiRes = await fetchApi('/audit-logs');
    if (apiRes && apiRes.success) return apiRes;

    return {
      success: true,
      data: mockAuditLogs
    };
  },

  // -------------------------------------------------------------
  // MERGE SHARES & SHARE DETAILS FOR SHAREHOLDERS WITH MULTIPLE AMOUNTS
  // -------------------------------------------------------------

  async getMultipleHoldingsSummary() {
    await ensureDBReady();
    const groups = new Map();

    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const rawName = (s.shareholder_name || s.name || '').trim().replace(/\s+/g, ' ');
      const rawPlace = (s.place || s.village_name || '').trim().replace(/\s+/g, ' ');
      if (!rawName) continue;
      
      const key = `${rawName.toLowerCase().normalize('NFC')} | ${rawPlace.toLowerCase().normalize('NFC')}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          shareholder_name: rawName,
          place: rawPlace,
          taluk: s.taluk || '',
          district: s.district || '',
          circle: s.circle || s.circle_name || '',
          gender: s.gender || 'M',
          mobile_no: s.mobile_no || s.mobile || '',
          aadhaar_card_no: s.aadhaar_card_no || s.aadhaar_ref || '',
          schedule_cast: s.schedule_cast || 'ಅ - ವರ್ಗ',
          items: []
        });
      }
      groups.get(key).items.push(s);
    }

    const detectedHoldings = [];
    let totalRedundantRecords = 0;
    let totalMergedSharesSum = 0;
    let totalMergedCapitalSum = 0;

    for (const [key, g] of groups.entries()) {
      if (g.items.length > 1) {
        let combinedShares = 0;
        let combinedTotalAmt = 0;
        const shareNos = [];
        const receipts = [];
        const holdingsBreakdown = [];

        g.items.forEach(item => {
          const sAmt1 = parseFloat(item.receipt_amount) || 0;
          const sAmt2 = parseFloat(item.amount) || 0;
          const sTot = parseFloat(item.total_amount) || (sAmt1 + sAmt2) || 2000;
          const sCount = parseInt(item.number_of_shares) || (sTot ? Math.max(1, Math.floor(sTot / 2000)) : 1);
          
          combinedShares += sCount;
          combinedTotalAmt += sTot;
          const sNo = String(item.share_no || item.share_number || '').trim();
          if (sNo && !shareNos.includes(sNo)) shareNos.push(sNo);
          if (item.receipt_no && !receipts.includes(item.receipt_no)) receipts.push(item.receipt_no);
          if (item.reciept && !receipts.includes(item.reciept)) receipts.push(item.reciept);

          holdingsBreakdown.push({
            id: item.id,
            share_no: sNo,
            shares: sCount,
            amount: sTot,
            receipt_no: item.receipt_no || '—',
            receipt_date: item.reg_date || item.date || '—',
            reciept_2: item.reciept || '',
            amount_2: sAmt2 || 0,
            date_2: item.date || ''
          });
        });

        totalRedundantRecords += (g.items.length - 1);
        totalMergedSharesSum += combinedShares;
        totalMergedCapitalSum += combinedTotalAmt;

        detectedHoldings.push({
          key,
          shareholder_name: g.shareholder_name,
          place: g.place,
          taluk: g.taluk,
          district: g.district,
          circle: g.circle,
          mobile_no: g.mobile_no,
          aadhaar_card_no: g.aadhaar_card_no,
          schedule_cast: g.schedule_cast,
          count: g.items.length,
          combined_shares: combinedShares,
          combined_total_amount: combinedTotalAmt,
          share_numbers: shareNos,
          receipt_numbers: receipts,
          holdings: holdingsBreakdown,
          primary_id: g.items[0].id
        });
      }
    }

    return {
      success: true,
      totalDetectedShareholders: detectedHoldings.length,
      totalRedundantRecords,
      totalMergedSharesSum,
      totalMergedCapitalSum,
      data: detectedHoldings
    };
  },

  async mergeShareholderHoldings({ groupKey, adminUser = 'Admin' }) {
    await ensureDBReady();
    if (!groupKey) return { success: false, message: 'Group key required' };

    // Find all matching shareholder records
    const matchingIndices = [];
    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const rawName = (s.shareholder_name || s.name || '').trim().replace(/\s+/g, ' ');
      const rawPlace = (s.place || s.village_name || '').trim().replace(/\s+/g, ' ');
      const key = `${rawName.toLowerCase().normalize('NFC')} | ${rawPlace.toLowerCase().normalize('NFC')}`;
      if (key === groupKey) {
        matchingIndices.push(i);
      }
    }

    if (matchingIndices.length <= 1) {
      return { success: false, message: 'No multiple records found to merge for this shareholder.' };
    }

    const items = matchingIndices.map(idx => mockShareholders[idx]);
    const primary = items[0];
    const duplicates = items.slice(1);

    let combinedShares = 0;
    let combinedTotalAmt = 0;
    const shareNos = [];
    const receipts = [];
    const mergedHoldings = [];

    items.forEach(item => {
      const sAmt1 = parseFloat(item.receipt_amount) || 0;
      const sAmt2 = parseFloat(item.amount) || 0;
      const sTot = parseFloat(item.total_amount) || (sAmt1 + sAmt2) || 2000;
      const sCount = parseInt(item.number_of_shares) || (sTot ? Math.max(1, Math.floor(sTot / 2000)) : 1);
      
      combinedShares += sCount;
      combinedTotalAmt += sTot;
      const sNo = String(item.share_no || item.share_number || '').trim();
      if (sNo && !shareNos.includes(sNo)) shareNos.push(sNo);
      if (item.receipt_no && !receipts.includes(item.receipt_no)) receipts.push(item.receipt_no);
      if (item.reciept && !receipts.includes(item.reciept)) receipts.push(item.reciept);

      mergedHoldings.push({
        id: item.id,
        share_no: sNo,
        shares: sCount,
        amount: sTot,
        receipt_no: item.receipt_no || '—',
        receipt_date: item.reg_date || item.date || '—',
        book_no: item.book_no || 'B.No: 1',
        reciept_2: item.reciept || '',
        amount_2: sAmt2 || 0,
        date_2: item.date || ''
      });
    });

    // Update primary record with consolidated shares and amounts
    primary.number_of_shares = combinedShares;
    primary.total_amount = combinedTotalAmt;
    primary.share_value = combinedTotalAmt;
    primary.share_no = shareNos.join(', ');
    primary.primary_share_no = shareNos[0];
    primary.all_share_numbers = shareNos;
    primary.all_receipt_numbers = receipts;
    primary.multiple_amounts = true;
    primary.is_merged = true;
    primary.merged_holdings = mergedHoldings;
    
    // Receipt 1 & Receipt 2 details
    if (mergedHoldings[0]) {
      primary.receipt_no = mergedHoldings[0].receipt_no;
      primary.receipt_amount = mergedHoldings[0].amount;
    }
    if (mergedHoldings[1]) {
      primary.reciept = mergedHoldings[1].receipt_no;
      primary.amount = mergedHoldings[1].amount;
      primary.date = mergedHoldings[1].receipt_date;
    }

    // Populate best phone / aadhaar if primary was missing
    items.forEach(it => {
      if (!primary.mobile_no && (it.mobile_no || it.mobile)) {
        primary.mobile_no = it.mobile_no || it.mobile;
        primary.mobile = primary.mobile_no;
      }
      if (!primary.aadhaar_card_no && (it.aadhaar_card_no || it.aadhaar_ref)) {
        primary.aadhaar_card_no = it.aadhaar_card_no || it.aadhaar_ref;
        primary.aadhaar_ref = primary.aadhaar_card_no;
      }
      if (!primary.nominee_name && it.nominee_name) {
        primary.nominee_name = it.nominee_name;
        primary.nominee_aadhaar_no = it.nominee_aadhaar_no;
        primary.nominee_mobile_no = it.nominee_mobile_no;
        primary.nominee_address = it.nominee_address;
      }
    });

    primary.notes = `ಬಹು-ಶೇರುಗಳ ಮತ್ತು ಮೊತ್ತಗಳ ವಿಲೀನ: ಶೇರು ಸಂಖ್ಯೆ #${shareNos.join(', #')} ಮತ್ತು ಮೊತ್ತಗಳನ್ನು ವಿಲೀನಗೊಳಿಸಿ ಒಟ್ಟು ${combinedShares} ಶೇರುಗಳು (₹${combinedTotalAmt.toLocaleString()}) ಏಕೀಕರಿಸಲಾಗಿದೆ.`;

    // Add Audit Trail entry
    if (!Array.isArray(primary.audit_history)) primary.audit_history = [];
    primary.audit_history.unshift({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      performed_by: adminUser || 'Admin',
      type: 'MERGE_SHARES',
      title: 'ಬಹು-ಶೇರುಗಳ ಮತ್ತು ಮೊತ್ತಗಳ ಅಧಿಕೃತ ವಿಲೀನ (Multiple Shares Merged)',
      description: `ಶೇರುದಾರರಾದ ಶ್ರೀ/ಶ್ರೀಮತಿ ${primary.shareholder_name || primary.name} ಅವರ ಹೆಸರಿನಲ್ಲಿದ್ದ ${items.length} ಪ್ರತ್ಯೇಕ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್‌ಗಳು (#${shareNos.join(', #')}) ಮತ್ತು ಮೊತ್ತಗಳನ್ನು ವಿಲೀನಗೊಳಿಸಿ ಏಕೀಕೃತ ಖಾತೆಯಾಗಿ (ಒಟ್ಟು ${combinedShares} ಶೇರುಗಳು, ₹${combinedTotalAmt.toLocaleString()}) ನವೀಕರಿಸಲಾಗಿದೆ.`,
      details: {
        shareholder_name: primary.shareholder_name || primary.name,
        place: primary.place,
        merged_share_nos: shareNos,
        total_shares: combinedShares,
        total_amount: combinedTotalAmt,
        holdings: mergedHoldings,
        approved_by: adminUser
      }
    });

    // Remove duplicate IDs from mockShareholders
    const duplicateIds = new Set(duplicates.map(d => d.id));
    mockShareholders = mockShareholders.filter(s => !duplicateIds.has(s.id));

    // Save consolidated master list to IndexedDB
    await saveToIndexedDB(mockShareholders);

    return {
      success: true,
      mergedRecord: primary,
      removedCount: duplicates.length,
      combinedShares,
      combinedTotalAmt
    };
  },

  async mergeAllMultipleHoldings({ adminUser = 'Admin' }) {
    await ensureDBReady();
    const summary = await this.getMultipleHoldingsSummary();
    if (!summary.data || summary.data.length === 0) {
      return { success: true, count: 0, message: 'ಯಾವುದೇ ಬಹು-ಶೇರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ (No multiple holdings found)' };
    }

    let mergedCount = 0;
    let totalSharesCombined = 0;
    let totalCapitalCombined = 0;

    for (const g of summary.data) {
      const res = await this.mergeShareholderHoldings({ groupKey: g.key, adminUser });
      if (res.success) {
        mergedCount++;
        totalSharesCombined += (res.combinedShares || 0);
        totalCapitalCombined += (res.combinedTotalAmt || 0);
      }
    }

    await saveToIndexedDB(mockShareholders);

    return {
      success: true,
      mergedCount,
      totalSharesCombined,
      totalCapitalCombined,
      remainingMasterCount: mockShareholders.length
    };
  },

  async searchShareholdersByShareNo(query = '') {
    await ensureDBReady();
    if (!query || !String(query).trim()) return { success: true, data: [] };
    const q = String(query).replace(/^#/, '').trim().toLowerCase().normalize('NFC');
    const results = [];
    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const sNo = String(s.share_no || s.share_number || '').trim();
      const sName = (s.shareholder_name || s.name || '').trim().toLowerCase().normalize('NFC');
      const sPlace = (s.place || s.village_name || '').trim().toLowerCase().normalize('NFC');
      
      const allNos = Array.isArray(s.all_share_numbers) && s.all_share_numbers.length > 0
        ? s.all_share_numbers.map(n => String(n).trim()) 
        : sNo.split(',').map(n => n.trim()).filter(Boolean);

      const matchShareNo = allNos.some(num => num.toLowerCase() === q || num.toLowerCase().startsWith(q));
      const matchName = sName.includes(q);
      const matchPlace = sPlace.includes(q);

      if (matchShareNo || matchName || matchPlace) {
        results.push({
          id: s.id,
          share_no: s.share_no || s.share_number,
          all_share_numbers: allNos,
          shareholder_name: s.shareholder_name || s.name,
          place: s.place || s.village_name,
          taluk: s.taluk,
          circle: s.circle,
          number_of_shares: parseInt(s.number_of_shares) || 1,
          total_amount: parseFloat(s.total_amount) || 2000,
          receipt_amount: parseFloat(s.receipt_amount) || 0,
          amount: parseFloat(s.amount) || 0,
          receipt_no: s.receipt_no || '',
          reciept: s.reciept || '',
          book_no: s.book_no || 'B.No: 1',
          reg_date: s.reg_date || s.date || '',
          schedule_cast: s.schedule_cast || 'ಅ - ವರ್ಗ',
          aadhaar_card_no: s.aadhaar_card_no || '',
          mobile_no: s.mobile_no || s.mobile || '',
          is_merged: !!s.is_merged
        });
        if (results.length >= 30) break;
      }
    }
    return { success: true, data: results };
  },

  async mergeSharesByShareNumbers({ shareNumbers = [], primaryShareNo = null, adminUser = 'Admin' }) {
    await ensureDBReady();
    if (!Array.isArray(shareNumbers) || shareNumbers.length < 2) {
      return { success: false, message: 'ವಿಲೀನಗೊಳಿಸಲು ಕನಿಷ್ಠ 2 ಷೇರು ಸಂಖ್ಯೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ (Please select at least 2 share numbers to merge).' };
    }

    const cleanTargets = shareNumbers.map(n => String(n).replace(/^#/, '').trim()).filter(Boolean);
    if (cleanTargets.length < 2) {
      return { success: false, message: 'ಮಾನ್ಯ ಷೇರು ಸಂಖ್ಯೆಗಳನ್ನು ಒದಗಿಸಿ (Invalid share numbers).' };
    }

    // Find all matching shareholder records from live DB
    const matchingRecords = [];
    const matchedIds = new Set();

    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const sNo = String(s.share_no || s.share_number || '').trim();
      const allNos = Array.isArray(s.all_share_numbers) && s.all_share_numbers.length > 0
        ? s.all_share_numbers.map(n => String(n).trim())
        : sNo.split(',').map(n => n.trim()).filter(Boolean);

      const matchesTarget = cleanTargets.some(target => 
        allNos.some(num => num.toLowerCase() === target.toLowerCase()) ||
        String(s.id) === String(target) ||
        sNo.toLowerCase() === target.toLowerCase()
      );

      if (matchesTarget && !matchedIds.has(s.id)) {
        matchedIds.add(s.id);
        matchingRecords.push(s);
      }
    }

    if (matchingRecords.length < 2) {
      return { 
        success: false, 
        message: `ಕೇವಲ ${matchingRecords.length} ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿವೆ. ವಿಲೀನಗೊಳಿಸಲು ಕನಿಷ್ಠ 2 ಪ್ರತ್ಯೇಕ ಷೇರುದಾರರ ಖಾತೆಗಳು ಅಗತ್ಯವಿದೆ.` 
      };
    }

    // Determine primary record
    let primary = matchingRecords[0];
    if (primaryShareNo) {
      const foundPrimary = matchingRecords.find(r => {
        const rNo = String(r.share_no || r.share_number || '').trim();
        const allNos = Array.isArray(r.all_share_numbers) ? r.all_share_numbers.map(n => String(n).trim()) : rNo.split(',').map(n => n.trim());
        return allNos.includes(String(primaryShareNo).trim()) || String(r.id) === String(primaryShareNo);
      });
      if (foundPrimary) primary = foundPrimary;
    }

    const secondaries = matchingRecords.filter(r => r.id !== primary.id);

    // Consolidate shares, amounts, and share numbers
    let combinedShares = 0;
    let combinedTotalAmt = 0;
    let combinedReceiptAmt = 0;
    let combinedInstallmentAmt = 0;
    const allShareNos = [];
    const allReceipts = [];
    const mergedHoldings = [];

    matchingRecords.forEach(item => {
      const sAmt1 = parseFloat(item.receipt_amount) || 0;
      const sAmt2 = parseFloat(item.amount) || 0;
      const sTot = parseFloat(item.total_amount) || (sAmt1 + sAmt2) || 2000;
      const sCount = parseInt(item.number_of_shares) || (sTot ? Math.max(1, Math.floor(sTot / 2000)) : 1);

      combinedShares += sCount;
      combinedTotalAmt += sTot;
      combinedReceiptAmt += sAmt1;
      combinedInstallmentAmt += sAmt2;

      // Extract all share numbers
      const itemNos = Array.isArray(item.all_share_numbers) && item.all_share_numbers.length > 0
        ? item.all_share_numbers.map(n => String(n).trim())
        : String(item.share_no || item.share_number || '').split(',').map(n => n.trim()).filter(Boolean);

      itemNos.forEach(num => {
        if (!allShareNos.includes(num)) allShareNos.push(num);
      });

      if (item.receipt_no && !allReceipts.includes(item.receipt_no)) allReceipts.push(item.receipt_no);
      if (item.reciept && !allReceipts.includes(item.reciept)) allReceipts.push(item.reciept);

      if (Array.isArray(item.merged_holdings) && item.merged_holdings.length > 0) {
        mergedHoldings.push(...item.merged_holdings);
      } else {
        mergedHoldings.push({
          id: item.id,
          share_no: item.share_no || item.share_number,
          shares: sCount,
          amount: sTot,
          receipt_no: item.receipt_no || item.reciept || '—',
          receipt_date: item.reg_date || item.date || '—',
          book_no: item.book_no || 'B.No: 1',
          reciept_2: item.reciept || '',
          amount_2: sAmt2 || 0,
          date_2: item.date || '',
          place: item.place,
          taluk: item.taluk
        });
      }
    });

    // Update primary record
    primary.number_of_shares = combinedShares;
    primary.total_amount = combinedTotalAmt;
    primary.share_value = combinedTotalAmt;
    primary.share_no = allShareNos.join(', ');
    primary.share_number = allShareNos.join(', ');
    primary.primary_share_no = allShareNos[0];
    primary.all_share_numbers = allShareNos;
    primary.all_receipt_numbers = allReceipts;
    primary.receipt_amount = combinedReceiptAmt || (mergedHoldings[0]?.amount || 0);
    primary.amount = combinedInstallmentAmt || (mergedHoldings[1]?.amount || 0);
    primary.multiple_amounts = true;
    primary.is_merged = true;
    primary.merged_holdings = mergedHoldings;

    // Fill missing KYC from secondaries
    secondaries.forEach(sec => {
      if (!primary.mobile_no && (sec.mobile_no || sec.mobile)) {
        primary.mobile_no = sec.mobile_no || sec.mobile;
        primary.mobile = primary.mobile_no;
      }
      if (!primary.aadhaar_card_no && (sec.aadhaar_card_no || sec.aadhaar_ref)) {
        primary.aadhaar_card_no = sec.aadhaar_card_no || sec.aadhaar_ref;
        primary.aadhaar_ref = primary.aadhaar_card_no;
      }
      if (!primary.nominee_name && sec.nominee_name) {
        primary.nominee_name = sec.nominee_name;
        primary.nominee_aadhaar_no = sec.nominee_aadhaar_no;
        primary.nominee_mobile_no = sec.nominee_mobile_no;
        primary.nominee_address = sec.nominee_address;
      }
    });

    // Audit History
    if (!Array.isArray(primary.audit_history)) primary.audit_history = [];
    primary.audit_history.unshift({
      id: `AUD-MERGE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      performed_by: adminUser || 'Admin',
      type: 'MERGE_SHARES_BY_SELECTION',
      title: 'ಆಯ್ಕೆಮಾಡಿದ ಷೇರುಗಳ ಅಧಿಕೃತ ವಿಲೀನ (Shares Merged by Selection)',
      description: `ಆಯ್ಕೆಮಾಡಿದ ಷೇರು ಸಂಖ್ಯೆಗಳು #${allShareNos.join(', #')} ಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ವಿಲೀನಗೊಳಿಸಿ ಏಕೀಕೃತ ಮಾಸ್ಟರ್ ಖಾತೆಯಾಗಿ (ಒಟ್ಟು ${combinedShares} ಷೇರುಗಳು, ₹${combinedTotalAmt.toLocaleString()}) ನವೀಕರಿಸಲಾಗಿದೆ.`,
      details: {
        merged_share_nos: allShareNos,
        total_shares: combinedShares,
        total_amount: combinedTotalAmt,
        primary_record_id: primary.id,
        primary_name: primary.shareholder_name || primary.name,
        records_merged: matchingRecords.map(r => ({
          id: r.id,
          share_no: r.share_no,
          name: r.shareholder_name || r.name,
          place: r.place,
          shares: r.number_of_shares,
          amount: r.total_amount
        })),
        approved_by: adminUser
      }
    });

    // Remove secondary IDs from mockShareholders
    const secondaryIds = new Set(secondaries.map(s => s.id));
    mockShareholders = mockShareholders.filter(s => !secondaryIds.has(s.id));

    // Save to IndexedDB
    await saveToIndexedDB(mockShareholders);

    return {
      success: true,
      mergedRecord: primary,
      combinedShareNumbers: allShareNos,
      combinedShareNoStr: allShareNos.join(', '),
      combinedShares,
      combinedTotalAmt,
      removedCount: secondaries.length,
      remainingCount: mockShareholders.length,
      message: `ಷೇರು ಸಂಖ್ಯೆಗಳು #${allShareNos.join(', #')} ಯಶಸ್ವಿಯಾಗಿ ವಿಲೀನಗೊಂಡಿವೆ!`
    };
  }

,

  async getMergeRequests(status = '') {
    await ensureDBReady();
    let filtered = mockMergeRequests;
    if (status) {
      filtered = filtered.filter(m => (m.approval_status || '').toLowerCase().includes(status.toLowerCase()));
    }
    return {
      success: true,
      data: filtered,
      totalCount: mockMergeRequests.length,
      pendingCount: mockMergeRequests.filter(m => (m.approval_status || '').includes('Pending')).length,
      approvedCount: mockMergeRequests.filter(m => (m.approval_status || '').includes('Approved')).length,
      rejectedCount: mockMergeRequests.filter(m => (m.approval_status || '').includes('Rejected')).length
    };
  },

  async submitMergeRequest({ shareNumbers = [], primaryShareNo = null, requestedBy = 'Operator', remarks = '' }) {
    await ensureDBReady();
    if (!Array.isArray(shareNumbers) || shareNumbers.length < 2) {
      return { success: false, message: 'ವಿಲೀನಗೊಳಿಸಲು ಕನಿಷ್ಠ 2 ಷೇರು ಸಂಖ್ಯೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.' };
    }

    const cleanTargets = shareNumbers.map(n => String(n).replace(/^#/, '').trim()).filter(Boolean);
    const matchingRecords = [];
    const matchedIds = new Set();

    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const sNo = String(s.share_no || s.share_number || '').trim();
      const allNos = Array.isArray(s.all_share_numbers) && s.all_share_numbers.length > 0
        ? s.all_share_numbers.map(n => String(n).trim())
        : sNo.split(',').map(n => n.trim()).filter(Boolean);

      const matchesTarget = cleanTargets.some(target => 
        allNos.some(num => num.toLowerCase() === target.toLowerCase()) ||
        String(s.id) === String(target) ||
        sNo.toLowerCase() === target.toLowerCase()
      );

      if (matchesTarget && !matchedIds.has(s.id)) {
        matchedIds.add(s.id);
        matchingRecords.push(s);
      }
    }

    if (matchingRecords.length < 2) {
      return { success: false, message: 'ವಿಲೀನಗೊಳಿಸಲು ಕನಿಷ್ಠ 2 ಮಾನ್ಯ ಷೇರು ದಾಖಲೆಗಳು ಅಗತ್ಯವಿದೆ.' };
    }

    let primary = matchingRecords[0];
    if (primaryShareNo) {
      const foundPrimary = matchingRecords.find(r => {
        const rNo = String(r.share_no || r.share_number || '').trim();
        const allNos = Array.isArray(r.all_share_numbers) ? r.all_share_numbers.map(n => String(n).trim()) : rNo.split(',').map(n => n.trim());
        return allNos.includes(String(primaryShareNo).trim()) || String(r.id) === String(primaryShareNo);
      });
      if (foundPrimary) primary = foundPrimary;
    }

    let combinedShares = 0;
    let combinedTotalAmt = 0;
    const allShareNos = [];

    matchingRecords.forEach(item => {
      const sAmt1 = parseFloat(item.receipt_amount) || 0;
      const sAmt2 = parseFloat(item.amount) || 0;
      const sTot = parseFloat(item.total_amount) || (sAmt1 + sAmt2) || 2000;
      const sCount = parseInt(item.number_of_shares) || (sTot ? Math.max(1, Math.floor(sTot / 2000)) : 1);

      combinedShares += sCount;
      combinedTotalAmt += sTot;

      const itemNos = Array.isArray(item.all_share_numbers) && item.all_share_numbers.length > 0
        ? item.all_share_numbers.map(n => String(n).trim())
        : String(item.share_no || item.share_number || '').split(',').map(n => n.trim()).filter(Boolean);

      itemNos.forEach(num => {
        if (!allShareNos.includes(num)) allShareNos.push(num);
      });
    });

    const nextId = mockMergeRequests.length + 1;
    const newReq = {
      id: `MRG-${Date.now()}`,
      request_id: `MRG-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`,
      request_date: new Date().toISOString(),
      requested_by: requestedBy || 'Operator',
      share_numbers: allShareNos,
      primary_share_no: primary.share_no,
      primary_record_id: primary.id,
      primary_record: {
        id: primary.id,
        share_no: primary.share_no,
        name: primary.shareholder_name || primary.name,
        place: primary.place,
        taluk: primary.taluk,
        shares: primary.number_of_shares,
        amount: primary.total_amount
      },
      records_to_merge: matchingRecords.map(r => ({
        id: r.id,
        share_no: r.share_no,
        name: r.shareholder_name || r.name,
        place: r.place,
        taluk: r.taluk,
        shares: r.number_of_shares,
        amount: r.total_amount,
        receipt_no: r.receipt_no
      })),
      combined_shares: combinedShares,
      combined_total_amount: combinedTotalAmt,
      combined_share_nos: allShareNos,
      combined_share_no_str: allShareNos.join(', '),
      approval_status: 'Pending Admin Approval',
      remarks: remarks || 'ಆಡಳಿತ ಮಂಡಳಿ / ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಲಾದ ಬಹು-ಶೇರುಗಳ ವಿಲೀನ ವಿನಂತಿ.'
    };

    mockMergeRequests.unshift(newReq);
    saveStoredData(STORAGE_KEY_MERGE_REQ, mockMergeRequests);

    return {
      success: true,
      data: newReq,
      message: `ವಿಲೀನ ವಿನಂತಿ (#${newReq.request_id}) ಅನ್ನು ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗೆ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ!`
    };
  },

  async approveMergeRequestByAdmin({ requestId, adminUser = 'Admin', remarks = '' }) {
    await ensureDBReady();
    const req = mockMergeRequests.find(m => m.id === requestId || m.request_id === requestId);
    if (!req) return { success: false, message: 'Merge request not found' };

    // Execute the actual merge in live master list
    const mergeRes = await this.mergeSharesByShareNumbers({
      shareNumbers: req.share_numbers,
      primaryShareNo: req.primary_share_no,
      adminUser
    });

    if (!mergeRes.success) {
      return mergeRes;
    }

    // Update request status to Approved & Merged
    req.approval_status = 'Approved & Merged (ಅನುಮೋದಿಸಿ ವಿಲೀನಗೊಳಿಸಲಾಗಿದೆ)';
    req.approved_by = adminUser;
    req.approved_at = new Date().toISOString();
    req.approval_remarks = remarks || 'ಅಡ್ಮಿನ್ ಅಧಿಕೃತ ಅನುಮೋದನೆ ನೀಡಿ ಮಾಸ್ಟರ್ ಶೀಟ್‌ಗೆ ವಿಲೀನಗೊಳಿಸಲಾಗಿದೆ.';
    req.merged_result = {
      combinedShares: mergeRes.combinedShares,
      combinedTotalAmt: mergeRes.combinedTotalAmt,
      combinedShareNoStr: mergeRes.combinedShareNoStr
    };

    saveStoredData(STORAGE_KEY_MERGE_REQ, mockMergeRequests);

    return {
      success: true,
      data: req,
      mergeRes,
      message: `ವಿಲೀನ ವಿನಂತಿ #${req.request_id} ಯಶಸ್ವಿಯಾಗಿ ಅನುಮೋದನೆಗೊಂಡು, ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ಷೇರುಗಳು #${req.combined_share_no_str} ಅಧಿಕೃತವಾಗಿ ವಿಲೀನಗೊಂಡಿವೆ!`
    };
  },

  async rejectMergeRequestByAdmin({ requestId, adminUser = 'Admin', remarks = '' }) {
    await ensureDBReady();
    const req = mockMergeRequests.find(m => m.id === requestId || m.request_id === requestId);
    if (!req) return { success: false, message: 'Merge request not found' };

    req.approval_status = 'Rejected (ತಿರಸ್ಕರಿಸಲಾಗಿದೆ)';
    req.rejected_by = adminUser;
    req.rejected_at = new Date().toISOString();
    req.rejection_remarks = remarks || 'ಅಡ್ಮಿನ್ ಪರಿಶೀಲನೆಯಲ್ಲಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.';

    saveStoredData(STORAGE_KEY_MERGE_REQ, mockMergeRequests);

    return {
      success: true,
      data: req,
      message: `ವಿಲೀನ ವಿನಂತಿ #${req.request_id} ಅನ್ನು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.`
    };
  },

  async deleteMergeRequest(requestId) {
    const idx = mockMergeRequests.findIndex(m => m.id === requestId || m.request_id === requestId);
    if (idx !== -1) {
      mockMergeRequests.splice(idx, 1);
      saveStoredData(STORAGE_KEY_MERGE_REQ, mockMergeRequests);
      return { success: true };
    }
    return { success: false, message: 'Request not found' };
  }
};
