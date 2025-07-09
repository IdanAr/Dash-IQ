
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings as SettingsIcon,
  Globe,
  // Palette, // REMOVED as Appearance tab is removed
  Bell,
  Database,
  // Sun, // REMOVED as Appearance tab is removed
  // Moon, // REMOVED as Appearance tab is removed
  // Monitor, // REMOVED as Appearance tab is removed
  Save,
  AlertTriangle,
  Trash2, // Using Trash2 for delete actions
  Loader2 // Added Loader2 for loading spinners
} from "lucide-react";
import { User as UserEntity } from "@/api/entities";
import { t, getCurrentLanguage, isRTL, getLanguageInfo, useI18n } from '@/components/utils/i18n';
import DataSnapshotsContent from "../components/settings/DataSnapshotsContent";

// Default preferences for the useUserPreferences hook - UPDATED to remove timeZone and appearance settings
const DEFAULT_USER_DISPLAY_PREFERENCES = {
  displayCurrency: "ILS",
  dateFormat: "DD/MM/YYYY",
  emailNotifications: true,
  pushNotifications: false,
  smsNotifications: false,
  budgetAlerts: true,
  monthlyReports: true,
  transactionAlerts: false,
};

/**
 * Custom hook to manage user display preferences.
 * Handles loading, updating, and providing access to user display settings.
 */
const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(DEFAULT_USER_DISPLAY_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await UserEntity.me();
      if (user.display_preferences) {
        // Map API response to flat preferences state, removing timeZone and appearance settings
        setPreferences(prev => ({
          ...DEFAULT_USER_DISPLAY_PREFERENCES, // Start with defaults
          displayCurrency: user.display_preferences.displayCurrency ?? DEFAULT_USER_DISPLAY_PREFERENCES.displayCurrency,
          dateFormat: user.display_preferences.dateFormat ?? DEFAULT_USER_DISPLAY_PREFERENCES.dateFormat,
          // Overlay and flatten notification preferences
          emailNotifications: user.display_preferences.notifications?.email ?? DEFAULT_USER_DISPLAY_PREFERENCES.emailNotifications,
          pushNotifications: user.display_preferences.notifications?.push ?? DEFAULT_USER_DISPLAY_PREFERENCES.pushNotifications,
          smsNotifications: user.display_preferences.notifications?.sms ?? DEFAULT_USER_DISPLAY_PREFERENCES.smsNotifications,
          budgetAlerts: user.display_preferences.notifications?.budgetAlerts ?? DEFAULT_USER_DISPLAY_PREFERENCES.budgetAlerts,
          monthlyReports: user.display_preferences.notifications?.monthlyReports ?? DEFAULT_USER_DISPLAY_PREFERENCES.monthlyReports,
          transactionAlerts: user.display_preferences.notifications?.transactionAlerts ?? DEFAULT_USER_DISPLAY_PREFERENCES.transactionAlerts,
        }));
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('errors.loadingData'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  /**
   * Updates user preferences on the server and locally.
   * Takes a partial object of preferences to update.
   */
  const updatePreferences = async (newPreferencesPartial) => {
    setIsSaving(true);
    let success = false;
    const previousPreferences = preferences; // Store current state for potential rollback

    // Optimistically update local state
    const updatedPreferencesState = { ...preferences, ...newPreferencesPartial };
    setPreferences(updatedPreferencesState);

    try {
      // Map flat preferences state back to API structure, removing timeZone and appearance settings
      const updatedDisplayPreferences = {
        displayCurrency: updatedPreferencesState.displayCurrency,
        dateFormat: updatedPreferencesState.dateFormat,
        notifications: {
          email: updatedPreferencesState.emailNotifications,
          push: updatedPreferencesState.pushNotifications,
          sms: updatedPreferencesState.smsNotifications,
          budgetAlerts: updatedPreferencesState.budgetAlerts,
          monthlyReports: updatedPreferencesState.monthlyReports,
          transactionAlerts: updatedPreferencesState.transactionAlerts
        }
      };

      const updatePayload = {
        display_preferences: updatedDisplayPreferences
      };

      await UserEntity.updateMyUserData(updatePayload);
      success = true;
      return { success: true };
    } catch (error) {
      console.error("Error saving user preferences:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('errors.savingData'),
      });
      // Rollback local state on error
      setPreferences(previousPreferences);
      return { success: false, error: error };
    } finally {
      setIsSaving(false);
    }
  };

  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  return { preferences, isLoading, isSaving, updatePreferences, refreshPreferences };
};

/**
 * Component for General Settings tab.
 * Manages currency and date format.
 * Saves changes immediately upon interaction.
 */
const GeneralSettings = () => {
  const { preferences, updatePreferences, refreshPreferences, isLoading: preferencesLoading, isSaving: preferencesSaving } = useUserPreferences();
  const { toast } = useToast();

  // Combined loading state for UI (saving and initial load)
  const isComponentBusy = preferencesLoading || preferencesSaving;

  const handleSave = async (newPreferencesPartial) => {
    const result = await updatePreferences(newPreferencesPartial);
    if (result.success) {
      toast({
        title: t('toast.success'),
        description: t('toast.settingsSaved'),
      });
      
      // Special handling for currency change
      if (newPreferencesPartial.displayCurrency && newPreferencesPartial.displayCurrency !== preferences.displayCurrency) {
        toast({
          title: t('toast.success'),
          description: t('toast.currencyChanged'),
        });
        
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 1000);
      }
    }
    // Error handling is already done within updatePreferences hook
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.general')}</CardTitle>
        <CardDescription>{t('settings.generalDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Currency Selection - UPDATED to only include ILS and USD */}
        <div className="space-y-2">
          <Label htmlFor="currency-select">{t('settings.selectCurrency')}</Label>
          <Select
            value={preferences.displayCurrency}
            onValueChange={(value) => {
              handleSave({ displayCurrency: value });
            }}
            disabled={isComponentBusy}
          >
            <SelectTrigger id="currency-select" className="w-full">
              <SelectValue placeholder={t('settings.selectCurrency')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ILS">
                <div className="flex items-center gap-2">
                  <span>₪</span>
                  <span>{t('currencies.ILS', 'Israeli Shekel')}</span>
                </div>
              </SelectItem>
              <SelectItem value="USD">
                <div className="flex items-center gap-2">
                  <span>$</span>
                  <span>{t('currencies.USD', 'US Dollar')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings.currencyDescription')}
          </p>
        </div>

        {/* Date Format */}
        <div className="space-y-2">
          <Label htmlFor="dateFormat-select">{t('settings.selectDateFormat')}</Label>
          <Select
            value={preferences.dateFormat}
            onValueChange={(value) => handleSave({ dateFormat: value })}
            disabled={isComponentBusy}
          >
            <SelectTrigger id="dateFormat-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Zone - REMOVED */}
      </CardContent>
    </Card>
  );
};


export default function Settings() {
  const { toast } = useToast();
  const { currentLanguage, changeLanguage, availableLanguages } = useI18n();

  // Use the new useUserPreferences hook for all display-related settings
  const { preferences, isLoading: preferencesLoading, isSaving: preferencesSaving, updatePreferences } = useUserPreferences();

  // Ensure availableLanguages is always an array for mapping
  const languagesArray = Array.isArray(availableLanguages)
    ? availableLanguages
    : Object.values(availableLanguages || {});

  const [isLanguageSaving, setIsLanguageSaving] = useState(false); // Only for language
  const [activeTab, setActiveTab] = useState("general");
  const isRTLLayout = isRTL();

  // Language remains a separate state as it's directly tied to i18n context
  const [language, setLanguage] = useState(currentLanguage);

  useEffect(() => {
    // Set initial language from i18n context after it's loaded
    setLanguage(currentLanguage);
  }, [currentLanguage]);

  const saveLanguagePreferences = async () => {
    setIsLanguageSaving(true);
    try {
      if (language !== currentLanguage) {
        changeLanguage(language);
        toast({
          title: t('toast.success'),
          description: t('toast.languageChanged'),
        });
      } else {
        toast({
          title: t('toast.info'),
          description: t('settings.noLanguageChange'),
        });
      }
    } catch (error) {
      console.error("Error saving language preferences:", error);
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: t('toast.serverError'),
      });
    } finally {
      setIsLanguageSaving(false);
    }
  };

  // Handler for clean state success
  const handleCleanStateSuccess = (result) => {
    if (result.success) {
      const totalDeleted = result.deletedCounts.transactions + result.deletedCounts.budgets + result.deletedCounts.categories;

      if (totalDeleted > 0) {
        toast({
          title: t('toast.cleanState.successTitle'),
          description: t('toast.cleanState.successDescription', {
            totalDeleted,
            transactions: result.deletedCounts.transactions || 0,
            budgets: result.deletedCounts.budgets || 0,
            categories: result.deletedCounts.categories || 0
          }),
          duration: 8000,
        });
      } else {
        toast({
          title: t('toast.cleanState.noDataDeletedTitle'),
          description: t('toast.cleanState.noDataDeletedDescription'),
        });
      }

      if (result.categoriesRestored && result.categoriesRestored.count > 0) {
        setTimeout(() => {
          toast({
            title: t('toast.cleanState.categoriesRestoredTitle'),
            description: t('toast.cleanState.categoriesRestoredDescription', {
              count: result.categoriesRestored.count
            }),
            duration: 6000,
          });
        }, 2000);
      }

      // Force page reload after showing success message
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 3000);
    }
  };

  // Overall loading state for the main component
  const isLoadingOverall = preferencesLoading;

  if (isLoadingOverall) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('settings.subtitle')}</p>
        </div>
        {/* Main Save button now only saves language, as other settings save on change */}
        <Button
          onClick={saveLanguagePreferences}
          disabled={isLanguageSaving || preferencesSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLanguageSaving ? t('common.loading') : t('common.save')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Changed grid-cols from 5 to 4 and removed Appearance tab trigger */}
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Globe className="w-4 h-4 mr-2" />
            {t('settings.tabs.general')}
          </TabsTrigger>
          {/* Appearance Tab Trigger REMOVED */}
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            {t('settings.tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="w-4 h-4 mr-2" />
            {t('settings.tabs.backup')}
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {t('settings.tabs.advanced')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings /> {/* Use the new GeneralSettings component */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.languageSettings')}</CardTitle>
              <CardDescription>{t('settings.languageDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Settings */}
              <div className="space-y-2">
                <Label htmlFor="language-select">{t('settings.selectLanguage')}</Label>
                <Select value={language} onValueChange={setLanguage} disabled={preferencesSaving}>
                  <SelectTrigger id="language-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languagesArray.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab Content REMOVED */}

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notifications')}</CardTitle>
              <CardDescription>{t('settings.notificationsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications-switch">{t('settings.emailNotifications')}</Label>
                <Switch
                  id="emailNotifications-switch"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(value) => updatePreferences({ emailNotifications: value })}
                  disabled={preferencesSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pushNotifications-switch">{t('settings.pushNotifications')}</Label>
                <Switch
                  id="pushNotifications-switch"
                  checked={preferences.pushNotifications}
                  onCheckedChange={(value) => updatePreferences({ pushNotifications: value })}
                  disabled={preferencesSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="smsNotifications-switch">{t('settings.smsNotifications')}</Label>
                <Switch
                  id="smsNotifications-switch"
                  checked={preferences.smsNotifications}
                  onCheckedChange={(value) => updatePreferences({ smsNotifications: value })}
                  disabled={preferencesSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="budgetAlerts-switch">{t('settings.budgetAlerts')}</Label>
                <Switch
                  id="budgetAlerts-switch"
                  checked={preferences.budgetAlerts}
                  onCheckedChange={(value) => updatePreferences({ budgetAlerts: value })}
                  disabled={preferencesSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="monthlyReports-switch">{t('settings.monthlyReports')}</Label>
                <Switch
                  id="monthlyReports-switch"
                  checked={preferences.monthlyReports}
                  onCheckedChange={(value) => updatePreferences({ monthlyReports: value })}
                  disabled={preferencesSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="transactionAlerts-switch">{t('settings.transactionAlerts')}</Label>
                <Switch
                  id="transactionAlerts-switch"
                  checked={preferences.transactionAlerts}
                  onCheckedChange={(value) => updatePreferences({ transactionAlerts: value })}
                  disabled={preferencesSaving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab Content - Simplified */}
        <TabsContent value="backup" className="space-y-6">
          <DataSnapshotsContent />
        </TabsContent>

        {/* Advanced Tab Content - Modified */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                {t('settings.advanced.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.advanced.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clean State Section */}
              <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                <div className="flex items-start gap-3 mb-4">
                  <Trash2 className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      {t('settings.advanced.cleanState.sectionTitle')}
                    </h3>
                    <p className="text-red-600 mb-4">
                      {t('settings.advanced.cleanState.sectionDescription')}
                    </p>

                    <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-red-800 mb-2">
                        {t('settings.advanced.cleanState.warningTitle')}:
                      </h4>
                      <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                        <li>{t('settings.advanced.cleanState.warning1')}</li>
                        <li>{t('settings.advanced.cleanState.warning2')}</li>
                        <li>{t('settings.advanced.cleanState.warning3')}</li>
                      </ul>
                    </div>

                    <RevertToCleanStateDialog
                      onSuccess={handleCleanStateSuccess}
                      trigger={
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('settings.advanced.cleanState.button')}
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Safe utility function for localStorage operations
const safeLocalStorageOperation = (operation, key = null, value = null) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available');
      return null;
    }

    switch (operation) {
      case 'clear':
        localStorage.clear();
        return true;
      case 'getItem':
        return localStorage.getItem(key);
      case 'setItem':
        localStorage.setItem(key, value);
        return true;
      case 'removeItem':
        localStorage.removeItem(key);
        return true;
      default:
        return null;
    }
  } catch (error) {
    console.warn(`localStorage ${operation} operation failed:`, error);
    return null;
  }
};

function RevertToCleanStateDialog({ onSuccess, trigger }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { toast } = useToast();
  const requiredConfirmationText = "DELETE EVERYTHING";

  const handleRevert = async () => {
    if (confirmationText !== requiredConfirmationText) {
      toast({
        title: t('toast.cleanState.confirmationError'),
        description: t('toast.cleanState.confirmationDescription', { requiredText: requiredConfirmationText }),
        variant: "destructive",
      });
      return;
    }

    setIsReverting(true);

    try {
      console.log('Starting complete clean state revert...');

      toast({
        title: t('toast.cleanState.startingTitle'),
        description: t('toast.cleanState.startingDescription'),
        duration: 8000,
      });

      const { revertToCleanState } = await import("@/api/functions");
      const response = await revertToCleanState();

      console.log('Full clean state revert response:', response);

      if (response && response.data && response.data.success) {
        setIsOpen(false);
        setConfirmationText('');

        safeLocalStorageOperation('clear');

        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        const errorMsg = response?.data?.error || response?.error || t('common.unknownError');
        throw new Error(errorMsg);
      }

    } catch (error) {
      console.error('Error during clean state revert:', error);

      let errorMessage = t('toast.cleanState.errorGeneral');

      if (error.message?.includes('Rate limit')) {
        errorMessage = t('toast.cleanState.errorRateLimit');
      } else if (error.message?.includes('500') || error.message?.includes('502')) {
        errorMessage = t('toast.cleanState.errorServer');
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: t('toast.cleanState.errorTitle'),
        description: errorMessage,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <>
      {React.cloneElement(trigger, { onClick: () => setIsOpen(true), disabled: isReverting })}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-red-800">{t('settings.dialogs.cleanState.title')}</h3>
            </div>

            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 mb-2">
                <strong>{t('settings.dialogs.cleanState.warningHeader')}</strong>
              </p>
              <ul className="text-xs text-red-600 space-y-1">
                <li>{t('settings.dialogs.cleanState.warning1')}</li>
                <li>{t('settings.dialogs.cleanState.warning2')}</li>
                <li>{t('settings.dialogs.cleanState.warning3')}</li>
                <li>{t('settings.dialogs.cleanState.warning4')}</li>
                <li>{t('settings.dialogs.cleanState.warning5')}</li>
                <li>{t('settings.dialogs.cleanState.warning6')}</li>
              </ul>
              <p className="text-sm text-red-700 mt-2 font-medium">
                {t('settings.dialogs.cleanState.irreversibleWarning')}
              </p>
            </div>

            <div className="mb-4">
              <Label className="text-red-800 font-medium">{t('settings.dialogs.cleanState.confirmationLabel', { requiredText: requiredConfirmationText })}</Label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full mt-1 p-2 border rounded focus:border-red-500"
                placeholder={requiredConfirmationText}
                disabled={isReverting}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isReverting}>
                {t('settings.dialogs.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleRevert} disabled={isReverting}>
                {isReverting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('settings.dialogs.cleanState.loadingButton')}
                  </div>
                ) : (
                  t('settings.dialogs.cleanState.confirmButton')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
