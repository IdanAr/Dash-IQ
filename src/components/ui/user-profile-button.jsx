import React, { useState } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { t, isRTL } from '@/components/utils/i18n';

export default function UserProfileButton({ 
  user = null,
  onSettingsClick = null,
  onSignOut = null,
  className = '',
  variant = 'default', // 'default', 'compact', 'minimal'
  showUserInfo = true,
  showEmail = true,
  showRole = false,
  isLoading = false,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isRTLLayout = isRTL();

  // Default user data if not provided
  const userData = user || {
    full_name: 'Guest User',
    email: 'guest@example.com',
    role: 'user',
    avatar: null
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return 'GU';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    if (onSettingsClick) {
      onSettingsClick();
    }
  };

  const handleSignOut = () => {
    setIsOpen(false);
    if (onSignOut) {
      onSignOut();
    }
  };

  // Compact variant - just the avatar button
  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`relative h-10 w-10 rounded-full hover:bg-gray-100 transition-colors ${className}`}
            disabled={disabled || isLoading}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData.avatar} alt={userData.full_name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                {getUserInitials(userData.full_name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className={`w-72 ${isRTLLayout ? 'text-right' : 'text-left'}`}
          align={isRTLLayout ? 'start' : 'end'}
          sideOffset={5}
        >
          {showUserInfo && (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={userData.avatar} alt={userData.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getUserInitials(userData.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {userData.full_name}
                    </p>
                    {showEmail && (
                      <p className="text-xs text-gray-500 truncate">
                        {userData.email}
                      </p>
                    )}
                    {showRole && userData.role && (
                      <Badge variant="secondary" className="text-xs w-fit">
                        {userData.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          
          {onSettingsClick && (
            <DropdownMenuItem 
              onClick={handleSettingsClick}
              className="cursor-pointer flex items-center"
            >
              <Settings className={`h-4 w-4 ${isRTLLayout ? 'ml-2' : 'mr-2'}`} />
              {t('navigation.settings')}
            </DropdownMenuItem>
          )}
          
          {onSignOut && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="cursor-pointer flex items-center text-red-600 focus:text-red-600 focus:bg-red-50"
                disabled={isLoading}
              >
                <LogOut className={`h-4 w-4 ${isRTLLayout ? 'ml-2' : 'mr-2'}`} />
                {isLoading ? t('auth.signingOut') : t('auth.signOut')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Minimal variant - just icon
  if (variant === 'minimal') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full ${className}`}
            disabled={disabled || isLoading}
          >
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className={`w-56 ${isRTLLayout ? 'text-right' : 'text-left'}`}
          align={isRTLLayout ? 'start' : 'end'}
          sideOffset={5}
        >
          {onSettingsClick && (
            <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
              <Settings className={`h-4 w-4 ${isRTLLayout ? 'ml-2' : 'mr-2'}`} />
              {t('navigation.settings')}
            </DropdownMenuItem>
          )}
          
          {onSignOut && (
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              disabled={isLoading}
            >
              <LogOut className={`h-4 w-4 ${isRTLLayout ? 'ml-2' : 'mr-2'}`} />
              {isLoading ? t('auth.signingOut') : t('auth.signOut')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant - full button with name and dropdown
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 h-auto hover:bg-gray-100 transition-colors ${className}`}
          disabled={disabled || isLoading}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData.avatar} alt={userData.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
              {getUserInitials(userData.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium truncate max-w-32">
              {userData.full_name}
            </span>
            {showEmail && (
              <span className="text-xs text-gray-500 truncate max-w-32">
                {userData.email}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className={`w-64 ${isRTLLayout ? 'text-right' : 'text-left'}`}
        align={isRTLLayout ? 'start' : 'end'}
        sideOffset={5}
      >
        {showUserInfo && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userData.avatar} alt={userData.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getUserInitials(userData.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {userData.full_name}
                  </p>
                  {showEmail && (
                    <p className="text-xs text-gray-500 truncate">
                      {userData.email}
                    </p>
                  )}
                  {showRole && userData.role && (
                    <Badge variant="secondary" className="text-xs w-fit">
                      {userData.role}
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        
        {onSettingsClick && (
          <DropdownMenuItem 
            onClick={handleSettingsClick}
            className="cursor-pointer flex items-center"
          >
            <Settings className={`h-4 w-4 ${isRTLLayout ? 'ml-2' : 'mr-2'}`} />
            {t('navigation.settings')}
          </DropdownMenuItem>
        )}
        
        {onSignOut && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="cursor-pointer flex items-center text-red-600 focus:text-red-600 focus:bg-red-50"
              disabled={isLoading}
            >
              <LogOut className={`h-4 w-4 ${isRTLLayout ? 'ml-2' : 'mr-2'}`} />
              {isLoading ? t('auth.signingOut') : t('auth.signOut')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}