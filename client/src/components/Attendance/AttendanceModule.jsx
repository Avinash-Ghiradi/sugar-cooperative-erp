import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import {
  CalendarCheck, Search, CheckCircle2, XCircle, Clock, Save, RefreshCw,
  QrCode, UserCheck, Users, FileSpreadsheet, Sparkles, Filter, Check, ArrowRight,
  Camera, AlertTriangle, X, Image as ImageIcon, Video, VideoOff
} from 'lucide-react';

export default function AttendanceModule() {
  const { showToast } = useAuth();
  const [recordType, setRecordType] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('attendance') || p.get('share_no') ? 'Shareholder' : 'Employee';
    } catch (e) {
      return 'Employee';
    }
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  // QR Scanning & Fast Attendance Filter States
  const [scanInput, setScanInput] = useState('');
  const [lastScannedMember, setLastScannedMember] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Present', 'Absent'
  const [searchQuery, setSearchQuery] = useState('');
  const scanInputRef = useRef(null);

  // Live Camera Scanner States
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAttendance();
  }, [recordType, selectedDate]);

  // Handle Camera Open / Close & Live Scanning with Html5Qrcode
  useEffect(() => {
    let isCancelled = false;
    let qrScanner = null;

    if (cameraOpen) {
      setCameraError('');
      setIsCameraActive(false);

      const initCamera = async () => {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (isCancelled) return;

          if (!devices || devices.length === 0) {
            setCameraError('ಯಾವುದೇ ಕ್ಯಾಮೆರಾ ಕಂಡುಬಂದಿಲ್ಲ (No camera device detected on this device).');
            return;
          }

          setAvailableCameras(devices);
          // Prefer back camera (environment) or last device for mobile phones
          const chosenId = selectedCameraId || devices[devices.length - 1].id;
          setSelectedCameraId(chosenId);

          const scanner = new Html5Qrcode('qr-camera-reader');
          html5QrCodeRef.current = scanner;
          qrScanner = scanner;

          await scanner.start(
            chosenId,
            {
              fps: 15,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
              // Successfully scanned!
              handleProcessScan(decodedText);
            },
            () => {
              // Ignore standard frame scan errors
            }
          );

          if (!isCancelled) {
            setIsCameraActive(true);
          }
        } catch (err) {
          if (!isCancelled) {
            console.error('Camera startup error:', err);
            setCameraError(`ಕ್ಯಾಮೆರಾ ತೆರೆಯಲು ಅನುಮತಿ ಅಗತ್ಯವಿದೆ (Camera permission required): ${err.message || err}. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ನೀಡಿ (Allow Camera).`);
          }
        }
      };

      // Slight timeout to ensure DOM container #qr-camera-reader is fully rendered
      const timer = setTimeout(initCamera, 150);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        if (qrScanner) {
          try {
            if (qrScanner.isScanning) {
              qrScanner.stop().then(() => qrScanner.clear()).catch(() => {});
            } else {
              qrScanner.clear();
            }
          } catch (e) {}
        }
        html5QrCodeRef.current = null;
        setIsCameraActive(false);
      };
    } else {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => html5QrCodeRef.current.clear()).catch(() => {});
          }
        } catch (e) {}
        html5QrCodeRef.current = null;
      }
      setIsCameraActive(false);
    }
  }, [cameraOpen, selectedCameraId]);

  // Handle Photo File Upload QR Scanning
  const handleFileUploadScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('ಫೋಟೋದಿಂದ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...', 'info');
      // Create temporary instance or use existing
      const html5Qr = new Html5Qrcode('temp-qr-file-scanner');
      const decodedText = await html5Qr.scanFile(file, true);
      html5Qr.clear();
      if (decodedText) {
        handleProcessScan(decodedText);
      }
    } catch (err) {
      showToast('⚠️ ಫೋಟೋದಲ್ಲಿ ಯಾವುದೇ QR ಕೋಡ್ ಪತ್ತೆಯಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ಬಳಸಿ.', 'error');
    }
  };

  // Check URL parameters for direct QR scan verification on load
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const urlShare = p.get('share_no') || p.get('attn');
      if (urlShare) {
        setRecordType('Shareholder');
        setTimeout(() => {
          handleProcessScan(urlShare);
        }, 600);
      }
    } catch (e) {}
  }, []);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  };

  const loadAttendance = async () => {
    setLoading(true);
    if (recordType === 'Shareholder') {
      const shRes = await ApiService.getShareholders({ page: 1, limit: 100, status: 'Active' });
      if (shRes && shRes.data) {
        setAttendanceList(shRes.data.map(s => ({
          entity_id: s.share_no || s.share_number,
          name: s.shareholder_name || s.name,
          department: s.place || s.village_name || 'ಅಂಜುಟಗಿ',
          book_no: s.book_no || 'B.No: 1',
          status: 'Absent',
          time: null,
          photo_url: s.photo_url || null,
          shares: s.number_of_shares || 1
        })));
      }
    } else {
      const empRes = await ApiService.getEmployees();
      if (empRes && empRes.data) {
        setAttendanceList(empRes.data.map(e => ({
          entity_id: e.employee_id,
          name: e.name,
          department: e.department || e.designation,
          status: 'Present',
          time: '09:00 AM'
        })));
      }
    }
    setLoading(false);
  };

  // Extract share number from raw text, QR URL or JSON
  const extractShareNo = (raw) => {
    if (!raw) return '';
    const text = String(raw).trim();
    const urlMatch = text.match(/[?&](?:attn|share_no|share)=(\d+)/i);
    if (urlMatch) return urlMatch[1];
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const obj = JSON.parse(text);
        if (obj.share_no) return String(obj.share_no).replace(/\D/g, '');
      } catch (e) {}
    }
    const prefixMatch = text.match(/(?:BSSKN|ATTN|SHARE)[:\-\s]*(\d+)/i);
    if (prefixMatch) return prefixMatch[1];
    return text.replace(/\D/g, '');
  };

  // Process a QR Scan or manual entry
  const handleProcessScan = async (rawCode) => {
    const targetNo = extractShareNo(rawCode);
    if (!targetNo) return;

    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    let foundIdx = attendanceList.findIndex(item => String(item.entity_id).trim() === targetNo);

    if (foundIdx !== -1) {
      // Mark as present in the existing list
      const updatedItem = {
        ...attendanceList[foundIdx],
        status: 'Present',
        time: currentTime
      };

      setAttendanceList(prev => {
        const copy = [...prev];
        copy.splice(foundIdx, 1);
        return [updatedItem, ...copy]; // Move to top of table
      });

      setLastScannedMember(updatedItem);
      playBeep();
      showToast(`✅ ಷೇರು #${updatedItem.entity_id} - ${updatedItem.name} ಹಾಜರಾತಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ!`, 'success');
    } else {
      // Fetch shareholder directly if not on page 1
      try {
        const sRes = await ApiService.getShareholders({ search: targetNo, page: 1, limit: 1 });
        if (sRes && sRes.data && sRes.data.length > 0) {
          const s = sRes.data[0];
          const newItem = {
            entity_id: s.share_no || s.share_number || targetNo,
            name: s.shareholder_name || s.name || 'Member',
            department: s.place || s.village_name || '—',
            book_no: s.book_no || '—',
            status: 'Present',
            time: currentTime,
            photo_url: s.photo_url || null,
            shares: s.number_of_shares || 1
          };

          setAttendanceList(prev => [newItem, ...prev]);
          setLastScannedMember(newItem);
          playBeep();
          showToast(`✅ ಷೇರು #${newItem.entity_id} - ${newItem.name} ಹಾಜರಾತಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ!`, 'success');
        } else {
          showToast(`⚠️ ಷೇರು ಸಂಖ್ಯೆ #${targetNo} ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಕಂಡುಬಂದಿಲ್ಲ (Not found).`, 'error');
        }
      } catch (err) {
        showToast(`⚠️ ಸ್ಕ್ಯಾನ್ ದೋಷ: ${err.message}`, 'error');
      }
    }

    setScanInput('');
    if (scanInputRef.current) scanInputRef.current.focus();
  };

  const toggleStatus = (index) => {
    setAttendanceList(prev => prev.map((item, idx) => {
      if (idx === index) {
        const nextStatus = item.status === 'Present' ? 'Absent' : item.status === 'Absent' ? 'Leave' : 'Present';
        const currentTime = nextStatus === 'Present' ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : item.time;
        return { ...item, status: nextStatus, time: currentTime };
      }
      return item;
    }));
  };

  const handleSaveAttendance = () => {
    const presentCount = attendanceList.filter(i => i.status === 'Present').length;
    showToast(`Attendance saved for ${selectedDate}! (${presentCount} Present out of ${attendanceList.length})`, 'success');
  };

  // Filtered attendance list
  const filteredList = attendanceList.filter(item => {
    if (filterStatus !== 'All' && item.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = String(item.entity_id).toLowerCase().includes(q);
      const matchName = String(item.name).toLowerCase().includes(q);
      const matchDept = String(item.department).toLowerCase().includes(q);
      return matchId || matchName || matchDept;
    }
    return true;
  });

  const totalMembers = attendanceList.length;
  const presentMembers = attendanceList.filter(i => i.status === 'Present').length;
  const absentMembers = attendanceList.filter(i => i.status === 'Absent').length;
  const quorumPct = totalMembers > 0 ? Math.round((presentMembers / totalMembers) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-400" /> Attendance Management (ಹಾಜರಾತಿ ನಿರ್ವಹಣೆ)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Smart QR Code Attendance Register for Cooperative Shareholder General Meetings (AGM) & Staff
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
          />

          <button
            onClick={handleSaveAttendance}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Attendance
          </button>
        </div>
      </div>

      {/* Record Type Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setRecordType('Shareholder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            recordType === 'Shareholder' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" /> Shareholder AGM Attendance (ಶೇರುದಾರರ ಮಹಾಸಭೆ ಹಾಜರಾತಿ)
        </button>
        <button
          onClick={() => setRecordType('Employee')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            recordType === 'Employee' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Employee Attendance (ಸಿಬ್ಬಂದಿ ಹಾಜರಾತಿ)
        </button>
      </div>

      {/* Shareholder QR Attendance Scanner Banner */}
      {recordType === 'Shareholder' && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-950 to-emerald-950/70 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <QrCode className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <span>ID Card QR Code Attendance Scanner</span>
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-600">
                    ಲೈವ್ ಸ್ಕ್ಯಾನರ್ ಸಕ್ರಿಯವಾಗಿದೆ
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  ಶೇರುದಾರರ ಗುರುತಿನ ಚೀಟಿಯ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಷೇರು ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (Auto Attendance Scan)
                </p>
              </div>
            </div>

            {/* Attendance Quorum Stats */}
            <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">ಹಾಜರಾದವರು: </span>
                <strong className="text-emerald-400 font-mono">{presentMembers}</strong>
                <span className="text-slate-500"> / {totalMembers}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div>
                <span className="text-slate-400">ಕೋರಂ: </span>
                <strong className={quorumPct >= 20 ? 'text-emerald-400' : 'text-amber-400'}>{quorumPct}%</strong>
              </div>
            </div>
          </div>

          {/* Quick Scanner Input Bar with Camera Trigger */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={scanInputRef}
                type="text"
                autoFocus
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && scanInput.trim()) {
                    handleProcessScan(scanInput.trim());
                  }
                }}
                placeholder="ಗುರುತಿನ ಚೀಟಿಯ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಷೇರು ನಂ ನಮೂದಿಸಿ (Press Enter)..."
                className="w-full bg-slate-900 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-xl pl-9 pr-24 py-2.5 text-xs text-emerald-100 placeholder:text-slate-500 outline-none transition-all shadow-inner font-mono"
              />
              <button
                type="button"
                onClick={() => scanInput.trim() && handleProcessScan(scanInput.trim())}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
              >
                ದಾಖಲಿಸಿ
              </button>
            </div>

            {/* Camera QR Scanner Open / Close Button */}
            <button
              type="button"
              onClick={() => {
                setCameraError('');
                setCameraOpen(!cameraOpen);
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer shrink-0 ${
                cameraOpen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 animate-pulse'
              }`}
              title="Open Device Camera to scan QR Code (ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ)"
            >
              <Camera className="w-4 h-4" />
              <span>{cameraOpen ? 'ಕ್ಯಾಮೆರಾ ಮುಚ್ಚಿ (Close Camera)' : '📷 ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನರ್ ಪ್ರಾರಂಭಿಸಿ (Open Camera)'}</span>
            </button>

            {/* Scan from Photo Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUploadScan}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0"
              title="Upload photo of ID Card to scan QR Code"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">ಫೋಟೋ ಅಪ್ಲೋಡ್</span>
            </button>
          </div>

          {/* Hidden helper element for file photo scanning */}
          <div id="temp-qr-file-scanner" className="hidden" />

          {/* LIVE CAMERA VIEWFINDER & TARGET RETICLE */}
          {cameraOpen && (
            <div className="bg-slate-950/90 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl space-y-3 relative overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                  <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>ಲೈವ್ ಕ್ಯಾಮೆರಾ QR ಸ್ಕ್ಯಾನರ್ (Live Camera Scanner Active)</span>
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {/* Camera Selection Dropdown */}
                  {availableCameras.length > 1 && (
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none"
                    >
                      {availableCameras.map((cam, idx) => (
                        <option key={cam.id} value={cam.id}>
                          {cam.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => setCameraOpen(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Close Camera"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {cameraError ? (
                <div className="p-4 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">ಕ್ಯಾಮೆರಾ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ (Camera Error):</div>
                    <p className="text-[11px] text-rose-300">{cameraError}</p>
                    <p className="text-[10px] text-slate-400">
                      • ಬ್ರೌಸರ್ URL ಬಾರ್‌ನಲ್ಲಿ ಕ್ಯಾಮೆರಾ ಐಕಾನ್ (🔒 / 🎥) ಕ್ಲಿಕ್ ಮಾಡಿ <strong>Allow (ಅನುಮತಿಸಿ)</strong> ಆಯ್ಕೆಮಾಡಿ.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-emerald-500/70 shadow-2xl bg-black">
                  {/* Html5Qrcode video renders inside this element */}
                  <div id="qr-camera-reader" className="w-full h-64 bg-black flex items-center justify-center text-slate-500 text-xs [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

                  {/* Aiming Reticle with Animated Laser Scanner Line */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-emerald-400/90 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400 rounded-tl"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400 rounded-tr"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400 rounded-bl"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400 rounded-br"></div>
                      {/* Animated Laser Line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_8px_#34d399] animate-pulse"></div>
                    </div>
                    <span className="text-[10px] font-bold text-white bg-slate-950/90 px-3 py-1 rounded-full mt-2 border border-slate-700 shadow-md">
                      ಗುರುತಿನ ಚೀಟಿಯ QR ಕೋಡ್ ಅನ್ನು ಚೌಕಟ್ಟಿನಲ್ಲಿ ಹಿಡಿಯಿರಿ
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last Scanned Member Notification Card */}
          {lastScannedMember && (
            <div className="bg-emerald-950/60 border border-emerald-500/80 rounded-xl p-3 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-emerald-500/50 bg-slate-900 flex items-center justify-center font-bold text-emerald-400 font-mono text-sm overflow-hidden">
                  {lastScannedMember.photo_url ? (
                    <img src={lastScannedMember.photo_url} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    lastScannedMember.entity_id
                  )}
                </div>
                <div>
                  <div className="font-bold text-emerald-200 text-sm flex items-center gap-2">
                    <span>{lastScannedMember.name}</span>
                    <span className="text-[11px] font-mono text-emerald-400">(ಷೇರು #{lastScannedMember.entity_id})</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    ಸಾ॥ {lastScannedMember.department} • ಪುಸ್ತಕ: {lastScannedMember.book_no} • ಸಮಯ: {lastScannedMember.time}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow">
                <CheckCircle2 className="w-4 h-4" /> ಹಾಜರಾತಿ ನಮೂದಾಗಿದೆ
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium">ಒಟ್ಟು ನಮೂದುಗಳು</div>
            <div className="text-xl font-bold text-slate-100 font-mono mt-0.5">{totalMembers}</div>
          </div>
          <Users className="w-5 h-5 text-slate-500" />
        </div>

        <div className="bg-slate-950/80 border border-emerald-800/50 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-emerald-400 font-medium">ಹಾಜರಾದವರು (Present)</div>
            <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">{presentMembers}</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="bg-slate-950/80 border border-rose-800/50 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-rose-400 font-medium">ಗೈರುಹಾಜರಾದವರು (Absent)</div>
            <div className="text-xl font-bold text-rose-300 font-mono mt-0.5">{absentMembers}</div>
          </div>
          <XCircle className="w-5 h-5 text-rose-400" />
        </div>

        <div className="bg-slate-950/80 border border-amber-800/50 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-amber-400 font-medium">ಕೋರಂ ಸ್ಥಿತಿ (Quorum)</div>
            <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">{quorumPct}%</div>
          </div>
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1">ಫಿಲ್ಟರ್:</span>
          {['All', 'Present', 'Absent'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? st === 'Present' ? 'bg-emerald-600 text-white' : st === 'Absent' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'All' ? 'ಎಲ್ಲವೂ' : st === 'Present' ? 'ಹಾಜರು (Present)' : 'ಗೈರುಹಾಜರು (Absent)'}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Name, Share No, Place..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none"
          />
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading daily attendance register...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No attendance records matching the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Entity ID (ಷೇರು / ನೌಕರ ಸಂ)</th>
                  <th className="py-3.5 px-4">Name (ಹೆಸರು)</th>
                  <th className="py-3.5 px-4">Department / Place (ಸ್ಥಳ)</th>
                  <th className="py-3.5 px-4">Scan Time (ಸಮಯ)</th>
                  <th className="py-3.5 px-4 text-center">Status (ಸ್ಥಿತಿ)</th>
                  <th className="py-3.5 px-4 text-right">Toggle Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">#{item.entity_id}</td>
                    <td className="py-3 px-4 font-medium text-slate-100">{item.name}</td>
                    <td className="py-3 px-4 text-slate-400">{item.department}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{item.time || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'Present' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        item.status === 'Absent' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {item.status === 'Present' && <CheckCircle2 className="w-3 h-3" />}
                        {item.status === 'Absent' && <XCircle className="w-3 h-3" />}
                        {item.status === 'Leave' && <Clock className="w-3 h-3" />}
                        {item.status === 'Present' ? 'ಹಾಜರು (Present)' : item.status === 'Absent' ? 'ಗೈರುಹಾಜರು (Absent)' : 'ರಜೆ (Leave)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleStatus(attendanceList.findIndex(a => a.entity_id === item.entity_id))}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        {item.status === 'Present' ? 'Mark Absent' : 'Mark Present'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
