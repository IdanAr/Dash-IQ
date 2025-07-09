import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  X, 
  Keyboard,
  Settings,
  RefreshCw as RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { t, isRTL } from "@/components/utils/i18n";

// Helper function to load accessibility settings from localStorage
const loadAccessibilitySettings = () => {
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  } catch (error) {
    console.error('Error loading accessibility settings:', error);
    return defaultSettings;
  }
};

// Default settings
const defaultSettings = {
  fontSize: 'medium',
  letterSpacing: 'normal',
  displayMode: 'normal',
  fontFamily: 'default',
  animations: true,
  highlightTitles: false,
  highlightLinks: false,
  readableFont: false,
  keyboardNavigation: false,
  focusIndicators: true,
  soundMuted: false,
  textToSpeech: false,
};

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  
  const isRTLLayout = isRTL();
  
  // Load settings on mount
  useEffect(() => {
    const savedSettings = loadAccessibilitySettings();
    setSettings(savedSettings);
    applyAccessibilitySettings(savedSettings);
  }, []);
  
  // Save settings when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
      applyAccessibilitySettings(settings);
    }
  }, [settings]);
  
  const applyAccessibilitySettings = (currentSettings) => {
    const bodyElement = document.body;
    
    // Apply font size
    bodyElement.classList.remove('a11y-text-small', 'a11y-text-medium', 'a11y-text-large', 'a11y-text-xlarge');
    bodyElement.classList.add(`a11y-text-${currentSettings.fontSize}`);
    
    // Apply letter spacing
    bodyElement.classList.remove('a11y-letter-spacing-normal', 'a11y-letter-spacing-increased', 'a11y-letter-spacing-wide');
    bodyElement.classList.add(`a11y-letter-spacing-${currentSettings.letterSpacing}`);
    
    // Apply display mode
    bodyElement.classList.remove('a11y-high-contrast', 'a11y-inverted', 'a11y-force-light', 'a11y-force-dark');
    if (currentSettings.displayMode === 'high-contrast') {
      bodyElement.classList.add('a11y-high-contrast');
    } else if (currentSettings.displayMode === 'inverted') {
      bodyElement.classList.add('a11y-inverted');
    } else if (currentSettings.displayMode === 'force-dark') {
      bodyElement.classList.add('a11y-force-dark');
    } else {
      bodyElement.classList.add('a11y-force-light');
    }

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
    bodyElement.classList.toggle('a11y-adjust-text', true);
    bodyElement.classList.toggle('a11y-adjust-spacing', true);
    
    // Load OpenDyslexic font if needed
    if (currentSettings.fontFamily === 'dyslexic' && typeof document !== 'undefined' && !document.getElementById('dyslexic-font')) {
      const fontLink = document.createElement('link');
      fontLink.id = 'dyslexic-font';
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/dist/opendyslexic/opendyslexic.css';
      document.head.appendChild(fontLink);
    } else if (currentSettings.fontFamily !== 'dyslexic' && typeof document !== 'undefined' && document.getElementById('dyslexic-font')) {
      document.getElementById('dyslexic-font').remove();
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Helper functions for the UI
  const toggleFontSize = (size) => updateSetting('fontSize', size);
  const toggleLetterSpacing = (spacing) => updateSetting('letterSpacing', spacing);
  const toggleTheme = (mode) => updateSetting('displayMode', mode);
  const toggleDyslexicFont = () => updateSetting('fontFamily', settings.fontFamily === 'dyslexic' ? 'default' : 'dyslexic');
  const toggleReducedMotion = () => updateSetting('animations', !settings.animations);
  const toggleHighlightTitles = () => updateSetting('highlightTitles', !settings.highlightTitles);
  const toggleHighlightLinks = () => updateSetting('highlightLinks', !settings.highlightLinks);
  const toggleReadableFont = () => updateSetting('readableFont', !settings.readableFont);

  const resetAccessibility = () => {
    setSettings(defaultSettings);
  };

  // Derived values for button states
  const currentFontSize = settings.fontSize;
  const currentLetterSpacing = settings.letterSpacing;
  const currentTheme = settings.displayMode;
  const isDyslexicFont = settings.fontFamily === 'dyslexic';
  const isReducedMotion = !settings.animations;
  const isHighlightTitles = settings.highlightTitles;
  const isHighlightLinks = settings.highlightLinks;
  const isReadableFont = settings.readableFont;

  return (
    <div className={`fixed ${isRTLLayout ? 'left-4' : 'right-4'} bottom-4 z-50`}>
      {/* Accessibility Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg mb-2"
        aria-label={t('accessibility.openPanel')}
        title={t('accessibility.openPanel')}
      >
        <Settings className="w-6 h-6 text-white" />
      </Button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div 
          className={`absolute bottom-16 ${isRTLLayout ? 'left-0' : 'right-0'} w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 a11y-panel-slide-in`}
          style={{ direction: "ltr" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{t('accessibility.title')}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              aria-label={t('accessibility.closePanel')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {/* Font Size Controls */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                {t('accessibility.fontSize')}
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={currentFontSize === 'small' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFontSize('small')}
                  className="flex-1"
                >
                  {t('accessibility.small')}
                </Button>
                <Button
                  variant={currentFontSize === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFontSize('medium')}
                  className="flex-1"
                >
                  {t('accessibility.medium')}
                </Button>
                <Button
                  variant={currentFontSize === 'large' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFontSize('large')}
                  className="flex-1"
                >
                  {t('accessibility.large')}
                </Button>
                <Button
                  variant={currentFontSize === 'x-large' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFontSize('x-large')}
                  className="flex-1"
                >
                  {t('accessibility.extraLarge')}
                </Button>
              </div>
            </div>

            {/* Letter Spacing */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                {t('accessibility.letterSpacing')}
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={currentLetterSpacing === 'normal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleLetterSpacing('normal')}
                  className="flex-1"
                >
                  {t('accessibility.normal')}
                </Button>
                <Button
                  variant={currentLetterSpacing === 'increased' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleLetterSpacing('increased')}
                  className="flex-1"
                >
                  {t('accessibility.increased')}
                </Button>
                <Button
                  variant={currentLetterSpacing === 'wide' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleLetterSpacing('wide')}
                  className="flex-1"
                >
                  {t('accessibility.wide')}
                </Button>
              </div>
            </div>

            {/* Theme Controls */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                {t('accessibility.displayMode')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={currentTheme === 'normal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTheme('normal')}
                >
                  {t('accessibility.normal')}
                </Button>
                <Button
                  variant={currentTheme === 'high-contrast' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTheme('high-contrast')}
                >
                  {t('accessibility.highContrast')}
                </Button>
                <Button
                  variant={currentTheme === 'inverted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTheme('inverted')}
                >
                  {t('accessibility.inverted')}
                </Button>
                <Button
                  variant={currentTheme === 'force-dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTheme('force-dark')}
                >
                  {t('accessibility.dark')}
                </Button>
              </div>
            </div>

            {/* Additional Features */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  {t('accessibility.dyslexicFont')}
                </Label>
                <Button
                  variant={isDyslexicFont ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleDyslexicFont}
                >
                  {isDyslexicFont ? t('accessibility.enabled') : t('accessibility.disabled')}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  {t('accessibility.reducedMotion')}
                </Label>
                <Button
                  variant={isReducedMotion ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleReducedMotion}
                >
                  {isReducedMotion ? t('accessibility.enabled') : t('accessibility.disabled')}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  {t('accessibility.highlightTitles')}
                </Label>
                <Button
                  variant={isHighlightTitles ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleHighlightTitles}
                >
                  {isHighlightTitles ? t('accessibility.enabled') : t('accessibility.disabled')}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  {t('accessibility.highlightLinks')}
                </Label>
                <Button
                  variant={isHighlightLinks ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleHighlightLinks}
                >
                  {isHighlightLinks ? t('accessibility.enabled') : t('accessibility.disabled')}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  {t('accessibility.readableFont')}
                </Label>
                <Button
                  variant={isReadableFont ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleReadableFont}
                >
                  {isReadableFont ? t('accessibility.enabled') : t('accessibility.disabled')}
                </Button>
              </div>

              {/* Keyboard Navigation */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  {t('accessibility.keyboardNav')}
                </Label>
                <Button
                  variant={settings.keyboardNavigation ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('keyboardNavigation', !settings.keyboardNavigation)}
                >
                  {settings.keyboardNavigation ? t('accessibility.enabled') : t('accessibility.disabled')}
                </Button>
              </div>
              
              {/* Focus Indicators */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  {t('accessibility.focusIndicators')}
                </Label>
                <Button
                  variant={settings.focusIndicators ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('focusIndicators', !settings.focusIndicators)}
                >
                  {settings.focusIndicators ? t('accessibility.enabled') : t('accessibility.disabled')}
                </Button>
              </div>
            </div>

            {/* Reset Button */}
            <div className="pt-3 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={resetAccessibility}
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('accessibility.resetAll')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}