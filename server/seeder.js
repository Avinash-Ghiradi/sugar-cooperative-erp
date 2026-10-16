const db = require('./db');

console.log('🌱 Starting Database Seeding Process for 17,000+ Shareholders...');

// 1. Seed Circles
const circlesData = [
  { circle_id: 'CIR-001', name: 'Central Sugar Circle', description: 'Main Mill & Factory Zone' },
  { circle_id: 'CIR-002', name: 'North River Cane Circle', description: 'Irrigated Krishna Basin Region' },
  { circle_id: 'CIR-003', name: 'South Plantation Circle', description: 'High Yield Sugarcane Belt' },
  { circle_id: 'CIR-004', name: 'East Cooperative Circle', description: 'Eastern Agricultural Division' },
  { circle_id: 'CIR-005', name: 'West Valley Circle', description: 'Western Farmer Collective Zone' },
  { circle_id: 'CIR-006', name: 'Panchganga Basin Circle', description: 'Riverbank Irrigation Zone' },
  { circle_id: 'CIR-007', name: 'Sahyadri Foothills Circle', description: 'Upland Sugarcane Farms' },
  { circle_id: 'CIR-008', name: 'Industrial Bypass Circle', description: 'Bypass Expansion Zone' },
];

const insertCircle = db.prepare('INSERT OR IGNORE INTO circles (circle_id, name, description) VALUES (?, ?, ?)');
circlesData.forEach(c => insertCircle.run(c.circle_id, c.name, c.description));

// 2. Seed 50 Villages
const villageNames = [
  'Shirol', 'Jaysingpur', 'Hatkanangule', 'Ichalkaranji', 'Kagal', 'Radhanagari', 'Bhudargad', 'Ajara',
  'Chandgad', 'Shahuwadi', 'Karveer', 'Gadhinklaj', 'Bawda', 'Paldewadi', 'Nipani', 'Chikodi', 'Raybag',
  'Sankeshwar', 'Kudachi', 'Miraj', 'Jath', 'Tasgaon', 'Kavathe Mahankal', 'Khanapur', 'Atpadi', 'Shirala',
  'Walwa', 'Kadegaon', 'Palus', 'Ashta', 'Islampur', 'Urun', 'Vita', 'Sangarsh', 'Vadgaon', 'Rukadi',
  'Herle', 'Managaon', 'Shiroli', 'Nigave', 'Mudshingi', 'Uchgaon', 'Gokul Shirgaon', 'Kadamwadi', 'Kasaba',
  'Bapat Camp', 'Kalamba', 'Phulewadi', 'Nagala', 'Tarabai'
];

const villageData = [];
villageNames.forEach((vName, idx) => {
  const vId = `VIL-${String(idx + 1).padStart(3, '0')}`;
  const circleObj = circlesData[idx % circlesData.length];
  villageData.push({ id: vId, name: vName, circle_id: circleObj.circle_id });
});

const insertVillage = db.prepare('INSERT OR IGNORE INTO villages (village_id, name, circle_id) VALUES (?, ?, ?)');
villageData.forEach(v => insertVillage.run(v.id, v.name, v.circle_id));

// 3. Seed Users & Default Roles
const usersData = [
  { username: 'admin', password_hash: 'admin123', name: 'System Administrator', role: 'Admin', emp_id: 'EMP-001' },
  { username: 'cashier', password_hash: 'cashier123', name: 'Ramesh Patil (Chief Cashier)', role: 'Cashier', emp_id: 'EMP-002' },
  { username: 'operator', password_hash: 'operator123', name: 'Sunita Deshmukh (Data Operator)', role: 'Computer Operator', emp_id: 'EMP-003' },
  { username: 'employee', password_hash: 'employee123', name: 'Vikas Shinde (Sugar Officer)', role: 'Employee', emp_id: 'EMP-004' }
];

const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password_hash, name, role, employee_id) VALUES (?, ?, ?, ?, ?)');
usersData.forEach(u => insertUser.run(u.username, u.password_hash, u.name, u.role, u.emp_id));

// 4. Seed Employees (50 employees)
const empDesignations = ['Factory Supervisor', 'Chief Accountant', 'Sugar Chemist', 'Field Officer', 'Cane Inspector', 'IT Executive', 'Clerk', 'Logistics Officer'];
const empDepartments = ['Administration', 'Finance', 'Cane Procurement', 'Quality Control', 'IT & Systems', 'Human Resources'];

const insertEmp = db.prepare(`
  INSERT OR IGNORE INTO employees (employee_id, name, designation, department, mobile, address, joining_date, status, username, role)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)
`);

for (let i = 1; i <= 50; i++) {
  const empId = `EMP-${String(i).padStart(3, '0')}`;
  const name = `Employee ${i} Name`;
  const des = empDesignations[i % empDesignations.length];
  const dept = empDepartments[i % empDepartments.length];
  const mobile = `9822${String(100000 + i).padStart(6, '0')}`;
  const address = `Cooperative Staff Quarters Plot #${i}, Sugar Complex`;
  const joining = `2020-0${(i % 9) + 1}-15`;
  const user = i <= 4 ? usersData[i - 1].username : null;
  const role = i <= 4 ? usersData[i - 1].role : 'Employee';

  insertEmp.run(empId, name, des, dept, mobile, address, joining, user, role);
}

// 5. Seed 17,000+ Shareholders in a single fast database transaction
const firstNames = ['Rajaram', 'Dattatray', 'Anandrao', 'Shivaji', 'Ganpatrao', 'Babasaheb', 'Pandurang', 'Suresh', 'Maruti', 'Yashwant', 'Bhimrao', 'Subhash', 'Chandrakant', 'Tukaram', 'Ganesh', 'Balasaheb', 'Sunil', 'Vijay', 'Deepak', 'Sanjay'];
const middleNames = ['Rao', 'Kumar', 'Balwant', 'Govind', 'Ramchandra', 'Vithal', 'Vishnu', 'Mahadev', 'Babu', 'Shankar'];
const lastNames = ['Patil', 'Deshmukh', 'Shinde', 'Jadhav', 'Kadam', 'Pawar', 'Chavan', 'Gaekwad', 'Mane', 'More', 'Suryavanshi', 'Thorat', 'Bhosale', 'Kulkarni', 'Naik', 'Mohite', 'Nimbalkar', 'Ghatge', 'Jagtap', 'Sawant'];

const TOTAL_SHAREHOLDERS = 17250;
console.log(`⚡ Generating ${TOTAL_SHAREHOLDERS} shareholder records...`);

const insertShareholder = db.prepare(`
  INSERT OR IGNORE INTO shareholders (
    shareholder_id, name, father_husband_name, dob, gender, mobile, address,
    village_id, circle_id, share_number, number_of_shares, share_value,
    status, registration_date, aadhaar_ref, remarks
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertTx = db.prepare(`
  INSERT OR IGNORE INTO transactions (
    transaction_id, shareholder_id, date, type, share_number, number_of_shares,
    amount, tx_kind, reference_no, payment_mode, remarks, entered_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertSugarAllotment = db.prepare(`
  INSERT OR IGNORE INTO sugar_allotments (
    allotment_id, shareholder_id, allotment_date, sugar_quantity_kg, sugar_type,
    allotment_period, issued_quantity_kg, remaining_quantity_kg, status, remarks, entered_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const seedShareholdersTx = db.transaction(() => {
  for (let i = 1; i <= TOTAL_SHAREHOLDERS; i++) {
    const shId = `SH-${String(i).padStart(5, '0')}`;
    const fn = firstNames[i % firstNames.length];
    const mn = middleNames[i % middleNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const name = `${fn} ${mn} ${ln}`;
    const fatherName = `${mn} ${lastNames[(i * 7) % lastNames.length]}`;
    
    const dobMonth = String((i % 12) + 1).padStart(2, '0');
    const dobDay = String((i % 28) + 1).padStart(2, '0');
    const dob = `197${i % 10}-${dobMonth}-${dobDay}`;
    const gender = i % 15 === 0 ? 'Female' : 'Male';
    const mobile = `9${(7 + (i % 3))}${String(1000000 + i).slice(-8)}`;
    
    const villageObj = villageData[i % villageData.length];
    const address = `House No. ${i % 300 + 1}, ${villageObj.name} Gaon`;
    const shareNo = `SN-${String(100000 + i)}`;
    const sharesCount = (i % 10 === 0) ? 25 : (i % 5 === 0) ? 10 : (i % 2 === 0) ? 5 : 2;
    const shareVal = sharesCount * 100.0;
    const status = i % 40 === 0 ? 'Inactive' : 'Active';
    const regYear = 2005 + (i % 18);
    const regDate = `${regYear}-0${(i % 9) + 1}-12`;
    const aadhaar = `ABCD${String(10000 + i)}1234`;
    const remarks = i % 50 === 0 ? 'Founding Member Shareholder' : 'Standard Farmer Shareholder';

    insertShareholder.run(
      shId, name, fatherName, dob, gender, mobile, address,
      villageObj.id, villageObj.circle_id, shareNo, sharesCount, shareVal,
      status, regDate, aadhaar, remarks
    );

    // Create 1-2 transactions for every 5th shareholder
    if (i % 5 === 0) {
      const txId = `TX-${String(100000 + i)}`;
      const txDate = `2025-0${(i % 8) + 1}-10 10:30:00`;
      insertTx.run(
        txId, shId, txDate, 'Purchase', shareNo, sharesCount,
        shareVal, 'Credit', `REF-${i * 99}`, 'Bank Transfer', 'Initial Share Allotment Deposit', 'admin'
      );
    }

    // Create sugar allotment for every 3rd shareholder
    if (i % 3 === 0) {
      const saId = `SA-${String(10000 + i)}`;
      const qty = sharesCount * 15; // 15 kg per share quota
      const issued = i % 6 === 0 ? qty : qty / 2;
      const rem = qty - issued;
      const saStatus = rem === 0 ? 'Completed' : 'Partially Issued';
      
      insertSugarAllotment.run(
        saId, shId, '2025-10-01', qty, 'M30 Grade White Sugar',
        'Crushing Season 2025-2026', issued, rem, saStatus, 'Annual Shareholder Quota Issue', 'operator'
      );
    }
  }
});

seedShareholdersTx();
console.log(`✅ Successfully seeded ${TOTAL_SHAREHOLDERS} shareholders!`);

// 6. Seed Varasa Transfers (100 Varasa records)
const insertVarasa = db.prepare(`
  INSERT OR IGNORE INTO varasa_transfers (
    transfer_id, existing_shareholder_id, existing_share_number, existing_shares,
    heir_name, heir_relationship, heir_mobile, heir_address, heir_village_id, heir_circle_id,
    application_date, approval_status, documents_verified, remarks, processed_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const varasaStatuses = ['Application Received', 'Under Verification', 'Documents Pending', 'Approved', 'Completed', 'Rejected'];
const relationships = ['Son', 'Daughter', 'Wife', 'Brother', 'Grandson', 'Legal Nominee'];

for (let j = 1; j <= 120; j++) {
  const shIndex = j * 120;
  const existingShId = `SH-${String(shIndex).padStart(5, '0')}`;
  const vTransferId = `VAR-${String(1000 + j)}`;
  const heirName = `Heir of SH-${shIndex} Name`;
  const rel = relationships[j % relationships.length];
  const mob = `9821${String(500000 + j)}`;
  const villageObj = villageData[j % villageData.length];
  const appStatus = varasaStatuses[j % varasaStatuses.length];

  insertVarasa.run(
    vTransferId, existingShId, `SN-${String(100000 + shIndex)}`, 5,
    heirName, rel, mob, `Village Gaon House #${j}`, villageObj.id, villageObj.circle_id,
    `2025-11-${String((j % 25) + 1).padStart(2, '0')}`, appStatus, appStatus === 'Completed' || appStatus === 'Approved' ? 'Verified' : 'Pending',
    'Legal heir transfer application submitted with Gram Panchayat death certificate and heir affidavit.', 'operator'
  );
}

// 7. Seed Attendance (500 records)
const insertAtt = db.prepare(`
  INSERT OR IGNORE INTO attendance (record_type, entity_id, date, status, entered_by)
  VALUES (?, ?, ?, ?, ?)
`);

const todayStr = new Date().toISOString().split('T')[0];
for (let k = 1; k <= 50; k++) {
  const empId = `EMP-${String(k).padStart(3, '0')}`;
  insertAtt.run('Employee', empId, todayStr, k % 7 === 0 ? 'Absent' : 'Present', 'admin');
}

// 8. Seed Audit Logs
const insertAudit = db.prepare(`
  INSERT OR IGNORE INTO audit_logs (username, role, module, action, record_id, old_value, new_value, ip_address)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertAudit.run('admin', 'Admin', 'Database', 'SEED_DATABASE', 'SYSTEM', null, 'Seeded 17,250 shareholders and master records', '127.0.0.1');
insertAudit.run('operator', 'Computer Operator', 'Shareholder', 'CREATE', 'SH-00001', null, 'Added shareholder Rajaram Patil', '192.168.1.45');
insertAudit.run('cashier', 'Cashier', 'Transactions', 'CREATE', 'TX-100005', null, 'Entered share deposit payment Rs. 500', '192.168.1.48');

console.log('🎉 Database seeding finished successfully!');
