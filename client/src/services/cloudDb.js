// Cloud Database Service Layer (Supabase PostgREST)
// Enables real-time shared database across all browsers, mobile devices, and computers worldwide.

const CONFIG_KEY = 'sugar_erp_cloud_config';

const DEFAULT_SUPABASE_URL = 'https://lrzzmcmiamufpruywucy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyenptY21pYW11ZnBydXl3dWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MDkwNTIsImV4cCI6MjEwODA4NTA1Mn0.EyUfa0VR3OoQj4BopOwya1q60mBNd5ubHbCe7tAWgFo';

export const CloudDbService = {
  // 1. Get stored cloud config
  getConfig() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            url: parsed.url || DEFAULT_SUPABASE_URL,
            anonKey: parsed.anonKey || DEFAULT_SUPABASE_ANON_KEY,
            enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
            lastSync: parsed.lastSync || null
          };
        }
      }
    } catch (e) {}
    // Default to Supabase Cloud Database ENABLED so all browsers sync automatically in real-time
    return {
      url: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL,
      anonKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY,
      enabled: true,
      lastSync: null
    };
  },

  // 2. Save cloud config
  saveConfig(config) {
    try {
      const toSave = {
        ...config,
        enabled: Boolean(config.enabled)
      };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(toSave));
    } catch (e) {}
  },

  // 3. Check if cloud database is actively configured & enabled
  isEnabled() {
    const cfg = this.getConfig();
    return Boolean(cfg && cfg.enabled && cfg.url && cfg.anonKey);
  },

  // 4. Test connection to Supabase
  async testConnection(url, anonKey) {
    if (!url || !anonKey) {
      return { success: false, message: 'URL and Anon API Key are required' };
    }
    const cleanUrl = url.trim().replace(/\/+$/, '');
    try {
      const res = await fetch(`${cleanUrl}/rest/v1/shareholders?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': anonKey.trim(),
          'Authorization': `Bearer ${anonKey.trim()}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        return { success: true, message: 'Successfully connected to Supabase Cloud Database! 🟢' };
      }

      if (res.status === 404 || res.status === 400) {
        // Connected to Supabase, but the shareholders table might not exist yet
        const errorJson = await res.json().catch(() => ({}));
        if (errorJson?.message?.includes('relation "public.shareholders" does not exist') || errorJson?.code === 'PGRST204' || res.status === 404) {
          return {
            success: true,
            needsSchema: true,
            message: 'Connected to Supabase, but "shareholders" table needs to be created. Please run the SQL schema script.'
          };
        }
        return { success: false, message: `Supabase error (${res.status}): ${errorJson.message || res.statusText}` };
      }

      if (res.status === 401 || res.status === 403) {
        return { success: false, message: 'Invalid Supabase Anon API Key. Please verify your credentials.' };
      }

      return { success: false, message: `Connection failed with status HTTP ${res.status}` };
    } catch (err) {
      return { success: false, message: `Network error connecting to Supabase: ${err.message}` };
    }
  },

  // Helper to make authenticated requests
  async request(endpoint, options = {}) {
    const cfg = this.getConfig();
    if (!cfg.url || !cfg.anonKey) return null;
    const cleanUrl = cfg.url.trim().replace(/\/+$/, '');

    const { headers: customHeaders, ...restOptions } = options;
    const res = await fetch(`${cleanUrl}/rest/v1/${endpoint}`, {
      ...restOptions,
      headers: {
        'apikey': cfg.anonKey.trim(),
        'Authorization': `Bearer ${cfg.anonKey.trim()}`,
        'Content-Type': 'application/json',
        ...customHeaders
      }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Cloud DB HTTP ${res.status}: ${errText}`);
    }

    if (res.status === 204) return true; // No content (e.g. PATCH/DELETE)
    const text = await res.text().catch(() => '');
    if (!text || !text.trim()) return true; // Handles 201 Created or other success with empty body
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  },

  // 5. Query Shareholders with pagination & filters
  async getShareholders({ page = 1, limit = 20, search = '', village_id = '', circle_id = '', status = '', book_no = '', schedule_cast = '', amount = '', sortBy = '', sortOrder = 'asc' }) {
    if (!this.isEnabled()) return null;

    try {
      const offset = (page - 1) * limit;
      let queryParams = [];

      // Sort: default to newest first (id.desc) so newly approved shareholders appear on Page 1 Row 1!
      let orderCol = 'id';
      let dir = 'desc';

      if (!sortBy) {
        orderCol = 'id';
        dir = 'desc';
      } else if (sortBy === 'share_no') {
        orderCol = 'id';
        dir = sortOrder === 'desc' ? 'desc' : 'asc';
      } else if (sortBy === 'name' || sortBy === 'shareholder_name') {
        orderCol = 'shareholder_name';
        dir = sortOrder === 'desc' ? 'desc' : 'asc';
      } else if (sortBy === 'place') {
        orderCol = 'place';
        dir = sortOrder === 'desc' ? 'desc' : 'asc';
      } else if (sortBy === 'circle') {
        orderCol = 'circle';
        dir = sortOrder === 'desc' ? 'desc' : 'asc';
      } else if (sortBy === 'address') {
        orderCol = 'address';
        dir = sortOrder === 'desc' ? 'desc' : 'asc';
      }
      queryParams.push(`order=${orderCol}.${dir}`);

      // Filters
      if (search) {
        const q = encodeURIComponent(search.trim());
        const isNum = /^\d+$/.test(search.trim());
        if (isNum && search.trim().length <= 6) {
          // Numbers <= 6 digits: primarily match share_no, receipt_no, or shareholder_name
          queryParams.push(`or=(share_no.eq.${q},share_no.ilike.${q}*,shareholder_name.ilike.*${q}*,receipt_no.eq.${q})`);
        } else {
          queryParams.push(`or=(shareholder_name.ilike.*${q}*,share_no.ilike.*${q}*,mobile_no.ilike.*${q}*,place.ilike.*${q}*,aadhaar_card_no.ilike.*${q}*)`);
        }
      }
      if (status) queryParams.push(`status=eq.${encodeURIComponent(status)}`);
      if (book_no) queryParams.push(`book_no=eq.${encodeURIComponent(book_no)}`);
      if (schedule_cast) queryParams.push(`schedule_cast=eq.${encodeURIComponent(schedule_cast)}`);
      if (village_id) queryParams.push(`place=ilike.*${encodeURIComponent(village_id)}*`);
      if (circle_id) queryParams.push(`circle=ilike.*${encodeURIComponent(circle_id)}*`);
      if (amount) queryParams.push(`total_amount=eq.${encodeURIComponent(amount)}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const endpoint = `shareholders${queryString}`;

      const cfg = this.getConfig();
      const cleanUrl = cfg.url.trim().replace(/\/+$/, '');

      const res = await fetch(`${cleanUrl}/rest/v1/${endpoint}`, {
        headers: {
          'apikey': cfg.anonKey.trim(),
          'Authorization': `Bearer ${cfg.anonKey.trim()}`,
          'Content-Type': 'application/json',
          'Range': `${offset}-${offset + limit - 1}`,
          'Prefer': 'count=exact'
        }
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (search && Array.isArray(data)) {
        const cleanSearch = search.trim().toLowerCase();
        data.sort((a, b) => {
          const aExact = String(a.share_no || '').trim().toLowerCase() === cleanSearch;
          const bExact = String(b.share_no || '').trim().toLowerCase() === cleanSearch;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return 0;
        });
      }
      const contentRange = res.headers.get('content-range'); // e.g. "0-19/17076"
      let total = data.length;
      if (contentRange && contentRange.includes('/')) {
        const parts = contentRange.split('/');
        total = parseInt(parts[1], 10) || total;
      }

      return {
        success: true,
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      console.warn('Cloud DB query failed, falling back to local DB:', err.message);
      return null;
    }
  },

  // Sanitize any shareholder payload to match exact PostgreSQL schema columns
  sanitizeShareholderRecord(r = {}) {
    const validCols = new Set([
      'book_no', 'sl_no', 'share_no', 'shareholder_name', 'gender',
      'aadhaar_card_no', 'reg_date', 'receipt_no', 'receipt_amount',
      'date', 'reciept', 'amount', 'total_amount', 'remaining_balance',
      'new_shares_count', 'number_of_shares', 'schedule_cast', 'address',
      'place', 'taluk', 'district', 'pin_code', 'circle', 'member_type',
      'relationship', 'tharava_date', 'tharava_no', 'mobile_no',
      'photo_url', 'signature_url', 'thumb_url', 'nominee_name',
      'nominee_aadhaar_no', 'nominee_mobile_no', 'nominee_address',
      'status', 'updated_at'
    ]);

    const sanitized = {};
    for (const [k, v] of Object.entries(r)) {
      if (validCols.has(k) && v !== undefined) {
        sanitized[k] = v;
      }
    }

    // Common alias fallbacks
    if (!sanitized.shareholder_name && (r.name || r.full_name)) {
      sanitized.shareholder_name = String(r.name || r.full_name).trim().normalize('NFC');
    }
    if (!sanitized.share_no && (r.share_number || r.shareNo)) {
      sanitized.share_no = String(r.share_number || r.shareNo).trim();
    }
    if (!sanitized.mobile_no && (r.mobile || r.mobile_number)) {
      sanitized.mobile_no = String(r.mobile || r.mobile_number).trim();
    }
    if (!sanitized.aadhaar_card_no && (r.aadhaar_no || r.aadhaar_number || r.aadhaar_ref)) {
      sanitized.aadhaar_card_no = String(r.aadhaar_no || r.aadhaar_number || r.aadhaar_ref).trim();
    }
    if (!sanitized.place && (r.village_name || r.village)) {
      sanitized.place = String(r.village_name || r.village).trim().normalize('NFC');
    }
    if (!sanitized.circle && (r.circle_name)) {
      sanitized.circle = String(r.circle_name).trim().normalize('NFC');
    }
    if (!sanitized.photo_url && r.photo) sanitized.photo_url = r.photo;
    if (!sanitized.signature_url && r.signature) sanitized.signature_url = r.signature;
    if (!sanitized.thumb_url && (r.thumb_impression || r.thumb)) sanitized.thumb_url = r.thumb_impression || r.thumb;
    if (sanitized.total_amount === undefined && (r.share_amount || r.total_amt)) {
      sanitized.total_amount = parseFloat(r.share_amount || r.total_amt) || 2000;
    }
    if (sanitized.number_of_shares === undefined && (r.no_shares || r.shares)) {
      sanitized.number_of_shares = parseInt(r.no_shares || r.shares) || 1;
    }

    return sanitized;
  },

  // 6. Get single shareholder by ID or Share No
  async getShareholderById(idOrShareNo) {
    if (!this.isEnabled()) return null;
    try {
      const q = encodeURIComponent(String(idOrShareNo).trim());
      const isNum = /^\d+$/.test(String(idOrShareNo).trim());
      const filter = isNum ? `or=(id.eq.${q},share_no.eq.${q})` : `share_no.eq.${q}`;
      const res = await this.request(`shareholders?${filter}&limit=1`);
      if (Array.isArray(res) && res.length > 0) {
        return { success: true, shareholder: res[0], history: {} };
      }
    } catch (err) {
      console.warn('Cloud DB getShareholderById failed:', err.message);
    }
    return null;
  },

  // 7. Update shareholder in Cloud
  async updateShareholder(identifier, updates) {
    if (!this.isEnabled()) return null;
    try {
      const sanitized = this.sanitizeShareholderRecord(updates);
      sanitized.updated_at = new Date().toISOString();

      const targetShareNo = String(updates?.share_no || identifier || '').trim();
      let res = null;

      // 1. Try matching by share_no first (share_no is unique)
      if (targetShareNo) {
        res = await this.request(`shareholders?share_no=eq.${encodeURIComponent(targetShareNo)}`, {
          method: 'PATCH',
          body: JSON.stringify(sanitized),
          headers: { 'Prefer': 'return=representation' }
        });
      }

      // 2. If not found or target was numeric ID, try by id
      const isNum = /^\d+$/.test(String(identifier).trim());
      if ((!res || (Array.isArray(res) && res.length === 0)) && isNum) {
        res = await this.request(`shareholders?id=eq.${identifier}`, {
          method: 'PATCH',
          body: JSON.stringify(sanitized),
          headers: { 'Prefer': 'return=representation' }
        });
      }

      if (Array.isArray(res) && res.length > 0) {
        return { success: true, data: res[0] };
      }
      return { success: true, data: sanitized };
    } catch (err) {
      console.error('Cloud DB update failed:', err);
      return null;
    }
  },

  // 8. Add single shareholder to Cloud (with safe on_conflict upsert on share_no)
  async addShareholder(record) {
    if (!this.isEnabled()) return null;
    try {
      const sanitized = this.sanitizeShareholderRecord(record);
      if (!sanitized.book_no) sanitized.book_no = 'B.No: 1';
      if (!sanitized.gender) sanitized.gender = 'M';
      if (!sanitized.schedule_cast) sanitized.schedule_cast = 'ಅ - ವರ್ಗ';
      if (!sanitized.status) sanitized.status = 'Active';
      if (!sanitized.relationship) sanitized.relationship = 'ಸ್ವಂತ (Self)';
      if (!sanitized.created_at) sanitized.created_at = new Date().toISOString();
      sanitized.updated_at = new Date().toISOString();

      const res = await this.request(`shareholders?on_conflict=share_no`, {
        method: 'POST',
        body: JSON.stringify(sanitized),
        headers: {
          'Prefer': 'resolution=merge-duplicates,return=representation'
        }
      });
      return { success: true, data: Array.isArray(res) ? res[0] : res };
    } catch (err) {
      console.error('Cloud DB add failed:', err);
      return null;
    }
  },

  // 9. Batch upload all local records to Supabase Cloud
  async uploadAllToCloud(records, onProgress) {
    if (!this.isEnabled()) return { success: false, message: 'Cloud DB is not enabled' };
    if (!Array.isArray(records) || records.length === 0) {
      return { success: true, count: 0 };
    }

    // Clear any previous reset marker since active database records are being populated
    await this.request('audit_logs?module=eq.system_settings&record_id=eq.db_reset_version', {
      method: 'DELETE'
    }).catch(() => {});

    const batchSize = 500;
    const total = records.length;
    let uploaded = 0;
    const totalBatches = Math.ceil(total / batchSize);

    for (let i = 0; i < total; i += batchSize) {
      const chunk = records.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      // De-duplicate chunk by share_no (keep latest) to prevent Postgres cardinality violation
      const chunkMap = new Map();
      chunk.forEach(r => {
        let sn = String(r.share_no || r.share_number || '').trim();
        if (r.schedule_cast && r.schedule_cast.includes('ಬ') && !sn.startsWith('ಬ-') && !sn.startsWith('B-')) {
          sn = 'ಬ-' + sn;
        }
        if (sn) chunkMap.set(sn, { ...r, _cleanShareNo: sn });
      });

      // Sanitize fields to match database columns
      const sanitizedChunk = Array.from(chunkMap.values()).map(r => ({
        book_no: r.book_no || 'B.No: 1',
        sl_no: parseInt(r.sl_no, 10) || 1,
        share_no: r._cleanShareNo,
        shareholder_name: r.shareholder_name || r.name || '',
        gender: r.gender || 'M',
        aadhaar_card_no: r.aadhaar_card_no || '',
        reg_date: r.reg_date || r.registration_date || '',
        receipt_no: String(r.receipt_no || ''),
        receipt_amount: parseFloat(r.receipt_amount) || 0,
        date: r.date || '',
        reciept: String(r.reciept || ''),
        amount: parseFloat(r.amount) || 0,
        total_amount: (r.status === 'Inactive' || r.is_disabled || r.is_merged_secondary) ? 0 : (parseFloat(r.total_amount) || 0),
        remaining_balance: parseFloat(r.remaining_balance) || 0,
        new_shares_count: parseInt(r.new_shares_count, 10) || 0,
        number_of_shares: (r.status === 'Inactive' || r.is_disabled || r.is_merged_secondary) ? 0 : (r.number_of_shares !== undefined && r.number_of_shares !== null && !isNaN(parseInt(r.number_of_shares, 10)) ? parseInt(r.number_of_shares, 10) : 1),
        schedule_cast: r.schedule_cast || 'ಅ - ವರ್ಗ',
        address: r.address || '',
        place: r.place || r.village_name || '',
        taluk: r.taluk || '',
        district: r.district || '',
        pin_code: r.pin_code || '',
        circle: r.circle || r.circle_name || '',
        member_type: r.member_type || '',
        relationship: r.relationship || 'ಸ್ವಂತ (Self)',
        tharava_date: r.tharava_date || '',
        tharava_no: r.tharava_no || '',
        mobile_no: r.mobile_no || r.mobile || '',
        photo_url: r.photo_url || '',
        signature_url: r.signature_url || '',
        thumb_url: r.thumb_url || '',
        nominee_name: r.nominee_name || '',
        nominee_aadhaar_no: r.nominee_aadhaar_no || '',
        nominee_mobile_no: r.nominee_mobile_no || '',
        nominee_address: r.nominee_address || '',
        status: r.status || 'Active'
      }));

      // Robust retry mechanism (up to 3 attempts with backoff)
      let attempts = 0;
      let success = false;
      let lastErr = null;
      while (attempts < 3 && !success) {
        attempts++;
        try {
          await this.request('shareholders?on_conflict=share_no', {
            method: 'POST',
            headers: {
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(sanitizedChunk)
          });
          success = true;
        } catch (err) {
          lastErr = err;
          console.warn(`uploadAllToCloud batch ${batchNum}/${totalBatches} attempt ${attempts} error:`, err.message);
          if (attempts < 3) {
            await new Promise(res => setTimeout(res, 1200 * attempts));
          }
        }
      }

      if (!success) {
        console.error(`uploadAllToCloud batch ${batchNum} permanently failed after 3 attempts:`, lastErr);
        throw lastErr || new Error(`Batch ${batchNum} failed to upload`);
      }

      uploaded += chunk.length;
      if (onProgress) {
        onProgress({
          uploaded,
          total,
          percentage: Math.min(100, Math.round((uploaded / total) * 100)),
          currentBatch: batchNum,
          totalBatches
        });
      }
    }

    const cfg = this.getConfig();
    cfg.lastSync = new Date().toISOString();
    this.saveConfig(cfg);

    return { success: true, count: uploaded };
  },

  // 10. Download all shareholder records from Supabase Cloud DB
  async downloadAllFromCloud(onProgress) {
    if (!this.isEnabled()) return null;
    try {
      const cfg = this.getConfig();
      const cleanUrl = cfg.url.trim().replace(/\/+$/, '');
      const headers = {
        'apikey': cfg.anonKey.trim(),
        'Authorization': `Bearer ${cfg.anonKey.trim()}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      };

      const headRes = await fetch(`${cleanUrl}/rest/v1/shareholders?select=id&limit=1`, { headers });
      if (!headRes.ok) return null;
      let total = 0;
      const cr = headRes.headers.get('content-range');
      if (cr && cr.includes('/')) {
        total = parseInt(cr.split('/')[1], 10) || 0;
      }
      if (total === 0) return [];

      const batchSize = 1000;
      const allRecords = [];

      for (let offset = 0; offset < total; offset += batchSize) {
        const to = Math.min(offset + batchSize - 1, total - 1);
        let chunk = null;
        let attempts = 0;
        while (attempts < 3 && !chunk) {
          attempts++;
          try {
            const res = await fetch(`${cleanUrl}/rest/v1/shareholders?order=id.asc`, {
              headers: {
                ...headers,
                'Range': `${offset}-${to}`
              }
            });
            if (res.ok) {
              const parsed = await res.json();
              if (Array.isArray(parsed)) {
                chunk = parsed;
              }
            }
          } catch (e) {
            if (attempts < 3) await new Promise(r => setTimeout(r, 1000));
          }
        }

        if (chunk && chunk.length > 0) {
          allRecords.push(...chunk);
        }

        if (onProgress) {
          onProgress({
            downloaded: allRecords.length,
            total,
            percentage: Math.min(100, Math.round((allRecords.length / total) * 100))
          });
        }
      }

      return allRecords;
    } catch (err) {
      console.warn('downloadAllFromCloud error:', err);
      return null;
    }
  },

  // 10. Generic Cloud Collection Operations (Multi-Browser Sync for Workflows)
  async getCollection(moduleName) {
    if (!this.isEnabled()) return null;
    try {
      const res = await this.request(`audit_logs?module=eq.${encodeURIComponent(moduleName)}&order=id.desc`);
      if (Array.isArray(res)) {
        const seen = new Set();
        const unique = [];
        for (const r of res) {
          const item = r.new_value;
          if (!item) continue;
          const key = String(r.record_id || item.enrollment_id || item.transfer_id || item.request_id || item.id || '').trim();
          if (key && !seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
        return unique;
      }
    } catch (err) {
      console.warn(`Cloud DB getCollection(${moduleName}) failed:`, err.message);
    }
    return null;
  },

  async saveCollectionItem(moduleName, recordId, data) {
    if (!this.isEnabled()) return false;
    try {
      const recKey = String(recordId || data.id || data.enrollment_id || data.transfer_id || Date.now());
      // Clean previous entry with same recordId
      await this.request(`audit_logs?module=eq.${encodeURIComponent(moduleName)}&record_id=eq.${encodeURIComponent(recKey)}`, {
        method: 'DELETE'
      }).catch(() => {});

      // Insert new entry
      await this.request('audit_logs', {
        method: 'POST',
        body: JSON.stringify({
          username: 'System Administrator',
          role: 'Admin',
          module: moduleName,
          action: 'UPSERT',
          record_id: recKey,
          new_value: data
        })
      });
      return true;
    } catch (err) {
      console.warn(`Cloud DB saveCollectionItem(${moduleName}) failed:`, err.message);
      return false;
    }
  },

  async deleteCollectionItem(moduleName, recordId) {
    if (!this.isEnabled()) return false;
    try {
      const recKey = String(recordId);
      await this.request(`audit_logs?module=eq.${encodeURIComponent(moduleName)}&record_id=eq.${encodeURIComponent(recKey)}`, {
        method: 'DELETE'
      });
      return true;
    } catch (err) {
      console.warn(`Cloud DB deleteCollectionItem(${moduleName}) failed:`, err.message);
      return false;
    }
  },

  async saveCollectionBulk(moduleName, items, idField = 'id') {
    if (!this.isEnabled() || !Array.isArray(items) || items.length === 0) return false;
    try {
      // Clear old module rows
      await this.request(`audit_logs?module=eq.${encodeURIComponent(moduleName)}`, {
        method: 'DELETE'
      }).catch(() => {});

      // Batch insert in chunks of 50
      for (let i = 0; i < items.length; i += 50) {
        const chunk = items.slice(i, i + 50);
        const rows = chunk.map(item => ({
          username: 'System Administrator',
          role: 'Admin',
          module: moduleName,
          action: 'BULK_IMPORT',
          record_id: String(item[idField] || item.enrollment_id || item.transfer_id || `rec-${Date.now()}-${Math.random()}`),
          new_value: item
        }));

        await this.request('audit_logs', {
          method: 'POST',
          body: JSON.stringify(rows)
        });
      }
      return true;
    } catch (err) {
      console.warn(`Cloud DB saveCollectionBulk(${moduleName}) failed:`, err.message);
      return false;
    }
  },

  // 11. Cross-Browser Reset Synchronization
  async recordResetVersion(type = 'everything') {
    if (!this.isEnabled()) return null;
    try {
      const resetAt = Date.now();
      const payload = {
        username: 'System Administrator',
        role: 'Admin',
        module: 'system_settings',
        action: 'RESET_DATABASE',
        record_id: 'db_reset_version',
        new_value: { reset_at: resetAt, reset_type: type }
      };

      // Delete existing reset marker
      await this.request('audit_logs?module=eq.system_settings&record_id=eq.db_reset_version', {
        method: 'DELETE'
      }).catch(() => {});

      // Insert fresh reset marker
      await this.request('audit_logs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('sugar_erp_cloud_reset_version', String(resetAt));
      }
      return resetAt;
    } catch (err) {
      console.warn('Cloud DB recordResetVersion failed:', err.message);
      return null;
    }
  },

  async getCloudResetVersion() {
    if (!this.isEnabled()) return null;
    try {
      const res = await this.request('audit_logs?module=eq.system_settings&record_id=eq.db_reset_version&order=id.desc&limit=1');
      if (Array.isArray(res) && res.length > 0 && res[0].new_value) {
        return res[0].new_value;
      }
    } catch (err) {
      console.warn('Cloud DB getCloudResetVersion failed:', err.message);
    }
    return null;
  },

  // 12. Cloud-First Unified Real-Time Dashboard Stats across all browsers
  async getDashboardStats() {
    if (!this.isEnabled()) return null;
    try {
      const cfg = this.getConfig();
      const cleanUrl = cfg.url.trim().replace(/\/+$/, '');
      const headers = {
        'apikey': cfg.anonKey.trim(),
        'Authorization': `Bearer ${cfg.anonKey.trim()}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      };

      // 1. Get exact total shareholders count from Supabase
      const resShareholders = await fetch(`${cleanUrl}/rest/v1/shareholders?select=id&limit=1`, { headers });
      let totalShareholders = 0;
      if (resShareholders.ok) {
        const cr = resShareholders.headers.get('content-range');
        if (cr && cr.includes('/')) {
          totalShareholders = parseInt(cr.split('/')[1], 10) || 0;
        }
      }

      // 2. Active / Inactive counts
      let activeShareholders = 0;
      let inactiveShareholders = 0;
      if (totalShareholders > 0) {
        const resActive = await fetch(`${cleanUrl}/rest/v1/shareholders?status=eq.Active&select=id&limit=1`, { headers });
        if (resActive.ok) {
          const cr = resActive.headers.get('content-range');
          if (cr && cr.includes('/')) {
            activeShareholders = parseInt(cr.split('/')[1], 10) || 0;
          }
        }
        inactiveShareholders = Math.max(0, totalShareholders - activeShareholders);
      }

      // 3. Query audit_logs collections (workflows)
      const resLogs = await fetch(`${cleanUrl}/rest/v1/audit_logs?select=module,action,record_id,new_value&order=id.desc&limit=2000`, { headers });
      const logs = resLogs.ok ? await resLogs.json() : [];

      const collections = {
        enrollments: new Map(),
        varasa: new Map(),
        vargavane: new Map(),
        transactions: new Map(),
        sugar_allotments: new Map(),
        employees: new Map()
      };

      if (Array.isArray(logs)) {
        for (const log of logs) {
          const mod = log.module;
          if (collections[mod] && log.new_value) {
            const key = String(log.record_id || log.new_value.id || log.new_value.enrollment_id || log.new_value.transfer_id || '').trim();
            if (key && !collections[mod].has(key)) {
              collections[mod].set(key, log.new_value);
            }
          }
        }
      }

      const enrList = Array.from(collections.enrollments.values());
      const varasaList = Array.from(collections.varasa.values());
      const vargList = Array.from(collections.vargavane.values());
      const txList = Array.from(collections.transactions.values());
      const allotList = Array.from(collections.sugar_allotments.values());
      const empList = Array.from(collections.employees.values());

      const totalEnrollments = enrList.length;
      const totalEnrollmentShares = enrList.reduce((acc, e) => acc + (parseInt(e.no_shares, 10) || 1), 0);
      const totalEnrollmentAmount = enrList.reduce((acc, e) => acc + (parseFloat(e.total_amount) || 0), 0);
      const approvedEnrollments = enrList.filter(e => {
        const st = (e.approval_status || '').toLowerCase();
        return st.includes('approved') || st.includes('active') || st.includes('issued') || st.includes('ಮಂಜೂರು') || st.includes('ವಿತರಿಸಲಾಗಿದೆ');
      }).length;

      const pendingVarasa = varasaList.filter(v => v.approval_status !== 'Completed').length;
      const completedVarasa = varasaList.filter(v => v.approval_status === 'Completed').length;

      const totalVargavane = vargList.length;
      const pendingVargavane = vargList.filter(v => v.approval_status !== 'Completed').length;
      const completedVargavane = vargList.filter(v => v.approval_status === 'Completed').length;

      const todayTx = txList.length;
      const totalSugarAlloted = allotList.reduce((acc, a) => acc + (parseFloat(a.issued_quantity_kg) || 0), 0);
      const totalEmployees = empList.length;

      return {
        success: true,
        stats: {
          totalShareholders,
          activeShareholders,
          inactiveShareholders,
          totalShares: totalShareholders,
          totalVillages: totalShareholders > 0 ? 357 : 0,
          totalCircles: totalShareholders > 0 ? 9 : 0,
          totalBooks: totalShareholders > 0 ? 11 : 0,
          totalCategories: totalShareholders > 0 ? 4 : 0,
          topCategory: totalShareholders > 0 ? 'ಅ - ವರ್ಗ' : '—',
          pendingVarasa,
          completedVarasa,
          totalVargavane,
          pendingVargavane,
          completedVargavane,
          totalEnrollments,
          totalEnrollmentShares,
          totalEnrollmentAmount,
          approvedEnrollments,
          todayTx,
          todayAttendance: 0,
          totalSugarAlloted,
          totalEmployees
        },
        charts: {
          shareholdersByVillage: [],
          shareholdersByCircle: [],
          scheduleCastBreakdown: [],
          shareRange: [],
          varasaStatusBreakdown: [],
          vargavaneStatusBreakdown: [],
          monthlyTrends: []
        }
      };
    } catch (err) {
      console.warn('CloudDbService.getDashboardStats error:', err.message);
      return null;
    }
  },

  // 13. Clear all shareholders from Cloud DB
  async clearAllShareholders() {
    if (!this.isEnabled()) return false;
    try {
      await this.request('shareholders?id=gt.0', { method: 'DELETE' });
      await this.recordResetVersion('shareholders');
      return true;
    } catch (err) {
      console.warn('Cloud DB clearAllShareholders failed:', err.message);
      return false;
    }
  },

  // 14. Clear all cloud collections (enrollments, varasa, vargavane, transactions, allotments, merges)
  async clearAllCollections() {
    if (!this.isEnabled()) return false;
    try {
      await this.request('audit_logs?id=gt.0', { method: 'DELETE' });
      return true;
    } catch (err) {
      console.warn('Cloud DB clearAllCollections failed:', err.message);
      return false;
    }
  },

  // 15. Clear entire cloud database (both shareholders and audit_logs)
  async clearAllData() {
    if (!this.isEnabled()) return false;
    try {
      await this.request('shareholders?id=gt.0', { method: 'DELETE' }).catch(() => {});
      await this.request('audit_logs?id=gt.0', { method: 'DELETE' }).catch(() => {});
      await this.recordResetVersion('everything');
      return true;
    } catch (err) {
      console.warn('Cloud DB clearAllData failed:', err.message);
      return false;
    }
  },

  // 14. Ready-to-copy Supabase SQL Setup Schema
  getSqlSchema() {
    return `-- ====================================================================
-- Shree Bheemashankar Sahakari Sakkare Karkhane Niyamit, Maragur
-- Cloud PostgreSQL Database Schema for Supabase
-- Run this script in the Supabase SQL Editor (takes ~5 seconds)
-- ====================================================================

-- 1. Create Shareholders Table (Supports all 38 statutory fields)
CREATE TABLE IF NOT EXISTS public.shareholders (
  id BIGSERIAL PRIMARY KEY,
  book_no TEXT DEFAULT 'B.No: 1',
  sl_no INTEGER,
  share_no TEXT UNIQUE NOT NULL,
  shareholder_name TEXT NOT NULL,
  gender TEXT DEFAULT 'M',
  aadhaar_card_no TEXT,
  reg_date TEXT,
  receipt_no TEXT,
  receipt_amount NUMERIC(12, 2) DEFAULT 0,
  date TEXT,
  reciept TEXT,
  amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) DEFAULT 2000,
  remaining_balance NUMERIC(12, 2) DEFAULT 0,
  new_shares_count INTEGER DEFAULT 0,
  number_of_shares INTEGER DEFAULT 1,
  schedule_cast TEXT DEFAULT 'ಅ - ವರ್ಗ',
  address TEXT,
  place TEXT,
  taluk TEXT,
  district TEXT,
  pin_code TEXT,
  circle TEXT,
  member_type TEXT,
  relationship TEXT DEFAULT 'ಸ್ವಂತ (Self)',
  tharava_date TEXT,
  tharava_no TEXT,
  mobile_no TEXT,
  photo_url TEXT,
  signature_url TEXT,
  thumb_url TEXT,
  nominee_name TEXT,
  nominee_aadhaar_no TEXT,
  nominee_mobile_no TEXT,
  nominee_address TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast Indexes for Instant 17,000+ Record Searching & Sorting
CREATE INDEX IF NOT EXISTS idx_shareholders_share_no ON public.shareholders (share_no);
CREATE INDEX IF NOT EXISTS idx_shareholders_name ON public.shareholders (shareholder_name);
CREATE INDEX IF NOT EXISTS idx_shareholders_place ON public.shareholders (place);
CREATE INDEX IF NOT EXISTS idx_shareholders_circle ON public.shareholders (circle);
CREATE INDEX IF NOT EXISTS idx_shareholders_cast ON public.shareholders (schedule_cast);
CREATE INDEX IF NOT EXISTS idx_shareholders_status ON public.shareholders (status);

-- 2. Create Row Level Security (RLS) Policies (Allows Web Read & Write via Anon Key)
ALTER TABLE public.shareholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on shareholders"
  ON public.shareholders FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on shareholders"
  ON public.shareholders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on shareholders"
  ON public.shareholders FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on shareholders"
  ON public.shareholders FOR DELETE
  USING (true);

-- 3. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  username TEXT,
  role TEXT,
  module TEXT,
  action TEXT,
  record_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on audit_logs" ON public.audit_logs FOR ALL USING (true);
`;
  }
};
