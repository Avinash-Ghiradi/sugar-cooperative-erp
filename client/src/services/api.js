// Data Service Layer supporting both backend REST API and clean client-side storage
// Official 357-Village Circle Directory mapping provided by user
import officialCircleData from './officialCircleData.json';

const API_BASE = '/api';

const STORAGE_KEY_SH = 'sugar_erp_clean_shareholders_v3';
const STORAGE_KEY_TX = 'sugar_erp_clean_tx_v3';
const STORAGE_KEY_SA = 'sugar_erp_clean_allotments_v3';
const STORAGE_KEY_VT = 'sugar_erp_clean_varasa_v3';
const STORAGE_KEY_EMP = 'sugar_erp_clean_emp_v3';
const STORAGE_KEY_LOGS = 'sugar_erp_clean_logs_v3';

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

let mockTransactions = loadStoredData(STORAGE_KEY_TX, []);
let mockSugarAllotments = loadStoredData(STORAGE_KEY_SA, []);
let mockVarasaTransfers = loadStoredData(STORAGE_KEY_VT, []);
let mockEmployees = loadStoredData(STORAGE_KEY_EMP, []);
let mockAuditLogs = loadStoredData(STORAGE_KEY_LOGS, []);

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
        ]
      }
    };
  },

  async getShareholders({ page = 1, limit = 20, search = '', village_id = '', circle_id = '', status = '', book_no = '', schedule_cast = '' }) {
    await ensureDBReady();
    const apiRes = await fetchApi(`/shareholders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&village_id=${village_id}&circle_id=${circle_id}&status=${status}&book_no=${book_no}&schedule_cast=${encodeURIComponent(schedule_cast)}`);
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

    const sh = mockShareholders.find(s => s.shareholder_id === id || s.id === parseInt(id) || s.share_no === id);
    if (!sh) return { success: false, message: 'Not found' };

    const txs = mockTransactions.filter(t => t.shareholder_id === sh.shareholder_id);
    const allotments = mockSugarAllotments.filter(a => a.shareholder_id === sh.shareholder_id);
    const varasa = mockVarasaTransfers.filter(v => v.existing_shareholder_id === sh.shareholder_id);

    return {
      success: true,
      shareholder: sh,
      history: {
        transactions: txs,
        sugarAllotments: allotments,
        varasaHistory: varasa,
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
        date: data.date || data.reg_date || nowStr,
        reciept: data.reciept || receiptNo,
        amount: parseFloat(data.amount) || receiptAmt,
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
      date: data.date || data.reg_date || nowStr,
      reciept: data.reciept || data.receipt_no || String(nextId),
      amount: parseFloat(data.amount) || parseFloat(data.receipt_amount) || 2000,
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

  async getVarasaTransfers() {
    await ensureDBReady();
    const apiRes = await fetchApi('/varasa');
    if (apiRes && apiRes.success) return apiRes;

    return { success: true, data: mockVarasaTransfers };
  },

  async addVarasaTransfer(data) {
    await ensureDBReady();
    const apiRes = await fetchApi('/varasa', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === data.existing_shareholder_id);
    const newV = {
      id: mockVarasaTransfers.length + 1,
      transfer_id: `VAR-${Date.now()}`,
      ...data,
      existing_shareholder_name: sh ? (sh.shareholder_name || sh.name) : 'Existing Member',
      approval_status: 'Application Received',
      documents_verified: 'Pending'
    };
    mockVarasaTransfers.unshift(newV);
    saveStoredData(STORAGE_KEY_VT, mockVarasaTransfers);
    return { success: true, transfer_id: newV.transfer_id };
  },

  async updateVarasaStatus(transfer_id, approval_status) {
    await ensureDBReady();
    const apiRes = await fetchApi(`/varasa/${transfer_id}/status`, { method: 'PUT', body: JSON.stringify({ approval_status }) });
    if (apiRes && apiRes.success) return apiRes;

    const item = mockVarasaTransfers.find(v => v.transfer_id === transfer_id);
    if (item) {
      item.approval_status = approval_status;
      saveStoredData(STORAGE_KEY_VT, mockVarasaTransfers);
    }
    return { success: true };
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
      .sort((a, b) => b.shareholder_count - a.shareholder_count || a.name.localeCompare(b.name, 'kn'));

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
        return b.shareholder_count - a.shareholder_count || b.village_count - a.village_count || a.name.localeCompare(b.name, 'kn');
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
    });

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
  }
};
