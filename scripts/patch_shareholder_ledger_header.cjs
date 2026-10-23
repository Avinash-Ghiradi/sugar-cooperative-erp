const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderList.jsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const oldTarget = `      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" /> Shareholder Statutory Ledger (ಷೇರುದಾರರ ನಮೂನೆ ವಹಿ)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              38 Columns Official Format
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/80 text-emerald-300 border border-slate-700 font-mono">
              Total: {pagination.total.toLocaleString()} Members • {villages.length} Places • {circles.length} Circles • {castList.length} Categories • {bookList.length} Books
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Shareholders Statutory Registry with Book No, Share No, Aadhaar, Receipt, Place, Taluk, Circle, Tharava & Nominee Details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('ledger')}
              className={\`px-3 py-1.5 rounded-lg font-semibold transition-all \${
                viewMode === 'ledger' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }\`}
            >
              Full Ledger (38 Cols)
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={\`px-3 py-1.5 rounded-lg font-semibold transition-all \${
                viewMode === 'summary' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }\`}
            >
              Summary View
            </button>
          </div>

          {/* Direct Link to Detailed Reports */}
          <button
            onClick={() => setActiveModule('reports')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Open Placewise, Categorywise, Circlewise & Shareswise Reports with Multi-Filters"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>ವಿವರ ವರದಿಗಳು (Reports)</span>
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
      </div>`;

const newTarget = `      {/* Header Bar */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" /> Shareholder Statutory Ledger (ಷೇರುದಾರರ ನಮೂನೆ ವಹಿ)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              38 Columns Official Format
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/80 text-emerald-300 border border-slate-700 font-mono">
              Total: {pagination.total.toLocaleString()} Members • {villages.length} Places • {circles.length} Circles • {castList.length} Categories • {bookList.length} Books
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-4xl">
            Shareholders Statutory Registry with Book No, Share No, Aadhaar, Receipt, Place, Taluk, Circle, Tharava & Nominee Details
          </p>
        </div>

        {/* Action Buttons below header in a single row */}
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

          {/* Direct Link to Detailed Reports */}
          <button
            onClick={() => setActiveModule('reports')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Open Placewise, Categorywise, Circlewise & Shareswise Reports with Multi-Filters"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>ವಿವರ ವರದಿಗಳು (Reports)</span>
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
      </div>`;

if (content.includes(oldTarget)) {
  content = content.replace(oldTarget, newTarget);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] ShareholderList.jsx updated successfully');
} else {
  console.error('[FAIL] ShareholderList.jsx target not found');
  process.exit(1);
}
