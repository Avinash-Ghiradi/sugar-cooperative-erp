import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  PackageCheck, Search, Printer, X, Save, Settings, ChevronDown, ChevronUp,
  MapPin, Sparkles, Filter, Check, ShieldCheck, History, Edit, FileText,
  CheckCircle2, AlertTriangle, Eye, RotateCcw, XCircle
} from 'lucide-react';

const MEMBER_TYPE_OPTIONS = ['-', 'ಮೃತ', 'ತಿದ್ದುಪಡಿ', 'ವಾರಸುದಾರರು', 'ವರ್ಗಾವಣೆ'];
const CATEGORY_OPTIONS = ['ಅ - ವರ್ಗ', 'ಬ - ವರ್ಗ', 'ಡ - ವರ್ಗ'];

const getSurname = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
};

export default function SugarAllotmentModule() {
  const { showToast, user } = useAuth();

  // All shareholders loaded from database
  const [allShareholders, setAllShareholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [circles, setCircles] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);

  // Filter States
  const [searchShareOrName, setSearchShareOrName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchSurname, setSearchSurname] = useState('');
  const [searchMemberType, setSearchMemberType] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchShareQty, setSearchShareQty] = useState('');

  // Circle & Place Filter States
  const [selectedCircle, setSelectedCircle] = useState('');
  const [placeFilterQuery, setPlaceFilterQuery] = useState('');
  const [selectedPlaces, setSelectedPlaces] = useState(new Set());

  // Collapsible Filter Sections (Default: hidden, and mutually exclusive accordion)
  const [openFilterAccordion, setOpenFilterAccordion] = useState(null);
  const isSearchOptionsOpen = openFilterAccordion === 'search';
  const isAddressOptionsOpen = openFilterAccordion === 'address';

  const toggleSearchOptions = () => {
    setOpenFilterAccordion(prev => prev === 'search' ? null : 'search');
  };

  const toggleAddressOptions = () => {
    setOpenFilterAccordion(prev => prev === 'address' ? null : 'address');
  };

  // Auto-suggestion for address field
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  // Active Filter Applied State (filtered list displayed in table)
  const [filteredShareholders, setFilteredShareholders] = useState([]);

  // In-line edits state: Map of id -> { member_type, mobile_no, remarks }
  const [editedRows, setEditedRows] = useState({});

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState(null); // single shareholder
  const [showBatchReceiptModal, setShowBatchReceiptModal] = useState(false); // all shareholders
  const [editShareholderModal, setEditShareholderModal] = useState(null); // click on share no
  const [pinInput, setPinInput] = useState('');
  const [pinVerified, setPinVerified] = useState(false);

  // Settings State (Loaded from localStorage or defaults matching Images 1 & 2)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('sugar_allotment_custom_settings');
    return saved ? JSON.parse(saved) : {
      // Header details
      org_name: 'Shree Bheemashankar Sahakari Sakkare Karkhane Ni., Margur',
      sub_title: 'Share Holders List',
      doc_title: 'General Board Meeting 2025 - 26 / 21-09-2026',

      // Columns for Print
      print_columns: {
        share_no: true,
        name: true,
        surname: false,
        address: true,
        category: true,
        share_qty: true,
        member_type: false,
        mobile_no: true,
        signature: false,
        remarks: true
      },

      // Exclude member types for printing
      exclude_member_types_print: [],

      // Sugar allotment configuration
      kg_per_share: 25,
      sugar_rate_per_kg: 20,
      receipt_year_code: '202627',

      // Receipt generation filters
      include_zero_shares_receipt: false,
      exclude_member_types_receipt: [],
      exclude_categories_receipt: []
    };
  });

  // Temp settings copy for settings modal
  const [tempSettings, setTempSettings] = useState(settings);

  // Load Shareholders & Circles on Mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const rawSh = await ApiService.getAllShareholdersRaw();
      const list = Array.isArray(rawSh) ? rawSh : [];
      setAllShareholders(list);
      setFilteredShareholders(list.slice(0, 324)); // Default initial display

      // Load circles and places
      const cRes = await ApiService.getCircles();
      if (cRes && cRes.data) {
        setCircles(cRes.data);
      }

      // Collect all unique places
      const pSet = new Set();
      list.forEach(s => {
        const p = (s.place || s.village_name || '').trim();
        if (p) pSet.add(p);
      });
      const sortedPlaces = Array.from(pSet).sort((a, b) => a.localeCompare(b, 'kn'));
      setAllPlaces(sortedPlaces);
    } catch (err) {
      console.error('Failed to load sugar allotment data:', err);
      showToast('Error loading data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Available places for selected circle
  const circlePlaces = useMemo(() => {
    if (!selectedCircle) return allPlaces;
    const cObj = circles.find(c => (c.name || '').trim() === selectedCircle.trim());
    if (cObj && Array.isArray(cObj.villages) && cObj.villages.length > 0) {
      return cObj.villages.sort((a, b) => a.localeCompare(b, 'kn'));
    }
    // Fallback: filter from allShareholders
    const set = new Set();
    allShareholders.forEach(s => {
      if ((s.circle || s.circle_name || '').trim() === selectedCircle.trim()) {
        const p = (s.place || s.village_name || '').trim();
        if (p) set.add(p);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'kn'));
  }, [selectedCircle, circles, allPlaces, allShareholders]);

  // Filtered places inside the address box search
  const visiblePlaces = useMemo(() => {
    if (!placeFilterQuery.trim()) return circlePlaces;
    const q = placeFilterQuery.trim().toLowerCase();
    return circlePlaces.filter(p => p.toLowerCase().includes(q));
  }, [circlePlaces, placeFilterQuery]);

  // Address suggestions for "ವಿಳಾಸದ ಮೂಲಕ ಬಲ್ಕ್ ನವೀಕರಣ"
  const handleAddressInputChange = (val) => {
    setSearchAddress(val);
    if (val.trim().length >= 1) {
      const q = val.trim().toLowerCase();
      const matches = allPlaces.filter(p => p.toLowerCase().includes(q)).slice(0, 8);
      setAddressSuggestions(matches);
      setShowAddressSuggestions(matches.length > 0);
    } else {
      setShowAddressSuggestions(false);
    }
  };

  // --- FILTER EXECUTION ---
  const applyFilters = () => {
    let result = [...allShareholders];

    // 1. Share number or name search
    if (searchShareOrName.trim()) {
      const raw = searchShareOrName.trim();
      if (raw.includes(',')) {
        // Comma-separated share numbers: exact match
        const parts = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        result = result.filter(s => {
          const sNo = String(s.share_no || s.share_number || '').trim().toLowerCase();
          return parts.includes(sNo);
        });
      } else {
        // Partial match
        const q = raw.toLowerCase().normalize('NFC');
        result = result.filter(s => {
          const name = (s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
          const sNo = String(s.share_no || s.share_number || '').toLowerCase();
          return name.includes(q) || sNo.includes(q);
        });
      }
    }

    // 2. Address / Place search
    if (searchAddress.trim()) {
      const q = searchAddress.trim().toLowerCase().normalize('NFC');
      result = result.filter(s => {
        const p = (s.place || s.village_name || '').toLowerCase().normalize('NFC');
        const addr = (s.address || '').toLowerCase().normalize('NFC');
        return p.includes(q) || addr.includes(q);
      });
    }

    // 3. Surname search
    if (searchSurname.trim()) {
      const q = searchSurname.trim().toLowerCase().normalize('NFC');
      result = result.filter(s => {
        const sn = getSurname(s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
        return sn.includes(q);
      });
    }

    // 4. Member type search
    if (searchMemberType && searchMemberType !== '-') {
      result = result.filter(s => {
        const mt = (editedRows[s.id]?.member_type || s.member_type || s.status || '').trim();
        return mt === searchMemberType;
      });
    }

    // 5. Category search
    if (searchCategory.trim()) {
      const q = searchCategory.trim().toLowerCase().normalize('NFC');
      result = result.filter(s => {
        const c = (s.schedule_cast || '').toLowerCase().normalize('NFC');
        return c.includes(q);
      });
    }

    // 6. Share quantity search
    if (searchShareQty.trim()) {
      const qty = parseInt(searchShareQty.trim(), 10);
      if (!isNaN(qty)) {
        result = result.filter(s => {
          const sQty = parseInt(s.number_of_shares, 10) || 1;
          return sQty === qty;
        });
      }
    }

    // 7. Circle & Places Checkboxes
    if (selectedCircle) {
      result = result.filter(s => (s.circle || s.circle_name || '').trim() === selectedCircle.trim());
    }
    if (selectedPlaces.size > 0) {
      result = result.filter(s => {
        const p = (s.place || s.village_name || '').trim();
        return selectedPlaces.has(p);
      });
    }

    setFilteredShareholders(result);
    showToast(`ಫಿಲ್ಟರ್ ಅನ್ವಯಿಸಲಾಗಿದೆ: ${result.length.toLocaleString()} ಶೇರುದಾರರು ಕಂಡುಬಂದಿದ್ದಾರೆ`);
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearchShareOrName('');
    setSearchAddress('');
    setSearchSurname('');
    setSearchMemberType('');
    setSearchCategory('');
    setSearchShareQty('');
    setSelectedCircle('');
    setPlaceFilterQuery('');
    setSelectedPlaces(new Set());
    setFilteredShareholders(allShareholders.slice(0, 324));
    showToast('ಎಲ್ಲಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ');
  };

  // Handle place checkbox selection
  const togglePlace = (placeName) => {
    const next = new Set(selectedPlaces);
    if (next.has(placeName)) {
      next.delete(placeName);
    } else {
      next.add(placeName);
    }
    setSelectedPlaces(next);
  };

  const toggleSelectAllPlaces = (checked) => {
    if (checked) {
      setSelectedPlaces(new Set(circlePlaces));
    } else {
      setSelectedPlaces(new Set());
    }
  };

  // Handle in-line cell edits
  const handleCellEdit = (id, field, value) => {
    setEditedRows(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  // Save all in-line edits to database
  const handleSaveEdits = async () => {
    const editIds = Object.keys(editedRows);
    if (editIds.length === 0) {
      showToast('ಯಾವುದೇ ಬದಲಾವಣೆಗಳನ್ನು ಮಾಡಲಾಗಿಲ್ಲ');
      return;
    }

    let updatedCount = 0;
    for (const id of editIds) {
      const changes = editedRows[id];
      try {
        await ApiService.updateShareholder(id, changes);
        updatedCount++;
      } catch (err) {
        console.error('Update error for id ' + id, err);
      }
    }

    showToast(`${updatedCount} ಶೇರುದಾರರ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಿ ಉಳಿಸಲಾಗಿದೆ!`);
    setEditedRows({});
    await loadInitialData();
  };

  // Save Settings Modal
  const handleSaveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem('sugar_allotment_custom_settings', JSON.stringify(tempSettings));
    setShowSettingsModal(false);
    showToast('ಸಕ್ಕರೆ ಹಂಚಿಕೆ ಮತ್ತು ಮುದ್ರಣ ಸಂರಚನೆ ಉಳಿಸಲಾಗಿದೆ!');
  };

  // Print filtered list according to print settings
  const handlePrintList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to print report', 'error');
      return;
    }

    const { org_name, sub_title, doc_title, print_columns, exclude_member_types_print } = settings;

    // Filter out excluded member types
    const printableRows = filteredShareholders.filter(s => {
      const mt = (editedRows[s.id]?.member_type || s.member_type || s.status || '-').trim();
      return !exclude_member_types_print.includes(mt);
    });

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">`;
    html += `<title>${doc_title || 'Sugar Allotment'}</title>`;
    html += `<style>
      body { font-family: 'Noto Sans Kannada', Arial, sans-serif; margin: 20px; font-size: 11px; color: #000; }
      .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
      .header h1 { margin: 0; font-size: 16px; font-weight: bold; }
      .header h2 { margin: 4px 0 0 0; font-size: 12px; font-weight: bold; }
      .header p { margin: 3px 0 0 0; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
      th { background-color: #f2f2f2; font-weight: bold; font-size: 10px; }
      .center { text-align: center; }
      .right { text-align: right; }
      .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 11px; }
      @media print { body { margin: 0; } }
    </style></head><body>`;

    html += `<div class="header">`;
    html += `<h1>${org_name}</h1>`;
    html += `<h2>${doc_title}</h2>`;
    html += `<p>${sub_title} • ದಿನಾಂಕ: ${new Date().toLocaleDateString('en-GB')} • ಒಟ್ಟು ಸದಸ್ಯರು: ${printableRows.length}</p>`;
    html += `</div>`;

    html += `<table><thead><tr>`;
    html += `<th class="center" style="width:30px;">ಕ್ರ.ಸಂ.</th>`;
    if (print_columns.share_no) html += `<th class="center" style="width:50px;">ಶೇರ್ ಸಂಖ್ಯೆ</th>`;
    if (print_columns.name) html += `<th>ಹೆಸರು</th>`;
    if (print_columns.surname) html += `<th>ಉಪನಾಮ</th>`;
    if (print_columns.address) html += `<th>ವಿಳಾಸ</th>`;
    if (print_columns.category) html += `<th class="center" style="width:50px;">ವರ್ಗ</th>`;
    if (print_columns.share_qty) html += `<th class="center" style="width:45px;">ಶೇರ್ ಪ್ರಮಾಣ</th>`;
    if (print_columns.member_type) html += `<th>ಸದಸ್ಯರ ಪ್ರಕಾರ</th>`;
    if (print_columns.mobile_no) html += `<th style="width:75px;">ಮೊಬೈಲ್ ನಂಬರ</th>`;
    if (print_columns.signature) html += `<th style="width:80px;">ಸಹಿ</th>`;
    if (print_columns.remarks) html += `<th>ಶೇರಾ</th>`;
    html += `</tr></thead><tbody>`;

    printableRows.forEach((s, idx) => {
      const surname = getSurname(s.shareholder_name || s.name || '');
      const shares = parseInt(s.number_of_shares, 10) || 1;
      const memType = editedRows[s.id]?.member_type || s.member_type || s.status || '-';
      const mob = editedRows[s.id]?.mobile_no !== undefined ? editedRows[s.id].mobile_no : (s.mobile_no || s.mobile || '');
      const rem = editedRows[s.id]?.remarks !== undefined ? editedRows[s.id].remarks : (s.remarks || '');

      html += `<tr>`;
      html += `<td class="center">${idx + 1}</td>`;
      if (print_columns.share_no) html += `<td class="center font-mono"><strong>${s.share_no || s.share_number || ''}</strong></td>`;
      if (print_columns.name) html += `<td><strong>${s.shareholder_name || s.name || ''}</strong></td>`;
      if (print_columns.surname) html += `<td>${surname}</td>`;
      if (print_columns.address) html += `<td>${s.place || s.village_name || ''}</td>`;
      if (print_columns.category) html += `<td class="center">${s.schedule_cast || 'ಅ - ವರ್ಗ'}</td>`;
      if (print_columns.share_qty) html += `<td class="center font-bold">${shares}</td>`;
      if (print_columns.member_type) html += `<td>${memType}</td>`;
      if (print_columns.mobile_no) html += `<td>${mob}</td>`;
      if (print_columns.signature) html += `<td></td>`;
      if (print_columns.remarks) html += `<td>${rem}</td>`;
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    html += `<div class="footer"><p>ಮುದ್ರಣ ದಿನಾಂಕ: ${new Date().toLocaleString('kn-IN')}</p><p>ಅಧಿಕೃತ ಸಹಿ / ಮೊಹರು</p></div>`;
    html += `</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  };

  // Qualified rows for "ಎಲ್ಲರಿಗೂ ರಶೀದಿ"
  const qualifiedForBatchReceipt = useMemo(() => {
    const { include_zero_shares_receipt, exclude_member_types_receipt, exclude_categories_receipt } = settings;
    return filteredShareholders.filter(s => {
      const shares = parseInt(s.number_of_shares, 10) || 0;
      if (!include_zero_shares_receipt && shares <= 0) return false;
      const mt = (editedRows[s.id]?.member_type || s.member_type || s.status || '-').trim();
      if (exclude_member_types_receipt.includes(mt)) return false;
      const cat = (s.schedule_cast || 'ಅ - ವರ್ಗ').trim();
      if (exclude_categories_receipt.includes(cat)) return false;
      return true;
    });
  }, [filteredShareholders, settings, editedRows]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }, []);

  return (
    <div className="space-y-4 text-xs">
      {/* FILTER PANEL (Matching Image 3) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5">
        {/* ROW 1: 3 Main Search Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Box 1: ಶೇರ್ ಸಂಖ್ಯೆ */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <label className="block text-slate-200 font-bold text-xs">ಶೇರ್ ಸಂಖ್ಯೆ:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ಶೇರ್ ಸಂಖ್ಯೆ ಅಥವಾ ಹೆಸರು (ಅಲ್ಪವಿರಾಮದಿಂದ)"
                value={searchShareOrName}
                onChange={(e) => setSearchShareOrName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={applyFilters}
                className="px-4 py-1.5 bg-[#1d70b8] hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
              >
                ಹುಡುಕಿ
              </button>
            </div>
          </div>

          {/* Box 2: ವಿಳಾಸದ ಮೂಲಕ ಬಲ್ಕ್ ನವೀಕರಣ */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5 relative">
            <label className="block text-slate-200 font-bold text-xs">ವಿಳಾಸದ ಮೂಲಕ ಬಲ್ಕ್ ನವೀಕರಣ:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ವಿಳಾಸ ಟೈಪ್ ಮಾಡಿ..."
                value={searchAddress}
                onChange={(e) => handleAddressInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={applyFilters}
                className="px-3.5 py-1.5 bg-[#1d70b8] hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> ಹುಡುಕಿ
              </button>
            </div>
            {/* Auto-suggestions dropdown */}
            {showAddressSuggestions && (
              <div className="absolute left-3 right-3 top-16 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800">
                {addressSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchAddress(item);
                      setShowAddressSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                  >
                    📍 {item}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-amber-400/90 flex items-center gap-1 mt-1">
              💡 ವಿಳಾಸ ಟೈಪ್ ಮಾಡಲು ಪ್ರಾರಂಭಿಸಿದಾಗ ಸ್ವಯಂ-ಸೂಚನೆಗಳು ಕಾಣಿಸುತ್ತವೆ
            </p>
          </div>

          {/* Box 3: ಉಪನಾಮದ ಮೂಲಕ ಬಲ್ಕ್ ನವೀಕರಣ */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <label className="block text-slate-200 font-bold text-xs">ಉಪನಾಮದ ಮೂಲಕ ಬಲ್ಕ್ ನವೀಕರಣ:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ಉಪನಾಮ ಟೈಪ್ ಮಾಡಿ..."
                value={searchSurname}
                onChange={(e) => setSearchSurname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={applyFilters}
                className="px-4 py-1.5 bg-[#1d70b8] hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
              >
                ಹುಡುಕಿ
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Section 1 Toggle */}
        <div>
          <button
            type="button"
            onClick={toggleSearchOptions}
            className="w-full py-1.5 px-3 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/60 text-blue-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
          >
            <span>🔍 ಹೆಚ್ಚಿನ ಹುಡುಕಾಟ ಆಯ್ಕೆಗಳು (ಸದಸ್ಯರ ಪ್ರಕಾರ / ವರ್ಗ / ಶೇರ್ ಪ್ರಮಾಣ)</span>
            {isSearchOptionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* ROW 2: Collapsible More Search Options */}
        {isSearchOptionsOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 animate-fadeIn">
            {/* Box 4: ಸದಸ್ಯರ ಪ್ರಕಾರ */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
              <label className="block text-slate-200 font-bold text-xs">ಸದಸ್ಯರ ಪ್ರಕಾರದ ಮೂಲಕ ಬಲ್ಕ್ ನವೀಕರಣ:</label>
              <div className="flex gap-2">
                <select
                  value={searchMemberType}
                  onChange={(e) => setSearchMemberType(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none cursor-pointer"
                >
                  <option value="">-- ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ --</option>
                  {MEMBER_TYPE_OPTIONS.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-4 py-1.5 bg-[#1d70b8] hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
                >
                  ಹುಡುಕಿ
                </button>
              </div>
            </div>

            {/* Box 5: ವರ್ಗ */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
              <label className="block text-slate-200 font-bold text-xs">ವರ್ಗದ ಮೂಲಕ ಬಲ್ಕ್ ನವೀಕರಣ:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ವರ್ಗ ಟೈಪ್ ಮಾಡಿ..."
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                />
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-4 py-1.5 bg-[#1d70b8] hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
                >
                  ಹುಡುಕಿ
                </button>
              </div>
            </div>

            {/* Box 6: ಶೇರ್ ಪ್ರಮಾಣ */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
              <label className="block text-slate-200 font-bold text-xs">ಶೇರ್ ಪ್ರಮಾಣದ ಮೂಲಕ ಬಲ್ಕ್ ನವೀಕರಣ:</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="ಶೇರ್ ಪ್ರಮಾಣ ಟೈಪ್ ಮಾಡಿ..."
                  value={searchShareQty}
                  onChange={(e) => setSearchShareQty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                />
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-4 py-1.5 bg-[#1d70b8] hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
                >
                  ಹುಡುಕಿ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Section 2 Toggle */}
        <div>
          <button
            type="button"
            onClick={toggleAddressOptions}
            className="w-full py-1.5 px-3 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/60 text-blue-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
          >
            <span>📍 ಹೆಚ್ಚಿನ ವಿಳಾಸ ಆಯ್ಕೆಗಳು (Circle / Address)</span>
            {isAddressOptionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* ROW 3: Circle & Address Checkbox Grid */}
        {isAddressOptionsOpen && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 animate-fadeIn">
            {/* Left: Circle (ಮಂಡಲ) */}
            <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
              <label className="block text-slate-200 font-bold text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Circle (ಮಂಡಲ):
              </label>
              <select
                value={selectedCircle}
                onChange={(e) => {
                  setSelectedCircle(e.target.value);
                  setSelectedPlaces(new Set());
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-2 text-xs text-slate-100 font-semibold outline-none cursor-pointer"
              >
                <option value="">-- ಎಲ್ಲಾ ಸರ್ಕಲ್‌ಗಳು (All Circles) --</option>
                {circles.map((c, i) => (
                  <option key={i} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Right: ವಿಳಾಸ (Address) with Place Checkboxes */}
            <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <label className="block text-slate-200 font-bold text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> ವಿಳಾಸ (Address):
              </label>

              {/* Sub search input & Select All */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="ವಿಳಾಸದ ಮೊದಲ ಅಕ್ಷರಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ"
                    value={placeFilterQuery}
                    onChange={(e) => setPlaceFilterQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setPlaceFilterQuery(''); setSelectedPlaces(new Set()); }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                >
                  ಸ್ಪಷ್ಟ
                </button>
                <label className="flex items-center gap-1.5 text-xs text-slate-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={circlePlaces.length > 0 && selectedPlaces.size === circlePlaces.length}
                    onChange={(e) => toggleSelectAllPlaces(e.target.checked)}
                    className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>ಎಲ್ಲಾ ಸ್ಥಳಗಳು</span>
                </label>
              </div>

              {/* Scrollable Checkbox Grid */}
              <div className="border border-slate-800 rounded-lg p-2 max-h-36 overflow-y-auto bg-slate-950/60 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {visiblePlaces.map((p, idx) => {
                  const isChecked = selectedPlaces.has(p);
                  return (
                    <label
                      key={idx}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                        isChecked ? 'bg-blue-950/80 text-blue-300 font-semibold' : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePlace(p)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="truncate">{p}</span>
                    </label>
                  );
                })}
              </div>

              {/* Counter and Submit Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {circlePlaces.length} ಸ್ಥಳಗಳಲ್ಲಿ <strong className="text-blue-400 font-bold">{selectedPlaces.size}</strong> ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ
                </span>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-5 py-1.5 bg-[#1d70b8] hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
                >
                  ಹುಡುಕಿ
                </button>
              </div>

              <p className="text-[10px] text-amber-400/90 leading-relaxed">
                💡 ವಿಳಾಸದ ಮೊದಲ ಅಕ್ಷರಗಳನ್ನು ಟೈಪ್ ಮಾಡಿದಾಗ ಹೊಂದಿರುವ ಸ್ಥಳಗಳು ಮಾತ್ರ ಕಾಣಿಸುತ್ತವೆ. ನಂತರ checkbox ಮೂಲಕ ಒಂದು ಅಥವಾ ಹೆಚ್ಚು ಸ್ಥಳಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ. "ಎಲ್ಲಾ ಸ್ಥಳಗಳು" ಆಯ್ಕೆ ಮಾಡಿದರೆ Circleನ ಎಲ್ಲಾ ಸ್ಥಳಗಳು ಆಯ್ಕೆಯಾಗುತ್ತವೆ.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* HELP BANNER (Matching Image 3 exact Kannada instruction) */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-950/70 to-slate-900/80 border border-blue-900/60 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed shadow-md">
        ಶೇರ್ ಸಂಖ್ಯೆ ಅಥವಾ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ (ಒಂದೇ ಪದ ಇದ್ದರೆ ಭಾಗಶಃ ಹೊಂದಾಣಿಕೆ, ಅಲ್ಪವಿರಾಮದಿಂದ ಬೇರ್ಪಡಿಸಿದ ಶೇರ್ ಸಂಖ್ಯೆಗಳಿಗೆ ನಿಖರ ಹೊಂದಾಣಿಕೆ ಮತ್ತು), ಅಥವಾ ವಿಳಾಸ/ಉಪನಾಮ/ವರ್ಗ/ಶೇರ್ ಪ್ರಮಾಣ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಸದಸ್ಯರ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ ಪಟ್ಟಿಯಿಂದ ಎಲ್ಲಾ ಶೇರುದಾರರನ್ನು ಒಟ್ಟಿಗೆ ನೋಡಿ/ಸಂಪಾದಿಸಿ. ಫಲಿತಾಂಶಗಳು ಒಂದೇ ಪಟ್ಟಿಯಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ. ಪ್ರತಿ ಸಾಲಿನ "ರಶೀದಿ" ಬಟನ್ ಬಳಸಿ ಸಕ್ಕರೆ ಹಂಚಿಕೆ ರಶೀದಿ ರಚಿಸಿ ಮುದ್ರಿಸಬಹುದು (ಪಿನ್ ಅಗತ್ಯವಿದೆ). ಯಾವುದೇ ಸಾಲಿನ ಶೇರ್ ಸಂಖ್ಯೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ಆ ಶೇರುದಾರರ ಹೆಸರು/ವಿಳಾಸ/ವರ್ಗ ಸಂಪಾದಿಸಬಹುದು (ಅಧಿಕೃತ ಪಿನ್ ಅಗತ್ಯ) ಮತ್ತು ಈ ಹಿಂದಿನ ಎಲ್ಲಾ ಬದಲಾವಣೆಗಳ ಇತಿಹಾಸವನ್ನು ನೋಡಬಹುದು. ವಿಳಾಸ ಕ್ಷೇತ್ರದಲ್ಲಿ ಟೈಪ್ ಮಾಡಲು ಪ್ರಾರಂಭಿಸಿದಾಗ ಸ್ವಯಂ-ಸೂಚನೆಗಳು ಕಾಣಿಸುತ್ತವೆ.
      </div>

      {/* ACTION & SUMMARY BAR (Matching Image 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 shadow-md">
        <div className="text-sm font-bold text-blue-400">
          {filteredShareholders.length} ಶೇರುದಾರರ್ ಕಂಡುಬಂದಿದ್ದಾರೆ
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Settings Button */}
          <button
            type="button"
            onClick={() => {
              setTempSettings(settings);
              setShowSettingsModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="ಹೆಡರ್ ವಿವರಗಳು, ಮುದ್ರಣ ಕಾಲಂಗಳು & ಸಕ್ಕರೆ ಹಂಚಿಕೆ ಸಂರಚನೆ"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>ಸೆಟ್ಟಿಂಗ್ಸ್</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveEdits}
            className="px-4 py-2 bg-[#1d70b8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            ಉಳಿಸಿ
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrintList}
            className="px-4 py-2 bg-[#00823b] hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            ಮುದ್ರಿಸಿ
          </button>

          {/* Receipt for All Button */}
          <button
            type="button"
            onClick={() => setShowBatchReceiptModal(true)}
            className="px-4 py-2 bg-[#5925dc] hover:bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            ಎಲ್ಲರಿಗೂ ರಶೀದಿ
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 bg-[#4a5568] hover:bg-slate-600 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            ಕ್ಲಿಯರ್
          </button>
        </div>
      </div>

      {/* TABLE DATA SECTION (Matching Image 3) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Table Top Info */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200">
          <span>ದಿನಾಂಕ: {todayStr}</span>
          <span className="text-blue-400">ಒಟ್ಟು: {filteredShareholders.length}</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 font-medium">
            ಶೇರುದಾರರ ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...
          </div>
        ) : filteredShareholders.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-medium space-y-2">
            <p>ಆಯ್ಕೆಮಾಡಿದ ಫಿಲ್ಟರ್‌ಗೆ ಯಾವುದೇ ಶೇರುದಾರರು ಕಂಡುಬಂದಿಲ್ಲ.</p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-1.5 bg-[#1d70b8] text-white rounded-lg text-xs font-bold"
            >
              ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              {/* Blue Header matching Image 3 */}
              <thead className="bg-[#0a4b78] text-white font-bold text-[11px] sticky top-0 z-20 select-none shadow">
                <tr className="border-b border-[#083b5f]">
                  <th className="py-3 px-3 text-center border-r border-[#083b5f]">ಕ್ರ.ಸಂ.</th>
                  <th className="py-3 px-3.5 border-r border-[#083b5f]">ಶೇರ್ ಸಂಖ್ಯೆ ▴▾</th>
                  <th className="py-3 px-4 border-r border-[#083b5f]">ಹೆಸರು ▴▾</th>
                  <th className="py-3 px-3 border-r border-[#083b5f]">ಉಪನಾಮ ▴▾</th>
                  <th className="py-3 px-3.5 border-r border-[#083b5f]">ವಿಳಾಸ ▴▾</th>
                  <th className="py-3 px-3 text-center border-r border-[#083b5f]">ವರ್ಗ ▴▾</th>
                  <th className="py-3 px-3 text-center border-r border-[#083b5f]">ಶೇರ್ ಪ್ರಮಾಣ ▴▾</th>
                  <th className="py-3 px-3.5 border-r border-[#083b5f]">ಸದಸ್ಯರ ಪ್ರಕಾರ ▴▾</th>
                  <th className="py-3 px-3 border-r border-[#083b5f]">ಮೊಬೈಲ್ ನಂಬರ</th>
                  <th className="py-3 px-3.5 text-center border-r border-[#083b5f]">ಸಹಿ</th>
                  <th className="py-3 px-3.5 border-r border-[#083b5f]">ಶೇರಾ</th>
                  <th className="py-3 px-3.5 text-center">ರಶೀದಿ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-100">
                {filteredShareholders.map((s, idx) => {
                  const surname = getSurname(s.shareholder_name || s.name || '');
                  const currentMemType = editedRows[s.id]?.member_type !== undefined ? editedRows[s.id].member_type : (s.member_type || s.status || '-');
                  const currentMob = editedRows[s.id]?.mobile_no !== undefined ? editedRows[s.id].mobile_no : (s.mobile_no || s.mobile || '');
                  const currentRem = editedRows[s.id]?.remarks !== undefined ? editedRows[s.id].remarks : (s.remarks || '');

                  return (
                    <tr key={s.id || idx} className="hover:bg-slate-900/70 transition-colors">
                      {/* 1. Sl No */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-300 border-r border-slate-800/60">
                        {idx + 1}
                      </td>

                      {/* 2. Share No (Clickable Blue Link) */}
                      <td className="py-2.5 px-3.5 border-r border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => {
                            setEditShareholderModal(s);
                            setPinInput('');
                            setPinVerified(false);
                          }}
                          className="font-bold text-[#1d70b8] hover:text-blue-400 underline cursor-pointer"
                          title="ಕ್ಲಿಕ್ ಮಾಡಿ ಆ ಶೇರುದಾರರ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ"
                        >
                          {s.share_no || s.share_number || '—'}
                        </button>
                      </td>

                      {/* 3. Name */}
                      <td className="py-2.5 px-4 font-semibold text-slate-100 border-r border-slate-800/60">
                        {s.shareholder_name || s.name || '—'}
                      </td>

                      {/* 4. Surname */}
                      <td className="py-2.5 px-3 text-slate-300 border-r border-slate-800/60">
                        {surname}
                      </td>

                      {/* 5. Address */}
                      <td className="py-2.5 px-3.5 text-slate-300 border-r border-slate-800/60">
                        {s.place || s.village_name || '—'}
                      </td>

                      {/* 6. Category */}
                      <td className="py-2.5 px-3 text-center text-slate-300 border-r border-slate-800/60">
                        {s.schedule_cast || 'ಅ - ವರ್ಗ'}
                      </td>

                      {/* 7. Share Qty */}
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400 border-r border-slate-800/60">
                        {s.number_of_shares || 1}
                      </td>

                      {/* 8. Member Type Dropdown */}
                      <td className="py-2 px-3 border-r border-slate-800/60">
                        <select
                          value={currentMemType}
                          onChange={(e) => handleCellEdit(s.id, 'member_type', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 outline-none cursor-pointer"
                        >
                          {MEMBER_TYPE_OPTIONS.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>

                      {/* 9. Mobile No Input */}
                      <td className="py-2 px-3 border-r border-slate-800/60">
                        <input
                          type="text"
                          value={currentMob}
                          onChange={(e) => handleCellEdit(s.id, 'mobile_no', e.target.value)}
                          className="w-28 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-mono outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* 10. Signature (Blank) */}
                      <td className="py-2.5 px-3.5 text-center border-r border-slate-800/60">
                        <span className="text-slate-600">—</span>
                      </td>

                      {/* 11. Remarks Input */}
                      <td className="py-2 px-3 border-r border-slate-800/60">
                        <input
                          type="text"
                          value={currentRem}
                          onChange={(e) => handleCellEdit(s.id, 'remarks', e.target.value)}
                          className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* 12. Receipt Purple Button */}
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveReceiptModal(s)}
                          className="px-3 py-1 bg-[#5925dc] hover:bg-purple-600 text-white font-bold rounded-md text-[11px] shadow transition-all cursor-pointer"
                        >
                          ರಶೀದಿ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SETTINGS / "ಹೆಡರ್ ವಿವರಗಳನ್ನು ಬದಲಾಯಿಸಿ" (Matching Images 1 & 2) */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-base font-bold text-blue-400 flex items-center gap-2">
                ಹೆಡರ್ ವಿವರಗಳನ್ನು ಬದಲಾಯಿಸಿ
              </h2>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-200">
              {/* 1. ಸಂಸ್ಥೆಯ ಹೆಸರು */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">ಸಂಸ್ಥೆಯ ಹೆಸರು</label>
                <input
                  type="text"
                  value={tempSettings.org_name}
                  onChange={(e) => setTempSettings({ ...tempSettings, org_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold outline-none focus:border-blue-500"
                />
              </div>

              {/* 2. ಉಪ ಶೀರ್ಷಿಕೆ (ದಿನಾಂಕ ಸ್ವಯಂಚಾಲಿತ) */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">ಉಪ ಶೀರ್ಷಿಕೆ (ದಿನಾಂಕ ಸ್ವಯಂಚಾಲಿತ)</label>
                <input
                  type="text"
                  value={tempSettings.sub_title}
                  onChange={(e) => setTempSettings({ ...tempSettings, sub_title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              {/* 3. ದಸ್ತಾವೇಜು ಶೀರ್ಷಿಕೆ */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">ದಸ್ತಾವೇಜು ಶೀರ್ಷಿಕೆ</label>
                <input
                  type="text"
                  value={tempSettings.doc_title}
                  onChange={(e) => setTempSettings({ ...tempSettings, doc_title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <hr className="border-slate-800" />

              {/* 4. ಮುದ್ರಣಕ್ಕೆ ಕಾಲಂಗಳು (Columns for Print) */}
              <div className="space-y-2">
                <label className="block text-blue-400 font-bold text-xs">ಮುದ್ರಣಕ್ಕೆ ಕಾಲಂಗಳು</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-400">
                    <input type="checkbox" checked disabled className="rounded text-blue-600 w-4 h-4" />
                    <span>ಶೇರ್ ಸಂಖ್ಯೆ (ಸ್ಥಿರ)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-400">
                    <input type="checkbox" checked disabled className="rounded text-blue-600 w-4 h-4" />
                    <span>ಹೆಸರು (ಸ್ಥಿರ)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.print_columns.surname}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        print_columns: { ...tempSettings.print_columns, surname: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>ಉಪನಾಮ</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.print_columns.address}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        print_columns: { ...tempSettings.print_columns, address: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>ವಿಳಾಸ</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.print_columns.category}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        print_columns: { ...tempSettings.print_columns, category: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>ವರ್ಗ</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.print_columns.share_qty}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        print_columns: { ...tempSettings.print_columns, share_qty: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>ಶೇರ್ ಪ್ರಮಾಣ</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.print_columns.member_type}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        print_columns: { ...tempSettings.print_columns, member_type: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>ಸದಸ್ಯರ ಪ್ರಕಾರ</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.print_columns.mobile_no}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        print_columns: { ...tempSettings.print_columns, mobile_no: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>ಮೊಬೈಲ್ ನಂಬರ</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.print_columns.signature}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        print_columns: { ...tempSettings.print_columns, signature: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>ಸಹಿ</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.print_columns.remarks}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        print_columns: { ...tempSettings.print_columns, remarks: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>ಶೇರಾ</span>
                  </label>
                </div>
              </div>

              {/* 5. ಮುದ್ರಣಕ್ಕೆ ಈ ಸದಸ್ಯರ ಪ್ರಕಾರದವರನ್ನು ಹೊರಗಿಡಿ */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-bold text-xs">
                  ಮುದ್ರಣಕ್ಕೆ ಈ ಸದಸ್ಯರ ಪ್ರಕಾರದವರನ್ನು ಹೊರಗಿಡಿ
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {MEMBER_TYPE_OPTIONS.map((opt, i) => {
                    const isEx = tempSettings.exclude_member_types_print.includes(opt);
                    return (
                      <label key={i} className="flex items-center gap-2 text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEx}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...tempSettings.exclude_member_types_print, opt]
                              : tempSettings.exclude_member_types_print.filter(x => x !== opt);
                            setTempSettings({ ...tempSettings, exclude_member_types_print: next });
                          }}
                          className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* 6. ಸಕ್ಕರೆ ಹಂಚಿಕೆ ಸಂರಚನೆ (Sugar Allotment Configuration) */}
              <div className="space-y-3">
                <label className="block text-blue-400 font-bold text-xs">ಸಕ್ಕರೆ ಹಂಚಿಕೆ ಸಂರಚನೆ</label>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">ಪ್ರತಿ ಶೇರ್‌ಗೆ ಕೆಜಿ</label>
                  <input
                    type="number"
                    value={tempSettings.kg_per_share}
                    onChange={(e) => setTempSettings({ ...tempSettings, kg_per_share: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">ಸಕ್ಕರೆ ದರ (Rs / ಕೆಜಿ)</label>
                  <input
                    type="number"
                    value={tempSettings.sugar_rate_per_kg}
                    onChange={(e) => setTempSettings({ ...tempSettings, sugar_rate_per_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-blue-500 font-bold text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    ರಶೀದಿ ವರ್ಷ ಕೋಡ್ (ಖಾಲಿ ಬಿಟ್ಟರೆ ಸ್ವಯಂಚಾಲಿತ, ಉದಾ: 202526)
                  </label>
                  <input
                    type="text"
                    value={tempSettings.receipt_year_code}
                    onChange={(e) => setTempSettings({ ...tempSettings, receipt_year_code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* 7. ರಶೀದಿ ರಚನೆ ಫಿಲ್ಟರ್‌ಗಳು ("ಎಲ್ಲರಿಗೂ ರಶೀದಿ" ಬಟನ್‌ಗೆ ಮಾತ್ರ) */}
              <div className="space-y-3">
                <label className="block text-blue-400 font-bold text-xs">
                  ರಶೀದಿ ರಚನೆ ಫಿಲ್ಟರ್‌ಗಳು ("ಎಲ್ಲರಿಗೂ ರಶೀದಿ" ಬಟನ್‌ಗೆ ಮಾತ್ರ)
                </label>

                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempSettings.include_zero_shares_receipt}
                    onChange={(e) => setTempSettings({ ...tempSettings, include_zero_shares_receipt: e.target.checked })}
                    className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                  />
                  <span>ಶೇರ್ ಪ್ರಮಾಣ ಸೊನ್ನೆ (0) ಇರುವವರಿಗೂ ರಶೀದಿ ಸೇರಿಸಿ</span>
                </label>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-bold text-xs">ಈ ಸದಸ್ಯರ ಪ್ರಕಾರದವರನ್ನು ಹೊರಗಿಡಿ</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {MEMBER_TYPE_OPTIONS.map((opt, i) => {
                      const isEx = tempSettings.exclude_member_types_receipt.includes(opt);
                      return (
                        <label key={i} className="flex items-center gap-2 text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEx}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...tempSettings.exclude_member_types_receipt, opt]
                                : tempSettings.exclude_member_types_receipt.filter(x => x !== opt);
                              setTempSettings({ ...tempSettings, exclude_member_types_receipt: next });
                            }}
                            className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-bold text-xs">ಈ ವರ್ಗದವರನ್ನು ಹೊರಗಿಡಿ (ಐಚ್ಛಿಕ)</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {CATEGORY_OPTIONS.map((cat, i) => {
                      const isEx = tempSettings.exclude_categories_receipt.includes(cat);
                      return (
                        <label key={i} className="flex items-center gap-2 text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEx}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...tempSettings.exclude_categories_receipt, cat]
                                : tempSettings.exclude_categories_receipt.filter(x => x !== cat);
                              setTempSettings({ ...tempSettings, exclude_categories_receipt: next });
                            }}
                            className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                          />
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Buttons matching Image 2 */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-[#1d70b8] hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                ಉಳಿಸಿ
              </button>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-[#4a5568] hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                ರದ್ದುಮಾಡಿ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SINGLE SUGAR RECEIPT MODAL ("ರಶೀದಿ") */}
      {/* ========================================================================= */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                ಸಕ್ಕರೆ ಹಂಚಿಕೆ ರಶೀದಿ (Sugar Allotment Receipt)
              </h2>
              <button
                onClick={() => setActiveReceiptModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview Box */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div id="singleReceiptPrintArea" className="bg-white text-slate-950 p-5 rounded-2xl border border-slate-300 shadow-sm space-y-3">
                <div className="text-center border-b pb-2">
                  <h3 className="font-bold text-sm leading-tight text-emerald-900">
                    {settings.org_name}
                  </h3>
                  <p className="text-[10px] text-slate-600 font-semibold">
                    ಸಕ್ಕರೆ ಹಂಚಿಕೆ ರಶೀದಿ / Sugar Distribution Receipt
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                    ವರ್ಷ ಕೋಡ್: {settings.receipt_year_code} • ರಶೀದಿ ನಂ: REC-{settings.receipt_year_code}-{String(activeReceiptModal.share_no || activeReceiptModal.id).padStart(5, '0')}
                  </p>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">ಶೇರುದಾರರ ಹೆಸರು:</span>
                    <strong className="text-slate-900">{activeReceiptModal.shareholder_name || activeReceiptModal.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ಶೇರ್ ಸಂಖ್ಯೆ:</span>
                    <strong className="font-mono text-blue-800">{activeReceiptModal.share_no || activeReceiptModal.share_number}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ಸ್ಥಳ / ಗ್ರಾಮ:</span>
                    <span>{activeReceiptModal.place || activeReceiptModal.village_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ಸರ್ಕಲ್:</span>
                    <span>{activeReceiptModal.circle || activeReceiptModal.circle_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ದಿನಾಂಕ:</span>
                    <span>{todayStr}</span>
                  </div>
                </div>

                <div className="border-t border-b py-2 my-2 space-y-1 text-[11px] bg-slate-50 p-2.5 rounded-xl">
                  {(() => {
                    const shares = parseInt(activeReceiptModal.number_of_shares, 10) || 1;
                    const kg = shares * settings.kg_per_share;
                    const totalAmt = kg * settings.sugar_rate_per_kg;
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>ಹೊಂದಿರುವ ಶೇರುಗಳು:</span>
                          <strong className="font-bold">{shares}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>ಪ್ರತಿ ಶೇರ್‌ಗೆ ಕೋಟಾ:</span>
                          <span>{settings.kg_per_share} ಕೆಜಿ</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-800">
                          <span>ಒಟ್ಟು ಅರ್ಹ ಸಕ್ಕರೆ:</span>
                          <span className="text-sm">{kg} ಕೆಜಿ</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ದರ (ಪ್ರತಿ ಕೆಜಿಗೆ):</span>
                          <span>₹ {settings.sugar_rate_per_kg}.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-950 border-t pt-1 mt-1 text-xs">
                          <span>ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ:</span>
                          <span className="text-emerald-700 font-mono">₹ {totalAmt.toLocaleString()}.00</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="pt-4 flex justify-between text-[10px] text-slate-500 text-center">
                  <div>
                    <div className="h-6"></div>
                    <div className="border-t border-slate-400 pt-1">ಶೇರುದಾರರ ಸಹಿ</div>
                  </div>
                  <div>
                    <div className="h-6"></div>
                    <div className="border-t border-slate-400 pt-1">ವಿತರಣಾಧಿಕಾರಿ</div>
                  </div>
                  <div>
                    <div className="h-6"></div>
                    <div className="border-t border-slate-400 pt-1">ಕಚೇರಿ ಮೊಹರು</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const printContent = document.getElementById('singleReceiptPrintArea');
                  const win = window.open('', '_blank');
                  win.document.write(`<html><head><title>Sugar Receipt</title><style>body{margin:20px; font-family:sans-serif;}</style></head><body>${printContent.innerHTML}</body></html>`);
                  win.document.close();
                  win.focus();
                  setTimeout(() => win.print(), 300);
                }}
                className="px-5 py-2 bg-[#00823b] hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> ರಶೀದಿ ಮುದ್ರಿಸಿ
              </button>
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                ಮುಚ್ಚಿ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BATCH RECEIPT MODAL ("ಎಲ್ಲರಿಗೂ ರಶೀದಿ") */}
      {/* ========================================================================= */}
      {showBatchReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                ಬಲ್ಕ್ ಸಕ್ಕರೆ ಹಂಚಿಕೆ ರಶೀದಿಗಳು (Batch Receipts)
              </h2>
              <button
                onClick={() => setShowBatchReceiptModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-200">
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-900/50 space-y-2">
                <p className="font-bold text-purple-200 text-sm">
                  ಅರ್ಹ ಶೇರುದಾರರ ಸಂಖ್ಯೆ: {qualifiedForBatchReceipt.length.toLocaleString()} ಸದಸ್ಯರು
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  ಸೆಟ್ಟಿಂಗ್ಸ್ ಪ್ರಕಾರ (ಸೊನ್ನೆ ಶೇರು, ಹೊರಗಿಡಲಾದ ಸದಸ್ಯರ ಪ್ರಕಾರ ಮತ್ತು ವರ್ಗಗಳನ್ನು ಲೆಕ್ಕಿಸದೆ) ಈ ಕೆಳಗಿನ ಸಾರಾಂಶದಂತೆ ರಶೀದಿಗಳು ರಚಿಸಲ್ಪಡುತ್ತವೆ:
                </p>
                {(() => {
                  let totalKg = 0;
                  let totalAmt = 0;
                  qualifiedForBatchReceipt.forEach(s => {
                    const sh = parseInt(s.number_of_shares, 10) || 1;
                    const kg = sh * settings.kg_per_share;
                    totalKg += kg;
                    totalAmt += kg * settings.sugar_rate_per_kg;
                  });
                  return (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">ಒಟ್ಟು ಸಕ್ಕರೆ ಕೋಟಾ:</span>
                        <strong className="text-emerald-400 text-sm">{totalKg.toLocaleString()} ಕೆಜಿ</strong>
                      </div>
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">ಒಟ್ಟು ಪಾವತಿ ಮೊತ್ತ:</span>
                        <strong className="text-purple-300 text-sm font-mono">₹ {totalAmt.toLocaleString()}</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <p className="text-[11px] text-slate-400">
                ಮುದ್ರಣ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿದಾಗ ಎಲ್ಲಾ {qualifiedForBatchReceipt.length} ರಶೀದಿಗಳನ್ನು ಒಂದೇ ಮುದ್ರಣ ಪಟ್ಟಿಯಲ್ಲಿ ಪ್ರಿಂಟ್ ಮಾಡಬಹುದು.
              </p>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const win = window.open('', '_blank');
                  let bHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Batch Sugar Receipts</title><style>
                    body { font-family: sans-serif; margin: 15px; font-size: 11px; }
                    .voucher { border: 1px dashed #444; padding: 12px; margin-bottom: 20px; page-break-inside: avoid; }
                    .v-header { text-align: center; border-bottom: 1px solid #777; padding-bottom: 4px; margin-bottom: 6px; }
                    .v-title { font-size: 13px; font-weight: bold; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                    .bold { font-weight: bold; }
                    .sigs { margin-top: 15px; display: flex; justify-content: space-between; font-size: 9px; }
                    @media print { body { margin: 0; } }
                  </style></head><body>`;

                  qualifiedForBatchReceipt.forEach((s, idx) => {
                    const sh = parseInt(s.number_of_shares, 10) || 1;
                    const kg = sh * settings.kg_per_share;
                    const amt = kg * settings.sugar_rate_per_kg;

                    bHtml += `<div class="voucher">`;
                    bHtml += `<div class="v-header">`;
                    bHtml += `<div class="v-title">${settings.org_name}</div>`;
                    bHtml += `<div>ಸಕ್ಕರೆ ಹಂಚಿಕೆ ರಶೀದಿ (${settings.receipt_year_code}) • ರಶೀದಿ ನಂ: REC-${settings.receipt_year_code}-${String(s.share_no || idx + 1).padStart(5, '0')}</div>`;
                    bHtml += `</div>`;
                    bHtml += `<div class="row"><span>ಹೆಸರು: <strong class="bold">${s.shareholder_name || s.name}</strong></span><span>ಶೇರ್ ನಂ: <strong class="bold">${s.share_no || s.share_number}</strong></span></div>`;
                    bHtml += `<div class="row"><span>ಗ್ರಾಮ: ${s.place || s.village_name}</span><span>ದಿನಾಂಕ: ${todayStr}</span></div>`;
                    bHtml += `<div class="row" style="border-top:1px solid #ccc; padding-top:4px; margin-top:4px;"><span>ಶೇರುಗಳು: ${sh} x ${settings.kg_per_share} ಕೆಜಿ</span><span>ಅರ್ಹ ಸಕ್ಕರೆ: <strong class="bold">${kg} ಕೆಜಿ</strong></span></div>`;
                    bHtml += `<div class="row"><span>ದರ: ₹${settings.sugar_rate_per_kg}/ಕೆಜಿ</span><span>ಪಾವತಿ ಮೊತ್ತ: <strong class="bold">₹${amt}</strong></span></div>`;
                    bHtml += `<div class="sigs"><div>ಶೇರುದಾರರ ಸಹಿ</div><div>ವಿತರಣಾಧಿಕಾರಿ</div><div>ಕಚೇರಿ ಮೊಹರು</div></div>`;
                    bHtml += `</div>`;
                  });

                  bHtml += `</body></html>`;
                  win.document.write(bHtml);
                  win.document.close();
                  win.focus();
                  setTimeout(() => win.print(), 350);
                }}
                className="px-5 py-2 bg-[#5925dc] hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> ಎಲ್ಲಾ {qualifiedForBatchReceipt.length} ರಶೀದಿಗಳನ್ನು ಮುದ್ರಿಸಿ
              </button>
              <button
                type="button"
                onClick={() => setShowBatchReceiptModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                ಮುಚ್ಚಿ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SHAREHOLDER EDIT MODAL (Click on Share Number with PIN Auth) */}
      {/* ========================================================================= */}
      {editShareholderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-400" /> ಶೇರುದಾರರ ಸಂಪಾದನೆ & ಇತಿಹಾಸ (#{editShareholderModal.share_no})
              </h2>
              <button
                onClick={() => setEditShareholderModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-200">
              {!pinVerified ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800 text-blue-300 text-xs">
                    🔒 ಶೇರುದಾರರ ಮಾಹಿತಿ ಸಂಪಾದಿಸಲು ಅಧಿಕೃತ ಆಪರೇಟರ್ ಪಿನ್ (PIN) ನಮೂದಿಸಿ (ಡೀಫಾಲ್ಟ್: <strong>1234</strong> ಅಥವಾ ಆಡ್ಮಿನ್ ಪಿನ್)
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Security PIN</label>
                    <input
                      type="password"
                      placeholder="Enter 4-digit PIN..."
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (pinInput === '1234' || pinInput === 'admin123' || user?.role === 'Admin') {
                            setPinVerified(true);
                          } else {
                            showToast('ತಪ್ಪಾದ ಪಿನ್ (Incorrect PIN)', 'error');
                          }
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (pinInput === '1234' || pinInput === 'admin123' || user?.role === 'Admin') {
                        setPinVerified(true);
                      } else {
                        showToast('ತಪ್ಪಾದ ಪಿನ್ (Incorrect PIN)', 'error');
                      }
                    }}
                    className="w-full py-2 bg-[#1d70b8] hover:bg-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    ಪರಿಶೀಲಿಸಿ (Verify PIN)
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">ಹೆಸರು (Shareholder Name)</label>
                    <input
                      type="text"
                      value={editShareholderModal.shareholder_name || editShareholderModal.name || ''}
                      onChange={(e) => setEditShareholderModal({
                        ...editShareholderModal,
                        shareholder_name: e.target.value,
                        name: e.target.value
                      })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">ವಿಳಾಸ / ಸ್ಥಳ</label>
                      <input
                        type="text"
                        value={editShareholderModal.place || editShareholderModal.village_name || ''}
                        onChange={(e) => setEditShareholderModal({
                          ...editShareholderModal,
                          place: e.target.value,
                          village_name: e.target.value
                        })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">ವರ್ಗ</label>
                      <input
                        type="text"
                        value={editShareholderModal.schedule_cast || 'ಅ - ವರ್ಗ'}
                        onChange={(e) => setEditShareholderModal({
                          ...editShareholderModal,
                          schedule_cast: e.target.value
                        })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">ಶೇರುಗಳ ಪ್ರಮಾಣ</label>
                      <input
                        type="number"
                        value={editShareholderModal.number_of_shares || 1}
                        onChange={(e) => setEditShareholderModal({
                          ...editShareholderModal,
                          number_of_shares: parseInt(e.target.value, 10) || 1
                        })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">ಮೊಬೈಲ್ ನಂಬರ</label>
                      <input
                        type="text"
                        value={editShareholderModal.mobile_no || editShareholderModal.mobile || ''}
                        onChange={(e) => setEditShareholderModal({
                          ...editShareholderModal,
                          mobile_no: e.target.value,
                          mobile: e.target.value
                        })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* History Log Display */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <History className="w-3 h-3 text-blue-400" /> ಬದಲಾವಣೆಗಳ ಇತಿಹಾಸ (Edit History):
                    </span>
                    <p className="text-[10px] text-slate-500">
                      ಮೂಲ ದಾಖಲೆ: {editShareholderModal.reg_date || '10/Aug/1982'} • ಬುಕ್ ನಂ: {editShareholderModal.book_no || 'B.No: 1'} • ಠರಾವು ನಂ: {editShareholderModal.tharava_no || 'TR-01/1982'}
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await ApiService.updateShareholder(editShareholderModal.id, editShareholderModal);
                        showToast(`ಶೇರುದಾರ #${editShareholderModal.share_no} ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!`);
                        setEditShareholderModal(null);
                        await loadInitialData();
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      ಉಳಿಸಿ (Save Changes)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditShareholderModal(null)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer"
                    >
                      ರದ್ದುಮಾಡಿ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
