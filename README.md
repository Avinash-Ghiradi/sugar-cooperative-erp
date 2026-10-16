# Chhatrapati Sugar Cooperative Society ERP

> **Shareholder Management & Cooperative ERP Web Application** capable of handling **17,000+ shareholders** with sub-10ms indexed search, financial ledger transactions, sugar allotments, Varasa (legal heir) transfers, village/circle master data, ID card generator, role-based access control (RBAC), immutable audit logs, and print/PDF reporting.

---

## 🌟 Features

- **17,000+ Shareholder Database Engine**: SQLite B-Tree indexing on `shareholder_id`, `name`, `share_number`, `village_id`, `circle_id`, `mobile`, and `status`.
- **Executive Analytics Dashboard**: 12 stat cards & Recharts interactive visualizations (Shareholders by Village, Circle distribution, Share category ranges, Varasa workflow status).
- **Shareholder Registry & 6-Tab Profile**: Personal info, Share details, Transaction history, Attendance history, Sugar Quota, Varasa transfer history.
- **Financial Transactions**: Share purchase, dividend deposits, transfer fees, refunds, and printable transaction receipts.
- **Sugar Allotment & Quotas**: Manage crushing season quotas (e.g., 15 kg/share), issue tracking, and printable vouchers.
- **Varasa Legal-Heir Transfer Workflow**: Multi-step status approval (`Application Received` → `Under Verification` → `Documents Pending` → `Approved` → `Completed`) with ownership audit preservation.
- **ID Card Generator**: Single & bulk plastic member card generator with Front/Back designs, simulated barcodes/QR codes, and 8-cards-per-page A4 print layout.
- **RBAC & Audit Trail**: Pre-configured roles (`Admin`, `Cashier`, `Computer Operator`, `Employee`) with module permission guards and immutable event logs.

---

## 🚀 Quick Setup & Running

### 1. Backend Server Setup
```bash
cd server
npm install
npm run seed     # Seeds 17,250 shareholders, villages, circles & transactions
npm start        # Runs API server on http://localhost:5000
```

### 2. Frontend Web App Setup
```bash
cd client
npm install
npm run dev      # Launches Vite dev server on http://localhost:3000
```

---

## 🔐 Default Test Credentials

| Role | Username | Password | Permitted Modules |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full access to all 15 modules |
| **Cashier** | `cashier` | `cashier123` | Dashboard, Shareholders, Transactions, Reports |
| **Computer Operator** | `operator` | `operator123` | Shareholders, Attendance, Sugar Allotments, Varasa, ID Cards |
| **Employee** | `employee` | `employee123` | Personal profile & Attendance |

---

## 📁 Repository Structure

```
sugar_cooperative_erp/
├── server/
│   ├── db.js          # SQLite schema & WAL performance indexing
│   ├── seeder.js      # Batch insertion seeder for 17,250 shareholders
│   └── server.js      # Express REST API endpoints
└── client/
    ├── src/
    │   ├── context/   # AuthContext with RBAC permission matrix
    │   ├── services/  # ApiService REST client + fallback client data engine
    │   └── components/
    │       ├── Dashboard.jsx
    │       ├── Shareholders/
    │       ├── Transactions/
    │       ├── SugarAllotment/
    │       ├── Varasa/
    │       ├── IDCards/
    │       └── Admin/
    ├── index.html
    └── tailwind.config.js
```
