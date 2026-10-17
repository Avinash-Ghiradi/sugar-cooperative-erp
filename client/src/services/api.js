// Data Service Layer supporting both backend REST API and clean client-side storage
// All mock data removed. Operates on real user records with full 38-column statutory support.

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
      return loadStoredData(STORAGE_KEY_CIRCLE_DIR, []);
    }
    return new Promise((resolve) => {
      const tx = db.transaction([CIRCLE_STORE], 'readonly');
      const store = tx.objectStore(CIRCLE_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const res = req.result || [];
        // If the only records in IndexedDB are the legacy mock items, discard and clear them
        if (res.length === 26 && res[0]?.address === 'ಅಗರಖೇಡ') {
          try {
            const clearTx = db.transaction([CIRCLE_STORE], 'readwrite');
            clearTx.objectStore(CIRCLE_STORE).clear();
          } catch (e) {}
          resolve([]);
          return;
        }
        if (res && res.length > 0) resolve(res);
        else resolve(loadStoredData(STORAGE_KEY_CIRCLE_DIR, []));
      };
      req.onerror = () => resolve(loadStoredData(STORAGE_KEY_CIRCLE_DIR, []));
    });
  } catch (err) {
    return loadStoredData(STORAGE_KEY_CIRCLE_DIR, []);
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

// Initial Official Circle & Village Directory mapping (Empty initial state - 100% clean)
export const initialCircleDirectory = [];

export let mockCircleDirectory = loadStoredData(STORAGE_KEY_CIRCLE_DIR, []);

// Circles Master (Empty initial state - 100% clean)
export const mockCircles = [];

// Villages / Places Master (Empty initial state - 100% clean)
export const placesList = [];

export const mockVillages = [];

// Real Live Datasets (Initialized as clean empty arrays - zero mock records)
let mockShareholders = loadStoredData(STORAGE_KEY_SH, []);
let isDBReady = false;
let dbInitPromise = null;

export function ensureDBReady() {
  if (isDBReady) return Promise.resolve(mockShareholders);
  if (!dbInitPromise) {
    if (typeof window !== 'undefined' && window.indexedDB) {
      dbInitPromise = Promise.all([
        loadFromIndexedDB(),
        loadCircleDirectoryFromDB()
      ]).then(([dbData, circleData]) => {
        if (dbData && dbData.length > 0) {
          mockShareholders = dbData;
        }
        if (circleData && Array.isArray(circleData) && circleData.length > 0) {
          mockCircleDirectory = circleData;
        }
        isDBReady = true;
        return mockShareholders;
      }).catch(() => {
        isDBReady = true;
        return mockShareholders;
      });
    } else {
      isDBReady = true;
      dbInitPromise = Promise.resolve(mockShareholders);
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

    // Circle breakdown
    const cCounts = {};
    mockShareholders.forEach(s => {
      const c = (s.circle || s.circle_name || '').trim() || 'ಇತರೆ (Other)';
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
      if (p) uniquePlaces.add(p.toLowerCase().normalize('NFC'));
      const c = (s.circle || s.circle_name || '').trim();
      if (c) uniqueCircles.add(c.toLowerCase().normalize('NFC'));
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
        place: (data.place || data.village_name || '').normalize('NFC'),
        village_name: (data.place || data.village_name || '').normalize('NFC'),
        village_id: data.village_id || '',
        taluk: (data.taluk || '').normalize('NFC'),
        district: (data.district || '').normalize('NFC'),
        pin_code: data.pin_code || '',
        circle: (data.circle || data.circle_name || '').normalize('NFC'),
        circle_name: (data.circle || data.circle_name || '').normalize('NFC'),
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
      place: (data.place || data.village_name || '').normalize('NFC'),
      village_name: (data.place || data.village_name || '').normalize('NFC'),
      village_id: data.village_id || '',
      taluk: (data.taluk || '').normalize('NFC'),
      district: (data.district || '').normalize('NFC'),
      pin_code: data.pin_code || '',
      circle: (data.circle || data.circle_name || '').normalize('NFC'),
      circle_name: (data.circle || data.circle_name || '').normalize('NFC'),
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

    // 1. Seed from Circle Directory (uploaded address mappings e.g. 26+ places)
    mockCircleDirectory.forEach((cd, idx) => {
      const rawPlace = (cd.address || '').trim().normalize('NFC');
      if (!rawPlace) return;
      const key = rawPlace.toLowerCase();
      placeMap.set(key, {
        village_id: `VIL-${String(idx + 1).padStart(3, '0')}`,
        name: rawPlace,
        taluk: cd.taluk || 'ಇಂಡಿ',
        district: cd.district || 'ವಿಜಯಪುರ',
        circle_name: cd.circle_name || 'ಇಂಡಿ',
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
          taluk: v.taluk || 'ಇಂಡಿ',
          district: v.district || 'ವಿಜಯಪುರ',
          circle_name: v.circle_name || 'ಇಂಡಿ',
          pin_code: v.pin_code || '586 117',
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
        if (s.taluk && (!item.taluk || item.taluk === 'ಇಂಡಿ')) item.taluk = s.taluk.trim();
        if (s.circle && (!item.circle_name || item.circle_name === 'ಇತರೆ')) item.circle_name = s.circle.trim();
        if (s.pin_code && !item.pin_code) item.pin_code = s.pin_code.trim();
      } else {
        placeMap.set(key, {
          village_id: s.village_id || `VIL-${String(placeMap.size + 1).padStart(3, '0')}`,
          name: rawPlace,
          taluk: (s.taluk || 'ಇಂಡಿ').trim().normalize('NFC'),
          district: (s.district || 'ವಿಜಯಪುರ').trim().normalize('NFC'),
          circle_name: (s.circle || s.circle_name || 'ಇತರೆ').trim().normalize('NFC'),
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

    // 1. Seed from Circle Directory (uploaded address & circle mapping)
    mockCircleDirectory.forEach(cd => {
      const cName = (cd.circle_name || 'ಇತರೆ').trim().normalize('NFC');
      const key = cName.toLowerCase();
      if (!circleMap.has(key)) {
        circleMap.set(key, {
          circle_id: `CIR-${String(circleMap.size + 1).padStart(3, '0')}`,
          name: cName,
          description: `${cName} ಆಡಳಿತ ವಲಯ`,
          taluk: cd.taluk || 'ಇಂಡಿ',
          district: cd.district || 'ವಿಜಯಪುರ',
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
      if (cd.taluk && (!cObj.taluk || cObj.taluk === 'ಇಂಡಿ')) cObj.taluk = cd.taluk;
      if (cd.district && (!cObj.district || cObj.district === 'ವಿಜಯಪುರ')) cObj.district = cd.district;
      if (cd.pincode && !cObj.pincode) cObj.pincode = cd.pincode;

      if (!circleVillagesMap.has(key)) {
        circleVillagesMap.set(key, new Set());
      }
      if (cd.address) {
        circleVillagesMap.get(key).add(cd.address.trim().normalize('NFC'));
      }
    });

    // 2. Also seed from master reference circles
    mockCircles.forEach(c => {
      const key = c.name.trim().toLowerCase().normalize('NFC');
      if (!circleMap.has(key)) {
        circleMap.set(key, {
          circle_id: c.circle_id,
          name: c.name.trim().normalize('NFC'),
          description: c.description || '',
          taluk: 'ಇಂಡಿ',
          district: 'ವಿಜಯಪುರ',
          pincode: '',
          circle_in_charge: '',
          contact_no: '',
          villages: [],
          village_count: c.village_count || 0,
          shareholder_count: 0,
          total_shares: 0
        });
      }
    });

    // 3. Dynamically aggregate all unique circles from mockShareholders
    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const rawCircle = (s.circle || s.circle_name || '').trim().normalize('NFC');
      if (!rawCircle) continue;
      const key = rawCircle.toLowerCase();
      const shares = parseInt(s.number_of_shares) || 1;
      const rawPlace = (s.place || s.village_name || '').trim().normalize('NFC');

      if (!circleVillagesMap.has(key)) {
        circleVillagesMap.set(key, new Set());
      }
      if (rawPlace) circleVillagesMap.get(key).add(rawPlace);

      if (circleMap.has(key)) {
        const item = circleMap.get(key);
        item.shareholder_count++;
        item.total_shares += shares;
      } else {
        circleMap.set(key, {
          circle_id: s.circle_id || `CIR-${String(circleMap.size + 1).padStart(3, '0')}`,
          name: rawCircle,
          description: `${rawCircle} ವಲಯ (Zone)`,
          taluk: s.taluk || 'ಇಂಡಿ',
          district: s.district || 'ವಿಜಯಪುರ',
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
      }
    });

    const list = Array.from(circleMap.values())
      .sort((a, b) => b.shareholder_count - a.shareholder_count || b.village_count - a.village_count || a.name.localeCompare(b.name, 'kn'));

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
    return { success: true, data: filtered, total: filtered.length };
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
        taluk: (r.taluk || 'ಇಂಡಿ').trim().normalize('NFC'),
        district: (r.district || 'ವಿಜಯಪುರ').trim().normalize('NFC'),
        pincode: (r.pincode || r.pin_code || '').trim(),
        circle_in_charge: (r.circle_in_charge || r.in_charge || '').trim().normalize('NFC'),
        contact_no: (r.contact_no || r.mobile_no || r.contact || '').trim()
      };
      dirMap.set(key, entry);
    });

    mockCircleDirectory = Array.from(dirMap.values());
    await saveCircleDirectoryToDB(mockCircleDirectory);

    // Auto-enrich shareholders if their circle/taluk/pincode is missing
    let shUpdated = false;
    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const plKey = (s.place || s.village_name || '').trim().toLowerCase().normalize('NFC');
      if (dirMap.has(plKey)) {
        const match = dirMap.get(plKey);
        if (!s.circle || s.circle === 'ಇತರೆ') {
          s.circle = match.circle_name;
          s.circle_name = match.circle_name;
          shUpdated = true;
        }
        if (!s.pin_code && match.pincode) {
          s.pin_code = match.pincode;
          shUpdated = true;
        }
        if ((!s.taluk || s.taluk === 'ಇಂಡಿ') && match.taluk) {
          s.taluk = match.taluk;
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

  async getAuditLogs() {
    const apiRes = await fetchApi('/audit-logs');
    if (apiRes && apiRes.success) return apiRes;

    return {
      success: true,
      data: mockAuditLogs
    };
  }
};
