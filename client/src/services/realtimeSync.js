import { CloudDbService } from './cloudDb';

/**
 * RealtimeSyncService
 * Provides instantaneous real-time synchronization across all browsers,
 * tabs, windows, and devices for:
 * 1. New Shareholder Enrollment ('enrollments')
 * 2. Varasa Legal-Heir Share Transfer ('varasa')
 * 3. Vargavane Share Transfer ('vargavane')
 * 4. Master Shareholders ('shareholders')
 */
class RealtimeSyncManager {
  constructor() {
    this.subscribers = new Map(); // module -> Set of callbacks
    this.lastAuditId = null;
    this.pollIntervalMs = 2000; // 2 seconds lightweight heartbeat for cross-device sync
    this.timerId = null;
    this.broadcastChannel = null;
    this.isChecking = false;

    if (typeof window !== 'undefined') {
      // 1. Cross-tab instant communication via BroadcastChannel (0ms latency)
      if ('BroadcastChannel' in window) {
        try {
          this.broadcastChannel = new BroadcastChannel('sugar_erp_realtime_sync');
          this.broadcastChannel.onmessage = (event) => {
            const data = event?.data;
            if (data && data.module) {
              this._notifySubscribers(data.module, data);
            }
          };
        } catch (e) {
          console.warn('[RealtimeSync] BroadcastChannel init error:', e);
        }
      }

      // 2. Storage event listener (fallback cross-tab communication)
      window.addEventListener('storage', (event) => {
        if (event.key === 'sugar_erp_sync_signal' && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            if (data && data.module) {
              this._notifySubscribers(data.module, data);
            }
          } catch (e) {}
        }
      });

      // 3. Custom event for same-window / same-tab communication
      window.addEventListener('sugar_erp_local_sync', (event) => {
        const data = event?.detail;
        if (data && data.module) {
          this._notifySubscribers(data.module, data);
        }
      });

      // 4. Tab visibility and focus change - check immediately when tab becomes active!
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkCloudChanges();
        }
      });
      window.addEventListener('focus', () => {
        this.checkCloudChanges();
      });
      window.addEventListener('online', () => {
        this.checkCloudChanges();
      });

      // Start automatic cloud synchronization loop
      this.startPolling();
    }
  }

  /**
   * Broadcast a change from this browser/tab to all other tabs and listeners
   */
  notifyChange(module, action = 'UPDATE', id = null, extra = {}) {
    const payload = {
      module,
      action,
      id,
      extra,
      timestamp: Date.now()
    };

    // 1. Notify same-window subscribers immediately
    this._notifySubscribers(module, payload);

    // 2. Dispatch custom DOM event
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sugar_erp_local_sync', { detail: payload }));
      }
    } catch (e) {}

    // 3. Notify other tabs via BroadcastChannel (0ms)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (e) {}
    }

    // 4. Notify other tabs via localStorage storage event
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('sugar_erp_sync_signal', JSON.stringify(payload));
      }
    } catch (e) {}
  }

  /**
   * Subscribe a component to changes in a specific module ('enrollments', 'varasa', 'vargavane', or 'all')
   * Returns an unsubscribe function.
   */
  subscribe(module, callback) {
    if (!this.subscribers.has(module)) {
      this.subscribers.set(module, new Set());
    }
    this.subscribers.get(module).add(callback);

    // Ensure polling is active
    this.startPolling();

    // Return un-subscriber
    return () => {
      const set = this.subscribers.get(module);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.subscribers.delete(module);
        }
      }
    };
  }

  _notifySubscribers(module, data) {
    // Notify module-specific subscribers
    if (this.subscribers.has(module)) {
      this.subscribers.get(module).forEach(cb => {
        try { cb(data); } catch (err) { console.warn('[RealtimeSync] Subscriber error:', err); }
      });
    }
    // Notify wildcard 'all' subscribers
    if (this.subscribers.has('all')) {
      this.subscribers.get('all').forEach(cb => {
        try { cb(data); } catch (err) { console.warn('[RealtimeSync] Wildcard subscriber error:', err); }
      });
    }
  }

  /**
   * Query Supabase Cloud DB for the latest audit_log entry across critical modules.
   * Only transfers ~60 bytes per check!
   */
  async checkCloudChanges() {
    if (this.isChecking) return;
    if (!CloudDbService.isEnabled()) return;

    this.isChecking = true;
    try {
      const cfg = CloudDbService.getConfig();
      if (!cfg.url || !cfg.anonKey) return;
      const cleanUrl = cfg.url.trim().replace(/\/+$/, '');

      const endpoint = `${cleanUrl}/rest/v1/audit_logs?module=in.(enrollments,varasa,vargavane,shareholders)&select=id,module,timestamp&order=id.desc&limit=1`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': cfg.anonKey,
          'Authorization': `Bearer ${cfg.anonKey}`
        }
      });

      if (!res.ok) return;
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const latest = rows[0];
        const latestId = Number(latest.id);

        if (this.lastAuditId === null) {
          // Initialize baseline
          this.lastAuditId = latestId;
        } else if (latestId > this.lastAuditId) {
          // Another browser or device modified data!
          this.lastAuditId = latestId;
          this._notifySubscribers(latest.module, {
            module: latest.module,
            action: 'CLOUD_UPDATE',
            cloudAuditId: latestId,
            timestamp: Date.now()
          });
        }
      }
    } catch (err) {
      // Network hiccup - ignore silently
    } finally {
      this.isChecking = false;
    }
  }

  startPolling() {
    if (this.timerId) return;
    // Initial check
    this.checkCloudChanges();
    this.timerId = setInterval(() => {
      // Only poll when page is visible to preserve battery and network
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.checkCloudChanges();
      }
    }, this.pollIntervalMs);
  }

  stopPolling() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const RealtimeSyncService = new RealtimeSyncManager();
