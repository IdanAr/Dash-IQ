// Default categories for new users
import { 
  ShoppingCart, 
  Car, 
  Home, 
  Utensils, 
  Heart, 
  GraduationCap, 
  Gift, 
  Briefcase,
  PiggyBank,
  CreditCard,
  Plane,
  GamepadIcon,
  Phone,
  Zap,
  Coffee
} from 'lucide-react';

export const getDefaultCategories = (language = 'he') => {
  const categories = {
    he: [
      // הוצאות
      { name: "מזון וקניות", type: "expense", icon: "🛒", sort_order: 1 },
      { name: "תחבורה", type: "expense", icon: "🚗", sort_order: 2 },
      { name: "דיור", type: "expense", icon: "🏠", sort_order: 3 },
      { name: "מסעדות", type: "expense", icon: "🍽️", sort_order: 4 },
      { name: "בריאות", type: "expense", icon: "❤️", sort_order: 5 },
      { name: "חינוך", type: "expense", icon: "🎓", sort_order: 6 },
      { name: "בילויים", type: "expense", icon: "🎮", sort_order: 7 },
      { name: "מתנות", type: "expense", icon: "🎁", sort_order: 8 },
      { name: "תקשורת", type: "expense", icon: "📱", sort_order: 9 },
      { name: "חשמל ומים", type: "expense", icon: "⚡", sort_order: 10 },
      { name: "קפה ומשקאות", type: "expense", icon: "☕", sort_order: 11 },
      { name: "נסיעות", type: "expense", icon: "✈️", sort_order: 12 },
      { name: "שונות", type: "expense", icon: "💳", sort_order: 13 },
      
      // הכנסות
      { name: "משכורת", type: "income", icon: "💼", sort_order: 14 },
      { name: "עסק עצמאי", type: "income", icon: "🏢", sort_order: 15 },
      { name: "השקעות", type: "income", icon: "🐷", sort_order: 16 },
      { name: "מתנות כספיות", type: "income", icon: "💝", sort_order: 17 },
      { name: "החזרי מס", type: "income", icon: "🧾", sort_order: 18 },
      { name: "הכנסות אחרות", type: "income", icon: "💰", sort_order: 19 }
    ],
    en: [
      // Expenses
      { name: "Food & Groceries", type: "expense", icon: "🛒", sort_order: 1 },
      { name: "Transportation", type: "expense", icon: "🚗", sort_order: 2 },
      { name: "Housing", type: "expense", icon: "🏠", sort_order: 3 },
      { name: "Dining Out", type: "expense", icon: "🍽️", sort_order: 4 },
      { name: "Healthcare", type: "expense", icon: "❤️", sort_order: 5 },
      { name: "Education", type: "expense", icon: "🎓", sort_order: 6 },
      { name: "Entertainment", type: "expense", icon: "🎮", sort_order: 7 },
      { name: "Gifts", type: "expense", icon: "🎁", sort_order: 8 },
      { name: "Communication", type: "expense", icon: "📱", sort_order: 9 },
      { name: "Utilities", type: "expense", icon: "⚡", sort_order: 10 },
      { name: "Coffee & Drinks", type: "expense", icon: "☕", sort_order: 11 },
      { name: "Travel", type: "expense", icon: "✈️", sort_order: 12 },
      { name: "Miscellaneous", type: "expense", icon: "💳", sort_order: 13 },
      
      // Income
      { name: "Salary", type: "income", icon: "💼", sort_order: 14 },
      { name: "Freelance", type: "income", icon: "🏢", sort_order: 15 },
      { name: "Investments", type: "income", icon: "🐷", sort_order: 16 },
      { name: "Gifts", type: "income", icon: "💝", sort_order: 17 },
      { name: "Tax Refund", type: "income", icon: "🧾", sort_order: 18 },
      { name: "Other Income", type: "income", icon: "💰", sort_order: 19 }
    ]
  };

  return categories[language] || categories.en;
};

// Get icon component by name (for backward compatibility)
export const getIconComponent = (iconName) => {
  const iconMap = {
    ShoppingCart,
    Car,
    Home,
    Utensils,
    Heart,
    GraduationCap,
    Gift,
    Briefcase,
    PiggyBank,
    CreditCard,
    Plane,
    GamepadIcon,
    Phone,
    Zap,
    Coffee
  };

  return iconMap[iconName] || ShoppingCart;
};

export default {
  getDefaultCategories,
  getIconComponent
};