import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/api/entities';

const UserPreferencesContext = createContext();

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    return {
      preferences: {
        displayCurrency: 'ILS',
        dateFormat: 'DD/MM/YYYY',
        theme: 'light',
        fontSize: 'medium'
      },
      updatePreferences: () => {},
      isLoading: false
    };
  }
  return context;
};

export const UserPreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    displayCurrency: 'ILS',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Load user preferences on mount
  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Apply preferences to DOM when they change
  useEffect(() => {
    applyPreferencesToDOM();
  }, [preferences]);

  const loadUserPreferences = async () => {
    // Rate limiting: don't fetch more than once every 5 seconds
    const now = Date.now();
    if (now - lastFetchTime < 5000) {
      setIsLoading(false);
      return;
    }

    try {
      const user = await User.me();
      const userPrefs = user?.display_preferences || {};
      
      const newPreferences = {
        displayCurrency: userPrefs.displayCurrency || 'ILS',
        dateFormat: userPrefs.dateFormat || 'DD/MM/YYYY',
        theme: userPrefs.theme || 'light',
        fontSize: userPrefs.fontSize || 'medium',
        highContrast: userPrefs.highContrast || false,
        reducedMotion: userPrefs.reducedMotion || false
      };
      
      setPreferences(newPreferences);
      setLastFetchTime(now);
      
      // Cache currency for immediate access
      if (typeof window !== 'undefined') {
        localStorage.setItem('userCurrency', newPreferences.displayCurrency);
        localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
      }
      
    } catch (error) {
      console.error('Error loading user preferences:', error);
      
      // Try to load from cache
      if (typeof window !== 'undefined') {
        try {
          const cachedPrefs = localStorage.getItem('userPreferences');
          if (cachedPrefs) {
            const parsed = JSON.parse(cachedPrefs);
            setPreferences(parsed);
          }
        } catch (cacheError) {
          console.error('Error loading cached preferences:', cacheError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPrefs) => {
    try {
      const updatedPrefs = { ...preferences, ...newPrefs };
      
      // Update in database
      await User.updateMyUserData({
        display_preferences: updatedPrefs
      });
      
      // Update local state
      setPreferences(updatedPrefs);
      
      // Update cache
      if (typeof window !== 'undefined') {
        localStorage.setItem('userCurrency', updatedPrefs.displayCurrency);
        localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error };
    }
  };

  const applyPreferencesToDOM = () => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Apply theme
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else if (preferences.theme === 'light') {
      root.classList.remove('dark');
    } else { // auto
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    root.classList.add(`font-${preferences.fontSize}`);

    // Apply accessibility settings
    if (preferences.highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    if (preferences.reducedMotion) {
      root.classList.add('reduced-motion-mode');
    } else {
      root.classList.remove('reduced-motion-mode');
    }
  };

  const value = {
    preferences,
    updatePreferences,
    isLoading,
    refreshPreferences: loadUserPreferences
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};