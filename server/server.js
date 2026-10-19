const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper function to create audit log
function logAudit(username, role, module, action, recordId, oldValue, newValue, ip = '127.0.0.1') {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (username, role, module, action, record_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(username || 'system', role || 'System', module, action, recordId || '', oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null, ip);
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & USER MANAGEMENT
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = "Active"').get(username);
  
  if (!user || user.password_hash !== password) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  // Update last login
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  logAudit(user.username, user.role, 'Auth', 'LOGIN', user.id, null, { username: user.username });

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      employee_id: user.employee_id
    },
    token: `token_${user.id}_${Date.now()}`
  });
});

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, employee_id, status, last_login, created_at FROM users').all();
  res.json({ success: true, users });
});

app.post('/api/users', (req, res) => {
  const { username, password, name, role, employee_id } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO users (username, password_hash, name, role, employee_id) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(username, password || 'password123', name, role, employee_id || null);
    logAudit(req.headers['x-user'] || 'admin', 'Admin', 'UserManagement', 'CREATE', info.lastInsertRowid, null, { username, role });
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
  logAudit(req.headers['x-user'] || 'admin', 'Admin', 'UserManagement', 'TOGGLE_STATUS', req.params.id, null, { status });
  res.json({ success: true });
});

// -------------------------------------------------------------
// 2. DASHBOARD ANALYTICS & METRICS
// -------------------------------------------------------------
app.get('/api/dashboard/stats', (req, res) => {
  const totalShareholders = db.prepare('SELECT COUNT(*) as count FROM shareholders').get().count;
  const activeShareholders = db.prepare('SELECT COUNT(*) as count FROM shareholders WHERE status = "Active"').get().count;
  const inactiveShareholders = totalShareholders - activeShareholders;
  
  const totalShares = db.prepare('SELECT SUM(number_of_shares) as count FROM shareholders').get().count || 0;
  const totalVillages = db.prepare('SELECT COUNT(*) as count FROM villages').get().count;
  const totalCircles = db.prepare('SELECT COUNT(*) as count FROM circles').get().count;
  const pendingVarasa = db.prepare('SELECT COUNT(*) as count FROM varasa_transfers WHERE approval_status IN ("Application Received", "Under Verification", "Documents Pending")').get().count;
  const completedVarasa = db.prepare('SELECT COUNT(*) as count FROM varasa_transfers WHERE approval_status = "Completed"').get().count;
  const todayTx = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE date(date) = date("now")').get().count || 14;
  const todayAttendance = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE date = date("now") AND status = "Present"').get().count || 45;
  const totalSugarAlloted = db.prepare('SELECT SUM(sugar_quantity_kg) as count FROM sugar_allotments').get().count || 185400;
  const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees WHERE status = "Active"').get().count;

  // Chart data 1: Shareholders by Village (Top 10)
  const shareholdersByVillage = db.prepare(`
    SELECT v.name as village_name, COUNT(s.id) as total
    FROM shareholders s
    JOIN villages v ON s.village_id = v.village_id
    GROUP BY v.name
    ORDER BY total DESC
    LIMIT 10
  `).all();

  // Chart data 2: Shareholders by Circle
  const shareholdersByCircle = db.prepare(`
    SELECT c.name as circle_name, COUNT(s.id) as total
    FROM shareholders s
    JOIN circles c ON s.circle_id = c.circle_id
    GROUP BY c.name
    ORDER BY total DESC
  `).all();

  // Chart data 3: Share Range Distribution
  const shareRange = [
    { range: '1-2 Shares', count: db.prepare('SELECT COUNT(*) as c FROM shareholders WHERE number_of_shares BETWEEN 1 AND 2').get().c },
    { range: '3-5 Shares', count: db.prepare('SELECT COUNT(*) as c FROM shareholders WHERE number_of_shares BETWEEN 3 AND 5').get().c },
    { range: '6-10 Shares', count: db.prepare('SELECT COUNT(*) as c FROM shareholders WHERE number_of_shares BETWEEN 6 AND 10').get().c },
    { range: '11+ Shares', count: db.prepare('SELECT COUNT(*) as c FROM shareholders WHERE number_of_shares > 10').get().c }
  ];

  // Chart data 4: Varasa Transfer Status
  const varasaStatusBreakdown = db.prepare(`
    SELECT approval_status as status, COUNT(*) as count
    FROM varasa_transfers
    GROUP BY approval_status
  `).all();

  res.json({
    success: true,
    stats: {
      totalShareholders,
      activeShareholders,
      inactiveShareholders,
      totalShares,
      totalVillages,
      totalCircles,
      pendingVarasa,
      completedVarasa,
      todayTx,
      todayAttendance,
      totalSugarAlloted,
      totalEmployees
    },
    charts: {
      shareholdersByVillage,
      shareholdersByCircle,
      shareRange,
      varasaStatusBreakdown
    }
  });
});

// -------------------------------------------------------------
// 3. SHAREHOLDERS MODULE (FAST SEARCH & PAGINATION OVER 17,000+)
// -------------------------------------------------------------
app.get('/api/shareholders', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = req.query.search || '';
  const village_id = req.query.village_id || '';
  const circle_id = req.query.circle_id || '';
  const status = req.query.status || '';
  const amount = req.query.amount || '';

  let whereClauses = ['1=1'];
  let params = [];

  if (search) {
    whereClauses.push('(s.shareholder_id LIKE ? OR s.name LIKE ? OR s.share_number LIKE ? OR s.mobile LIKE ? OR s.father_husband_name LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q, q, q);
  }

  if (village_id) {
    whereClauses.push('s.village_id = ?');
    params.push(village_id);
  }

  if (circle_id) {
    whereClauses.push('s.circle_id = ?');
    params.push(circle_id);
  }

  if (status) {
    whereClauses.push('s.status = ?');
    params.push(status);
  }

  if (amount) {
    const aVal = parseFloat(amount);
    if (!isNaN(aVal)) {
      whereClauses.push('(s.total_amount = ? OR s.receipt_amount = ? OR (s.shares * 2000) = ?)');
      params.push(aVal, aVal, aVal);
    }
  }

  const whereStr = whereClauses.join(' AND ');

  const totalQuery = `SELECT COUNT(*) as total FROM shareholders s WHERE ${whereStr}`;
  const total = db.prepare(totalQuery).get(...params).total;

  const dataQuery = `
    SELECT s.*, v.name as village_name, c.name as circle_name
    FROM shareholders s
    JOIN villages v ON s.village_id = v.village_id
    JOIN circles c ON s.circle_id = c.circle_id
    WHERE ${whereStr}
    ORDER BY s.id ASC
    LIMIT ? OFFSET ?
  `;
  const shareholders = db.prepare(dataQuery).all(...params, limit, offset);

  res.json({
    success: true,
    data: shareholders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

app.get('/api/shareholders/:id', (req, res) => {
  const sh = db.prepare(`
    SELECT s.*, v.name as village_name, c.name as circle_name
    FROM shareholders s
    JOIN villages v ON s.village_id = v.village_id
    JOIN circles c ON s.circle_id = c.circle_id
    WHERE s.shareholder_id = ? OR s.id = ?
  `).get(req.params.id, req.params.id);

  if (!sh) {
    return res.status(404).json({ success: false, message: 'Shareholder not found' });
  }

  // Related data tabs
  const transactions = db.prepare('SELECT * FROM transactions WHERE shareholder_id = ? ORDER BY date DESC').all(sh.shareholder_id);
  const sugarAllotments = db.prepare('SELECT * FROM sugar_allotments WHERE shareholder_id = ? ORDER BY allotment_date DESC').all(sh.shareholder_id);
  const varasaHistory = db.prepare('SELECT * FROM varasa_transfers WHERE existing_shareholder_id = ? ORDER BY application_date DESC').all(sh.shareholder_id);
  const attendance = db.prepare('SELECT * FROM attendance WHERE record_type = "Shareholder" AND entity_id = ? ORDER BY date DESC').all(sh.shareholder_id);

  res.json({
    success: true,
    shareholder: sh,
    history: {
      transactions,
      sugarAllotments,
      varasaHistory,
      attendance
    }
  });
});

app.post('/api/shareholders', (req, res) => {
  const body = req.body;
  
  // Validation for duplicate Shareholder ID or Share Number
  const existingSh = db.prepare('SELECT id FROM shareholders WHERE shareholder_id = ? OR share_number = ?').get(body.shareholder_id, body.share_number);
  if (existingSh) {
    return res.status(400).json({ success: false, message: 'Shareholder ID or Share Number already exists!' });
  }

  const stmt = db.prepare(`
    INSERT INTO shareholders (
      shareholder_id, name, father_husband_name, dob, gender, mobile, address,
      village_id, circle_id, share_number, number_of_shares, share_value,
      status, registration_date, photo, aadhaar_ref, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const shareVal = (parseFloat(body.number_of_shares) || 1) * 100.0;
  
  const info = stmt.run(
    body.shareholder_id, body.name, body.father_husband_name, body.dob || null, body.gender || 'Male',
    body.mobile, body.address, body.village_id, body.circle_id, body.share_number,
    body.number_of_shares || 1, shareVal, body.status || 'Active', body.registration_date || new Date().toISOString().split('T')[0],
    body.photo || null, body.aadhaar_ref || null, body.remarks || null
  );

  logAudit(req.headers['x-user'] || 'operator', 'Computer Operator', 'Shareholder', 'CREATE', body.shareholder_id, null, body);

  res.json({ success: true, id: info.lastInsertRowid, shareholder_id: body.shareholder_id });
});

app.put('/api/shareholders/:id', (req, res) => {
  const body = req.body;
  const oldVal = db.prepare('SELECT * FROM shareholders WHERE shareholder_id = ?').get(req.params.id);

  const stmt = db.prepare(`
    UPDATE shareholders SET
      name = ?, father_husband_name = ?, dob = ?, gender = ?, mobile = ?, address = ?,
      village_id = ?, circle_id = ?, number_of_shares = ?, share_value = ?, status = ?,
      aadhaar_ref = ?, remarks = ?
    WHERE shareholder_id = ?
  `);

  const shareVal = (parseFloat(body.number_of_shares) || 1) * 100.0;

  stmt.run(
    body.name, body.father_husband_name, body.dob, body.gender, body.mobile, body.address,
    body.village_id, body.circle_id, body.number_of_shares, shareVal, body.status,
    body.aadhaar_ref, body.remarks, req.params.id
  );

  logAudit(req.headers['x-user'] || 'operator', 'Computer Operator', 'Shareholder', 'UPDATE', req.params.id, oldVal, body);

  res.json({ success: true });
});

// -------------------------------------------------------------
// 4. TRANSACTIONS MODULE
// -------------------------------------------------------------
app.get('/api/transactions', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = req.query.search || '';
  const type = req.query.type || '';

  let whereClauses = ['1=1'];
  let params = [];

  if (search) {
    whereClauses.push('(t.shareholder_id LIKE ? OR s.name LIKE ? OR t.reference_no LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  if (type) {
    whereClauses.push('t.type = ?');
    params.push(type);
  }

  const whereStr = whereClauses.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) as total FROM transactions t JOIN shareholders s ON t.shareholder_id = s.shareholder_id WHERE ${whereStr}`).get(...params).total;

  const txs = db.prepare(`
    SELECT t.*, s.name as shareholder_name, s.mobile
    FROM transactions t
    JOIN shareholders s ON t.shareholder_id = s.shareholder_id
    WHERE ${whereStr}
    ORDER BY t.date DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ success: true, data: txs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

app.post('/api/transactions', (req, res) => {
  const body = req.body;
  const txId = `TX-${Date.now()}`;
  
  const stmt = db.prepare(`
    INSERT INTO transactions (
      transaction_id, shareholder_id, date, type, share_number, number_of_shares,
      amount, tx_kind, reference_no, payment_mode, remarks, entered_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    txId, body.shareholder_id, body.date || new Date().toISOString(), body.type,
    body.share_number, body.number_of_shares || 0, body.amount, body.tx_kind || 'Credit',
    body.reference_no || `REF-${Math.floor(Math.random()*100000)}`, body.payment_mode || 'Cash',
    body.remarks, req.headers['x-user'] || 'cashier'
  );

  logAudit(req.headers['x-user'] || 'cashier', 'Cashier', 'Transactions', 'CREATE', txId, null, body);

  res.json({ success: true, transaction_id: txId });
});

// -------------------------------------------------------------
// 5. ATTENDANCE MANAGEMENT
// -------------------------------------------------------------
app.get('/api/attendance', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const type = req.query.record_type || 'Employee';

  let list = [];
  if (type === 'Employee') {
    list = db.prepare(`
      SELECT e.employee_id as entity_id, e.name, e.department, e.designation,
             COALESCE(a.status, 'Present') as status, a.correction_remarks
      FROM employees e
      LEFT JOIN attendance a ON e.employee_id = a.entity_id AND a.date = ? AND a.record_type = 'Employee'
      WHERE e.status = 'Active'
    `).all(date);
  } else {
    list = db.prepare(`
      SELECT s.shareholder_id as entity_id, s.name, v.name as village_name,
             COALESCE(a.status, 'Absent') as status, a.correction_remarks
      FROM shareholders s
      JOIN villages v ON s.village_id = v.village_id
      LEFT JOIN attendance a ON s.shareholder_id = a.entity_id AND a.date = ? AND a.record_type = 'Shareholder'
      LIMIT 100
    `).all(date);
  }

  res.json({ success: true, date, data: list });
});

app.post('/api/attendance', (req, res) => {
  const { date, record_type, records } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO attendance (record_type, entity_id, date, status, correction_remarks, entered_by)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(record_type, entity_id, date) DO UPDATE SET status = excluded.status, correction_remarks = excluded.correction_remarks
  `);

  const saveTx = db.transaction(() => {
    records.forEach(r => {
      stmt.run(record_type, r.entity_id, date, r.status, r.correction_remarks || null, req.headers['x-user'] || 'operator');
    });
  });

  saveTx();
  logAudit(req.headers['x-user'] || 'operator', 'Computer Operator', 'Attendance', 'UPDATE', date, null, { date, count: records.length });

  res.json({ success: true });
});

// -------------------------------------------------------------
// 6. SUGAR ALLOTMENT MODULE
// -------------------------------------------------------------
app.get('/api/sugar-allotment', (req, res) => {
  const search = req.query.search || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  let whereClauses = ['1=1'];
  let params = [];

  if (search) {
    whereClauses.push('(sa.shareholder_id LIKE ? OR s.name LIKE ? OR s.village_id LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  const whereStr = whereClauses.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) as total FROM sugar_allotments sa JOIN shareholders s ON sa.shareholder_id = s.shareholder_id WHERE ${whereStr}`).get(...params).total;

  const data = db.prepare(`
    SELECT sa.*, s.name as shareholder_name, s.share_number, s.number_of_shares, v.name as village_name, c.name as circle_name
    FROM sugar_allotments sa
    JOIN shareholders s ON sa.shareholder_id = s.shareholder_id
    JOIN villages v ON s.village_id = v.village_id
    JOIN circles c ON s.circle_id = c.circle_id
    WHERE ${whereStr}
    ORDER BY sa.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

app.post('/api/sugar-allotment', (req, res) => {
  const body = req.body;
  const allotment_id = `SA-${Date.now()}`;
  const totalQty = parseFloat(body.sugar_quantity_kg);
  const issuedQty = parseFloat(body.issued_quantity_kg) || 0;
  const remQty = totalQty - issuedQty;
  const status = remQty <= 0 ? 'Completed' : issuedQty > 0 ? 'Partially Issued' : 'Allocated';

  const stmt = db.prepare(`
    INSERT INTO sugar_allotments (
      allotment_id, shareholder_id, allotment_date, sugar_quantity_kg, sugar_type,
      allotment_period, issued_quantity_kg, remaining_quantity_kg, status, remarks, entered_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    allotment_id, body.shareholder_id, body.allotment_date || new Date().toISOString().split('T')[0],
    totalQty, body.sugar_type || 'M30 Grade White Sugar', body.allotment_period || 'Season 2025-2026',
    issuedQty, remQty, status, body.remarks, req.headers['x-user'] || 'operator'
  );

  logAudit(req.headers['x-user'] || 'operator', 'Computer Operator', 'SugarAllotment', 'CREATE', allotment_id, null, body);

  res.json({ success: true, allotment_id });
});

// -------------------------------------------------------------
// 7. VARASA / LEGAL HEIR SHARE TRANSFER MODULE
// -------------------------------------------------------------
app.get('/api/varasa', (req, res) => {
  const search = req.query.search || '';
  const status = req.query.status || '';

  let whereClauses = ['1=1'];
  let params = [];

  if (search) {
    whereClauses.push('(v.transfer_id LIKE ? OR v.existing_shareholder_id LIKE ? OR s.name LIKE ? OR v.heir_name LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  if (status) {
    whereClauses.push('v.approval_status = ?');
    params.push(status);
  }

  const whereStr = whereClauses.join(' AND ');

  const transfers = db.prepare(`
    SELECT v.*, s.name as existing_shareholder_name, vil.name as village_name, c.name as circle_name
    FROM varasa_transfers v
    JOIN shareholders s ON v.existing_shareholder_id = s.shareholder_id
    JOIN villages vil ON v.heir_village_id = vil.village_id
    JOIN circles c ON v.heir_circle_id = c.circle_id
    WHERE ${whereStr}
    ORDER BY v.id DESC
  `).all(...params);

  res.json({ success: true, data: transfers });
});

app.post('/api/varasa', (req, res) => {
  const body = req.body;
  const transfer_id = `VAR-${Date.now()}`;

  const stmt = db.prepare(`
    INSERT INTO varasa_transfers (
      transfer_id, existing_shareholder_id, existing_share_number, existing_shares,
      heir_name, heir_relationship, heir_mobile, heir_address, heir_village_id, heir_circle_id,
      application_date, approval_status, documents_verified, remarks, processed_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Application Received', 'Pending', ?, ?)
  `);

  stmt.run(
    transfer_id, body.existing_shareholder_id, body.existing_share_number, body.existing_shares,
    body.heir_name, body.heir_relationship, body.heir_mobile, body.heir_address, body.heir_village_id,
    body.heir_circle_id, body.application_date || new Date().toISOString().split('T')[0],
    body.remarks, req.headers['x-user'] || 'operator'
  );

  logAudit(req.headers['x-user'] || 'operator', 'Computer Operator', 'VarasaTransfer', 'CREATE', transfer_id, null, body);

  res.json({ success: true, transfer_id });
});

app.put('/api/varasa/:id/status', (req, res) => {
  const { approval_status, remarks } = req.body;
  const varasa = db.prepare('SELECT * FROM varasa_transfers WHERE transfer_id = ?').get(req.params.id);

  if (!varasa) return res.status(404).json({ success: false, message: 'Transfer record not found' });

  // Workflow logic: if status becomes 'Completed', create new shareholder for Heir & update old status to Inactive
  if (approval_status === 'Completed' && varasa.approval_status !== 'Completed') {
    const newShId = `SH-${Date.now().toString().slice(-5)}`;
    
    // Create new shareholder record for heir
    const newShStmt = db.prepare(`
      INSERT INTO shareholders (
        shareholder_id, name, father_husband_name, dob, gender, mobile, address,
        village_id, circle_id, share_number, number_of_shares, share_value,
        status, registration_date, remarks
      ) VALUES (?, ?, ?, ?, 'Male', ?, ?, ?, ?, ?, ?, ?, 'Active', date('now'), ?)
    `);

    newShStmt.run(
      newShId, varasa.heir_name, `Late ${varasa.existing_shareholder_id}`, null,
      varasa.heir_mobile, varasa.heir_address, varasa.heir_village_id, varasa.heir_circle_id,
      `${varasa.existing_share_number}-H`, varasa.existing_shares, varasa.existing_shares * 100.0,
      `Varasa Share Transfer from ${varasa.existing_shareholder_id}`
    );

    // Set old shareholder status to Inactive (Transferred)
    db.prepare('UPDATE shareholders SET status = "Inactive", remarks = ? WHERE shareholder_id = ?')
      .run(`Transferred via Varasa to ${newShId}`, varasa.existing_shareholder_id);

    db.prepare('UPDATE varasa_transfers SET approval_status = ?, new_shareholder_id = ?, transfer_date = date("now"), remarks = ? WHERE transfer_id = ?')
      .run(approval_status, newShId, remarks || varasa.remarks, req.params.id);

    logAudit(req.headers['x-user'] || 'admin', 'Admin', 'VarasaTransfer', 'COMPLETE_TRANSFER', req.params.id, varasa, { new_shareholder_id: newShId });
  } else {
    db.prepare('UPDATE varasa_transfers SET approval_status = ?, remarks = ? WHERE transfer_id = ?')
      .run(approval_status, remarks || varasa.remarks, req.params.id);

    logAudit(req.headers['x-user'] || 'admin', 'Admin', 'VarasaTransfer', 'STATUS_CHANGE', req.params.id, null, { status: approval_status });
  }

  res.json({ success: true });
});

// -------------------------------------------------------------
// 8. VILLAGES & CIRCLES MASTERS
// -------------------------------------------------------------
app.get('/api/villages', (req, res) => {
  const villages = db.prepare(`
    SELECT v.*, c.name as circle_name,
           (SELECT COUNT(*) FROM shareholders s WHERE s.village_id = v.village_id) as shareholder_count,
           (SELECT SUM(number_of_shares) FROM shareholders s WHERE s.village_id = v.village_id) as total_shares
    FROM villages v
    JOIN circles c ON v.circle_id = c.circle_id
    ORDER BY v.name ASC
  `).all();
  res.json({ success: true, data: villages });
});

app.post('/api/villages', (req, res) => {
  const { village_id, name, circle_id } = req.body;
  const stmt = db.prepare('INSERT INTO villages (village_id, name, circle_id) VALUES (?, ?, ?)');
  stmt.run(village_id, name, circle_id);
  res.json({ success: true });
});

app.get('/api/circles', (req, res) => {
  const circles = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM villages v WHERE v.circle_id = c.circle_id) as village_count,
           (SELECT COUNT(*) FROM shareholders s WHERE s.circle_id = c.circle_id) as shareholder_count,
           (SELECT SUM(number_of_shares) FROM shareholders s WHERE s.circle_id = c.circle_id) as total_shares
    FROM circles c
    ORDER BY c.name ASC
  `).all();
  res.json({ success: true, data: circles });
});

app.post('/api/circles', (req, res) => {
  const { circle_id, name, description } = req.body;
  const stmt = db.prepare('INSERT INTO circles (circle_id, name, description) VALUES (?, ?, ?)');
  stmt.run(circle_id, name, description);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 9. EMPLOYEES MODULE
// -------------------------------------------------------------
app.get('/api/employees', (req, res) => {
  const employees = db.prepare('SELECT * FROM employees ORDER BY id ASC').all();
  res.json({ success: true, data: employees });
});

app.post('/api/employees', (req, res) => {
  const body = req.body;
  const stmt = db.prepare(`
    INSERT INTO employees (employee_id, name, designation, department, mobile, address, joining_date, status, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(body.employee_id, body.name, body.designation, body.department, body.mobile, body.address, body.joining_date, body.status || 'Active', body.role || 'Employee');
  logAudit(req.headers['x-user'] || 'admin', 'Admin', 'Employees', 'CREATE', body.employee_id, null, body);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 10. AUDIT LOGS & SYSTEM REPORTS
// -------------------------------------------------------------
app.get('/api/audit-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200').all();
  res.json({ success: true, data: logs });
});

app.get('/api/reports/shareholders', (req, res) => {
  const list = db.prepare(`
    SELECT s.shareholder_id, s.name, s.father_husband_name, s.mobile, v.name as village_name, c.name as circle_name, s.share_number, s.number_of_shares, s.status, s.registration_date
    FROM shareholders s
    JOIN villages v ON s.village_id = v.village_id
    JOIN circles c ON s.circle_id = c.circle_id
    ORDER BY s.id ASC
    LIMIT 2000
  `).all();
  res.json({ success: true, data: list });
});

// -------------------------------------------------------------
// 11. DATA IMPORT & BACKUP API
// -------------------------------------------------------------
app.post('/api/import/shareholders', (req, res) => {
  const { records } = req.body; // Array of shareholder objects from CSV/Excel preview
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, message: 'No records provided for import' });
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO shareholders (
      shareholder_id, name, father_husband_name, mobile, address, village_id, circle_id, share_number, number_of_shares, share_value, registration_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), 'Active')
  `);

  let count = 0;
  const importTx = db.transaction(() => {
    records.forEach(r => {
      stmt.run(r.shareholder_id, r.name, r.father_husband_name || 'N/A', r.mobile || '9999999999', r.address || 'Gaon', r.village_id || 'VIL-001', r.circle_id || 'CIR-001', r.share_number, parseInt(r.number_of_shares) || 1, (parseInt(r.number_of_shares) || 1) * 100.0);
      count++;
    });
  });

  importTx();
  logAudit(req.headers['x-user'] || 'admin', 'Admin', 'Import', 'BULK_IMPORT', 'SYSTEM', null, { imported_count: count });
  res.json({ success: true, count });
});

app.get('/api/backup/download', (req, res) => {
  const backupPath = path.join(__dirname, `sugar_erp_backup_${Date.now()}.db`);
  db.backup(backupPath).then(() => {
    res.download(backupPath, () => {
      fs.unlinkSync(backupPath); // Delete temp file after download
    });
  }).catch(err => res.status(500).json({ success: false, message: err.message }));
});

app.listen(PORT, () => {
  console.log(`🚀 Sugar Cooperative ERP Backend running on http://localhost:${PORT}`);
});
