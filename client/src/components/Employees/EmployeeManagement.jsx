import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { createPortal } from 'react-dom';
import OfficialStaffIDCard, {
  getStaffIdCardSettings,
  saveStaffIdCardSettings,
  resetStaffIdCardSettings,
  syncStaffIdCardSettingsFromCloud
} from '../IDCards/OfficialStaffIDCard';
import {
  compressBackgroundImage,
  compressLogoImage,
  makeSignatureTransparent
} from '../IDCards/OfficialShareholderIDCard';
import {
  Briefcase, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, X, Save, KeyRound, EyeOff, ShieldCheck,
  Printer, QrCode, User, Phone, Heart, Award, Shield, FileSpreadsheet,
  Camera, Upload, Eye, SlidersHorizontal, RefreshCw, Check, Sparkles, AlertTriangle, Palette, Sliders, Layers, RotateCcw, Image as ImageIcon
} from 'lucide-react';

export default function EmployeeManagement() {
  const { showToast } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [selectedEmpForCard, setSelectedEmpForCard] = useState(null);

  // ID Card Print Options inside Modal
  const [cardSide, setCardSide] = useState('both'); // 'front', 'back', 'both'
  const [cardOrientation, setCardOrientation] = useState(() => {
    try {
      return localStorage.getItem('sugar_erp_staff_card_orientation') || 'portrait';
    } catch (e) {
      return 'portrait';
    }
  }); // 'portrait' (ಲಂಬ - 54x85.6mm) or 'landscape' (ಅಡ್ಡ - 85.6x54mm)
  const [printLayout, setPrintLayout] = useState('cr80'); // 'cr80' (CR80 PVC Plastic Card) or 'a4' (A4 Sheet with Cut & Fold Lines)
  const [showSeal, setShowSeal] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);
  const [staffCardSettings, setStaffCardSettings] = useState(getStaffIdCardSettings);

  // Form State - Clean Real Entry without hardcoded mock details
  const initialForm = {
    employee_id: '',
    name: '',
    name_english: '',
    designation: '',
    department: '',
    mobile: '',
    aadhaar_no: '',
    blood_group: '',
    joining_date: new Date().toISOString().split('T')[0],
    address: '',
    emergency_contact: '',
    epf_uan_no: '',
    salary_grade: '',
    role: 'Employee',
    password: 'Shares123',
    photo_url: '',
    signature_url: '',
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialForm);
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Webcam Capture State inside Add/Edit Modal
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const videoRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadEmployees();
    const interval = setInterval(loadEmployees, 8000);
    const handleFocus = () => loadEmployees();
    const handleUpdate = () => loadEmployees();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('employees_updated', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('employees_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    syncStaffIdCardSettingsFromCloud().then(settings => {
      if (settings) setStaffCardSettings(settings);
    });
    const handleSettingsUpdated = (e) => {
      setStaffCardSettings(e.detail || getStaffIdCardSettings());
    };
    window.addEventListener('staff_id_card_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('staff_id_card_settings_updated', handleSettingsUpdated);
  }, []);

  // Dedicated Print Staff ID Card Trigger
  const handlePrintStaffCard = () => {
    document.body.classList.add('staff-id-card-printing');
    const cleanup = () => {
      document.body.classList.remove('staff-id-card-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleUpdateSettingsField = (field, value) => {
    setStaffCardSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('ಚಿತ್ರವನ್ನು ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...', 'info');
      const dataUrl = await compressBackgroundImage(file, 1200, 800, 0.9);
      setStaffCardSettings(prev => {
        const updated = { ...prev, [field]: dataUrl };
        saveStaffIdCardSettings(updated);
        return updated;
      });
      showToast('ಹಿನ್ನೆಲೆ ಚಿತ್ರವನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಲಾಗಿದೆ (Saved to Cloud DB)!', 'success');
    } catch (err) {
      showToast('ಅಪ್ಲೋಡ್ ವಿಫಲವಾಗಿದೆ: ' + err.message, 'error');
    }
  };

  const handleMdSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('ಸಹಿಯ ಹಿನ್ನೆಲೆಯನ್ನು ಪಾರದರ್ಶಕಗೊಳಿಸಲಾಗುತ್ತಿದೆ...', 'info');
      const dataUrl = await makeSignatureTransparent(file);
      setStaffCardSettings(prev => {
        const updated = { ...prev, customMdSignature: dataUrl };
        saveStaffIdCardSettings(updated);
        return updated;
      });
      showToast('MD ಸಹಿಯನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಲಾಗಿದೆ (Saved to Cloud DB)!', 'success');
    } catch (err) {
      showToast('ಸಹಿ ಅಪ್ಲೋಡ್ ವಿಫಲವಾಗಿದೆ: ' + err.message, 'error');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressLogoImage(file, 400, 400);
      setStaffCardSettings(prev => {
        const updated = { ...prev, customLogo: dataUrl };
        saveStaffIdCardSettings(updated);
        return updated;
      });
      showToast('ಕಾರ್ಖಾನೆಯ ಲೋಗೋ ಅಪ್ಲೋಡ್ ಮಾಡಲಾಗಿದೆ (Saved to Cloud DB)!', 'success');
    } catch (err) {
      showToast('ಲೋಗೋ ಅಪ್ಲೋಡ್ ವಿಫಲವಾಗಿದೆ: ' + err.message, 'error');
    }
  };

  const handleSaveAndCloseCustomizer = () => {
    saveStaffIdCardSettings(staffCardSettings);
    showToast('ಹಿನ್ನೆಲೆ ಮತ್ತು ವಿನ್ಯಾಸವನ್ನು ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್‌ಗೆ ಉಳಿಸಲಾಗಿದೆ (Saved to Cloud DB for all browsers)!', 'success');
    setShowCustomizerModal(false);
  };

  const handleResetAllSettings = () => {
    if (window.confirm('ಎಲ್ಲಾ ಕಸ್ಟಮ್ ಹಿನ್ನೆಲೆ, ಸಹಿ ಮತ್ತು ಲೋಗೋ ಮರುಹೊಂದಿಸಲು ಖಚಿತಪಡಿಸಿ?')) {
      resetStaffIdCardSettings();
      setStaffCardSettings(getStaffIdCardSettings());
      showToast('ಡೀಫಾಲ್ಟ್ ವಿನ್ಯಾಸಕ್ಕೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ', 'info');
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    const res = await ApiService.getEmployees();
    if (res && res.data) {
      setEmployees(res.data);
    }
    setLoading(false);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    const nextNum = employees.length > 0 ? Math.max(...employees.map(e => Number(e.id) || 0)) + 1 : 1;
    const nextEmpId = `EMP-${String(nextNum).padStart(3, '0')}`;
    setEditingEmployee(null);
    setFormData({
      ...initialForm,
      employee_id: nextEmpId,
      role: 'Employee',
      password: 'Shares123',
      epf_uan_no: ''
    });
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      ...initialForm,
      ...emp,
      role: emp.role || 'Employee',
      password: emp.password || 'Shares123'
    });
    setShowAddEditModal(true);
  };

  // Reset Employee Password to Shares123
  const handleResetPassword = async (emp) => {
    if (window.confirm(`ಸಿಬ್ಬಂದಿ ${emp.name} (${emp.employee_id}) ಅವರ ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ಡೀಫಾಲ್ಟ್ 'Shares123' ಗೆ ಮರುಹೊಂದಿಸಬೇಕೇ (Reset Password to Shares123)?`)) {
      const res = await ApiService.updateEmployee(emp.id || emp.employee_id, {
        password: 'Shares123'
      });
      if (res && res.success) {
        showToast(`ಸಿಬ್ಬಂದಿ ${emp.name} ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು 'Shares123' ಗೆ ರಿಸೆಟ್ ಮಾಡಲಾಗಿದೆ!`, 'success');
        loadEmployees();
      } else {
        showToast('ರಿಸೆಟ್ ವಿಫಲವಾಗಿದೆ', 'error');
      }
    }
  };

  // Delete Employee
  const handleDelete = async (emp) => {
    if (window.confirm(`ಖಚಿತವಾಗಿ ಸಿಬ್ಬಂದಿ ${emp.name} (${emp.employee_id}) ವಿವರಗಳನ್ನು ಅಳಿಸಬೇಕೇ?`)) {
      const res = await ApiService.deleteEmployee(emp.id || emp.employee_id);
      if (res && res.success) {
        showToast(`ಉದ್ಯೋಗಿ ${emp.name} ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ!`, 'success');
        loadEmployees();
      } else {
        showToast(`ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ: ${res.message || 'Error'}`, 'error');
      }
    }
  };

  // Compress and handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 320;
        const maxH = 400;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
        } else {
          if (h > maxH) {
            w = Math.round((w * maxH) / h);
            h = maxH;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, photo_url: dataUrl }));
        showToast('ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಯಶಸ್ವಿಯಾಗಿದೆ!', 'success');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Live Webcam Start / Stop for Modal
  const startWebcam = async () => {
    try {
      setIsWebcamOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Webcam error:', err);
      showToast('ವೆಬ್‌ಕ್ಯಾಮ್ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ: ' + err.message, 'error');
      setIsWebcamOpen(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    setIsWebcamOpen(false);
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setFormData(prev => ({ ...prev, photo_url: dataUrl }));
    stopWebcam();
    showToast('ವೆಬ್‌ಕ್ಯಾಮ್ ಫೋಟೋ ಸೆರೆಹಿಡಿಯಲಾಗಿದೆ!', 'success');
  };

  // Save Employee Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('ದಯವಿಟ್ಟು ಉದ್ಯೋಗಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ', 'error');
      return;
    }

    if (editingEmployee) {
      const res = await ApiService.updateEmployee(editingEmployee.id || editingEmployee.employee_id, formData);
      if (res && res.success) {
        showToast(`ಸಿಬ್ಬಂದಿ ${formData.name} ವಿವರಗಳನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ!`, 'success');
        stopWebcam();
        setShowAddEditModal(false);
        loadEmployees();
      } else {
        showToast('ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ: ' + (res.message || 'Error'), 'error');
      }
    } else {
      const res = await ApiService.addEmployee(formData);
      if (res && res.success) {
        showToast(`ಹೊಸ ಸಿಬ್ಬಂದಿ ${formData.name} (${res.employee_id}) ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಣಿಯಾಗಿದೆ!`, 'success');
        stopWebcam();
        setShowAddEditModal(false);
        loadEmployees();
      } else {
        showToast('ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ', 'error');
      }
    }
  };

  // Open ID Card Generator for an Employee
  const handleOpenIdCard = (emp) => {
    setSelectedEmpForCard(emp);
    setShowIdCardModal(true);
  };

  // Export Employees to CSV
  const handleExportCSV = () => {
    if (employees.length === 0) {
      showToast('ರಫ್ತು ಮಾಡಲು ಯಾವುದೇ ಸಿಬ್ಬಂದಿ ವಿವರಗಳಿಲ್ಲ', 'error');
      return;
    }

    const headers = [
      'Emp ID', 'Name (Kannada)', 'Name (English)', 'Designation', 'Department',
      'Mobile', 'Aadhaar No', 'Blood Group', 'Joining Date', 'Address', 'Emergency Contact', 'EPF/UAN', 'Status'
    ];
    const rows = employees.map(e => [
      `"${e.employee_id || ''}"`,
      `"${e.name || ''}"`,
      `"${e.name_english || ''}"`,
      `"${e.designation || ''}"`,
      `"${e.department || ''}"`,
      `"${e.mobile || ''}"`,
      `"${e.aadhaar_no || ''}"`,
      `"${e.blood_group || ''}"`,
      `"${e.joining_date || ''}"`,
      `"${(e.address || '').replace(/"/g, '""')}"`,
      `"${(e.emergency_contact || '').replace(/"/g, '""')}"`,
      `"${e.epf_uan_no || ''}"`,
      `"${e.status || 'Active'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sugar_Factory_Employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ಸಿಬ್ಬಂದಿ ವಿವರಗಳ CSV ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!', 'success');
  };

  // Filter Employees
  const filteredEmployees = employees.filter(e => {
    // Search match
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = String(e.employee_id || '').toLowerCase().includes(q);
      const matchName = String(e.name || '').toLowerCase().includes(q);
      const matchEng = String(e.name_english || '').toLowerCase().includes(q);
      const matchDesig = String(e.designation || '').toLowerCase().includes(q);
      const matchDept = String(e.department || '').toLowerCase().includes(q);
      const matchMob = String(e.mobile || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchEng && !matchDesig && !matchDept && !matchMob) return false;
    }

    // Department match
    if (departmentFilter !== 'All' && e.department !== departmentFilter) return false;

    // Status match
    if (statusFilter !== 'All' && e.status !== statusFilter) return false;

    return true;
  });

  // Calculate Summary Stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const uniqueDepartments = Array.from(new Set(employees.map(e => e.department).filter(Boolean))).length;
  const bloodGroupsCount = employees.filter(e => e.blood_group).length;

  // Standard Departments List for Sugar Factory
  const standardDepartments = [
    'ಆಡಳಿತ ವಿಭಾಗ (Administration)',
    'ಲೆಕ್ಕಪತ್ರ ವಿಭಾಗ (Accounts & Finance)',
    'ಕಬ್ಬು ವಿಭಾಗ (Cane Procurement & Development)',
    'ಇಂಜಿನಿಯರಿಂಗ್ ವಿಭಾಗ (Engineering & Milling)',
    'ಉತ್ಪಾದನೆ & ಸಂಸ್ಕರಣೆ (Production & Boiling)',
    'ಐಟಿ & ಇಆರ್‌ಪಿ ವಿಭಾಗ (Information Technology)',
    'ಭದ್ರತೆ & ರಕ್ಷಣೆ (Security & Safety)',
    'ಗುಣಮಟ್ಟ ನಿಯಂತ್ರಣ (Quality Control & Lab)'
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary KPI Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <span className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Briefcase className="w-5 h-5" />
              </span>
              <span>Employee & Staff Management (ಸಿಬ್ಬಂದಿ ನಿರ್ವಹಣೆ)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆಯ ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ದಾಖಲಾತಿ, ಫೋಟೋ ಅಪ್‌ಲೋಡ್, ಗುರುತಿನ ಚೀಟಿ ಮತ್ತು ಹಾಜರಾತಿ QR ವ್ಯವಸ್ಥೆ
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow cursor-pointer"
              title="Export staff details to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>ಎಕ್ಸೆಲ್ ರಫ್ತು (CSV)</span>
            </button>

            <button
              onClick={() => {
                if (employees.length > 0) {
                  setSelectedEmpForCard(employees[0]);
                  setShowIdCardModal(true);
                } else {
                  showToast('ಐಡಿ ಕಾರ್ಡ್ ಮುದ್ರಿಸಲು ಯಾವುದೇ ಸಿಬ್ಬಂದಿ ಇಲ್ಲ', 'error');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-900/60 hover:bg-teal-800/80 text-teal-200 border border-teal-600 rounded-xl text-xs font-semibold transition-all shadow cursor-pointer"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>ಸಿಬ್ಬಂದಿ ID ಕಾರ್ಡ್ ಪ್ರಿಂಟರ್</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ಹೊಸ ಉದ್ಯೋಗಿ ನೋಂದಣಿ (Add Staff)</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">ಒಟ್ಟು ಸಿಬ್ಬಂದಿ (Total)</div>
              <div className="text-xl font-black text-slate-100 font-mono mt-0.5">{totalEmployees}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              👥
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">ಸೇವೆಯಲ್ಲಿರುವವರು (Active)</div>
              <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{activeEmployees}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">ವಿಭಾಗಗಳು (Departments)</div>
              <div className="text-xl font-black text-teal-300 font-mono mt-0.5">{uniqueDepartments}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
              🏢
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">ರಕ್ತದ ಗುಂಪು ದಾಖಲೆ (Blood)</div>
              <div className="text-xl font-black text-rose-400 font-mono mt-0.5">{bloodGroupsCount}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              🩸
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ಹುಡುಕಿ: ಉದ್ಯೋಗಿ ಹೆಸರು, Emp ID, ಹುದ್ದೆ, ಮೊಬೈಲ್..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
          >
            <option value="All">ಎಲ್ಲಾ ವಿಭಾಗಗಳು (All Departments)</option>
            {standardDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
          >
            <option value="All">ಎಲ್ಲಾ ಸ್ಥಿತಿ (All Status)</option>
            <option value="Active">Active (ಸೇವೆಯಲ್ಲಿರುವವರು)</option>
            <option value="On Leave">On Leave (ರಜೆಯಲ್ಲಿರುವವರು)</option>
            <option value="Resigned">Resigned (ಬಿಟ್ಟಿರುವವರು)</option>
          </select>

          {(searchQuery || departmentFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDepartmentFilter('All');
                setStatusFilter('All');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. Employee List Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center">ಫೋಟೋ</th>
                <th className="py-3 px-3">Emp ID</th>
                <th className="py-3 px-4">ಉದ್ಯೋಗಿ ಹೆಸರು (Employee Name)</th>
                <th className="py-3 px-4">ಹುದ್ದೆ & ವಿಭಾಗ (Designation & Dept)</th>
                <th className="py-3 px-3">ನಿಯೋಜಿತ ಪಾತ್ರ (Assigned Role)</th>
                <th className="py-3 px-3">ರಕ್ತದ ಗುಂಪು</th>
                <th className="py-3 px-3">ಮೊಬೈಲ್</th>
                <th className="py-3 px-3">ಸೇರ್ಪಡೆ ದಿನಾಂಕ</th>
                <th className="py-3 px-3 text-center">ಸ್ಥಿತಿ</th>
                <th className="py-3 px-4 text-center">ಕ್ರಮಗಳು (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    ಸಿಬ್ಬಂದಿ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    ಯಾವುದೇ ಸಿಬ್ಬಂದಿ ವಿವರಗಳು ಕಂಡುಬಂದಿಲ್ಲ. "ಹೊಸ ಉದ್ಯೋಗಿ ನೋಂದಣಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id || emp.employee_id} className="hover:bg-slate-900/70 transition-colors">
                    {/* Photo Thumbnail */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="w-9 h-11 rounded-md border border-slate-700 bg-slate-900 overflow-hidden mx-auto flex items-center justify-center shadow-inner">
                        {emp.photo_url ? (
                          <img src={emp.photo_url} alt={emp.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </td>

                    {/* Emp ID */}
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                      {emp.employee_id}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-4 font-medium">
                      <div className="text-slate-100 font-bold">{emp.name}</div>
                      {emp.name_english && (
                        <div className="text-[10px] text-slate-400">{emp.name_english}</div>
                      )}
                    </td>

                    {/* Designation & Department */}
                    <td className="py-2.5 px-4">
                      <div className="text-emerald-300 font-semibold">{emp.designation}</div>
                      <div className="text-[10px] text-slate-400">{emp.department}</div>
                    </td>
{/* Assigned Role */}
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] whitespace-nowrap ${
                        emp.role === 'Admin' ? 'bg-rose-950 text-rose-300 border-rose-700' :
                        emp.role === 'Cashier' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                        emp.role === 'Computer Operator' ? 'bg-sky-950 text-sky-300 border-sky-700' :
                        emp.role === 'Attendance Operator' ? 'bg-teal-950 text-teal-300 border-teal-700' :
                        emp.role === 'Sugar Operator' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                        'bg-slate-900 text-slate-300 border-slate-700'
                      }`}>
                        {emp.role || 'Employee'}
                      </span>
                    </td>

                    {/* Blood Group */}
                    <td className="py-2.5 px-3">
                      {emp.blood_group ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700 text-rose-300 font-bold text-[10px]">
                          🩸 {emp.blood_group}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Mobile */}
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {emp.mobile || '—'}
                    </td>

                    {/* Joining Date */}
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {emp.joining_date || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        emp.status === 'Active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : emp.status === 'On Leave'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {emp.status || 'Active'}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* ID Card View Button */}
                        <button
                          onClick={() => handleOpenIdCard(emp)}
                          className="p-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 rounded-lg transition-colors cursor-pointer"
                          title="View & Print Official Staff ID Card"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => handleResetPassword(emp)}
                          className="p-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg transition-colors cursor-pointer"
                          title="ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್ 'Shares123' ಗೆ ರಿಸೆಟ್ ಮಾಡಿ (Reset Password to Shares123)"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit Employee"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(emp)}
                          className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Complete Add / Edit Employee Modal with Photo Upload & Webcam */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border-2 border-emerald-600/80 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 my-8 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                  <span>{editingEmployee ? 'ಸಿಬ್ಬಂದಿ ವಿವರಗಳನ್ನು ಬದಲಾಯಿಸಿ (Edit Staff)' : 'ಹೊಸ ಸಿಬ್ಬಂದಿ ನೋಂದಣಿ (Add New Staff)'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">ಫ್ಯಾಕ್ಟರಿ ಅಧಿಕೃತ ಉದ್ಯೋಗಿ ವಿವರಗಳು & ಭಾವಚಿತ್ರ ನೋಂದಣಿ</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopWebcam();
                  setShowAddEditModal(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Photo Upload & Webcam Section */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                {/* Photo Preview Box */}
                <div className="w-24 h-28 rounded-xl border-2 border-dashed border-emerald-500/70 overflow-hidden bg-slate-950 flex flex-col items-center justify-center relative shadow-inner shrink-0">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Staff Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2 text-slate-500">
                      <User className="w-8 h-8 mx-auto text-slate-600" />
                      <span className="text-[9px] mt-1 block">ಫೋಟೋ ಇಲ್ಲ</span>
                    </div>
                  )}

                  {formData.photo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                      className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-500"
                      title="Remove Photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="font-bold text-slate-200">ಸಿಬ್ಬಂದಿ ಭಾವಚಿತ್ರ (Employee Passport Photo)</div>
                  <p className="text-[11px] text-slate-400">
                    ಗುರುತಿನ ಚೀಟಿ (ID Card) ಗಾಗಿ ಉದ್ಯೋಗಿಯ ಭಾವಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ವೆಬ್‌ಕ್ಯಾಮ್‌ನಿಂದ ನೇರವಾಗಿ ಸೆರೆಹಿಡಿಯಿರಿ.
                  </p>

                  <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>ಫೈಲ್ ಅಪ್‌ಲೋಡ್</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isWebcamOpen) stopWebcam();
                        else startWebcam();
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <Camera className="w-3.5 h-3.5 text-teal-400" />
                      <span>{isWebcamOpen ? 'ಕ್ಯಾಮೆರಾ ಮುಚ್ಚಿ' : '📸 ವೆಬ್‌ಕ್ಯಾಮ್ ಸೆರೆಹಿಡಿಯಿರಿ'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Webcam Stream inside modal if opened */}
              {isWebcamOpen && (
                <div className="bg-black border-2 border-emerald-500 rounded-2xl p-3 flex flex-col items-center space-y-2">
                  <div className="w-56 h-48 rounded-xl overflow-hidden bg-black border border-slate-800 relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={captureWebcamSnapshot}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>ಫೋಟೋ ಕ್ಲಿಕ್ ಮಾಡಿ</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopWebcam}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-semibold text-xs"
                    >
                      ರದ್ದುಮಾಡಿ
                    </button>
                  </div>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Emp ID */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ಉದ್ಯೋಗಿ ಐಡಿ (Employee ID) *</label>
                  <input
                    type="text"
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ರಕ್ತದ ಗುಂಪು (Blood Group)</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="">-- ರಕ್ತದ ಗುಂಪು ಆಯ್ಕೆಮಾಡಿ (Select Blood Group) --</option>
                    <option value="A+">A+ (ಎ ಪಾಸಿಟಿವ್)</option>
                    <option value="B+">B+ (ಬಿ ಪಾಸಿಟಿವ್)</option>
                    <option value="O+">O+ (ಒ ಪಾಸಿಟಿವ್)</option>
                    <option value="AB+">AB+ (ಎಬಿ ಪಾಸಿಟಿವ್)</option>
                    <option value="A-">A- (ಎ ನೆಗೆಟಿವ್)</option>
                    <option value="B-">B- (ಬಿ ನೆಗೆಟಿವ್)</option>
                    <option value="O-">O- (ಒ ನೆಗೆಟಿವ್)</option>
                    <option value="AB-">AB- (ಎಬಿ ನೆಗೆಟಿವ್)</option>
                  </select>
                </div>

                {/* Name in Kannada */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ಪೂರ್ಣ ಹೆಸರು (ಕನ್ನಡದಲ್ಲಿ) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ಉದಾ: ಸಂಜೀವಕುಮಾರ ಎಸ್. ಪಾಟೀಲ"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                {/* Name in English */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Employee Name (in English)</label>
                  <input
                    type="text"
                    value={formData.name_english}
                    onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
                    placeholder="ಉದಾ: Ramesh Kumar"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ವಿಭಾಗ (Department) *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="">-- ವಿಭಾಗ ಆಯ್ಕೆಮಾಡಿ (Select Department) --</option>
                    {standardDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ಹುದ್ದೆ (Designation) *</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="ಉದಾ: ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿ / ಕಬ್ಬು ಮ್ಯಾನೇಜರ್"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (Mobile No) *</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>

                {/* Aadhaar Number */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ಆಧಾರ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ (Aadhaar No)</label>
                  <input
                    type="text"
                    value={formData.aadhaar_no}
                    onChange={(e) => setFormData({ ...formData, aadhaar_no: e.target.value })}
                    placeholder="12 ಅಂಕಿಗಳ ಆಧಾರ್ ಸಂಖ್ಯೆ"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ಸೇರ್ಪಡೆ ದಿನಾಂಕ (Joining Date)</label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ಉದ್ಯೋಗ ಸ್ಥಿತಿ (Status)</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="Active">Active (ಸೇವೆಯಲ್ಲಿರುವವರು)</option>
                    <option value="On Leave">On Leave (ರಜೆಯಲ್ಲಿದ್ದಾರೆ)</option>
                    <option value="Resigned">Resigned (ಬಿಟ್ಟಿದ್ದಾರೆ)</option>
                  </select>
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ತುರ್ತು ಸಂಪರ್ಕ (Emergency Contact)</label>
                  <input
                    type="text"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="ಹೆಸರು ಮತ್ತು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                {/* EPF / UAN */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ಇಪಿಎಫ್ / ಯುಎಎನ್ (EPF / UAN No)</label>
                  <input
                    type="text"
                    value={formData.epf_uan_no}
                    onChange={(e) => setFormData({ ...formData, epf_uan_no: e.target.value })}
                    placeholder="UAN-100293847500"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* ERP Role-Based Access Control & Login Password Section */}
              <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-100 text-xs">
                      ERP ಸಿಸ್ಟಮ್ ಲಾಗಿನ್ & ನಿಯೋಜಿತ ಕರ್ತವ್ಯದ ಪಾತ್ರ (Assigned Role & RBAC Access)
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    ವೈಶಿಷ್ಟ್ಯಗಳ ನಿರ್ಬಂಧ (Access Control)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Assigned Role */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ನಿಯೋಜಿತ ಪಾತ್ರ (Assigned Role) *</span>
                    </label>
                    <select
                      value={formData.role || 'Employee'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-emerald-300 font-bold focus:border-emerald-400 outline-none"
                    >
                      <option value="Admin">Admin (ಸಂಪೂರ್ಣ ಸಿಸ್ಟಮ್ ನಿರ್ವಾಹಕರು - Full Access)</option>
                      <option value="Computer Operator">Computer Operator (ಕಂಪ್ಯೂಟರ್ ಆಪರೇಟರ್ - ಷೇರು, ನೋಂದಣಿ, ಸಕ್ಕರೆ, ಹಾಜರಾತಿ, ID ಕಾರ್ಡ್)</option>
                      <option value="Cashier">Cashier (ಮುಖ್ಯ ಖಜಾಂಚಿ / ಕ್ಯಾಷಿಯರ್ - ಹಣಕಾಸು & ಷೇರು)</option>
                      <option value="Attendance Operator">Attendance Operator (ಹಾಜರಾತಿ ನಿರ್ವಾಹಕರು - ಲೈವ್ QR ಹಾಜರಾತಿ)</option>
                      <option value="Sugar Operator">Sugar Operator (ಸಕ್ಕರೆ ಹಂಚಿಕೆ ನಿರ್ವಾಹಕರು - ಕೋಟಾ & ವಿತರಣೆ)</option>
                      <option value="Employee">Employee (ಸಾಮಾನ್ಯ ಸಿಬ್ಬಂದಿ - ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ & ಹಾಜರಾತಿ)</option>
                    </select>
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      ಈ ಆಯ್ಕೆಯು ಉದ್ಯೋಗಿಗೆ ERP ಸಾಫ್ಟ್‌ವೇರ್‌ನಲ್ಲಿ ಯಾವೆಲ್ಲಾ ಮಾಡ್ಯೂಲ್‌ಗಳನ್ನು ನೋಡಲು ಮತ್ತು ಬಳಸಲು ಅನುಮತಿಸಬೇಕು ಎಂಬುದನ್ನು ನಿರ್ಬಂಧಿಸುತ್ತದೆ.
                    </p>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>ಲಾಗಿನ್ ಪಾಸ್‌ವರ್ಡ್ (Login Password)</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">ಡೀಫಾಲ್ಟ್: Shares123</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        value={formData.password !== undefined ? formData.password : 'Shares123'}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Shares123"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold pr-10 focus:border-emerald-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      ಸಿಬ್ಬಂದಿ ಮೊದಲ ಬಾರಿ ಲಾಗಿನ್ ಆಗಲು <strong className="font-mono text-amber-300">Shares123</strong> ಬಳಸಿ ಲಾಗಿನ್ ಆಗಬಹುದು, ನಂತರ ತಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿಕೊಳ್ಳಬಹುದು.
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">ವಾಸಸ್ಥಳ ವಿಳಾಸ (Residential Address)</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="ಕ್ವಾರ್ಟರ್ಸ್ / ವಿಳಾಸ, ಗ್ರಾಮ, ತಾಲೂಕು..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    stopWebcam();
                    setShowAddEditModal(false);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  ರದ್ದುಮಾಡಿ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEmployee ? 'ಬದಲಾವಣೆ ಉಳಿಸಿ (Update)' : 'ಉದ್ಯೋಗಿ ಉಳಿಸಿ (Save Staff)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Official Staff ID Card Generator Modal (Just like Shareholders!) */}
      {showIdCardModal && selectedEmpForCard && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border-2 border-emerald-500 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 my-8 animate-fadeIn text-slate-100">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <span>ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಗುರುತಿನ ಚೀಟಿ (Official Staff Identity Card)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  #{selectedEmpForCard.employee_id} - {selectedEmpForCard.name} ({selectedEmpForCard.designation})
                </p>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Orientation Toggle: Portrait (ಲಂಬ) / Landscape (ಅಡ್ಡ) */}
                <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setCardOrientation('portrait');
                      try { localStorage.setItem('sugar_erp_staff_card_orientation', 'portrait'); } catch (e) {}
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      cardOrientation === 'portrait' ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="ಲಂಬ ವಿನ್ಯಾಸ (Portrait - 54x85.6mm)"
                  >
                    <span>📱 ಲಂಬ (Portrait)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardOrientation('landscape');
                      try { localStorage.setItem('sugar_erp_staff_card_orientation', 'landscape'); } catch (e) {}
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      cardOrientation === 'landscape' ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="ಅಡ್ಡ ವಿನ್ಯಾಸ (Landscape - 85.6x54mm)"
                  >
                    <span>💻 ಅಡ್ಡ (Landscape)</span>
                  </button>
                </div>

                {/* Side Toggle: Front / Back / Both */}
                <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setCardSide('front')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      cardSide === 'front' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    ಮುಂಭಾಗ (Front)
                  </button>
                  <button
                    onClick={() => setCardSide('back')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      cardSide === 'back' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    ಹಿಂಬದಿ (Back)
                  </button>
                  <button
                    onClick={() => setCardSide('both')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      cardSide === 'both' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    ಎರಡೂ ಬದಿ (Both)
                  </button>
                </div>

                {/* Seal Toggle */}
                <button
                  onClick={() => setShowSeal(!showSeal)}
                  className={`px-2.5 py-1 text-xs rounded-xl border transition-colors cursor-pointer ${
                    showSeal ? 'bg-emerald-950 border-emerald-600 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  ಸೀಲ್: {showSeal ? 'ON' : 'OFF'}
                </button>

                {/* Print Layout Format Toggle: CR80 PVC Card vs A4 Sheet */}
                <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPrintLayout('cr80')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      printLayout === 'cr80' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Standard CR80 PVC Plastic Card (54x85.6mm / 85.6x54mm)"
                  >
                    <span>🪪 CR80 ಕಾರ್ಡ್ (PVC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayout('a4')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      printLayout === 'a4' ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="A4 Paper Sheet with Cut and Fold Guides"
                  >
                    <span>📄 A4 ಶೀಟ್ (Cut & Fold)</span>
                  </button>
                </div>

                {/* Backgrounds & Design Customizer Button */}
                <button
                  type="button"
                  onClick={() => setShowCustomizerModal(true)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all"
                  title="Upload Custom Front / Back Backgrounds, Logo, and MD Signature"
                >
                  <Palette className="w-4 h-4" />
                  <span>🎨 ಹಿನ್ನೆಲೆ & ವಿನ್ಯಾಸ (Design)</span>
                </button>

                {/* QR Toggle */}
                <button
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={`px-2.5 py-1 text-xs rounded-xl border transition-colors cursor-pointer ${
                    showQrCode ? 'bg-emerald-950 border-emerald-600 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  ಹಾಜರಾತಿ QR: {showQrCode ? 'ON' : 'OFF'}
                </button>

                {/* Print Button - Uses dedicated Print Portal */}
                <button
                  onClick={handlePrintStaffCard}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>ಪ್ರಿಂಟ್ ಮಾಡಿ (Print ID Card)</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setShowIdCardModal(false)}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Employee Selector Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 text-xs">
              <span className="text-slate-400 shrink-0 font-medium">ಸಿಬ್ಬಂದಿ ಆಯ್ಕೆಮಾಡಿ:</span>
              {employees.map(e => (
                <button
                  key={e.id || e.employee_id}
                  onClick={() => setSelectedEmpForCard(e)}
                  className={`px-2.5 py-1 rounded-lg text-xs shrink-0 cursor-pointer transition-colors ${
                    selectedEmpForCard.employee_id === e.employee_id
                      ? 'bg-emerald-600 text-white font-bold shadow'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {e.employee_id} - {e.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Live Interactive Card Preview Section */}
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-center gap-6 print:p-0 print:border-none print:bg-transparent">
              {cardSide === 'both' ? (
                printLayout === 'a4' ? (
                  /* A4 Attached Foldable Sheet Preview */
                  <div className="flex flex-col items-center space-y-2 max-w-full">
                    <div className="flex items-center justify-between text-[11px] font-mono text-teal-300 bg-slate-950/90 px-3 py-1 rounded-lg border border-teal-500/40 w-full max-w-2xl">
                      <span className="flex items-center gap-1">✂ ಕತ್ತರಿಸುವ ಗೆರೆ (Outer Cut Box)</span>
                      <span className="font-bold text-amber-300 flex items-center gap-1">▼ ಮಧ್ಯದಲ್ಲಿ ಮಡಚುವ ಗೆರೆ (Fold Line) ▼</span>
                      <span>✂ Cut</span>
                    </div>

                    <div className="border-2 border-dashed border-teal-400/80 rounded-xl flex flex-row items-stretch justify-center bg-white shadow-2xl overflow-hidden p-0 gap-0">
                      <div className="p-0 m-0">
                        <OfficialStaffIDCard
                          employee={selectedEmpForCard}
                          showBack={false}
                          showSeal={showSeal}
                          showQrCode={showQrCode}
                          orientation={cardOrientation}
                          customFrontBackground={staffCardSettings.customFrontBackground}
                          customBackBackground={staffCardSettings.customBackBackground}
                          backgroundOpacity={staffCardSettings.backgroundOpacity}
                          customLogo={staffCardSettings.customLogo}
                          customMdSignature={staffCardSettings.customMdSignature}
                        />
                      </div>
                      <div className="w-0 self-stretch border-l-2 border-dashed border-slate-900 z-20" title="ಮಡಚುವ ಗೆರೆ (Fold Line)"></div>
                      <div className="p-0 m-0">
                        <OfficialStaffIDCard
                          employee={selectedEmpForCard}
                          showBack={true}
                          showSeal={showSeal}
                          showQrCode={showQrCode}
                          orientation={cardOrientation}
                          customFrontBackground={staffCardSettings.customFrontBackground}
                          customBackBackground={staffCardSettings.customBackBackground}
                          backgroundOpacity={staffCardSettings.backgroundOpacity}
                          customLogo={staffCardSettings.customLogo}
                          customMdSignature={staffCardSettings.customMdSignature}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 w-full max-w-2xl px-1">
                      <span>✂ ಹೊರಗಿನ ಗೆರೆಯಲ್ಲಿ ಕತ್ತರಿಸಿ (Cut along outer line)</span>
                      <span className="text-amber-300 font-semibold">ಮಧ್ಯದ ಗೆರೆಯಲ್ಲಿ ಮಡಚಿ ಲ್ಯಾಮಿನೇಟ್ ಮಾಡಿ (Fold along center line)</span>
                      <span>#{selectedEmpForCard.employee_id}</span>
                    </div>
                  </div>
                ) : (
                  /* CR80 Individual PVC Cards Preview */
                  <>
                    {/* Front Side */}
                    <div className="space-y-1.5 text-center">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded print:hidden">
                        ಮುಂಭಾಗ (Front Page)
                      </span>
                      <div>
                        <OfficialStaffIDCard
                          employee={selectedEmpForCard}
                          showBack={false}
                          showSeal={showSeal}
                          showQrCode={showQrCode}
                          orientation={cardOrientation}
                          customFrontBackground={staffCardSettings.customFrontBackground}
                          customBackBackground={staffCardSettings.customBackBackground}
                          backgroundOpacity={staffCardSettings.backgroundOpacity}
                          customLogo={staffCardSettings.customLogo}
                          customMdSignature={staffCardSettings.customMdSignature}
                        />
                      </div>
                    </div>

                    {/* Back Side with Ultra-large QR Code */}
                    <div className="space-y-1.5 text-center">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded print:hidden">
                        ಹಿಂಬದಿ (Back Page - Attendance QR)
                      </span>
                      <div>
                        <OfficialStaffIDCard
                          employee={selectedEmpForCard}
                          showBack={true}
                          showSeal={showSeal}
                          showQrCode={showQrCode}
                          orientation={cardOrientation}
                          customFrontBackground={staffCardSettings.customFrontBackground}
                          customBackBackground={staffCardSettings.customBackBackground}
                          backgroundOpacity={staffCardSettings.backgroundOpacity}
                          customLogo={staffCardSettings.customLogo}
                          customMdSignature={staffCardSettings.customMdSignature}
                        />
                      </div>
                    </div>
                  </>
                )
              ) : cardSide === 'front' ? (
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded print:hidden">
                    ಮುಂಭಾಗ (Front Page)
                  </span>
                  <div>
                    <OfficialStaffIDCard
                      employee={selectedEmpForCard}
                      showBack={false}
                      showSeal={showSeal}
                      showQrCode={showQrCode}
                      orientation={cardOrientation}
                      customFrontBackground={staffCardSettings.customFrontBackground}
                      customBackBackground={staffCardSettings.customBackBackground}
                      backgroundOpacity={staffCardSettings.backgroundOpacity}
                      customLogo={staffCardSettings.customLogo}
                      customMdSignature={staffCardSettings.customMdSignature}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded print:hidden">
                    ಹಿಂಬದಿ (Back Page - Attendance QR)
                  </span>
                  <div>
                    <OfficialStaffIDCard
                      employee={selectedEmpForCard}
                      showBack={true}
                      showSeal={showSeal}
                      showQrCode={showQrCode}
                      orientation={cardOrientation}
                      customFrontBackground={staffCardSettings.customFrontBackground}
                      customBackBackground={staffCardSettings.customBackBackground}
                      backgroundOpacity={staffCardSettings.backgroundOpacity}
                      customLogo={staffCardSettings.customLogo}
                      customMdSignature={staffCardSettings.customMdSignature}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Printing Tips Footer */}
            <div className="text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                💡 <strong>ಮುದ್ರಣ ಸಲಹೆ:</strong> Standard CR80 PVC ಪ್ಲಾಸ್ಟಿಕ್ ಕಾರ್ಡ್ ಅಥವಾ 300 GSM ಗ್ಲಾಸಿ ಕಾರ್ಡ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಪ್ರಿಂಟ್ ಮಾಡಲು Print ಕ್ಲಿಕ್ ಮಾಡಿ <em>"Save as PDF"</em> ಅಥವಾ ಪ್ರಿಂಟರ್ ಆಯ್ಕೆಮಾಡಿ.
              </div>
              <button
                onClick={handlePrintStaffCard}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
              >
                ಪ್ರಿಂಟ್ ಸೆಟ್ಟಿಂಗ್ಸ್
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Staff ID Card Background & Design Customizer Modal */}
      {showCustomizerModal && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border-2 border-amber-500 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5 animate-fadeIn text-slate-100 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-amber-300">
                  ಸಿಬ್ಬಂದಿ ಗುರುತಿನ ಚೀಟಿ ಹಿನ್ನೆಲೆ & ವಿನ್ಯಾಸ (Staff ID Card Backgrounds & Design)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomizerModal(false)}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              ಇಲ್ಲಿ ಅಪ್ಲೋಡ್ ಮಾಡಿದ ಮುಂಭಾಗ ಹಾಗೂ ಹಿಂಬದಿಯ ಹಿನ್ನೆಲೆ, ಸಹಿ ಮತ್ತು ಲೋಗೋ ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್ ಮೂಲಕ <strong>ಎಲ್ಲಾ ಕಂಪ್ಯೂಟರ್/ಬ್ರೌಸರ್‌ಗಳಲ್ಲಿ ತಕ್ಷಣ ಸಿಂಕ್ ಆಗುತ್ತದೆ.</strong>
            </p>

            {/* Grid of Background Uploads (Dual-Sided: Front & Back) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Front Background */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>🖼️</span> ಮುಂಭಾಗದ ಹಿನ್ನೆಲೆ (Front Background)
                  </span>
                  {staffCardSettings.customFrontBackground && (
                    <button
                      type="button"
                      onClick={() => handleUpdateSettingsField('customFrontBackground', '')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      ತೆಗೆದುಹಾಕಿ (Remove)
                    </button>
                  )}
                </div>
                <div className="h-28 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden relative">
                  {staffCardSettings.customFrontBackground ? (
                    <img
                      src={staffCardSettings.customFrontBackground}
                      alt="Front Background Preview"
                      className="w-full h-full object-cover"
                      style={{ opacity: staffCardSettings.backgroundOpacity !== undefined ? staffCardSettings.backgroundOpacity : 1 }}
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-500 text-[11px]">
                      ಯಾವುದೇ ಕಸ್ಟಮ್ ಹಿನ್ನೆಲೆ ಇಲ್ಲ<br />(No Front Background)
                    </div>
                  )}
                </div>
                <label className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{staffCardSettings.customFrontBackground ? 'ಮುಂಭಾಗದ ಹಿನ್ನೆಲೆ ಬದಲಿಸಿ' : '+ ಮುಂಭಾಗದ ಹಿನ್ನೆಲೆ ಅಪ್ಲೋಡ್'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'customFrontBackground')}
                  />
                </label>
              </div>

              {/* 2. Back Background */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>🖼️</span> ಹಿಂಬದಿಯ ಹಿನ್ನೆಲೆ (Back Background)
                  </span>
                  {staffCardSettings.customBackBackground && (
                    <button
                      type="button"
                      onClick={() => handleUpdateSettingsField('customBackBackground', '')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      ತೆಗೆದುಹಾಕಿ (Remove)
                    </button>
                  )}
                </div>
                <div className="h-28 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden relative">
                  {staffCardSettings.customBackBackground ? (
                    <img
                      src={staffCardSettings.customBackBackground}
                      alt="Back Background Preview"
                      className="w-full h-full object-cover"
                      style={{ opacity: staffCardSettings.backgroundOpacity !== undefined ? staffCardSettings.backgroundOpacity : 1 }}
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-500 text-[11px]">
                      ಯಾವುದೇ ಕಸ್ಟಮ್ ಹಿನ್ನೆಲೆ ಇಲ್ಲ<br />(No Back Background)
                    </div>
                  )}
                </div>
                <label className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{staffCardSettings.customBackBackground ? 'ಹಿಂಬದಿಯ ಹಿನ್ನೆಲೆ ಬದಲಿಸಿ' : '+ ಹಿಂಬದಿಯ ಹಿನ್ನೆಲೆ ಅಪ್ಲೋಡ್'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'customBackBackground')}
                  />
                </label>
              </div>
            </div>

            {/* 3. Background Opacity Slider */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>ಹಿನ್ನೆಲೆ ಅಪಾರದರ್ಶಕತೆ (Background Opacity)</span>
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {Math.round((staffCardSettings.backgroundOpacity !== undefined ? staffCardSettings.backgroundOpacity : 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={staffCardSettings.backgroundOpacity !== undefined ? staffCardSettings.backgroundOpacity : 1}
                onChange={(e) => handleUpdateSettingsField('backgroundOpacity', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>ಮಂದವಾದ ಹಿನ್ನೆಲೆ (10% - Light)</span>
                <span>ಪೂರ್ಣ ಬಣ್ಣ (100% - Solid)</span>
              </div>
            </div>

            {/* 4. Managing Director Signature & Logo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MD Signature */}
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    ✍️ ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರ ಸಹಿ (MD Signature)
                  </span>
                  {staffCardSettings.customMdSignature && (
                    <button
                      type="button"
                      onClick={() => handleUpdateSettingsField('customMdSignature', '')}
                      className="text-[10px] text-rose-400 underline cursor-pointer"
                    >
                      ಮರುಹೊಂದಿಸಿ
                    </button>
                  )}
                </div>
                <div className="h-12 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-700">
                  <img
                    src={staffCardSettings.customMdSignature || './id_assets/md_signature_transparent.png'}
                    alt="MD Signature"
                    className="h-10 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <label className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>ಹೊಸ ಸಹಿ ಅಪ್ಲೋಡ್ ಮಾಡಿ</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMdSignatureUpload}
                  />
                </label>
              </div>

              {/* Factory Logo */}
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    🏢 ಕಾರ್ಖಾನೆಯ ಲೋಗೋ (Factory Logo)
                  </span>
                  {staffCardSettings.customLogo && (
                    <button
                      type="button"
                      onClick={() => handleUpdateSettingsField('customLogo', '')}
                      className="text-[10px] text-rose-400 underline cursor-pointer"
                    >
                      ಮರುಹೊಂದಿಸಿ
                    </button>
                  )}
                </div>
                <div className="h-12 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-700">
                  <img
                    src={staffCardSettings.customLogo || './id_assets/bssk_logo.png'}
                    alt="Factory Logo"
                    className="h-10 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <label className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>ಹೊಸ ಲೋಗೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetAllSettings}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ಮರುಹೊಂದಿಸಿ (Reset to Default)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndCloseCustomizer}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ಕ್ಲೌಡ್‌ನಲ್ಲಿ ಉಳಿಸಿ (Save & Sync to Cloud DB)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Dedicated Standalone Print Portal for Staff ID Cards (window.print()) */}
      {typeof document !== 'undefined' && createPortal(
        <div className="staff-id-card-print-portal">
          <style>{`
            @page {
              size: ${printLayout === 'a4' ? 'A4 portrait' : (cardOrientation === 'portrait' ? '54mm 85.6mm' : '85.6mm 54mm')};
              margin: ${printLayout === 'a4' ? '12mm 10mm' : '0mm'};
            }
            @media print {
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body.staff-id-card-printing > #root {
                display: none !important;
                visibility: hidden !important;
              }
              .staff-id-card-print-portal {
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
                background: #ffffff !important;
                color: #000000 !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .staff-print-hide {
                display: none !important;
              }
              .id-card-print-single {
                width: ${cardOrientation === 'portrait' ? '54mm' : '85.6mm'} !important;
                height: ${cardOrientation === 'portrait' ? '85.6mm' : '54mm'} !important;
                max-width: ${cardOrientation === 'portrait' ? '54mm' : '85.6mm'} !important;
                max-height: ${cardOrientation === 'portrait' ? '85.6mm' : '54mm'} !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                position: relative !important;
                display: block !important;
                vertical-align: top !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              .id-card-print-single .id-card-container-outer {
                width: ${cardOrientation === 'portrait' ? '238px' : '372px'} !important;
                height: ${cardOrientation === 'portrait' ? '372px' : '238px'} !important;
                min-width: ${cardOrientation === 'portrait' ? '238px' : '372px'} !important;
                min-height: ${cardOrientation === 'portrait' ? '372px' : '238px'} !important;
                transform: scale(${cardOrientation === 'portrait' ? '0.857540, 0.869698' : '0.869698, 0.857540'}) !important;
                transform-origin: 0 0 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .id-card-a4-member-pair {
                display: flex !important;
                flex-direction: row !important;
                gap: 0 !important;
                margin: 0 auto !important;
                padding: 0 !important;
                justify-content: center !important;
                align-items: center !important;
                border: 1.5px dashed #334155 !important;
                border-radius: 12px !important;
                width: ${cardOrientation === 'portrait' ? '108mm' : '171.2mm'} !important;
                height: ${cardOrientation === 'portrait' ? '85.6mm' : '54mm'} !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                background: #ffffff !important;
                position: relative !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .id-card-center-fold-line {
                width: 0px !important;
                min-width: 0px !important;
                max-width: 0px !important;
                align-self: stretch !important;
                height: 100% !important;
                border-left: 1.5px dashed #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
                position: relative !important;
                z-index: 25 !important;
              }
              .id-card-guide-top,
              .id-card-guide-bottom {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                width: ${cardOrientation === 'portrait' ? '108mm' : '171.2mm'} !important;
                font-size: 8px !important;
                font-weight: 700 !important;
                color: #334155 !important;
                line-height: 1.4 !important;
                padding: 4px 1mm !important;
                user-select: none !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                margin: 0 auto !important;
              }
              .id-card-guide-cut-text {
                display: inline-flex !important;
                align-items: center !important;
                gap: 3px !important;
                color: #334155 !important;
                font-size: 7.5px !important;
              }
              .id-card-guide-fold-marker {
                font-weight: 800 !important;
                color: #0f172a !important;
                font-size: 8px !important;
                letter-spacing: 0.3px !important;
                text-align: center !important;
              }
              .page-break-after-avoid {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
            @media screen {
              .staff-id-card-print-portal {
                display: none !important;
              }
            }
          `}</style>

          {selectedEmpForCard && (
            <div className="w-full">
              {printLayout === 'a4' ? (
                /* A4 Printable Sheet with Attached Pair for Easy Folding */
                <div className="w-full max-w-[200mm] mx-auto pt-8 pb-4 flex flex-col items-center">
                  {cardSide === 'both' ? (
                    <div className="flex flex-col items-center">
                      {/* Top Scissor Cut & Fold Header Guide */}
                      <div className="id-card-guide-top">
                        <span className="id-card-guide-cut-text">✂ ಕತ್ತರಿಸುವ ಗೆರೆ (Cut outer line)</span>
                        <span className="id-card-guide-fold-marker">▼ ಮಧ್ಯದಲ್ಲಿ ಮಡಚುವ ಗೆರೆ (Fold Line) ▼</span>
                        <span className="id-card-guide-cut-text">✂ Cut</span>
                      </div>

                      {/* Attached Pair with 0 Gap touching at center fold line */}
                      <div className="id-card-a4-member-pair">
                        <div className="id-card-print-single">
                          <OfficialStaffIDCard
                            employee={selectedEmpForCard}
                            showBack={false}
                            showSeal={showSeal}
                            showQrCode={showQrCode}
                            orientation={cardOrientation}
                            customFrontBackground={staffCardSettings.customFrontBackground}
                            customBackBackground={staffCardSettings.customBackBackground}
                            backgroundOpacity={staffCardSettings.backgroundOpacity}
                            customLogo={staffCardSettings.customLogo}
                            customMdSignature={staffCardSettings.customMdSignature}
                          />
                        </div>

                        {/* Center Fold Line */}
                        <div className="id-card-center-fold-line" title="ಮಡಚುವ ಗೆರೆ (Fold Line)"></div>

                        <div className="id-card-print-single">
                          <OfficialStaffIDCard
                            employee={selectedEmpForCard}
                            showBack={true}
                            showSeal={showSeal}
                            showQrCode={showQrCode}
                            orientation={cardOrientation}
                            customFrontBackground={staffCardSettings.customFrontBackground}
                            customBackBackground={staffCardSettings.customBackBackground}
                            backgroundOpacity={staffCardSettings.backgroundOpacity}
                            customLogo={staffCardSettings.customLogo}
                            customMdSignature={staffCardSettings.customMdSignature}
                          />
                        </div>
                      </div>

                      {/* Bottom Scissor Cut & Fold Footer Guide */}
                      <div className="id-card-guide-bottom">
                        <span className="id-card-guide-cut-text">✂ ಹೊರಗಿನ ಗೆರೆಯಲ್ಲಿ ಕತ್ತರಿಸಿ (Cut outer)</span>
                        <span className="id-card-guide-fold-marker">▲ ಮಧ್ಯದ ಗೆರೆಯಲ್ಲಿ ಮಡಚಿ (Fold Line) ▲</span>
                        <span className="id-card-guide-cut-text">#{selectedEmpForCard.employee_id} - {selectedEmpForCard.name}</span>
                      </div>
                    </div>
                  ) : cardSide === 'front' ? (
                    <div className="flex flex-col items-center">
                      <div className="id-card-guide-top" style={{ width: cardOrientation === 'portrait' ? '54mm' : '85.6mm' }}>
                        <span className="id-card-guide-cut-text">✂ ಕತ್ತರಿಸುವ ಗೆರೆ (Cut outer line)</span>
                        <span className="id-card-guide-cut-text">✂ Cut</span>
                      </div>
                      <div
                        className="id-card-print-single"
                        style={{
                          border: '1.5px dashed #334155',
                          borderRadius: '12px',
                          width: cardOrientation === 'portrait' ? '54mm' : '85.6mm',
                          height: cardOrientation === 'portrait' ? '85.6mm' : '54mm',
                          boxSizing: 'border-box'
                        }}
                      >
                        <OfficialStaffIDCard
                          employee={selectedEmpForCard}
                          showBack={false}
                          showSeal={showSeal}
                          showQrCode={showQrCode}
                          orientation={cardOrientation}
                          customFrontBackground={staffCardSettings.customFrontBackground}
                          customBackBackground={staffCardSettings.customBackBackground}
                          backgroundOpacity={staffCardSettings.backgroundOpacity}
                          customLogo={staffCardSettings.customLogo}
                          customMdSignature={staffCardSettings.customMdSignature}
                        />
                      </div>
                      <div className="id-card-guide-bottom" style={{ width: cardOrientation === 'portrait' ? '54mm' : '85.6mm' }}>
                        <span className="id-card-guide-cut-text">✂ ಕತ್ತರಿಸಿ (Cut)</span>
                        <span className="id-card-guide-cut-text">#{selectedEmpForCard.employee_id} - {selectedEmpForCard.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="id-card-guide-top" style={{ width: cardOrientation === 'portrait' ? '54mm' : '85.6mm' }}>
                        <span className="id-card-guide-cut-text">✂ ಕತ್ತರಿಸುವ ಗೆರೆ (Cut outer line)</span>
                        <span className="id-card-guide-cut-text">✂ Cut</span>
                      </div>
                      <div
                        className="id-card-print-single"
                        style={{
                          border: '1.5px dashed #334155',
                          borderRadius: '12px',
                          width: cardOrientation === 'portrait' ? '54mm' : '85.6mm',
                          height: cardOrientation === 'portrait' ? '85.6mm' : '54mm',
                          boxSizing: 'border-box'
                        }}
                      >
                        <OfficialStaffIDCard
                          employee={selectedEmpForCard}
                          showBack={true}
                          showSeal={showSeal}
                          showQrCode={showQrCode}
                          orientation={cardOrientation}
                          customFrontBackground={staffCardSettings.customFrontBackground}
                          customBackBackground={staffCardSettings.customBackBackground}
                          backgroundOpacity={staffCardSettings.backgroundOpacity}
                          customLogo={staffCardSettings.customLogo}
                          customMdSignature={staffCardSettings.customMdSignature}
                        />
                      </div>
                      <div className="id-card-guide-bottom" style={{ width: cardOrientation === 'portrait' ? '54mm' : '85.6mm' }}>
                        <span className="id-card-guide-cut-text">✂ ಕತ್ತರಿಸಿ (Cut)</span>
                        <span className="id-card-guide-cut-text">#{selectedEmpForCard.employee_id} - {selectedEmpForCard.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard CR80 PVC Plastic Card Print */
                <div className="flex flex-wrap items-center justify-center gap-6 p-2 min-h-screen">
                  {cardSide === 'both' ? (
                    <>
                      <div className="page-break-after-avoid id-card-print-single">
                        <OfficialStaffIDCard
                          employee={selectedEmpForCard}
                          showBack={false}
                          showSeal={showSeal}
                          showQrCode={showQrCode}
                          orientation={cardOrientation}
                          customFrontBackground={staffCardSettings.customFrontBackground}
                          customBackBackground={staffCardSettings.customBackBackground}
                          backgroundOpacity={staffCardSettings.backgroundOpacity}
                          customLogo={staffCardSettings.customLogo}
                          customMdSignature={staffCardSettings.customMdSignature}
                        />
                      </div>
                      <div className="page-break-after-avoid id-card-print-single">
                        <OfficialStaffIDCard
                          employee={selectedEmpForCard}
                          showBack={true}
                          showSeal={showSeal}
                          showQrCode={showQrCode}
                          orientation={cardOrientation}
                          customFrontBackground={staffCardSettings.customFrontBackground}
                          customBackBackground={staffCardSettings.customBackBackground}
                          backgroundOpacity={staffCardSettings.backgroundOpacity}
                          customLogo={staffCardSettings.customLogo}
                          customMdSignature={staffCardSettings.customMdSignature}
                        />
                      </div>
                    </>
                  ) : cardSide === 'front' ? (
                    <div className="id-card-print-single">
                      <OfficialStaffIDCard
                        employee={selectedEmpForCard}
                        showBack={false}
                        showSeal={showSeal}
                        showQrCode={showQrCode}
                        orientation={cardOrientation}
                        customFrontBackground={staffCardSettings.customFrontBackground}
                        customBackBackground={staffCardSettings.customBackBackground}
                        backgroundOpacity={staffCardSettings.backgroundOpacity}
                        customLogo={staffCardSettings.customLogo}
                        customMdSignature={staffCardSettings.customMdSignature}
                      />
                    </div>
                  ) : (
                    <div className="id-card-print-single">
                      <OfficialStaffIDCard
                        employee={selectedEmpForCard}
                        showBack={true}
                        showSeal={showSeal}
                        showQrCode={showQrCode}
                        orientation={cardOrientation}
                        customFrontBackground={staffCardSettings.customFrontBackground}
                        customBackBackground={staffCardSettings.customBackBackground}
                        backgroundOpacity={staffCardSettings.backgroundOpacity}
                        customLogo={staffCardSettings.customLogo}
                        customMdSignature={staffCardSettings.customMdSignature}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
