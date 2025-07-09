import React, { createContext, useState, useContext, useEffect } from 'react';

const DeviceContext = createContext({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  orientation: 'landscape'
});

export const DeviceProvider = ({ children }) => {
  // Initialize with desktop values
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape'
  });

  // Update device info when window size changes
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const orientation = width > height ? 'landscape' : 'portrait';
        
        setDeviceInfo({
          isMobile: width < 640,
          isTablet: width >= 640 && width < 1024,
          isDesktop: width >= 1024,
          orientation: orientation
        });
      }
    };

    // Set initial device info
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <DeviceContext.Provider value={deviceInfo}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => useContext(DeviceContext);