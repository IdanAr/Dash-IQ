import React from 'react';
import { 
  Smile, ShoppingCart, Home, Car, Coffee, Gift, Bus, Plane, 
  Utensils, Shirt, Film, BookOpen, HeartPulse, Landmark, Palette, 
  HelpCircle, Zap, TrendingUp, TrendingDown, AlertTriangle, Bell, Info, PiggyBank, Filter, Settings, LayoutDashboard, Upload, FolderOpen, FileUp, FolderTree
} from "lucide-react";

export const commonLucideIconsMapping = {
  Smile: Smile,
  ShoppingCart: ShoppingCart,
  Home: Home,
  Car: Car,
  Coffee: Coffee,
  Gift: Gift,
  Bus: Bus,
  Plane: Plane,
  Utensils: Utensils,
  Shirt: Shirt,
  Film: Film,
  BookOpen: BookOpen,
  HeartPulse: HeartPulse,
  Landmark: Landmark,
  Palette: Palette,
  HelpCircle: HelpCircle,
  Zap: Zap,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  AlertTriangle: AlertTriangle,
  Bell: Bell,
  Info: Info,
  PiggyBank: PiggyBank,
  Filter: Filter,
  Settings: Settings,
  LayoutDashboard: LayoutDashboard,
  Upload: Upload,
  FolderOpen: FolderOpen,
  FileUp: FileUp,
  FolderTree: FolderTree
  // Add more icons here as needed, ensure they are imported from lucide-react
};

export const IconRenderer = ({ iconName, ...props }) => {
  const IconComponent = commonLucideIconsMapping[iconName] || HelpCircle; // Fallback to HelpCircle
  return <IconComponent {...props} />;
};

// Function to get icon props for select items (or any list)
export const getIconForSelectItem = (iconName) => {
  const IconComponent = commonLucideIconsMapping[iconName] || HelpCircle;
  return <IconComponent size={16} className="mr-2" />;
};

// Returns an array of objects for icon selection, e.g., in a Select component
export const getIconOptions = () => {
  return Object.keys(commonLucideIconsMapping).map(name => ({
    value: name,
    label: name,
    icon: <IconRenderer iconName={name} size={16} className="mr-2" />
  }));
};