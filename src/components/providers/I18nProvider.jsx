import React, { useEffect, useState } from 'react';
import { subscribeToLanguageChange, getCurrentLanguage, isRTL, getLanguageInfo } from '@/components/utils/i18n';

export const I18nProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [isRTLLayout, setIsRTLLayout] = useState(isRTL());

  useEffect(() => {
    const unsubscribe = subscribeToLanguageChange((newLanguage) => {
      setCurrentLanguage(newLanguage);
      setIsRTLLayout(isRTL(newLanguage));
      
      // Update document attributes
      const langInfo = getLanguageInfo(newLanguage);
      document.documentElement.lang = newLanguage;
      document.documentElement.dir = langInfo.direction;
      
      // Update body class for font selection
      document.body.className = document.body.className.replace(/lang-\w+/g, '');
      document.body.classList.add(`lang-${newLanguage}`);
      
      // Update direction class
      document.body.className = document.body.className.replace(/dir-\w+/g, '');
      document.body.classList.add(`dir-${langInfo.direction}`);
    });

    return unsubscribe;
  }, []);

  return children;
};