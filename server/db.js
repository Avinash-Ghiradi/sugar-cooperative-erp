const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sugar_erp.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    -- Circles Master Table
    CREATE TABLE IF NOT EXISTS circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circle_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Villages Master Table
    CREATE TABLE IF NOT EXISTS villages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      village_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      circle_id TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (circle_id) REFERENCES circles(circle_id)
    );

    -- Shareholders Table
    CREATE TABLE IF NOT EXISTS shareholders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shareholder_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      father_husband_name TEXT NOT NULL,
      dob DATE,
      gender TEXT DEFAULT 'Male',
      mobile TEXT NOT NULL,
      address TEXT NOT NULL,
      village_id TEXT NOT NULL,
      circle_id TEXT NOT NULL,
      share_number TEXT UNIQUE NOT NULL,
      number_of_shares INTEGER NOT NULL DEFAULT 1,
      share_value REAL NOT NULL DEFAULT 100.0,
      status TEXT DEFAULT 'Active',
      registration_date DATE NOT NULL,
      photo TEXT,
      aadhaar_ref TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (village_id) REFERENCES villages(village_id),
      FOREIGN KEY (circle_id) REFERENCES circles(circle_id)
    );

    -- Indexes for fast querying over 17,000+ records
    CREATE INDEX IF NOT EXISTS idx_sh_id ON shareholders(shareholder_id);
    CREATE INDEX IF NOT EXISTS idx_sh_name ON shareholders(name);
    CREATE INDEX IF NOT EXISTS idx_sh_share_no ON shareholders(share_number);
    CREATE INDEX IF NOT EXISTS idx_sh_mobile ON shareholders(mobile);
    CREATE INDEX IF NOT EXISTS idx_sh_village ON shareholders(village_id);
    CREATE INDEX IF NOT EXISTS idx_sh_circle ON shareholders(circle_id);
    CREATE INDEX IF NOT EXISTS idx_sh_status ON shareholders(status);

    -- Financial Transactions Table
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE NOT NULL,
      shareholder_id TEXT NOT NULL,
      date DATETIME NOT NULL,
      type TEXT NOT NULL, -- Purchase, Dividend, Transfer, Refund, Bonus
      share_number TEXT NOT NULL,
      number_of_shares INTEGER DEFAULT 0,
      amount REAL NOT NULL,
      tx_kind TEXT CHECK(tx_kind IN ('Credit', 'Debit')) NOT NULL,
      reference_no TEXT,
      payment_mode TEXT DEFAULT 'Bank Transfer',
      remarks TEXT,
      entered_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shareholder_id) REFERENCES shareholders(shareholder_id)
    );
    CREATE INDEX IF NOT EXISTS idx_tx_sh ON transactions(shareholder_id);
    CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);

    -- Attendance Table
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_type TEXT CHECK(record_type IN ('Shareholder', 'Employee')) NOT NULL,
      entity_id TEXT NOT NULL,
      date DATE NOT NULL,
      status TEXT CHECK(status IN ('Present', 'Absent', 'Leave')) NOT NULL,
      correction_remarks TEXT,
      entered_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(record_type, entity_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_att_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_att_entity ON attendance(entity_id);

    -- Sugar Allotment Table
    CREATE TABLE IF NOT EXISTS sugar_allotments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      allotment_id TEXT UNIQUE NOT NULL,
      shareholder_id TEXT NOT NULL,
      allotment_date DATE NOT NULL,
      sugar_quantity_kg REAL NOT NULL,
      sugar_type TEXT DEFAULT 'M30 Grade White Sugar',
      allotment_period TEXT NOT NULL, -- e.g. 2025-2026 Season
      issued_quantity_kg REAL DEFAULT 0,
      remaining_quantity_kg REAL NOT NULL,
      status TEXT CHECK(status IN ('Allocated', 'Partially Issued', 'Completed', 'Cancelled')) DEFAULT 'Allocated',
      remarks TEXT,
      entered_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shareholder_id) REFERENCES shareholders(shareholder_id)
    );
    CREATE INDEX IF NOT EXISTS idx_sa_sh ON sugar_allotments(shareholder_id);
    CREATE INDEX IF NOT EXISTS idx_sa_period ON sugar_allotments(allotment_period);

    -- Varasa / Share Transfer Table
    CREATE TABLE IF NOT EXISTS varasa_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id TEXT UNIQUE NOT NULL,
      existing_shareholder_id TEXT NOT NULL,
      existing_share_number TEXT NOT NULL,
      existing_shares INTEGER NOT NULL,
      heir_name TEXT NOT NULL,
      heir_relationship TEXT NOT NULL,
      heir_mobile TEXT NOT NULL,
      heir_address TEXT NOT NULL,
      heir_village_id TEXT NOT NULL,
      heir_circle_id TEXT NOT NULL,
      new_shareholder_id TEXT,
      application_date DATE NOT NULL,
      transfer_date DATE,
      approval_status TEXT CHECK(approval_status IN ('Application Received', 'Under Verification', 'Documents Pending', 'Approved', 'Rejected', 'Completed')) DEFAULT 'Application Received',
      documents_verified TEXT DEFAULT 'Pending',
      remarks TEXT,
      processed_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (existing_shareholder_id) REFERENCES shareholders(shareholder_id)
    );
    CREATE INDEX IF NOT EXISTS idx_varasa_sh ON varasa_transfers(existing_shareholder_id);
    CREATE INDEX IF NOT EXISTS idx_varasa_status ON varasa_transfers(approval_status);

    -- Employees Master Table
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      mobile TEXT NOT NULL,
      address TEXT NOT NULL,
      joining_date DATE NOT NULL,
      status TEXT DEFAULT 'Active',
      photo TEXT,
      username TEXT UNIQUE,
      role TEXT DEFAULT 'Employee',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users & Role System
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('Admin', 'Cashier', 'Computer Operator', 'Employee')) NOT NULL,
      employee_id TEXT,
      status TEXT DEFAULT 'Active',
      last_login DATETIME,
      permissions_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Logs Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      record_id TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp);

    -- Organization Settings Table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Default Organization Settings
  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  stmt.run('org_name', 'Chhatrapati Sugar Cooperative Society Ltd.');
  stmt.run('org_registration_no', 'CS-SUGAR-1978-8842');
  stmt.run('org_address', 'Sugar Mill Road, District Cooperative Complex');
  stmt.run('org_phone', '+91 231 2548900');
  stmt.run('org_email', 'info@sugarcooperative.org');
}

initDatabase();

module.exports = db;
