/**
 * Combines Tailwind CSS classes safely with proper precedence
 */
export function cn(...inputs) {
  // Simple implementation without dependencies
  return inputs.filter(Boolean).join(" ");
}

/**
 * Truncates text to a specified length and adds ellipsis
 */
export function truncateText(text, maxLength = 20) {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Handles responsive chart sizing
 */
export function getResponsiveChartDimensions(containerWidth) {
  // Base dimensions
  const dimensions = {
    margin: { top: 30, right: 30, left: 30, bottom: 30 },
    fontSize: 11,
    barSize: 20,
  };
  
  // Adjust based on container width
  if (containerWidth < 400) {
    dimensions.margin = { top: 20, right: 15, left: 15, bottom: 40 };
    dimensions.fontSize = 9;
    dimensions.barSize = 12;
  } else if (containerWidth < 600) {
    dimensions.margin = { top: 25, right: 20, left: 20, bottom: 40 };
    dimensions.fontSize = 10;
    dimensions.barSize = 16;
  }
  
  return dimensions;
}

/**
 * Format numbers with proper locale support
 */
export function formatNumber(value, options = {}) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  
  try {
    return new Intl.NumberFormat('he-IL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    }).format(value);
  } catch (error) {
    return value.toLocaleString();
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return !obj;
}

/**
 * Group array of objects by a key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

/**
 * Sort array of objects by a key
 */
export function sortBy(array, key, direction = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue, newValue) {
  if (!oldValue || oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }
  return Math.round(((newValue - oldValue) / oldValue) * 100);
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return fallback;
  }
}

/**
 * Generate random ID
 */
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if code is running in browser
 */
export function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get: (key, defaultValue = null) => {
    if (!isBrowser()) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    if (!isBrowser()) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },
  
  remove: (key) => {
    if (!isBrowser()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    if (!isBrowser()) return false;
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

/**
 * Session storage helpers with error handling
 */
export const sessionStorage = {
  get: (key, defaultValue = null) => {
    if (!isBrowser()) return defaultValue;
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    if (!isBrowser()) return false;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to sessionStorage:', error);
      return false;
    }
  },
  
  remove: (key) => {
    if (!isBrowser()) return false;
    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
      return false;
    }
  }
};

/**
 * URL manipulation helpers
 */
export const urlUtils = {
  getQueryParam: (param) => {
    if (!isBrowser()) return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },
  
  setQueryParam: (param, value) => {
    if (!isBrowser()) return;
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
  },
  
  removeQueryParam: (param) => {
    if (!isBrowser()) return;
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.pushState({}, '', url);
  }
};

/**
 * Array manipulation helpers
 */
export const arrayUtils = {
  unique: (array) => [...new Set(array)],
  
  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  shuffle: (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
  
  flatten: (array) => array.flat(Infinity),
  
  intersect: (array1, array2) => array1.filter(x => array2.includes(x)),
  
  difference: (array1, array2) => array1.filter(x => !array2.includes(x))
};

/**
 * Object manipulation helpers
 */
export const objectUtils = {
  pick: (obj, keys) => {
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  },
  
  omit: (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  },
  
  merge: (target, ...sources) => {
    return Object.assign({}, target, ...sources);
  },
  
  hasPath: (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined;
    }, obj) !== undefined;
  },
  
  getPath: (obj, path, defaultValue = undefined) => {
    const result = path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
    return result !== undefined ? result : defaultValue;
  }
};

/**
 * Date manipulation helpers
 */
export const dateUtils = {
  isValid: (date) => date instanceof Date && !isNaN(date),
  
  format: (date, format = 'YYYY-MM-DD') => {
    if (!dateUtils.isValid(date)) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },
  
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  
  diffInDays: (date1, date2) => {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  },
  
  startOfDay: (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },
  
  endOfDay: (date) => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
};

/**
 * Currency formatting helper
 */
export function formatCurrency(amount, currency = 'ILS', locale = 'he-IL') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return currency === 'ILS' ? '₪0' : '$0';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    const symbol = currency === 'ILS' ? '₪' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Performance monitoring utilities
 */
export const performance = {
  measure: (name, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds.`);
    return result;
  },
  
  measureAsync: async (name, fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds.`);
    return result;
  }
};

// Default export with all utilities
export default {
  cn,
  truncateText,
  getResponsiveChartDimensions,
  formatNumber,
  formatCurrency,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  groupBy,
  sortBy,
  calculatePercentageChange,
  safeJsonParse,
  generateId,
  isValidEmail,
  formatFileSize,
  isBrowser,
  storage,
  sessionStorage,
  urlUtils,
  arrayUtils,
  objectUtils,
  dateUtils,
  performance
};