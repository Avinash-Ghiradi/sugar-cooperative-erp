const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../client/src/components/Master/CircleMaster.jsx');
let content = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');

function doReplace(label, oldStr, newStr) {
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label} - Target string not found!`);
  }
}

// 1. Update lucide-react import to include Plus, Edit2
doReplace(
  'Import Plus and Edit2',
  `import {
  MapPin, Building2, Users, Upload, Download, FileSpreadsheet, Search, CheckCircle2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Phone, UserCheck, Layers,
  RefreshCw, Trash2, Filter, AlertCircle, FileCheck
} from 'lucide-react';`,
  `import {
  MapPin, Building2, Users, Upload, Download, FileSpreadsheet, Search, CheckCircle2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Phone, UserCheck, Layers,
  RefreshCw, Trash2, Filter, AlertCircle, FileCheck, Plus, Edit2
} from 'lucide-react';`
);

// 2. Add state and handlers
doReplace(
  'Add State Variables',
  `  // Upload Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);`,
  `  // Add/Edit Village Directory Entry Modal states
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [entryForm, setEntryForm] = useState({
    id: null,
    address: '',
    circle_name: '',
    taluk: '',
    district: 'ವಿಜಯಪುರ',
    pincode: '',
    circle_in_charge: '',
    contact_no: ''
  });

  // Edit Circle Metadata Modal states
  const [showCircleModal, setShowCircleModal] = useState(false);
  const [editingCircle, setEditingCircle] = useState(null);
  const [circleForm, setCircleForm] = useState({
    currentName: '',
    newName: '',
    taluk: '',
    district: 'ವಿಜಯಪುರ',
    circle_in_charge: '',
    contact_no: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);`
);

// 3. Add modal handlers before handleFileUpload
doReplace(
  'Add Modal Handlers',
  `  // Parse Excel / CSV files with the 7 headers:`,
  `  const handleOpenAddModal = (defaultCircle = '') => {
    let matchedCircle = null;
    if (defaultCircle) {
      matchedCircle = circles.find(c => (c.name || '').trim().toLowerCase() === defaultCircle.trim().toLowerCase());
    }
    setEditingEntry(null);
    setEntryForm({
      id: null,
      address: '',
      circle_name: defaultCircle || (circles[0]?.name || ''),
      taluk: matchedCircle?.taluk || 'ಇಂಡಿ',
      district: matchedCircle?.district || 'ವಿಜಯಪುರ',
      pincode: matchedCircle?.pincode || '',
      circle_in_charge: matchedCircle?.circle_in_charge || '',
      contact_no: matchedCircle?.contact_no || ''
    });
    setShowEntryModal(true);
  };

  const handleOpenEditEntry = (entry) => {
    setEditingEntry(entry);
    setEntryForm({
      id: entry.id || null,
      address: entry.address || entry.name || '',
      circle_name: entry.circle_name || '',
      taluk: entry.taluk || '',
      district: entry.district || 'ವಿಜಯಪುರ',
      pincode: entry.pincode || '',
      circle_in_charge: entry.circle_in_charge || '',
      contact_no: entry.contact_no || ''
    });
    setShowEntryModal(true);
  };

  const handleCircleChangeInEntryForm = (circleName) => {
    const matched = circles.find(c => (c.name || '').trim().toLowerCase() === (circleName || '').trim().toLowerCase());
    setEntryForm(prev => ({
      ...prev,
      circle_name: circleName,
      taluk: matched?.taluk || prev.taluk,
      district: matched?.district || prev.district,
      circle_in_charge: matched?.circle_in_charge || prev.circle_in_charge,
      contact_no: matched?.contact_no || prev.contact_no
    }));
  };

  const handleSaveEntry = async (e) => {
    e?.preventDefault();
    if (!entryForm.address.trim()) {
      showToast('ಗ್ರಾಮ / ಸ್ಥಳದ ಹೆಸರು ನಮೂದಿಸಿ (Address/Village is required)', 'error');
      return;
    }
    if (!entryForm.circle_name.trim()) {
      showToast('ಸರ್ಕಲ್ ಹೆಸರು ನಮೂದಿಸಿ (Circle name is required)', 'error');
      return;
    }

    setIsSubmitting(true);
    let res;
    if (editingEntry) {
      res = await ApiService.updateCircleDirectoryItem(editingEntry.id || editingEntry.address || editingEntry.name, entryForm);
    } else {
      res = await ApiService.addCircleDirectoryItem(entryForm);
    }
    setIsSubmitting(false);

    if (res && res.success) {
      showToast(res.message || 'ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!');
      setShowEntryModal(false);
      await loadData();
    } else {
      showToast(res?.message || 'ದೋಷ ಸಂಭವಿಸಿದೆ (Failed to save)', 'error');
    }
  };

  const handleDeleteEntry = async (entry) => {
    const addr = entry.address || entry.name || '';
    if (!window.confirm(\`ಗ್ರಾಮ / ಸ್ಥಳ "\${addr}" ವನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?\\n(Are you sure you want to delete "\${addr}" from directory?)\`)) {
      return;
    }

    const res = await ApiService.deleteCircleDirectoryItem(entry.id || addr);
    if (res && res.success) {
      showToast(res.message || 'ಗ್ರಾಮವನ್ನು ಅಳಿಸಲಾಗಿದೆ');
      await loadData();
    } else {
      showToast(res?.message || 'ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ', 'error');
    }
  };

  const handleOpenEditCircle = (circle) => {
    setEditingCircle(circle);
    setCircleForm({
      currentName: circle.name || '',
      newName: circle.name || '',
      taluk: circle.taluk || '',
      district: circle.district || 'ವಿಜಯಪುರ',
      circle_in_charge: circle.circle_in_charge || '',
      contact_no: circle.contact_no || ''
    });
    setShowCircleModal(true);
  };

  const handleSaveCircle = async (e) => {
    e?.preventDefault();
    if (!circleForm.newName.trim()) {
      showToast('ಸರ್ಕಲ್ ಹೆಸರು ನಮೂದಿಸಿ (Circle name is required)', 'error');
      return;
    }

    setIsSubmitting(true);
    const res = await ApiService.updateCircleMetadata(circleForm.currentName, {
      newName: circleForm.newName,
      taluk: circleForm.taluk,
      district: circleForm.district,
      circle_in_charge: circleForm.circle_in_charge,
      contact_no: circleForm.contact_no
    });
    setIsSubmitting(false);

    if (res && res.success) {
      showToast(res.message || 'ಸರ್ಕಲ್ ವಿವರ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!');
      setShowCircleModal(false);
      await loadData();
    } else {
      showToast(res?.message || 'ದೋಷ ಸಂಭವಿಸಿದೆ', 'error');
    }
  };

  // Parse Excel / CSV files with the 7 headers:`
);

// 4. Update Header Buttons
doReplace(
  'Header Add Button',
  `        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Upload Circle Excel (ಅಪ್ಲೋಡ್)
          </button>`,
  `        <div className="flex flex-wrap items-center gap-2">
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
          </button>`
);

// 5. Circle-wise List: add buttons in Circle Header Bar
doReplace(
  'Circle Header Action Buttons',
  `                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-teal-300 border border-teal-800/40 text-xs font-semibold font-mono flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-teal-400" />
                        {c.village_count || matchingVillages.length} Villages (ಗ್ರಾಮಗಳು)
                      </span>

                      {(c.shareholder_count || 0) > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold font-mono flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {c.shareholder_count.toLocaleString()} Shareholders
                        </span>
                      )}

                      <div className="p-1 rounded-lg text-slate-400 bg-slate-900/80 ml-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>`,
  `                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-teal-300 border border-teal-800/40 text-xs font-semibold font-mono flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-teal-400" />
                        {c.village_count || matchingVillages.length} Villages (ಗ್ರಾಮಗಳು)
                      </span>

                      {(c.shareholder_count || 0) > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold font-mono flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {c.shareholder_count.toLocaleString()} Shareholders
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 ml-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleOpenAddModal(c.name); }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-emerald-950/70 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-800 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                          title="Add Village to this Circle (+ ಗ್ರಾಮ ಸೇರಿಸಿ)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ ಗ್ರಾಮ</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleOpenEditCircle(c); }}
                          className="p-1.5 rounded-xl bg-slate-900 hover:bg-teal-950/70 text-slate-400 hover:text-teal-300 border border-slate-800 hover:border-teal-800 transition-all cursor-pointer"
                          title="Edit Circle Details (ಸರ್ಕಲ್ ತಿದ್ದುಪಡಿ)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-1 rounded-lg text-slate-400 bg-slate-900/80 ml-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>`
);

// 6. Circle-wise List: Table header & row actions
doReplace(
  'Village Table Header Actions',
  `                            <th className="py-2.5 px-4 w-12 font-mono">#</th>
                            <th className="py-2.5 px-4">Address (ಗ್ರಾಮ / ಸ್ಥಳ)</th>
                            <th className="py-2.5 px-4">Taluk (ತಾಲೂಕು)</th>
                            <th className="py-2.5 px-4">District (ಜಿಲ್ಲೆ)</th>
                            <th className="py-2.5 px-4">Pincode (ಪಿನ್‌ಕೋಡ್)</th>
                            <th className="py-2.5 px-4 text-center">Shareholders (ಷೇರುದಾರರು)</th>
                            <th className="py-2.5 px-4">Circle In-charge</th>
                            <th className="py-2.5 px-4">Contact No</th>
                          </tr>`,
  `                            <th className="py-2.5 px-4 w-12 font-mono">#</th>
                            <th className="py-2.5 px-4">Address (ಗ್ರಾಮ / ಸ್ಥಳ)</th>
                            <th className="py-2.5 px-4">Taluk (ತಾಲೂಕು)</th>
                            <th className="py-2.5 px-4">District (ಜಿಲ್ಲೆ)</th>
                            <th className="py-2.5 px-4">Pincode (ಪಿನ್‌ಕೋಡ್)</th>
                            <th className="py-2.5 px-4 text-center">Shareholders (ಷೇರುದಾರರು)</th>
                            <th className="py-2.5 px-4">Circle In-charge</th>
                            <th className="py-2.5 px-4">Contact No</th>
                            <th className="py-2.5 px-4 text-right">Actions (ಕ್ರಮಗಳು)</th>
                          </tr>`
);

doReplace(
  'Village Row Actions',
  `                              <td className="py-2 px-4 font-mono text-teal-400 text-[11px]">
                                {v.contact_no || c.contact_no || '—'}
                              </td>
                            </tr>`,
  `                              <td className="py-2 px-4 font-mono text-teal-400 text-[11px]">
                                {v.contact_no || c.contact_no || '—'}
                              </td>
                              <td className="py-2 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditEntry({ ...v, circle_name: v.circle_name || c.name })}
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-400 border border-slate-800 hover:border-emerald-800 transition-all cursor-pointer"
                                    title="Edit Village (ಗ್ರಾಮ ತಿದ್ದುಪಡಿ)"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEntry(v)}
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800 transition-all cursor-pointer"
                                    title="Delete Village (ಗ್ರಾಮ ಅಳಿಸಿ)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>`
);

doReplace(
  'Village Table Colspan',
  `<td colSpan="8" className="py-6 text-center text-slate-400">`,
  `<td colSpan="9" className="py-6 text-center text-slate-400">`
);

// 7. Circle Cards: Add buttons
doReplace(
  'Circle Cards Actions',
  `                  {/* Statistics Row */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-xs">
                    <div className="bg-slate-900/60 p-2 rounded-xl text-center">
                      <span className="text-slate-400 text-[10px]">Shareholders</span>
                      <div className="font-bold text-emerald-400 mt-0.5">{c.shareholder_count ?? 0}</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-xl text-center">
                      <span className="text-slate-400 text-[10px]">Total Shares</span>
                      <div className="font-bold text-slate-100 mt-0.5">{c.total_shares ?? 0}</div>
                    </div>
                  </div>`,
  `                  {/* Statistics Row */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-xs">
                    <div className="bg-slate-900/60 p-2 rounded-xl text-center">
                      <span className="text-slate-400 text-[10px]">Shareholders</span>
                      <div className="font-bold text-emerald-400 mt-0.5">{c.shareholder_count ?? 0}</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-xl text-center">
                      <span className="text-slate-400 text-[10px]">Total Shares</span>
                      <div className="font-bold text-slate-100 mt-0.5">{c.total_shares ?? 0}</div>
                    </div>
                  </div>

                  {/* Circle Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(c.name)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-emerald-950/60 text-emerald-400 border border-slate-800 hover:border-emerald-800 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + ಗ್ರಾಮ ಸೇರಿಸಿ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCircle(c)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-teal-950/60 text-slate-400 hover:text-teal-300 border border-slate-800 hover:border-teal-800 transition-all cursor-pointer"
                      title="Edit Circle Metadata (ಸರ್ಕಲ್ ತಿದ್ದುಪಡಿ)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>`
);

// 8. All Directory Table: Header & row actions
doReplace(
  'Directory Table Header Actions',
  `                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Address (ಷೇರುದಾರರ ಸ್ಥಳ - Place)</th>
                    <th className="py-3 px-4">Circle Name (ಒಳಪಟ್ಟ ಸರ್ಕಲ್)</th>
                    <th className="py-3 px-4">Taluk (ತಾಲೂಕು)</th>
                    <th className="py-3 px-4">District (ಜಿಲ್ಲೆ)</th>
                    <th className="py-3 px-4">Pincode (ಪಿನ್‌ಕೋಡ್)</th>
                    <th className="py-3 px-4 text-center">Shareholders (ಷೇರುದಾರರು)</th>
                    <th className="py-3 px-4">Circle In-charge (ಪ್ರಭಾರಿ)</th>
                    <th className="py-3 px-4">Contact No (ಸಂಪರ್ಕ)</th>
                  </tr>`,
  `                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Address (ಷೇರುದಾರರ ಸ್ಥಳ - Place)</th>
                    <th className="py-3 px-4">Circle Name (ಒಳಪಟ್ಟ ಸರ್ಕಲ್)</th>
                    <th className="py-3 px-4">Taluk (ತಾಲೂಕು)</th>
                    <th className="py-3 px-4">District (ಜಿಲ್ಲೆ)</th>
                    <th className="py-3 px-4">Pincode (ಪಿನ್‌ಕೋಡ್)</th>
                    <th className="py-3 px-4 text-center">Shareholders (ಷೇರುದಾರರು)</th>
                    <th className="py-3 px-4">Circle In-charge (ಪ್ರಭಾರಿ)</th>
                    <th className="py-3 px-4">Contact No (ಸಂಪರ್ಕ)</th>
                    <th className="py-3 px-4 text-right">Actions (ಕ್ರಮಗಳು)</th>
                  </tr>`
);

doReplace(
  'Directory Row Actions',
  `                      <td className="py-2.5 px-4 font-mono text-teal-400">
                        {row.contact_no || '—'}
                      </td>
                    </tr>`,
  `                      <td className="py-2.5 px-4 font-mono text-teal-400">
                        {row.contact_no || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEntry(row)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-400 border border-slate-800 hover:border-emerald-800 transition-all cursor-pointer"
                            title="Edit Entry (ಸ್ಥಳ ತಿದ್ದುಪಡಿ)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(row)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800 transition-all cursor-pointer"
                            title="Delete Entry (ಸ್ಥಳ ಅಳಿಸಿ)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>`
);

doReplace(
  'Directory Table Colspan',
  `<td colSpan="9" className="py-12 text-center text-slate-400">`,
  `<td colSpan="10" className="py-12 text-center text-slate-400">`
);

// 9. Append the two Modals before the closing </div> of the component
doReplace(
  'Append Modals at Component End',
  `      )}
    </div>
  );
}`,
  `      )}

      {/* Add / Edit Village Directory Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {editingEntry ? 'ಗ್ರಾಮ / ಸ್ಥಳ ನವೀಕರಿಸಿ (Edit Village Mapping)' : 'ಹೊಸ ಗ್ರಾಮ / ಸ್ಥಳ ಸೇರಿಸಿ (+ Add Village Mapping)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingEntry ? 'ಗ್ರಾಮದ ವಿವರ ಮತ್ತು ಸರ್ಕಲ್ ಮ್ಯಾಪಿಂಗ್ ತಿದ್ದುಪಡಿ' : 'ಹೊಸ ಗ್ರಾಮವನ್ನು ಸರ್ಕಲ್ ಮತ್ತು ತಾಲೂಕಿಗೆ ಮ್ಯಾಪ್ ಮಾಡಿ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEntryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>ಗ್ರಾಮ / ಸ್ಥಳದ ಹೆಸರು (Address / Village Name) *</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Place Key</span>
                </label>
                <input
                  type="text"
                  required
                  value={entryForm.address}
                  onChange={(e) => setEntryForm({ ...entryForm, address: e.target.value })}
                  placeholder="ಉದಾ: ಅಗರಖೇಡ, ಮರಗೂರ, ತಾಂಬಾ..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                />
                <p className="text-[10px] text-slate-500">
                  * ಷೇರುದಾರರ ಸ್ಥಳ (Place) ಈ ಹೆಸರಿಗೆ ಹೊಂದುವಂತೆ ಸರ್ಕಲ್ ಗುರುತಿಸಲ್ಪಡುತ್ತದೆ.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ಸರ್ಕಲ್ ಹೆಸರು (Circle Name) *
                  </label>
                  <input
                    type="text"
                    required
                    list="circle-names-list"
                    value={entryForm.circle_name}
                    onChange={(e) => handleCircleChangeInEntryForm(e.target.value)}
                    placeholder="ಸರ್ಕಲ್ ಆಯ್ಕೆಮಾಡಿ / ಬರೆಯಿರಿ..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                  <datalist id="circle-names-list">
                    {circles.map(c => (
                      <option key={c.name} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ತಾಲೂಕು (Taluk)
                  </label>
                  <input
                    type="text"
                    list="taluk-names-list"
                    value={entryForm.taluk}
                    onChange={(e) => setEntryForm({ ...entryForm, taluk: e.target.value })}
                    placeholder="ಉದಾ: ಇಂಡಿ, ಚಡಚಣ, ಸಿಂದಗಿ..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                  <datalist id="taluk-names-list">
                    {distinctTaluks.map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ಜಿಲ್ಲೆ (District)
                  </label>
                  <input
                    type="text"
                    value={entryForm.district}
                    onChange={(e) => setEntryForm({ ...entryForm, district: e.target.value })}
                    placeholder="ಉದಾ: ವಿಜಯಪುರ"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ಪಿನ್‌ಕೋಡ್ (Pincode)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={entryForm.pincode}
                    onChange={(e) => setEntryForm({ ...entryForm, pincode: e.target.value.replace(/\\D/g, '') })}
                    placeholder="ಉದಾ: 586209"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ಪ್ರಭಾರಿ ಅಧಿಕಾರಿ (Circle In-charge)
                  </label>
                  <input
                    type="text"
                    value={entryForm.circle_in_charge}
                    onChange={(e) => setEntryForm({ ...entryForm, circle_in_charge: e.target.value })}
                    placeholder="ಉದಾ: ಸಂಗಮೇಶ ಕುಂಬಾರ"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ಸಂಪರ್ಕ ಸಂಖ್ಯೆ (Contact No)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={entryForm.contact_no}
                    onChange={(e) => setEntryForm({ ...entryForm, contact_no: e.target.value })}
                    placeholder="ಉದಾ: 9845011221"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  ರದ್ದುಮಾಡಿ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> ಉಳಿಸಲಾಗುತ್ತಿದೆ...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {editingEntry ? 'ನವೀಕರಿಸಿ (Update)' : 'ಉಳಿಸಿ (Save Entry)'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Circle Metadata Modal */}
      {showCircleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    ಸರ್ಕಲ್ ವಿವರ ನವೀಕರಿಸಿ (Edit Circle Details)
                  </h3>
                  <p className="text-[11px] text-teal-400 font-medium">
                    ವಲಯ: {circleForm.currentName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCircleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCircle} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  ಸರ್ಕಲ್ ಹೆಸರು (Circle Name) *
                </label>
                <input
                  type="text"
                  required
                  value={circleForm.newName}
                  onChange={(e) => setCircleForm({ ...circleForm, newName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                />
                <p className="text-[10px] text-slate-500">
                  * ಹೆಸರು ಬದಲಾಯಿಸಿದರೆ ಈ ಸರ್ಕಲ್‌ಗೆ ಒಳಪಟ್ಟ ಎಲ್ಲ ಗ್ರಾಮಗಳು ಮತ್ತು ಷೇರುದಾರರ ವಿವರಗಳು ಸಹ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತವೆ.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ತಾಲೂಕು (Taluk)
                  </label>
                  <input
                    type="text"
                    list="circle-edit-taluks-list"
                    value={circleForm.taluk}
                    onChange={(e) => setCircleForm({ ...circleForm, taluk: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                  <datalist id="circle-edit-taluks-list">
                    {distinctTaluks.map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ಜಿಲ್ಲೆ (District)
                  </label>
                  <input
                    type="text"
                    value={circleForm.district}
                    onChange={(e) => setCircleForm({ ...circleForm, district: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ಪ್ರಭಾರಿ ಅಧಿಕಾರಿ (Circle In-charge)
                  </label>
                  <input
                    type="text"
                    value={circleForm.circle_in_charge}
                    onChange={(e) => setCircleForm({ ...circleForm, circle_in_charge: e.target.value })}
                    placeholder="ಪ್ರಭಾರಿ ಅಧಿಕಾರಿಯ ಹೆಸರು"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ಸಂಪರ್ಕ ಸಂಖ್ಯೆ (Contact No)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={circleForm.contact_no}
                    onChange={(e) => setCircleForm({ ...circleForm, contact_no: e.target.value })}
                    placeholder="ಮೊಬೈಲ್ ಸಂಖ್ಯೆ"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCircleModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  ರದ್ದುಮಾಡಿ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-950 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ನವೀಕರಿಸಿ (Save Circle)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Finished patch_circle_master.cjs');
