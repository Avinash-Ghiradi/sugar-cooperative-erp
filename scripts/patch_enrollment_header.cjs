const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/Enrollment/NewShareholderModule.jsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const target = `      {/* Module Title & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-emerald-400" />
              <span>ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ (New Shareholder Enrollment)</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ಕಾರ್ಖಾನೆ ಠರಾವು, ₹24,000 ಶೇರು ಮೊತ್ತ, ₹570 ಪ್ರವೇಶ ಶುಲ್ಕ ಹಾಗೂ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ಹಂಚಿಕೆ ರಿಜಿಸ್ಟರ್
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* File input for import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors border border-slate-700"
            title="ಹೊರಗಿನ ಎಕ್ಸೆಲ್ ಫೈಲ್‌ನಿಂದ ಆಮದು ಮಾಡಿಕೊಳ್ಳಿ"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" /> ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors border border-slate-700"
            title="15 ಕಾಲಂಗಳ ಎಕ್ಸೆಲ್ ರಫ್ತು"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್
          </button>

          <button
            onClick={() => {
              setEditingRecord(null);
              setModalMode('register');
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950 hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + ಹೊಸ ನೋಂದಣಿ (New Enrollment)
          </button>
        </div>
      </div>`;

const replacement = `      {/* Module Title & Stats Banner */}
      <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-emerald-400" />
              <span>ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ (New Shareholder Enrollment)</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ಕಾರ್ಖಾನೆ ಠರಾವು, ₹24,000 ಶೇರು ಮೊತ್ತ, ₹570 ಪ್ರವೇಶ ಶುಲ್ಕ ಹಾಗೂ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ಹಂಚಿಕೆ ರಿಜಿಸ್ಟರ್
          </p>
        </div>

        {/* Action Buttons below header in a single row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
          {/* File input for import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700 cursor-pointer shadow-sm"
            title="ಹೊರಗಿನ ಎಕ್ಸೆಲ್ ಫೈಲ್‌ನಿಂದ ಆಮದು ಮಾಡಿಕೊಳ್ಳಿ"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" /> ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700 cursor-pointer shadow-sm"
            title="15 ಕಾಲಂಗಳ ಎಕ್ಸೆಲ್ ರಫ್ತು"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್
          </button>

          <button
            onClick={() => {
              setEditingRecord(null);
              setModalMode('register');
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950 hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> ಹೊಸ ನೋಂದಣಿ (New Enrollment)
          </button>
        </div>
      </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated NewShareholderModule.jsx header buttons layout!');
} else {
  console.error('Target not found!');
  process.exit(1);
}
