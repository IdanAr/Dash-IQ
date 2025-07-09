import { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';

/**
 * Custom hook for managing currency preferences
 */
export function useCurrency() {
  const [currency, setCurrency] = useState('ILS');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load currency preference from user data
   */
  const loadCurrency = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to get from cache first
      const cachedCurrency = localStorage.getItem('userCurrency');
      if (cachedCurrency) {
        setCurrency(cachedCurrency);
      }
      
      // Then get from user preferences
      const user = await User.me();
      const userCurrency = user?.display_preferences?.displayCurrency || 'ILS';
      
      if (userCurrency !== cachedCurrency) {
        setCurrency(userCurrency);
        localStorage.setItem('userCurrency', userCurrency);
      }
      
    } catch (err) {
      console.warn('Failed to load currency preference:', err);
      setError(err.message);
      
      // Fallback to cached value or default
      const fallbackCurrency = localStorage.getItem('userCurrency') || 'ILS';
      setCurrency(fallbackCurrency);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update currency preference
   */
  const updateCurrency = useCallback(async (newCurrency) => {
    try {
      // Optimistically update local state
      setCurrency(newCurrency);
      localStorage.setItem('userCurrency', newCurrency);
      
      // Update in database
      await User.updateMyUserData({
        display_preferences: {
          displayCurrency: newCurrency
        }
      });
      
      return { success: true };
      
    } catch (err) {
      console.error('Failed to update currency:', err);
      setError(err.message);
      
      // Revert on error
      const previousCurrency = localStorage.getItem('userCurrency') || 'ILS';
      setCurrency(previousCurrency);
      
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Format amount with current currency
   */
  const formatCurrency = useCallback((amount, options = {}) => {
    const defaultOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    };

    try {
      // Use Hebrew locale for ILS, English for others
      const locale = currency === 'ILS' ? 'he-IL' : 'en-US';
      return new Intl.NumberFormat(locale, defaultOptions).format(amount);
    } catch (error) {
      console.warn('Error formatting currency:', error);
      
      // Fallback formatting
      const currencySymbols = {
        'ILS': '₪',
        'USD': '$',
        'EUR': '€',
        'GBP': '£'
      };
      
      const symbol = currencySymbols[currency] || currency;
      return `${symbol}${amount.toLocaleString()}`;
    }
  }, [currency]);

  /**
   * Get currency symbol
   */
  const getCurrencySymbol = useCallback(() => {
    const symbols = {
      'ILS': '₪',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  }, [currency]);

  /**
   * Get currency info
   */
  const getCurrencyInfo = useCallback(() => {
    const currencyInfo = {
      'ILS': {
        code: 'ILS',
        symbol: '₪',
        name: 'Israeli Shekel',
        nameHe: 'שקל ישראלי',
        locale: 'he-IL'
      },
      'USD': {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        nameHe: 'דולר אמריקאי',
        locale: 'en-US'
      },
      'EUR': {
        code: 'EUR',
        symbol: '€',
        name: 'Euro',
        nameHe: 'יורו',
        locale: 'en-US'
      },
      'GBP': {
        code: 'GBP',
        symbol: '£',
        name: 'British Pound',
        nameHe: 'לירה שטרלינג',
        locale: 'en-GB'
      }
    };
    
    return currencyInfo[currency] || currencyInfo['ILS'];
  }, [currency]);

  // Load currency on mount
  useEffect(() => {
    loadCurrency();
  }, [loadCurrency]);

  return {
    currency,
    isLoading,
    error,
    updateCurrency,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyInfo,
    refreshCurrency: loadCurrency
  };
}

/**
 * Hook for formatting amounts with automatic currency detection
 */
export function useCurrencyFormatter() {
  const { formatCurrency, isLoading } = useCurrency();
  
  return {
    formatAmount: formatCurrency,
    isLoading
  };
}

/**
 * Available currencies in the system
 */
export const AVAILABLE_CURRENCIES = [
  {
    code: 'ILS',
    symbol: '₪',
    name: 'Israeli Shekel',
    nameHe: 'שקל ישראלי'
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    nameHe: 'דולר אמריקאי'
  }
];

/**
 * Get all available currencies
 */
export function getAvailableCurrencies() {
  return AVAILABLE_CURRENCIES;
}

/**
 * Validate if currency code is supported
 */
export function isValidCurrency(currencyCode) {
  return AVAILABLE_CURRENCIES.some(c => c.code === currencyCode);
}