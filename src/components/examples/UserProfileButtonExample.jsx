import React, { useState } from 'react';
import UserProfileButton from '@/components/ui/user-profile-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function UserProfileButtonExample() {
  const [currentUser, setCurrentUser] = useState({
    full_name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'admin',
    avatar: null // You can add a real avatar URL here
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSettingsClick = () => {
    console.log('Navigate to settings');
    // Add your navigation logic here
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    console.log('Signing out...');
    
    // Simulate sign out process
    setTimeout(() => {
      setIsLoading(false);
      console.log('User signed out');
    }, 2000);
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Profile Button Component</h1>
        <p className="text-gray-600">Modern, accessible user profile button with dropdown menu</p>
      </div>

      {/* Default Variant */}
      <Card>
        <CardHeader>
          <CardTitle>Default Variant</CardTitle>
          <CardDescription>Full button with user name, avatar, and dropdown chevron</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Best for: Desktop headers, main navigation</p>
            <div className="flex gap-2">
              <Badge variant="secondary">Responsive</Badge>
              <Badge variant="secondary">RTL Support</Badge>
              <Badge variant="secondary">Accessible</Badge>
            </div>
          </div>
          <UserProfileButton
            user={currentUser}
            onSettingsClick={handleSettingsClick}
            onSignOut={handleSignOut}
            showRole={true}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Compact Variant */}
      <Card>
        <CardHeader>
          <CardTitle>Compact Variant</CardTitle>
          <CardDescription>Avatar-only button with full dropdown information</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Best for: Toolbars, mobile headers, space-constrained areas</p>
            <div className="flex gap-2">
              <Badge variant="secondary">Space Efficient</Badge>
              <Badge variant="secondary">Mobile Friendly</Badge>
            </div>
          </div>
          <UserProfileButton
            variant="compact"
            user={currentUser}
            onSettingsClick={handleSettingsClick}
            onSignOut={handleSignOut}
            showRole={true}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Minimal Variant */}
      <Card>
        <CardHeader>
          <CardTitle>Minimal Variant</CardTitle>
          <CardDescription>Simple user icon with basic dropdown</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Best for: Minimal designs, secondary menus</p>
            <div className="flex gap-2">
              <Badge variant="secondary">Ultra Compact</Badge>
              <Badge variant="secondary">Clean Design</Badge>
            </div>
          </div>
          <UserProfileButton
            variant="minimal"
            user={currentUser}
            onSettingsClick={handleSettingsClick}
            onSignOut={handleSignOut}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Configuration Options */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Demo</CardTitle>
          <CardDescription>Try different configurations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Without Email</h4>
              <UserProfileButton
                variant="compact"
                user={currentUser}
                showEmail={false}
                onSettingsClick={handleSettingsClick}
                onSignOut={handleSignOut}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Settings Only</h4>
              <UserProfileButton
                variant="compact"
                user={currentUser}
                onSettingsClick={handleSettingsClick}
                onSignOut={null}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Sign Out Only</h4>
              <UserProfileButton
                variant="compact"
                user={currentUser}
                onSettingsClick={null}
                onSignOut={handleSignOut}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">No User Info</h4>
              <UserProfileButton
                variant="compact"
                user={currentUser}
                showUserInfo={false}
                onSettingsClick={handleSettingsClick}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-mono text-sm font-bold mb-2">Basic Usage:</h4>
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`<UserProfileButton
  user={{
    full_name: "John Doe",
    email: "john@example.com",
    role: "admin",
    avatar: "/avatar.jpg"
  }}
  onSettingsClick={() => navigate('/settings')}
  onSignOut={() => signOut()}
  variant="default" // "default" | "compact" | "minimal"
  showRole={true}
  showEmail={true}
  isLoading={false}
/>`}
            </pre>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Props:</h4>
              <ul className="space-y-1 text-gray-600">
                <li><code>user</code> - User object with name, email, role, avatar</li>
                <li><code>variant</code> - "default", "compact", or "minimal"</li>
                <li><code>onSettingsClick</code> - Settings click handler</li>
                <li><code>onSignOut</code> - Sign out click handler</li>
                <li><code>showRole</code> - Show user role badge</li>
                <li><code>showEmail</code> - Show user email</li>
                <li><code>showUserInfo</code> - Show user info section</li>
                <li><code>isLoading</code> - Loading state</li>
                <li><code>disabled</code> - Disabled state</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Features:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>✅ Fully responsive design</li>
                <li>✅ RTL language support</li>
                <li>✅ Accessibility compliant</li>
                <li>✅ Keyboard navigation</li>
                <li>✅ Loading states</li>
                <li>✅ Avatar fallback with initials</li>
                <li>✅ Multiple variants</li>
                <li>✅ Customizable appearance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}