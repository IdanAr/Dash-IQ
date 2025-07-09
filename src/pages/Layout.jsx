

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { useDevice } from "@/components/utils/DeviceContext";
import MobileNavbar from "@/components/mobile/MobileNavbar";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ErrorBoundary from "@/components/ErrorBoundary";
import FinancialAssistantEnhanced from "@/components/ai/FinancialAssistantEnhanced";
import { LanguageSelector } from "@/components/ui/language-selector";
import { t, getCurrentLanguage, isRTL, getLanguageInfo, useI18n } from "@/components/utils/i18n";
import UserProfileButton from "@/components/ui/user-profile-button";
import { UserPreferencesProvider } from "@/components/utils/UserPreferencesContext";
import {
  AlertCircle,
  LayoutDashboard,
  Upload,
  FolderOpen,
  Settings,
  PiggyBank,
  Info,
  FolderTree,
  BookmarkIcon,
  ChevronRight,
  ChevronLeft,
  Menu,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
  Trophy,
  Target,
  Brain,
  Database,
  LogOut
} from "lucide-react";
import AccessibilityWidget from "@/components/accessibility/AccessibilityWidget";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const { isMobile, isTablet } = useDevice();
  const [networkError, setNetworkError] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true"
  );
  const [isAdditionalToolsOpen, setIsAdditionalToolsOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const currentLang = getCurrentLanguage();
  const isRTLLayout = isRTL();
  const langInfo = getLanguageInfo();

  const { currentLanguage, changeLanguage, availableLanguages } = useI18n();
  
  const languagesArray = Array.isArray(availableLanguages) 
    ? availableLanguages 
    : Object.values(availableLanguages || {});

  // Load current user data with rate limiting protection
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        // Add a small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        if (console && console.warn) {
          console.warn('Error loading current user:', error);
        }
        // Check if it's a rate limiting error (e.g., status 429)
        // Note: Error object from User.me() might not directly expose status.
        // We're assuming the error message might contain '429' or similar indicator from a fetch/axios response.
        if (error.message && error.message.includes('429')) { 
          // Wait a bit longer and retry once
          setTimeout(async () => {
            try {
              const user = await User.me();
              setCurrentUser(user);
            } catch (retryError) {
              if (console && console.warn) {
                console.warn('Retry failed for loading current user:', retryError);
              }
            }
          }, 2000);
        }
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    const handleOnline = () => setNetworkError(false);
    const handleOffline = () => setNetworkError(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setNetworkError(!window.navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    if (!isSidebarCollapsed) {
      setIsAdditionalToolsOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

      toast({
        title: t('auth.signingOut'),
        description: t('auth.signingOutDescription'),
        duration: 2000,
      });

      await User.logout();

      localStorage.removeItem('sidebarCollapsed');
      localStorage.removeItem('userInitialized');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('financialInsights') || key.startsWith('userPreferences')) {
          localStorage.removeItem(key);
        }
      });

      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

    } catch (error) {
      console.error('Error during sign out:', error);
      setIsSigningOut(false);

      toast({
        variant: "destructive",
        title: t('auth.signOutError'),
        description: t('auth.signOutErrorDescription'),
      });
    }
  };

  const handleSettingsClick = () => {
    navigate(createPageUrl('Settings'));
  };

  const menuItems = [
    { icon: "LayoutDashboard", label: t('navigation.dashboard'), page: "Dashboard" },
    { icon: "Upload", label: t('navigation.upload'), page: "Upload" },
    { icon: "FolderOpen", label: t('navigation.transactions'), page: "Transactions" },
    { icon: "PiggyBank", label: t('navigation.budget'), page: "Budget" },
    { icon: "FolderTree", label: t('navigation.categoryManagement'), page: "CategoryManagement" },
    { icon: "Info", label: t('navigation.insights'), page: "Insights" },
    { icon: "Brain", label: t('aiAssistant.title'), page: null, isAIAssistant: true }
  ];

  const additionalToolsItems = [
    { icon: "TrendingUp", label: t('navigation.forecast'), page: "Forecast" },
    { icon: "Users", label: t('navigation.peerComparison'), page: "PeerComparison" },
    { icon: "Trophy", label: t('navigation.successStories'), page: "SuccessStories" },
    { icon: "Target", label: t('navigation.savings'), page: "Savings" }
  ];

  const settingsMenuItem = { icon: "Settings", label: t('navigation.settings'), page: "Settings" };

  const iconMap = {
    LayoutDashboard,
    Upload,
    FolderOpen,
    Settings,
    PiggyBank,
    Info,
    FolderTree,
    BookmarkIcon,
    TrendingUp,
    Users,
    Trophy,
    Target,
    Menu,
    ChevronDown,
    ChevronUp,
    Brain,
    Database,
    LogOut
  };

  if (isMobile || isTablet) {
    return (
      <UserPreferencesProvider>
        <div className={`min-h-screen bg-white text-black ${isRTLLayout ? 'rtl' : 'ltr'}`} dir={langInfo.direction}>
          <MobileNavbar
            currentPageName={currentPageName}
            menuItems={[...menuItems, ...additionalToolsItems, settingsMenuItem]}
            onSignOut={handleSignOut}
            isSigningOut={isSigningOut}
          />

          <div className={`fixed bottom-20 ${isRTLLayout ? 'right-4' : 'left-4'} z-40`}>
            <Button
              onClick={() => setIsAIAssistantOpen(true)}
              className="rounded-full w-14 h-14 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 shadow-lg border-2 border-yellow-300"
              title={t('aiAssistant.title')}
            >
              <Brain className="w-6 h-6 text-yellow-900" />
            </Button>
          </div>

          <main className="pb-20">
            {networkError && (
              <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('errors.network')}
                </AlertDescription>
              </Alert>
            )}
            <div className="p-4">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>

          <FinancialAssistantEnhanced
            isOpen={isAIAssistantOpen}
            onClose={() => setIsAIAssistantOpen(false)}
          />
          <AccessibilityWidget />
        </div>
      </UserPreferencesProvider>
    );
  }

  return (
    <UserPreferencesProvider>
      <div className={`flex h-screen bg-white text-black ${isRTLLayout ? 'rtl' : 'ltr'}`} dir={langInfo.direction}>
        <aside
          className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} ${isRTLLayout ? 'border-r' : 'border-l'} border-gray-200 bg-gray-50 text-gray-800 transition-all duration-300 ease-in-out flex flex-col`}
          aria-label={t('navigation.dashboard')}
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-200">
            {!isSidebarCollapsed && (
              <div className="flex items-center justify-between w-full">
                <h1 className="text-xl font-bold">{t('dashboard.title')}</h1>
                <UserProfileButton
                  user={currentUser}
                  onSettingsClick={handleSettingsClick}
                  onSignOut={handleSignOut}
                  variant="compact"
                  showRole={false}
                  isLoading={isSigningOut}
                  className="ml-2"
                />
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className={`p-1 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors ${!isSidebarCollapsed ? "" : "ml-auto"}`}
              aria-label={isSidebarCollapsed ? t('common.expand') : t('common.collapse')}
            >
              {isSidebarCollapsed ? (
                isRTLLayout ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
              ) : (
                isRTLLayout ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {isSidebarCollapsed && currentUser && (
            <div className="px-2 py-2 border-b border-gray-200">
              <div className="flex justify-center">
                <UserProfileButton
                  user={currentUser}
                  onSettingsClick={handleSettingsClick}
                  onSignOut={handleSignOut}
                  variant="compact"
                  showRole={false}
                  isLoading={isSigningOut}
                />
              </div>
            </div>
          )}

          <nav
            className={`${isSidebarCollapsed ? 'px-2' : 'px-4'} py-4 flex-1 space-y-1 overflow-y-auto`}
            aria-label={t('navigation.dashboard')}
          >
            {menuItems.map((item) => {
              const IconComponent = iconMap[item.icon];

              if (item.isAIAssistant) {
                return (
                  <button
                    key="ai-assistant"
                    onClick={() => setIsAIAssistantOpen(true)}
                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : (isRTLLayout ? 'justify-start' : 'justify-start')}
                      gap-3 px-3 py-3 rounded-lg transition-colors duration-200
                      bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 hover:from-yellow-500 hover:to-yellow-600
                      group relative w-full shadow-lg border border-yellow-300`}
                    title={t('aiAssistant.title')}
                  >
                    <Brain className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                    {!isSidebarCollapsed && <span className="font-medium">{t('aiAssistant.title')}</span>}
                    {isSidebarCollapsed && (
                      <div
                        className={`absolute ${isRTLLayout ? 'left-full' : 'right-full'} top-1/2 transform -translate-y-1/2 ${isRTLLayout ? 'ml-2' : 'mr-2'} px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300 pointer-events-none border border-gray-600`}
                        role="tooltip"
                      >
                        {t('aiAssistant.title')}
                      </div>
                    )}
                  </button>
                );
              }

              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : (isRTLLayout ? 'justify-start' : 'justify-start')}
                    gap-3 px-3 py-3 rounded-lg transition-colors duration-200
                    ${currentPageName === item.page
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "hover:bg-gray-200"}
                    group relative`}
                  title={item.label}
                  aria-current={currentPageName === item.page ? "page" : undefined}
                >
                  {IconComponent && (
                    <IconComponent
                      className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`}
                    />
                  )}
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                  {isSidebarCollapsed && (
                    <div
                      className={`absolute ${isRTLLayout ? 'left-full' : 'right-full'} top-1/2 transform -translate-y-1/2 ${isRTLLayout ? 'ml-2' : 'mr-2'} px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300 pointer-events-none border border-gray-600`}
                      role="tooltip"
                    >
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          <div
            className={`${isSidebarCollapsed ? 'px-2' : 'px-4'} py-4 border-t border-gray-200 space-y-1`}
            aria-label={t('navigation.settings')}
          >
            <div className="relative">
              <button
                onClick={() => setIsAdditionalToolsOpen(!isAdditionalToolsOpen)}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}
                  w-full gap-3 px-3 py-3 rounded-lg transition-colors duration-200
                  hover:bg-gray-200 group relative`}
                aria-expanded={isAdditionalToolsOpen}
                title={t('common.additionalTools')}
              >
                <div className="flex items-center gap-3">
                  <BookmarkIcon
                    className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`}
                  />
                  {!isSidebarCollapsed && <span>{t('common.additionalTools')}</span>}
                </div>
                {!isSidebarCollapsed && (
                  isAdditionalToolsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
                {isSidebarCollapsed && (
                  <div
                    className={`absolute ${isRTLLayout ? 'left-full' : 'right-full'} top-1/2 transform -translate-y-1/2 ${isRTLLayout ? 'ml-2' : 'mr-2'} px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300 pointer-events-none border border-gray-600`}
                    role="tooltip"
                  >
                    {t('common.additionalTools')}
                  </div>
                )}
              </button>
              {isAdditionalToolsOpen && (
                <div
                  className={`${isSidebarCollapsed
                    ? `absolute top-0 z-50 w-48 bg-gray-50 border border-gray-200 rounded-md shadow-lg ${
                        isRTLLayout
                          ? 'right-full mr-2'
                          : 'left-full ml-2'
                      }`
                    : 'mt-1 space-y-1 bg-white'
                  }`}
                >
                  {additionalToolsItems.map((item) => {
                    const IconComponent = iconMap[item.icon];
                    return (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        onClick={() => setIsAdditionalToolsOpen(false)}
                        className={`flex items-center ${isSidebarCollapsed ? 'justify-start px-3 py-2' : `justify-start ${isRTLLayout ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-2`}
                          gap-3 rounded-lg transition-colors duration-200
                          ${currentPageName === item.page
                            ? "bg-blue-600 text-white hover:bg-blue-500"
                            : "hover:bg-gray-200"}
                          group relative w-full text-sm`}
                        title={item.label}
                        aria-current={currentPageName === item.page ? "page" : undefined}
                      >
                        {IconComponent && (
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              to={createPageUrl(settingsMenuItem.page)}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : (isRTLLayout ? 'justify-start' : 'justify-start')}
                gap-3 px-3 py-3 rounded-lg transition-colors duration-200
                ${currentPageName === settingsMenuItem.page
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "hover:bg-gray-200"}
                group relative`}
              title={settingsMenuItem.label}
              aria-current={currentPageName === settingsMenuItem.page ? "page" : undefined}
            >
              <Settings
                className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`}
              />
              {!isSidebarCollapsed && <span>{settingsMenuItem.label}</span>}
              {isSidebarCollapsed && (
                <div
                  className={`absolute ${isRTLLayout ? 'left-full' : 'right-full'} top-1/2 transform -translate-y-1/2 ${isRTLLayout ? 'ml-2' : 'mr-2'} px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300 pointer-events-none border border-gray-600`}
                  role="tooltip"
                >
                  {settingsMenuItem.label}
                </div>
              )}
            </Link>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : (isRTLLayout ? 'justify-start' : 'justify-start')}
                gap-3 px-3 py-3 rounded-lg transition-colors duration-200
                hover:bg-red-50 hover:text-red-700 group relative w-full
                ${isSigningOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={t('auth.signOut')}
            >
              <LogOut
                className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isSigningOut ? 'animate-pulse' : ''}`}
              />
              {!isSidebarCollapsed && (
                <span className={isSigningOut ? 'animate-pulse' : ''}>
                  {isSigningOut ? t('auth.signingOut') : t('auth.signOut')}
                </span>
              )}
              {isSidebarCollapsed && (
                <div
                  className={`absolute ${isRTLLayout ? 'left-full' : 'right-full'} top-1/2 transform -translate-y-1/2 ${isRTLLayout ? 'ml-2' : 'mr-2'} px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300 pointer-events-none border border-gray-600`}
                  role="tooltip"
                >
                  {t('auth.signOut')}
                </div>
              )}
            </button>

            <div className={`${isSidebarCollapsed ? 'px-1' : 'px-3'} py-2`}>
              {!isSidebarCollapsed ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {t('settings.language')}
                  </div>
                  <LanguageSelector variant="select" className="w-full" />
                </div>
              ) : (
                <div className="relative group">
                  <div className="flex justify-center">
                    <LanguageSelector variant="compact" className="text-xs" />
                  </div>
                  <div
                    className={`absolute ${isRTLLayout ? 'left-full' : 'right-full'} top-1/2 transform -translate-y-1/2 ${isRTLLayout ? 'ml-2' : 'mr-2'} px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300 pointer-events-none border border-gray-600`}
                    role="tooltip"
                  >
                    {t('settings.language')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {networkError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('errors.network')}
              </AlertDescription>
            </Alert>
          )}
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>

        <FinancialAssistantEnhanced
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
        />
        <AccessibilityWidget />
      </div>
    </UserPreferencesProvider>
  );
}

