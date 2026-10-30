import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import OfficialStaffIDCard from '../IDCards/OfficialStaffIDCard';
import {
  Briefcase, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, X, Save,
  Printer, QrCode, User, Phone, Heart, Award, Shield, FileSpreadsheet,
  Camera, Upload, Eye, SlidersHorizontal, RefreshCw, Check, Sparkles, AlertTriangle
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
  const [printLayout, setPrintLayout] = useState('single'); // 'single', '4perPage', '8perPage'
  const [showSeal, setShowSeal] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);

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
    photo_url: '',
    signature_url: '',
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialForm);

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
      epf_uan_no: ''
    });
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      ...initialForm,
      ...emp
    });
    setShowAddEditModal(true);
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
                <th className="py-3 px-4">ಹುದ್ದೆ & ವಿಭಾಗ (Role & Dept)</th>
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
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    ಸಿಬ್ಬಂದಿ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
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

                {/* QR Toggle */}
                <button
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={`px-2.5 py-1 text-xs rounded-xl border transition-colors cursor-pointer ${
                    showQrCode ? 'bg-emerald-950 border-emerald-600 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  ಹಾಜರಾತಿ QR: {showQrCode ? 'ON' : 'OFF'}
                </button>

                {/* Print Button */}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>ಪ್ರಿಂಟ್ ಮಾಡಿ (Print)</span>
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
                <>
                  {/* Front Side */}
                  <div className="space-y-1.5 text-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded print:hidden">
                      ಮುಂಭಾಗ (Front Page)
                    </span>
                    <div>
                      <OfficialStaffIDCard employee={selectedEmpForCard} showBack={false} showSeal={showSeal} showQrCode={showQrCode} orientation={cardOrientation} />
                    </div>
                  </div>

                  {/* Back Side with Ultra-large 96px QR Code */}
                  <div className="space-y-1.5 text-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded print:hidden">
                      ಹಿಂಬದಿ (Back Page - Attendance QR)
                    </span>
                    <div>
                      <OfficialStaffIDCard employee={selectedEmpForCard} showBack={true} showSeal={showSeal} showQrCode={showQrCode} orientation={cardOrientation} />
                    </div>
                  </div>
                </>
              ) : cardSide === 'front' ? (
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded print:hidden">
                    ಮುಂಭಾಗ (Front Page)
                  </span>
                  <div>
                    <OfficialStaffIDCard employee={selectedEmpForCard} showBack={false} showSeal={showSeal} showQrCode={showQrCode} orientation={cardOrientation} />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded print:hidden">
                    ಹಿಂಬದಿ (Back Page - Attendance QR)
                  </span>
                  <div>
                    <OfficialStaffIDCard employee={selectedEmpForCard} showBack={true} showSeal={showSeal} showQrCode={showQrCode} orientation={cardOrientation} />
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
                onClick={() => window.print()}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
              >
                ಪ್ರಿಂಟ್ ಸೆಟ್ಟಿಂಗ್ಸ್
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
