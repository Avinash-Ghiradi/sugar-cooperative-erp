const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'client', 'src', 'services', 'api.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add STORAGE_KEY_NOTICES
if (!content.includes('STORAGE_KEY_NOTICES')) {
  content = content.replace(
    "const STORAGE_KEY_MERGE_REQ = 'sugar_erp_clean_merge_requests_v1';",
    "const STORAGE_KEY_MERGE_REQ = 'sugar_erp_clean_merge_requests_v1';\nconst STORAGE_KEY_NOTICES = 'sugar_erp_clean_notices_v1';"
  );
}

// 2. Add DEFAULT_NOTICES and mockNotices
const noticesDefCode = `
export const DEFAULT_NOTICES = [
  {
    id: 'NOTICE-1',
    title: 'ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ. ಗೆ ಸ್ವಾಗತ',
    title_english: 'Welcome to Shree Bheemashankar Sahakari Sakkare Karkhane Niyamit',
    subtitle: 'ಗೌರವಾನ್ವಿತ ರೈತ ಬಾಂಧವರಿಗೆ ಹಾಗೂ ಸಿಬ್ಬಂದಿ ವರ್ಗದವರಿಗೆ ಆತ್ಮೀಯ ಸ್ವಾಗತ & ಶುಭಾಶಯಗಳು',
    subtitle_english: 'Warm Greetings to Farmers, Members & Staff',
    message: 'ಕಾರ್ಖಾನೆಯ ಶಾಸನಬದ್ಧ ಇಆರ್‌ಪಿ ತಂತ್ರಾಂಶಕ್ಕೆ ಸ್ವಾಗತ. ಇಂದಿನ ಕಬ್ಬು ನುರಿಸುವ ಹಂಗಾಮು ಮತ್ತು ಷೇರುದಾರರ ಸೇವೆಗಳು ಸಕ್ರಿಯವಾಗಿವೆ. ಷೇರು ವಾರಸಾ, ವರ್ಗಾವಣೆ ಹಾಗೂ ಸಕ್ಕರೆ ಕೋಟಾ ಹಂಚಿಕೆ ಸೌಲಭ್ಯಗಳು ಲಭ್ಯವಿವೆ.',
    message_english: 'Welcome to the Statutory ERP System of Shree Bheemashankar Sugar. Cane crushing operations and shareholder services are actively running. Varasa, share transfers and sugar quota allotment services are available.',
    category: 'GREETING',
    target: 'ALL',
    priority: 'NORMAL',
    status: 'ACTIVE',
    include_time_greeting: true,
    show_on_login: true,
    image: '',
    image_caption: 'ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ',
    date_start: '2026-01-01',
    date_end: '2030-12-31',
    author: 'Admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'NOTICE-2',
    title: 'ದೀಪಾವಳಿ ಹಾಗೂ ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವದ ಹಾರ್ದಿಕ ಶುಭಾಶಯಗಳು',
    title_english: 'Warm Wishes on Kannada Rajyotsava & Deepavali',
    subtitle: 'ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ • ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ',
    subtitle_english: 'May this festive season bring prosperity and happiness to all',
    message: 'ಎಲ್ಲಾ ರೈತ ಬಾಂಧವರಿಗೂ, ಗೌರವಾನ್ವಿತ ನಿರ್ದೇಶಕ ಮಂಡಳಿಯವರಿಗೂ ಹಾಗೂ ಕಾರ್ಖಾನೆಯ ಸಮಸ್ತ ಸಿಬ್ಬಂದಿ ವರ್ಗದವರಿಗೂ ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ಮತ್ತು ದೀಪಾವಳಿ ಹಬ್ಬದ ಹಾರ್ದಿಕ ಶುಭಾಶಯಗಳು. ನಿಮ್ಮ ಬಾಳಿನಲ್ಲಿ ಸಂತೋಷ, ನೆಮ್ಮದಿ ಹಾಗೂ ಸಮೃದ್ಧಿ ತುಂಬಿರಲಿ ಎಂದು ಹಾರೈಸುತ್ತೇವೆ.',
    message_english: 'Warm festive greetings of Kannada Rajyotsava and Deepavali to all our farmer shareholders, Board of Directors, and dedicated factory staff members. Wishing everyone boundless prosperity, good health, and success.',
    category: 'FESTIVAL',
    target: 'ALL',
    priority: 'IMPORTANT',
    status: 'ACTIVE',
    include_time_greeting: false,
    show_on_login: true,
    image: '',
    image_caption: 'ಹಬ್ಬದ ಶುಭಾಶಯಗಳು',
    date_start: '2026-01-01',
    date_end: '2030-12-31',
    author: 'Admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'NOTICE-3',
    title: 'ಶಾಸನಬದ್ಧ ಷೇರು ವಾರಸಾ & ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಸಲ್ಲಿಕೆ ಪ್ರಕಟಣೆ',
    title_english: 'Statutory Share Varasa & Transfer Document Submission Notice',
    subtitle: 'ಷೇರುದಾರರ ಗಮನಕ್ಕೆ: ಅಗತ್ಯ ದಾಖಲೆಗಳೊಂದಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
    subtitle_english: 'Important notice for all shareholders and legal heirs',
    message: 'ಕಾರ್ಖಾನೆಯ ಎಲ್ಲಾ ಗೌರವಾನ್ವಿತ ಷೇರುದಾರರ ಗಮನಕ್ಕೆ: ಮೃತ ಷೇರುದಾರರ ವಾರಸುದಾರರು ವಾರಸಾ ಬದಲಾವಣೆ ವಹಿಯಡಿ ನಮೂನೆ 15 ಹಾಗೂ ಮರಣ ಪ್ರಮಾಣಪತ್ರ, ಆಧಾರ್ ಕಾರ್ಡ್ ನಕಲು ಮತ್ತು ಕುಟುಂಬದ ಒಪ್ಪಿಗೆ ಪತ್ರದೊಂದಿಗೆ ಕಚೇರಿಯಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಕೋರಲಾಗಿದೆ.',
    message_english: 'All respected shareholders are hereby informed: Legal heirs of deceased shareholders are requested to submit Form 15 along with Death Certificate, Aadhaar card copies, and family consent letters for timely Varasa ledger transfer.',
    category: 'NOTICE',
    target: 'SHAREHOLDERS',
    priority: 'IMPORTANT',
    status: 'ACTIVE',
    include_time_greeting: false,
    show_on_login: true,
    image: '',
    image_caption: 'ವಾರಸಾ & ವರ್ಗಾವಣೆ ಸೂಚನೆ',
    date_start: '2026-01-01',
    date_end: '2030-12-31',
    author: 'Admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let mockNotices = loadStoredData(STORAGE_KEY_NOTICES, null);
if (!Array.isArray(mockNotices) || mockNotices.length === 0) {
  mockNotices = DEFAULT_NOTICES;
  saveStoredData(STORAGE_KEY_NOTICES, mockNotices);
}
`;

if (!content.includes('mockNotices =')) {
  content = content.replace(
    "let mockMergeRequests = loadStoredData(STORAGE_KEY_MERGE_REQ, []);",
    `let mockMergeRequests = loadStoredData(STORAGE_KEY_MERGE_REQ, []);\n${noticesDefCode}`
  );
}

// 3. Add ApiService Notice Methods before deleteMergeRequest ending
const noticeMethods = `
  // ================= NOTICE BOARD & GREETINGS API =================
  async getNotices(filter = {}) {
    await ensureDBReady();
    if (CloudDbService.isEnabled()) {
      try {
        const cloudData = await CloudDbService.getCollection('notices');
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          const cloudIds = new Set(cloudData.map(n => String(n.id)));
          const unpushed = mockNotices.filter(n => !cloudIds.has(String(n.id)));
          for (const u of unpushed) {
            CloudDbService.saveCollectionItem('notices', u.id, u).catch(() => {});
          }
          mockNotices = [...cloudData, ...unpushed];
          saveStoredData(STORAGE_KEY_NOTICES, mockNotices);
        }
      } catch (e) {
        console.warn('Cloud DB notices sync warning:', e);
      }
    }

    let list = Array.isArray(mockNotices) ? [...mockNotices] : [];
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter(n => (n.status || 'ACTIVE').toUpperCase() === filter.status.toUpperCase());
    }
    if (filter.category && filter.category !== 'ALL') {
      list = list.filter(n => (n.category || '').toUpperCase() === filter.category.toUpperCase());
    }
    if (filter.target && filter.target !== 'ALL') {
      list = list.filter(n => n.target === 'ALL' || n.target === filter.target);
    }
    // Sort urgent / important first, then newest
    list.sort((a, b) => {
      const pMap = { URGENT: 3, IMPORTANT: 2, NORMAL: 1 };
      const pDiff = (pMap[b.priority] || 1) - (pMap[a.priority] || 1);
      if (pDiff !== 0) return pDiff;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return {
      success: true,
      data: list,
      totalCount: mockNotices.length,
      activeCount: mockNotices.filter(n => n.status === 'ACTIVE').length
    };
  },

  async getActiveLoginNotices() {
    await ensureDBReady();
    const res = await this.getNotices({ status: 'ACTIVE' });
    const today = new Date().toISOString().slice(0, 10);
    const filtered = (res.data || []).filter(n => {
      if (n.status !== 'ACTIVE') return false;
      if (n.show_on_login === false) return false;
      if (n.date_start && n.date_start > today) return false;
      if (n.date_end && n.date_end < today) return false;
      return true;
    });
    return {
      success: true,
      data: filtered
    };
  },

  async addNotice(noticeData, user = null) {
    await ensureDBReady();
    const id = 'NOTICE-' + Date.now();
    const now = new Date().toISOString();
    const newNotice = {
      id,
      title: noticeData.title?.trim() || 'ಹೊಸ ಸೂಚನೆ',
      title_english: noticeData.title_english?.trim() || '',
      subtitle: noticeData.subtitle?.trim() || '',
      subtitle_english: noticeData.subtitle_english?.trim() || '',
      message: noticeData.message?.trim() || '',
      message_english: noticeData.message_english?.trim() || '',
      category: noticeData.category || 'NOTICE', // GREETING, FESTIVAL, NOTICE, URGENT, SUGAR, AGM
      target: noticeData.target || 'ALL', // ALL, STAFF, SHAREHOLDERS
      priority: noticeData.priority || 'NORMAL', // NORMAL, IMPORTANT, URGENT
      status: noticeData.status || 'ACTIVE', // ACTIVE, INACTIVE
      include_time_greeting: Boolean(noticeData.include_time_greeting),
      show_on_login: noticeData.show_on_login !== false,
      image: noticeData.image || '',
      image_caption: noticeData.image_caption || '',
      date_start: noticeData.date_start || now.slice(0, 10),
      date_end: noticeData.date_end || '2030-12-31',
      author: user?.name || 'Admin',
      created_at: now,
      updated_at: now
    };

    mockNotices.unshift(newNotice);
    saveStoredData(STORAGE_KEY_NOTICES, mockNotices);

    const auditLogEntry = {
      id: 'AUD-NOTICE-ADD-' + Date.now(),
      timestamp: now,
      performed_by: user?.name || 'Admin',
      type: 'NOTICE_CREATED',
      title: 'ಹೊಸ ಸೂಚನೆ ರಚನೆ',
      description: \`ಹೊಸ ಸೂಚನಾ ಪ್ರಕಟಣೆ #\${newNotice.id} (\${newNotice.title}) ರಚಿಸಲಾಗಿದೆ. ವರ್ಗ: \${newNotice.category}\`,
      details: {
        id: newNotice.id,
        title: newNotice.title,
        category: newNotice.category,
        author: user?.name || 'Admin'
      }
    };
    mockAuditLogs.unshift(auditLogEntry);
    if (mockAuditLogs.length > 500) mockAuditLogs.pop();
    saveStoredData(STORAGE_KEY_LOGS, mockAuditLogs);

    if (CloudDbService.isEnabled()) {
      CloudDbService.saveCollectionItem('notices', newNotice.id, newNotice).catch(err => console.warn('Cloud DB addNotice error:', err));
      CloudDbService.saveCollectionItem('audit_logs', auditLogEntry.id, auditLogEntry).catch(err => console.warn('Cloud DB audit error:', err));
    }

    return {
      success: true,
      data: newNotice,
      message: 'ಸೂಚನೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.'
    };
  },

  async updateNotice(id, updateData, user = null) {
    await ensureDBReady();
    const idx = mockNotices.findIndex(n => n.id === id);
    if (idx === -1) {
      return { success: false, message: 'ಸೂಚನೆ ಕಂಡುಬಂದಿಲ್ಲ.' };
    }

    const now = new Date().toISOString();
    const current = mockNotices[idx];
    const updated = {
      ...current,
      ...updateData,
      id: current.id,
      updated_at: now
    };

    mockNotices[idx] = updated;
    saveStoredData(STORAGE_KEY_NOTICES, mockNotices);

    const auditLogEntry = {
      id: 'AUD-NOTICE-UPD-' + Date.now(),
      timestamp: now,
      performed_by: user?.name || 'Admin',
      type: 'NOTICE_UPDATED',
      title: 'ಸೂಚನೆ ನವೀಕರಣ',
      description: \`ಸೂಚನಾ ಪ್ರಕಟಣೆ #\${id} (\${updated.title}) ನವೀಕರಿಸಲಾಗಿದೆ.\`,
      details: { id, title: updated.title, author: user?.name || 'Admin' }
    };
    mockAuditLogs.unshift(auditLogEntry);
    if (mockAuditLogs.length > 500) mockAuditLogs.pop();
    saveStoredData(STORAGE_KEY_LOGS, mockAuditLogs);

    if (CloudDbService.isEnabled()) {
      CloudDbService.saveCollectionItem('notices', updated.id, updated).catch(err => console.warn('Cloud DB updateNotice error:', err));
      CloudDbService.saveCollectionItem('audit_logs', auditLogEntry.id, auditLogEntry).catch(err => console.warn('Cloud DB audit error:', err));
    }

    return {
      success: true,
      data: updated,
      message: 'ಸೂಚನೆ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.'
    };
  },

  async toggleNoticeStatus(id, user = null) {
    await ensureDBReady();
    const idx = mockNotices.findIndex(n => n.id === id);
    if (idx === -1) return { success: false, message: 'ಸೂಚನೆ ಕಂಡುಬಂದಿಲ್ಲ.' };

    const current = mockNotices[idx];
    const newStatus = current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.updateNotice(id, { status: newStatus }, user);
  },

  async deleteNotice(id, user = null) {
    await ensureDBReady();
    const idx = mockNotices.findIndex(n => n.id === id);
    if (idx === -1) return { success: false, message: 'ಸೂಚನೆ ಕಂಡುಬಂದಿಲ್ಲ.' };

    const removed = mockNotices.splice(idx, 1)[0];
    saveStoredData(STORAGE_KEY_NOTICES, mockNotices);

    const auditLogEntry = {
      id: 'AUD-NOTICE-DEL-' + Date.now(),
      timestamp: new Date().toISOString(),
      performed_by: user?.name || 'Admin',
      type: 'NOTICE_DELETED',
      title: 'ಸೂಚನೆ ಅಳಿಸಲಾಗಿದೆ',
      description: \`ಸೂಚನಾ ಪ್ರಕಟಣೆ #\${id} (\${removed?.title}) ಅಳಿಸಲಾಗಿದೆ.\`,
      details: { id, title: removed?.title, author: user?.name || 'Admin' }
    };
    mockAuditLogs.unshift(auditLogEntry);
    if (mockAuditLogs.length > 500) mockAuditLogs.pop();
    saveStoredData(STORAGE_KEY_LOGS, mockAuditLogs);

    if (CloudDbService.isEnabled()) {
      CloudDbService.deleteCollectionItem('notices', id).catch(err => console.warn('Cloud DB deleteNotice error:', err));
      CloudDbService.saveCollectionItem('audit_logs', auditLogEntry.id, auditLogEntry).catch(err => console.warn('Cloud DB audit error:', err));
    }

    return {
      success: true,
      message: 'ಸೂಚನೆ ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.'
    };
  },
`;

if (!content.includes('async getNotices(')) {
  content = content.replace(
    '  async deleteMergeRequest(requestId) {',
    `${noticeMethods}\n  async deleteMergeRequest(requestId) {`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated api.js with notice storage and methods!');
