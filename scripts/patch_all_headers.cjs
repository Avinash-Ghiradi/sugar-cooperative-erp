const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. VarasaTransferModule.jsx
{
  const filePath = path.join(rootDir, 'client/src/components/Varasa/VarasaTransferModule.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  const oldTarget = `      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-950 shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-100">
                ವಾರಸುದಾರರ ಶೇರು ವರ್ಗಾವಣೆ (Varasa Legal-Heir Share Transfer)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                22 Columns Register
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Official statutory legal-heir transfer workflow with complete 22-column records, deceased shareholder link, photo preservation, transfer fees receipt, and committee verification.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer"
            title="Download Excel Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" /> Template (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer"
            title="Upload Varasa Excel Sheet"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" /> Import Excel
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-xs font-semibold border border-emerald-900/60 transition-all cursor-pointer"
            title="Export full Varasa register with 22 columns"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTransfer(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Varasa Application
          </button>
        </div>
      </div>`;

  const newTarget = `      {/* Top Header Card */}
      <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-950 shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-100">
                ವಾರಸುದಾರರ ಶೇರು ವರ್ಗಾವಣೆ (Varasa Legal-Heir Share Transfer)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                22 Columns Register
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Official statutory legal-heir transfer workflow with complete 22-column records, deceased shareholder link, photo preservation, transfer fees receipt, and committee verification.
            </p>
          </div>
        </div>

        {/* Action Buttons below header in a single row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setEditingTransfer(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + ಹೊಸ ವಾರಸು ಅರ್ಜಿ (New Varasa Application)
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Upload Varasa Excel Sheet"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" /> ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್ (Import Excel)
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Export full Varasa register with 22 columns"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" /> ಎಕ್ಸೆಲ್ ರಫ್ತು (Export .xlsx)
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Download Excel Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" /> Template (.xlsx)
          </button>
        </div>
      </div>`;

  if (content.includes(oldTarget)) {
    content = content.replace(oldTarget, newTarget);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] VarasaTransferModule.jsx updated');
  } else {
    console.error('[FAIL] VarasaTransferModule.jsx target not found');
  }
}

// 2. VargavaneTransferModule.jsx
{
  const filePath = path.join(rootDir, 'client/src/components/Vargavane/VargavaneTransferModule.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  const oldTarget = `      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-sky-950 shrink-0">
            <ArrowRightLeft className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-100">
                ವರ್ಗಾವಣೆ ಶೇರು ವರ್ಗಾವಣೆ (Vargavane Share Transfer)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                22 Columns Register
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Official statutory direct share transfer register between original members and transferees (ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರು) with 22-column records, fee receipt, and complete audit tracking.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer"
            title="Download Excel Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" /> Template (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer"
            title="Upload Vargavane Excel Sheet"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" /> Import Excel
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-sky-400 rounded-xl text-xs font-semibold border border-sky-900/60 transition-all cursor-pointer"
            title="Export full Vargavane register with 22 columns"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTransfer(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Vargavane Application
          </button>
        </div>
      </div>`;

  const newTarget = `      {/* Top Header Card */}
      <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-sky-950 shrink-0">
            <ArrowRightLeft className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-100">
                ವರ್ಗಾವಣೆ ಶೇರು ವರ್ಗಾವಣೆ (Vargavane Share Transfer)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                22 Columns Register
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Official statutory direct share transfer register between original members and transferees (ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರು) with 22-column records, fee receipt, and complete audit tracking.
            </p>
          </div>
        </div>

        {/* Actions below header in a single row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setEditingTransfer(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + ಹೊಸ ವರ್ಗಾವಣೆ ಅರ್ಜಿ (New Vargavane Application)
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Upload Vargavane Excel Sheet"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" /> ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್ (Import Excel)
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Export full Vargavane register with 22 columns"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" /> ಎಕ್ಸೆಲ್ ರಫ್ತು (Export .xlsx)
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Download Excel Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" /> Template (.xlsx)
          </button>
        </div>
      </div>`;

  if (content.includes(oldTarget)) {
    content = content.replace(oldTarget, newTarget);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] VargavaneTransferModule.jsx updated');
  } else {
    console.error('[FAIL] VargavaneTransferModule.jsx target not found');
  }
}

// 3. CircleMaster.jsx
{
  const filePath = path.join(rootDir, 'client/src/components/Master/CircleMaster.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  const oldTarget = `      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" /> Circle Master & Village Directory (ಸರ್ಕಲ್ ಮತ್ತು ಗ್ರಾಮಗಳ ವಹಿ)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              {circles.length} Circles • {directory.length} Mapped Villages
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Administrative cane circles, village mapping, regional in-charge officers and contact details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> ಹೊಸ ಗ್ರಾಮ / ಸರ್ಕಲ್ ಸೇರಿಸಿ (+ Add Entry)
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Excel Upload
          </button>

          <button
            onClick={handleDownloadTemplateXlsx}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm cursor-pointer"
            title="Download Excel Template matching the 7 headers"
          >
            <Download className="w-4 h-4 text-teal-400" /> Excel Template (.xlsx)
          </button>

          <a
            href="./circle_details.csv"
            download="circle_details.csv"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" /> CSV
          </a>

          <button
            onClick={handleResetCircles}
            className="p-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 rounded-xl transition-all"
            title="Reset to factory circles"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>`;

  const newTarget = `      {/* Top Header Bar */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" /> Circle Master & Village Directory (ಸರ್ಕಲ್ ಮತ್ತು ಗ್ರಾಮಗಳ ವಹಿ)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              {circles.length} Circles • {directory.length} Mapped Villages
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Administrative cane circles, village mapping, regional in-charge officers and contact details
          </p>
        </div>

        {/* Action Buttons below header in a single row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> ಹೊಸ ಗ್ರಾಮ / ಸರ್ಕಲ್ ಸೇರಿಸಿ (+ Add Entry)
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Excel Upload
          </button>

          <button
            onClick={handleDownloadTemplateXlsx}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm cursor-pointer"
            title="Download Excel Template matching the 7 headers"
          >
            <Download className="w-4 h-4 text-teal-400" /> Excel Template (.xlsx)
          </button>

          <a
            href="./circle_details.csv"
            download="circle_details.csv"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" /> CSV
          </a>

          <button
            onClick={handleResetCircles}
            className="p-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
            title="Reset to factory circles"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>`;

  if (content.includes(oldTarget)) {
    content = content.replace(oldTarget, newTarget);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] CircleMaster.jsx updated');
  } else {
    console.error('[FAIL] CircleMaster.jsx target not found');
  }
}

// 4. ShareholderReports.jsx
{
  const filePath = path.join(rootDir, 'client/src/components/Reports/ShareholderReports.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  const oldTarget = `      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-3xl border border-slate-800 no-print shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-100 tracking-tight">
                  ಶೇರುದಾರರ ವಿವರ ವರದಿಗಳು (Shareholders Reports)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ಅಧಿಕೃತ ಲೆಕ್ಕಪರಿಶೋಧನಾ ವರದಿ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ಗ್ರಾಮವಾರು, ವರ್ಗವಾರು, ವಲಯವಾರು, ಶೇರುವಾರು, ಮಾಲೀಕತ್ವವಾರು, ದಿನಾಂಕವಾರು ಹಾಗೂ ಠರಾವುವಾರು ವರದಿಗಳು
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Filter Panel */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={\`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer \${
              showFilterDrawer || activeFiltersCount > 0
                ? 'bg-slate-800 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
            }\`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>ಫಿಲ್ಟರ್‌ಗಳು (Filters)</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Refresh Data */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
            title="Refresh Database Records"
          >
            <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin text-emerald-400' : ''}\`} />
          </button>

          {/* Print Official Report */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition-all cursor-pointer"
            title="Print Official Cooperative Society Audit Report"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>ವರದಿ ಮುದ್ರಿಸಿ (Print Report)</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            title="Export full reports to Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ಎಕ್ಸೆಲ್ ರಫ್ತು (Excel Export)</span>
          </button>
        </div>
      </div>`;

  const newTarget = `      {/* 1. Header Toolbar */}
      <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 no-print shadow-xl space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">
                ಶೇರುದಾರರ ವಿವರ ವರದಿಗಳು (Shareholders Reports)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                ಅಧಿಕೃತ ಲೆಕ್ಕಪರಿಶೋಧನಾ ವರದಿ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-4xl">
              ಗ್ರಾಮವಾರು, ವರ್ಗವಾರು, ವಲಯವಾರು, ಶೇರುವಾರು, ಮಾಲೀಕತ್ವವಾರು, ದಿನಾಂಕವಾರು ಹಾಗೂ ಠರಾವುವಾರು ವರದಿಗಳು
            </p>
          </div>
        </div>

        {/* Action Buttons below header in a single row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
          {/* Toggle Filter Panel */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={\`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer \${
              showFilterDrawer || activeFiltersCount > 0
                ? 'bg-slate-800 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
            }\`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>ಫಿಲ್ಟರ್‌ಗಳು (Filters)</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            title="Export full reports to Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ಎಕ್ಸೆಲ್ ರಫ್ತು (Excel Export)</span>
          </button>

          {/* Print Official Report */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition-all cursor-pointer"
            title="Print Official Cooperative Society Audit Report"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>ವರದಿ ಮುದ್ರಿಸಿ (Print Report)</span>
          </button>

          {/* Refresh Data */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
            title="Refresh Database Records"
          >
            <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin text-emerald-400' : ''}\`} />
          </button>
        </div>
      </div>`;

  if (content.includes(oldTarget)) {
    content = content.replace(oldTarget, newTarget);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] ShareholderReports.jsx updated');
  } else {
    console.error('[FAIL] ShareholderReports.jsx target not found');
  }
}

// 5. IDCardGenerator.jsx
{
  const filePath = path.join(rootDir, 'client/src/components/IDCards/IDCardGenerator.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  const oldTarget = `      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 no-print shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Contact className="w-5 h-5 text-emerald-400" /> ಸದಸ್ಯರ ಅಧಿಕೃತ ಗುರುತಿನ ಚೀಟಿ (Official Shareholder ID Cards)
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              B.S.S.K.N. Official Format
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-800">
              Google ಅನೇಕ ಕನ್ನಡ (Anek Kannada)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ. | Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Custom Uploads Settings Button */}
          <button
            onClick={() => setShowCustomizerModal(true)}
            className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer \${
              hasCustomizations
                ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/60 hover:bg-emerald-600/35 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
            }\`}
            title="Upload Custom Card Logo, Background or MD Signature"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>ಲೋಗೋ, ಹಿನ್ನೆಲೆ & MD ಸಹಿ</span>
            {hasCustomizations && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          {/* Reference Sample Comparison Toggle */}
          <button
            onClick={() => setShowReferenceSample(!showReferenceSample)}
            className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer \${
              showReferenceSample
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }\`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {showReferenceSample ? 'Hide Sample Reference' : 'Compare with Sample Photo'}
          </button>

          {/* Print Layout Format Toggle (A4 Sheet vs Single Card) */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold px-2 uppercase tracking-wider hidden lg:inline">ಫಾರ್ಮ್ಯಾಟ್:</span>
            <button
              onClick={() => handleSetPrintLayout('a4')}
              className={\`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer \${
                printLayout === 'a4'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
              title="A4 Sheet (Prints Front & Back side-by-side on A4 paper with Cut & Fold Guides)"
            >
              A4 ಹಾಳೆ (A4 Sheet)
            </button>
            <button
              onClick={() => handleSetPrintLayout('pvc')}
              className={\`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer \${
                printLayout === 'pvc'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
              title="Single Card Format (PVC Card / User Defined paper)"
            >
              PVC ಕಾರ್ಡ್ (Single)
            </button>
          </div>

          {/* Card Dimensions Size Toggle: 85.6mm x 54.0mm vs 95.0mm x 65.0mm */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold px-2 uppercase tracking-wider hidden lg:inline">ಕಾರ್ಡ್ ಗಾತ್ರ (Size):</span>
            <button
              onClick={() => handleSetCardSize('85x54')}
              className={\`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer \${
                cardSize === '85x54'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
              title="Standard CR80 / PVC Plastic Card (85.6mm × 54.0mm)"
            >
              85.6 × 54.0 mm
            </button>
            <button
              onClick={() => handleSetCardSize('95x65')}
              className={\`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer \${
                cardSize === '95x65'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
              title="Standard Laminated Paper Card (95.0mm × 65.0mm)"
            >
              95.0 × 65.0 mm
            </button>
          </div>
        </div>
      </div>`;

  const newTarget = `      {/* Header Bar */}
      <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 no-print shadow-xl space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Contact className="w-5 h-5 text-emerald-400" /> ಸದಸ್ಯರ ಅಧಿಕೃತ ಗುರುತಿನ ಚೀಟಿ (Official Shareholder ID Cards)
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              B.S.S.K.N. Official Format
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-800 font-mono">
              Google ಅನೇಕ ಕನ್ನಡ (Anek Kannada)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-4xl">
            ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ. | Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur
          </p>
        </div>

        {/* Action Controls below header in a single row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
          {/* Custom Uploads Settings Button */}
          <button
            onClick={() => setShowCustomizerModal(true)}
            className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer \${
              hasCustomizations
                ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/60 hover:bg-emerald-600/35 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
            }\`}
            title="Upload Custom Card Logo, Background or MD Signature"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>ಲೋಗೋ, ಹಿನ್ನೆಲೆ & MD ಸಹಿ</span>
            {hasCustomizations && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          {/* Reference Sample Comparison Toggle */}
          <button
            onClick={() => setShowReferenceSample(!showReferenceSample)}
            className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer \${
              showReferenceSample
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }\`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {showReferenceSample ? 'Hide Sample Reference' : 'Compare with Sample Photo'}
          </button>

          {/* Print Layout Format Toggle (A4 Sheet vs Single Card) */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold px-2 uppercase tracking-wider hidden lg:inline">ಫಾರ್ಮ್ಯಾಟ್:</span>
            <button
              onClick={() => handleSetPrintLayout('a4')}
              className={\`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer \${
                printLayout === 'a4'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
              title="A4 Sheet (Prints Front & Back side-by-side on A4 paper with Cut & Fold Guides)"
            >
              A4 ಹಾಳೆ (A4 Sheet)
            </button>
            <button
              onClick={() => handleSetPrintLayout('pvc')}
              className={\`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer \${
                printLayout === 'pvc'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
              title="Single Card Format (PVC Card / User Defined paper)"
            >
              PVC ಕಾರ್ಡ್ (Single)
            </button>
          </div>

          {/* Card Dimensions Size Toggle: 85.6mm x 54.0mm vs 95.0mm x 65.0mm */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold px-2 uppercase tracking-wider hidden lg:inline">ಕಾರ್ಡ್ ಗಾತ್ರ (Size):</span>
            <button
              onClick={() => handleSetCardSize('85x54')}
              className={\`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer \${
                cardSize === '85x54'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
              title="Standard CR80 / PVC Plastic Card (85.6mm × 54.0mm)"
            >
              85.6 × 54.0 mm
            </button>
            <button
              onClick={() => handleSetCardSize('95x65')}
              className={\`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer \${
                cardSize === '95x65'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
              title="Standard Laminated Paper Card (95.0mm × 65.0mm)"
            >
              95.0 × 65.0 mm
            </button>
          </div>
        </div>
      </div>`;

  if (content.includes(oldTarget)) {
    content = content.replace(oldTarget, newTarget);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] IDCardGenerator.jsx updated');
  } else {
    console.error('[FAIL] IDCardGenerator.jsx target not found');
  }
}
