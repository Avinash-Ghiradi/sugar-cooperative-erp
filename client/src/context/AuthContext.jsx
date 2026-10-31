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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sugar_erp_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Disallow legacy admin account session; must login as staff
        if (parsed?.username?.toLowerCase() === 'admin' || parsed?.employee_id === 'ADMIN' || parsed?.id === 1) {
          localStorage.removeItem('sugar_erp_user');
          return null;
        }
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [activeModule, setActiveModule] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('attendance') || params.get('attn') || params.get('share_no')) {
        return 'attendance';
      }
    } catch (e) {}
    return 'dashboard';
  });
  const [activeReportSubTab, setActiveReportSubTab] = useState('shareholders');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('sugar_erp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sugar_erp_user');
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    setActiveModule('dashboard');
    showToast(`ಸ್ವಾಗತ, ${userData.name}! (${userData.role})`, 'success');
  };

  const logout = () => {
    setUser(null);
    showToast('ಲಾಗ್‌ಔಟ್ ಯಶಸ್ವಿಯಾಗಿದೆ (Logged out successfully)', 'info');
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
