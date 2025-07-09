
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { DeviceProvider } from '@/components/utils/DeviceContext';
import { AccessibilityProvider } from '@/components/utils/AccessibilityProvider';
import { I18nProvider } from '@/components/utils/i18n';
import { UserPreferencesProvider } from '@/components/utils/UserPreferencesContext'; 

export default function App({ Component, pageProps }) {
  return (
    <DeviceProvider>
      <I18nProvider>
        <UserPreferencesProvider>
          <AccessibilityProvider>
            <div className="app-container">
              <Component {...pageProps} />
              <Toaster />
            </div>
          </AccessibilityProvider>
        </UserPreferencesProvider>
      </I18nProvider>
    </DeviceProvider>
  );
}
