const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/IDCards/IDCardGenerator.jsx');
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

        <div className="flex flex-wrap items-center gap-2.5">`;

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
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">`;

if (content.includes(oldTarget)) {
  content = content.replace(oldTarget, newTarget);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] IDCardGenerator.jsx updated successfully');
} else {
  console.error('[FAIL] IDCardGenerator.jsx target not found');
  process.exit(1);
}
