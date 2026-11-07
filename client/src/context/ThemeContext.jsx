import React, { createContext, useContext, useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'sugar_erp_theme_mode';

const defaultFallbackTheme = {
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
  isLight: false
};

const ThemeContext = createContext(defaultFallbackTheme);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark'; // Default to dark mode
  });

  const applyTheme = (t) => {
    try {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(t);
      root.setAttribute('data-theme', t);
      root.style.colorScheme = t;
    } catch (e) {}
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    const val = newTheme === 'light' ? 'light' : 'dark';
    setThemeState(val);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, val);
      window.dispatchEvent(new CustomEvent('theme_changed', { detail: val }));
    } catch (e) {}
    applyTheme(val);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, isLight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context || defaultFallbackTheme;
}
