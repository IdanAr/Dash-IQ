import React from 'react';
import { useI18n } from '@/components/utils/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSelector({ variant = "select", className = "" }) {
  const { currentLanguage, changeLanguage, availableLanguages } = useI18n();
  
  // Ensure availableLanguages is always an array
  const languagesArray = Array.isArray(availableLanguages) 
    ? availableLanguages 
    : Object.values(availableLanguages || {});

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const nextLang = currentLanguage === 'he' ? 'en' : 'he';
          changeLanguage(nextLang);
        }}
        className={className}
      >
        <Globe className="w-4 h-4 mr-1" />
        {currentLanguage.toUpperCase()}
      </Button>
    );
  }

  return (
    <Select value={currentLanguage} onValueChange={changeLanguage}>
      <SelectTrigger className={className}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {languagesArray.find(lang => lang.code === currentLanguage)?.nativeName || currentLanguage}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languagesArray.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.flag} {language.nativeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default LanguageSelector;