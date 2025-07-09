import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { t, formatCurrency, formatDate, formatNumber } from "@/utils/i18n";
import { useI18n } from "@/components/providers/I18nProvider";

// Localized Card Component
export function LocalizedCard({ titleKey, descriptionKey, children, className = "", ...props }) {
  const { isRTL } = useI18n();
  
  return (
    <Card 
      className={`${isRTL ? 'text-right' : 'text-left'} ${className}`} 
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    >
      {(titleKey || descriptionKey) && (
        <CardHeader>
          {titleKey && <CardTitle>{t(titleKey)}</CardTitle>}
          {descriptionKey && <CardDescription>{t(descriptionKey)}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

// Localized Button Component
export function LocalizedButton({ textKey, children, className = "", ...props }) {
  const { isRTL } = useI18n();
  
  return (
    <Button 
      className={`${isRTL ? 'text-right' : 'text-left'} ${className}`}
      {...props}
    >
      {textKey ? t(textKey) : children}
    </Button>
  );
}

// Localized Badge Component
export function LocalizedBadge({ textKey, children, className = "", ...props }) {
  const { isRTL } = useI18n();
  
  return (
    <Badge 
      className={`${isRTL ? 'text-right' : 'text-left'} ${className}`}
      {...props}
    >
      {textKey ? t(textKey) : children}
    </Badge>
  );
}

// Currency Display Component
export function CurrencyDisplay({ amount, className = "" }) {
  return (
    <span className={className}>
      {formatCurrency(amount)}
    </span>
  );
}

// Date Display Component
export function DateDisplay({ date, format = 'short', className = "" }) {
  return (
    <span className={className}>
      {formatDate(date, format)}
    </span>
  );
}

// Number Display Component
export function NumberDisplay({ number, options = {}, className = "" }) {
  return (
    <span className={className}>
      {formatNumber(number, options)}
    </span>
  );
}

// Localized Table Headers
export function LocalizedTableHeader({ columns, className = "" }) {
  const { isRTL } = useI18n();
  
  return (
    <tr className={`${isRTL ? 'text-right' : 'text-left'} ${className}`}>
      {columns.map((column, index) => (
        <th key={index} className="px-4 py-2 font-semibold">
          {typeof column === 'string' ? t(column) : column.label ? t(column.label) : column}
        </th>
      ))}
    </tr>
  );
}

// RTL-aware Flex Container
export function RTLFlexContainer({ children, className = "", reverse = false, ...props }) {
  const { isRTL } = useI18n();
  
  const shouldReverse = isRTL ? !reverse : reverse;
  const flexDirection = shouldReverse ? 'flex-row-reverse' : 'flex-row';
  
  return (
    <div 
      className={`flex ${flexDirection} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Direction-aware spacing
export function DirectionalSpacing({ size = 4, direction = 'right', className = "" }) {
  const { isRTL } = useI18n();
  
  const getSpacingClass = () => {
    const spacingMap = {
      'right': isRTL ? `ml-${size}` : `mr-${size}`,
      'left': isRTL ? `mr-${size}` : `ml-${size}`,
      'start': isRTL ? `mr-${size}` : `ml-${size}`,
      'end': isRTL ? `ml-${size}` : `mr-${size}`
    };
    
    return spacingMap[direction] || '';
  };
  
  return <div className={`${getSpacingClass()} ${className}`} />;
}

export default {
  LocalizedCard,
  LocalizedButton,
  LocalizedBadge,
  CurrencyDisplay,
  DateDisplay,
  NumberDisplay,
  LocalizedTableHeader,
  RTLFlexContainer,
  DirectionalSpacing
};