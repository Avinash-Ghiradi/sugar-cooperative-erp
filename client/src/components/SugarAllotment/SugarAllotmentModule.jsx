import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ApiService, isShareholderInactive } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import officialCircleData from '../../services/officialCircleData.json';
import ShareholderForm from '../Shareholders/ShareholderForm';
import ErrorBoundary from '../Common/ErrorBoundary';
import {
  PackageCheck, Search, Printer, X, Save, Settings, ChevronDown, ChevronUp,
  MapPin, Sparkles, Filter, Check, ShieldCheck, History, Edit, FileText,
  CheckCircle2, AlertTriangle, Eye, RotateCcw, XCircle
} from 'lucide-react';

const MEMBER_TYPE_OPTIONS = [
  '-',
  'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ',
  'ಕಬ್ಬು ಬೆಳೆಗಾರಲ್ಲದ ಸದಸ್ಯ',
  'ಸಹಕಾರ ಸಂಘ/ ಸಂಘ ಸಂಸ್ಥೆ',
  'ಮೃತ',
  'ತಿದ್ದುಪಡಿ',
  'ವಾರಸುದಾರರು',
  'ವರ್ಗಾವಣೆ'
];
const CATEGORY_OPTIONS = ['ಅ - ವರ್ಗ', 'ಬ - ವರ್ಗ', 'ಡ - ವರ್ಗ'];

const normalizeMemberTypeDisplay = (val) => {
  if (!val || val === '-') return '-';
  const s = String(val).trim().toLowerCase();
  if (s.includes('ಬೆಳೆಗಾರಲ್ಲದ') || s.includes('non-grower')) return 'ಕಬ್ಬು ಬೆಳೆಗಾರಲ್ಲದ ಸದಸ್ಯ';
  if (s.includes('ಸಹಕಾರ') || s.includes('ಸಂಘ')) return 'ಸಹಕಾರ ಸಂಘ/ ಸಂಘ ಸಂಸ್ಥೆ';
  if (s.includes('ಬೆಳೆಗಾರ') || s.includes('grower')) return 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ';
  if (s.includes('ಮೃತ') || s.includes('ಸಾವು')) return 'ಮೃತ';
  if (s.includes('ತಿದ್ದುಪ')) return 'ತಿದ್ದುಪಡಿ';
  if (s.includes('ವಾರಸು')) return 'ವಾರಸುದಾರರು';
  if (s.includes('ವರ್ಗಾವಣೆ')) return 'ವರ್ಗಾವಣೆ';
  return val;
};

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

  // --- COLUMN SORTING & FILTERING STATE ---
  const [sortColumn, setSortColumn] = useState('share_no'); // default sort by share number
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc' | null

  // Column-specific filter values
  const [columnFilters, setColumnFilters] = useState({
    share_no: '',
    name: '',
    surname: '',
    address: '',
    category: '',
    share_qty: '',
    member_type: ''
  });

  // Toggle inline column filter row
  const [showColumnFilterRow, setShowColumnFilterRow] = useState(false);

  // Active column menu popover
  const [activeColumnMenu, setActiveColumnMenu] = useState(null);
  const columnMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setActiveColumnMenu(null);
      }
    };
    if (activeColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeColumnMenu]);

  // In-line edits state: Map of id -> { member_type, mobile_no, remarks }
  const [editedRows, setEditedRows] = useState({});

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState(null); // single shareholder
  const [showBatchReceiptModal, setShowBatchReceiptModal] = useState(false); // all shareholders
  const [editShareholderModal, setEditShareholderModal] = useState(null); // click on share no
  const [pinInput, setPinInput] = useState('');
  const [pinVerified, setPinVerified] = useState(false);

  // Settings State (Loaded from localStorage or defaults matching Sugar Allotment official layout)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('sugar_allotment_custom_settings');
    const defaultVals = {
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
        signature: true,
        remarks: true
      },

      // Exclude member types for printing
      exclude_member_types_print: [],

      // Page Orientation (landscape or portrait)
      page_orientation: 'landscape',

      // Sugar allotment configuration
      kg_per_share: 25,
      sugar_rate_per_kg: 20,
      receipt_year_code: '202627',

      // Receipt generation filters
      include_zero_shares_receipt: false,
      exclude_member_types_receipt: [],
      exclude_categories_receipt: []
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultVals,
          ...parsed,
          page_orientation: parsed.page_orientation || 'landscape',
          print_columns: {
            ...defaultVals.print_columns,
            ...(parsed.print_columns || {}),
            signature: parsed.print_columns?.signature !== undefined ? parsed.print_columns.signature : true
          }
        };
      } catch (e) {
        return defaultVals;
      }
    }
    return defaultVals;
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
    showToast(`ಫಿಲ್ಟರ್ ಅನ್ವಯಿಸಲಾಗಿದೆ: ${processedShareholders.length.toLocaleString()} ಶೇರುದಾರರು ಕಂಡುಬಂದಿದ್ದಾರೆ`);
  };

  const distinctCategories = useMemo(() => {
    const set = new Set(CATEGORY_OPTIONS);
    allShareholders.forEach(s => {
      const c = (s.schedule_cast || '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).filter(Boolean);
  }, [allShareholders]);

  const distinctMemberTypes = useMemo(() => {
    return MEMBER_TYPE_OPTIONS;
  }, []);

  const distinctShareQtys = useMemo(() => {
    const set = new Set();
    allShareholders.forEach(s => {
      const q = parseInt(s.number_of_shares, 10);
      if (!isNaN(q) && q > 0) set.add(q);
    });
    if (set.size === 0) [1, 2, 3, 4, 5, 10].forEach(q => set.add(q));
    return Array.from(set).sort((a, b) => a - b);
  }, [allShareholders]);

  const hasActiveColumnFilters = useMemo(() => {
    return Boolean(
      columnFilters.share_no.trim() ||
      columnFilters.name.trim() ||
      columnFilters.surname.trim() ||
      columnFilters.address.trim() ||
      columnFilters.category ||
      columnFilters.share_qty ||
      columnFilters.member_type
    );
  }, [columnFilters]);

  const handleClearColumnFilters = () => {
    setColumnFilters({
      share_no: '',
      name: '',
      surname: '',
      address: '',
      category: '',
      share_qty: '',
      member_type: ''
    });
    setActiveColumnMenu(null);
    showToast('ಕಾಲಮ್ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ');
  };

  const getColumnName = (colKey) => {
    switch (colKey) {
      case 'share_no': return 'ಶೇರ್ ಸಂಖ್ಯೆ';
      case 'name': return 'ಹೆಸರು';
      case 'surname': return 'ಉಪನಾಮ';
      case 'address': return 'ವಿಳಾಸ';
      case 'category': return 'ವರ್ಗ';
      case 'share_qty': return 'ಶೇರ್ ಪ್ರಮಾಣ';
      case 'member_type': return 'ಸದಸ್ಯರ ಪ್ರಕಾರ';
      default: return '';
    }
  };

  const handleColumnSort = (colKey) => {
    if (sortColumn === colKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
        showToast(`${getColumnName(colKey)}: ಹೆಚ್ಚಿನಿಂದ ಕಡಿಮೆಗೆ (Descending)`);
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
        showToast(`${getColumnName(colKey)}: ಸಾರ್ಟಿಂಗ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ`);
      } else {
        setSortDirection('asc');
        showToast(`${getColumnName(colKey)}: ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚಿಗೆ (Ascending)`);
      }
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
      showToast(`${getColumnName(colKey)}: ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚಿಗೆ (Ascending)`);
    }
  };

  // Combined processed shareholders (top filters + column filters + column sorting)
  const processedShareholders = useMemo(() => {
    if (!allShareholders || allShareholders.length === 0) return [];
    let list = allShareholders;

    // Check if any filter is active
    const hasTopFilter = Boolean(
      searchShareOrName.trim() ||
      searchAddress.trim() ||
      searchSurname.trim() ||
      (searchMemberType && searchMemberType !== '-') ||
      searchCategory.trim() ||
      searchShareQty.trim() ||
      selectedCircle ||
      selectedPlaces.size > 0
    );

    const hasColFilter = Boolean(
      columnFilters.share_no.trim() ||
      columnFilters.name.trim() ||
      columnFilters.surname.trim() ||
      columnFilters.address.trim() ||
      columnFilters.category ||
      columnFilters.share_qty ||
      columnFilters.member_type
    );

    // If NO filter is active, show default initial 324 records (excluding inactive/merged members)
    if (!hasTopFilter && !hasColFilter) {
      list = allShareholders.filter(s => !isShareholderInactive(s)).slice(0, 324);
    }

    // 1. Top filter: Share number or Name (exact match for numeric or comma-separated, partial for name)
    if (searchShareOrName.trim()) {
      const raw = searchShareOrName.trim();
      if (raw.includes(',')) {
        const parts = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        list = list.filter(s => {
          const sNo = String(s.share_no || s.share_number || '').trim().toLowerCase();
          return parts.includes(sNo);
        });
      } else if (/^\d+$/.test(raw)) {
        // Direct numeric share number: exact match first, or partial if no exact
        const exact = list.filter(s => String(s.share_no || s.share_number || '').trim() === raw);
        if (exact.length > 0) {
          list = exact;
        } else {
          list = list.filter(s => String(s.share_no || s.share_number || '').includes(raw));
        }
      } else {
        const q = raw.toLowerCase().normalize('NFC');
        list = list.filter(s => {
          const name = String(s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
          const sNo = String(s.share_no || s.share_number || '').toLowerCase();
          return name.includes(q) || sNo.includes(q);
        });
      }
    }

    // 2. Top filter: Address / Place
    if (searchAddress.trim()) {
      const q = searchAddress.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const p = String(s.place || s.village_name || '').toLowerCase().normalize('NFC');
        const addr = String(s.address || '').toLowerCase().normalize('NFC');
        return p.includes(q) || addr.includes(q);
      });
    }

    // 3. Top filter: Surname
    if (searchSurname.trim()) {
      const q = searchSurname.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const sn = getSurname(s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
        return sn.includes(q);
      });
    }

    // 4. Top filter: Member Type
    if (searchMemberType && searchMemberType !== '-') {
      const q = searchMemberType.toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const rawMt = editedRows[s.id]?.member_type !== undefined ? editedRows[s.id].member_type : (s.member_type || s.status || '');
        const mt = normalizeMemberTypeDisplay(rawMt).toLowerCase().normalize('NFC');
        return mt.includes(q) || q.includes(mt);
      });
    }

    // 5. Top filter: Category
    if (searchCategory.trim()) {
      const q = searchCategory.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const c = String(s.schedule_cast || '').toLowerCase().normalize('NFC');
        return c.includes(q);
      });
    }

    // 6. Top filter: Share Quantity
    if (searchShareQty.trim()) {
      const qty = parseInt(searchShareQty.trim(), 10);
      if (!isNaN(qty)) {
        list = list.filter(s => {
          const sQty = parseInt(s.number_of_shares, 10) || 1;
          return sQty === qty;
        });
      }
    }

    // 7. Top filter: Circle
    if (selectedCircle) {
      const cQuery = selectedCircle.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const cName = String(s.circle || s.circle_name || '').trim().toLowerCase().normalize('NFC');
        return cName === cQuery;
      });
    }

    // 8. Top filter: Selected Places Checkboxes
    if (selectedPlaces.size > 0) {
      list = list.filter(s => {
        const p = String(s.place || s.village_name || '').trim();
        return selectedPlaces.has(p);
      });
    }

    // 9. Column-level filter: Share Number
    if (columnFilters.share_no.trim()) {
      const q = columnFilters.share_no.trim().toLowerCase();
      list = list.filter(s => {
        const sno = String(s.share_no || s.share_number || '').toLowerCase();
        return sno.includes(q);
      });
    }

    // 10. Column-level filter: Name
    if (columnFilters.name.trim()) {
      const q = columnFilters.name.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const name = String(s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
        return name.includes(q);
      });
    }

    // 11. Column-level filter: Surname
    if (columnFilters.surname.trim()) {
      const q = columnFilters.surname.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const sn = getSurname(s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
        return sn.includes(q);
      });
    }

    // 12. Column-level filter: Address
    if (columnFilters.address.trim()) {
      const q = columnFilters.address.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const p = String(s.place || s.village_name || s.address || '').toLowerCase().normalize('NFC');
        return p.includes(q);
      });
    }

    // 13. Column-level filter: Category
    if (columnFilters.category) {
      const q = columnFilters.category.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const c = String(s.schedule_cast || 'ಅ - ವರ್ಗ').trim().toLowerCase().normalize('NFC');
        return c.includes(q) || q.includes(c);
      });
    }

    // 14. Column-level filter: Share Quantity
    if (columnFilters.share_qty) {
      const targetQty = parseInt(columnFilters.share_qty, 10);
      list = list.filter(s => {
        const q = parseInt(s.number_of_shares, 10) || 1;
        return q === targetQty;
      });
    }

    // 15. Column-level filter: Member Type
    if (columnFilters.member_type) {
      const q = columnFilters.member_type.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const rawMt = editedRows[s.id]?.member_type !== undefined ? editedRows[s.id].member_type : (s.member_type || s.status || '-');
        const mt = normalizeMemberTypeDisplay(rawMt).toLowerCase().normalize('NFC');
        return mt.includes(q) || q.includes(mt);
      });
    }

    // 16. Column Sorting
    if (sortColumn && sortDirection) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortColumn === 'share_no') {
          const numA = parseInt(String(a.share_no || a.share_number || '').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(String(b.share_no || b.share_number || '').replace(/\D/g, ''), 10) || 0;
          cmp = numA - numB;
        } else if (sortColumn === 'name') {
          const nameA = String(a.shareholder_name || a.name || '');
          const nameB = String(b.shareholder_name || b.name || '');
          cmp = nameA.localeCompare(nameB, 'kn');
        } else if (sortColumn === 'surname') {
          const snA = getSurname(a.shareholder_name || a.name || '');
          const snB = getSurname(b.shareholder_name || b.name || '');
          cmp = snA.localeCompare(snB, 'kn');
        } else if (sortColumn === 'address') {
          const adA = String(a.place || a.village_name || a.address || '');
          const adB = String(b.place || b.village_name || b.address || '');
          cmp = adA.localeCompare(adB, 'kn');
        } else if (sortColumn === 'category') {
          const catA = String(a.schedule_cast || 'ಅ - ವರ್ಗ');
          const catB = String(b.schedule_cast || 'ಅ - ವರ್ಗ');
          cmp = catA.localeCompare(catB, 'kn');
        } else if (sortColumn === 'share_qty') {
          const qA = parseInt(a.number_of_shares, 10) || 1;
          const qB = parseInt(b.number_of_shares, 10) || 1;
          cmp = qA - qB;
        } else if (sortColumn === 'member_type') {
          const rawA = editedRows[a.id]?.member_type !== undefined ? editedRows[a.id].member_type : (a.member_type || a.status || '-');
          const rawB = editedRows[b.id]?.member_type !== undefined ? editedRows[b.id].member_type : (b.member_type || b.status || '-');
          const mtA = normalizeMemberTypeDisplay(rawA);
          const mtB = normalizeMemberTypeDisplay(rawB);
          cmp = mtA.localeCompare(mtB, 'kn');
        }
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [
    allShareholders,
    searchShareOrName,
    searchAddress,
    searchSurname,
    searchMemberType,
    searchCategory,
    searchShareQty,
    selectedCircle,
    selectedPlaces,
    columnFilters,
    sortColumn,
    sortDirection,
    editedRows
  ]);

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
    setColumnFilters({
      share_no: '',
      name: '',
      surname: '',
      address: '',
      category: '',
      share_qty: '',
      member_type: ''
    });
    setSortColumn('share_no');
    setSortDirection('asc');
    setActiveColumnMenu(null);
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

  // Print filtered list according to exact Sugar Allotment official format
  const handlePrintList = () => {
    try {
      const {
        org_name = 'Shree Bheemashankar Sahakari Sakkare Karkhane Ni., Margur',
        sub_title = 'Share Holders List',
        doc_title = 'General Board Meeting 2025 - 26 / 21-09-2026',
        print_columns = {},
        exclude_member_types_print = []
      } = settings || {};

      const safeExcluded = Array.isArray(exclude_member_types_print) ? exclude_member_types_print : [];
      const printableRows = (processedShareholders || []).filter(s => {
        const mt = (editedRows[s.id]?.member_type || s.member_type || s.status || '-').trim();
        return !safeExcluded.includes(mt);
      });

      if (printableRows.length === 0) {
        showToast('ಮುದ್ರಿಸಲು ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ (No records found to print)', 'warning');
        return;
      }

      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedDateText = `${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
      const dateNumeric = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      // Subtitle formatting (e.g. "Share Holders List - 19 Oct, 2026")
      let subTitleDisplay = sub_title || 'Share Holders List';
      if (!subTitleDisplay.includes('20')) {
        subTitleDisplay = `${subTitleDisplay} - ${formattedDateText}`;
      }

      // Convert Set to Array safely
      const placesArray = selectedPlaces instanceof Set
        ? Array.from(selectedPlaces)
        : (Array.isArray(selectedPlaces) ? selectedPlaces : []);

      // Determine active place and circle
      let activePlace = '';
      if (searchAddress && searchAddress.trim()) {
        activePlace = searchAddress.trim();
      } else if (placesArray.length === 1) {
        activePlace = placesArray[0];
      } else if (printableRows.length > 0) {
        const firstPlace = (printableRows[0].place || printableRows[0].village_name || '').trim();
        const allSamePlace = printableRows.every(r => (r.place || r.village_name || '').trim() === firstPlace);
        if (allSamePlace) {
          activePlace = firstPlace;
        }
      }

      // Lookup details from officialCircleData
      const circleInfo = (activePlace && Array.isArray(officialCircleData))
        ? officialCircleData.find(c => (c.address || '').trim().toLowerCase() === activePlace.toLowerCase())
        : null;

      let printCircle = selectedCircle && selectedCircle !== 'all' ? selectedCircle : '';
      if (!printCircle && circleInfo?.circle_name) {
        printCircle = circleInfo.circle_name;
      }
      if (!printCircle && printableRows.length > 0) {
        const rowWithCircle = printableRows.find(r => r.circle || r.circle_name);
        if (rowWithCircle) {
          printCircle = rowWithCircle.circle || rowWithCircle.circle_name;
        }
      }
      if (!printCircle) printCircle = 'ಇಂಡಿ ಸರ್ಕಲ್';

      const printTaluk = circleInfo?.taluk || 'ಇಂಡಿ';
      const printDistrict = circleInfo?.district || 'ವಿಜಯಪುರ';
      const printPincode = circleInfo?.pincode || (activePlace === 'ಅಗರಖೇಡ' ? '586209' : '');

      let addressLine = '';
      if (activePlace) {
        addressLine = `ವಿಳಾಸ : ${activePlace} | Taluk: ${printTaluk} | District: ${printDistrict}${printPincode ? ' | Pincode: ' + printPincode : ''}`;
      } else if (placesArray.length > 1) {
        addressLine = `ವಿಳಾಸ : ${placesArray.join(', ')} | Taluk: ${printTaluk} | District: ${printDistrict}`;
      } else {
        addressLine = `Taluk: ${printTaluk} | District: ${printDistrict}`;
      }

      const orientation = settings?.page_orientation || 'landscape';

      let html = `<!DOCTYPE html><html><head><meta charset="utf-8">`;
      html += `<title>${doc_title || 'Sugar Allotment'}</title>`;
      html += `<link rel="preconnect" href="https://fonts.googleapis.com">`;
      html += `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700&display=swap" rel="stylesheet">`;
      html += `<style>
        @page {
          size: A4 ${orientation};
          margin: 8mm 8mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Noto Sans Kannada', 'Segoe UI', Arial, sans-serif;
          margin: 0;
          padding: 2px 4px;
          color: #0f172a;
          background: #ffffff;
          font-size: 11.5px;
        }
        .print-header-box {
          border: 1.5px solid #2563eb;
          border-radius: 4px;
          padding: 8px 16px;
          text-align: center;
          margin-bottom: 6px;
          background: #ffffff;
        }
        .print-org-name {
          font-size: 17px;
          font-weight: 700;
          color: #1e3a8a;
          margin: 0 0 2px 0;
          letter-spacing: 0.2px;
        }
        .print-sub-title {
          font-size: 11.5px;
          font-weight: 600;
          color: #475569;
          margin: 0 0 6px 0;
        }
        .print-doc-banner {
          background-color: #2563eb !important;
          color: #ffffff !important;
          font-size: 13.5px;
          font-weight: 700;
          padding: 6px 20px;
          border-radius: 4px;
          display: inline-block;
          width: 88%;
          margin: 0 auto;
          letter-spacing: 0.3px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-divider {
          border: none;
          border-top: 1.5px solid #2563eb;
          margin: 5px 0;
        }
        .print-circle-title {
          color: #1d4ed8;
          font-size: 14px;
          font-weight: 700;
          text-align: center;
          margin: 3px 0 2px 0;
        }
        .print-address-line {
          font-size: 11.5px;
          font-weight: 600;
          color: #1e293b;
          text-align: center;
          margin: 0 0 3px 0;
        }
        .print-meta-block {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 4px 0 6px 0;
          padding: 0 4px;
          width: 100%;
        }
        .print-meta-date {
          font-size: 11.5px;
          font-weight: 700;
          color: #1e293b;
          text-align: left;
        }
        .print-meta-total {
          font-size: 13px;
          font-weight: 700;
          color: #1d4ed8;
          text-align: right;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
        }
        thead {
          display: table-header-group;
        }
        tbody {
          display: table-row-group;
        }
        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        th {
          background-color: #2563eb !important;
          color: #ffffff !important;
          border: 1px solid #1e40af;
          font-weight: 700;
          font-size: 11.5px;
          padding: 7px 5px;
          text-align: center;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        td {
          border: 1px solid #64748b;
          padding: 6px 6px;
          font-size: 11.5px;
          color: #000000;
          vertical-align: middle;
          height: 34px;
        }
        .center { text-align: center; }
        .left { text-align: left; }
        .font-mono { font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 11.5px; }
        .font-bold { font-weight: 700; }
        @media print {
          body { margin: 0; padding: 0; }
        }
      </style></head><body>`;

      html += `<div class="print-header-box">`;
      html += `<div class="print-org-name">${org_name}</div>`;
      html += `<div class="print-sub-title">${subTitleDisplay}</div>`;
      html += `<div class="print-doc-banner">${doc_title}</div>`;
      html += `</div>`;

      html += `<div class="print-divider"></div>`;
      html += `<div class="print-circle-title">Circle: ${printCircle}</div>`;
      html += `<div class="print-address-line">${addressLine}</div>`;
      html += `<div class="print-divider"></div>`;

      html += `<div class="print-meta-block">`;
      html += `<div class="print-meta-date">ದಿನಾಂಕ: ${dateNumeric}</div>`;
      html += `<div class="print-meta-total">ಒಟ್ಟು ಶೇರುದಾರರು: ${printableRows.length}</div>`;
      html += `</div>`;

      html += `<table><thead><tr>`;
      html += `<th class="center" style="width:42px;">ಕ್ರ.ಸಂ.</th>`;
      if (print_columns.share_no) html += `<th class="center" style="width:80px;">ಶೇರ್ ಸಂಖ್ಯೆ</th>`;
      if (print_columns.name) html += `<th class="left" style="min-width:230px;">ಹೆಸರು</th>`;
      if (print_columns.surname) html += `<th class="left" style="width:110px;">ಉಪನಾಮ</th>`;
      if (print_columns.address) html += `<th class="center" style="width:130px;">ವಿಳಾಸ</th>`;
      if (print_columns.category) html += `<th class="center" style="width:75px;">ವರ್ಗ</th>`;
      if (print_columns.share_qty) html += `<th class="center" style="width:80px;">ಶೇರ್ ಪ್ರಮಾಣ</th>`;
      if (print_columns.member_type) html += `<th class="left" style="width:140px;">ಸದಸ್ಯರ ಪ್ರಕಾರ</th>`;
      if (print_columns.mobile_no) html += `<th class="center" style="width:115px;">ಮೊಬೈಲ್ ನಂಬರ</th>`;
      if (print_columns.signature) html += `<th class="center" style="width:130px;">ಸಹಿ</th>`;
      if (print_columns.remarks) html += `<th class="center" style="width:90px;">ಶೇರಾ</th>`;
      html += `</tr></thead><tbody>`;

      printableRows.forEach((s, idx) => {
        const surname = getSurname(s.shareholder_name || s.name || '');
        const shares = parseInt(s.number_of_shares, 10) || 1;
        const memType = editedRows[s.id]?.member_type || s.member_type || s.status || '-';
        const mob = editedRows[s.id]?.mobile_no !== undefined ? editedRows[s.id].mobile_no : (s.mobile_no || s.mobile || '');
        const rem = editedRows[s.id]?.remarks !== undefined ? editedRows[s.id].remarks : (s.remarks || '');
        const cat = s.schedule_cast || 'ಅ - ವರ್ಗ';

        html += `<tr>`;
        html += `<td class="center font-mono">${idx + 1}</td>`;
        if (print_columns.share_no) html += `<td class="center font-mono font-bold">${s.share_no || s.share_number || ''}</td>`;
        if (print_columns.name) html += `<td class="left font-bold">${s.shareholder_name || s.name || ''}</td>`;
        if (print_columns.surname) html += `<td class="left">${surname}</td>`;
        if (print_columns.address) html += `<td class="center">${s.place || s.village_name || ''}</td>`;
        if (print_columns.category) html += `<td class="center">${cat}</td>`;
        if (print_columns.share_qty) html += `<td class="center font-bold font-mono">${shares}</td>`;
        if (print_columns.member_type) html += `<td class="left">${memType}</td>`;
        if (print_columns.mobile_no) html += `<td class="center font-mono">${mob}</td>`;
        if (print_columns.signature) html += `<td></td>`;
        if (print_columns.remarks) html += `<td>${rem}</td>`;
        html += `</tr>`;
      });

      html += `</tbody></table>`;
      html += `</body></html>`;

      // Try opening window
      const printWindow = window.open('', '_blank');
      if (printWindow && !printWindow.closed && typeof printWindow.closed !== 'undefined') {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (e) {
            console.error('printWindow.print() failed:', e);
          }
        }, 500);
      } else {
        // Fallback: use hidden iframe if popup is blocked
        let iframe = document.getElementById('sugar_print_iframe');
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'sugar_print_iframe';
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          document.body.appendChild(iframe);
        }
        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
          setTimeout(() => {
            (iframe.contentWindow || iframe).focus();
            (iframe.contentWindow || iframe).print();
          }, 500);
        }
      }
    } catch (err) {
      console.error('Print generation error:', err);
      showToast('Error generating print page: ' + err.message, 'error');
    }
  };

  // Qualified rows for "ಎಲ್ಲರಿಗೂ ರಶೀದಿ"
  const qualifiedForBatchReceipt = useMemo(() => {
    const { include_zero_shares_receipt, exclude_member_types_receipt, exclude_categories_receipt } = settings;
    return processedShareholders.filter(s => {
      const shares = parseInt(s.number_of_shares, 10) || 0;
      if (!include_zero_shares_receipt && shares <= 0) return false;
      const mt = (editedRows[s.id]?.member_type || s.member_type || s.status || '-').trim();
      if (exclude_member_types_receipt.includes(mt)) return false;
      const cat = (s.schedule_cast || 'ಅ - ವರ್ಗ').trim();
      if (exclude_categories_receipt.includes(cat)) return false;
      return true;
    });
  }, [processedShareholders, settings, editedRows]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }, []);

  // Helper to render sortable and filterable column headers
  const renderSortableHeader = (colKey, label, filterType = 'text', align = 'left', extraClass = '') => {
    const isSorted = sortColumn === colKey;
    const isFiltered = Boolean(columnFilters[colKey]);
    const isOpen = activeColumnMenu === colKey;

    return (
      <th
        onClick={() => handleColumnSort(colKey)}
        className={`py-3 px-3 border-r border-[#083b5f] relative select-none cursor-pointer hover:bg-[#0c5180] transition-colors ${extraClass}`}
        title={`${label}: ಸಾರ್ಟ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ`}
      >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : 'justify-between'}`}>
          {/* Header Title & Sort Indicator */}
          <div className="flex items-center gap-1 font-bold text-white text-[11px] select-none">
            <span>{label}</span>
            <span className="text-[12px] inline-flex items-center">
              {isSorted ? (
                sortDirection === 'asc' ? (
                  <span className="text-amber-300 font-black text-sm">▲</span>
                ) : (
                  <span className="text-amber-300 font-black text-sm">▼</span>
                )
              ) : (
                <span className="text-blue-200/60 font-medium">▴▾</span>
              )}
            </span>
          </div>

          {/* AutoFilter Popover Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveColumnMenu(prev => prev === colKey ? null : colKey);
            }}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isFiltered ? 'text-amber-300 bg-[#073250] ring-1 ring-amber-400' : 'text-blue-200/70 hover:text-white hover:bg-[#08426b]'
            }`}
            title={`${label}: ಫಿಲ್ಟರ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ`}
          >
            <Filter className={`w-3.5 h-3.5 ${isFiltered ? 'fill-amber-300' : ''}`} />
          </button>
        </div>

        {/* AutoFilter Popover Dropdown */}
        {isOpen && (
          <div
            ref={columnMenuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-left font-normal normal-case text-slate-100 animate-fadeIn"
            style={{ minWidth: '220px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1 text-blue-300">
                <Filter className="w-3.5 h-3.5" /> {label} ಫಿಲ್ಟರ್
              </span>
              <button
                type="button"
                onClick={() => setActiveColumnMenu(null)}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Sort Options */}
            <div className="py-2 border-b border-slate-800 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setSortColumn(colKey);
                  setSortDirection('asc');
                  setActiveColumnMenu(null);
                  showToast(`${label}: ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚಿಗೆ (Ascending)`);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  isSorted && sortDirection === 'asc' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>▲ ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚಿಗೆ (Ascending)</span>
                {isSorted && sortDirection === 'asc' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortColumn(colKey);
                  setSortDirection('desc');
                  setActiveColumnMenu(null);
                  showToast(`${label}: ಹೆಚ್ಚಿನಿಂದ ಕಡಿಮೆಗೆ (Descending)`);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  isSorted && sortDirection === 'desc' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>▼ ಹೆಚ್ಚಿನಿಂದ ಕಡಿಮೆಗೆ (Descending)</span>
                {isSorted && sortDirection === 'desc' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Value Filter Options */}
            <div className="py-2.5 space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">
                ಮೌಲ್ಯದ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಮಾಡಿ:
              </label>

              {filterType === 'text' && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`${label} ಹುಡುಕಿ...`}
                    value={columnFilters[colKey] || ''}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, [colKey]: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    autoFocus
                  />
                  {columnFilters[colKey] && (
                    <button
                      type="button"
                      onClick={() => setColumnFilters(prev => ({ ...prev, [colKey]: '' }))}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {filterType === 'category' && (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setColumnFilters(prev => ({ ...prev, category: '' }))}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                      !columnFilters.category ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>ಎಲ್ಲಾ ವರ್ಗಗಳು (All)</span>
                    {!columnFilters.category && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {distinctCategories.map((cat, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setColumnFilters(prev => ({ ...prev, category: cat }))}
                      className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                        columnFilters.category === cat ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{cat}</span>
                      {columnFilters.category === cat && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}

              {filterType === 'share_qty' && (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setColumnFilters(prev => ({ ...prev, share_qty: '' }))}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                      !columnFilters.share_qty ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>ಎಲ್ಲಾ ಶೇರುಗಳು (All)</span>
                    {!columnFilters.share_qty && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {distinctShareQtys.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setColumnFilters(prev => ({ ...prev, share_qty: String(q) }))}
                      className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                        columnFilters.share_qty === String(q) ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{q} {q === 1 ? 'ಶೇರು' : 'ಶೇರುಗಳು'}</span>
                      {columnFilters.share_qty === String(q) && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}

              {filterType === 'member_type' && (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setColumnFilters(prev => ({ ...prev, member_type: '' }))}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                      !columnFilters.member_type ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>ಎಲ್ಲಾ ಪ್ರಕಾರಗಳು (All)</span>
                    {!columnFilters.member_type && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {distinctMemberTypes.map((mt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setColumnFilters(prev => ({ ...prev, member_type: mt }))}
                      className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                        columnFilters.member_type === mt ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{mt}</span>
                      {columnFilters.member_type === mt && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popover Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setColumnFilters(prev => ({ ...prev, [colKey]: '' }));
                  if (sortColumn === colKey) {
                    setSortColumn(null);
                    setSortDirection(null);
                  }
                  setActiveColumnMenu(null);
                  showToast(`${label} ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ`);
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                ತೆರವುಗೊಳಿಸಿ
              </button>
              <button
                type="button"
                onClick={() => setActiveColumnMenu(null)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded cursor-pointer"
              >
                ಮುಗಿದಿದೆ
              </button>
            </div>
          </div>
        )}
      </th>
    );
  };

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
            </div>
          </div>
        )}
      </div>

      {/* ACTION & SUMMARY BAR (Matching Image 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center gap-2.5 text-sm font-bold text-blue-400">
          <span>{processedShareholders.length} ಶೇರುದಾರರ್ ಕಂಡುಬಂದಿದ್ದಾರೆ</span>
          {(hasActiveColumnFilters || sortColumn !== 'share_no' || sortDirection !== 'asc') && (
            <span className="text-[11px] text-amber-300 font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center gap-1">
              <Filter className="w-3 h-3 fill-amber-300" />
              <span>ಫಿಲ್ಟರ್ / ಸಾರ್ಟ್ ಸಕ್ರಿಯವಾಗಿದೆ</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Column Filter Row Toggle */}
          <button
            type="button"
            onClick={() => setShowColumnFilterRow(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border ${
              showColumnFilterRow
                ? 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="ಪ್ರತಿಯೊಂದು ಕಾಲಮ್‌ಗೆ ಶೋಧಕ ಬಾಕ್ಸ್ (Search Row) ಆನ್/ಆಫ್ ಮಾಡಿ"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showColumnFilterRow ? 'ಕಾಲಮ್ ಫಿಲ್ಟರ್ ಸಾಲು ಅಡಗಿಸಿ' : 'ಕಾಲಮ್ ಫಿಲ್ಟರ್ ಸಾಲು'}</span>
          </button>

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
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00823b] hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            title="ಶೇರುದಾರರ ಪಟ್ಟಿ ಮುದ್ರಿಸಿ (Sugar Allotment Print)"
          >
            <Printer className="w-4 h-4" />
            <span>ಮುದ್ರಿಸಿ</span>
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
          <div className="flex items-center gap-3">
            {hasActiveColumnFilters && (
              <button
                type="button"
                onClick={handleClearColumnFilters}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="ಎಲ್ಲಾ ಕಾಲಮ್ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆಗೆದುಹಾಕಿ"
              >
                <X className="w-3 h-3" /> ಕಾಲಮ್ ಫಿಲ್ಟರ್ ತೆರವು
              </button>
            )}
            <span className="text-blue-400">ಒಟ್ಟು: {processedShareholders.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 font-medium">
            ಶೇರುದಾರರ ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...
          </div>
        ) : processedShareholders.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-medium space-y-2">
            <p>ಆಯ್ಕೆಮಾಡಿದ ಫಿಲ್ಟರ್‌ಗೆ ಯಾವುದೇ ಶೇರುದಾರರು ಕಂಡುಬಂದಿಲ್ಲ.</p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-1.5 bg-[#1d70b8] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              {/* Blue Header matching Image 3 with fully functional Sorting & AutoFilter Popovers */}
              <thead className="bg-[#0a4b78] text-white font-bold text-[11px] sticky top-0 z-20 select-none shadow">
                <tr className="border-b border-[#083b5f]">
                  <th className="py-3 px-3 text-center border-r border-[#083b5f] w-12">ಕ್ರ.ಸಂ.</th>
                  
                  {/* ಶೇರ್ ಸಂಖ್ಯೆ ▴▾ */}
                  {renderSortableHeader('share_no', 'ಶೇರ್ ಸಂಖ್ಯೆ', 'text', 'left', 'min-w-[130px]')}

                  {/* ಹೆಸರು ▴▾ */}
                  {renderSortableHeader('name', 'ಹೆಸರು', 'text', 'left', 'min-w-[170px]')}

                  {/* ಉಪನಾಮ ▴▾ */}
                  {renderSortableHeader('surname', 'ಉಪನಾಮ', 'text', 'left', 'min-w-[120px]')}

                  {/* ವಿಳಾಸ ▴▾ */}
                  {renderSortableHeader('address', 'ವಿಳಾಸ', 'text', 'left', 'min-w-[140px]')}

                  {/* ವರ್ಗ ▴▾ */}
                  {renderSortableHeader('category', 'ವರ್ಗ', 'category', 'center', 'min-w-[110px]')}

                  {/* ಶೇರ್ ಪ್ರಮಾಣ ▴▾ */}
                  {renderSortableHeader('share_qty', 'ಶೇರ್ ಪ್ರಮಾಣ', 'share_qty', 'center', 'min-w-[120px]')}

                  {/* ಸದಸ್ಯರ ಪ್ರಕಾರ ▴▾ */}
                  {renderSortableHeader('member_type', 'ಸದಸ್ಯರ ಪ್ರಕಾರ', 'member_type', 'left', 'min-w-[150px]')}

                  <th className="py-3 px-3 border-r border-[#083b5f] min-w-[110px]">ಮೊಬೈಲ್ ನಂಬರ</th>
                  <th className="py-3 px-3.5 text-center border-r border-[#083b5f] w-16">ಸಹಿ</th>
                  <th className="py-3 px-3.5 border-r border-[#083b5f] min-w-[100px]">ಶೇರಾ</th>
                  <th className="py-3 px-3.5 text-center w-20">ರಶೀದಿ</th>
                </tr>

                {/* Inline Column Filter Row */}
                {showColumnFilterRow && (
                  <tr className="bg-[#073656] text-white border-b border-[#083b5f]">
                    <td className="p-1.5 text-center border-r border-[#083b5f]">
                      {hasActiveColumnFilters && (
                        <button
                          type="button"
                          onClick={handleClearColumnFilters}
                          className="text-amber-300 hover:text-white text-xs font-black cursor-pointer"
                          title="ಎಲ್ಲಾ ಕಾಲಮ್ ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                    {/* ಶೇರ್ ಸಂಖ್ಯೆ filter */}
                    <td className="p-1 border-r border-[#083b5f]">
                      <input
                        type="text"
                        placeholder="ಶೇರ್ ಸಂಖ್ಯೆ..."
                        value={columnFilters.share_no}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, share_no: e.target.value }))}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-amber-400 rounded px-1.5 py-1 text-[11px] text-white outline-none"
                      />
                    </td>
                    {/* ಹೆಸರು filter */}
                    <td className="p-1 border-r border-[#083b5f]">
                      <input
                        type="text"
                        placeholder="ಹೆಸರು..."
                        value={columnFilters.name}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-amber-400 rounded px-1.5 py-1 text-[11px] text-white outline-none"
                      />
                    </td>
                    {/* ಉಪನಾಮ filter */}
                    <td className="p-1 border-r border-[#083b5f]">
                      <input
                        type="text"
                        placeholder="ಉಪನಾಮ..."
                        value={columnFilters.surname}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, surname: e.target.value }))}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-amber-400 rounded px-1.5 py-1 text-[11px] text-white outline-none"
                      />
                    </td>
                    {/* ವಿಳಾಸ filter */}
                    <td className="p-1 border-r border-[#083b5f]">
                      <input
                        type="text"
                        placeholder="ವಿಳಾಸ..."
                        value={columnFilters.address}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-amber-400 rounded px-1.5 py-1 text-[11px] text-white outline-none"
                      />
                    </td>
                    {/* ವರ್ಗ filter */}
                    <td className="p-1 border-r border-[#083b5f]">
                      <select
                        value={columnFilters.category}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-amber-400 rounded px-1 py-1 text-[11px] text-white outline-none cursor-pointer"
                      >
                        <option value="">ಎಲ್ಲಾ ವರ್ಗ</option>
                        {distinctCategories.map((c, i) => (
                          <option key={i} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    {/* ಶೇರ್ ಪ್ರಮಾಣ filter */}
                    <td className="p-1 border-r border-[#083b5f]">
                      <select
                        value={columnFilters.share_qty}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, share_qty: e.target.value }))}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-amber-400 rounded px-1 py-1 text-[11px] text-white outline-none cursor-pointer"
                      >
                        <option value="">ಎಲ್ಲಾ</option>
                        {distinctShareQtys.map((q, i) => (
                          <option key={i} value={q}>{q} {q === 1 ? 'ಶೇರು' : 'ಶೇರುಗಳು'}</option>
                        ))}
                      </select>
                    </td>
                    {/* ಸದಸ್ಯರ ಪ್ರಕಾರ filter */}
                    <td className="p-1 border-r border-[#083b5f]">
                      <select
                        value={columnFilters.member_type}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, member_type: e.target.value }))}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-amber-400 rounded px-1 py-1 text-[11px] text-white outline-none cursor-pointer"
                      >
                        <option value="">ಎಲ್ಲಾ ಪ್ರಕಾರ</option>
                        {distinctMemberTypes.map((mt, i) => (
                          <option key={i} value={mt}>{mt}</option>
                        ))}
                      </select>
                    </td>
                    <td colSpan={4} className="p-1 bg-[#073656] text-[10px] text-slate-300 italic px-2">
                      ಕಾಲಮ್ ಫಿಲ್ಟರ್ ಅನ್ವಯಿಸಲಾಗಿದೆ
                    </td>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-100">
                {processedShareholders.map((s, idx) => {
                  const surname = getSurname(s.shareholder_name || s.name || '');
                  const currentMemType = editedRows[s.id]?.member_type !== undefined ? editedRows[s.id].member_type : (s.member_type || s.status || '-');
                  const currentMob = editedRows[s.id]?.mobile_no !== undefined ? editedRows[s.id].mobile_no : (s.mobile_no || s.mobile || '');
                  const currentRem = editedRows[s.id]?.remarks !== undefined ? editedRows[s.id].remarks : (s.remarks || '');

                  const isInactive = isShareholderInactive(s);
                  return (
                    <tr key={s.id || idx} className={`hover:bg-slate-900/70 transition-colors ${isInactive ? 'bg-rose-950/20 text-slate-400 opacity-70' : ''}`}>
                      {/* 1. Sl No */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-300 border-r border-slate-800/60">
                        {idx + 1}
                      </td>

                      {/* 2. Share No (Clickable Blue Link) */}
                      <td className="py-2.5 px-3.5 border-r border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => {
                            const freshSh = allShareholders.find(x => x.id === s.id || String(x.share_no) === String(s.share_no)) || s;
                            setEditShareholderModal(freshSh);
                            setPinInput('');
                            setPinVerified(false);
                          }}
                          className="font-bold text-[#1d70b8] hover:text-blue-400 underline cursor-pointer"
                          title="ಕ್ಲಿಕ್ ಮಾಡಿ ಶಾಸನಬದ್ಧ 38-ಕಾಲಂಗಳ ತಿದ್ದುಪಡಿ ನಮೂನೆ ತೆರೆಯಿರಿ (Edit Statutory Shareholder Record)"
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

              {/* 3.1 ಮುದ್ರಣ ಪುಟದ ವಿನ್ಯಾಸ (Page Orientation) */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">ಮುದ್ರಣ ಪುಟದ ವಿನ್ಯಾಸ (Page Orientation)</label>
                <div className="flex flex-wrap gap-4 items-center p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="page_orientation"
                      value="landscape"
                      checked={tempSettings.page_orientation === 'landscape' || !tempSettings.page_orientation}
                      onChange={() => setTempSettings({ ...tempSettings, page_orientation: 'landscape' })}
                      className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-emerald-400">ಲ್ಯಾಂಡ್‌ಸ್ಕೇಪ್ (Landscape - A4 ಅಗಲ) [ಶಿಫಾರಸು]</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="page_orientation"
                      value="portrait"
                      checked={tempSettings.page_orientation === 'portrait'}
                      onChange={() => setTempSettings({ ...tempSettings, page_orientation: 'portrait' })}
                      className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>ಪೋರ್ಟ್ರೇಟ್ (Portrait - ಲಂಬ)</span>
                  </label>
                </div>
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
      {/* MODAL 4: SHAREHOLDER EDIT FLOW (Click Share No -> PIN Auth -> 38-Col Statutory Form) */}
      {/* ========================================================================= */}
      {editShareholderModal && !pinVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> ಅಧಿಕೃತ ಭದ್ರತಾ ದೃಢೀಕರಣ (Security PIN)
              </h2>
              <button
                onClick={() => {
                  setEditShareholderModal(null);
                  setPinInput('');
                  setPinVerified(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-200">
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800 text-blue-200 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-sky-300">
                  <span>🔒 ಶಾಸನಬದ್ಧ 38-ಕಾಲಂಗಳ ತಿದ್ದುಪಡಿ ನಮೂನೆ</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  ಶೇರು ಸಂಖ್ಯೆ: <strong className="text-emerald-400 font-mono">#{editShareholderModal.share_no}</strong> ({editShareholderModal.shareholder_name || editShareholderModal.name}) ರವರ ಅಧಿಕೃತ ಶಾಸನಬದ್ಧ ದಾಖಲೆ ತಿದ್ದುಪಡಿ ಮಾಡಲು ಆಪರೇಟರ್ ಪಿನ್ ನಮೂದಿಸಿ.
                </p>
                <p className="text-[10px] text-slate-400">
                  (ಡೀಫಾಲ್ಟ್ ಪಿನ್: <strong className="text-amber-400 font-mono">1234</strong> ಅಥವಾ ಆಡ್ಮಿನ್ ಪಾಸ್‌ವರ್ಡ್)
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-semibold">Security PIN / ಆಪರೇಟರ್ ಪಿನ್ *</label>
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN..."
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (pinInput === '1234' || pinInput === 'admin123' || user?.role === 'Admin') {
                        setPinVerified(true);
                        showToast('ಅಧಿಕೃತ ಪಿನ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಶಾಸನಬದ್ಧ ತಿದ್ದುಪಡಿ ನಮೂನೆ ತೆರೆಯಲಾಗುತ್ತಿದೆ...');
                      } else {
                        showToast('ತಪ್ಪಾದ ಪಿನ್ (Incorrect PIN). ದಯವಿಟ್ಟು ಸರಿಯಾದ ಪಿನ್ ನಮೂದಿಸಿ.', 'error');
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditShareholderModal(null);
                    setPinInput('');
                    setPinVerified(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  ರದ್ದುಮಾಡಿ (Cancel)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pinInput === '1234' || pinInput === 'admin123' || user?.role === 'Admin') {
                      setPinVerified(true);
                      showToast('ಅಧಿಕೃತ ಪಿನ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಶಾಸನಬದ್ಧ ತಿದ್ದುಪಡಿ ನಮೂನೆ ತೆರೆಯಲಾಗುತ್ತಿದೆ...');
                    } else {
                      showToast('ತಪ್ಪಾದ ಪಿನ್ (Incorrect PIN). ದಯವಿಟ್ಟು ಸರಿಯಾದ ಪಿನ್ ನಮೂದಿಸಿ.', 'error');
                    }
                  }}
                  className="px-5 py-2 bg-[#1d70b8] hover:bg-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition-colors"
                >
                  ದೃಢೀಕರಿಸಿ & ನಮೂನೆ ತೆರೆಯಿರಿ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* When PIN is verified, render the full Statutory 38-column EditShareholderForm */}
      {editShareholderModal && pinVerified && (
        <ShareholderForm
          initialData={editShareholderModal}
          onClose={() => {
            setEditShareholderModal(null);
            setPinVerified(false);
            setPinInput('');
          }}
          onSaveSuccess={async (updatedRecord) => {
            setEditShareholderModal(null);
            setPinVerified(false);
            setPinInput('');
            showToast(`ಶೇರುದಾರ #${updatedRecord?.share_no || editShareholderModal.share_no} ರವರ ಶಾಸನಬದ್ಧ ದಾಖಲೆ ಮತ್ತು ಇತಿಹಾಸ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!`, 'success');
            await loadInitialData();
          }}
        />
      )}
    </div>
  );
}
