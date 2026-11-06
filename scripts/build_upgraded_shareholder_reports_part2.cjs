const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../client/src/components/Reports/ShareholderReports.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states inside ShareholderReports component
const stateTarget = `  const [sortField, setSortField] = useState('count');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'`;

const stateReplacement = `  const [sortField, setSortField] = useState('count');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const companyLogo = useCompanyLogo();
  const [logoError, setLogoError] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(() =>
    AVAILABLE_REPORT_COLUMNS.filter(c => c.defaultSelected).map(c => c.id)
  );

  // Column selection helpers
  const is15PresetActive = useMemo(() => {
    const default15 = AVAILABLE_REPORT_COLUMNS.filter(c => c.defaultSelected).map(c => c.id);
    return selectedColumns.length === 15 && default15.every(id => selectedColumns.includes(id));
  }, [selectedColumns]);

  const toggleColumn = (colId) => {
    setSelectedColumns(prev => {
      if (prev.includes(colId)) {
        if (prev.length <= 1) return prev; // Keep at least 1 column
        return prev.filter(id => id !== colId);
      } else {
        return [...prev, colId];
      }
    });
  };

  const select15ColumnsPreset = () => {
    const default15 = AVAILABLE_REPORT_COLUMNS.filter(c => c.defaultSelected).map(c => c.id);
    setSelectedColumns(default15);
  };

  const selectAllColumns = () => {
    setSelectedColumns(AVAILABLE_REPORT_COLUMNS.map(c => c.id));
  };

  const selectBasicColumns = () => {
    setSelectedColumns(['sl_no', 'date', 'shareholder_name', 'place', 'taluk', 'total_amount', 'number_of_shares', 'share_no', 'status']);
  };

  // Detailed calculation of statutory totals across filteredShareholders
  const detailedTotals = useMemo(() => {
    let sharesCount = 0;
    let capital = 0;
    let admission = 0;
    let grandTotal = 0;

    for (let i = 0; i < filteredShareholders.length; i++) {
      const s = filteredShareholders[i];
      const shares = getShareholderSharesCount(s) || 1;
      sharesCount += shares;

      let sAmt = parseFloat(s.share_amount);
      if (!sAmt || isNaN(sAmt)) {
        const isClassB = String(s.schedule_cast || s.category || '').toLowerCase().includes('ಬ');
        const tot = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || 0;
        if (tot >= 20000) {
          sAmt = isClassB ? (shares * 25000) : (shares * 24000);
        } else {
          sAmt = tot > 0 ? tot : (shares * 2000);
        }
      }
      const adm = parseFloat(s.admission_fee) || 570;
      const totAmt = parseFloat(s.total_amount) || (sAmt + adm);

      capital += sAmt;
      admission += adm;
      grandTotal += totAmt;
    }

    return {
      totalShares: sharesCount,
      totalShareCapital: capital,
      totalAdmissionFees: admission,
      totalCollection: grandTotal
    };
  }, [filteredShareholders]);

  // Value extractor for any column
  const getColValue = (s, colId, rowIdx) => {
    const shares = getShareholderSharesCount(s) || 1;
    let sAmt = parseFloat(s.share_amount);
    if (!sAmt || isNaN(sAmt)) {
      const isClassB = String(s.schedule_cast || s.category || '').toLowerCase().includes('ಬ');
      const tot = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || 0;
      if (tot >= 20000) {
        sAmt = isClassB ? (shares * 25000) : (shares * 24000);
      } else {
        sAmt = tot > 0 ? tot : (shares * 2000);
      }
    }
    const adm = parseFloat(s.admission_fee) || 570;
    const totAmt = parseFloat(s.total_amount) || (sAmt + adm);

    switch (colId) {
      case 'sl_no': return rowIdx;
      case 'date': return formatReportDate(s.date || s.reg_date || s.registration_date || s.tharava_date);
      case 'shareholder_name': return s.shareholder_name || s.name || s.full_name || '—';
      case 'place': return s.place || s.village_name || '—';
      case 'taluk': return s.taluk || (s.circle ? 'ಇಂಡಿ' : 'ಚಡಚಣ') || '—';
      case 'share_amount': return sAmt.toLocaleString('en-IN');
      case 'admission_fee': return adm.toLocaleString('en-IN');
      case 'total_amount': return totAmt.toLocaleString('en-IN');
      case 'receipt_no': return s.receipt_no || s.reciept || '—';
      case 'number_of_shares': return shares;
      case 'category': return s.schedule_cast || s.category || 'ಅ ವರ್ಗ';
      case 'tharava_date': return formatReportDate(s.tharava_date);
      case 'tharava_no': return s.tharava_no || '—';
      case 'share_no': return s.share_no || s.share_number || '—';
      case 'status': {
        const st = String(s.status || 'Active');
        return st.toLowerCase() === 'active' || st === 'ಸಕ್ರಿಯ' ? 'ಸಕ್ರಿಯ' : 'ಅರ್ಜಿ';
      }
      case 'district': return s.district || 'ವಿಜಯಪುರ';
      case 'circle': return s.circle || s.circle_name || '—';
      case 'book_no': return s.book_no || '—';
      case 'aadhaar_card_no': return s.aadhaar_card_no || s.aadhaar_ref || '—';
      case 'mobile_no': return s.mobile_no || s.mobile || '—';
      case 'ownership': return s.ownership || s.relationship || 'ಸ್ವಂತ (Self)';
      case 'member_type': return s.member_type || 'ವೈಯಕ್ತಿಕ (Individual)';
      case 'nominee_name': return s.nominee_name || '—';
      case 'address': return s.address || s.nagara || '—';
      case 'pin_code': return s.pin_code || '—';
      default: return s[colId] || '—';
    }
  };`;

// Use LF normalization for matching
const contentLf = content.replace(/\r\n/g, '\n');
const stateTargetLf = stateTarget.replace(/\r\n/g, '\n');
const stateReplacementLf = stateReplacement.replace(/\r\n/g, '\n');

if (contentLf.includes(stateTargetLf) && !contentLf.includes('companyLogo = useCompanyLogo()')) {
  content = contentLf.replace(stateTargetLf, stateReplacementLf);
  console.log('Added states and helper functions!');
} else {
  console.log('State target already present or not found.');
}

// 2. Add Print Modal Button in Top Action Bar
const btnTarget = `          {/* Print Official Report */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition-all cursor-pointer"
            title="Print Official Cooperative Society Audit Report"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>ವರದಿ ಮುದ್ರಿಸಿ (Print Report)</span>
          </button>`;

const btnReplacement = `          {/* 15-Col Statutory Register Print Modal */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            title="Open Official Statutory Register Print Modal with Zoom & Word Export"
          >
            <Printer className="w-4 h-4 text-emerald-100" />
            <span>15 ಕಾಲಂ ವಹಿ ಮುದ್ರಣ (Print Modal)</span>
          </button>

          {/* Print Official Report */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition-all cursor-pointer"
            title="Print Official Cooperative Society Audit Report"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>ವರದಿ ಮುದ್ರಿಸಿ (Print Report)</span>
          </button>`;

const btnTargetLf = btnTarget.replace(/\r\n/g, '\n');
const btnReplacementLf = btnReplacement.replace(/\r\n/g, '\n');
if (content.includes(btnTargetLf)) {
  content = content.replace(btnTargetLf, btnReplacementLf);
  console.log('Added Print Modal button in Action Bar!');
}

// 3. Update Tab 6 Label
content = content.replace(
  "<span>6. ಸದಸ್ಯರ ಸಮಗ್ರ ವಿವರ ಪಟ್ಟಿ (Detailed Register)</span>",
  "<span>6. ಶೇರುದಾರರ ನೋಂದಣಿ ವಹಿ (15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್)</span>"
);

// 4. Update Tab 6 detailed table rendering with exact 15-col statutory layout & header picker
const detailedSectionTarget = `            {/* 6. DETAILED MEMBERS REGISTER TABLE */}
            {reportMode === 'detailed' && (
              <div className="space-y-4">
                {/* Table Top Controls & Pagination (Screen Only) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 no-print">
                  <div className="flex items-center gap-2">
                    <span>ತೋರಿಸಲಾಗುತ್ತಿದೆ:</span>
                    <select
                      value={detailedPageSize}
                      onChange={(e) => {
                        const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                        setDetailedPageSize(val);
                        setDetailedPage(1);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none"
                    >
                      <option value={25}>25 ಪ್ರತಿ ಪುಟಕ್ಕೆ</option>
                      <option value={50}>50 ಪ್ರತಿ ಪುಟಕ್ಕೆ</option>
                      <option value={100}>100 ಪ್ರತಿ ಪುಟಕ್ಕೆ</option>
                      <option value={250}>250 ಪ್ರತಿ ಪುಟಕ್ಕೆ</option>
                      <option value="all">ಎಲ್ಲಾ {filteredShareholders.length} ಸದಸ್ಯರು (All)</option>
                    </select>
                    <span>| ಒಟ್ಟು <strong>{filteredShareholders.length}</strong> ಶೇರುದಾರರು</span>
                  </div>

                  {detailedPageSize !== 'all' && totalDetailedPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={detailedPage <= 1}
                        onClick={() => setDetailedPage(p => Math.max(1, p - 1))}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs px-2 text-slate-200">
                        ಪುಟ {detailedPage} / {totalDetailedPages}
                      </span>
                      <button
                        disabled={detailedPage >= totalDetailedPages}
                        onClick={() => setDetailedPage(p => Math.min(totalDetailedPages, p + 1))}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <TableScrollerContainer label="ಸದಸ್ಯರ ಸಂಪೂರ್ಣ ವಿವರ ವರದಿ (Scroll Members):">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 print:bg-gray-100 text-slate-300 print:text-black font-bold uppercase text-[10px] border-b border-slate-800 print:border-gray-400">
                      <tr>
                        <th className="py-2.5 px-2 text-center w-10">ಕ್ರ.ಸಂ.</th>
                        <th className="py-2.5 px-2 text-center">ಶೇರು ನಂ</th>
                        <th className="py-2.5 px-2 text-center">ಪುಸ್ತಕ ನಂ</th>
                        <th className="py-2.5 px-3">ಸದಸ್ಯರ ಹೆಸರು (Shareholder Name)</th>
                        <th className="py-2.5 px-2">ಸ್ಥಳ / ಗ್ರಾಮ (Place)</th>
                        <th className="py-2.5 px-2">ವಲಯ (Circle)</th>
                        <th className="py-2.5 px-2 text-center">ವರ್ಗ</th>
                        <th className="py-2.5 px-2 text-center">ಶೇರು</th>
                        <th className="py-2.5 px-2 text-right">ಮೊತ್ತ ₹</th>
                        <th className="py-2.5 px-2">ಮಾಲೀಕತ್ವ</th>
                        <th className="py-2.5 px-2">ನೋಂದಣಿ ದಿನಾಂಕ</th>
                        <th className="py-2.5 px-2">ಠರಾವು ನಂ. & ದಿನಾಂಕ</th>
                        <th className="py-2.5 px-2 text-center">ಸ್ಥಿತಿ</th>
                        <th className="py-2.5 px-2 text-center no-print">ವಿವರ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 print:divide-gray-300 text-slate-200 print:text-black">
                      {detailedPaginated.map((s, idx) => {
                        const rowIdx = detailedPageSize === 'all' ? idx + 1 : (detailedPage - 1) * detailedPageSize + idx + 1;
                        const shares = getShareholderSharesCount(s);
                        const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (shares * 2000);

                        return (
                          <tr key={s.id || s.shareholder_id || idx} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px]">{rowIdx}</td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-emerald-400 print:text-black">
                              {s.share_no || s.share_number}
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-400 text-[11px]">{s.book_no || '—'}</td>
                            <td className="py-2 px-3 font-semibold text-slate-100 print:text-black">
                              {s.shareholder_name || s.name}
                            </td>
                            <td className="py-2 px-2 font-medium text-slate-200 print:text-black">{s.place || s.village_name}</td>
                            <td className="py-2 px-2 text-slate-400">{s.circle || s.circle_name}</td>
                            <td className="py-2 px-2 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-emerald-300">
                                {s.schedule_cast || 'ಅ - ವರ್ಗ'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-slate-200 print:text-black">{shares}</td>
                            <td className="py-2 px-2 text-right font-mono font-semibold text-amber-300 print:text-black">
                              ₹ {amt.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-2 text-[11px] text-slate-300">
                              <span className={s.ownership?.includes('ವಾರಸ') ? 'text-amber-300 font-semibold' : ''}>
                                {s.ownership || s.relationship || 'ಸ್ವಂತ (Self)'}
                              </span>
                            </td>
                            <td className="py-2 px-2 font-mono text-[11px] text-slate-400">
                              {s.date || s.reg_date || s.registration_date || '—'}
                            </td>
                            <td className="py-2 px-2 font-mono text-[11px] text-slate-400">
                              {s.tharava_no ? \`\${s.tharava_no} (\${s.tharava_date || '—'})\` : '—'}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className={\`px-2 py-0.5 rounded-full text-[10px] font-semibold \${
                                (s.status || 'Active') === 'Active'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }\`}>
                                {s.status || 'Active'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center no-print">
                              <button
                                onClick={() => setActiveProfileId(s.shareholder_id || s.id)}
                                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-colors cursor-pointer"
                                title="ಸದಸ್ಯರ ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಿಸಿ"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-900/90 print:bg-gray-200 font-bold border-t-2 border-slate-700 print:border-black text-slate-100 print:text-black text-xs">
                      <tr>
                        <td colSpan={7} className="py-2.5 px-3 text-right uppercase tracking-wider">
                          ಒಟ್ಟು ({filteredShareholders.length} ಸದಸ್ಯರು):
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-extrabold text-sm">
                          {kpis.totalShares.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-amber-400 print:text-black font-extrabold text-sm">
                          ₹ {kpis.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td colSpan={5}></td>
                      </tr>
                    </tfoot>
                  </table>
                </TableScrollerContainer>`;

const detailedSectionReplacement = `            {/* 6. STATUTORY REGISTER WITH HEADER SELECTION (15-Column Layout matching official image) */}
            {reportMode === 'detailed' && (
              <div className="space-y-4">
                {/* Header / Column Selector Control (No-Print) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 no-print shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                          <span>ವರದಿ ಕಾಲಂ / ಹೆಡ್ಡರ್ ಆಯ್ಕೆ (Select Report Headers)</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {selectedColumns.length} ಕಾಲಂಗಳು
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          ವರದಿಯಲ್ಲಿ ನಿಮಗೆ ಅಗತ್ಯವಿರುವ ಕಾಲಂಗಳನ್ನು ಆರಿಸಿಕೊಳ್ಳಿ (Screen, Print & Excel will reflect selected columns)
                        </p>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={select15ColumnsPreset}
                        className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 \${
                          is15PresetActive
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                            : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                        }\`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>⭐ ಅಧಿಕೃತ 15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್ (15-Col Register)</span>
                      </button>

                      <button
                        type="button"
                        onClick={selectAllColumns}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ಎಲ್ಲಾ ಕಾಲಂಗಳು ({AVAILABLE_REPORT_COLUMNS.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={selectBasicColumns}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                      >
                        ಮೂಲಭೂತ 8 ಕಾಲಂಗಳು
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowColumnPicker(!showColumnPicker)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-700 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {showColumnPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{showColumnPicker ? 'ಕಾಲಂ ಪಟ್ಟಿ ಮುಚ್ಚಿ' : 'ಕಾಲಂಗಳನ್ನು ಬದಲಾಯಿಸಿ (Customize)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Column Checkboxes Grid */}
                  {showColumnPicker && (
                    <div className="pt-3 border-t border-slate-800 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>ಕಾಲಂ ಅನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ ಆನ್/ಆಫ್ ಮಾಡಿ:</span>
                        <span className="text-[11px] text-slate-500">ಕನಿಷ್ಠ 1 ಕಾಲಂ ಆಯ್ಕೆ ಅಗತ್ಯವಿದೆ</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {AVAILABLE_REPORT_COLUMNS.map(col => {
                          const isSelected = selectedColumns.includes(col.id);
                          return (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => toggleColumn(col.id)}
                              className={\`flex items-center gap-2 p-2 rounded-xl text-xs text-left border transition-all cursor-pointer \${
                                isSelected
                                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200 font-semibold shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                              }\`}
                            >
                              <div className={\`w-4 h-4 rounded flex items-center justify-center shrink-0 border \${
                                isSelected ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-700 bg-slate-900'
                              }\`}>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <div className="truncate">
                                <div className="truncate font-medium">{col.labelKn}</div>
                                <div className="text-[10px] text-slate-500 truncate">{col.labelEn}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Table Top Controls & Pagination (Screen Only) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 no-print">
                  <div className="flex items-center gap-2">
                    <span>ತೋರಿಸಲಾಗುತ್ತಿದೆ:</span>
                    <select
                      value={detailedPageSize}
                      onChange={(e) => {
                        const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                        setDetailedPageSize(val);
                        setDetailedPage(1);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none"
                    >
                      <option value={25}>25 ಪ್ರತಿ ಪುಟಕ್ಕೆ</option>
                      <option value={50}>50 ಪ್ರತಿ ಪುಟಕ್ಕೆ</option>
                      <option value={100}>100 ಪ್ರತಿ ಪುಟಕ್ಕೆ</option>
                      <option value={250}>250 ಪ್ರತಿ ಪುಟಕ್ಕೆ</option>
                      <option value="all">ಎಲ್ಲಾ {filteredShareholders.length} ಸದಸ್ಯರು (All)</option>
                    </select>
                    <span>| ಒಟ್ಟು <strong>{filteredShareholders.length}</strong> ಶೇರುದಾರರು</span>
                  </div>

                  {detailedPageSize !== 'all' && totalDetailedPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={detailedPage <= 1}
                        onClick={() => setDetailedPage(p => Math.max(1, p - 1))}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs px-2 text-slate-200">
                        ಪುಟ {detailedPage} / {totalDetailedPages}
                      </span>
                      <button
                        disabled={detailedPage >= totalDetailedPages}
                        onClick={() => setDetailedPage(p => Math.min(totalDetailedPages, p + 1))}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* EXACT STATUTORY REPORT CONTAINER (MATCHING ATTACHED IMAGE) */}
                <div className="bg-white text-black p-3 sm:p-5 rounded-2xl border-2 border-black shadow-2xl space-y-3 font-kannada">
                  {/* 1. Official Header Box */}
                  <div className="border-[2.5px] border-black bg-white text-black">
                    {/* Upper Main Section */}
                    <div className="flex items-center justify-between px-4 py-2">
                      {/* Left: Factory Emblem */}
                      <div className="w-28 flex items-center justify-center shrink-0">
                        <img
                          src={companyLogo}
                          alt="B.S.S.K.N Logo"
                          className="h-[78px] sm:h-[84px] w-auto object-contain"
                          onError={(e) => {
                            if (!logoError) {
                              setLogoError(true);
                              e.target.src = DEFAULT_LOGO_PATH;
                            }
                          }}
                        />
                      </div>

                      {/* Center: Title Hierarchy & Underline */}
                      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                        <h1 className="text-[23px] sm:text-[26px] font-bold tracking-tight text-black leading-snug">
                          ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ
                        </h1>
                        <h2 className="text-[11px] font-bold tracking-[0.18em] text-black uppercase font-sans mt-0.5">
                          SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR
                        </h2>
                        <div className="mt-1.5 w-full flex flex-col items-center">
                          <h3 className="text-[19px] sm:text-[22px] font-black text-black tracking-normal leading-snug">
                            {selectedColumns.length === 15 && is15PresetActive
                              ? 'ಶೇರು ವಿಭಾಗ - ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ವಹಿ (15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್)'
                              : \`ಶೇರು ವಿಭಾಗ - ಶೇರುದಾರರ ಅಧಿಕೃತ ವಹಿ (\${selectedColumns.length} ಕಾಲಂ ರಿಜಿಸ್ಟರ್)\`}
                          </h3>
                          <div className="w-full border-b-[2.5px] border-black mt-2"></div>
                        </div>
                      </div>

                      {/* Right: Handshake Emblem */}
                      <div className="w-28 flex items-center justify-center shrink-0">
                        <CooperativeHandshakeIcon className="w-24 h-16 sm:w-28 sm:h-18" />
                      </div>
                    </div>

                    {/* Lower Sub-bar: Taluk / District */}
                    <div className="border-t-[2.5px] border-black flex items-center justify-between px-6 py-1 bg-white text-black font-bold">
                      <div className="text-[14px] font-bold text-black">
                        ತಾಲೂಕು|| {filters.taluk || filters.place || 'ಚಡಚಣ'}
                      </div>
                      <div className="text-[12px] font-mono font-bold tracking-[0.25em] text-black text-center uppercase">
                        NEW SHAREHOLDER STATUTORY ENROLLMENT REGISTER
                      </div>
                      <div className="text-[14px] font-bold text-black">ಜಿಲ್ಲಾ|| ವಿಜಯಪುರ</div>
                    </div>
                  </div>

                  {/* 2. Scope & Financial Meta Banner */}
                  <div className="border border-black bg-slate-100 p-2 px-3 flex flex-wrap items-center justify-between gap-2 text-xs text-black font-medium">
                    <div>
                      <strong>ವ್ಯಾಪ್ತಿ (Scope):</strong> {activeFiltersCount > 0 ? 'ಶೋಧಿತ ದಾಖಲೆಗಳು' : 'ಎಲ್ಲಾ ದಾಖಲೆಗಳು'} ({filteredShareholders.length} ಜನ)
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-semibold">
                      <span>ದಿನಾಂಕ: {new Date().toLocaleDateString('en-GB')}</span>
                      <span>ಒಟ್ಟು ದಾಖಲೆಗಳು: <strong>{filteredShareholders.length}</strong></span>
                      <span>ಒಟ್ಟು ಶೇರುಗಳು: <strong>{detailedTotals.totalShares.toLocaleString('en-IN')}</strong></span>
                      <span>ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ: <strong>₹ {detailedTotals.totalCollection.toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>

                  {/* 3. The Statutory Table with Exact Selected Columns */}
                  <TableScrollerContainer label="ಅಧಿಕೃತ ವಹಿ ವರದಿ (Scroll Register):">
                    <table className="w-full border-collapse border border-black text-black text-[11px] bg-white">
                      <thead>
                        <tr className="bg-slate-200 border-b-2 border-black font-bold text-center">
                          {AVAILABLE_REPORT_COLUMNS.filter(col => selectedColumns.includes(col.id)).map(col => (
                            <th
                              key={col.id}
                              className={\`border border-black p-1.5 \${col.width} \${
                                col.align === 'left' ? 'text-left' : col.align === 'right' ? 'text-right' : 'text-center'
                              }\`}
                            >
                              {col.labelKn}
                            </th>
                          ))}
                          <th className="border border-black p-1.5 text-center w-12 no-print">ವಿವರ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedPaginated.length === 0 ? (
                          <tr>
                            <td colSpan={selectedColumns.length + 1} className="border border-black p-8 text-center text-slate-500 font-bold">
                              ಯಾವುದೇ ಶೇರುದಾರರ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ
                            </td>
                          </tr>
                        ) : (
                          detailedPaginated.map((s, idx) => {
                            const rowIdx = detailedPageSize === 'all' ? idx + 1 : (detailedPage - 1) * detailedPageSize + idx + 1;
                            const activeCols = AVAILABLE_REPORT_COLUMNS.filter(col => selectedColumns.includes(col.id));

                            return (
                              <tr key={s.id || s.shareholder_id || idx} className="border-b border-black/80 hover:bg-slate-50">
                                {activeCols.map(col => {
                                  const val = getColValue(s, col.id, rowIdx);
                                  const isBold = col.id === 'shareholder_name' || col.id === 'total_amount' || col.id === 'number_of_shares' || col.id === 'share_no';
                                  const isMono = col.id === 'sl_no' || col.id === 'date' || col.id === 'share_amount' || col.id === 'admission_fee' || col.id === 'total_amount' || col.id === 'receipt_no' || col.id === 'number_of_shares' || col.id === 'tharava_date' || col.id === 'tharava_no' || col.id === 'share_no';

                                  return (
                                    <td
                                      key={col.id}
                                      className={\`border border-black p-1 px-1.5 \${
                                        col.align === 'left' ? 'text-left' : col.align === 'right' ? 'text-right' : 'text-center'
                                      } \${isBold ? 'font-bold' : ''} \${isMono ? 'font-mono' : ''}\`}
                                    >
                                      {val}
                                    </td>
                                  );
                                })}
                                <td className="border border-black p-1 text-center no-print">
                                  <button
                                    onClick={() => setActiveProfileId(s.shareholder_id || s.id)}
                                    className="p-1 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 border border-slate-300 transition-colors cursor-pointer"
                                    title="ಸದಸ್ಯರ ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಿಸಿ"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}

                        {/* Grand Total Row */}
                        {filteredShareholders.length > 0 && (
                          <tr className="bg-slate-200 border-t-2 border-black font-bold text-black text-xs">
                            {AVAILABLE_REPORT_COLUMNS.filter(col => selectedColumns.includes(col.id)).map((col, cIdx) => {
                              if (cIdx === 0) {
                                return (
                                  <td
                                    key={col.id}
                                    className="border border-black p-1.5 text-center font-bold"
                                  >
                                    ಒಟ್ಟು
                                  </td>
                                );
                              }
                              if (col.id === 'shareholder_name') {
                                return (
                                  <td key={col.id} className="border border-black p-1.5 text-left font-bold">
                                    ಒಟ್ಟು {filteredShareholders.length} ಸದಸ್ಯರು
                                  </td>
                                );
                              }
                              if (col.id === 'share_amount') {
                                return (
                                  <td key={col.id} className="border border-black p-1.5 text-right font-mono font-bold">
                                    ₹ {detailedTotals.totalShareCapital.toLocaleString('en-IN')}
                                  </td>
                                );
                              }
                              if (col.id === 'admission_fee') {
                                return (
                                  <td key={col.id} className="border border-black p-1.5 text-right font-mono font-bold">
                                    ₹ {detailedTotals.totalAdmissionFees.toLocaleString('en-IN')}
                                  </td>
                                );
                              }
                              if (col.id === 'total_amount') {
                                return (
                                  <td key={col.id} className="border border-black p-1.5 text-right font-mono font-bold">
                                    ₹ {detailedTotals.totalCollection.toLocaleString('en-IN')}
                                  </td>
                                );
                              }
                              if (col.id === 'number_of_shares') {
                                return (
                                  <td key={col.id} className="border border-black p-1.5 text-center font-mono font-bold">
                                    {detailedTotals.totalShares.toLocaleString('en-IN')}
                                  </td>
                                );
                              }
                              return (
                                <td key={col.id} className="border border-black p-1.5 text-center">
                                  —
                                </td>
                              );
                            })}
                            <td className="border border-black p-1.5 no-print"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </TableScrollerContainer>
                </div>`;

const detailedSectionTargetLf = detailedSectionTarget.replace(/\r\n/g, '\n');
const detailedSectionReplacementLf = detailedSectionReplacement.replace(/\r\n/g, '\n');
if (content.includes(detailedSectionTargetLf)) {
  content = content.replace(detailedSectionTargetLf, detailedSectionReplacementLf);
  console.log('Replaced detailedSection with upgraded statutory 15-col register!');
} else {
  console.log('Could not find exact detailedSectionTarget in content.');
}

// 5. Update Excel export to use selectedColumns dynamically
const excelDetailedTarget = `      // 2. Always Export Detailed Members List Sheet
      const memberRows = [
        ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204'],
        ['ಶೇರುದಾರರ ಸದಸ್ಯರ ಸಮಗ್ರ ವಿವರ ವರದಿ (Detailed Shareholders Master Register)'],
        [\`ದಿನಾಂಕ: \${new Date().toLocaleDateString('kn-IN')} | ಫಿಲ್ಟರ್ ಮಾಡಿದ ಸದಸ್ಯರ ಸಂಖ್ಯೆ: \${filteredShareholders.length}\`],
        [],
        [
          'ಕ್ರ.ಸಂ.',
          'ಶೇರು ಸಂಖ್ಯೆ (Share No)',
          'ಪುಸ್ತಕ ನಂ (Book No)',
          'ಸದಸ್ಯರ ಹೆಸರು (Shareholder Name)',
          'ಸ್ಥಳ / ಗ್ರಾಮ (Place/Village)',
          'ವಲಯ (Circle)',
          'ತಾಲೂಕು (Taluk)',
          'ವರ್ಗ (Category)',
          'ಸದಸ್ಯರ ಪ್ರಕಾರ (Member Type)',
          'ಶೇರುಗಳ ಸಂಖ್ಯೆ (Shares)',
          'ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Amount)',
          'ಮಾಲೀಕತ್ವ / ಸಂಬಂಧ (Ownership)',
          'ನೋಂದಣಿ ದಿನಾಂಕ (Date)',
          'ಠರಾವು ಸಂಖ್ಯೆ (Tharava No)',
          'ಠರಾವು ದಿನಾಂಕ (Tharava Date)',
          'ನಾಮಿನಿ ಹೆಸರು (Nominee)',
          'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (Mobile)',
          'ಆಧಾರ್ ಸಂಖ್ಯೆ (Aadhaar)',
          'ಸ್ಥಿತಿ (Status)'
        ]
      ];

      filteredShareholders.forEach((s, idx) => {
        memberRows.push([
          idx + 1,
          s.share_no || s.share_number || '',
          s.book_no || '',
          s.shareholder_name || s.name || '',
          s.place || s.village_name || '',
          s.circle || s.circle_name || '',
          s.taluk || '',
          s.schedule_cast || '',
          s.member_type || '',
          getShareholderSharesCount(s),
          parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (getShareholderSharesCount(s) * 2000),
          s.ownership || s.relationship || 'ಸ್ವಂತ (Self)',
          s.date || s.reg_date || s.registration_date || '',
          s.tharava_no || '',
          s.tharava_date || '',
          s.nominee_name || '',
          s.mobile_no || s.mobile || '',
          s.aadhaar_card_no || s.aadhaar_ref || '',
          s.status || 'Active'
        ]);
      });`;

const excelDetailedReplacement = `      // 2. Export Detailed Members List Sheet with Selected Columns
      const activeCols = AVAILABLE_REPORT_COLUMNS.filter(c => selectedColumns.includes(c.id));
      const excelHeaders = activeCols.map(c => c.labelKn);
      const memberRows = [
        ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ'],
        ['SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR'],
        [\`ಶೇರು ವಿಭಾಗ - ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ವಹಿ (\${activeCols.length} ಕಾಲಂ ರಿಜಿಸ್ಟರ್)\`],
        [\`ದಿನಾಂಕ: \${new Date().toLocaleDateString('kn-IN')} | ವ್ಯಾಪ್ತಿ: \${filterSummary.join(', ') || 'ಶೋಧಿತ ಎಲ್ಲಾ ದಾಖಲೆಗಳು'} (\${filteredShareholders.length} ಜನ)\`],
        [\`ಒಟ್ಟು ದಾಖಲೆಗಳು: \${filteredShareholders.length} | ಒಟ್ಟು ಶೇರುಗಳು: \${detailedTotals.totalShares} | ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ: ₹ \${detailedTotals.totalCollection.toLocaleString('en-IN')}\`],
        [],
        excelHeaders
      ];

      filteredShareholders.forEach((s, idx) => {
        const row = activeCols.map(col => getColValue(s, col.id, idx + 1));
        memberRows.push(row);
      });`;

const excelDetailedTargetLf = excelDetailedTarget.replace(/\r\n/g, '\n');
const excelDetailedReplacementLf = excelDetailedReplacement.replace(/\r\n/g, '\n');
if (content.includes(excelDetailedTargetLf)) {
  content = content.replace(excelDetailedTargetLf, excelDetailedReplacementLf);
  console.log('Updated Excel Export with selectedColumns!');
} else {
  console.log('Could not find excelDetailedTarget in content.');
}

// 6. Add RegisterListPrintModal at the bottom before closing tag
const modalTarget = `      {/* Shareholder Profile Modal */}
      {activeProfileId && (
        <ShareholderProfile
          shareholderId={activeProfileId}
          onClose={() => setActiveProfileId(null)}
          initialTab="ledger"
        />
      )}`;

const modalReplacement = `      {/* Statutory Register Print Modal (Matching attached image) */}
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
      )}

      {/* Shareholder Profile Modal */}
      {activeProfileId && (
        <ShareholderProfile
          shareholderId={activeProfileId}
          onClose={() => setActiveProfileId(null)}
          initialTab="ledger"
        />
      )}`;

const modalTargetLf = modalTarget.replace(/\r\n/g, '\n');
const modalReplacementLf = modalReplacement.replace(/\r\n/g, '\n');
if (content.includes(modalTargetLf)) {
  content = content.replace(modalTargetLf, modalReplacementLf);
  console.log('Added RegisterListPrintModal portal component!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Upgraded ShareholderReports.jsx completed successfully!');
