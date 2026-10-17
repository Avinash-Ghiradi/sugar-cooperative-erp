import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const ROLE_PERMISSIONS = {
  Admin: ['dashboard', 'shareholders', 'enrollment', 'transactions', 'attendance', 'sugar_allotment', 'varasa', 'vargavane', 'villages', 'circles', 'reports', 'id_cards', 'employees', 'users', 'audit_logs', 'settings', 'import_export', 'backup'],
  Cashier: ['dashboard', 'shareholders', 'enrollment', 'transactions', 'reports'],
  'Computer Operator': ['dashboard', 'shareholders', 'enrollment', 'attendance', 'sugar_allotment', 'varasa', 'vargavane', 'reports', 'id_cards', 'villages', 'circles', 'import_export'],
  Employee: ['dashboard', 'attendance', 'reports']
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sugar_erp_user');
    return saved ? JSON.parse(saved) : {
      id: 1,
      username: 'admin',
      name: 'System Administrator',
      role: 'Admin',
      employee_id: 'EMP-001'
    };
  });

  const [activeModule, setActiveModule] = useState('dashboard');
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
    showToast(`Welcome back, ${userData.name}! (${userData.role})`);
  };

  const logout = () => {
    setUser(null);
    showToast('Logged out successfully');
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
      activeModule,
      setActiveModule,
      hasPermission,
      showToast,
      toastMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
