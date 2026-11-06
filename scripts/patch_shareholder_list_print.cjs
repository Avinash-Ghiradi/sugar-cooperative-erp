const fs = require('fs');
const path = require('path');

const filePath = path.resolve('client/src/components/Shareholders/ShareholderList.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!code.includes('RegisterListPrintModal')) {
  code = code.replace(
    "import MergeSharesModal from './MergeSharesModal';",
    "import MergeSharesModal from './MergeSharesModal';\r\nimport RegisterListPrintModal from '../Common/RegisterListPrintModal';"
  );
  console.log('Added RegisterListPrintModal import');
}

// 2. Add print states
const stateMarker = "  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' (38 columns) or 'summary'";
const printStates = `  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' (38 columns) or 'summary'
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [allPrintRecords, setAllPrintRecords] = useState([]);
  const [loadingAllPrint, setLoadingAllPrint] = useState(false);

  const handleOpenPrintModal = async () => {
    setLoadingAllPrint(true);
    try {
      let rawRecords = await ApiService.getAllShareholdersRaw();
      if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
        rawRecords = shareholders;
      }
      let filtered = rawRecords;
      if (search) {
        const q = search.trim().toLowerCase().normalize('NFC');
        filtered = filtered.filter(s => {
          const name = (s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
          const shNo = String(s.share_no || s.share_number || '').toLowerCase();
          const slNo = String(s.sl_no || s.id || '').toLowerCase();
          const bNo = String(s.book_no || '').toLowerCase();
          const mob = String(s.mobile_no || s.mobile || '');
          const aadh = String(s.aadhaar_card_no || s.aadhaar_ref || '');
          const plc = String(s.place || s.village_name || '').toLowerCase().normalize('NFC');
          return name.includes(q) || shNo.includes(q) || slNo.includes(q) || bNo.includes(q) || mob.includes(q) || aadh.includes(q) || plc.includes(q);
        });
      }
      if (selectedVillage) {
        const vq = selectedVillage.trim().toLowerCase().normalize('NFC');
        filtered = filtered.filter(s => (s.place || s.village_name || '').trim().toLowerCase().normalize('NFC') === vq);
      }
      if (selectedCircle) {
        const cq = selectedCircle.trim().toLowerCase().normalize('NFC');
        filtered = filtered.filter(s => (s.circle || s.circle_name || '').trim().toLowerCase().normalize('NFC') === cq);
      }
      if (selectedStatus) {
        filtered = filtered.filter(s => (s.status || 'Active').toLowerCase() === selectedStatus.toLowerCase());
      }
      if (selectedBook) {
        filtered = filtered.filter(s => String(s.book_no || '').trim().toLowerCase() === selectedBook.trim().toLowerCase());
      }
      if (selectedCast) {
        filtered = filtered.filter(s => String(s.schedule_cast || '').trim().toLowerCase() === selectedCast.trim().toLowerCase());
      }
      if (selectedAmount) {
        const amtVal = parseFloat(selectedAmount);
        filtered = filtered.filter(s => (parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || 0) === amtVal);
      }
      setAllPrintRecords(filtered);
    } catch (e) {
      console.warn('Error loading print records, using current page:', e);
      setAllPrintRecords(shareholders);
    } finally {
      setLoadingAllPrint(false);
      setPrintModalOpen(true);
    }
  };`;

if (code.includes(stateMarker)) {
  code = code.replace(stateMarker, printStates);
  console.log('Added print states and handleOpenPrintModal');
}

// 3. Update the Print button in the header actions bar
const oldPrintBtn = `          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4 text-sky-400" /> Print
          </button>`;

const newPrintBtn = `          {/* Professional Print Button */}
          <button
            onClick={handleOpenPrintModal}
            disabled={loadingAllPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-950 disabled:opacity-50"
            title="ಅಧಿಕೃತ ಶಾಸನಬದ್ಧ ನಮೂನೆ ವಹಿ ಮುದ್ರಣ (Official Statutory Register Printout)"
          >
            <Printer className="w-4 h-4 text-emerald-100" />
            <span>{loadingAllPrint ? 'ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...' : 'ಶಾಸನಬದ್ಧ ಮುದ್ರಣ (Print)'}</span>
          </button>`;

if (code.includes(oldPrintBtn)) {
  code = code.replace(oldPrintBtn, newPrintBtn);
  console.log('Updated Print button (LF)');
} else if (code.includes(oldPrintBtn.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldPrintBtn.replace(/\n/g, '\r\n'), newPrintBtn.replace(/\n/g, '\r\n'));
  console.log('Updated Print button (CRLF)');
} else {
  console.error('Print button not found!');
}

// 4. Add no-print to Header Bar
code = code.replace(
  '<div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">',
  '<div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4 no-print">'
);
console.log('Added no-print to Header Bar');

// 5. Add no-print to Search/Filter Bar
code = code.replace(
  '<div className="flex flex-nowrap items-center gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 overflow-x-auto shadow-sm">',
  '<div className="flex flex-nowrap items-center gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 overflow-x-auto shadow-sm no-print">'
);
console.log('Added no-print to Search/Filter Bar');

// 6. Add no-print to Actions column th and td
code = code.replace(
  'sticky left-0 z-30 shadow-r border-r border-emerald-700/60 w-[130px] min-w-[130px]">Actions</th>',
  'sticky left-0 z-30 shadow-r border-r border-emerald-700/60 w-[130px] min-w-[130px] no-print">Actions</th>'
);
code = code.replace(
  'sticky left-0 z-10 shadow-r border-r border-slate-800 w-[130px] min-w-[130px]">',
  'sticky left-0 z-10 shadow-r border-r border-slate-800 w-[130px] min-w-[130px] no-print">'
);
console.log('Added no-print to Actions column');

// 7. Add no-print to Pagination Bar
code = code.replace(
  '<div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">',
  '<div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400 no-print">'
);
console.log('Added no-print to Pagination Bar');

// 8. Render RegisterListPrintModal at bottom of ShareholderList
const modalMountTarget = '      {/* Security PIN Modal before opening Edit Statutory Record */}';
const modalCode = `      {/* Official Statutory Register List Print Modal */}
      {printModalOpen && (
        <RegisterListPrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          type="shareholder"
          allRecords={allPrintRecords.length > 0 ? allPrintRecords : shareholders}
          filterSummary={{
            search: search,
            place: selectedVillage,
            circle: selectedCircle,
            category: selectedCast,
            status: selectedStatus,
            book: selectedBook,
            amount: selectedAmount
          }}
        />
      )}

      {/* Security PIN Modal before opening Edit Statutory Record */}`;

if (code.includes(modalMountTarget)) {
  code = code.replace(modalMountTarget, modalCode);
  console.log('Added RegisterListPrintModal portal');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated ShareholderList.jsx!');
