import LoadingAnimation from '../Common/LoadingAnimation';
import TableScrollerContainer from '../Common/TableScrollerContainer';
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ApiService, getMemberTypeByCategory, getShareholderOwnership, getShareholderSharesCount } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, BarChart3, Filter, Search, Printer, Download, FileSpreadsheet,
  Building2, MapPin, Layers, Coins, Calendar, FileText, CheckCircle2, CheckSquare, Square,
  ChevronLeft, ChevronRight, RefreshCw, X, Eye, ArrowUpDown, ChevronDown,
  ChevronUp, ShieldCheck, PieChart, Sparkles, SlidersHorizontal, IndianRupee, Banknote
} from 'lucide-react';
import ShareholderProfile from '../Shareholders/ShareholderProfile';
import { useCompanyLogo, useHandshakeLogo, DEFAULT_LOGO_PATH, DEFAULT_HANDSHAKE_PATH } from '../../services/organizationService';

// Helper: Parse various date formats (DD/MM/YYYY, YYYY-MM-DD, Excel serials) into timestamp
function parseDateValue(dateVal) {
  if (!dateVal) return null;
  const str = String(dateVal).trim();
  if (!str || str === '—' || str === '-') return null;

  // Check Excel serial number (e.g. 8403, 29000, etc.)
  const num = Number(str);
  if (!isNaN(num) && num > 1000 && num < 60000) {
    const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
    return isNaN(jsDate.getTime()) ? null : jsDate.getTime();
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += year > 50 ? 1900 : 2000;
    const jsDate = new Date(year, month, day);
    return isNaN(jsDate.getTime()) ? null : jsDate.getTime();
  }

  // ISO / standard date
  const parsed = Date.parse(str);
  return isNaN(parsed) ? null : parsed;
}


// Classic Cooperative Handshake SVG Icon fallback
function CooperativeHandshakeIcon({ className = "w-20 h-12" }) {
  const handshakeLogo = useHandshakeLogo();
  const [imgError, setImgError] = React.useState(false);

  if (handshakeLogo && !imgError) {
    return (
      <img
        src={handshakeLogo}
        alt="Cooperative Handshake"
        className={`${className} object-contain filter drop-shadow-sm`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg viewBox="0 0 140 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="4,12 30,20 30,54 4,46" fill="#111" stroke="#000" strokeWidth="1.5" />
      <polygon points="30,20 36,22 36,52 30,54" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <polygon points="136,12 110,20 110,54 136,46" fill="#111" stroke="#000" strokeWidth="1.5" />
      <polygon points="110,20 104,22 104,52 110,54" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <path d="M 36 26 C 46 21, 56 25, 64 31 C 68 34, 70 39, 68 43 C 65 47, 58 49, 50 49 C 42 49, 36 47, 36 47 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <path d="M 104 25 C 94 20, 84 23, 76 28 C 70 32, 67 38, 70 43 C 74 48, 84 49, 92 48 C 100 47, 104 47, 104 47 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <path d="M 74 33 C 79 35, 82 40, 81 44" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 68 36 C 73 38, 76 43, 75 46" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 62 39 C 67 41, 70 45, 69 48" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 56 42 C 61 44, 64 47, 63 49" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 40 28 C 50 24, 60 29, 66 34" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Available Report Statutory Columns (Matching exact 15-column register from statutory layout)
export const AVAILABLE_REPORT_COLUMNS = [
  { id: 'sl_no', labelKn: 'ಕ್ರ.ಸಂ.', labelEn: 'Sl. No.', defaultSelected: true, align: 'center', width: 'w-10' },
  { id: 'date', labelKn: 'ದಿನಾಂಕ', labelEn: 'Date', defaultSelected: true, align: 'center', width: 'w-24' },
  { id: 'shareholder_name', labelKn: 'ಶೇರುದಾರರ ಹೆಸರು (Shareholder Name)', labelEn: 'Shareholder Name', defaultSelected: true, align: 'left', width: 'min-w-[190px]' },
  { id: 'place', labelKn: 'ಸ್ಥಳ (Place)', labelEn: 'Place', defaultSelected: true, align: 'center', width: 'min-w-[110px]' },
  { id: 'taluk', labelKn: 'ತಾಲೂಕು', labelEn: 'Taluk', defaultSelected: true, align: 'center', width: 'w-20' },
  { id: 'share_amount', labelKn: 'ಶೇರು ಮೊತ್ತ', labelEn: 'Share Amount', defaultSelected: true, align: 'right', width: 'w-24' },
  { id: 'admission_fee', labelKn: 'ಪ್ರವೇಶ ಶುಲ್ಕ', labelEn: 'Admission Fee', defaultSelected: true, align: 'right', width: 'w-20' },
  { id: 'total_amount', labelKn: 'ಒಟ್ಟು ಮೊತ್ತ', labelEn: 'Total Amount', defaultSelected: true, align: 'right', width: 'w-24' },
  { id: 'receipt_no', labelKn: 'ರಶೀದಿ ನಂ', labelEn: 'Receipt No', defaultSelected: true, align: 'center', width: 'w-20' },
  { id: 'number_of_shares', labelKn: 'ಶೇರು ಪ್ರಮಾಣ', labelEn: 'Shares Qty', defaultSelected: true, align: 'center', width: 'w-16' },
  { id: 'category', labelKn: 'ವರ್ಗ', labelEn: 'Category', defaultSelected: true, align: 'center', width: 'w-20' },
  { id: 'tharava_date', labelKn: 'ಠರಾವು ದಿನಾಂಕ', labelEn: 'Tharava Date', defaultSelected: true, align: 'center', width: 'w-24' },
  { id: 'tharava_no', labelKn: 'ಠರಾವು ನಂ', labelEn: 'Tharava No', defaultSelected: true, align: 'center', width: 'w-20' },
  { id: 'share_no', labelKn: 'ಶೇರು ಸಂಖ್ಯೆ', labelEn: 'Share No', defaultSelected: true, align: 'center', width: 'w-24' },
  { id: 'status', labelKn: 'ಸ್ಥಿತಿ', labelEn: 'Status', defaultSelected: true, align: 'center', width: 'w-20' },

  // Extra optional columns user can toggle on
  { id: 'district', labelKn: 'ಜಿಲ್ಲೆ', labelEn: 'District', defaultSelected: false, align: 'center', width: 'w-20' },
  { id: 'circle', labelKn: 'ವಲಯ (Circle)', labelEn: 'Circle', defaultSelected: false, align: 'center', width: 'min-w-[120px]' },
  { id: 'book_no', labelKn: 'ಪುಸ್ತಕ ನಂ (Book No)', labelEn: 'Book No', defaultSelected: false, align: 'center', width: 'w-20' },
  { id: 'aadhaar_card_no', labelKn: 'ಆಧಾರ್ ಕಾರ್ಡ್ ನಂ', labelEn: 'Aadhaar Card No', defaultSelected: false, align: 'center', width: 'w-32' },
  { id: 'mobile_no', labelKn: 'ಮೊಬೈಲ್ ನಂ', labelEn: 'Mobile No', defaultSelected: false, align: 'center', width: 'w-28' },
  { id: 'ownership', labelKn: 'ಮಾಲೀಕತ್ವ / ಸಂಬಂಧ', labelEn: 'Ownership', defaultSelected: false, align: 'center', width: 'w-24' },
  { id: 'member_type', labelKn: 'ಸದಸ್ಯತ್ವದ ವಿಧ', labelEn: 'Member Type', defaultSelected: false, align: 'left', width: 'min-w-[140px]' },
  { id: 'nominee_name', labelKn: 'ನಾಮಿನಿ ಹೆಸರು', labelEn: 'Nominee Name', defaultSelected: false, align: 'left', width: 'min-w-[140px]' },
  { id: 'address', labelKn: 'ಸಂಪೂರ್ಣ ವಿಳಾಸ', labelEn: 'Address', defaultSelected: false, align: 'left', width: 'min-w-[160px]' },
  { id: 'pin_code', labelKn: 'ಪಿನ್ ಕೋಡ್', labelEn: 'Pin Code', defaultSelected: false, align: 'center', width: 'w-20' }
];

// Date formatter supporting Excel serial numbers & ISO dates
function formatReportDate(dateVal) {
  if (!dateVal || dateVal === '—' || dateVal === '-') return '—';
  const str = String(dateVal).trim();
  const num = Number(str);
  if (!isNaN(num) && num > 1000 && num < 70000) {
    const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      const d = String(jsDate.getDate()).padStart(2, '0');
      const m = String(jsDate.getMonth() + 1).padStart(2, '0');
      const y = jsDate.getFullYear();
      return `${d}/${m}/${y}`;
    }
  }
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }
  return str;
}

export default function ShareholderReports() {
  const { showToast } = useAuth();
  const [allShareholders, setAllShareholders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Report Breakdown Tab:
  // 'placewise' | 'categorywise' | 'circlewise' | 'shareswise' | 'detailed'
  const [reportMode, setReportMode] = useState('placewise');

  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    place: '',
    circle: '',
    category: '',
    sharesBracket: '',
    ownership: '',
    status: '',
    tharavaNo: '',
    tharavaDate: '',
    cashAmount: '',
    minCash: '',
    maxCash: '',
    fromDate: '',
    toDate: '',
  });

  const [showFilterDrawer, setShowFilterDrawer] = useState(true);
  const [detailedPage, setDetailedPage] = useState(1);
  const [detailedPageSize, setDetailedPageSize] = useState(25);
  const [activeProfileId, setActiveProfileId] = useState(null);

  // Sorting state for summary tables
  const [sortField, setSortField] = useState('count');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const companyLogo = useCompanyLogo();
  const [logoError, setLogoError] = useState(false);
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



  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const records = await ApiService.getAllShareholdersRaw();
      if (Array.isArray(records)) {
        setAllShareholders(records);
      }
    } catch (err) {
      console.error('Failed to load shareholders for report:', err);
      showToast('ಶೇರುದಾರರ ವಿವರಗಳನ್ನು ಪಡೆಯುವಲ್ಲಿ ವಿಫಲವಾಗಿದೆ', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Extract distinct master option lists for filters
  const masterOptions = useMemo(() => {
    if (!allShareholders || allShareholders.length === 0) {
      const syncBaseline = ApiService.getFilterOptionsSync();
      return {
        places: (syncBaseline.villages || []).map(v => v.name).sort((a, b) => a.localeCompare(b, 'kn')),
        circles: (syncBaseline.circles || []).map(c => c.name).filter(c => c !== 'ಇತರೆ (Other)').sort((a, b) => a.localeCompare(b, 'kn')),
        categories: (syncBaseline.casts || []).sort((a, b) => a.localeCompare(b, 'kn')),
        tharavaNumbers: [],
        cashAmounts: (syncBaseline.amounts || []).sort((a, b) => a.amount - b.amount),
      };
    }

    const placesSet = new Set();
    const circlesSet = new Set();
    const categoriesSet = new Set();
    const tharavaSet = new Set();
    const cashAmountCounts = new Map();

    for (let i = 0; i < allShareholders.length; i++) {
      const s = allShareholders[i];
      const p = (s.place || s.village_name || '').trim();
      if (p) placesSet.add(p);

      const c = (s.circle || s.circle_name || '').trim();
      if (c && c !== 'ಇತರೆ (Other)') circlesSet.add(c);

      const cat = (s.schedule_cast || '').trim();
      if (cat) categoriesSet.add(cat);

      const tNo = (s.tharava_no || '').trim();
      if (tNo && tNo !== '—' && tNo !== '-') tharavaSet.add(tNo);

      const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000);
      if (amt > 0) {
        cashAmountCounts.set(amt, (cashAmountCounts.get(amt) || 0) + 1);
      }
    }

    const cashAmounts = Array.from(cashAmountCounts.entries())
      .map(([amount, count]) => ({ amount, count }))
      .sort((a, b) => a.amount - b.amount);

    return {
      places: Array.from(placesSet).sort((a, b) => a.localeCompare(b, 'kn')),
      circles: Array.from(circlesSet).sort((a, b) => a.localeCompare(b, 'kn')),
      categories: Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, 'kn')),
      tharavaNumbers: Array.from(tharavaSet).slice(0, 50).sort(),
      cashAmounts,
    };
  }, [allShareholders]);

  // Apply All Multi-Filters
  const filteredShareholders = useMemo(() => {
    let list = allShareholders;

    // 1. Text Search (Name, Share No, Sl No, Book No, Mobile, Aadhaar, Tharava, Place, Nominee)
    if (filters.search) {
      const q = filters.search.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const name = (s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
        const shNo = String(s.share_no || s.share_number || '').toLowerCase();
        const slNo = String(s.sl_no || s.id || '').toLowerCase();
        const bNo = String(s.book_no || '').toLowerCase();
        const mob = String(s.mobile_no || s.mobile || '');
        const aadh = String(s.aadhaar_card_no || s.aadhaar_ref || '');
        const plc = String(s.place || s.village_name || '').toLowerCase().normalize('NFC');
        const cir = String(s.circle || s.circle_name || '').toLowerCase().normalize('NFC');
        const nom = String(s.nominee_name || '').toLowerCase().normalize('NFC');
        const tharava = String(s.tharava_no || '').toLowerCase();

        return (
          name.includes(q) ||
          shNo.includes(q) ||
          slNo.includes(q) ||
          bNo.includes(q) ||
          mob.includes(q) ||
          aadh.includes(q) ||
          plc.includes(q) ||
          cir.includes(q) ||
          nom.includes(q) ||
          tharava.includes(q)
        );
      });
    }

    // 2. Place Filter
    if (filters.place) {
      const pq = filters.place.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const p = (s.place || s.village_name || '').trim().toLowerCase().normalize('NFC');
        return p === pq;
      });
    }

    // 3. Circle Filter
    if (filters.circle) {
      const cq = filters.circle.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const c = (s.circle || s.circle_name || '').trim().toLowerCase().normalize('NFC');
        return c === cq;
      });
    }

    // 4. Category / Class Filter
    if (filters.category) {
      const catQ = filters.category.trim().toLowerCase().normalize('NFC');
      list = list.filter(s => {
        const cat = (s.schedule_cast || '').trim().toLowerCase().normalize('NFC');
        return cat === catQ;
      });
    }

    // 5. Shares Bracket Filter
    if (filters.sharesBracket) {
      list = list.filter(s => {
        const cnt = getShareholderSharesCount(s);
        if (filters.sharesBracket === '0') return cnt === 0;
        if (filters.sharesBracket === '1') return cnt === 1;
        if (filters.sharesBracket === '2') return cnt === 2;
        if (filters.sharesBracket === '3-5') return cnt >= 3 && cnt <= 5;
        if (filters.sharesBracket === '6-10') return cnt >= 6 && cnt <= 10;
        if (filters.sharesBracket === '11+') return cnt >= 11;
        return true;
      });
    }

    // 6. Ownership Filter (Self / Varasa / Vargavane / Joint)
    if (filters.ownership) {
      list = list.filter(s => {
        const own = String(s.ownership || s.relationship || '').trim().toLowerCase();
        if (filters.ownership === 'self') {
          return own.includes('ಸ್ವಂತ') || own.includes('self') || own.includes('ಮೂಲ');
        }
        if (filters.ownership === 'varasa') {
          return own.includes('ವಾರಸ') || own.includes('ವಾರಸು') || own.includes('ಮಗ') || own.includes('ಪತ್ನಿ') || own.includes('ಹಕ್ಕು');
        }
        if (filters.ownership === 'vargavane') {
          return own.includes('ವರ್ಗಾವಣೆ') || own.includes('transfer');
        }
        if (filters.ownership === 'joint') {
          return own.includes('ಜಂಟಿ') || own.includes('ಸಂಸ್ಥೆ') || own.includes('ಸಹಕಾರ');
        }
        return true;
      });
    }

    // 7. Status Filter
    if (filters.status) {
      list = list.filter(s => (s.status || 'Active').toLowerCase() === filters.status.toLowerCase());
    }

    // 8. Tharava Number Filter
    if (filters.tharavaNo) {
      const tq = filters.tharavaNo.trim().toLowerCase();
      list = list.filter(s => {
        const t = String(s.tharava_no || '').trim().toLowerCase();
        return t.includes(tq);
      });
    }

    // 9. Tharava Date Filter
    if (filters.tharavaDate) {
      const tdQ = filters.tharavaDate.trim();
      list = list.filter(s => {
        const td = String(s.tharava_date || '').trim();
        return td.includes(tdQ);
      });
    }

    // 10. Date Range Filter (From Date - To Date)
    const fromTs = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
    const toTs = filters.toDate ? new Date(filters.toDate).getTime() + (24 * 60 * 60 * 1000 - 1) : null;

    if (fromTs !== null || toTs !== null) {
      list = list.filter(s => {
        const itemDateVal = s.date || s.reg_date || s.registration_date || s.tharava_date;
        const itemTs = parseDateValue(itemDateVal);
        if (!itemTs) return false;
        if (fromTs !== null && itemTs < fromTs) return false;
        if (toTs !== null && itemTs > toTs) return false;
        return true;
      });
    }

    // 11. Cash Amount Filter (Exact Cash Amount)
    if (filters.cashAmount) {
      const targetAmt = parseFloat(filters.cashAmount);
      if (!isNaN(targetAmt)) {
        list = list.filter(s => {
          const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (getShareholderSharesCount(s) * 2000);
          return amt === targetAmt;
        });
      }
    }

    // 12. Cash Amount Range (Min Cash - Max Cash)
    if (filters.minCash) {
      const min = parseFloat(filters.minCash);
      if (!isNaN(min)) {
        list = list.filter(s => {
          const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (getShareholderSharesCount(s) * 2000);
          return amt >= min;
        });
      }
    }
    if (filters.maxCash) {
      const max = parseFloat(filters.maxCash);
      if (!isNaN(max)) {
        list = list.filter(s => {
          const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (getShareholderSharesCount(s) * 2000);
          return amt <= max;
        });
      }
    }

    return list;
  }, [allShareholders, filters]);

  // High-Level KPI Aggregates
  const kpis = useMemo(() => {
    const totalCount = filteredShareholders.length;
    const totalShares = filteredShareholders.reduce((sum, s) => sum + getShareholderSharesCount(s), 0);
    const totalAmount = filteredShareholders.reduce((sum, s) => {
      const amt = parseFloat(s.total_amount) || (getShareholderSharesCount(s) * 2000);
      return sum + amt;
    }, 0);

    const places = new Set();
    const circles = new Set();
    let varasaCount = 0;
    let vargavaneCount = 0;

    filteredShareholders.forEach(s => {
      const p = (s.place || s.village_name || '').trim();
      if (p) places.add(p);
      const c = (s.circle || s.circle_name || '').trim();
      if (c && c !== 'ಇತರೆ (Other)') circles.add(c);

      const own = String(s.ownership || s.relationship || '').toLowerCase();
      if (own.includes('ವಾರಸ')) varasaCount++;
      if (own.includes('ವರ್ಗಾವಣೆ')) vargavaneCount++;
    });

    return {
      totalCount,
      totalShares,
      totalAmount,
      distinctPlaces: places.size,
      distinctCircles: circles.size,
      varasaCount,
      vargavaneCount,
      overallCount: allShareholders.length,
      pctOfOverall: allShareholders.length > 0 ? ((totalCount / allShareholders.length) * 100).toFixed(1) : 0,
    };
  }, [filteredShareholders, allShareholders]);

  // Detailed calculation of statutory totals across filteredShareholders
  const detailedTotals = useMemo(() => {
    if (reportMode !== 'detailed') {
      return { totalShares: kpis.totalShares, totalShareCapital: kpis.totalAmount, totalAdmissionFees: 0, totalCollection: kpis.totalAmount };
    }
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
  }, [reportMode, filteredShareholders, kpis]);

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
  };

  // Active filters count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.place) count++;
    if (filters.circle) count++;
    if (filters.category) count++;
    if (filters.sharesBracket) count++;
    if (filters.ownership) count++;
    if (filters.status) count++;
    if (filters.tharavaNo) count++;
    if (filters.tharavaDate) count++;
    if (filters.cashAmount || filters.minCash || filters.maxCash) count++;
    if (filters.fromDate || filters.toDate) count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      place: '',
      circle: '',
      category: '',
      sharesBracket: '',
      ownership: '',
      status: '',
      tharavaNo: '',
      tharavaDate: '',
      cashAmount: '',
      minCash: '',
      maxCash: '',
      fromDate: '',
      toDate: '',
    });
    setDetailedPage(1);
    showToast('ಎಲ್ಲಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ');
  };

  // Helper to drill-down into detailed view for a specific filter value
  const handleDrillDown = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setReportMode('detailed');
    setDetailedPage(1);
  };

  // 1. PLACEWISE AGGREGATION
  const placewiseData = useMemo(() => {
    if (reportMode !== 'placewise') return [];
    const map = new Map();
    filteredShareholders.forEach(s => {
      const place = (s.place || s.village_name || 'ಗೊತ್ತಿಲ್ಲದ ಗ್ರಾಮ').trim();
      const circle = (s.circle || s.circle_name || 'ಇತರೆ').trim();
      const taluk = (s.taluk || 'ಇಂಡಿ').trim();
      const shares = getShareholderSharesCount(s);
      const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (shares * 2000);

      if (!map.has(place)) {
        map.set(place, {
          place,
          circle,
          taluk,
          count: 0,
          totalShares: 0,
          totalAmount: 0,
        });
      }

      const rec = map.get(place);
      rec.count += 1;
      rec.totalShares += shares;
      rec.totalAmount += amt;
    });

    const arr = Array.from(map.values()).map(r => ({
      ...r,
      sharePct: kpis.totalShares > 0 ? ((r.totalShares / kpis.totalShares) * 100).toFixed(1) : 0,
      memberPct: kpis.totalCount > 0 ? ((r.count / kpis.totalCount) * 100).toFixed(1) : 0,
    }));

    return arr.sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' ? a.place.localeCompare(b.place, 'kn') : b.place.localeCompare(a.place, 'kn');
      }
      if (sortField === 'shares') {
        return sortOrder === 'asc' ? a.totalShares - b.totalShares : b.totalShares - a.totalShares;
      }
      if (sortField === 'amount') {
        return sortOrder === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
      }
      // default: count
      return sortOrder === 'asc' ? a.count - b.count : b.count - a.count;
    });
  }, [reportMode, filteredShareholders, kpis, sortField, sortOrder]);

  // 2. CATEGORYWISE AGGREGATION
  const categorywiseData = useMemo(() => {
    if (reportMode !== 'categorywise') return [];
    const map = new Map();
    filteredShareholders.forEach(s => {
      const cat = (s.schedule_cast || 'ಇತರೆ ವರ್ಗ').trim();
      const memberType = getMemberTypeByCategory(cat, s.member_type);
      const shares = getShareholderSharesCount(s);
      const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (shares * 2000);

      if (!map.has(cat)) {
        map.set(cat, {
          category: cat,
          memberType,
          count: 0,
          totalShares: 0,
          totalAmount: 0,
        });
      }

      const rec = map.get(cat);
      rec.count += 1;
      rec.totalShares += shares;
      rec.totalAmount += amt;
    });

    const arr = Array.from(map.values()).map(r => ({
      ...r,
      sharePct: kpis.totalShares > 0 ? ((r.totalShares / kpis.totalShares) * 100).toFixed(1) : 0,
      memberPct: kpis.totalCount > 0 ? ((r.count / kpis.totalCount) * 100).toFixed(1) : 0,
    }));

    return arr.sort((a, b) => b.count - a.count);
  }, [reportMode, filteredShareholders, kpis]);

  // 3. CIRCLEWISE AGGREGATION
  const circlewiseData = useMemo(() => {
    if (reportMode !== 'circlewise') return [];
    const map = new Map();
    filteredShareholders.forEach(s => {
      const circle = (s.circle || s.circle_name || 'ಇತರೆ (Other)').trim();
      const place = (s.place || s.village_name || '').trim();
      const shares = getShareholderSharesCount(s);
      const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (shares * 2000);

      if (!map.has(circle)) {
        map.set(circle, {
          circle,
          placesSet: new Set(),
          count: 0,
          totalShares: 0,
          totalAmount: 0,
        });
      }

      const rec = map.get(circle);
      rec.count += 1;
      rec.totalShares += shares;
      rec.totalAmount += amt;
      if (place) rec.placesSet.add(place);
    });

    const arr = Array.from(map.values()).map(r => ({
      circle: r.circle,
      placesCount: r.placesSet.size,
      count: r.count,
      totalShares: r.totalShares,
      totalAmount: r.totalAmount,
      sharePct: kpis.totalShares > 0 ? ((r.totalShares / kpis.totalShares) * 100).toFixed(1) : 0,
      memberPct: kpis.totalCount > 0 ? ((r.count / kpis.totalCount) * 100).toFixed(1) : 0,
    }));

    return arr.sort((a, b) => b.count - a.count);
  }, [reportMode, filteredShareholders, kpis]);

  // 4. SHARESWISE AGGREGATION (1, 2, 3-5, 6-10, 11+)
  const shareswiseData = useMemo(() => {
    if (reportMode !== 'shareswise') return [];
    const tiers = [
      { key: '0', label: '0 ಶೇರುಗಳು (ಅಪೂರ್ಣ ಕಂತು)', desc: 'ಕಂತು ಅಪೂರ್ಣವಾಗಿರುವ ಸದಸ್ಯರು (0 ಷೇರು)', count: 0, totalShares: 0, totalAmount: 0 },
      { key: '1', label: '1 ಶೇರು (1 Share)', desc: '₹ 2,000 ಮುಖಬೆಲೆ - ಸಾಮಾನ್ಯ ಬೆಳೆಗಾರ ಸದಸ್ಯರು', count: 0, totalShares: 0, totalAmount: 0 },
      { key: '2', label: '2 ಶೇರುಗಳು (2 Shares)', desc: '₹ 4,000 ಮುಖಬೆಲೆ - ಮಧ್ಯಮ ಶೇರುದಾರರು', count: 0, totalShares: 0, totalAmount: 0 },
      { key: '3-5', label: '3 ರಿಂದ 5 ಶೇರುಗಳು (3-5 Shares)', desc: '₹ 6,000 - ₹ 10,000 ಮುಖಬೆಲೆ', count: 0, totalShares: 0, totalAmount: 0 },
      { key: '6-10', label: '6 ರಿಂದ 10 ಶೇರುಗಳು (6-10 Shares)', desc: '₹ 12,000 - ₹ 20,000 ಮುಖಬೆಲೆ', count: 0, totalShares: 0, totalAmount: 0 },
      { key: '11+', label: '11 ಮತ್ತು ಹೆಚ್ಚಿನ ಶೇರುಗಳು (11+ Shares)', desc: 'ಗರಿಷ್ಠ ಶೇರುದಾರರು & ಸಂಸ್ಥೆಗಳು', count: 0, totalShares: 0, totalAmount: 0 },
    ];

    for (let i = 0; i < filteredShareholders.length; i++) {
      const s = filteredShareholders[i];
      const cnt = getShareholderSharesCount(s);
      const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (cnt * 2000);
      let tierIdx = 0;
      if (cnt === 0) tierIdx = 0;
      else if (cnt === 1) tierIdx = 1;
      else if (cnt === 2) tierIdx = 2;
      else if (cnt <= 5) tierIdx = 3;
      else if (cnt <= 10) tierIdx = 4;
      else tierIdx = 5;

      tiers[tierIdx].count += 1;
      tiers[tierIdx].totalShares += cnt;
      tiers[tierIdx].totalAmount += amt;
    }

    return tiers.map(tier => ({
      ...tier,
      sharePct: kpis.totalShares > 0 ? ((tier.totalShares / kpis.totalShares) * 100).toFixed(1) : 0,
      memberPct: kpis.totalCount > 0 ? ((tier.count / kpis.totalCount) * 100).toFixed(1) : 0,
    }));
  }, [reportMode, filteredShareholders, kpis]);

  // 5. CASH AMOUNTWISE AGGREGATION (ನಗದು ಮೊತ್ತವಾರು ವಿಂಗಡಣೆ)
  const amountwiseData = useMemo(() => {
    if (reportMode !== 'amountwise') return [];
    const map = new Map();
    filteredShareholders.forEach(s => {
      const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (getShareholderSharesCount(s) * 2000);
      const shares = getShareholderSharesCount(s);

      if (!map.has(amt)) {
        map.set(amt, {
          amount: amt,
          count: 0,
          totalShares: 0,
          totalAmount: 0,
        });
      }

      const rec = map.get(amt);
      rec.count += 1;
      rec.totalShares += shares;
      rec.totalAmount += amt;
    });

    const arr = Array.from(map.values()).map(r => ({
      ...r,
      sharePct: kpis.totalShares > 0 ? ((r.totalShares / kpis.totalShares) * 100).toFixed(1) : 0,
      memberPct: kpis.totalCount > 0 ? ((r.count / kpis.totalCount) * 100).toFixed(1) : 0,
    }));

    return arr.sort((a, b) => {
      if (sortField === 'count') {
        return sortOrder === 'asc' ? a.count - b.count : b.count - a.count;
      }
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    });
  }, [reportMode, filteredShareholders, kpis, sortField, sortOrder]);

  // Paginated detailed members list
  const detailedPaginated = useMemo(() => {
    if (detailedPageSize === 'all') return filteredShareholders;
    const start = (detailedPage - 1) * detailedPageSize;
    return filteredShareholders.slice(start, start + detailedPageSize);
  }, [filteredShareholders, detailedPage, detailedPageSize]);

  const totalDetailedPages = useMemo(() => {
    if (detailedPageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredShareholders.length / detailedPageSize));
  }, [filteredShareholders.length, detailedPageSize]);

  // EXCEL EXPORT HANDLER
  const handleExportExcel = () => {
    try {
      showToast('ಎಕ್ಸೆಲ್ ವರದಿ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...');
      const wb = XLSX.utils.book_new();

      // Get readable label of active filters
      const filterSummary = [];
      if (filters.place) filterSummary.push(`ಸ್ಥಳ: ${filters.place}`);
      if (filters.circle) filterSummary.push(`ವಲಯ: ${filters.circle}`);
      if (filters.category) filterSummary.push(`ವರ್ಗ: ${filters.category}`);
      if (filters.sharesBracket) filterSummary.push(`ಶೇರುಗಳು: ${filters.sharesBracket}`);
      if (filters.ownership) filterSummary.push(`ಮಾಲೀಕತ್ವ: ${filters.ownership}`);
      if (filters.status) filterSummary.push(`ಸ್ಥಿತಿ: ${filters.status}`);
      if (filters.tharavaNo) filterSummary.push(`ಠರಾವು ನಂ.: ${filters.tharavaNo}`);
      if (filters.cashAmount) filterSummary.push(`ನಗದು ಮೊತ್ತ: ₹${Number(filters.cashAmount).toLocaleString('en-IN')}`);
      if (filters.minCash || filters.maxCash) filterSummary.push(`ನಗದು ವ್ಯಾಪ್ತಿ: ₹${filters.minCash || '0'} - ₹${filters.maxCash || '∞'}`);
      if (filters.fromDate || filters.toDate) filterSummary.push(`ದಿನಾಂಕ: ${filters.fromDate || 'ಪ್ರಾರಂಭ'} ದಿಂದ ${filters.toDate || 'ಇಂದಿನವರೆಗೆ'}`);

      // 1. Export Current Breakdown Sheet
      if (reportMode === 'placewise') {
        const rows = [
          ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204'],
          ['ಗ್ರಾಮವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ (Place-wise Shareholders Summary Report)'],
          [`ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')} | ಫಿಲ್ಟರ್‌ಗಳು: ${filterSummary.join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ'}`],
          [`ಒಟ್ಟು ಗ್ರಾಮಗಳು: ${placewiseData.length} | ಒಟ್ಟು ಸದಸ್ಯರು: ${kpis.totalCount} | ಒಟ್ಟು ಶೇರುಗಳು: ${kpis.totalShares} | ಒಟ್ಟು ಬಂಡವಾಳ: ₹ ${kpis.totalAmount.toLocaleString('en-IN')}`],
          [],
          ['ಕ್ರ.ಸಂ.', 'ಸ್ಥಳ / ಗ್ರಾಮ (Place/Village)', 'ವಲಯ (Circle)', 'ತಾಲೂಕು (Taluk)', 'ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)', 'ಒಟ್ಟು ಶೇರುಗಳು (Total Shares)', 'ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital Value)', 'ಸದಸ್ಯರ ಶೇಕಡಾವಾರು (%)', 'ಶೇರುಗಳ ಶೇಕಡಾವಾರು (%)']
        ];

        placewiseData.forEach((r, idx) => {
          rows.push([
            idx + 1,
            r.place,
            r.circle,
            r.taluk,
            r.count,
            r.totalShares,
            r.totalAmount,
            `${r.memberPct}%`,
            `${r.sharePct}%`
          ]);
        });

        rows.push([
          'ಒಟ್ಟು (Total)',
          `${placewiseData.length} ಗ್ರಾಮಗಳು`,
          '—',
          '—',
          kpis.totalCount,
          kpis.totalShares,
          kpis.totalAmount,
          '100%',
          '100%'
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Place-wise Summary');
      } else if (reportMode === 'categorywise') {
        const rows = [
          ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204'],
          ['ವರ್ಗವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ (Category-wise Shareholders Summary Report)'],
          [`ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')} | ಫಿಲ್ಟರ್‌ಗಳು: ${filterSummary.join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ'}`],
          [],
          ['ಕ್ರ.ಸಂ.', 'ವರ್ಗ (Category / Class)', 'ಸದಸ್ಯರ ಪ್ರಕಾರ (Member Type)', 'ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)', 'ಒಟ್ಟು ಶೇರುಗಳು (Total Shares)', 'ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital Value)', 'ಸದಸ್ಯರ ಶೇಕಡಾವಾರು (%)']
        ];

        categorywiseData.forEach((r, idx) => {
          rows.push([
            idx + 1,
            r.category,
            r.memberType,
            r.count,
            r.totalShares,
            r.totalAmount,
            `${r.memberPct}%`
          ]);
        });

        rows.push([
          'ಒಟ್ಟು (Total)',
          '—',
          '—',
          kpis.totalCount,
          kpis.totalShares,
          kpis.totalAmount,
          '100%'
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Category-wise Summary');
      } else if (reportMode === 'circlewise') {
        const rows = [
          ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204'],
          ['ವಲಯವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ (Circle-wise Shareholders Summary Report)'],
          [`ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')} | ಫಿಲ್ಟರ್‌ಗಳು: ${filterSummary.join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ'}`],
          [],
          ['ಕ್ರ.ಸಂ.', 'ವಲಯದ ಹೆಸರು (Circle Name)', 'ಗ್ರಾಮಗಳ ಸಂಖ್ಯೆ (Villages)', 'ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)', 'ಒಟ್ಟು ಶೇರುಗಳು (Total Shares)', 'ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital Value)', 'ಸದಸ್ಯರ ಶೇಕಡಾವಾರು (%)']
        ];

        circlewiseData.forEach((r, idx) => {
          rows.push([
            idx + 1,
            r.circle,
            r.placesCount,
            r.count,
            r.totalShares,
            r.totalAmount,
            `${r.memberPct}%`
          ]);
        });

        rows.push([
          'ಒಟ್ಟು (Total)',
          '—',
          kpis.distinctPlaces,
          kpis.totalCount,
          kpis.totalShares,
          kpis.totalAmount,
          '100%'
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Circle-wise Summary');
      } else if (reportMode === 'shareswise') {
        const rows = [
          ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204'],
          ['ಶೇರುವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ (Shares-wise Distribution Report)'],
          [`ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')} | ಫಿಲ್ಟರ್‌ಗಳು: ${filterSummary.join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ'}`],
          [],
          ['ಕ್ರ.ಸಂ.', 'ಶೇರುಗಳ ಶ್ರೇಣಿ (Shares Bracket)', 'ವಿವರಣೆ (Description)', 'ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)', 'ಒಟ್ಟು ಶೇರುಗಳು (Total Shares)', 'ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital Value)', 'ಸದಸ್ಯರ ಶೇಕಡಾವಾರು (%)']
        ];

        shareswiseData.forEach((r, idx) => {
          rows.push([
            idx + 1,
            r.label,
            r.desc,
            r.count,
            r.totalShares,
            r.totalAmount,
            `${r.memberPct}%`
          ]);
        });

        rows.push([
          'ಒಟ್ಟು (Total)',
          '—',
          '—',
          kpis.totalCount,
          kpis.totalShares,
          kpis.totalAmount,
          '100%'
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Shares-wise Summary');
      } else if (reportMode === 'amountwise') {
        const rows = [
          ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204'],
          ['ನಗದು ಮೊತ್ತವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ (Cash Amount-wise Shareholders Summary Report)'],
          [`ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')} | ಫಿಲ್ಟರ್‌ಗಳು: ${filterSummary.join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ'}`],
          [`ಒಟ್ಟು ನಗದು ವರ್ಗಗಳು: ${amountwiseData.length} | ಒಟ್ಟು ಸದಸ್ಯರು: ${kpis.totalCount} | ಒಟ್ಟು ಶೇರುಗಳು: ${kpis.totalShares} | ಒಟ್ಟು ಮೊತ್ತ: ₹ ${kpis.totalAmount.toLocaleString('en-IN')}`],
          [],
          ['ಕ್ರ.ಸಂ.', 'ನಗದು ಮೊತ್ತ (Cash Amount ₹)', 'ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)', 'ಒಟ್ಟು ಶೇರುಗಳು (Total Shares)', 'ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital Value)', 'ಸದಸ್ಯರ ಶೇಕಡಾವಾರು (%)', 'ಶೇರುಗಳ ಶೇಕಡಾವಾರು (%)']
        ];

        amountwiseData.forEach((r, idx) => {
          rows.push([
            idx + 1,
            `₹ ${r.amount.toLocaleString('en-IN')}`,
            r.count,
            r.totalShares,
            r.totalAmount,
            `${r.memberPct}%`,
            `${r.sharePct}%`
          ]);
        });

        rows.push([
          'ಒಟ್ಟು (Total)',
          `${amountwiseData.length} ನಗದು ವರ್ಗಗಳು`,
          kpis.totalCount,
          kpis.totalShares,
          kpis.totalAmount,
          '100%',
          '100%'
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Cash-Amount-wise Summary');
      }

      // 2. Export Detailed Members List Sheet with Selected Columns
      const activeCols = AVAILABLE_REPORT_COLUMNS.filter(c => selectedColumns.includes(c.id));
      const excelHeaders = activeCols.map(c => c.labelKn);
      const memberRows = [
        ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ'],
        ['SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR'],
        [`ಶೇರು ವಿಭಾಗ - ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ವಹಿ (${activeCols.length} ಕಾಲಂ ರಿಜಿಸ್ಟರ್)`],
        [`ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')} | ವ್ಯಾಪ್ತಿ: ${filterSummary.join(', ') || 'ಶೋಧಿತ ಎಲ್ಲಾ ದಾಖಲೆಗಳು'} (${filteredShareholders.length} ಜನ)`],
        [`ಒಟ್ಟು ದಾಖಲೆಗಳು: ${filteredShareholders.length} | ಒಟ್ಟು ಶೇರುಗಳು: ${detailedTotals.totalShares || kpis.totalShares} | ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ: ₹ ${(detailedTotals.totalCollection || kpis.totalAmount).toLocaleString('en-IN')}`],
        [],
        excelHeaders
      ];

      filteredShareholders.forEach((s, idx) => {
        const row = activeCols.map(col => getColValue(s, col.id, idx + 1));
        memberRows.push(row);
      });

      const memberWs = XLSX.utils.aoa_to_sheet(memberRows);
      XLSX.utils.book_append_sheet(wb, memberWs, 'Member-wise Details');

      // Write File
      const filename = `BSSKN_Shareholders_Report_${reportMode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast(`ಎಕ್ಸೆಲ್ ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ: ${filename}`);
    } catch (err) {
      console.error('Excel Export Error:', err);
      showToast('ಎಕ್ಸೆಲ್ ರಫ್ತು ಮಾಡುವಾಗ ದೋಷ ಸಂಭವಿಸಿದೆ', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
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
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showFilterDrawer || activeFiltersCount > 0
                ? 'bg-slate-800 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
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
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Bar (Calculated from filtered records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</span>
            <Users className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 text-lg font-black text-slate-100">
            {kpis.totalCount.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ಒಟ್ಟು {kpis.overallCount.toLocaleString('en-IN')} ಪೈಕಿ ({kpis.pctOfOverall}%)
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>ಒಟ್ಟು ಶೇರುಗಳು (Total Shares)</span>
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 text-lg font-black text-emerald-400">
            {kpis.totalShares.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ಸರಾಸರಿ: {(kpis.totalCount > 0 ? kpis.totalShares / kpis.totalCount : 0).toFixed(2)} / ಸದಸ್ಯ
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>ಶೇರು ಬಂಡವಾಳ (Capital Value)</span>
            <Coins className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 text-lg font-black text-amber-400">
            ₹ {(kpis.totalAmount / 100000).toFixed(2)} ಲಕ್ಷ
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ₹ {kpis.totalAmount.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>ಗ್ರಾಮಗಳು (Villages/Places)</span>
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 text-lg font-black text-sky-300">
            {kpis.distinctPlaces}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ಸ್ಥಳವಾರು ವ್ಯಾಪ್ತಿ
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>ವಲಯಗಳು (Circles)</span>
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-1 text-lg font-black text-purple-300">
            {kpis.distinctCircles}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ಕಾರ್ಯವ್ಯಾಪ್ತಿ ವಲಯಗಳು
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>ವಾರಸುದಾರರು / ವರ್ಗಾವಣೆ</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 text-lg font-black text-cyan-300">
            {kpis.varasaCount + kpis.vargavaneCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ವಾರಸ: {kpis.varasaCount} | ವರ್ಗ: {kpis.vargavaneCount}
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Multi-Filter Drawer */}
      {showFilterDrawer && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 no-print shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                ಬಹುಮುಖ ಫಿಲ್ಟರ್‌ಗಳು (Advanced Multi-Filters)
              </h3>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {activeFiltersCount} ಫಿಲ್ಟರ್‌ಗಳು ಅನ್ವಯವಾಗಿವೆ
                </span>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> ಎಲ್ಲಾ ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ (Reset Filters)
              </button>
            )}
          </div>

          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Global Search Box */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">ಹುಡುಕಾಟ (Search Keyword):</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ಹೆಸರು, ಶೇರು ನಂ, ಪುಸ್ತಕ, ಮೊಬೈಲ್..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 2. Placewise (ಗ್ರಾಮ / ಸ್ಥಳ) */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>ಸ್ಥಳ / ಗ್ರಾಮ (Place / Village):</span>
                {filters.place && (
                  <button onClick={() => setFilters(prev => ({ ...prev, place: '' }))} className="text-slate-500 hover:text-slate-300 text-[10px]">Clear</button>
                )}
              </label>
              <select
                value={filters.place}
                onChange={(e) => setFilters(prev => ({ ...prev, place: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="">ಎಲ್ಲಾ ಸ್ಥಳಗಳು / ಗ್ರಾಮಗಳು (All Places)</option>
                {masterOptions.places.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 3. Circlewise (ವಲಯ) */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>ವಲಯ (Circle / Zone):</span>
                {filters.circle && (
                  <button onClick={() => setFilters(prev => ({ ...prev, circle: '' }))} className="text-slate-500 hover:text-slate-300 text-[10px]">Clear</button>
                )}
              </label>
              <select
                value={filters.circle}
                onChange={(e) => setFilters(prev => ({ ...prev, circle: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="">ಎಲ್ಲಾ ವಲಯಗಳು (All Circles)</option>
                {masterOptions.circles.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 4. Categorywise (ವರ್ಗ / Class) */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>ವರ್ಗ / ವರ್ಗಾವಣೆ (Category / Class):</span>
                {filters.category && (
                  <button onClick={() => setFilters(prev => ({ ...prev, category: '' }))} className="text-slate-500 hover:text-slate-300 text-[10px]">Clear</button>
                )}
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="">ಎಲ್ಲಾ ವರ್ಗಗಳು (All Categories)</option>
                {masterOptions.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 5. Shares Bracket (ಶೇರುವಾರು) */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">ಶೇರುಗಳ ಸಂಖ್ಯೆ (Shares Bracket):</label>
              <select
                value={filters.sharesBracket}
                onChange={(e) => setFilters(prev => ({ ...prev, sharesBracket: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="">ಎಲ್ಲಾ ಶೇರುಗಳು (All Share Counts)</option>
                <option value="0">0 ಶೇರುಗಳು (ಅಪೂರ್ಣ - ₹1,000 ಬಾಕಿ)</option>
                <option value="1">1 ಶೇರು ಮಾತ್ರ (1 Share - ₹ 2,000)</option>
                <option value="2">2 ಶೇರುಗಳು (2 Shares - ₹ 4,000)</option>
                <option value="3-5">3 ರಿಂದ 5 ಶೇರುಗಳು (3 to 5 Shares)</option>
                <option value="6-10">6 ರಿಂದ 10 ಶೇರುಗಳು (6 to 10 Shares)</option>
                <option value="11+">11 ಮತ್ತು ಹೆಚ್ಚಿನ ಶೇರುಗಳು (11+ Shares)</option>
              </select>
            </div>

            {/* 6. Ownership wise (ಮಾಲೀಕತ್ವವಾರು) */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">ಮಾಲೀಕತ್ವ (Ownership Status):</label>
              <select
                value={filters.ownership}
                onChange={(e) => setFilters(prev => ({ ...prev, ownership: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="">ಎಲ್ಲಾ ಮಾಲೀಕತ್ವ (All Ownerships)</option>
                <option value="self">ಸ್ವಂತ (Self / Original Shareholder)</option>
                <option value="varasa">ವಾರಸದಾರರು (Varasa / Legal Heir)</option>
                <option value="vargavane">ವರ್ಗಾವಣೆ (Vargavane / Transferred)</option>
                <option value="joint">ಜಂಟಿ / ಸಂಸ್ಥೆ (Joint / Institutional)</option>
              </select>
            </div>

            {/* 7. Tharava wise (ಠರಾವು ನಂ. & ದಿನಾಂಕ) */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">ಠರಾವು ಸಂಖ್ಯೆ (Taravu No.):</label>
              <input
                type="text"
                placeholder="ಉದಾ: TR-1, 9, 28/02..."
                value={filters.tharavaNo}
                onChange={(e) => setFilters(prev => ({ ...prev, tharavaNo: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            {/* 8. Status Filter */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">ಸ್ಥಿತಿ (Active / Inactive Status):</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="">ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು (Active & Inactive)</option>
                <option value="Active">Active (ಸಕ್ರಿಯ)</option>
                <option value="Inactive">Inactive (ನಿಷ್ಕ್ರಿಯ)</option>
              </select>
            </div>

            {/* 9. From Date */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">ದಿನಾಂಕದಿಂದ (From Date):</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            {/* 10. To Date */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">ದಿನಾಂಕದವರೆಗೆ (To Date):</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            {/* 11. Cash Amount Filter (ನಿಖರ ನಗದು ಮೊತ್ತ / Total Amount ಕಾಲಂ ಆಯ್ಕೆ) */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>ನಗದು ಮೊತ್ತ / ಒಟ್ಟು ಮೊತ್ತ (Total Amount):</span>
                {filters.cashAmount && (
                  <button onClick={() => setFilters(prev => ({ ...prev, cashAmount: '' }))} className="text-slate-500 hover:text-slate-300 text-[10px]">Clear</button>
                )}
              </label>
              <select
                value={filters.cashAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, cashAmount: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500 font-medium"
              >
                <option value="">ಎಲ್ಲಾ ನಗದು ಮೊತ್ತಗಳು (All Total Amounts)</option>
                {masterOptions.cashAmounts.map(c => (
                  <option key={c.amount} value={c.amount}>
                    ₹ {c.amount.toLocaleString('en-IN')} ({c.count} ಸದಸ್ಯರು)
                  </option>
                ))}
              </select>
            </div>

            {/* 12. Cash Amount Range (ಕನಿಷ್ಠ & ಗರಿಷ್ಠ ನಗದು ವ್ಯಾಪ್ತಿ) */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">ನಗದು ವ್ಯಾಪ್ತಿ ₹ (Min - Max):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="ಕನಿಷ್ಠ ₹"
                  value={filters.minCash}
                  onChange={(e) => setFilters(prev => ({ ...prev, minCash: e.target.value }))}
                  className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 outline-none focus:border-emerald-500 text-xs"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder="ಗರಿಷ್ಠ ₹"
                  value={filters.maxCash}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxCash: e.target.value }))}
                  className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Report Breakdown Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 no-print">
        <button
          onClick={() => { setReportMode('placewise'); setSortField('count'); setSortOrder('desc'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reportMode === 'placewise'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. ಸ್ಥಳವಾರು ವರದಿ (Place-wise)</span>
          <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px]">
            {placewiseData.length}
          </span>
        </button>

        <button
          onClick={() => setReportMode('categorywise')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reportMode === 'categorywise'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. ವರ್ಗವಾರು ವರದಿ (Category-wise)</span>
          <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px]">
            {categorywiseData.length}
          </span>
        </button>

        <button
          onClick={() => setReportMode('circlewise')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reportMode === 'circlewise'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>3. ವಲಯವಾರು ವರದಿ (Circle-wise)</span>
          <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px]">
            {circlewiseData.length}
          </span>
        </button>

        <button
          onClick={() => setReportMode('shareswise')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reportMode === 'shareswise'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>4. ಶೇರುವಾರು ವರದಿ (Shares-wise)</span>
          <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px]">
            {shareswiseData.length}
          </span>
        </button>

        <button
          onClick={() => { setReportMode('amountwise'); setSortField('amount'); setSortOrder('desc'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reportMode === 'amountwise'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>5. ನಗದು ಮೊತ್ತವಾರು ವರದಿ (Cash Amount-wise)</span>
          <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px]">
            {amountwiseData.length}
          </span>
        </button>

        <button
          onClick={() => setReportMode('detailed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reportMode === 'detailed'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>6. ಶೇರುದಾರರ ನೋಂದಣಿ ವಹಿ (15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್)</span>
          <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px]">
            {kpis.totalCount}
          </span>
        </button>
      </div>

      {/* 5. OFFICIAL PRINTABLE REPORT CONTAINER */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 printable-area">
        {/* Printable Official Header */}
        <div className="border-b-2 border-slate-700/80 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 print:hidden"></span>
                <h2 className="text-xl font-black text-emerald-400 print:text-black tracking-wide">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204
                </h2>
              </div>
              <p className="text-xs text-slate-300 print:text-gray-700 font-medium mt-0.5">
                Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-slate-900 print:bg-gray-100 text-slate-200 print:text-black border border-slate-800 print:border-gray-400 uppercase">
                  {reportMode === 'placewise' && 'ಅಧಿಕೃತ ಗ್ರಾಮವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ (Place-wise Shareholders Summary Report)'}
                  {reportMode === 'categorywise' && 'ಅಧಿಕೃತ ವರ್ಗವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ (Category-wise Shareholders Summary Report)'}
                  {reportMode === 'circlewise' && 'ಅಧಿಕೃತ ವಲಯವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ (Circle-wise Shareholders Summary Report)'}
                  {reportMode === 'shareswise' && 'ಅಧಿಕೃತ ಶೇರುವಾರು ವಿತರಣೆ ವರದಿ (Shares-wise Distribution Report)'}
                  {reportMode === 'amountwise' && 'ಅಧಿಕೃತ ನಗದು ಮೊತ್ತವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ (Cash Amount-wise Shareholders Summary Report)'}
                  {reportMode === 'detailed' && 'ಶೇರುದಾರರ ಸದಸ್ಯರ ಸಮಗ್ರ ನಮೂನೆ ವಹಿ ವರದಿ (Detailed Shareholders Master Register)'}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 print:text-gray-700 font-mono space-y-1">
              <div>ಮುದ್ರಣ ದಿನಾಂಕ: {new Date().toLocaleString('kn-IN')}</div>
              <div>ಫಿಲ್ಟರ್ ಮಾಡಿದ ಸದಸ್ಯರು: <strong className="text-emerald-400 print:text-black">{kpis.totalCount}</strong></div>
              <div>ಒಟ್ಟು ಶೇರುಗಳು: <strong className="text-slate-200 print:text-black">{kpis.totalShares.toLocaleString('en-IN')}</strong></div>
              <div>ಒಟ್ಟು ಶೇರು ಬಂಡವಾಳ: <strong className="text-amber-400 print:text-black">₹ {kpis.totalAmount.toLocaleString('en-IN')}</strong></div>
            </div>
          </div>

          {/* Active Filter Criteria Sub-banner */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 print:text-gray-600">
              <span className="font-bold text-slate-300 print:text-black">ಅನ್ವಯಿಸಲಾದ ಫಿಲ್ಟರ್‌ಗಳು:</span>
              {filters.search && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ಕೀವರ್ಡ್: "{filters.search}"</span>}
              {filters.place && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ಗ್ರಾಮ: {filters.place}</span>}
              {filters.circle && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ವಲಯ: {filters.circle}</span>}
              {filters.category && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ವರ್ಗ: {filters.category}</span>}
              {filters.sharesBracket && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ಶೇರುಗಳು: {filters.sharesBracket}</span>}
              {filters.ownership && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ಮಾಲೀಕತ್ವ: {filters.ownership}</span>}
              {filters.status && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ಸ್ಥಿತಿ: {filters.status}</span>}
              {filters.tharavaNo && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ಠರಾವು: #{filters.tharavaNo}</span>}
              {filters.cashAmount && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ನಗದು ಮೊತ್ತ: ₹{Number(filters.cashAmount).toLocaleString('en-IN')}</span>}
              {(filters.minCash || filters.maxCash) && (
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  ನಗದು ವ್ಯಾಪ್ತಿ: ₹{filters.minCash || '0'} - ₹{filters.maxCash || '∞'}
                </span>
              )}
              {(filters.fromDate || filters.toDate) && (
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  ದಿನಾಂಕ: {filters.fromDate || 'ಪ್ರಾರಂಭ'} ದಿಂದ {filters.toDate || 'ಇಂದಿನವರೆಗೆ'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <LoadingAnimation
            variant="card"
            message="ಶೇರುದಾರರ ಅಂಕಿಅಂಶಗಳನ್ನು ಸಂಕಲಿಸಲಾಗುತ್ತಿದೆ..."
            subMessage="Compiling 17,000+ Shareholder Demographic & Financial Analytics..."
          />
        ) : filteredShareholders.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-sm font-bold text-slate-300">ಆಯ್ಕೆ ಮಾಡಿದ ಫಿಲ್ಟರ್‌ಗೆ ಯಾವುದೇ ಶೇರುದಾರರ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.</p>
            <p className="text-xs text-slate-500">ದಯವಿಟ್ಟು ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಿ ಅಥವಾ 'ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ' ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.</p>
          </div>
        ) : (
          <>
            {/* 1. PLACEWISE BREAKDOWN TABLE */}
            {reportMode === 'placewise' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 no-print">
                  <span>ಒಟ್ಟು <strong>{placewiseData.length}</strong> ಗ್ರಾಮಗಳು / ಸ್ಥಳಗಳು ಪಟ್ಟಿಮಾಡಲಾಗಿದೆ</span>
                  <div className="flex items-center gap-2">
                    <span>ವಿಂಗಡಣೆ (Sort by):</span>
                    <button
                      onClick={() => { setSortField('count'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                      className={`px-2 py-1 rounded-lg border text-[11px] ${sortField === 'count' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                    >
                      ಸದಸ್ಯರ ಸಂಖ್ಯೆ {sortField === 'count' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </button>
                    <button
                      onClick={() => { setSortField('shares'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                      className={`px-2 py-1 rounded-lg border text-[11px] ${sortField === 'shares' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                    >
                      ಶೇರುಗಳು {sortField === 'shares' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </button>
                    <button
                      onClick={() => { setSortField('name'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                      className={`px-2 py-1 rounded-lg border text-[11px] ${sortField === 'name' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                    >
                      ಸ್ಥಳದ ಹೆಸರು {sortField === 'name' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </button>
                  </div>
                </div>

                <TableScrollerContainer label="ಗ್ರಾಮವಾರು ಸಾರಾಂಶ (Scroll Places):">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 print:bg-gray-100 text-slate-300 print:text-black font-bold uppercase text-[10px] border-b border-slate-800 print:border-gray-400">
                      <tr>
                        <th className="py-3 px-3 w-12 text-center">ಕ್ರ.ಸಂ.</th>
                        <th className="py-3 px-3">ಸ್ಥಳ / ಗ್ರಾಮದ ಹೆಸರು (Place / Village)</th>
                        <th className="py-3 px-3">ವಲಯ (Circle)</th>
                        <th className="py-3 px-3">ತಾಲೂಕು (Taluk)</th>
                        <th className="py-3 px-3 text-right">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</th>
                        <th className="py-3 px-3 text-right">ಒಟ್ಟು ಶೇರುಗಳು (Shares)</th>
                        <th className="py-3 px-3 text-right">ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital Value)</th>
                        <th className="py-3 px-3 text-right">ಸದಸ್ಯರ (%)</th>
                        <th className="py-3 px-3 text-right">ಶೇರುಗಳ (%)</th>
                        <th className="py-3 px-3 text-center no-print">ವಿವರ ಪಟ್ಟಿ (Drill-down)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 print:divide-gray-300 text-slate-200 print:text-black">
                      {placewiseData.map((row, idx) => (
                        <tr key={row.place} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-100 print:text-black">{row.place}</td>
                          <td className="py-2.5 px-3 text-slate-300 print:text-gray-800">{row.circle}</td>
                          <td className="py-2.5 px-3 text-slate-400">{row.taluk}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                            {row.count.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200 print:text-black">
                            {row.totalShares.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-300 print:text-black">
                            ₹ {row.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[11px]">{row.memberPct}%</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[11px]">{row.sharePct}%</td>
                          <td className="py-2.5 px-3 text-center no-print">
                            <button
                              onClick={() => handleDrillDown('place', row.place)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-800 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                              title="ಸದಸ್ಯರ ವಿವರ ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ"
                            >
                              ಸದಸ್ಯರು ({row.count})
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900/90 print:bg-gray-200 font-bold border-t-2 border-slate-700 print:border-black text-slate-100 print:text-black text-xs">
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider">ಒಟ್ಟು (Total):</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 print:text-black font-extrabold text-sm">
                          {kpis.totalCount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-sm">
                          {kpis.totalShares.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-400 print:text-black font-extrabold text-sm">
                          ₹ {kpis.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">100%</td>
                        <td className="py-3 px-3 text-right font-mono">100%</td>
                        <td className="py-3 px-3 no-print"></td>
                      </tr>
                    </tfoot>
                  </table>
                </TableScrollerContainer>
              </div>
            )}

            {/* 2. CATEGORYWISE BREAKDOWN TABLE */}
            {reportMode === 'categorywise' && (
              <div className="space-y-4">
                <TableScrollerContainer label="ವರ್ಗವಾರು ಸಾರಾಂಶ (Scroll Categories):">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 print:bg-gray-100 text-slate-300 print:text-black font-bold uppercase text-[10px] border-b border-slate-800 print:border-gray-400">
                      <tr>
                        <th className="py-3 px-3 w-12 text-center">ಕ್ರ.ಸಂ.</th>
                        <th className="py-3 px-3">ವರ್ಗ / ವರ್ಗಾವಣೆ (Category / Class)</th>
                        <th className="py-3 px-3">ಸದಸ್ಯರ ಪ್ರಕಾರ (Member Type Description)</th>
                        <th className="py-3 px-3 text-right">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</th>
                        <th className="py-3 px-3 text-right">ಒಟ್ಟು ಶೇರುಗಳು (Shares)</th>
                        <th className="py-3 px-3 text-right">ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital Value)</th>
                        <th className="py-3 px-3 text-right">ಶೇಕಡಾವಾರು (%)</th>
                        <th className="py-3 px-3 text-center no-print">ವಿವರ ಪಟ್ಟಿ (Drill-down)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 print:divide-gray-300 text-slate-200 print:text-black">
                      {categorywiseData.map((row, idx) => (
                        <tr key={row.category} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-100 print:text-black text-sm">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300 font-bold">
                              {row.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-300 print:text-gray-800">
                            {row.memberType}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                            {row.count.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200 print:text-black text-sm">
                            {row.totalShares.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-300 print:text-black">
                            ₹ {row.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-300">{row.memberPct}%</td>
                          <td className="py-2.5 px-3 text-center no-print">
                            <button
                              onClick={() => handleDrillDown('category', row.category)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-800 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                            >
                              ಸದಸ್ಯರು ({row.count})
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900/90 print:bg-gray-200 font-bold border-t-2 border-slate-700 print:border-black text-slate-100 print:text-black text-xs">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider">ಒಟ್ಟು (Total):</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 print:text-black font-extrabold text-sm">
                          {kpis.totalCount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-sm">
                          {kpis.totalShares.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-400 print:text-black font-extrabold text-sm">
                          ₹ {kpis.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">100%</td>
                        <td className="py-3 px-3 no-print"></td>
                      </tr>
                    </tfoot>
                  </table>
                </TableScrollerContainer>
              </div>
            )}

            {/* 3. CIRCLEWISE BREAKDOWN TABLE */}
            {reportMode === 'circlewise' && (
              <div className="space-y-4">
                <TableScrollerContainer label="ವಲಯವಾರು ಸಾರಾಂಶ (Scroll Circles):">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 print:bg-gray-100 text-slate-300 print:text-black font-bold uppercase text-[10px] border-b border-slate-800 print:border-gray-400">
                      <tr>
                        <th className="py-3 px-3 w-12 text-center">ಕ್ರ.ಸಂ.</th>
                        <th className="py-3 px-3">ವಲಯದ ಹೆಸರು (Circle Name)</th>
                        <th className="py-3 px-3 text-center">ಒಳಪಟ್ಟ ಗ್ರಾಮಗಳು (Villages Count)</th>
                        <th className="py-3 px-3 text-right">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</th>
                        <th className="py-3 px-3 text-right">ಒಟ್ಟು ಶೇರುಗಳು (Shares)</th>
                        <th className="py-3 px-3 text-right">ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital Value)</th>
                        <th className="py-3 px-3 text-right">ಸದಸ್ಯರ (%)</th>
                        <th className="py-3 px-3 text-center no-print">ವಿವರ ಪಟ್ಟಿ (Drill-down)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 print:divide-gray-300 text-slate-200 print:text-black">
                      {circlewiseData.map((row, idx) => (
                        <tr key={row.circle} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-100 print:text-black text-sm">
                            <span className="flex items-center gap-1.5 text-purple-300">
                              <MapPin className="w-3.5 h-3.5 text-purple-400" />
                              {row.circle}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-400">
                            {row.placesCount} ಗ್ರಾಮಗಳು
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                            {row.count.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200 print:text-black text-sm">
                            {row.totalShares.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-300 print:text-black">
                            ₹ {row.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">{row.memberPct}%</td>
                          <td className="py-2.5 px-3 text-center no-print">
                            <button
                              onClick={() => handleDrillDown('circle', row.circle)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-800 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                            >
                              ಸದಸ್ಯರು ({row.count})
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900/90 print:bg-gray-200 font-bold border-t-2 border-slate-700 print:border-black text-slate-100 print:text-black text-xs">
                      <tr>
                        <td colSpan={2} className="py-3 px-3 text-right uppercase tracking-wider">ಒಟ್ಟು (Total):</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-sky-400">
                          {kpis.distinctPlaces} ಗ್ರಾಮಗಳು
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 print:text-black font-extrabold text-sm">
                          {kpis.totalCount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-sm">
                          {kpis.totalShares.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-400 print:text-black font-extrabold text-sm">
                          ₹ {kpis.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">100%</td>
                        <td className="py-3 px-3 no-print"></td>
                      </tr>
                    </tfoot>
                  </table>
                </TableScrollerContainer>
              </div>
            )}

            {/* 4. SHARESWISE BREAKDOWN TABLE */}
            {reportMode === 'shareswise' && (
              <div className="space-y-4">
                <TableScrollerContainer label="ಶೇರುವಾರು ಸಾರಾಂಶ (Scroll Shares):">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 print:bg-gray-100 text-slate-300 print:text-black font-bold uppercase text-[10px] border-b border-slate-800 print:border-gray-400">
                      <tr>
                        <th className="py-3 px-3 w-12 text-center">ಕ್ರ.ಸಂ.</th>
                        <th className="py-3 px-3">ಶೇರುಗಳ ಶ್ರೇಣಿ (Shares Bracket)</th>
                        <th className="py-3 px-3">ವಿವರಣೆ & ಮುಖಬೆಲೆ (Description)</th>
                        <th className="py-3 px-3 text-right">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</th>
                        <th className="py-3 px-3 text-right">ಒಟ್ಟು ಶೇರುಗಳು (Total Shares)</th>
                        <th className="py-3 px-3 text-right">ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital Value)</th>
                        <th className="py-3 px-3 text-right">ಸದಸ್ಯರ (%)</th>
                        <th className="py-3 px-3 text-center no-print">ವಿವರ ಪಟ್ಟಿ (Drill-down)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 print:divide-gray-300 text-slate-200 print:text-black">
                      {shareswiseData.map((row, idx) => (
                        <tr key={row.key} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-100 print:text-black text-sm">
                            <span className="text-emerald-300 flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5 text-emerald-400" />
                              {row.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {row.desc}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                            {row.count.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200 print:text-black text-sm">
                            {row.totalShares.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-300 print:text-black">
                            ₹ {row.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">{row.memberPct}%</td>
                          <td className="py-2.5 px-3 text-center no-print">
                            <button
                              onClick={() => handleDrillDown('sharesBracket', row.key)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-800 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                            >
                              ಸದಸ್ಯರು ({row.count})
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900/90 print:bg-gray-200 font-bold border-t-2 border-slate-700 print:border-black text-slate-100 print:text-black text-xs">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider">ಒಟ್ಟು (Total):</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 print:text-black font-extrabold text-sm">
                          {kpis.totalCount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-sm">
                          {kpis.totalShares.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-400 print:text-black font-extrabold text-sm">
                          ₹ {kpis.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">100%</td>
                        <td className="py-3 px-3 no-print"></td>
                      </tr>
                    </tfoot>
                  </table>
                </TableScrollerContainer>
              </div>
            )}

            {/* 5. CASH AMOUNTWISE BREAKDOWN TABLE */}
            {reportMode === 'amountwise' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 no-print">
                  <span>ಒಟ್ಟು <strong>{amountwiseData.length}</strong> ನಗದು ವರ್ಗಗಳು (Cash Amount Groups)</span>
                  <div className="flex items-center gap-2">
                    <span>ವಿಂಗಡಣೆ (Sort by):</span>
                    <button
                      onClick={() => { setSortField('amount'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                      className={`px-2 py-1 rounded-lg border text-[11px] ${sortField === 'amount' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                    >
                      ನಗದು ಮೊತ್ತ {sortField === 'amount' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </button>
                    <button
                      onClick={() => { setSortField('count'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                      className={`px-2 py-1 rounded-lg border text-[11px] ${sortField === 'count' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                    >
                      ಸದಸ್ಯರ ಸಂಖ್ಯೆ {sortField === 'count' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </button>
                  </div>
                </div>

                <TableScrollerContainer label="ಮೊತ್ತವಾರು ಸಾರಾಂಶ (Scroll Amount):">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 print:bg-gray-100 text-slate-300 print:text-black font-bold uppercase text-[10px] border-b border-slate-800 print:border-gray-400">
                      <tr>
                        <th className="py-3 px-3 w-12 text-center">ಕ್ರ.ಸಂ.</th>
                        <th className="py-3 px-3">ನಗದು ಮೊತ್ತ (Cash Amount ₹)</th>
                        <th className="py-3 px-3">ವಿವರಣೆ & ಮುಖಬೆಲೆ (Description)</th>
                        <th className="py-3 px-3 text-right">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</th>
                        <th className="py-3 px-3 text-right">ಒಟ್ಟು ಶೇರುಗಳು (Total Shares)</th>
                        <th className="py-3 px-3 text-right">ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital Value)</th>
                        <th className="py-3 px-3 text-right">ಸದಸ್ಯರ (%)</th>
                        <th className="py-3 px-3 text-right">ಶೇರುಗಳ (%)</th>
                        <th className="py-3 px-3 text-center no-print">ವಿವರ ಪಟ್ಟಿ (Drill-down)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 print:divide-gray-300 text-slate-200 print:text-black">
                      {amountwiseData.map((row, idx) => (
                        <tr key={row.amount} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-100 print:text-black text-sm">
                            <span className="text-amber-300 flex items-center gap-1.5 font-mono">
                              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                              ₹ {row.amount.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {row.amount === 2000 ? '1 ಶೇರು (ಸಾಮಾನ್ಯ ಮುಖಬೆಲೆ)' :
                             row.amount === 1000 ? '1 ನೇ ಕಂತು ಪಾವತಿ (₹1,000)' :
                             row.amount === 4000 ? '2 ಶೇರುಗಳು (₹4,000)' :
                             row.amount === 6000 ? '3 ಶೇರುಗಳು (₹6,000)' :
                             row.amount === 8000 ? '4 ಶೇರುಗಳು (₹8,000)' :
                             row.amount === 10000 ? '5 ಶೇರುಗಳು (₹10,000)' :
                             row.amount >= 12000 ? `${Math.round(row.amount / 2000)} ಶೇರುಗಳು (ಗರಿಷ್ಠ ಬಂಡವಾಳ)` :
                             `ವಿಶೇಷ ಮೊತ್ತ / ಮುಂಗಡ`}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                            {row.count.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200 print:text-black text-sm">
                            {row.totalShares.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-300 print:text-black">
                            ₹ {row.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">{row.memberPct}%</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">{row.sharePct}%</td>
                          <td className="py-2.5 px-3 text-center no-print">
                            <button
                              onClick={() => handleDrillDown('cashAmount', String(row.amount))}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-800 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                            >
                              ಸದಸ್ಯರು ({row.count})
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900/90 print:bg-gray-200 font-bold border-t-2 border-slate-700 print:border-black text-slate-100 print:text-black text-xs">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider">ಒಟ್ಟು (Total):</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 print:text-black font-extrabold text-sm">
                          {kpis.totalCount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-sm">
                          {kpis.totalShares.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-400 print:text-black font-extrabold text-sm">
                          ₹ {kpis.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">100%</td>
                        <td className="py-3 px-3 text-right font-mono">100%</td>
                        <td className="py-3 px-3 no-print"></td>
                      </tr>
                    </tfoot>
                  </table>
                </TableScrollerContainer>
              </div>
            )}

            {/* 6. STATUTORY REGISTER WITH HEADER SELECTION (15-Column Layout matching official image) */}
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          is15PresetActive
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                            : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                        }`}
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
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs text-left border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200 font-semibold shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                isSelected ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-700 bg-slate-900'
                              }`}>
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
                              : `ಶೇರು ವಿಭಾಗ - ಶೇರುದಾರರ ಅಧಿಕೃತ ವಹಿ (${selectedColumns.length} ಕಾಲಂ ರಿಜಿಸ್ಟರ್)`}
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
                              className={`border border-black p-1.5 ${col.width} ${
                                col.align === 'left' ? 'text-left' : col.align === 'right' ? 'text-right' : 'text-center'
                              }`}
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
                                      className={`border border-black p-1 px-1.5 ${
                                        col.align === 'left' ? 'text-left' : col.align === 'right' ? 'text-right' : 'text-center'
                                      } ${isBold ? 'font-bold' : ''} ${isMono ? 'font-mono' : ''}`}
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
                </div>

                {/* Pagination footer (Screen only) */}
                {detailedPageSize !== 'all' && totalDetailedPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs no-print">
                    <span className="text-slate-400">
                      ಪುಟ <strong>{detailedPage}</strong> / <strong>{totalDetailedPages}</strong> (ಒಟ್ಟು {filteredShareholders.length} ದಾಖಲೆಗಳು)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={detailedPage <= 1}
                        onClick={() => setDetailedPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 font-semibold cursor-pointer"
                      >
                        ಹಿಂದಿನ ಪುಟ (Previous)
                      </button>
                      <button
                        disabled={detailedPage >= totalDetailedPages}
                        onClick={() => setDetailedPage(p => Math.min(totalDetailedPages, p + 1))}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 font-semibold cursor-pointer"
                      >
                        ಮುಂದಿನ ಪುಟ (Next)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Report Official Audit Footer (Print and Screen) */}
        <div className="pt-8 mt-6 border-t border-slate-800 print:border-gray-400 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] text-slate-400 print:text-gray-800">
          <div className="space-y-1">
            <div>ವರದಿ ತಯಾರಕರು: <strong>ಕಂಪ್ಯೂಟರ್ ಆಪರೇಟರ್ (Computer Operator)</strong></div>
            <div className="text-[10px]">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ</div>
          </div>

          <div className="text-center space-y-1">
            <div>ಪರಿಶೀಲಿಸಿದವರು: _______________________</div>
            <div className="text-[10px] font-semibold">ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿ (Chief Accountant)</div>
          </div>

          <div className="text-right space-y-1">
            <div>ಅಧಿಕೃತ ಸಹಿ: _______________________</div>
            <div className="text-[10px] font-semibold">ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು (Managing Director)</div>
          </div>
        </div>
      </div>


      {/* Shareholder Profile Modal */}
      {activeProfileId && (
        <ShareholderProfile
          shareholderId={activeProfileId}
          onClose={() => setActiveProfileId(null)}
          initialTab="ledger"
        />
      )}
    </div>
  );
}
