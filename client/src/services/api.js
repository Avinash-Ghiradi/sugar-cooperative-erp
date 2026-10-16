// Data Service Layer supporting both backend REST API and standalone fallback dataset

const API_BASE = '/api';

// -------------------------------------------------------------
// STANDALONE SEEDED DATA ENGINE (17,250 RECORDS GENERATOR)
// -------------------------------------------------------------
let mockShareholders = [];
let mockVillages = [];
let mockCircles = [];
let mockTransactions = [];
let mockSugarAllotments = [];
let mockVarasaTransfers = [];
let mockEmployees = [];
let mockAuditLogs = [];

function generateMockDataset() {
  if (mockShareholders.length > 0) return;

  console.log('⚡ Initializing high-performance client dataset (17,250 shareholders)...');

  // Circles
  mockCircles = [
    { circle_id: 'CIR-001', name: 'Central Sugar Circle', description: 'Main Mill Zone', village_count: 7, shareholder_count: 2450, total_shares: 12250 },
    { circle_id: 'CIR-002', name: 'North River Cane Circle', description: 'Krishna River Irrigation', village_count: 6, shareholder_count: 2100, total_shares: 10500 },
    { circle_id: 'CIR-003', name: 'South Plantation Circle', description: 'High Yield Sugarcane Belt', village_count: 7, shareholder_count: 2300, total_shares: 11500 },
    { circle_id: 'CIR-004', name: 'East Cooperative Circle', description: 'Eastern Agricultural Division', village_count: 6, shareholder_count: 2200, total_shares: 11000 },
    { circle_id: 'CIR-005', name: 'West Valley Circle', description: 'Western Farmer Collective', village_count: 6, shareholder_count: 2150, total_shares: 10750 },
    { circle_id: 'CIR-006', name: 'Panchganga Basin Circle', description: 'Riverbank Irrigation Zone', village_count: 6, shareholder_count: 2000, total_shares: 10000 },
    { circle_id: 'CIR-007', name: 'Sahyadri Foothills Circle', description: 'Upland Sugarcane Farms', village_count: 6, shareholder_count: 2050, total_shares: 10250 },
    { circle_id: 'CIR-008', name: 'Industrial Bypass Circle', description: 'Bypass Expansion Zone', village_count: 6, shareholder_count: 2000, total_shares: 10000 }
  ];

  // Villages
  const vNames = ['Shirol', 'Jaysingpur', 'Hatkanangule', 'Ichalkaranji', 'Kagal', 'Radhanagari', 'Bhudargad', 'Ajara', 'Chandgad', 'Shahuwadi', 'Karveer', 'Gadhinklaj', 'Bawda', 'Paldewadi', 'Nipani', 'Chikodi', 'Raybag', 'Sankeshwar', 'Kudachi', 'Miraj', 'Jath', 'Tasgaon', 'Shirala', 'Walwa', 'Kadegaon'];
  mockVillages = vNames.map((v, idx) => ({
    village_id: `VIL-${String(idx + 1).padStart(3, '0')}`,
    name: v,
    circle_id: mockCircles[idx % mockCircles.length].circle_id,
    circle_name: mockCircles[idx % mockCircles.length].name,
    status: 'Active',
    shareholder_count: 690,
    total_shares: 3450
  }));

  // Shareholders
  const firstNames = ['Rajaram', 'Dattatray', 'Anandrao', 'Shivaji', 'Ganpatrao', 'Babasaheb', 'Pandurang', 'Suresh', 'Maruti', 'Yashwant', 'Bhimrao', 'Subhash', 'Chandrakant', 'Tukaram', 'Ganesh', 'Balasaheb', 'Sunil', 'Vijay', 'Deepak', 'Sanjay'];
  const lastNames = ['Patil', 'Deshmukh', 'Shinde', 'Jadhav', 'Kadam', 'Pawar', 'Chavan', 'Gaekwad', 'Mane', 'More', 'Suryavanshi', 'Thorat', 'Bhosale', 'Kulkarni', 'Naik', 'Mohite', 'Nimbalkar'];

  const TOTAL = 17250;
  for (let i = 1; i <= TOTAL; i++) {
    const shId = `SH-${String(i).padStart(5, '0')}`;
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const vObj = mockVillages[i % mockVillages.length];
    const shares = i % 10 === 0 ? 25 : i % 5 === 0 ? 10 : 5;

    mockShareholders.push({
      id: i,
      shareholder_id: shId,
      name: `${fn} ${ln}`,
      father_husband_name: `${firstNames[(i + 2) % firstNames.length]} ${ln}`,
      dob: `197${i % 10}-05-15`,
      gender: i % 15 === 0 ? 'Female' : 'Male',
      mobile: `9822${String(100000 + (i % 900000))}`,
      address: `House No. ${i % 300 + 1}, ${vObj.name} Gaon`,
      village_id: vObj.village_id,
      village_name: vObj.name,
      circle_id: vObj.circle_id,
      circle_name: vObj.circle_name,
      share_number: `SN-${String(100000 + i)}`,
      number_of_shares: shares,
      share_value: shares * 100,
      status: i % 40 === 0 ? 'Inactive' : 'Active',
      registration_date: `${2005 + (i % 18)}-0${(i % 9) + 1}-12`,
      aadhaar_ref: `ABCD${String(10000 + i)}1234`,
      remarks: 'Registered Shareholder Member'
    });

    if (i <= 500 && i % 4 === 0) {
      mockTransactions.push({
        id: i,
        transaction_id: `TX-${100000 + i}`,
        shareholder_id: shId,
        shareholder_name: `${fn} ${ln}`,
        date: `2025-0${(i % 8) + 1}-10`,
        type: 'Purchase',
        share_number: `SN-${String(100000 + i)}`,
        number_of_shares: shares,
        amount: shares * 100,
        tx_kind: 'Credit',
        reference_no: `REF-${i * 88}`,
        payment_mode: 'Bank Transfer',
        remarks: 'Share Subscription Deposit',
        entered_by: 'cashier'
      });
    }

    if (i <= 300 && i % 3 === 0) {
      const qty = shares * 15;
      mockSugarAllotments.push({
        id: i,
        allotment_id: `SA-${10000 + i}`,
        shareholder_id: shId,
        shareholder_name: `${fn} ${ln}`,
        share_number: `SN-${String(100000 + i)}`,
        number_of_shares: shares,
        village_name: vObj.name,
        circle_name: vObj.circle_name,
        allotment_date: '2025-10-01',
        sugar_quantity_kg: qty,
        sugar_type: 'M30 Grade White Sugar',
        allotment_period: 'Season 2025-2026',
        issued_quantity_kg: qty / 2,
        remaining_quantity_kg: qty / 2,
        status: 'Partially Issued',
        remarks: 'Annual Member Sugar Issue',
        entered_by: 'operator'
      });
    }
  }

  // Varasa Transfers
  for (let j = 1; j <= 50; j++) {
    const sh = mockShareholders[j * 20];
    mockVarasaTransfers.push({
      id: j,
      transfer_id: `VAR-${1000 + j}`,
      existing_shareholder_id: sh.shareholder_id,
      existing_shareholder_name: sh.name,
      existing_share_number: sh.share_number,
      existing_shares: sh.number_of_shares,
      heir_name: `Legal Heir of ${sh.name}`,
      heir_relationship: j % 2 === 0 ? 'Son' : 'Wife',
      heir_mobile: `9821${String(500000 + j)}`,
      heir_address: sh.address,
      heir_village_id: sh.village_id,
      heir_circle_id: sh.circle_id,
      village_name: sh.village_name,
      circle_name: sh.circle_name,
      application_date: `2025-11-${String((j % 25) + 1).padStart(2, '0')}`,
      approval_status: j % 5 === 0 ? 'Completed' : j % 3 === 0 ? 'Approved' : 'Under Verification',
      documents_verified: 'Verified',
      remarks: 'Death Certificate & Legal Heir Affidavit attached',
      processed_by: 'operator'
    });
  }

  // Employees
  for (let e = 1; e <= 20; e++) {
    mockEmployees.push({
      id: e,
      employee_id: `EMP-${String(e).padStart(3, '0')}`,
      name: `Employee Staff ${e}`,
      designation: e % 2 === 0 ? 'Field Inspector' : 'Cooperative Accountant',
      department: e % 3 === 0 ? 'Finance' : 'Cane Procurement',
      mobile: `982200112${e}`,
      address: `Staff Quarters ${e}`,
      joining_date: '2021-04-01',
      status: 'Active',
      role: 'Employee'
    });
  }

  console.log('✅ Client dataset ready!');
}

generateMockDataset();

// Helper API execution with auto backend failover
async function fetchApi(endpoint, options = {}) {
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
    const apiRes = await fetchApi('/dashboard/stats');
    if (apiRes && apiRes.success) return apiRes;

    return {
      success: true,
      stats: {
        totalShareholders: mockShareholders.length,
        activeShareholders: mockShareholders.filter(s => s.status === 'Active').length,
        inactiveShareholders: mockShareholders.filter(s => s.status === 'Inactive').length,
        totalShares: mockShareholders.reduce((acc, s) => acc + s.number_of_shares, 0),
        totalVillages: mockVillages.length,
        totalCircles: mockCircles.length,
        pendingVarasa: mockVarasaTransfers.filter(v => v.approval_status !== 'Completed').length,
        completedVarasa: mockVarasaTransfers.filter(v => v.approval_status === 'Completed').length,
        todayTx: mockTransactions.length,
        todayAttendance: 48,
        totalSugarAlloted: 258750,
        totalEmployees: mockEmployees.length
      },
      charts: {
        shareholdersByVillage: mockVillages.slice(0, 8).map(v => ({ village_name: v.name, total: v.shareholder_count })),
        shareholdersByCircle: mockCircles.map(c => ({ circle_name: c.name, total: c.shareholder_count })),
        shareRange: [
          { range: '1-2 Shares', count: 4200 },
          { range: '3-5 Shares', count: 8500 },
          { range: '6-10 Shares', count: 3200 },
          { range: '11+ Shares', count: 1350 }
        ],
        varasaStatusBreakdown: [
          { status: 'Application Received', count: 12 },
          { status: 'Under Verification', count: 18 },
          { status: 'Approved', count: 10 },
          { status: 'Completed', count: 10 }
        ]
      }
    };
  },

  async getShareholders({ page = 1, limit = 20, search = '', village_id = '', circle_id = '', status = '' }) {
    const apiRes = await fetchApi(`/shareholders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&village_id=${village_id}&circle_id=${circle_id}&status=${status}`);
    if (apiRes && apiRes.success) return apiRes;

    let filtered = mockShareholders;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.shareholder_id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.share_number.toLowerCase().includes(q) ||
        s.mobile.includes(q) ||
        s.village_name.toLowerCase().includes(q)
      );
    }
    if (village_id) filtered = filtered.filter(s => s.village_id === village_id);
    if (circle_id) filtered = filtered.filter(s => s.circle_id === circle_id);
    if (status) filtered = filtered.filter(s => s.status === status);

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getShareholderById(id) {
    const apiRes = await fetchApi(`/shareholders/${id}`);
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === id || s.id === parseInt(id));
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
        attendance: [
          { date: '2025-10-15', status: 'Present', correction_remarks: 'Annual General Body Meeting' }
        ]
      }
    };
  },

  async addShareholder(data) {
    const apiRes = await fetchApi('/shareholders', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const vObj = mockVillages.find(v => v.village_id === data.village_id) || mockVillages[0];
    const newSh = {
      id: mockShareholders.length + 1,
      ...data,
      village_name: vObj.name,
      circle_name: vObj.circle_name,
      share_value: (data.number_of_shares || 1) * 100
    };
    mockShareholders.unshift(newSh);
    return { success: true, shareholder_id: data.shareholder_id };
  },

  async getTransactions({ page = 1, limit = 20, search = '' }) {
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
      pagination: { total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit) }
    };
  },

  async addTransaction(data) {
    const apiRes = await fetchApi('/transactions', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === data.shareholder_id);
    const newTx = {
      id: mockTransactions.length + 1,
      transaction_id: `TX-${Date.now()}`,
      ...data,
      shareholder_name: sh ? sh.name : 'Shareholder',
      date: new Date().toISOString()
    };
    mockTransactions.unshift(newTx);
    return { success: true, transaction_id: newTx.transaction_id };
  },

  async getSugarAllotments({ page = 1, limit = 20, search = '' }) {
    const apiRes = await fetchApi(`/sugar-allotment?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    if (apiRes && apiRes.success) return apiRes;

    return {
      success: true,
      data: mockSugarAllotments.slice((page - 1) * limit, page * limit),
      pagination: { total: mockSugarAllotments.length, page, limit, totalPages: Math.ceil(mockSugarAllotments.length / limit) }
    };
  },

  async addSugarAllotment(data) {
    const apiRes = await fetchApi('/sugar-allotment', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === data.shareholder_id);
    const newSa = {
      id: mockSugarAllotments.length + 1,
      allotment_id: `SA-${Date.now()}`,
      ...data,
      shareholder_name: sh ? sh.name : 'Shareholder',
      share_number: sh ? sh.share_number : 'SN-1000',
      village_name: sh ? sh.village_name : 'Gaon',
      remaining_quantity_kg: data.sugar_quantity_kg - (data.issued_quantity_kg || 0)
    };
    mockSugarAllotments.unshift(newSa);
    return { success: true, allotment_id: newSa.allotment_id };
  },

  async getVarasaTransfers() {
    const apiRes = await fetchApi('/varasa');
    if (apiRes && apiRes.success) return apiRes;

    return { success: true, data: mockVarasaTransfers };
  },

  async addVarasaTransfer(data) {
    const apiRes = await fetchApi('/varasa', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === data.existing_shareholder_id);
    const newV = {
      id: mockVarasaTransfers.length + 1,
      transfer_id: `VAR-${Date.now()}`,
      ...data,
      existing_shareholder_name: sh ? sh.name : 'Existing Member',
      approval_status: 'Application Received',
      documents_verified: 'Pending'
    };
    mockVarasaTransfers.unshift(newV);
    return { success: true, transfer_id: newV.transfer_id };
  },

  async updateVarasaStatus(transfer_id, approval_status) {
    const apiRes = await fetchApi(`/varasa/${transfer_id}/status`, { method: 'PUT', body: JSON.stringify({ approval_status }) });
    if (apiRes && apiRes.success) return apiRes;

    const item = mockVarasaTransfers.find(v => v.transfer_id === transfer_id);
    if (item) item.approval_status = approval_status;
    return { success: true };
  },

  async getVillages() {
    const apiRes = await fetchApi('/villages');
    if (apiRes && apiRes.success) return apiRes;

    return { success: true, data: mockVillages };
  },

  async getCircles() {
    const apiRes = await fetchApi('/circles');
    if (apiRes && apiRes.success) return apiRes;

    return { success: true, data: mockCircles };
  },

  async getEmployees() {
    const apiRes = await fetchApi('/employees');
    if (apiRes && apiRes.success) return apiRes;

    return { success: true, data: mockEmployees };
  },

  async getAuditLogs() {
    const apiRes = await fetchApi('/audit-logs');
    if (apiRes && apiRes.success) return apiRes;

    return {
      success: true,
      data: [
        { id: 1, username: 'admin', role: 'Admin', module: 'Shareholder', action: 'CREATE', record_id: 'SH-00001', timestamp: '2026-09-03 10:15:00' },
        { id: 2, username: 'cashier', role: 'Cashier', module: 'Transactions', action: 'DEPOSIT', record_id: 'TX-100045', timestamp: '2026-09-03 11:30:00' },
        { id: 3, username: 'operator', role: 'Computer Operator', module: 'SugarAllotment', action: 'ISSUE', record_id: 'SA-10044', timestamp: '2026-09-03 12:45:00' }
      ]
    };
  }
};
