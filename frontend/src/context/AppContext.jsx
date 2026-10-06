import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { api } from '../lib/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lowBandwidthMode, setLowBandwidthMode] = useState(() => {
    return localStorage.getItem('campus_os_low_bandwidth') === 'true';
  });

  const [language, setLanguageState] = useState(() => {
    // Always boot in English — clear any previously saved language preference
    localStorage.setItem('campus_os_lang', 'en');
    return 'en';
  });

  const [viewportMode, setViewportMode] = useState('auto'); // auto, mobile, desktop
  const [showSmsSimulator, setShowSmsSimulator] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  useEffect(() => {
    if (lowBandwidthMode) {
      document.body.classList.add('low-bandwidth-mode');
    } else {
      document.body.classList.remove('low-bandwidth-mode');
    }
    localStorage.setItem('campus_os_low_bandwidth', lowBandwidthMode);
  }, [lowBandwidthMode]);

  const toggleLowBandwidth = () => setLowBandwidthMode(prev => !prev);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('campus_os_lang', lang);
    api.updateLanguage(lang).catch(() => {});
  };

  const t = (key) => {
    const langDict = translations[language] || translations['en'];
    return langDict[key] || translations['en'][key] || key;
  };

  return (
    <AppContext.Provider value={{
      lowBandwidthMode,
      toggleLowBandwidth,
      language,
      setLanguage,
      t,
      viewportMode,
      setViewportMode,
      showSmsSimulator,
      setShowSmsSimulator,
      showVoiceModal,
      setShowVoiceModal
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
