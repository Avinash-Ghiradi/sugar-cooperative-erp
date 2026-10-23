const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderList.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to \n
const isCrlf = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

const searchMarker = '{/* Multi-Field Search, Statutory Filter & Alphabetical Sort Bar */}';
const targetStart = norm.indexOf(searchMarker);

if (targetStart === -1) {
  console.error('[FAIL] Could not find searchMarker');
  process.exit(1);
}

// Find table start marker
const tableMarker = '{/* Main Table: Full 38-Column Official Cooperative Ledger View */}';
const targetEnd = norm.indexOf(tableMarker);

if (targetEnd === -1) {
  console.error('[FAIL] Could not find tableMarker');
  process.exit(1);
}

// Also check the action buttons row right above searchMarker
const actionHeaderMarker = '{/* Action Buttons below header in a single row */}';
const actionHeaderStart = norm.indexOf(actionHeaderMarker);

if (actionHeaderStart === -1) {
  console.error('[FAIL] Could not find actionHeaderMarker');
  process.exit(1);
}

const newActionAndFilterBlock = `{/* Action Buttons below header in a single row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('ledger')}
              className={\`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer \${
                viewMode === 'ledger' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }\`}
            >
              Full Ledger (38 Cols)
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={\`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer \${
                viewMode === 'summary' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }\`}
            >
              Summary View
            </button>
          </div>

          {/* New Shareholder Registration */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition-all cursor-pointer"
            title="Add New Shareholder Record (+ ಹೊಸ ನೋಂದಣಿ)"
          >
            <Plus className="w-4 h-4" />
            <span>+ ಹೊಸ ನೋಂದಣಿ (New Shareholder)</span>
          </button>

          {/* Direct Link to Detailed Reports */}
          <button
            onClick={() => setActiveModule('reports')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Open Placewise, Categorywise, Circlewise & Shareswise Reports with Multi-Filters"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>ವಿವರ ವರದಿಗಳು (Reports)</span>
          </button>

          {/* Export Full 38-Column Ledger to Excel (.xls) */}
          <button
            onClick={exportFullLedgerExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Export complete 38-column statutory ledger to Excel (.xls) with 100% Kannada Unicode"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>ಎಕ್ಸೆಲ್ ರಫ್ತು (Export .xls)</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              loadMasters();
              fetchShareholders(pagination.page);
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="ಡೇಟಾಬೇಸ್‌ನಿಂದ ತಾಜಾ ಮಾಹಿತಿ ಪಡೆಯಿರಿ (Refresh from Cloud Database)"
          >
            <RefreshCw className={\`w-4 h-4 text-emerald-400 \${loading ? 'animate-spin' : ''}\`} />
            <span>ರಿಫ್ರೆಶ್ (Refresh)</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4 text-sky-400" /> Print
          </button>
        </div>
      </div>

      {/* Multi-Field Search, Statutory Filter & Alphabetical Sort Bar - Single Row */}
      <div className="flex flex-nowrap items-center gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 overflow-x-auto shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Name (ಕನ್ನಡ / English), Share No, Book No, Mobile, Aadhaar..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Book No Filter */}
        <select
          value={selectedBook}
          onChange={(e) => setSelectedBook(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none transition-all shrink-0 cursor-pointer"
        >
          <option value="">All Books ({bookList.length})</option>
          {bookList.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Schedule Cast / ವರ್ಗ Filter */}
        <select
          value={selectedCast}
          onChange={(e) => setSelectedCast(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none transition-all shrink-0 cursor-pointer"
        >
          <option value="">All Categories ({castList.length})</option>
          {castList.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Place / Village Filter (Alphabetical order) */}
        <select
          value={selectedVillage}
          onChange={(e) => setSelectedVillage(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none transition-all shrink-0 max-w-[160px] cursor-pointer"
        >
          <option value="">All Places ({villages.length})</option>
          {villages.map(v => (
            <option key={v.village_id || v.name} value={v.name}>
              {v.name} {v.taluk ? \`(\${v.taluk})\` : ''} ({v.shareholder_count || 0})
            </option>
          ))}
        </select>

        {/* Circle Filter (Alphabetical order) */}
        <select
          value={selectedCircle}
          onChange={(e) => setSelectedCircle(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none transition-all shrink-0 max-w-[150px] cursor-pointer"
        >
          <option value="">All Circles ({circles.length})</option>
          {circles.map(c => (
            <option key={c.circle_id || c.name} value={c.name}>
              {c.name} ({c.shareholder_count || 0})
            </option>
          ))}
        </select>

        {/* Sort By Filter (Places, Circles, Addresses, Names in Alphabetical Order) */}
        <div className="flex items-center gap-1 shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none transition-all cursor-pointer"
            title="Sort alphabetically (ಅಕಾರಾದಿ ಕ್ರಮ)"
          >
            <option value="">ಕ್ರಮಬದ್ಧ ವಿಂಗಡಣೆ (Default)</option>
            <option value="place">ಸ್ಥಳ / ಗ್ರಾಮ (Place: ಅ-ಹ / A-Z)</option>
            <option value="circle">ವಲಯ / ಸರ್ಕಲ್ (Circle: ಅ-ಹ / A-Z)</option>
            <option value="address">ವಿಳಾಸ (Address: ಅ-ಹ / A-Z)</option>
            <option value="name">ಹೆಸರು (Name: ಅ-ಹ / A-Z)</option>
            <option value="share_no">ಷೇರು ಸಂಖ್ಯೆ (Share No)</option>
          </select>
          {sortBy && (
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-emerald-400 text-xs transition-colors shrink-0 cursor-pointer"
              title={sortOrder === 'asc' ? 'Ascending (ಆರೋಹಣ ಕ್ರಮ: ಅ-ಹ)' : 'Descending (ಅವರೋಹಣ ಕ್ರಮ: ಹ-ಅ)'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Cash Amount (Total Amount Column) Filter */}
        <select
          value={selectedAmount}
          onChange={(e) => setSelectedAmount(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none transition-all font-medium shrink-0 max-w-[170px] cursor-pointer"
          title="Filter by Cash Amount from Total Amount column (ಒಟ್ಟು ಮೊತ್ತ)"
        >
          <option value="">All Cash Amounts ({amountList.length})</option>
          {amountList.map(a => (
            <option key={a.amount} value={a.amount}>
              ₹ {a.amount.toLocaleString('en-IN')} ({a.count} ಸದಸ್ಯರು)
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none transition-all shrink-0 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active (ಸಕ್ರಿಯ)</option>
          <option value="Inactive">Inactive</option>
        </select>

        {/* Clear Filters (when any active) */}
        {(Boolean(searchInput || selectedBook || selectedCast || selectedVillage || selectedCircle || selectedAmount || selectedStatus || sortBy)) && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setSelectedBook('');
              setSelectedCast('');
              setSelectedVillage('');
              setSelectedCircle('');
              setSelectedAmount('');
              setSelectedStatus('');
              setSortBy('');
              setSortOrder('asc');
            }}
            className="flex items-center gap-1 px-2.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white rounded-xl text-xs font-semibold border border-rose-800 transition-all shrink-0 cursor-pointer"
            title="Clear all active filters"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      `;

const before = norm.slice(0, actionHeaderStart);
const after = norm.slice(targetEnd);

const updated = before + newActionAndFilterBlock + after;

fs.writeFileSync(filePath, isCrlf ? updated.replace(/\n/g, '\r\n') : updated, 'utf8');
console.log('[PASS] ShareholderList.jsx successfully updated with single-row filters and enhanced header action buttons!');
