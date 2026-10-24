import React, { useState, useEffect } from 'react';
import { ApiService, isShareholderInactive } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  GitMerge, Search, CheckCircle2, AlertCircle, X, ShieldCheck,
  RefreshCw, Layers, Coins, Award, Check, Filter, ChevronRight,
  Plus, Trash2, ArrowRight, CheckSquare, Sparkles, UserCheck, HelpCircle,
  Clock, XCircle, Send, CheckCircle, FileText,
  ShieldAlert, AlertTriangle, History, ArrowLeft, Eye
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

  // 2-Step Approval Modal state ("ಅನುಮೋದನೆ ಬಾಕಿ ask for two times")
  const [approvalModal, setApprovalModal] = useState({
    isOpen: false,
    step: 1, // 1: First verification, 2: Second confirmation
    request: null,
    adminRemarks: '',
    doubleConfirmChecked: false,
    step1Timestamp: null,
    isProcessing: false
  });

  // History & Audit Trail Modal state ("save the details in the history")
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    request: null
  });

  // Rejection Confirmation Modal state
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    request: null,
    remarks: '',
    isProcessing: false
  });

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
          (d.all_share_numbers || []).includes(cleanNo)
        ) || res.data.find(d => String(d.id) === cleanNo) || res.data[0];

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
        // Direct execution by Admin - Must ALSO adhere to "ask for two times and save the details in the history"
        const res = await ApiService.submitMergeRequest({
          shareNumbers,
          primaryShareNo: primaryRecord.share_no || primaryRecord.id,
          requestedBy: user?.name || 'Admin',
          remarks: mergeRemarks || 'ಅಡ್ಮಿನ್ ನೇರ ವಿಲೀನ ವಿನಂತಿ (2-ಹಂತದ ದೃಢೀಕರಣಕ್ಕೆ ಒಳಪಟ್ಟಿದೆ).'
        });

        if (res && res.success && res.data) {
          showToast('ವಿಲೀನ ವಿನಂತಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ೨-ಹಂತದ ಅಂತಿಮ ಅನುಮೋದನೆ ಪೂರ್ಣಗೊಳಿಸಿ.');
          setSelectedShareRecords([]);
          setPrimaryRecordId(null);
          setMergeRemarks('');
          await loadMergeRequests();
          // Open 2-step approval modal immediately
          startApprovalFlow(res.data);
        } else {
          showToast(res?.message || 'ವಿನಂತಿ ಸಲ್ಲಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ', 'error');
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

  // START 2-STEP APPROVAL FLOW ("ಅನುಮೋದನೆ ಬಾಕಿ ask for two times")
  const startApprovalFlow = (request) => {
    setApprovalModal({
      isOpen: true,
      step: 1,
      request,
      adminRemarks: request.remarks ? `ಪರಿಶೀಲಿಸಲಾಗಿದೆ: ${request.remarks}` : 'ವಿಲೀನ ವಿನಂತಿಯನ್ನು ಕೂಲಂಕಷವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು ಷೇರು ವಿವರಗಳು ನಿಯಮಾನುಸಾರ ಸರಿಯಾಗಿವೆ.',
      doubleConfirmChecked: false,
      step1Timestamp: new Date().toISOString(),
      isProcessing: false
    });
  };

  // MOVE FROM STEP 1 TO STEP 2 (FIRST CONFIRMATION PASSED)
  const proceedToStep2 = () => {
    setApprovalModal(prev => ({
      ...prev,
      step: 2,
      step1Timestamp: prev.step1Timestamp || new Date().toISOString()
    }));
  };

  // BACK TO STEP 1
  const backToStep1 = () => {
    setApprovalModal(prev => ({
      ...prev,
      step: 1,
      doubleConfirmChecked: false
    }));
  };

  // STEP 2: FINAL CONFIRMATION & EXECUTE MERGE ("save the details in the history")
  const confirmFinalApproval = async () => {
    if (!approvalModal.doubleConfirmChecked || !approvalModal.request) return;
    setApprovalModal(prev => ({ ...prev, isProcessing: true }));
    try {
      const req = approvalModal.request;
      const step2Time = new Date().toISOString();
      const res = await ApiService.approveMergeRequestByAdmin({
        requestId: req.id,
        adminUser: user?.name || 'Admin',
        remarks: approvalModal.adminRemarks || 'ಅಡ್ಮಿನ್ ಅಧಿಕೃತ 2-ಹಂತದ ಪರಿಶೀಲನೆ ನಡೆಸಿ ಮಾಸ್ಟರ್ ಶೀಟ್‌ಗೆ ವಿಲೀನಗೊಳಿಸಲಾಗಿದೆ.',
        confirmationSteps: 2,
        step1Timestamp: approvalModal.step1Timestamp,
        step2Timestamp: step2Time
      });

      if (res && res.success) {
        showToast(`ಅಭಿನಂದನೆಗಳು! ೨ ಬಾರಿ ಪರಿಶೀಲಿಸಿ ಅನುಮೋದಿಸಲಾಗಿದೆ. ಷೇರುಗಳು #${req.combined_share_no_str} ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ಏಕೀಕೃತಗೊಂಡಿವೆ ಮತ್ತು ವಿವರಗಳನ್ನು ಇತಿಹಾಸದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ!`);
        setApprovalModal({
          isOpen: false,
          step: 1,
          request: null,
          adminRemarks: '',
          doubleConfirmChecked: false,
          step1Timestamp: null,
          isProcessing: false
        });
        await loadMergeRequests();
        await loadAutoHoldings();
        if (onMergeSuccess) await onMergeSuccess();
      } else {
        showToast(res?.message || 'ಅನುಮೋದನೆ ವಿಫಲವಾಗಿದೆ', 'error');
        setApprovalModal(prev => ({ ...prev, isProcessing: false }));
      }
    } catch (err) {
      showToast('ದೋಷ: ' + err.message, 'error');
      setApprovalModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // OPEN REJECTION MODAL
  const startRejectFlow = (request) => {
    setRejectModal({
      isOpen: true,
      request,
      remarks: 'ದಾಖಲೆಗಳಲ್ಲಿ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಿದ್ದರಿಂದ ಅಡ್ಮಿನ್ ಪರಿಶೀಲನೆಯಲ್ಲಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.',
      isProcessing: false
    });
  };

  // CONFIRM REJECTION & SAVE IN HISTORY
  const confirmRejection = async () => {
    if (!rejectModal.request) return;
    setRejectModal(prev => ({ ...prev, isProcessing: true }));
    try {
      const req = rejectModal.request;
      const res = await ApiService.rejectMergeRequestByAdmin({
        requestId: req.id,
        adminUser: user?.name || 'Admin',
        remarks: rejectModal.remarks || 'ಅಡ್ಮಿನ್ ಪರಿಶೀಲನೆಯಲ್ಲಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.'
      });

      if (res && res.success) {
        showToast(`ವಿನಂತಿ #${req.request_id} ಅನ್ನು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ ಮತ್ತು ಇತಿಹಾಸದಲ್ಲಿ ದಾಖಲಿಸಲಾಗಿದೆ.`);
        setRejectModal({ isOpen: false, request: null, remarks: '', isProcessing: false });
        await loadMergeRequests();
      } else {
        showToast(res?.message || 'ಪ್ರಕ್ರಿಯೆ ವಿಫಲವಾಗಿದೆ', 'error');
        setRejectModal(prev => ({ ...prev, isProcessing: false }));
      }
    } catch (err) {
      showToast('ದೋಷ: ' + err.message, 'error');
      setRejectModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // OPEN HISTORY MODAL ("save the details in the history" - Viewer)
  const openHistoryModal = (request) => {
    setHistoryModal({
      isOpen: true,
      request
    });
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

                      {/* Action buttons & History viewer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openHistoryModal(req)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
                            title="ಸಂಪೂರ್ಣ ಇತಿಹಾಸ ಮತ್ತು ಆಡಿಟ್ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ"
                          >
                            <History className="w-3.5 h-3.5 text-amber-400" />
                            <span>📜 ಇತಿಹಾಸ ಮತ್ತು ವಿವರಗಳು (History & Audit Trail)</span>
                          </button>

                          {isApproved && (
                            <span className="text-[11px] text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-900/60">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>೨ ಬಾರಿ ಪರಿಶೀಲಿಸಿ ಅನುಮೋದಿಸಲಾಗಿದೆ (Double-Confirmed: {req.confirmation_steps || 2}/2)</span>
                            </span>
                          )}
                        </div>

                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startRejectFlow(req)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>ತಿರಸ್ಕರಿಸಿ (Reject)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => startApprovalFlow(req)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer ring-1 ring-emerald-400/40"
                              title="೨-ಹಂತದ ಭದ್ರತಾ ಪರಿಶೀಲನೆಯೊಂದಿಗೆ ಅನುಮೋದಿಸಿ"
                            >
                              <ShieldCheck className="w-4 h-4 text-emerald-100" />
                              <span>ಅನುಮೋದಿಸಿ (2-ಹಂತದ ಪರಿಶೀಲನೆ ➔)</span>
                            </button>
                          </div>
                        )}
                      </div>
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


      {/* 2-STEP CONFIRMATION APPROVAL MODAL ("ಅನುಮೋದನೆ ಬಾಕಿ ask for two times") */}
      {approvalModal.isOpen && approvalModal.request && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/60 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header with Step indicator */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                  approvalModal.step === 1 
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                }`}>
                  {approvalModal.step === 1 ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm sm:text-base">
                      {approvalModal.step === 1 
                        ? 'ವಿಲೀನ ಅನುಮೋದನೆ ಹಂತ ೧/೨: ಪ್ರಾಥಮಿಕ ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆ (Step 1 Review)' 
                        : 'ವಿಲೀನ ಅನುಮೋದನೆ ಹಂತ ೨/೨: ಅಂತಿಮ ಭದ್ರತಾ ದೃಢೀಕರಣ (Step 2 Final Gate)'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    {approvalModal.step === 1 
                      ? '೧ನೇ ಬಾರಿಯ ಪರಿಶೀಲನೆ: ಷೇರು ವಿವರಗಳು ಮತ್ತು ಖಾತೆಗಳನ್ನು ದೃಢೀಕರಿಸಿ' 
                      : '೨ನೇ ಬಾರಿಯ ಅಂತಿಮ ದೃಢೀಕರಣ: ಮಾಸ್ಟರ್ ಶಾಸನಬದ್ಧ ಶೀಟ್‌ಗೆ ಸೇರಿಸುವ ಮುನ್ನ ಅಂತಿಮ ಒಪ್ಪಿಗೆ'}
                  </p>
                </div>
              </div>

              {/* Step Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-950 border border-amber-500/40 text-amber-300">
                <span>ಹಂತ {approvalModal.step} / ೨</span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-2 bg-slate-950 text-xs border-b border-slate-800">
              <div className={`p-2.5 text-center flex items-center justify-center gap-2 border-r border-slate-800 font-semibold ${
                approvalModal.step === 1 ? 'text-amber-300 bg-amber-950/30' : 'text-emerald-400 bg-emerald-950/20'
              }`}>
                {approvalModal.step > 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px]">1</span>}
                <span>೧ನೇ ಪರಿಶೀಲನೆ (1st Review)</span>
              </div>
              <div className={`p-2.5 text-center flex items-center justify-center gap-2 font-semibold ${
                approvalModal.step === 2 ? 'text-amber-300 bg-amber-950/40' : 'text-slate-500'
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                  approvalModal.step === 2 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                }`}>2</span>
                <span>೨ನೇ ಅಂತಿಮ ದೃಢೀಕರಣ (2nd Gate)</span>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {approvalModal.step === 1 ? (
                /* STEP 1 CONTENT */
                <>
                  <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
                      <span>ವಿನಂತಿ ಸಂಖ್ಯೆ: <strong className="text-amber-300 font-mono">#{approvalModal.request.request_id || approvalModal.request.id}</strong></span>
                      <span>ಸಲ್ಲಿಸಿದವರು: <strong className="text-slate-200">{approvalModal.request.requested_by}</strong></span>
                      <span>ದಿನಾಂಕ: <strong className="text-slate-200">{new Date(approvalModal.request.request_date).toLocaleDateString()}</strong></span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">ವಿಲೀನಗೊಳ್ಳುವ ಷೇರುಗಳು</span>
                        <span className="font-mono font-bold text-amber-300">#{approvalModal.request.combined_share_no_str}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">ಒಟ್ಟು ಸಂಯೋಜಿತ ಷೇರು</span>
                        <span className="font-mono font-bold text-emerald-300">{approvalModal.request.combined_shares} ಷೇರುಗಳು</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">ಒಟ್ಟು ಮೊತ್ತ</span>
                        <span className="font-mono font-bold text-emerald-400">₹{approvalModal.request.combined_total_amount?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">ಉಳಿಯುವ ಮುಖ್ಯ ಖಾತೆ</span>
                        <span className="font-semibold text-white truncate block">{approvalModal.request.primary_record?.name || 'ಮುಖ್ಯ ಖಾತೆ'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Holdings to be merged breakdown */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>ವಿಲೀನಗೊಳ್ಳುತ್ತಿರುವ ಷೇರು ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆ (Records Breakdown):</span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(approvalModal.request.records_to_merge || []).map((r, idx) => {
                        const isPrimary = String(r.share_no) === String(approvalModal.request.primary_share_no);
                        return (
                          <div key={idx} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            isPrimary 
                              ? 'bg-emerald-950/20 border-emerald-500/40' 
                              : 'bg-slate-950/60 border-slate-800'
                          }`}>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-amber-400">ಷೇರು #{r.share_no}</span>
                                <span className="font-medium text-slate-200">{r.shareholder_name || r.name}</span>
                                {isPrimary ? (
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                                    ಮುಖ್ಯ ಖಾತೆ (ಸಕ್ರಿಯವಾಗಿ ಉಳಿಯಲಿದೆ)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                    ದ್ವಿತೀಯ ಖಾತೆ (ವಿಲೀನಗೊಂಡು ನಿಷ್ಕ್ರಿಯವಾಗಲಿದೆ)
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                ಸ್ಥಳ: {r.place || '—'} | ರಸೀದಿ: {r.receipt_no || '—'} | ದಿನಾಂಕ: {r.reg_date || r.receipt_date || '—'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-emerald-400">₹{(r.amount || 2000).toLocaleString()}</div>
                              <div className="text-[10px] text-slate-400">{r.shares || 1} ಷೇರು</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Remarks Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      ಅಡ್ಮಿನ್ ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿ / ಷರಾ (Admin Verification Remarks):
                    </label>
                    <textarea
                      rows={2}
                      value={approvalModal.adminRemarks}
                      onChange={(e) => setApprovalModal(prev => ({ ...prev, adminRemarks: e.target.value }))}
                      placeholder="ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿ ನಮೂದಿಸಿ..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </>
              ) : (
                /* STEP 2 CONTENT (ASK FOR SECOND TIME) */
                <>
                  {/* Warning Banner */}
                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-600/50 flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-amber-300">
                        ಅಂತಿಮ ಭದ್ರತಾ ಎಚ್ಚರಿಕೆ (೨ನೇ ಬಾರಿಯ ದೃಢೀಕರಣ / 2nd Time Final Gate)
                      </h4>
                      <p className="text-slate-300 leading-relaxed">
                        ನೀವು ಈ ವಿಲೀನವನ್ನು ೨ನೇ ಬಾರಿ ಅನುಮೋದಿಸಲು ಹೊರಟಿದ್ದೀರಿ. ಈ ಅನುಮೋದನೆಯು ತಕ್ಷಣವೇ ಮಾಸ್ಟರ್ ಶಾಸನಬದ್ಧ ಶೀಟ್‌ನಲ್ಲಿ 
                        ಷೇರುಗಳನ್ನು ಒಗ್ಗೂಡಿಸುತ್ತದೆ (ಒಟ್ಟು <strong>{approvalModal.request.combined_shares} ಷೇರುಗಳು, ₹{approvalModal.request.combined_total_amount?.toLocaleString()}</strong>) 
                        ಮತ್ತು ದ್ವಿತೀಯ ಖಾತೆಗಳನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸುತ್ತದೆ. ಈ ಕ್ರಿಯೆಯು ಸಂಪೂರ್ಣ ಇತಿಹಾಸದೊಂದಿಗೆ ದಾಖಲಾಗುತ್ತದೆ.
                      </p>
                    </div>
                  </div>

                  {/* Summary Confirmation Box */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">1ನೇ ಹಂತ ಪರಿಶೀಲಿಸಿದ ಸಮಯ:</span>
                      <span className="font-mono text-amber-400 font-semibold">
                        {new Date(approvalModal.step1Timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block font-medium">ಅಂತಿಮ ಸಂಯೋಜಿತ ಷೇರು ಸಂಖ್ಯೆ</span>
                        <span className="font-mono font-bold text-sm text-amber-300">#{approvalModal.request.combined_share_no_str}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block font-medium">ಅಂತಿಮ ಸಂಯೋಜಿತ ಮೊತ್ತ</span>
                        <span className="font-mono font-bold text-sm text-emerald-400">₹{approvalModal.request.combined_total_amount?.toLocaleString()} ({approvalModal.request.combined_shares} ಷೇರುಗಳು)</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-slate-300">
                      <span className="text-[10px] text-slate-400 block font-medium">ಅಡ್ಮಿನ್ ಅಂತಿಮ ಷರಾ:</span>
                      <span className="italic font-medium">"{approvalModal.adminRemarks || 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು ಅನುಮೋದಿಸಲಾಗಿದೆ'}"</span>
                    </div>
                  </div>

                  {/* MANDATORY DOUBLE CONFIRMATION CHECKBOX */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-600/40 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={approvalModal.doubleConfirmChecked}
                      onChange={(e) => setApprovalModal(prev => ({ ...prev, doubleConfirmChecked: e.target.checked }))}
                      className="w-5 h-5 mt-0.5 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-emerald-300 block">
                        ☑ ನಾನು ಈ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ೨ ಬಾರಿ (2 times) ಕೂಲಂಕಷವಾಗಿ ಪರಿಶೀಲಿಸಿದ್ದೇನೆ.
                      </span>
                      <p className="text-[11px] text-slate-400">
                        ಈ ವಿಲೀನವನ್ನು ಮಾಸ್ಟರ್ ಶಾಸನಬದ್ಧ ಶೀಟ್‌ನಲ್ಲಿ ಅಧಿಕೃತವಾಗಿ ಅನ್ವಯಿಸಲು ಮತ್ತು ಸಂಪೂರ್ಣ ವಿವರಗಳನ್ನು ಆಡಿಟ್ ಇತಿಹಾಸದಲ್ಲಿ ಉಳಿಸಲು ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.
                      </p>
                    </div>
                  </label>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
              {approvalModal.step === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setApprovalModal({ isOpen: false, step: 1, request: null, adminRemarks: '', doubleConfirmChecked: false, step1Timestamp: null, isProcessing: false })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    ರದ್ದುಮಾಡಿ (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={proceedToStep2}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-950/60 transition-all cursor-pointer ring-1 ring-amber-400/50"
                  >
                    <span>ಮುಂದಿನ ಹಂತಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ (ಹಂತ ೨: ಅಂತಿಮ ದೃಢೀಕರಣ)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={backToStep1}
                    disabled={approvalModal.isProcessing}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>ಹಿಂದಿನ ಹಂತ (Back to Step 1)</span>
                  </button>

                  <button
                    type="button"
                    onClick={confirmFinalApproval}
                    disabled={!approvalModal.doubleConfirmChecked || approvalModal.isProcessing}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
                      approvalModal.doubleConfirmChecked && !approvalModal.isProcessing
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 ring-2 ring-emerald-400'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {approvalModal.isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>೨ ಬಾರಿ ಪರಿಶೀಲಿಸಿ ದಾಖಲಿಸಲಾಗುತ್ತಿದೆ...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>ಅಂತಿಮ ಅನುಮೋದನೆ ನೀಡಿ & ಇತಿಹಾಸದಲ್ಲಿ ಉಳಿಸಿ (Final Approve & Save History)</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* HISTORY & AUDIT TRAIL MODAL ("save the details in the history" - Viewer) */}
      {historyModal.isOpen && historyModal.request && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>ವಿಲೀನ ವಿನಂತಿ ಇತಿಹಾಸ ಮತ್ತು ಆಡಿಟ್ ವಿವರಗಳು</span>
                    <span className="font-mono text-xs text-amber-400">#{historyModal.request.request_id || historyModal.request.id}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    ೨-ಹಂತದ ಪರಿಶೀಲನೆ, ಸಲ್ಲಿಕೆ, ಮತ್ತು ಸಿಸ್ಟಮ್ ಆಡಿಟ್ ಟ್ರಯಲ್‌ನ ಸಂಪೂರ್ಣ ಕಾಲಾನುಕ್ರಮ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModal({ isOpen: false, request: null })}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Status Banner + Timeline + Holdings Table */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Status banner */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">ಸ್ಥಿತಿ (Current Status)</span>
                  <strong className="text-white text-xs">{historyModal.request.approval_status}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">ದೃಢೀಕರಣ ಹಂತಗಳು</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 border border-amber-700 text-amber-300">
                    {historyModal.request.confirmation_steps || 2} / 2 ಹಂತಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ
                  </span>
                </div>
              </div>

              {/* Chronological Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>ಕಾಲಾನುಕ್ರಮದ ಆಡಿಟ್ ಇತಿಹಾಸ (Audit History Timeline):</span>
                </h4>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {/* Stage 1: Submission */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center text-[10px] font-bold text-amber-300">
                      1
                    </div>
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">ವಿಲೀನ ವಿನಂತಿ ಸಲ್ಲಿಕೆ (Submitted)</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {historyModal.request.request_date ? new Date(historyModal.request.request_date).toLocaleString() : '—'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        ಸಲ್ಲಿಸಿದವರು: <strong className="text-slate-300">{historyModal.request.requested_by}</strong>
                      </p>
                      {historyModal.request.remarks && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-1.5 rounded">
                          "{historyModal.request.remarks}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stage 2: Step 1 Review */}
                  {(historyModal.request.step1_verified_at || historyModal.request.approved_at) && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-800 border-2 border-sky-400 flex items-center justify-center text-[10px] font-bold text-sky-300">
                        2
                      </div>
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sky-300">೧ನೇ ಹಂತ: ಪ್ರಾಥಮಿಕ ಪರಿಶೀಲನೆ (Step 1 Verification Passed)</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(historyModal.request.step1_verified_at || historyModal.request.approved_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          ಪರಿಶೀಲಿಸಿದವರು: <strong className="text-slate-300">{historyModal.request.approved_by || 'Admin'}</strong>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          ಷೇರು ಸಂಖ್ಯೆಗಳು, ಪ್ರಮಾಣಪತ್ರಗಳು ಮತ್ತು ಮೊತ್ತವನ್ನು ಮೊದಲ ಬಾರಿಗೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Stage 3: Step 2 Final Approval */}
                  {historyModal.request.approved_at && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                        3
                      </div>
                      <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-600/40 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-emerald-300">೨ನೇ ಹಂತ: ಅಂತಿಮ ಭದ್ರತಾ ದೃಢೀಕರಣ & ಅಧಿಕೃತ ವಿಲೀನ (Step 2 Final Authorized)</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(historyModal.request.approved_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          ಅಧಿಕೃತಗೊಳಿಸಿದವರು: <strong className="text-white">{historyModal.request.approved_by}</strong> (೨-ಹಂತದ ಭದ್ರತಾ ಒಪ್ಪಿಗೆಯೊಂದಿಗೆ)
                        </p>
                        {historyModal.request.approval_remarks && (
                          <p className="text-[11px] text-emerald-200 italic bg-emerald-950/50 p-1.5 rounded border border-emerald-800/40">
                            "{historyModal.request.approval_remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* If Rejected */}
                  {historyModal.request.rejected_at && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-rose-950 border-2 border-rose-400 flex items-center justify-center text-[10px] font-bold text-rose-300">
                        ✕
                      </div>
                      <div className="bg-rose-950/20 p-3 rounded-xl border border-rose-600/40 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-rose-300">ವಿನಂತಿ ತಿರಸ್ಕಾರ (Rejected by Admin)</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(historyModal.request.rejected_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          ತಿರಸ್ಕರಿಸಿದವರು: <strong className="text-white">{historyModal.request.rejected_by}</strong>
                        </p>
                        {historyModal.request.rejection_remarks && (
                          <p className="text-[11px] text-rose-200 italic bg-rose-950/50 p-1.5 rounded border border-rose-800/40">
                            "{historyModal.request.rejection_remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Holdings Table */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>ವಿಲೀನಗೊಂಡ ಷೇರುಗಳ ವಿವರಗಳು (Merged Holdings Details):</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                        <th className="p-2 font-semibold">ಷೇರು ನಂ.</th>
                        <th className="p-2 font-semibold">ಪಾತ್ರ (Role)</th>
                        <th className="p-2 font-semibold">ಷೇರು ಸಂಖ್ಯೆ</th>
                        <th className="p-2 font-semibold">ಮೊತ್ತ</th>
                        <th className="p-2 font-semibold">ರಸೀದಿ ನಂ. & ದಿನಾಂಕ</th>
                        <th className="p-2 font-semibold">ಸ್ಥಳ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {(historyModal.request.records_to_merge || []).map((r, idx) => {
                        const isPrimary = String(r.share_no) === String(historyModal.request.primary_share_no);
                        return (
                          <tr key={idx} className={isPrimary ? 'bg-emerald-950/10' : ''}>
                            <td className="p-2 font-mono font-bold text-amber-400">#{r.share_no}</td>
                            <td className="p-2">
                              {isPrimary ? (
                                <span className="text-emerald-400 font-semibold text-[11px]">ಮುಖ್ಯ ಖಾತೆ (ಸಕ್ರಿಯ)</span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">ದ್ವಿತೀಯ ಖಾತೆ (ವಿಲೀನಗೊಂಡಿದೆ)</span>
                              )}
                            </td>
                            <td className="p-2 font-mono text-white">{r.shares || 1}</td>
                            <td className="p-2 font-mono font-bold text-emerald-400">₹{(r.amount || 2000).toLocaleString()}</td>
                            <td className="p-2 text-slate-300 text-[11px]">{r.receipt_no || '—'} ({r.reg_date || r.receipt_date || '—'})</td>
                            <td className="p-2 text-slate-300 text-[11px]">{r.place || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Footnote */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  ಈ ವಿವರಗಳು ಸಿಸ್ಟಮ್ ಆಡಿಟ್ ಲಾಗ್ (System Audit Trail) ಮತ್ತು IndexedDB ಲೋಕಲ್ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಶಾಶ್ವತವಾಗಿ ಸಂರಕ್ಷಿಸಲ್ಪಟ್ಟಿವೆ.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModal({ isOpen: false, request: null })}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                ಮುಚ್ಚಿ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION CONFIRMATION MODAL */}
      {rejectModal.isOpen && rejectModal.request && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-800/60 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">ವಿಲೀನ ವಿನಂತಿ ತಿರಸ್ಕಾರ (Reject Merge Request)</h3>
                  <p className="text-xs text-slate-400">ವಿನಂತಿ #{rejectModal.request.request_id || rejectModal.request.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, request: null, remarks: '', isProcessing: false })}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-slate-300">
                ನೀವು ಷೇರುಗಳು <strong className="text-amber-400 font-mono">#{rejectModal.request.combined_share_no_str}</strong> ನ ವಿಲೀನ ವಿನಂತಿಯನ್ನು ತಿರಸ್ಕರಿಸಲು ಹೊರಟಿದ್ದೀರಿ.
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">ತಿರಸ್ಕರಿಸಲು ಕಾರಣ / ಷರಾ (Reason for Rejection):</label>
                <textarea
                  rows={3}
                  value={rejectModal.remarks}
                  onChange={(e) => setRejectModal(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="ತಿರಸ್ಕರಿಸಲು ಕಾರಣವನ್ನು ನಮೂದಿಸಿ..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, request: null, remarks: '', isProcessing: false })}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ರದ್ದುಮಾಡಿ
              </button>
              <button
                type="button"
                onClick={confirmRejection}
                disabled={rejectModal.isProcessing}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {rejectModal.isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>ಖಚಿತವಾಗಿ ತಿರಸ್ಕರಿಸಿ & ಇತಿಹಾಸದಲ್ಲಿ ಉಳಿಸಿ</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
