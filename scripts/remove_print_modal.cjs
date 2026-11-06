const fs = require('fs');
const path = require('path');

const filePath = path.resolve('client/src/components/Reports/ShareholderReports.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Remove import
const importTarget1 = "import RegisterListPrintModal from '../Common/RegisterListPrintModal';\r\n";
const importTarget2 = "import RegisterListPrintModal from '../Common/RegisterListPrintModal';\n";
if (code.includes(importTarget1)) {
  code = code.replace(importTarget1, '');
  console.log('Removed import (CRLF)');
} else if (code.includes(importTarget2)) {
  code = code.replace(importTarget2, '');
  console.log('Removed import (LF)');
}

// 2. Remove useState
const stateTarget1 = "  const [showPrintModal, setShowPrintModal] = useState(false);\r\n";
const stateTarget2 = "  const [showPrintModal, setShowPrintModal] = useState(false);\n";
if (code.includes(stateTarget1)) {
  code = code.replace(stateTarget1, '');
  console.log('Removed useState (CRLF)');
} else if (code.includes(stateTarget2)) {
  code = code.replace(stateTarget2, '');
  console.log('Removed useState (LF)');
}

// 3. Update detailedTotals guard
code = code.replace("if (reportMode !== 'detailed' && !showPrintModal)", "if (reportMode !== 'detailed')");
code = code.replace("}, [reportMode, showPrintModal, filteredShareholders, kpis]);", "}, [reportMode, filteredShareholders, kpis]);");
console.log('Updated detailedTotals');

// 4. Remove the button
const buttonTarget = `          {/* 15-Col Statutory Register Print Modal */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            title="Open Official Statutory Register Print Modal with Zoom & Word Export"
          >
            <Printer className="w-4 h-4 text-emerald-100" />
            <span>15 ಕಾಲಂ ವಹಿ ಮುದ್ರಣ (Print Modal)</span>
          </button>`;

if (code.includes(buttonTarget)) {
  code = code.replace(buttonTarget + '\n', '');
  console.log('Removed button (LF)');
} else if (code.includes(buttonTarget.replace(/\n/g, '\r\n'))) {
  code = code.replace(buttonTarget.replace(/\n/g, '\r\n') + '\r\n', '');
  console.log('Removed button (CRLF)');
} else {
  console.error('Button target not found!');
  process.exit(1);
}

// 5. Remove modal render
const modalTarget = `      {/* Statutory Register Print Modal (Matching attached image) */}
      {showPrintModal && (
        <RegisterListPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          type="enrollment"
          allRecords={filteredShareholders}
          initialScope="filtered"
          filterSummary={{
            category: filters.category,
            status: filters.status,
            taluk: filters.taluk,
            search: filters.search
          }}
        />
      )}`;

if (code.includes(modalTarget)) {
  code = code.replace(modalTarget + '\n', '');
  console.log('Removed modal render (LF)');
} else if (code.includes(modalTarget.replace(/\n/g, '\r\n'))) {
  code = code.replace(modalTarget.replace(/\n/g, '\r\n') + '\r\n', '');
  console.log('Removed modal render (CRLF)');
} else {
  console.error('Modal render target not found!');
  process.exit(1);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated ShareholderReports.jsx!');
