import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const ROLE_PERMISSIONS = {
  Admin: [
    'dashboard', 'shareholders', 'enrollment', 'transactions', 'attendance',
    'sugar_allotment', 'varasa', 'vargavane', 'merge_shares', 'villages',
    'circles', 'reports', 'id_cards', 'employees', 'users', 'password_manager', 'audit_logs',
    'settings', 'import_export', 'backup'
  ],
  Cashier: [
    'dashboard', 'shareholders', 'enrollment', 'transactions', 'reports', 'merge_shares'
  ],
  'Computer Operator': [
    'dashboard', 'shareholders', 'enrollment', 'attendance', 'sugar_allotment',
    'varasa', 'vargavane', 'merge_shares', 'reports', 'id_cards', 'villages',
    'circles', 'import_export'
  ],
  'Attendance Operator': [
    'dashboard', 'attendance', 'reports'
  ],
  'Sugar Operator': [
    'dashboard', 'sugar_allotment', 'reports'
  ],
  Employee: [
    'dashboard', 'attendance', 'reports'
  ],
  Shareholder: [
    'shareholder_portal', 'shareholder_profile'
  ]
};

export const ROLE_LABELS = {
  Admin: 'Admin (ಸಂಪೂರ್ಣ ನಿರ್ವಾಹಕರು - Full Access)',
  Cashier: 'Cashier (ಮುಖ್ಯ ಖಜಾಂಚಿ - ಹಣಕಾಸು & ಷೇರು)',
  'Computer Operator': 'Computer Operator (ಕಂಪ್ಯೂಟರ್ ಆಪರೇಟರ್ - ಷೇರು, ನೋಂದಣಿ, ಸಕ್ಕರೆ, ಹಾಜರಾತಿ, ID ಕಾರ್ಡ್)',
  'Attendance Operator': 'Attendance Operator (ಹಾಜರಾತಿ ನಿರ್ವಾಹಕರು)',
  'Sugar Operator': 'Sugar Operator (ಸಕ್ಕರೆ ಹಂಚಿಕೆ ನಿರ್ವಾಹಕರು)',
  Employee: 'Employee (ಸಾಮಾನ್ಯ ಸಿಬ್ಬಂದಿ - ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ & ಹಾಜರಾತಿ)',
  Shareholder: 'Shareholder (ಷೇರುದಾರ ಸದಸ್ಯರು - ಸ್ವಂತ ವಿವರ ಮಾತ್ರ)'
};

// 10-Minute Inactivity Auto-Logout Duration (ಕನಿಷ್ಠ 10 ನಿಮಿಷ ನಿಷ್ಕ್ರಿಯತೆ)
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 600,000 ms (10 minutes)
const LAST_ACTIVITY_KEY = 'sugar_erp_last_activity';
const ACTIVE_MODULE_KEY = 'sugar_erp_active_module';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sugar_erp_user');
      if (!saved) return null;

      const parsed = JSON.parse(saved);

      // Disallow standalone legacy 'admin' mock session without employee ID
      if (parsed?.username?.toLowerCase() === 'admin' && !parsed?.employee_id && parsed?.role !== 'Admin') {
        localStorage.removeItem('sugar_erp_user');
        return null;
      }

      // Check 10-minute inactivity limit on page reload/refresh
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
      const now = Date.now();
      if (lastActivity && (now - lastActivity) > INACTIVITY_TIMEOUT_MS) {
        // Exceeded 10 minutes of inactivity
        localStorage.removeItem('sugar_erp_user');
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        return null;
      }

      // Session is valid! Keep user logged in across page refreshes
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const [activeModule, setActiveModuleState] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('attendance') || params.get('attn') || params.get('share_no')) {
        return 'attendance';
      }
      const savedModule = localStorage.getItem(ACTIVE_MODULE_KEY);
      if (savedModule) return savedModule;
    } catch (e) {}
    return 'dashboard';
  });

  const setActiveModule = (mod) => {
    setActiveModuleState(mod);
    try {
      localStorage.setItem(ACTIVE_MODULE_KEY, mod);
    } catch (e) {}
  };

  const [activeReportSubTab, setActiveReportSubTab] = useState('shareholders');
  const [toastMessage, setToastMessage] = useState(null);

  // Sync user state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('sugar_erp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sugar_erp_user');
    }
  }, [user]);

  // Live 10-minute inactivity detection & auto-logout
  useEffect(() => {
    if (!user) return;

    // Track user interaction (mouse, touch, keyboard, scroll, clicks)
    let lastRecorded = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle localStorage updates to at most once every 10 seconds for high performance
      if (now - lastRecorded > 10000) {
        lastRecorded = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check inactivity every 15 seconds
    const interval = setInterval(() => {
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
      const now = Date.now();
      if (lastActivity && (now - lastActivity) >= INACTIVITY_TIMEOUT_MS) {
        logout('ನಿಷ್ಕ್ರಿಯತೆಯ ಕಾರಣದಿಂದ ಲಾಗ್‌ಔಟ್ ಮಾಡಲಾಗಿದೆ (Auto-logged out due to 10 minutes of inactivity).');
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      events.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [user]);

  const login = (userData) => {
    const now = Date.now();
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    setUser(userData);
    setActiveModule('dashboard');
    showToast(`ಸ್ವಾಗತ, ${userData.name}! (${userData.role})`, 'success');
  };

  const logout = (reason = null) => {
    setUser(null);
    localStorage.removeItem('sugar_erp_user');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(ACTIVE_MODULE_KEY);
    showToast(reason || 'ಲಾಗ್‌ಔಟ್ ಯಶಸ್ವಿಯಾಗಿದೆ (Logged out successfully)', 'info');
  };

  const updateCurrentUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('sugar_erp_user', JSON.stringify(updated));
      return updated;
    });
  };

  const hasPermission = (moduleName) => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(moduleName);
  };

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateCurrentUser,
      activeModule,
      setActiveModule,
      activeReportSubTab,
      setActiveReportSubTab,
      hasPermission,
      showToast,
      toastMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
