import React, { useState, useEffect } from 'react';
import { ApiService, isShareholderInactive } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  GitMerge, Search, CheckCircle2, AlertCircle, X, ShieldCheck,
  RefreshCw, Layers, Coins, Award, Check, Filter, ChevronRight,
  Plus, Trash2, ArrowRight, CheckSquare, Sparkles, UserCheck, HelpCircle,
  Clock, XCircle, Send, CheckCircle, FileText
} from 'lucide-react';

export default function MergeSharesModal({ isOpen, onClose, onMergeSuccess, initialSelectedShares = [] }) {
  const { showToast, user } = useAuth();
  const [activeTab, setActiveTab] = useState('by_selection'); // 'by_selection', 'approvals', 'auto_detected'
  
  // Selection mode states
  const [shareInput, setShareInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedShareRecords, setSelectedShareRecords] = useState([]);
  const [primaryRecordId, setPrimaryRecordId] = useState(null);
  const [mergeRemarks, setMergeRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [directApprove, setDirectApprove] = useState(false);

  // Approval Requests state
  const [mergeRequests, setMergeRequests] = useState([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [approvalFilter, setApprovalFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Auto-detected mode states
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [isMergingAuto, setIsMergingAuto] = useState(false);
  const [autoSummary, setAutoSummary] = useState(null);
  const [autoSearchTerm, setAutoSearchTerm] = useState('');
  const [mergingKey, setMergingKey] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialSelectedShares && initialSelectedShares.length > 0) {
        setSelectedShareRecords(initialSelectedShares);
        setPrimaryRecordId(initialSelectedShares[0]?.id || null);
        setActiveTab('by_selection');
      }
      loadMergeRequests();
      loadAutoHoldings();
    } else {
      setSelectedShareRecords([]);
      setShareInput('');
      setSearchResults([]);
      setPrimaryRecordId(null);
      setMergeRemarks('');
    }
  }, [isOpen]);

  // Load Merge Approval Requests
  const loadMergeRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await ApiService.getMergeRequests();
      if (res && res.success) {
        setMergeRequests(res.data || []);
        setPendingApprovalsCount(res.pendingCount || 0);
      }
    } catch (e) {
      console.error('Error loading merge requests:', e);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Search live database for share numbers / shareholder names
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await ApiService.searchShareholdersByShareNo(searchQuery);
        if (res && res.success) {
          setSearchResults(res.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add a share record to selection
  const addRecordToSelection = (record) => {
    if (isShareholderInactive(record)) {
      showToast(`ಷೇರು #${record.share_no} ಈಗಾಗಲೇ ವಿಲೀನಗೊಂಡು ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ (Already merged and inactive - cannot select)`, 'error');
      return;
    }
    if (selectedShareRecords.some(r => r.id === record.id)) {
      showToast(`ಷೇರು #${record.share_no} ಈಗಾಗಲೇ ಆಯ್ಕೆಯಾಗಿದೆ (Already selected)`, 'info');
      return;
    }
    const updated = [...selectedShareRecords, record];
    setSelectedShareRecords(updated);
    if (!primaryRecordId) {
      setPrimaryRecordId(record.id);
    }
    setSearchQuery('');
    setSearchResults([]);
    showToast(`ಷೇರು #${record.share_no} (${record.shareholder_name}) ಆಯ್ಕೆಗೆ ಸೇರಿಸಲಾಗಿದೆ!`);
  };

  // Quick add by comma-separated numbers (e.g. "222, 1665")
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!shareInput.trim()) return;
    const parts = shareInput.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return;

    let addedCount = 0;
    const newRecords = [...selectedShareRecords];

    for (const part of parts) {
      const cleanNo = part.replace(/^#/, '').trim();
      const res = await ApiService.searchShareholdersByShareNo(cleanNo);
      if (res && res.success && res.data.length > 0) {
        const exact = res.data.find(d => 
          String(d.share_no) === cleanNo || 
          (d.all_share_numbers || []).includes(cleanNo) ||
          String(d.id) === cleanNo
        ) || res.data[0];

        if (isShareholderInactive(exact)) {
          showToast(`ಷೇರು #${exact.share_no} ಈಗಾಗಲೇ ವಿಲೀನಗೊಂಡು ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ (Already merged & inactive)`, 'error');
          continue;
        }
        if (!newRecords.some(r => r.id === exact.id)) {
          newRecords.push(exact);
          addedCount++;
        }
      }
    }

    if (addedCount > 0) {
      setSelectedShareRecords(newRecords);
      if (!primaryRecordId && newRecords.length > 0) {
        setPrimaryRecordId(newRecords[0].id);
      }
      showToast(`${addedCount} ಷೇರು ಖಾತೆಗಳನ್ನು ಆಯ್ಕೆಗೆ ಸೇರಿಸಲಾಗಿದೆ!`);
      setShareInput('');
    } else {
      showToast(`ನಮೂದಿಸಿದ ಷೇರು ಸಂಖ್ಯೆಗಳಿಗೆ ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ: ${parts.join(', ')}`, 'error');
    }
  };

  // Remove a share record from selection
  const removeRecordFromSelection = (id) => {
    const updated = selectedShareRecords.filter(r => r.id !== id);
    setSelectedShareRecords(updated);
    if (primaryRecordId === id) {
      setPrimaryRecordId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // SUBMIT FOR ADMIN APPROVAL
  const handleSubmitForApproval = async () => {
    if (selectedShareRecords.length < 2) {
      showToast('ವಿಲೀನಗೊಳಿಸಲು ಕನಿಷ್ಠ 2 ಷೇರುಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ (ದಯವಿಟ್ಟು ಕನಿಷ್ಠ 2 ಷೇರು ಸಂಖ್ಯೆಗಳನ್ನು ಸೇರಿಸಿ)', 'error');
      return;
    }

    const shareNumbers = selectedShareRecords.map(r => r.share_no || r.id);
    const primaryRecord = selectedShareRecords.find(r => r.id === primaryRecordId) || selectedShareRecords[0];

    setIsSubmitting(true);
    try {
      if (directApprove) {
        // Direct execution by Admin
        const res = await ApiService.mergeSharesByShareNumbers({
          shareNumbers,
          primaryShareNo: primaryRecord.share_no || primaryRecord.id,
          adminUser: user?.name || 'Admin'
        });

        if (res && res.success) {
          showToast(`ಅಭಿನಂದನೆಗಳು! ಷೇರುಗಳು #${res.combinedShareNoStr} ಯಶಸ್ವಿಯಾಗಿ ಏಕೀಕೃತಗೊಂಡಿವೆ! ಒಟ್ಟು: ${res.combinedShares} ಷೇರುಗಳು, ₹${res.combinedTotalAmt?.toLocaleString()}.`);
          setSelectedShareRecords([]);
          setPrimaryRecordId(null);
          if (onMergeSuccess) await onMergeSuccess();
          onClose();
        } else {
          showToast(res?.message || 'ವಿಲೀನಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ', 'error');
        }
      } else {
        // Submit for Admin Approval Gate
        const res = await ApiService.submitMergeRequest({
          shareNumbers,
          primaryShareNo: primaryRecord.share_no || primaryRecord.id,
          requestedBy: user?.name || 'Operator',
          remarks: mergeRemarks || 'ಬಹು-ಷೇರುಗಳನ್ನು ಏಕೀಕರಿಸಲು ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಲಾದ ವಿನಂತಿ.'
        });

        if (res && res.success) {
          showToast(`ವಿಲೀನ ವಿನಂತಿ #${res.data?.request_id} ಯಶಸ್ವಿಯಾಗಿ ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ!`);
          setSelectedShareRecords([]);
          setPrimaryRecordId(null);
          setMergeRemarks('');
          await loadMergeRequests();
          setActiveTab('approvals');
        } else {
          showToast(res?.message || 'ವಿನಂತಿ ಸಲ್ಲಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ', 'error');
        }
      }
    } catch (err) {
      showToast('ದೋಷ: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ADMIN APPROVE MERGE REQUEST
  const handleApproveRequest = async (request) => {
    setProcessingRequestId(request.id);
    try {
      const res = await ApiService.approveMergeRequestByAdmin({
        requestId: request.id,
        adminUser: user?.name || 'Admin',
        remarks: 'ಅಡ್ಮಿನ್ ಅಧಿಕೃತ ಅನುಮೋದನೆ ನೀಡಿ ಮಾಸ್ಟರ್ ಶಾಸನಬದ್ಧ ಶೀಟ್‌ಗೆ ವಿಲೀನಗೊಳಿಸಲಾಗಿದೆ.'
      });

      if (res && res.success) {
        showToast(`ಅಭಿನಂದನೆಗಳು! ವಿನಂತಿ #${request.request_id} ಯಶಸ್ವಿಯಾಗಿ ಅನುಮೋದನೆಗೊಂಡು, ಷೇರುಗಳು #${request.combined_share_no_str} ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ಏಕೀಕೃತಗೊಂಡಿವೆ!`);
        await loadMergeRequests();
        await loadAutoHoldings();
        if (onMergeSuccess) await onMergeSuccess();
      } else {
        showToast(res?.message || 'ಅನುಮೋದನೆ ವಿಫಲವಾಗಿದೆ', 'error');
      }
    } catch (err) {
      showToast('ದೋಷ: ' + err.message, 'error');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // ADMIN REJECT MERGE REQUEST
  const handleRejectRequest = async (request) => {
    setProcessingRequestId(request.id);
    try {
      const res = await ApiService.rejectMergeRequestByAdmin({
        requestId: request.id,
        adminUser: user?.name || 'Admin',
        remarks: 'ಅಡ್ಮಿನ್ ಪರಿಶೀಲನೆಯಲ್ಲಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.'
      });

      if (res && res.success) {
        showToast(`ವಿನಂತಿ #${request.request_id} ಅನ್ನು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.`);
        await loadMergeRequests();
      } else {
        showToast(res?.message || 'ಪ್ರಕ್ರಿಯೆ ವಿಫಲವಾಗಿದೆ', 'error');
      }
    } catch (err) {
      showToast('ದೋಷ: ' + err.message, 'error');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Auto-detected logic
  const loadAutoHoldings = async () => {
    setLoadingAuto(true);
    try {
      const res = await ApiService.getMultipleHoldingsSummary();
      if (res && res.success) {
        setAutoSummary(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAuto(false);
    }
  };

  const autoCandidates = autoSummary?.data || [];
  const filteredAutoCandidates = autoCandidates.filter(c => {
    if (!autoSearchTerm.trim()) return true;
    const q = autoSearchTerm.toLowerCase().trim();
    const name = (c.shareholder_name || '').toLowerCase();
    const place = (c.place || '').toLowerCase();
    const taluk = (c.taluk || '').toLowerCase();
    const shareNos = (c.share_numbers || []).join(' ').toLowerCase();
    return name.includes(q) || place.includes(q) || taluk.includes(q) || shareNos.includes(q);
  });

  // Submit single auto candidate for approval
  const handleSubmitAutoForApproval = async (candidate) => {
    const shareNumbers = candidate.share_numbers || [];
    if (shareNumbers.length < 2) return;

    setMergingKey(candidate.key);
    try {
      const res = await ApiService.submitMergeRequest({
        shareNumbers,
        primaryShareNo: shareNumbers[0],
        requestedBy: user?.name || 'Operator',
        remarks: `ಸ್ವಯಂ ಪತ್ತೆಯಾದ ಬಹು-ಶೇರುದಾರರ (${candidate.shareholder_name}, ${candidate.place}) ವಿಲೀನ ವಿನಂತಿ.`
      });

      if (res && res.success) {
        showToast(`ವಿನಂತಿ #${res.data?.request_id} (${candidate.shareholder_name}) ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ!`);
        await loadMergeRequests();
        setActiveTab('approvals');
      } else {
        showToast(res?.message || 'ವಿನಂತಿ ಸಲ್ಲಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ', 'error');
      }
    } catch (err) {
      showToast('ದೋಷ: ' + err.message, 'error');
    } finally {
      setMergingKey(null);
    }
  };

  const handleLoadCandidateIntoSelection = (candidate) => {
    const list = candidate.holdings || candidate.records || [];
    const records = list.map((r, idx) => ({
      id: r.id || `${candidate.key}_${r.share_no || idx}`,
      share_no: r.share_no,
      shareholder_name: candidate.shareholder_name,
      place: candidate.place,
      taluk: candidate.taluk,
      number_of_shares: parseInt(r.shares || r.number_of_shares) || 1,
      total_amount: parseFloat(r.amount || r.total_amount) || 2000,
      receipt_no: r.receipt_no || '—',
      reg_date: r.receipt_date || r.reg_date || '—',
      book_no: r.book_no || 'B.No: 1'
    }));
    setSelectedShareRecords(records);
    if (records.length > 0) setPrimaryRecordId(records[0].id);
    setActiveTab('by_selection');
    showToast(`${records.length} ಷೇರುಗಳನ್ನು ಆಯ್ಕೆ ಮೋಡ್‌ಗೆ ಲೋಡ್ ಮಾಡಲಾಗಿದೆ. ಮುಖ್ಯ ಖಾತೆ ಪರಿಶೀಲಿಸಿ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಿ.`);
  };

  if (!isOpen) return null;

  // Filtered approval requests
  const filteredRequests = mergeRequests.filter(r => {
    if (approvalFilter === 'pending') return (r.approval_status || '').includes('Pending');
    if (approvalFilter === 'approved') return (r.approval_status || '').includes('Approved');
    if (approvalFilter === 'rejected') return (r.approval_status || '').includes('Rejected');
    return true;
  });

  // Selection calculations
  const totalSelectedShares = selectedShareRecords.reduce((sum, r) => sum + (parseInt(r.number_of_shares) || 1), 0);
  const totalSelectedAmount = selectedShareRecords.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);
  const primarySelectedRecord = selectedShareRecords.find(r => r.id === primaryRecordId) || selectedShareRecords[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
              <GitMerge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  ಷೇರುಗಳ ವಿಲೀನ & ಅಡ್ಮಿನ್ ಅನುಮೋದನೆ (Merge Shares & Admin Approval Gate)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 border border-amber-700/60 text-amber-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" /> Statutory Approval
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ಷೇರುಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಿ. ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಯ ನಂತರವೇ ಮಾಸ್ಟರ್ ಶೀಟ್‌ನಲ್ಲಿ ವಿಲೀನಗೊಳ್ಳುತ್ತದೆ.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          {/* Tab 1: Selection */}
          <button
            type="button"
            onClick={() => setActiveTab('by_selection')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'by_selection'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>1. ಷೇರುಗಳ ಆಯ್ಕೆ & ಸಲ್ಲಿಕೆ (Select Shares)</span>
            {selectedShareRecords.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                {selectedShareRecords.length}
              </span>
            )}
          </button>

          {/* Tab 2: Admin Approvals */}
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'approvals'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>2. ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗಳು (Admin Approvals)</span>
            {pendingApprovalsCount > 0 ? (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black animate-pulse">
                {pendingApprovalsCount} ಬಾಕಿ
              </span>
            ) : (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">
                {mergeRequests.length}
              </span>
            )}
          </button>

          {/* Tab 3: Auto Detected */}
          <button
            type="button"
            onClick={() => setActiveTab('auto_detected')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'auto_detected'
                ? 'border-sky-400 text-sky-400 bg-sky-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
            }`}
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>3. ಸ್ವಯಂ ಪತ್ತೆಯಾದ ಬಹು-ಶೇರುಗಳು (Auto-Detected)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">
              {loadingAuto ? '...' : (autoSummary?.totalDetectedShareholders || 0)}
            </span>
          </button>
        </div>

        {/* TAB 1: SELECT SHARES & SUBMIT FOR APPROVAL */}
        {activeTab === 'by_selection' && (
          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            {/* Search and Quick Add Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
              {/* Live search input with autocomplete */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>ಷೇರು ನಂ. ಅಥವಾ ಹೆಸರು ಹುಡುಕಿ (Search by Share No or Name):</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ಉದಾ: 222 ಅಥವಾ ರಾಮಗೊಂಡ..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                  />
                  {isSearching && (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin absolute right-3 top-2.5" />
                  )}
                </div>

                {/* Autocomplete dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-slate-900 border border-amber-500/40 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800">
                    {searchResults.map((rec) => {
                      const isAlreadySelected = selectedShareRecords.some(r => r.id === rec.id);
                      const isInactive = isShareholderInactive(rec);
                      return (
                        <div
                          key={rec.id}
                          onClick={() => {
                            if (isInactive) {
                              showToast(`ಷೇರು #${rec.share_no} ಈಗಾಗಲೇ ವಿಲೀನಗೊಂಡು ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ (Merged & Inactive)`, 'error');
                              return;
                            }
                            if (!isAlreadySelected) addRecordToSelection(rec);
                          }}
                          className={`p-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isInactive ? 'opacity-60 bg-rose-950/20 cursor-not-allowed' :
                            isAlreadySelected ? 'opacity-50 bg-slate-950 cursor-not-allowed' : 'hover:bg-amber-950/30'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-400">#{rec.share_no}</span>
                              <strong className="text-slate-200">{rec.shareholder_name}</strong>
                              {isInactive ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                                  ನಿಷ್ಕ್ರಿಯ (Inactive)
                                </span>
                              ) : rec.is_merged ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-950 text-sky-400 border border-sky-800">ವಿಲೀನ</span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>ಗ್ರಾಮ: {rec.place}</span>
                              <span>•</span>
                              <span>{rec.number_of_shares} ಷೇರುಗಳು</span>
                              <span>•</span>
                              <span className="text-emerald-400">₹{rec.total_amount?.toLocaleString()}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isAlreadySelected || isInactive}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                              isInactive
                                ? 'bg-rose-900/50 text-rose-300 cursor-not-allowed'
                                : isAlreadySelected
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isInactive ? 'ನಿಷ್ಕ್ರಿಯ' : isAlreadySelected ? 'ಆಯ್ಕೆಯಾಗಿದೆ' : 'ಸೇರಿಸಿ'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick comma-separated share numbers add */}
              <form onSubmit={handleQuickAdd} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ತ್ವರಿತ ಸೇರ್ಪಡೆ (Quick Add Share Numbers):</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareInput}
                    onChange={(e) => setShareInput(e.target.value)}
                    placeholder="ಉದಾ: 222, 1665 (ಅಲ್ಪವಿರಾಮದಿಂದ ಪ್ರತ್ಯೇಕಿಸಿ)"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!shareInput.trim()}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ಸೇರಿಸಿ</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Selected Share Records Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>ವಿಲೀನಕ್ಕಾಗಿ ಆಯ್ಕೆಯಾದ ಷೇರುಗಳು ({selectedShareRecords.length} ಷೇರುಗಳು):</span>
                </h3>
                {selectedShareRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSelectedShareRecords([]); setPrimaryRecordId(null); }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ (Clear All)
                  </button>
                )}
              </div>

              {selectedShareRecords.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-slate-400 space-y-2">
                  <GitMerge className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs font-semibold text-slate-300">
                    ವಿಲೀನಗೊಳಿಸಲು ಯಾವುದೇ ಷೇರುಗಳನ್ನು ಇನ್ನೂ ಆಯ್ಕೆಮಾಡಿಲ್ಲ
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    ಮೇಲಿನ ಹುಡುಕಾಟ ಬಾಕ್ಸ್‌ನಲ್ಲಿ ಷೇರು ಸಂಖ್ಯೆಗಳನ್ನು ನಮೂದಿಸಿ (ಉದಾ: 222, 1665) ಅಥವಾ ಮುಖ್ಯ ಪಟ್ಟಿಯಲ್ಲಿ ಚೆಕ್‌ಬಾಕ್ಸ್ ಮೂಲಕ ಷೇರುಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedShareRecords.map((r, i) => {
                    const isPrimary = r.id === primaryRecordId;
                    return (
                      <div
                        key={r.id || i}
                        className={`p-3.5 rounded-2xl border transition-all relative ${
                          isPrimary
                            ? 'bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-950/20'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-amber-400">
                                ಷೇರು #{r.share_no}
                              </span>
                              {isPrimary && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" /> ಮುಖ್ಯ ಮಾಸ್ಟರ್ ಖಾತೆ
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-100 text-xs mt-1">{r.shareholder_name}</h4>
                            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                              <span>ಗ್ರಾಮ: <strong className="text-slate-300">{r.place}</strong></span>
                              <span>•</span>
                              <span>ತಾ: {r.taluk}</span>
                              <span>•</span>
                              <span>ಬುಕ್: {r.book_no || 'B.No: 1'}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeRecordFromSelection(r.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="ತೆಗೆದುಹಾಕಿ (Remove)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Holding details */}
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                          <div>
                            <span className="text-slate-500 block text-[10px]">ಷೇರುಗಳ ಸಂಖ್ಯೆ</span>
                            <strong className="text-slate-200 font-mono text-xs">{r.number_of_shares || 1} ಷೇರು</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">ಬಂಡವಾಳ ಮೊತ್ತ</span>
                            <strong className="text-emerald-400 font-mono text-xs">₹{parseFloat(r.total_amount || 2000).toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">ರಶೀದಿ ನಂ. / ದಿನಾಂಕ</span>
                            <span className="text-slate-300 font-mono text-[11px]">{r.receipt_no || '—'} ({r.reg_date || '—'})</span>
                          </div>
                        </div>

                        {/* Primary selection radio button */}
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="primaryRecordChoice"
                              checked={isPrimary}
                              onChange={() => setPrimaryRecordId(r.id)}
                              className="text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700 cursor-pointer"
                            />
                            <span className={isPrimary ? 'font-bold text-amber-300' : 'text-slate-400'}>
                              {isPrimary ? 'ಮುಖ್ಯ ಖಾತೆಯಾಗಿ ಆಯ್ಕೆಯಾಗಿದೆ' : 'ಮುಖ್ಯ ಖಾತೆಯನ್ನಾಗಿ ಮಾಡಿ'}
                            </span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Merged Result Preview Banner */}
            {selectedShareRecords.length >= 2 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-950/70 to-amber-950/30 border border-emerald-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      ವಿಲೀನದ ನಂತರದ ಏಕೀಕೃತ ಖಾತೆ ಪೂರ್ವವೀಕ್ಷಣೆ (Proposed Merged Master Account):
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    ಅಡ್ಮಿನ್ ಅನುಮೋದನೆ ಸಲ್ಲಿಕೆ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">ಏಕೀಕೃತ ಷೇರು ಸಂಖ್ಯೆಗಳು</span>
                    <strong className="text-amber-300 font-mono text-sm">
                      #{selectedShareRecords.map(r => r.share_no).join(', #')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">ಒಟ್ಟು ಸಂಯೋಜಿತ ಷೇರುಗಳು</span>
                    <strong className="text-emerald-300 font-mono text-sm">
                      {totalSelectedShares} ಷೇರುಗಳು
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">ಒಟ್ಟು ಸಂಯೋಜಿತ ಬಂಡವಾಳ</span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      ₹{totalSelectedAmount.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">ಉಳಿಯುವ ಮುಖ್ಯ ಮಾಸ್ಟರ್</span>
                    <strong className="text-slate-100 truncate block text-xs">
                      {primarySelectedRecord?.shareholder_name} ({primarySelectedRecord?.place})
                    </strong>
                  </div>
                </div>

                {/* Deactivation Policy Notice */}
                <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 font-bold">ವಿಲೀನ & ನಿಷ್ಕ್ರಿಯ ಶಾಸನಬದ್ಧ ನಿಯಮ (Merger Rule):</strong>
                    <p className="mt-0.5 text-slate-300 text-[11px] leading-relaxed">
                      ವಿಲೀನದ ನಂತರ ಮುಖ್ಯ ಖಾತೆಯು (#<strong className="text-amber-300">{primarySelectedRecord?.share_no}</strong>) ಎಲ್ಲಾ {totalSelectedShares} ಷೇರುಗಳು ಹಾಗೂ ₹{totalSelectedAmount.toLocaleString()} ಬಂಡವಾಳದೊಂದಿಗೆ <span className="text-emerald-400 font-bold">ಸಕ್ರಿಯವಾಗಿರುತ್ತದೆ (Active)</span>.
                      ಉಳಿದ ಎಲ್ಲಾ ಎರಡನೇ ಖಾತೆಗಳು (#<strong className="text-rose-300">{selectedShareRecords.filter(r => r.id !== primaryRecordId).map(r => r.share_no).join(', #')}</strong>) ಕಾಯಂ ಆಗಿ <span className="text-rose-400 font-bold">ನಿಷ್ಕ್ರಿಯಗೊಳ್ಳುತ್ತವೆ (Inactive)</span> ಮತ್ತು ಎಲ್ಲ ಕಡೆ (ವಹಿವಾಟು, ಸಕ್ಕರೆ ಕೋಟಾ, ವಾರಸಾ, ವರ್ಗಾವಣೆ, ಐಡಿ ಕಾರ್ಡ್) ಸಂಪೂರ್ಣವಾಗಿ ನಿರ್ಬಂಧಿಸಲ್ಪಡುತ್ತವೆ (Disabled Everywhere).
                    </p>
                  </div>
                </div>

                {/* Remarks & Approval Settings */}
                <div className="pt-2 space-y-2">
                  <input
                    type="text"
                    value={mergeRemarks}
                    onChange={(e) => setMergeRemarks(e.target.value)}
                    placeholder="ಅಡ್ಮಿನ್ ಪರಿಶೀಲನೆಗಾಗಿ ಟಿಪ್ಪಣಿ/ಷರಾ (Remarks for Admin Approval)..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />

                  {user?.role === 'Admin' && (
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-amber-300 bg-amber-950/20 p-2.5 rounded-xl border border-amber-900/40">
                      <input
                        type="checkbox"
                        checked={directApprove}
                        onChange={(e) => setDirectApprove(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      <span className="font-semibold">
                        ಅಡ್ಮಿನ್ ವಿಶೇಷಾಧಿಕಾರ: ವಿನಂತಿ ಕಳುಹಿಸುವ ಬದಲು ತಕ್ಷಣವೇ ನೇರವಾಗಿ ಅನುಮೋದಿಸಿ ಮತ್ತು ವಿಲೀನಗೊಳಿಸಿ (Directly Approve & Execute)
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PENDING ADMIN APPROVALS */}
        {activeTab === 'approvals' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter Pills */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/40 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    approvalFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ಎಲ್ಲಾ ವಿನಂತಿಗಳು ({mergeRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    approvalFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>ಅನುಮೋದನೆ ಬಾಕಿ ({pendingApprovalsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter('approved')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    approvalFilter === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ಮಂಜೂರಾದವು</span>
                </button>
              </div>

              <button
                type="button"
                onClick={loadMergeRequests}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="ಮರುಲೋಡ್ ಮಾಡಿ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Requests List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingRequests ? (
                <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                  <span>ಅನುಮೋದನೆ ವಿನಂತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <ShieldCheck className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="font-semibold text-slate-200">
                    {approvalFilter === 'pending' ? 'ಅನುಮೋದನೆಗಾಗಿ ಯಾವುದೇ ವಿನಂತಿಗಳು ಬಾಕಿ ಉಳಿದಿಲ್ಲ.' : 'ಯಾವುದೇ ವಿಲೀನ ವಿನಂತಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ.'}
                  </p>
                  <p className="text-xs text-slate-500">
                    ಹೊಸ ಷೇರುಗಳನ್ನು ವಿಲೀನಗೊಳಿಸಲು ಟ್ಯಾಬ್ 1 ರಲ್ಲಿ ಷೇರುಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ "ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.
                  </p>
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const isPending = (req.approval_status || '').includes('Pending');
                  const isApproved = (req.approval_status || '').includes('Approved');
                  const isRejected = (req.approval_status || '').includes('Rejected');
                  const isProcessing = processingRequestId === req.id;

                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isPending
                          ? 'bg-slate-950/80 border-amber-500/40 shadow-lg shadow-amber-950/20'
                          : isApproved
                          ? 'bg-slate-950/50 border-emerald-500/30'
                          : 'bg-slate-950/30 border-rose-900/30 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-xs text-amber-400">
                            #{req.request_id || req.id}
                          </span>
                          <span className="text-xs text-slate-400">
                            ದಿನಾಂಕ: {new Date(req.request_date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-500">
                            • ಸಲ್ಲಿಸಿದವರು: <strong className="text-slate-300">{req.requested_by}</strong>
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isPending && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1.5 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>ಅಡ್ಮಿನ್ ಅನುಮೋದನೆ ಬಾಕಿ (Pending Admin Approval)</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>ಮಂಜೂರಾಗಿದೆ ಮತ್ತು ವಿಲೀನಗೊಂಡಿದೆ ({req.approved_by || 'Admin'})</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>ತಿರಸ್ಕರಿಸಲಾಗಿದೆ</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Request Details Card */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">ವಿಲೀನಗೊಳ್ಳುವ ಷೇರು ಸಂಖ್ಯೆಗಳು</span>
                          <strong className="text-amber-300 font-mono text-sm">
                            #{req.combined_share_no_str || (req.share_numbers || []).join(', #')}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">ಒಟ್ಟು ಸಂಯೋಜಿತ ಷೇರುಗಳು</span>
                          <strong className="text-emerald-300 font-mono text-sm">
                            {req.combined_shares} ಷೇರುಗಳು
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">ಒಟ್ಟು ಸಂಯೋಜಿತ ಬಂಡವಾಳ</span>
                          <strong className="text-emerald-400 font-mono text-sm">
                            ₹{req.combined_total_amount?.toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">ಉಳಿಯುವ ಮುಖ್ಯ ಮಾಸ್ಟರ್ ಖಾತೆ</span>
                          <strong className="text-slate-100 truncate block text-xs">
                            {req.primary_record?.name || 'ಮುಖ್ಯ ಖಾತೆ'} ({req.primary_record?.place || '—'})
                          </strong>
                        </div>
                      </div>

                      {/* Remarks */}
                      {req.remarks && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                          ಷರಾ/ಟಿಪ್ಪಣಿ: "{req.remarks}"
                        </p>
                      )}

                      {/* Action buttons for Admin */}
                      {isPending && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(req)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>ತಿರಸ್ಕರಿಸಿ (Reject)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApproveRequest(req)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                          >
                            {isProcessing ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>ಅನುಮೋದಿಸಲಾಗುತ್ತಿದೆ...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>ಅನುಮೋದಿಸಿ ಮತ್ತು ಮಾಸ್ಟರ್ ಶೀಟ್‌ಗೆ ಸೇರಿಸಿ (Approve & Merge)</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AUTO-DETECTED HOLDINGS */}
        {activeTab === 'auto_detected' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/50 border-b border-slate-800 text-xs">
              <div className="bg-slate-900/90 border border-amber-900/40 p-3 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">ಪತ್ತೆಯಾದ ಬಹು-ಶೇರುದಾರರು</span>
                  <strong className="text-lg font-bold text-amber-300 font-mono">
                    {loadingAuto ? '...' : (autoSummary?.totalDetectedShareholders || 0)} ಸದಸ್ಯರು
                  </strong>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-emerald-900/40 p-3 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">ಒಟ್ಟು ಸಂಯೋಜಿತ ಷೇರುಗಳು</span>
                  <strong className="text-lg font-bold text-emerald-300 font-mono">
                    {loadingAuto ? '...' : (autoSummary?.totalMergedSharesSum || 0)} ಷೇರುಗಳು
                  </strong>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-sky-900/40 p-3 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">ಒಟ್ಟು ಸಂಯೋಜಿತ ಶೇರು ಬಂಡವಾಳ</span>
                  <strong className="text-lg font-bold text-sky-300 font-mono">
                    {loadingAuto ? '...' : `₹ ${(autoSummary?.totalMergedCapitalSum || 0).toLocaleString()}`}
                  </strong>
                </div>
              </div>
            </div>

            {/* Search & Batch Action Bar */}
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={autoSearchTerm}
                  onChange={(e) => setAutoSearchTerm(e.target.value)}
                  placeholder="ಶೇರುದಾರರ ಹೆಸರು, ಗ್ರಾಮ, ಅಥವಾ ಶೇರು ನಂ. ಹುಡುಕಿ..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="text-xs text-slate-400">
                ಪತ್ತೆಯಾದ ಪ್ರತಿ ಬಹು-ಶೇರುಗಳನ್ನು ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಬಹುದು
              </div>
            </div>

            {/* Candidates List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingAuto ? (
                <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                  <span>ಬಹು-ಮೊತ್ತಗಳು ಮತ್ತು ಶೇರುಗಳ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತಿದೆ...</span>
                </div>
              ) : filteredAutoCandidates.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-200">
                    {autoSearchTerm ? 'ಹುಡುಕಾಟಕ್ಕೆ ಯಾವುದೇ ದಾಖಲೆಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.' : 'ಅದ್ಭುತ! ಯಾವುದೇ ಅಸಂಯೋಜಿತ ಬಹು-ಶೇರುಗಳು ಬಾಕಿ ಉಳಿದಿಲ್ಲ.'}
                  </p>
                </div>
              ) : (
                filteredAutoCandidates.map((c, idx) => (
                  <div
                    key={c.key || idx}
                    className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-100 text-sm">{c.shareholder_name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-700/60 text-amber-300">
                            {c.count} ಪ್ರತ್ಯೇಕ ಶೇರುಗಳು
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>ಸ್ಥಳ: <strong className="text-slate-300">{c.place}</strong></span>
                          <span>•</span>
                          <span>ತಾಲ್ಲೂಕು: {c.taluk}</span>
                          <span>•</span>
                          <span>ಸರ್ಕಲ್: {c.circle}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadCandidateIntoSelection(c)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          ಆಯ್ಕೆ ಮೋಡ್‌ಗೆ ಲೋಡ್ ಮಾಡಿ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitAutoForApproval(c)}
                          disabled={mergingKey === c.key}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          {mergingKey === c.key ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಿ</span>
                        </button>
                      </div>
                    </div>

                    {/* Breakdown table */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                      {(c.holdings || c.records || []).map((r, rIdx) => (
                        <div key={rIdx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-amber-400 text-xs">ಷೇರು #{r.share_no}</span>
                            <span className="text-[10px] font-mono text-slate-400">{r.book_no || 'B.No: 1'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span>ಷೇರುಗಳು: <strong className="text-white">{r.shares || r.number_of_shares || 1}</strong></span>
                            <span>ಮೊತ್ತ: <strong className="text-emerald-400">₹{(r.amount || r.total_amount || 2000).toLocaleString()}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            ಮುಚ್ಚಿ (Close)
          </button>

          {activeTab === 'by_selection' && (
            <button
              type="button"
              onClick={handleSubmitForApproval}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
                selectedShareRecords.length >= 2
                  ? directApprove
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/50'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/60 ring-2 ring-amber-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/40'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...</span>
                </>
              ) : selectedShareRecords.length >= 2 ? (
                directApprove ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>ನೇರವಾಗಿ ಅನುಮೋದಿಸಿ ಮತ್ತು ವಿಲೀನಗೊಳಿಸಿ (Approve & Execute)</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸಿ (Submit for Admin Approval)</span>
                  </>
                )
              ) : (
                <>
                  <GitMerge className="w-4 h-4" />
                  <span>ವಿಲೀನ ವಿನಂತಿ ಸಲ್ಲಿಸಿ (ಕನಿಷ್ಠ 2 ಷೇರುಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ)</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'approvals' && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಯ ನಂತರವೇ ಮಾಸ್ಟರ್ ಶಾಸನಬದ್ಧ ಶೀಟ್‌ನಲ್ಲಿ ಪ್ರತಿಫಲಿಸುತ್ತದೆ.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
