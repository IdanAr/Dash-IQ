import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { t, isRTL } from "@/components/utils/i18n";
import { 
  Menu, 
  LayoutDashboard, 
  Upload, 
  FolderOpen, 
  Settings,
  PiggyBank,
  X,
  Home,
  Info,
  FolderTree,
  BookmarkIcon,
  Database,
  LogOut,
  Brain
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/ui/language-selector';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export default function MobileNavbar({ currentPageName, menuItems, onSignOut, isSigningOut, setIsAIAssistantOpen }) {
  const [isOpen, setIsOpen] = useState(false);
  const isRTLLayout = isRTL();

  // Map of icon names to components
  const iconMap = {
    LayoutDashboard,
    Upload,
    FolderOpen,
    Settings,
    PiggyBank,
    Info,
    FolderTree,
    BookmarkIcon,
    Home: Home,
    Database: Database,
    Brain: Brain
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 h-16" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-gray-600 hover:text-gray-900"
              aria-label={t('navigation.openMenu')}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {t('dashboard.title')}
            </h1>
          </div>
        </div>
      </div>

      {/* Side Menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side={isRTLLayout ? "right" : "left"} 
          className={`w-80 ${isRTLLayout ? 'text-right' : 'text-left'}`}
          dir={isRTLLayout ? 'rtl' : 'ltr'}
        >
          <div className="flex flex-col h-full">
            <SheetHeader className={`${isRTLLayout ? 'text-right' : 'text-left'} border-b pb-4`}>
              <SheetTitle className="text-xl font-bold">
                {t('navigation.menu')}
              </SheetTitle>
            </SheetHeader>
            
            <nav className="flex-1 py-6 space-y-2">
              {menuItems.map((item) => {
                const IconComponent = iconMap[item.icon];
                
                if (item.isAIAssistant) {
                  return (
                    <button
                      key="ai-assistant"
                      onClick={() => {
                        if (setIsAIAssistantOpen) {
                          setIsAIAssistantOpen(true);
                        }
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 hover:from-yellow-500 hover:to-yellow-600 w-full shadow-lg border border-yellow-300"
                    >
                      <Brain className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                }
                
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      currentPageName === item.page
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100"
                    }`}
                    aria-current={currentPageName === item.page ? "page" : undefined}
                  >
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            
            <div className="border-t pt-4 space-y-2">
              {/* Sign Out Section */}
              <button
                onClick={() => {
                  if (onSignOut) {
                    onSignOut();
                  }
                  setIsOpen(false);
                }}
                disabled={isSigningOut}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-red-50 hover:text-red-700 w-full ${
                  isSigningOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <LogOut className={`w-5 h-5 ${isSigningOut ? 'animate-pulse' : ''}`} />
                <span className={isSigningOut ? 'animate-pulse' : ''}>
                  {isSigningOut ? t('auth.signingOut') : t('auth.signOut')}
                </span>
              </button>

              {/* Language Selector */}
              <div className="px-4 py-2">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                  {t('settings.language')}
                </div>
                <LanguageSelector variant="select" className="w-full" />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-4 h-16">
          {menuItems.slice(0, 4).map((item) => {
            const IconComponent = iconMap[item.icon];
            const isActive = currentPageName === item.page;

            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center justify-center h-full transition-colors duration-200 ${
                  isActive 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {IconComponent && (
                  <IconComponent className="w-5 h-5 mb-1" />
                )}
                <span className="text-xs font-medium truncate px-1">
                  {item.label.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}