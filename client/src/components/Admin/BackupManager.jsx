import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { CloudDbService } from '../../services/cloudDb';
import {
  Database, Download, Upload, RefreshCw, ShieldCheck, Cloud,
  CheckCircle2, AlertTriangle, Key, Globe, Copy, Check, ArrowUpRight,
  Server, Cpu, Layers
} from 'lucide-react';

export default function BackupManager() {
  const { showToast } = useAuth();
  const fileInputRef = useRef(null);

  // Stats
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cloud DB Config state
  const [cloudConfig, setCloudConfig] = useState(CloudDbService.getConfig());
  const [testingConn, setTestingConn] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Cloud Migration state
  const [uploadingToCloud, setUploadingToCloud] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Local backups list
  const [backups, setBackups] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sugar_erp_local_snapshots') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      const records = await ApiService.getAllShareholdersRaw();
      setTotalRecords(Array.isArray(records) ? records.length : 0);
    } catch (e) {
      setTotalRecords(0);
    }
  };

  // 1. Export Complete Live Database Snapshot (.json)
  const handleExportSnapshot = async () => {
    setLoading(true);
    try {
      const records = await ApiService.getAllShareholdersRaw();
      const payload = {
        metadata: {
          organization: 'Shree Bheemashankar Sahakari Sakkare Karkhane Niyamit, Maragur',
          system: 'BSSKN Cooperative ERP',
          exportTimestamp: new Date().toISOString(),
          recordCount: records.length,
          version: '3.0'
        },
        shareholders: records
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      const fileName = `BSSKN_Live_Database_${records.length}_Shareholders_${new Date().toISOString().slice(0, 10)}.json`;
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', fileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Record in local snapshots list
      const newSnapshot = {
        id: Date.now(),
        name: fileName,
        size: `${(dataStr.length / (1024 * 1024)).toFixed(2)} MB`,
        count: records.length,
        date: new Date().toLocaleString()
      };
      const updatedSnapshots = [newSnapshot, ...backups.slice(0, 9)];
      setBackups(updatedSnapshots);
      try {
        localStorage.setItem('sugar_erp_local_snapshots', JSON.stringify(updatedSnapshots));
      } catch (e) {}

      showToast(`ಡೇಟಾಬೇಸ್ ಬ್ಯಾಕಪ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ (${records.length.toLocaleString()} ದಾಖಲೆಗಳು)!`, 'success');
    } catch (err) {
      showToast(`ಬ್ಯಾಕಪ್ ರಫ್ತು ವಿಫಲವಾಗಿದೆ: ${err.message}`, 'error');
    }
    setLoading(false);
  };

  // 2. Import / Restore Database Snapshot
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      try {
        const parsed = JSON.parse(event.target.result);
        const recordsToRestore = Array.isArray(parsed) ? parsed : (parsed.shareholders || []);

        if (!Array.isArray(recordsToRestore) || recordsToRestore.length === 0) {
          throw new Error('No valid shareholder records found in this backup file.');
        }

        // Save into IndexedDB and refresh
        await ApiService.addShareholdersBulk(recordsToRestore);
        showToast(`ಡೇಟಾಬೇಸ್ ಯಶಸ್ವಿಯಾಗಿ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ! (${recordsToRestore.length.toLocaleString()} ಷೇರುದಾರರು)`, 'success');
        await loadDatabaseStats();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        showToast(`ಮರುಸ್ಥಾಪನೆ ವಿಫಲವಾಗಿದೆ: ${err.message}`, 'error');
      }
      setLoading(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 3. Test Supabase Connection
  const handleTestConnection = async () => {
    setTestingConn(true);
    setTestResult(null);
    const res = await CloudDbService.testConnection(cloudConfig.url, cloudConfig.anonKey);
    setTestResult(res);
    setTestingConn(false);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // 4. Save Cloud Config
  const handleSaveCloudConfig = () => {
    CloudDbService.saveConfig(cloudConfig);
    showToast(
      cloudConfig.enabled
        ? 'ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್ ಸಂರಚನೆ ಉಳಿಸಲಾಗಿದೆ ಮತ್ತು ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ! 🟢'
        : 'ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್ ಸೆಟ್ಟಿಂಗ್ಸ್ ಉಳಿಸಲಾಗಿದೆ (ನಿಷ್ಕ್ರಿಯ)',
      'success'
    );
  };

  // 5. Migrate Local Data to Supabase Cloud
  const handleUploadAllToCloud = async () => {
    if (!cloudConfig.url || !cloudConfig.anonKey) {
      showToast('ದಯವಿಟ್ಟು ಮೊದಲು Supabase URL ಮತ್ತು Anon API Key ನಮೂದಿಸಿ.', 'error');
      return;
    }

    setUploadingToCloud(true);
    setUploadProgress({ uploaded: 0, total: totalRecords, percentage: 0 });

    try {
      const records = await ApiService.getAllShareholdersRaw();
      const res = await CloudDbService.uploadAllToCloud(records, (p) => {
        setUploadProgress(p);
      });

      if (res.success) {
        showToast(`ಅಭಿನಂದನೆಗಳು! ಎಲ್ಲಾ ${res.count.toLocaleString()} ದಾಖಲೆಗಳನ್ನು Supabase ಕ್ಲೌಡ್‌ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ! 🟢`, 'success');
        // Enable cloud DB automatically
        const updated = { ...cloudConfig, enabled: true };
        setCloudConfig(updated);
        CloudDbService.saveConfig(updated);
      }
    } catch (err) {
      showToast(`ಕ್ಲೌಡ್ ಅಪ್‌ಲೋಡ್ ದೋಷ: ${err.message}`, 'error');
    }

    setUploadingToCloud(false);
  };

  // 6. Copy SQL Schema
  const handleCopySchema = () => {
    const sql = CloudDbService.getSqlSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSchema(true);
    showToast('Supabase SQL Schema script copied to clipboard! Paste in Supabase SQL Editor.', 'success');
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  const isCloudActive = CloudDbService.isEnabled();

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                ಡೇಟಾಬೇಸ್ ಬ್ಯಾಕಪ್ & ಕ್ಲೌಡ್ ಸಿಂಕ್ ಮ್ಯಾನೇಜರ್
              </h1>
              <p className="text-xs text-slate-400">
                Database Backup, Multi-Browser Snapshot Transfer & Live Cloud Database Integration
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isCloudActive
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isCloudActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{isCloudActive ? 'Cloud Database: LIVE 🟢' : 'Local Browser Database'}</span>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-sky-400">
            {totalRecords.toLocaleString()} ಷೇರುದಾರರು
          </span>
        </div>
      </div>

      {/* SECTION 1: Instant Multi-Browser Snapshot Sync (Works immediately with 0 setup) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 rounded-3xl border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              1. ತ್ವರಿತ ಬ್ರೌಸರ್-ಟು-ಬ್ರೌಸರ್ ಡೇಟಾಬೇಸ್ ವರ್ಗಾವಣೆ (Instant Browser-to-Browser Transfer)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಬ್ರೌಸರ್‌ನಲ್ಲಿರುವ ಸರಿಯಾದ ಡೇಟಾವನ್ನು ಇತರ ಬ್ರೌಸರ್ ಅಥವಾ ಮೊಬೈಲ್‌ನಲ್ಲಿ ತಕ್ಷಣವೇ ಲೋಡ್ ಮಾಡಲು 1-ಕ್ಲಿಕ್ ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ, ನಂತರ ಇನ್ನೊಂದು ಬ್ರೌಸರ್‌ನಲ್ಲಿ "ಮರುಸ್ಥಾಪನೆ (Restore)" ಕ್ಲಿಕ್ ಮಾಡಿ.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export Button */}
          <button
            onClick={handleExportSnapshot}
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ಪೂರ್ಣ ಲೈವ್ ಡೇಟಾಬೇಸ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (.json)</span>
          </button>

          {/* Import / Restore Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-sky-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-sky-400" />
            <span>ಇನ್ನೊಂದು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಡೇಟಾಬೇಸ್ ಮರುಸ್ಥಾಪಿಸಿ (Import Backup)</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Permanent Cloud Database (Supabase PostgreSQL) Setup */}
      <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-400" />
              2. ಅಧಿಕೃತ ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್ ಜೋಡಣೆ (Supabase PostgreSQL Integration)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ಉಚಿತ Supabase ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್ ಬಳಸಿ ಜಗತ್ತಿನ ಯಾವುದೇ ಬ್ರೌಸರ್, ಕಂಪ್ಯೂಟರ್ ಅಥವಾ ಮೊಬೈಲ್‌ನಿಂದಲೂ ಲೈವ್ ಆಗಿ ರಿಯಲ್‌ಟೈಮ್ ಸಿಂಕ್ ಪಡೆಯಿರಿ.
            </p>
          </div>

          <button
            onClick={handleCopySchema}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
            title="Supabase SQL Editor ನಲ್ಲಿ ರನ್ ಮಾಡಲು ರೆಡಿಮೇಡ್ SQL ಸ್ಕ್ರಿಪ್ಟ್ ಕಾಪಿ ಮಾಡಿ"
          >
            {copiedSchema ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
            <span>{copiedSchema ? 'SQL ಸ್ಕ್ರಿಪ್ಟ್ ಕಾಪಿಯಾಗಿದೆ!' : 'Copy Supabase SQL Setup'}</span>
          </button>
        </div>

        {/* Step-by-Step Instructions Pill */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" /> 3 ಸರಳ ಹಂತಗಳಲ್ಲಿ ಶಾಶ್ವತ ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್ ಸಕ್ರಿಯಗೊಳಿಸಿ:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11.5px] leading-relaxed">
            <li>
              <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold inline-flex items-center gap-1">
                supabase.com <ArrowUpRight className="w-3 h-3" />
              </a> ನಲ್ಲಿ ಉಚಿತ ಖಾತೆ ತೆರೆದು ಪ್ರಾಜೆಕ್ಟ್ ರಚಿಸಿ.
            </li>
            <li>
              ಮೇಲಿನ <strong>"Copy Supabase SQL Setup"</strong> ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ, Supabase ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನ <strong>SQL Editor</strong> ನಲ್ಲಿ ಪೇಸ್ಟ್ ಮಾಡಿ 'Run' ಕ್ಲಿಕ್ ಮಾಡಿ.
            </li>
            <li>
              Supabase Settings → API ನಿಂದ <strong>Project URL</strong> ಮತ್ತು <strong>Anon Public Key</strong> ಅನ್ನು ಕೆಳಗೆ ನಮೂದಿಸಿ "ಸಂಪರ್ಕಿಸಿ & ಅಪ್‌ಲೋಡ್ ಮಾಡಿ" ಕ್ಲಿಕ್ ಮಾಡಿ!
            </li>
          </ol>
        </div>

        {/* Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" /> Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://your-project-id.supabase.co"
              value={cloudConfig.url}
              onChange={(e) => setCloudConfig({ ...cloudConfig, url: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" /> Supabase Anon Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={cloudConfig.anonKey}
              onChange={(e) => setCloudConfig({ ...cloudConfig, anonKey: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono outline-none transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Action Buttons & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testingConn || !cloudConfig.url || !cloudConfig.anonKey}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConn ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{testingConn ? 'ಪರೀಕ್ಷಿಸಲಾಗುತ್ತಿದೆ...' : 'ಸಂಪರ್ಕ ಪರೀಕ್ಷಿಸಿ (Test Connection)'}</span>
            </button>

            <button
              onClick={handleSaveCloudConfig}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ಸೆಟ್ಟಿಂಗ್ಸ್ ಉಳಿಸಿ (Save Settings)</span>
            </button>
          </div>

          {/* Migration to Cloud Button */}
          <button
            onClick={handleUploadAllToCloud}
            disabled={uploadingToCloud || !cloudConfig.url || !cloudConfig.anonKey}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Cloud className="w-4 h-4" />
            <span>ಸ್ಥಳೀಯ ಡೇಟಾವನ್ನು ಕ್ಲೌಡ್‌ಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (Upload to Cloud)</span>
          </button>
        </div>

        {/* Upload Progress Bar */}
        {uploadingToCloud && uploadProgress && (
          <div className="bg-slate-900 border border-emerald-500/40 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-300">
                ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್‌ಗೆ ದಾಖಲೆಗಳನ್ನು ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...
              </span>
              <span className="font-mono font-bold text-slate-200">
                {uploadProgress.uploaded.toLocaleString()} / {uploadProgress.total.toLocaleString()} ({uploadProgress.percentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            testResult.success
              ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* SECTION 3: Recent Local Snapshot History */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            ಇತ್ತೀಚಿನ ಸ್ಥಳೀಯ ಬ್ಯಾಕಪ್‌ಗಳ ಪಟ್ಟಿ (Recent Snapshots)
          </h3>
          <span className="text-[11px] text-slate-400">{backups.length} snapshots stored</span>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            ಇನ್ನೂ ಯಾವುದೇ ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಇಲ್ಲ. ಮೇಲಿನ "ಪೂರ್ಣ ಲೈವ್ ಡೇಟಾಬೇಸ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">ಫೈಲ್ ಹೆಸರು (Backup Name)</th>
                  <th className="py-3 px-4">ದಾಖಲೆಗಳು (Records)</th>
                  <th className="py-3 px-4">ಗಾತ್ರ (Size)</th>
                  <th className="py-3 px-4">ದಿನಾಂಕ (Created)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-emerald-400">{b.name}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-200">{b.count?.toLocaleString() || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-300">{b.size}</td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{b.date}</td>
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
