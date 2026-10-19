import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ApiService, getMemberTypeByCategory, getShareholderOwnership } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, BarChart3, Filter, Search, Printer, Download, FileSpreadsheet,
  Building2, MapPin, Layers, Coins, Calendar, FileText, CheckCircle2,
  ChevronLeft, ChevronRight, RefreshCw, X, Eye, ArrowUpDown, ChevronDown,
  ChevronUp, ShieldCheck, PieChart, Sparkles, SlidersHorizontal, IndianRupee, Banknote
} from 'lucide-react';
import ShareholderProfile from '../Shareholders/ShareholderProfile';

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

export default function ShareholderReports({ activeMode, onModeChange }) {
  const { showToast } = useAuth();
  const [allShareholders, setAllShareholders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Report Breakdown Tab:
  // 'placewise' | 'categorywise' | 'circlewise' | 'shareswise' | 'amountwise' | 'detailed'
  const [reportMode, setReportMode] = useState(activeMode || 'placewise');

  useEffect(() => {
    if (activeMode && activeMode !== reportMode) {
      setReportMode(activeMode);
    }
  }, [activeMode]);

  const changeReportMode = (mode) => {
    setReportMode(mode);
    if (onModeChange) onModeChange(mode);
  };

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
    const placesSet = new Set();
    const circlesSet = new Set();
    const categoriesSet = new Set();
    const tharavaSet = new Set();
    const cashAmountCounts = new Map();

    allShareholders.forEach(s => {
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
    });

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
        const cnt = parseInt(s.number_of_shares, 10) || 1;
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
          const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000);
          return amt === targetAmt;
        });
      }
    }

    // 12. Cash Amount Range (Min Cash - Max Cash)
    if (filters.minCash) {
      const min = parseFloat(filters.minCash);
      if (!isNaN(min)) {
        list = list.filter(s => {
          const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000);
          return amt >= min;
        });
      }
    }
    if (filters.maxCash) {
      const max = parseFloat(filters.maxCash);
      if (!isNaN(max)) {
        list = list.filter(s => {
          const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000);
          return amt <= max;
        });
      }
    }

    return list;
  }, [allShareholders, filters]);

  // High-Level KPI Aggregates
  const kpis = useMemo(() => {
    const totalCount = filteredShareholders.length;
    const totalShares = filteredShareholders.reduce((sum, s) => sum + (parseInt(s.number_of_shares, 10) || 1), 0);
    const totalAmount = filteredShareholders.reduce((sum, s) => {
      const amt = parseFloat(s.total_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000);
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
    changeReportMode('detailed');
    setDetailedPage(1);
  };

  // 1. PLACEWISE AGGREGATION
  const placewiseData = useMemo(() => {
    const map = new Map();
    filteredShareholders.forEach(s => {
      const place = (s.place || s.village_name || 'ಗೊತ್ತಿಲ್ಲದ ಗ್ರಾಮ').trim();
      const circle = (s.circle || s.circle_name || 'ಇತರೆ').trim();
      const taluk = (s.taluk || 'ಇಂಡಿ').trim();
      const shares = parseInt(s.number_of_shares, 10) || 1;
      const amt = parseFloat(s.total_amount) || (shares * 2000);

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
  }, [filteredShareholders, kpis, sortField, sortOrder]);

  // 2. CATEGORYWISE AGGREGATION
  const categorywiseData = useMemo(() => {
    const map = new Map();
    filteredShareholders.forEach(s => {
      const cat = (s.schedule_cast || 'ಇತರೆ ವರ್ಗ').trim();
      const memberType = getMemberTypeByCategory(cat, s.member_type);
      const shares = parseInt(s.number_of_shares, 10) || 1;
      const amt = parseFloat(s.total_amount) || (shares * 2000);

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
  }, [filteredShareholders, kpis]);

  // 3. CIRCLEWISE AGGREGATION
  const circlewiseData = useMemo(() => {
    const map = new Map();
    filteredShareholders.forEach(s => {
      const circle = (s.circle || s.circle_name || 'ಇತರೆ (Other)').trim();
      const place = (s.place || s.village_name || '').trim();
      const shares = parseInt(s.number_of_shares, 10) || 1;
      const amt = parseFloat(s.total_amount) || (shares * 2000);

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
  }, [filteredShareholders, kpis]);

  // 4. SHARESWISE AGGREGATION (1, 2, 3-5, 6-10, 11+)
  const shareswiseData = useMemo(() => {
    const tiers = [
      { key: '1', label: '1 ಶೇರು (1 Share)', desc: '₹ 2,000 ಮುಖಬೆಲೆ - ಸಾಮಾನ್ಯ ಬೆಳೆಗಾರ ಸದಸ್ಯರು', min: 1, max: 1 },
      { key: '2', label: '2 ಶೇರುಗಳು (2 Shares)', desc: '₹ 4,000 ಮುಖಬೆಲೆ - ಮಧ್ಯಮ ಶೇರುದಾರರು', min: 2, max: 2 },
      { key: '3-5', label: '3 ರಿಂದ 5 ಶೇರುಗಳು (3-5 Shares)', desc: '₹ 6,000 - ₹ 10,000 ಮುಖಬೆಲೆ', min: 3, max: 5 },
      { key: '6-10', label: '6 ರಿಂದ 10 ಶೇರುಗಳು (6-10 Shares)', desc: '₹ 12,000 - ₹ 20,000 ಮುಖಬೆಲೆ', min: 6, max: 10 },
      { key: '11+', label: '11 ಮತ್ತು ಹೆಚ್ಚಿನ ಶೇರುಗಳು (11+ Shares)', desc: 'ಗರಿಷ್ಠ ಶೇರುದಾರರು & ಸಂಸ್ಥೆಗಳು', min: 11, max: 999999 },
    ];

    return tiers.map(tier => {
      const matched = filteredShareholders.filter(s => {
        const cnt = parseInt(s.number_of_shares, 10) || 1;
        return cnt >= tier.min && cnt <= tier.max;
      });

      const count = matched.length;
      const totalShares = matched.reduce((sum, s) => sum + (parseInt(s.number_of_shares, 10) || 1), 0);
      const totalAmount = matched.reduce((sum, s) => {
        const amt = parseFloat(s.total_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000);
        return sum + amt;
      }, 0);

      return {
        ...tier,
        count,
        totalShares,
        totalAmount,
        sharePct: kpis.totalShares > 0 ? ((totalShares / kpis.totalShares) * 100).toFixed(1) : 0,
        memberPct: kpis.totalCount > 0 ? ((count / kpis.totalCount) * 100).toFixed(1) : 0,
      };
    });
  }, [filteredShareholders, kpis]);

  // 5. CASH AMOUNTWISE AGGREGATION (ನಗದು ಮೊತ್ತವಾರು ವಿಂಗಡಣೆ)
  const amountwiseData = useMemo(() => {
    const map = new Map();
    filteredShareholders.forEach(s => {
      const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000);
      const shares = parseInt(s.number_of_shares, 10) || 1;

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
  }, [filteredShareholders, kpis, sortField, sortOrder]);

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

      // 2. Always Export Detailed Members List Sheet
      const memberRows = [
        ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204'],
        ['ಶೇರುದಾರರ ಸದಸ್ಯರ ಸಮಗ್ರ ವಿವರ ವರದಿ (Detailed Shareholders Master Register)'],
        [`ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')} | ಫಿಲ್ಟರ್ ಮಾಡಿದ ಸದಸ್ಯರ ಸಂಖ್ಯೆ: ${filteredShareholders.length}`],
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
          parseInt(s.number_of_shares, 10) || 1,
          parseFloat(s.total_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000),
          s.ownership || s.relationship || 'ಸ್ವಂತ (Self)',
          s.date || s.reg_date || s.registration_date || '',
          s.tharava_no || '',
          s.tharava_date || '',
          s.nominee_name || '',
          s.mobile_no || s.mobile || '',
          s.aadhaar_card_no || s.aadhaar_ref || '',
          s.status || 'Active'
        ]);
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

          {/* Refresh Data */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
            title="Refresh Database Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
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
          onClick={() => { changeReportMode('placewise'); setSortField('count'); setSortOrder('desc'); }}
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
          onClick={() => changeReportMode('categorywise')}
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
          onClick={() => changeReportMode('circlewise')}
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
          onClick={() => changeReportMode('shareswise')}
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
          onClick={() => { changeReportMode('amountwise'); setSortField('amount'); setSortOrder('desc'); }}
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
          onClick={() => changeReportMode('detailed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reportMode === 'detailed'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>6. ಸದಸ್ಯರ ಸಮಗ್ರ ವಿವರ ಪಟ್ಟಿ (Detailed Register)</span>
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
          <div className="p-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold">ಶೇರುದಾರರ ಅಂಕಿಅಂಶಗಳನ್ನು ಸಂಕಲಿಸಲಾಗುತ್ತಿದೆ...</p>
          </div>
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

                <div className="overflow-x-auto">
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
                </div>
              </div>
            )}

            {/* 2. CATEGORYWISE BREAKDOWN TABLE */}
            {reportMode === 'categorywise' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
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
                </div>
              </div>
            )}

            {/* 3. CIRCLEWISE BREAKDOWN TABLE */}
            {reportMode === 'circlewise' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
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
                </div>
              </div>
            )}

            {/* 4. SHARESWISE BREAKDOWN TABLE */}
            {reportMode === 'shareswise' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
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
                </div>
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

                <div className="overflow-x-auto">
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
                </div>
              </div>
            )}

            {/* 6. DETAILED MEMBERS REGISTER TABLE */}
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

                <div className="overflow-x-auto">
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
                        const shares = parseInt(s.number_of_shares, 10) || 1;
                        const amt = parseFloat(s.total_amount) || (shares * 2000);

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
                              {s.tharava_no ? `${s.tharava_no} (${s.tharava_date || '—'})` : '—'}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                (s.status || 'Active') === 'Active'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}>
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
