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
const DB_VERSION = 1;
const STORE_NAME = 'shareholders';

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

async function clearIndexedDB() {
  try {
    const db = await openERPDB();
    if (!db) return;
    const tx = db.transaction([STORE_NAME], 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (e) {}
}

// Circles in Indi / Chadchan / Vijayapura Region (Geographic Master)
export const mockCircles = [
  { circle_id: 'CIR-001', name: 'ಇಂಡಿ (Indi Circle)', description: 'Indi Central Cane Zone', village_count: 8, shareholder_count: 0, total_shares: 0 },
  { circle_id: 'CIR-002', name: 'ಚಡಚಣ (Chadchan Circle)', description: 'Chadchan Sugar Basin Zone', village_count: 7, shareholder_count: 0, total_shares: 0 },
  { circle_id: 'CIR-003', name: 'ಬಳ್ಳೊಳ್ಳಿ (Ballolli Circle)', description: 'Ballolli Sugarcane Belt', village_count: 6, shareholder_count: 0, total_shares: 0 },
  { circle_id: 'CIR-004', name: 'ಅಥರ್ಗಾ (Atharga Circle)', description: 'Atharga Agricultural Division', village_count: 6, shareholder_count: 0, total_shares: 0 },
  { circle_id: 'CIR-005', name: 'ಹೊರ್ತಿ (Horti Circle)', description: 'Horti Irrigated Basin', village_count: 6, shareholder_count: 0, total_shares: 0 },
  { circle_id: 'CIR-006', name: 'ಲಚ್ಯಾಣ (Lachyan Circle)', description: 'Lachyan Railway Belt', village_count: 6, shareholder_count: 0, total_shares: 0 },
  { circle_id: 'CIR-007', name: 'ಸಾಲೋಟಗಿ (Salotgi Circle)', description: 'Salotgi Historical Zone', village_count: 6, shareholder_count: 0, total_shares: 0 },
  { circle_id: 'CIR-008', name: 'ಹಲಸಂಗಿ (Halasangi Circle)', description: 'Halasangi Border Belt', village_count: 5, shareholder_count: 0, total_shares: 0 }
];

// Villages / Places in Vijayapura District (Geographic Master)
export const placesList = [
  { name: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', circle: 'ಬಳ್ಳೊಳ್ಳಿ (Ballolli Circle)', pin: '586 117' },
  { name: 'ಜೇವೂರ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' },
  { name: 'ಚಡಚಣ', taluk: 'ಚಡಚಣ', circle: 'ಚಡಚಣ (Chadchan Circle)', pin: '586 205' },
  { name: 'ಅಥರ್ಗಾ', taluk: 'ಇಂಡಿ', circle: 'ಅಥರ್ಗಾ (Atharga Circle)', pin: '586 112' },
  { name: 'ಹಿರೇಬೇವನೂರ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' },
  { name: 'ಲೋಣಿ ಬಿ.ಕೆ.', taluk: 'ಇಂಡಿ', circle: 'ಬಳ್ಳೊಳ್ಳಿ (Ballolli Circle)', pin: '586 211' },
  { name: 'ತಡವಲಗಾ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 211' },
  { name: 'ಅಂಜುಟಗಿ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' },
  { name: 'ಹೊರ್ತಿ', taluk: 'ಇಂಡಿ', circle: 'ಹೊರ್ತಿ (Horti Circle)', pin: '586 117' },
  { name: 'ಲಚ್ಯಾಣ', taluk: 'ಇಂಡಿ', circle: 'ಲಚ್ಯಾಣ (Lachyan Circle)', pin: '586 211' },
  { name: 'ಸಾಲೋಟಗಿ', taluk: 'ಇಂಡಿ', circle: 'ಸಾಲೋಟಗಿ (Salotgi Circle)', pin: '586 217' },
  { name: 'ನಿಂಬಾಳ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 211' },
  { name: 'ಶಿರಾಡೋಣ', taluk: 'ಚಡಚಣ', circle: 'ಚಡಚಣ (Chadchan Circle)', pin: '586 205' },
  { name: 'ಹಲಸಂಗಿ', taluk: 'ಚಡಚಣ', circle: 'ಹಲಸಂಗಿ (Halasangi Circle)', pin: '586 205' },
  { name: 'ಧೂಳಖೇಡ', taluk: 'ಚಡಚಣ', circle: 'ಚಡಚಣ (Chadchan Circle)', pin: '586 205' },
  { name: 'ಉಮರಾಣಿ', taluk: 'ಚಡಚಣ', circle: 'ಚಡಚಣ (Chadchan Circle)', pin: '586 205' },
  { name: 'ರೋಡಗಿ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' },
  { name: 'ತಮದಡ್ಡಿ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' },
  { name: 'ದೇವರ ನಿಂಬರಗಿ', taluk: 'ಚಡಚಣ', circle: 'ಚಡಚಣ (Chadchan Circle)', pin: '586 205' },
  { name: 'ಇಂಡಿ ಗ್ರಾಮೀಣ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' }
];

export const mockVillages = placesList.map((p, idx) => ({
  village_id: `VIL-${String(idx + 1).padStart(3, '0')}`,
  name: p.name,
  taluk: p.taluk,
  district: 'ವಿಜಯಪುರ',
  circle_name: p.circle,
  circle_id: `CIR-${String((idx % 8) + 1).padStart(3, '0')}`,
  pin_code: p.pin,
  status: 'Active',
  shareholder_count: 0,
  total_shares: 0
}));

// Real Live Datasets (Initialized as clean empty arrays - zero mock records)
let mockShareholders = loadStoredData(STORAGE_KEY_SH, []);
let isDBReady = false;
let dbInitPromise = null;

export function ensureDBReady() {
  if (isDBReady) return Promise.resolve(mockShareholders);
  if (!dbInitPromise) {
    if (typeof window !== 'undefined' && window.indexedDB) {
      dbInitPromise = loadFromIndexedDB().then((dbData) => {
        if (dbData && dbData.length > 0) {
          mockShareholders = dbData;
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
      const v = s.place || s.village_name || 'ಇತರೆ (Other)';
      vCounts[v] = (vCounts[v] || 0) + 1;
    });
    const shareholdersByVillage = Object.keys(vCounts).map(v => ({ village_name: v, total: vCounts[v] })).slice(0, 10);

    // Circle breakdown
    const cCounts = {};
    mockShareholders.forEach(s => {
      const c = s.circle || s.circle_name || 'ಇತರೆ (Other)';
      cCounts[c] = (cCounts[c] || 0) + 1;
    });
    const shareholdersByCircle = Object.keys(cCounts).map(c => ({ circle_name: c, total: cCounts[c] }));

    return {
      success: true,
      stats: {
        totalShareholders: mockShareholders.length,
        activeShareholders: mockShareholders.filter(s => s.status === 'Active').length,
        inactiveShareholders: mockShareholders.filter(s => s.status === 'Inactive').length,
        totalShares: mockShareholders.reduce((acc, s) => acc + (parseInt(s.number_of_shares) || 1), 0),
        totalVillages: mockVillages.length,
        totalCircles: mockCircles.length,
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

  async getShareholders({ page = 1, limit = 20, search = '', village_id = '', circle_id = '', status = '', book_no = '' }) {
    await ensureDBReady();
    const apiRes = await fetchApi(`/shareholders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&village_id=${village_id}&circle_id=${circle_id}&status=${status}&book_no=${book_no}`);
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
      filtered = filtered.filter(s => s.village_id === village_id || s.place === village_id);
    }
    if (circle_id) {
      filtered = filtered.filter(s => s.circle_id === circle_id || s.circle === circle_id);
    }
    if (status) {
      filtered = filtered.filter(s => s.status === status);
    }
    if (book_no) {
      filtered = filtered.filter(s => s.book_no === book_no);
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
        place: (data.place || 'ಬಳ್ಳೊಳ್ಳಿ').normalize('NFC'),
        village_name: (data.place || 'ಬಳ್ಳೊಳ್ಳಿ').normalize('NFC'),
        village_id: data.village_id || 'VIL-001',
        taluk: (data.taluk || 'ಇಂಡಿ').normalize('NFC'),
        district: (data.district || 'ವಿಜಯಪುರ').normalize('NFC'),
        pin_code: data.pin_code || '586 117',
        circle: (data.circle || 'ಇಂಡಿ').normalize('NFC'),
        circle_name: (data.circle || 'ಇಂಡಿ').normalize('NFC'),
        circle_id: data.circle_id || 'CIR-001',
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
      place: (data.place || 'ಬಳ್ಳೊಳ್ಳಿ').normalize('NFC'),
      village_name: (data.place || 'ಬಳ್ಳೊಳ್ಳಿ').normalize('NFC'),
      village_id: data.village_id || 'VIL-001',
      taluk: (data.taluk || 'ಇಂಡಿ').normalize('NFC'),
      district: (data.district || 'ವಿಜಯಪುರ').normalize('NFC'),
      pin_code: data.pin_code || '586 117',
      circle: (data.circle || 'ಇಂಡಿ').normalize('NFC'),
      circle_name: (data.circle || 'ಇಂಡಿ').normalize('NFC'),
      circle_id: data.circle_id || 'CIR-001',
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
    await clearIndexedDB();
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
    mockTransactions = [];
    mockSugarAllotments = [];
    mockVarasaTransfers = [];
    mockEmployees = [];
    mockAuditLogs = [];
    saveStoredData(STORAGE_KEY_SH, []);
    saveStoredData(STORAGE_KEY_TX, []);
    saveStoredData(STORAGE_KEY_SA, []);
    saveStoredData(STORAGE_KEY_VT, []);
    saveStoredData(STORAGE_KEY_EMP, []);
    saveStoredData(STORAGE_KEY_LOGS, []);
    await clearIndexedDB();
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

    const list = mockVillages.map(v => {
      const shInVillage = mockShareholders.filter(s => s.village_id === v.village_id || s.place === v.name);
      return {
        ...v,
        shareholder_count: shInVillage.length,
        total_shares: shInVillage.reduce((acc, s) => acc + (parseInt(s.number_of_shares) || 1), 0)
      };
    });
    return { success: true, data: list };
  },

  async getCircles() {
    await ensureDBReady();
    const apiRes = await fetchApi('/circles');
    if (apiRes && apiRes.success) return apiRes;

    const list = mockCircles.map(c => {
      const shInCircle = mockShareholders.filter(s => s.circle_id === c.circle_id || s.circle === c.name || (s.circle && s.circle.includes(c.name.split(' ')[0])));
      return {
        ...c,
        shareholder_count: shInCircle.length,
        total_shares: shInCircle.reduce((acc, s) => acc + (parseInt(s.number_of_shares) || 1), 0)
      };
    });
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
