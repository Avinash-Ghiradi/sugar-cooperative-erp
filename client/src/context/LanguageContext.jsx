import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../services/translations';
import { transliterateKannada } from '../services/kannadaTransliterate';

const LanguageContext = createContext(null);
const LANGUAGE_STORAGE_KEY = 'sugar_erp_selected_language_v1';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'kn') return saved;
    } catch (e) {}
    return 'kn'; // Default to Kannada
  });

  const setLanguage = (lang) => {
    const clean = lang === 'en' ? 'en' : 'kn';
    setLanguageState(clean);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, clean);
      window.dispatchEvent(new CustomEvent('language_changed', { detail: clean }));
    } catch (e) {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'kn' ? 'en' : 'kn');
  };

  // Translation function for UI keys
  const t = (key, fallback = '') => {
    const langDict = translations[language] || translations.kn;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English dict if not found in current language
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  // Format Shareholder Name (Phonetic English transliteration when in English mode, NO word translation)
  const formatName = (knName, engName) => {
    if (!knName && !engName) return '—';
    if (language === 'en') {
      return engName || transliterateKannada(knName);
    }
    return knName || engName || '—';
  };

  // Format Place / Village (Phonetic English transliteration when in English mode, NO word translation)
  const formatPlace = (knPlace) => {
    if (!knPlace) return '—';
    if (language === 'en') {
      return transliterateKannada(knPlace);
    }
    return knPlace;
  };

  // Format Circle Name (Phonetic English transliteration when in English mode, NO word translation)
  const formatCircle = (knCircle) => {
    if (!knCircle) return '—';
    if (language === 'en') {
      return transliterateKannada(knCircle);
    }
    return knCircle;
  };

  // Format Address (Phonetic English transliteration when in English mode, NO word translation)
  const formatAddress = (knAddr) => {
    if (!knAddr || knAddr === '—') return '—';
    if (language === 'en') {
      return transliterateKannada(knAddr);
    }
    return knAddr;
  };

  // Format Taluk
  const formatTaluk = (taluk) => {
    if (!taluk) return language === 'en' ? 'Indi' : 'ಇಂಡಿ';
    if (language === 'en') {
      return transliterateKannada(taluk);
    }
    return taluk;
  };

  // Format District
  const formatDistrict = (district) => {
    if (!district) return language === 'en' ? 'Vijayapura' : 'ವಿಜಯಪುರ';
    if (language === 'en') {
      return transliterateKannada(district);
    }
    return district;
  };

  // Format Category / ವರ್ಗ
  const formatCategory = (cat) => {
    if (!cat) return language === 'en' ? 'Class A' : 'ಅ - ವರ್ಗ';
    const str = String(cat).trim();
    if (language === 'en') {
      if (str.includes('ಅ') || str.toLowerCase().includes('a')) return 'Class A';
      if (str.includes('ಬ') || str.toLowerCase().includes('b')) return 'Class B';
      if (str.includes('ಡ') || str.toLowerCase().includes('d')) return 'Class D';
      if (str.includes('ಸಿ') || str.toLowerCase().includes('c')) return 'Class C';
      return transliterateKannada(str);
    }
    return str;
  };

  // Format Ownership / ಮಾಲೀಕತ್ವ
  const formatOwnership = (own) => {
    if (!own) return language === 'en' ? 'Self' : 'ಸ್ವಂತ (Self)';
    const str = String(own).toLowerCase();
    if (language === 'en') {
      if (str.includes('ಸ್ವಂತ') || str.includes('self')) return 'Self';
      if (str.includes('ವಾರಸಾ') || str.includes('heir') || str.includes('varasa')) return 'Varasa (Heir)';
      if (str.includes('ವರ್ಗಾವಣೆ') || str.includes('transfer') || str.includes('vargavane')) return 'Transfer (Vargavane)';
      return transliterateKannada(own);
    }
    return own;
  };

  // Format Member Type
  const formatMemberType = (type, category) => {
    if (language === 'en') {
      if (category && (category.includes('ಬ') || category.includes('ಡ'))) {
        return 'Associate Member';
      }
      return 'Cane Grower Member';
    }
    if (category && (category.includes('ಬ') || category.includes('ಡ'))) {
      return 'ಇತರೆ ಸದಸ್ಯ (Associate Member)';
    }
    return type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)';
  };

  // Format Status
  const formatStatus = (status) => {
    if (language === 'en') {
      if (String(status).toLowerCase().includes('inact') || String(status).includes('ನಿಷ್ಕ್ರಿಯ')) return 'Inactive';
      if (String(status).toLowerCase().includes('merge') || String(status).includes('ವಿಲೀನ')) return 'Merged';
      return 'Active';
    }
    if (String(status).toLowerCase().includes('inact') || String(status).includes('ನಿಷ್ಕ್ರಿಯ')) return 'ನಿಷ್ಕ್ರಿಯ';
    if (String(status).toLowerCase().includes('merge') || String(status).includes('ವಿಲೀನ')) return 'ವಿಲೀನ';
    return 'ಸಕ್ರಿಯ';
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        isEnglish: language === 'en',
        isKannada: language === 'kn',
        setLanguage,
        toggleLanguage,
        t,
        formatName,
        formatPlace,
        formatCircle,
        formatAddress,
        formatTaluk,
        formatDistrict,
        formatCategory,
        formatOwnership,
        formatMemberType,
        formatStatus,
        transliterate: transliterateKannada
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'kn',
      isEnglish: false,
      isKannada: true,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key, fallback) => fallback || key,
      formatName: (k, e) => k || e,
      formatPlace: (k) => k,
      formatCircle: (k) => k,
      formatAddress: (k) => k,
      formatTaluk: (k) => k,
      formatDistrict: (k) => k,
      formatCategory: (k) => k,
      formatOwnership: (k) => k,
      formatMemberType: (k) => k,
      formatStatus: (k) => k,
      transliterate: (k) => k
    };
  }
  return context;
}
