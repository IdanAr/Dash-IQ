import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context for accessibility settings
const AccessibilityContext = createContext({
  settings: {},
  updateSettings: () => {},
  resetSettings: () => {}
});

// Default settings
const defaultSettings = {
  fontSize: 'medium', // small, medium, large, x-large
  letterSpacing: 'normal', // normal, increased, wide
  contrast: 'normal', // normal, high, inverted
  background: 'light', // light, dark
  fontFamily: 'default', // default, dyslexic
  animations: true, // enable/disable animations
  highlightTitles: false, // highlight headings
  highlightLinks: false, // highlight links
  readableFont: false, // simplified layout with more readable font
  keyboardNavigation: false, // enhanced keyboard navigation
  focusIndicators: true, // show focus indicators
  soundMuted: false, // mute all sounds
  textToSpeech: false, // enable text-to-speech
};

// Helper function to load settings from localStorage
const loadSettings = () => {
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  } catch (error) {
    console.error('Error loading accessibility settings:', error);
    return defaultSettings;
  }
};

// Provider component
export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  
  // Load settings on mount
  useEffect(() => {
    const savedSettings = loadSettings();
    setSettings(savedSettings);
    applySettings(savedSettings);
  }, []);
  
  // Function to apply settings to the DOM
  const applySettings = (currentSettings) => {
    if (typeof document === 'undefined') return;
    
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    // Apply font size
    bodyElement.classList.remove('a11y-text-small', 'a11y-text-medium', 'a11y-text-large', 'a11y-text-xlarge');
    bodyElement.classList.add(`a11y-text-${currentSettings.fontSize}`);
    
    // Apply letter spacing
    bodyElement.classList.remove('a11y-letter-spacing-normal', 'a11y-letter-spacing-increased', 'a11y-letter-spacing-wide');
    bodyElement.classList.add(`a11y-letter-spacing-${currentSettings.letterSpacing}`);
    
    // Apply contrast
    bodyElement.classList.remove('a11y-high-contrast', 'a11y-inverted');
    if (currentSettings.contrast === 'high') bodyElement.classList.add('a11y-high-contrast');
    if (currentSettings.contrast === 'inverted') bodyElement.classList.add('a11y-inverted');
    
    // Apply background
    bodyElement.classList.remove('a11y-force-light', 'a11y-force-dark');
    bodyElement.classList.add(`a11y-force-${currentSettings.background}`);
    
    // Apply font family
    bodyElement.classList.toggle('a11y-dyslexic-font', currentSettings.fontFamily === 'dyslexic');
    bodyElement.classList.toggle('a11y-adjust-font', currentSettings.fontFamily !== 'default');
    
    // Apply animations setting
    bodyElement.classList.toggle('a11y-reduce-motion', !currentSettings.animations);
    
    // Apply content assistance
    bodyElement.classList.toggle('a11y-highlight-titles', currentSettings.highlightTitles);
    bodyElement.classList.toggle('a11y-highlight-links', currentSettings.highlightLinks);
    bodyElement.classList.toggle('a11y-readable-font', currentSettings.readableFont);
    
    // Apply navigation aids
    bodyElement.classList.toggle('a11y-keyboard-nav', currentSettings.keyboardNavigation);
    bodyElement.classList.toggle('a11y-focus-indicators', currentSettings.focusIndicators);
    
    // Apply text adjustments
    bodyElement.classList.toggle('a11y-adjust-text', true); // Always enable text adjustments
    bodyElement.classList.toggle('a11y-adjust-spacing', true); // Always enable spacing adjustments
  };
  
  // Update settings
  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibilitySettings', JSON.stringify(updatedSettings));
    }
    
    // Apply updated settings
    applySettings(updatedSettings);
  };
  
  // Reset to default settings
  const resetSettings = () => {
    setSettings(defaultSettings);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibilitySettings', JSON.stringify(defaultSettings));
    }
    
    // Apply default settings
    applySettings(defaultSettings);
  };
  
  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook for using accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};