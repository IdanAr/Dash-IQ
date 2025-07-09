// Performance monitoring utilities
export const performance = {
  measure: (name, fn) => {
    const start = Date.now();
    const result = fn();
    const end = Date.now();
    console.log(`${name} took ${end - start} milliseconds.`);
    return result;
  },
  
  measureAsync: async (name, fn) => {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    console.log(`${name} took ${end - start} milliseconds.`);
    return result;
  }
};

// React performance utilities
export const withPerformanceTracking = (Component, componentName) => {
  return React.memo((props) => {
    const start = Date.now();
    
    React.useEffect(() => {
      const end = Date.now();
      console.log(`${componentName} render took ${end - start}ms`);
    });

    return <Component {...props} />;
  });
};

// Debounce hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderStart = React.useRef(Date.now());
  const [renderTime, setRenderTime] = React.useState(0);

  React.useEffect(() => {
    const renderEnd = Date.now();
    const duration = renderEnd - renderStart.current;
    setRenderTime(duration);
    
    if (duration > 100) { // Log slow renders
      console.warn(`Slow render detected in ${componentName}: ${duration}ms`);
    }
  });

  React.useEffect(() => {
    renderStart.current = Date.now();
  });

  return { renderTime };
};

export default {
  performance,
  withPerformanceTracking,
  useDebounce,
  usePerformanceMonitor
};