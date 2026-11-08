import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import PreLoginNoticeModal from '../Auth/PreLoginNoticeModal';
import {
  Megaphone, Sparkles, Bell, Plus, Edit, Trash2, Eye,
  CheckCircle2, AlertTriangle, Image as ImageIcon, Calendar,
  Search, Filter, ShieldCheck, Sun, Sunrise, Sunset, Moon,
  Clock, X, Upload, Check, Power, RefreshCw, Award, Heart
} from 'lucide-react';

export default function NoticeManager() {
  const { user } = useAuth();
  const { isEnglish } = useLanguage();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form input states
  const [formData, setFormData] = useState({
    title: '',
    title_english: '',
    subtitle: '',
    subtitle_english: '',
    message: '',
    message_english: '',
    category: 'NOTICE',
    target: 'ALL',
    priority: 'NORMAL',
    status: 'ACTIVE',
    include_time_greeting: false,
    show_on_login: true,
    image: '',
    image_caption: '',
    date_start: new Date().toISOString().slice(0, 10),
    date_end: '2030-12-31'
  });

  const fileInputRef = useRef(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getNotices();
      if (res && res.data) {
        setNotices(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err);
      showFeedback('error', 'ಸೂಚನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      title_english: '',
      subtitle: '',
      subtitle_english: '',
      message: '',
      message_english: '',
      category: 'NOTICE',
      target: 'ALL',
      priority: 'NORMAL',
      status: 'ACTIVE',
      include_time_greeting: false,
      show_on_login: true,
      image: '',
      image_caption: '',
      date_start: new Date().toISOString().slice(0, 10),
      date_end: '2030-12-31'
    });
    setShowFormModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || '',
      title_english: notice.title_english || '',
      subtitle: notice.subtitle || '',
      subtitle_english: notice.subtitle_english || '',
      message: notice.message || '',
      message_english: notice.message_english || '',
      category: notice.category || 'NOTICE',
      target: notice.target || 'ALL',
      priority: notice.priority || 'NORMAL',
      status: notice.status || 'ACTIVE',
      include_time_greeting: Boolean(notice.include_time_greeting),
      show_on_login: notice.show_on_login !== false,
      image: notice.image || '',
      image_caption: notice.image_caption || '',
      date_start: notice.date_start || new Date().toISOString().slice(0, 10),
      date_end: notice.date_end || '2030-12-31'
    });
    setShowFormModal(true);
  };

  // Toggle active/inactive
  const handleToggleStatus = async (id) => {
    try {
      const res = await ApiService.toggleNoticeStatus(id, user);
      if (res.success) {
        showFeedback('success', 'ಸೂಚನೆಯ ಸ್ಥಿತಿ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಗಿದೆ.');
        fetchNotices();
      }
    } catch (err) {
      showFeedback('error', 'ಸ್ಥಿತಿ ಬದಲಾಯಿಸಲು ವಿಫಲವಾಗಿದೆ.');
    }
  };

  // Delete notice
  const handleDelete = async (id, title) => {
    if (!window.confirm(`ಖಂಡಿತವಾಗಿ ಈ ಸೂಚನೆಯನ್ನು ಅಳಿಸಬೇಕೆ?\n\n"${title}"`)) {
      return;
    }
    try {
      const res = await ApiService.deleteNotice(id, user);
      if (res.success) {
        showFeedback('success', 'ಸೂಚನೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.');
        fetchNotices();
      }
    } catch (err) {
      showFeedback('error', 'ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ.');
    }
  };

  // Compress and handle image file upload via HTML5 Canvas
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('ದಯವಿಟ್ಟು ಚಿತ್ರದ ಫೈಲ್ (Image file) ಆಯ್ಕೆ ಮಾಡಿ.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to optimized JPEG data URL
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, image: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('ದಯವಿಟ್ಟು ಸೂಚನೆಯ ಶೀರ್ಷಿಕೆ (Title) ನಮೂದಿಸಿ.');
      return;
    }
    if (!formData.message.trim()) {
      alert('ದಯವಿಟ್ಟು ವಿವರಣೆ ಅಥವಾ ಸಂದೇಶ (Message) ನಮೂದಿಸಿ.');
      return;
    }

    setSaving(true);
    try {
      if (editingNotice) {
        const res = await ApiService.updateNotice(editingNotice.id, formData, user);
        if (res.success) {
          showFeedback('success', 'ಸೂಚನೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.');
          setShowFormModal(false);
          fetchNotices();
        } else {
          showFeedback('error', res.message || 'ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ.');
        }
      } else {
        const res = await ApiService.addNotice(formData, user);
        if (res.success) {
          showFeedback('success', 'ಹೊಸ ಸೂಚನೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.');
          setShowFormModal(false);
          fetchNotices();
        } else {
          showFeedback('error', res.message || 'ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ.');
        }
      }
    } catch (err) {
      showFeedback('error', err.message || 'ದೋಷ ಸಂಭವಿಸಿದೆ.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered notices
  const filteredNotices = notices.filter(n => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = (n.title || '').toLowerCase().includes(q) || (n.title_english || '').toLowerCase().includes(q);
      const matchMsg = (n.message || '').toLowerCase().includes(q) || (n.message_english || '').toLowerCase().includes(q);
      if (!matchTitle && !matchMsg) return false;
    }
    if (selectedCategory !== 'ALL' && (n.category || '').toUpperCase() !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'ALL' && (n.status || 'ACTIVE').toUpperCase() !== selectedStatus) {
      return false;
    }
    return true;
  });

  const activeCount = notices.filter(n => n.status === 'ACTIVE').length;
  const festivalCount = notices.filter(n => n.category === 'FESTIVAL').length;
  const urgentCount = notices.filter(n => n.priority === 'URGENT').length;

  const getCategoryDetails = (cat) => {
    switch (cat) {
      case 'FESTIVAL':
        return { label: 'ಹಬ್ಬದ ಶುಭಾಶಯ', en: 'Festival Wishes', color: 'bg-amber-950/70 text-amber-300 border-amber-500/40', icon: Sparkles };
      case 'GREETING':
        return { label: 'ದೈನಂದಿನ ಶುಭಾಶಯ', en: 'Greeting', color: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40', icon: Heart };
      case 'URGENT':
        return { label: 'ತುರ್ತು ಪ್ರಕಟಣೆ', en: 'Urgent', color: 'bg-rose-950/70 text-rose-300 border-rose-500/50', icon: Megaphone };
      case 'SUGAR':
        return { label: 'ಸಕ್ಕರೆ ಕೋಟಾ', en: 'Sugar Allotment', color: 'bg-purple-950/70 text-purple-300 border-purple-500/40', icon: Award };
      case 'AGM':
        return { label: 'ಸಾಮಾನ್ಯ ಸಭೆ', en: 'AGM Meeting', color: 'bg-blue-950/70 text-blue-300 border-blue-500/40', icon: Bell };
      default:
        return { label: 'ಅಧಿಕೃತ ಸೂಚನೆ', en: 'Official Notice', color: 'bg-sky-950/70 text-sky-300 border-sky-500/40', icon: Bell };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-xl animate-fadeIn ${
          feedback.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
            : 'bg-rose-950/90 border-rose-500/60 text-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span className="text-xs sm:text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
                {isEnglish ? 'Notice Board & Wishes Manager' : 'ಸೂಚನಾ ಫಲಕ & ಶುಭಾಶಯಗಳ ನಿರ್ವಹಣೆ'}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {isEnglish
                  ? 'Manage pre-login welcome greeting, festival wishes, official circulars, and banner images'
                  : 'ಲಾಗಿನ್ ಪೂರ್ವ ಸ್ವಾಗತ, ಹಬ್ಬದ ಶುಭಾಶಯಗಳು, ತುರ್ತು ಪ್ರಕಟಣೆಗಳು ಹಾಗೂ ಚಿತ್ರ ಬ್ಯಾನರ್ ನಿರ್ವಹಿಸಿ'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Pre-Login Preview Button */}
          <button
            onClick={() => setShowLivePreview(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            title="ಲಾಗಿನ್ ಪೂರ್ವ ಮುನ್ನೋಟ ವೀಕ್ಷಿಸಿ"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>{isEnglish ? 'Live Login Preview' : 'ಲಾಗಿನ್ ಮುನ್ನೋಟ'}</span>
          </button>

          {/* Add Notice Button */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEnglish ? '+ New Notice / Wish' : '+ ಹೊಸ ಸೂಚನೆ / ಶುಭಾಶಯ'}</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>ಒಟ್ಟು ಪ್ರಕಟಣೆಗಳು</span>
            <Megaphone className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100 mt-1 font-mono">
            {notices.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Total Notices</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="text-emerald-400 text-xs font-medium flex items-center justify-between">
            <span>ಸಕ್ರಿಯ ಫಲಕಗಳು</span>
            <Power className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 font-mono">
            {activeCount}
          </div>
          <div className="text-[10px] text-emerald-500/70 mt-0.5">Active Pre-login</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="text-amber-400 text-xs font-medium flex items-center justify-between">
            <span>ಹಬ್ಬದ ಶುಭಾಶಯಗಳು</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1 font-mono">
            {festivalCount}
          </div>
          <div className="text-[10px] text-amber-500/70 mt-0.5">Festival Wishes</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="text-rose-400 text-xs font-medium flex items-center justify-between">
            <span>ತುರ್ತು ಪ್ರಕಟಣೆಗಳು</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1 font-mono">
            {urgentCount}
          </div>
          <div className="text-[10px] text-rose-500/70 mt-0.5">Urgent Announcements</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ಶೀರ್ಷಿಕೆ ಅಥವಾ ವಿವರ ಹುಡುಕಿ..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 outline-none pl-9"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto scrollbar-none">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none"
          >
            <option value="ALL">ಎಲ್ಲ ವರ್ಗಗಳು (All)</option>
            <option value="GREETING">ದೈನಂದಿನ ಶುಭಾಶಯ (Greeting)</option>
            <option value="FESTIVAL">ಹಬ್ಬದ ಶುಭಾಶಯ (Festival)</option>
            <option value="NOTICE">ಅಧಿಕೃತ ಸೂಚನೆ (Notice)</option>
            <option value="URGENT">ತುರ್ತು ಪ್ರಕಟಣೆ (Urgent)</option>
            <option value="SUGAR">ಸಕ್ಕರೆ ಕೋಟಾ (Sugar)</option>
            <option value="AGM">ಸಾಮಾನ್ಯ ಸಭೆ (AGM)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none"
          >
            <option value="ALL">ಎಲ್ಲ ಸ್ಥಿತಿಗಳು (All Status)</option>
            <option value="ACTIVE">ಸಕ್ರಿಯ (Active)</option>
            <option value="INACTIVE">ನಿಷ್ಕ್ರಿಯ (Inactive)</option>
          </select>

          <button
            onClick={fetchNotices}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="ರಿಫ್ರೆಶ್"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notices Cards Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">ಸೂಚನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="py-16 text-center bg-slate-950/60 rounded-3xl border border-slate-800/80 space-y-3">
          <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">ಯಾವುದೇ ಸೂಚನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ</h3>
          <p className="text-xs text-slate-500">ಹೊಸ ಸೂಚನೆ ಅಥವಾ ಹಬ್ಬದ ಶುಭಾಶಯವನ್ನು ಸೇರಿಸಲು ಮೇಲಿನ ಬಟನ್ ಒತ್ತಿ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((n) => {
            const cat = getCategoryDetails(n.category);
            const CatIcon = cat.icon;
            const isActive = n.status === 'ACTIVE';

            return (
              <div
                key={n.id}
                className={`bg-slate-900/90 border rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 ${
                  isActive ? 'border-slate-800 hover:border-emerald-500/40' : 'border-slate-800/60 opacity-70 bg-slate-950/40'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges and Toggle Switch */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cat.color}`}>
                      <CatIcon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {n.priority === 'URGENT' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          ತುರ್ತು
                        </span>
                      )}
                      {n.priority === 'IMPORTANT' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ಮುಖ್ಯ
                        </span>
                      )}

                      {/* Active / Inactive Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(n.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                        title={isActive ? 'ಕ್ಲಿಕ್ ಮಾಡಿ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ' : 'ಕ್ಲಿಕ್ ಮಾಡಿ ಸಕ್ರಿಯಗೊಳಿಸಿ'}
                      >
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span>{isActive ? 'ಸಕ್ರಿಯ (Active)' : 'ನಿಷ್ಕ್ರಿಯ (Off)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-base font-black text-slate-100 leading-snug">
                      {n.title}
                    </h3>
                    {n.subtitle && (
                      <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                        {n.subtitle}
                      </p>
                    )}
                    {n.title_english && (
                      <p className="text-xs text-slate-500 font-mono italic mt-0.5">
                        {n.title_english}
                      </p>
                    )}
                  </div>

                  {/* Image Preview Thumbnail if attached */}
                  {n.image && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-h-48 bg-slate-950 flex items-center justify-center">
                      <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] text-slate-300 font-mono border border-slate-800">
                        ಚಿತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ
                      </div>
                    </div>
                  )}

                  {/* Message Snippet */}
                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line">
                      {n.message}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap pt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      ಪ್ರೇಕ್ಷಕರು: {n.target === 'ALL' ? 'ಎಲ್ಲರಿಗೂ' : n.target === 'STAFF' ? 'ಸಿಬ್ಬಂದಿ' : 'ಶೇರುದಾರರು'}
                    </span>
                    {n.include_time_greeting && (
                      <span className="text-amber-400 flex items-center gap-1 font-semibold">
                        <Sun className="w-3.5 h-3.5" /> ಸ್ವಯಂ ಶುಭೋದಯ
                      </span>
                    )}
                    {n.show_on_login && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> ಲಾಗಿನ್ ಪೂರ್ವ ಪ್ರದರ್ಶನ
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Bottom Bar */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-500 font-mono">
                    ID: #{n.id}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(n)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
                      title="ತಿದ್ದುಪಡಿ ಮಾಡಿ (Edit)"
                    >
                      <Edit className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(n.id, n.title)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/80 transition-colors cursor-pointer"
                      title="ಅಳಿಸಿ (Delete)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Notice Modal Form */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-100">
                    {editingNotice ? 'ಸೂಚನೆ ತಿದ್ದುಪಡಿ ಮಾಡಿ (Edit Notice)' : 'ಹೊಸ ಸೂಚನೆ / ಶುಭಾಶಯ ಸೇರಿಸಿ (Add New Notice)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ಲಾಗಿನ್ ಪೂರ್ವ ಸ್ಕ್ರೀನ್ ಹಾಗೂ ನೋಟಿಸ್ ಬೋರ್ಡ್‌ನಲ್ಲಿ ಪ್ರಕಟವಾಗುತ್ತದೆ.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Category & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    ಪ್ರಕಟಣೆ ವರ್ಗ (Category) *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 outline-none"
                  >
                    <option value="NOTICE">ಅಧಿಕೃತ ಸೂಚನೆ (Notice)</option>
                    <option value="FESTIVAL">ಹಬ್ಬದ ಶುಭಾಶಯ (Festival Wishes)</option>
                    <option value="GREETING">ದೈನಂದಿನ ಶುಭಾಶಯ (Greeting)</option>
                    <option value="URGENT">ತುರ್ತು ಪ್ರಕಟಣೆ (Urgent Notice)</option>
                    <option value="SUGAR">ಸಕ್ಕರೆ ಕೋಟಾ (Sugar Allotment)</option>
                    <option value="AGM">ವಾರ್ಷಿಕ ಸಭೆ (AGM / Meeting)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    ಆದ್ಯತೆ (Priority) *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 outline-none"
                  >
                    <option value="NORMAL">ಸಾಮಾನ್ಯ (Normal)</option>
                    <option value="IMPORTANT">ಮುಖ್ಯ (Important)</option>
                    <option value="URGENT">ತುರ್ತು (Urgent - High Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    ಉದ್ದೇಶಿತ ಪ್ರೇಕ್ಷಕರು (Target Audience) *
                  </label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 outline-none"
                  >
                    <option value="ALL">ಎಲ್ಲರಿಗೂ (Staff & Shareholders)</option>
                    <option value="SHAREHOLDERS">ಶೇರುದಾರರಿಗೆ ಮಾತ್ರ (Shareholders)</option>
                    <option value="STAFF">ಸಿಬ್ಬಂದಿಗೆ ಮಾತ್ರ (Staff)</option>
                  </select>
                </div>
              </div>

              {/* Title Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    ಶೀರ್ಷಿಕೆ (Title in Kannada) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="ಉದಾ: ದೀಪಾವಳಿ ಹಬ್ಬದ ಹಾರ್ದಿಕ ಶುಭಾಶಯಗಳು / ಸಕ್ಕರೆ ಹಂಚಿಕೆ ಸೂಚನೆ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    ಇಂಗ್ಲಿಷ್ ಶೀರ್ಷಿಕೆ (Title in English - Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.title_english}
                    onChange={(e) => setFormData({ ...formData, title_english: e.target.value })}
                    placeholder="Ex: Warm Festive Wishes / Annual General Meeting Notice"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Subtitle / Wish Quote */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    ಉಪ ಶೀರ್ಷಿಕೆ / ಶುಭಾಶಯ ಸಾಲು (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="ಉದಾ: ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ • ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    English Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_english}
                    onChange={(e) => setFormData({ ...formData, subtitle_english: e.target.value })}
                    placeholder="Ex: Warm Greetings to all farmer shareholders"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Message Text Areas */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    ವಿವರ ಸಂದೇಶ (Message Content in Kannada) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="ಪ್ರಕಟಣೆಯ ಪೂರ್ಣ ವಿವರ ಅಥವಾ ಶುಭಾಶಯ ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 leading-relaxed focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    English Message (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.message_english}
                    onChange={(e) => setFormData({ ...formData, message_english: e.target.value })}
                    placeholder="Notice details or greetings in English..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 leading-relaxed focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Image Upload & Banner Section */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>ಚಿತ್ರ / ಬ್ಯಾನರ್ (Image Banner)</span>
                  </label>
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '', image_caption: '' })}
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      ಚಿತ್ರ ತೆಗೆದುಹಾಕಿ (Remove)
                    </button>
                  )}
                </div>

                {formData.image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 max-h-48 bg-slate-900 flex items-center justify-center">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-900/40"
                  >
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-semibold">
                      ಕ್ಲಿಕ್ ಮಾಡಿ ಚಿತ್ರ / ಪೋಸ್ಟರ್ ಅಪ್ಲೋಡ್ ಮಾಡಿ
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      PNG, JPG, WebP • ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಗಾತ್ರ ಕುಗ್ಗಿಸಲಾಗುತ್ತದೆ
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {formData.image && (
                  <input
                    type="text"
                    value={formData.image_caption}
                    onChange={(e) => setFormData({ ...formData, image_caption: e.target.value })}
                    placeholder="ಚಿತ್ರದ ಶೀರ್ಷಿಕೆ (Image caption)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none"
                  />
                )}
              </div>

              {/* Toggles & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.include_time_greeting}
                    onChange={(e) => setFormData({ ...formData, include_time_greeting: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <div className="text-slate-200 font-semibold">ಸ್ವಯಂ ಸಮಯದ ಶುಭಾಶಯ</div>
                    <div className="text-[10px] text-slate-400">ಶುಭೋದಯ / ಮಧ್ಯಾಹ್ನ / ಸಂಜೆ / ರಾತ್ರಿ ಲಗತ್ತಿಸಿ</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_on_login}
                    onChange={(e) => setFormData({ ...formData, show_on_login: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <div className="text-slate-200 font-semibold">ಲಾಗಿನ್ ಪೂರ್ವ ಪ್ರದರ್ಶನ</div>
                    <div className="text-[10px] text-slate-400">ಲಾಗಿನ್ ಆಗುವ ಮುನ್ನ ಪಾಪ್-ಅಪ್ ನಲ್ಲಿ ತೋರಿಸಿ</div>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
                >
                  ರದ್ದು (Cancel)
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>ಉಳಿಸಲಾಗುತ್ತಿದೆ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingNotice ? 'ನವೀಕರಿಸಿ (Save Changes)' : 'ಉಳಿಸಿ (Create Notice)'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Pre-Login Modal Preview */}
      <PreLoginNoticeModal
        isOpen={showLivePreview}
        onClose={() => setShowLivePreview(false)}
        isPreview={true}
      />
    </div>
  );
}
