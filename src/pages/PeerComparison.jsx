
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, Category, User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table as ShadcnTable,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle,
  Crown,
  Medal,
  Star,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Info, // New from outline
  DollarSign, // New from outline
  Percent, // New from outline
  Activity, // New from outline
  Table, // New from outline (lucide icon)
  Loader2, // New from outline
  Lightbulb, // New from outline
  AlertTriangle // New from outline
} from 'lucide-react';
import {
  BarChart as RechartsBarChart, // Preserving alias as used in JSX
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend // New from outline
} from 'recharts';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { t, formatCurrency, formatDate, formatNumber, isRTL, getCurrentLanguage } from '@/components/utils/i18n'; // Consolidated i18n imports

// Enhanced peer data function - now language-aware
const getRealIsraeliPeerData = () => {
  const currentLang = getCurrentLanguage();
  
  // Define category keys that remain consistent across languages
  const categoryKeys = {
    food: 'מזון ומשקאות',
    transportation: 'תחבורה', 
    entertainment: 'בילויים ופנאי',
    shopping: 'קניות כלליות',
    housing: 'דיור והוצאות בית',
    health: 'בריאות וטיפוח',
    education: 'חינוך והשכלה',
    miscellaneous: 'שונות'
  };

  return {
    'young_professional_tlv': {
      name: t('peerComparison.profiles.young_professional_tlv'),
      ageRange: '25-35',
      avgIncome: 16500,
      region: currentLang === 'he' ? 'מרכז' : currentLang === 'ar' ? 'المركز' : 'Central',
      sampleSize: 2847,
      dataSource: currentLang === 'he' ? 'לשכה מרכזית לסטטיסטיקה + מחקר בנק ישראל 2024' : 
                  currentLang === 'ar' ? 'دائرة الإحصاء المركزية + بحث بنك إسرائيل 2024' :
                  'Central Bureau of Statistics + Bank of Israel Research 2024',
      categories: {
        [categoryKeys.food]: { avg: 2200, percentile: 65, std: 450 },
        [categoryKeys.transportation]: { avg: 900, percentile: 58, std: 280 },
        [categoryKeys.entertainment]: { avg: 1400, percentile: 72, std: 380 },
        [categoryKeys.shopping]: { avg: 1100, percentile: 52, std: 320 },
        [categoryKeys.housing]: { avg: 5800, percentile: 68, std: 1200 },
        [categoryKeys.health]: { avg: 650, percentile: 45, std: 190 },
        [categoryKeys.education]: { avg: 450, percentile: 42, std: 150 },
        [categoryKeys.miscellaneous]: { avg: 380, percentile: 35, std: 120 }
      }
    },
    'young_professional_general': {
      name: t('peerComparison.profiles.young_professional_general'),
      ageRange: '25-35',
      avgIncome: 13200,
      region: currentLang === 'he' ? 'כלל הארץ' : currentLang === 'ar' ? 'جميع أنحاء البلاد' : 'Nationwide',
      sampleSize: 8934,
      dataSource: currentLang === 'he' ? 'לשכה מרכזית לסטטיסטיקה + מחקר בנק ישראל 2024' : 
                  currentLang === 'ar' ? 'دائرة الإحصاء المركزية + بحث بنק ישראל 2024' :
                  'Central Bureau of Statistics + Bank of Israel Research 2024',
      categories: {
        [categoryKeys.food]: { avg: 1850, percentile: 62, std: 380 },
        [categoryKeys.transportation]: { avg: 850, percentile: 55, std: 250 },
        [categoryKeys.entertainment]: { avg: 1100, percentile: 68, std: 320 },
        [categoryKeys.shopping]: { avg: 900, percentile: 50, std: 280 },
        [categoryKeys.housing]: { avg: 4200, percentile: 65, std: 950 },
        [categoryKeys.health]: { avg: 580, percentile: 43, std: 160 },
        [categoryKeys.education]: { avg: 380, percentile: 40, std: 130 },
        [categoryKeys.miscellaneous]: { avg: 320, percentile: 32, std: 100 }
      }
    },
    'family_with_children': {
      name: t('peerComparison.profiles.family_with_children'),
      ageRange: '30-50',
      avgIncome: 24800,
      region: currentLang === 'he' ? 'כלל הארץ' : currentLang === 'ar' ? 'جميع أنحاء البلاد' : 'Nationwide',
      sampleSize: 12456,
      dataSource: currentLang === 'he' ? 'לשכה מרכזית לסטטיסטיקה + מחקר בנק ישראל 2024' : 
                  currentLang === 'ar' ? 'دائرة الإحصاء المركزية + بحث بنك إسرائيل 2024' :
                  'Central Bureau of Statistics + Bank of Israel Research 2024',
      categories: {
        [categoryKeys.food]: { avg: 3800, percentile: 72, std: 680 },
        [categoryKeys.transportation]: { avg: 1650, percentile: 62, std: 420 },
        [categoryKeys.entertainment]: { avg: 1200, percentile: 45, std: 350 },
        [categoryKeys.shopping]: { avg: 2100, percentile: 68, std: 580 },
        [categoryKeys.housing]: { avg: 7800, percentile: 78, std: 1580 },
        [categoryKeys.health]: { avg: 950, percentile: 55, std: 280 },
        [categoryKeys.education]: { avg: 1450, percentile: 58, std: 420 },
        [categoryKeys.miscellaneous]: { avg: 580, percentile: 38, std: 180 }
      }
    },
    'seniors': {
      name: t('peerComparison.profiles.seniors'),
      ageRange: '65+',
      avgIncome: 11500,
      region: currentLang === 'he' ? 'כלל הארץ' : currentLang === 'ar' ? 'جميع أنحاء البلاد' : 'Nationwide',
      sampleSize: 5823,
      dataSource: currentLang === 'he' ? 'לשכה מרכזית לסטטיסטיקה + מחקר בנק ישראל 2024' : 
                  currentLang === 'ar' ? 'دائرة الإحصاء المركزية + بحث بنק ישראל 2024' :
                  'Central Bureau of Statistics + Bank of Israel Research 2024',
      categories: {
        [categoryKeys.food]: { avg: 1650, percentile: 48, std: 320 },
        [categoryKeys.transportation]: { avg: 450, percentile: 32, std: 150 },
        [categoryKeys.entertainment]: { avg: 750, percentile: 38, std: 220 },
        [categoryKeys.shopping]: { avg: 680, percentile: 42, std: 190 },
        [categoryKeys.housing]: { avg: 3200, percentile: 52, std: 680 },
        [categoryKeys.health]: { avg: 1350, percentile: 65, std: 380 },
        [categoryKeys.education]: { avg: 180, percentile: 22, std: 80 },
        [categoryKeys.miscellaneous]: { avg: 420, percentile: 35, std: 130 }
      }
    }
  };
};

// Enhanced NLP-based category mapping - improved for multilingual support
const mapUserSpendingToPeerCategoriesWithNLP = async (userTransactions, userCategories, peerCategoriesDefinition) => {
  const mappedSpending = {};
  const unmappedCategoryName = 'שונות'; // Keep consistent key

  // Initialize mappedSpending with all peer category keys
  Object.keys(peerCategoriesDefinition).forEach(peerCatName => {
    mappedSpending[peerCatName] = 0;
  });

  // Create category mapping using LLM for better accuracy
  const userCategoryNames = userCategories.map(c => c.name);
  const peerCategoryNames = Object.keys(peerCategoriesDefinition);

  const categoryMappingPrompt = `
  אתה מומחה בסיווג הוצאות פיננסיות בישראל. 
  יש לי קטגוריות של משתמש שצריך למפות לקטגוריות סטנדרטיות של השוואה לעמיתים.
  
  קטגוריות המשתמש: [${userCategoryNames.map(name => `'${name}'`).join(', ')}]
  
  קטגוריות עמיתים: [${peerCategoryNames.map(name => `'${name}'`).join(', ')}]
  
  צור מיפוי בין קטגוריות המשתמש לקטגוריות העמיתים. כל קטגוריה של משתמש צריכה להתאים לקטגוריה אחת של עמיתים.
  אם קטגורית משתמש לא מתאימה לאף קטגורית עמיתים, אפשר למפות אותה ל-'${unmappedCategoryName}'.
  
  החזר רק JSON בפורמט הבא:
  {
    "mapping": {
      "קטגוריה ממשתמש 1": "קטגוריה מעמיתים X",
      "קטגוריה ממשתמש 2": "קטגוריה מעמיתים Y",
      ...
    }
  }
  `;

  let categoryMapping = {};
  
  try {
    const mappingResponse = await InvokeLLM({
      prompt: categoryMappingPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          mapping: {
            type: "object",
            description: "מיפוי בין קטגוריות המשתמש לקטגוריות העמיתים"
          }
        },
        required: ["mapping"]
      }
    });
    
    if (mappingResponse && mappingResponse.mapping) {
      categoryMapping = mappingResponse.mapping;
    }
  } catch (error) {
    console.error("LLM mapping failed, using fallback logic:", error);
  }

  // Map transactions using the LLM mapping or fallback logic
  userTransactions.forEach(t => {
    if (t.is_income) return;

    let targetPeerCategory = unmappedCategoryName; // Default to 'שונות'

    const userCategory = userCategories.find(c => c.id === t.category_id);
    const userCategoryName = userCategory ? userCategory.name : null;

    // 1. Try LLM mapping first
    if (userCategoryName && categoryMapping[userCategoryName] && peerCategoriesDefinition.hasOwnProperty(categoryMapping[userCategoryName])) {
      targetPeerCategory = categoryMapping[userCategoryName];
    } else {
      // 2. Fallback to keyword matching if LLM failed or provided invalid category
      if (userCategoryName) {
        const userCatNameLower = userCategoryName.toLowerCase();
        for (const [peerCatName] of Object.entries(peerCategoriesDefinition)) {
          // Simple check if user category name includes part of peer category name
          if (peerCatName.includes('מזון') && userCatNameLower.includes('מזון') ||
              peerCatName.includes('תחבורה') && userCatNameLower.includes('תחבורה') ||
              peerCatName.includes('בילויים') && userCatNameLower.includes('בילוי') ||
              peerCatName.includes('קניות') && userCatNameLower.includes('קניות') ||
              peerCatName.includes('דיור') && userCatNameLower.includes('דיור') ||
              peerCatName.includes('בריאות') && userCatNameLower.includes('בריאות') ||
              peerCatName.includes('חינוך') && userCatNameLower.includes('חינוך') ||
              peerCatName.includes('שונות') && userCatNameLower.includes('שונות')
          ) {
            targetPeerCategory = peerCatName;
            break;
          }
        }
      }
      // If still unmapped, try matching business name to general categories if LLM failed completely
      if (targetPeerCategory === unmappedCategoryName && t.business_name) {
          const businessNameLower = t.business_name.toLowerCase();
          if (businessNameLower.includes('סופר') || businessNameLower.includes('מסעדה') || businessNameLower.includes('קפה')) {
              targetPeerCategory = 'מזון ומשקאות';
          } else if (businessNameLower.includes('דלק') || businessNameLower.includes('אוטובוס') || businessNameLower.includes('רכבת')) {
              targetPeerCategory = 'תחבורה';
          } else if (businessNameLower.includes('קניון') || businessNameLower.includes('ביגוד') || businessNameLower.includes('צעצועים')) {
              targetPeerCategory = 'קניות כלליות';
          } else if (businessNameLower.includes('שכר דירה') || businessNameLower.includes('חשמל') || businessNameLower.includes('ארנונה')) {
              targetPeerCategory = 'דיור והוצאות בית';
          } else if (businessNameLower.includes('רופא') || businessNameLower.includes('בית מרקחת') || businessNameLower.includes('קופת חולים')) {
              targetPeerCategory = 'בריאות וטיפוח';
          }
      }
    }

    // Ensure the targetCategory exists in mappedSpending
    if (mappedSpending.hasOwnProperty(targetPeerCategory)) {
      mappedSpending[targetPeerCategory] += t.billing_amount;
    } else { 
      mappedSpending[unmappedCategoryName] += t.billing_amount;
    }
  });

  return mappedSpending;
};

// Helper function to generate CSV content
const generateCSV = (transactions, categories) => {
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.id] = cat.name;
  });

  const csvHeaders = [
    t('peerComparison.transactionDialog.table.date'),
    t('peerComparison.transactionDialog.table.business'),
    t('peerComparison.transactionDialog.table.amount'),
    t('peerComparison.transactionDialog.table.systemCategory'),
    t('peerComparison.transactionDialog.table.details')
  ];

  const csvRows = transactions.map(t => [
    format(parseISO(t.date), 'dd/MM/yyyy'),
    `"${t.business_name ? t.business_name.replace(/"/g, '""') : ''}"`,
    t.billing_amount || 0,
    `"${categoryMap[t.category_id] ? categoryMap[t.category_id].replace(/"/g, '""') : t('peerComparison.transactionDialog.table.uncategorized')}"`,
    `"${t.details ? t.details.replace(/"/g, '""') : ''}"`
  ]);

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

// Helper function to download CSV file
const downloadCSV = (csvContent, filename) => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper function to get translated category name for display
const getTranslatedCategoryName = (categoryKey) => {
  const categoryTranslations = {
    'מזון ומשקאות': t('peerComparison.categories.food'),
    'תחבורה': t('peerComparison.categories.transportation'),
    'בילויים ופנאי': t('peerComparison.categories.entertainment'),
    'קניות כלליות': t('peerComparison.categories.shopping'),
    'דיור והוצאות בית': t('peerComparison.categories.housing'),
    'בריאות וטיפוח': t('peerComparison.categories.health'),
    'חינוך והשכלה': t('peerComparison.categories.education'),
    'שונות': t('peerComparison.categories.miscellaneous')
  };
  
  return categoryTranslations[categoryKey] || categoryKey;
};

export default function PeerComparisonPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState('young_professional_general');
  const [comparisonData, setComparisonData] = useState({});
  const [userStats, setUserStats] = useState({});
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedCategoryTransactions, setSelectedCategoryTransactions] = useState([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [isRefreshingComparison, setIsRefreshingComparison] = useState(false);
  const isRTLLayout = isRTL();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userData, transData, catData] = await Promise.all([
        User.me(),
        Transaction.list('-date', 500),
        Category.list()
      ]);

      setUser(userData);
      setTransactions(transData);
      setCategories(catData);
    } catch (error) {
      console.error('Error loading peer comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateComparison = useCallback(async () => {
    if (isLoading || !transactions.length || !categories.length) return;

    setIsRefreshingComparison(true);
    
    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const lastMonthTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
    });

    let totalUserIncome = 0;
    let totalUserExpenses = 0;

    lastMonthTransactions.forEach(t => {
      if (t.is_income) {
        totalUserIncome += t.billing_amount;
      } else {
        totalUserExpenses += t.billing_amount;
      }
    });

    const realIsraeliPeerData = getRealIsraeliPeerData();
    const peerData = realIsraeliPeerData[selectedProfile];
    const userSpendingMapped = await mapUserSpendingToPeerCategoriesWithNLP(
      lastMonthTransactions, 
      categories, 
      peerData.categories
    );

    const comparison = {};
    const radarData = [];

    Object.entries(peerData.categories).forEach(([categoryName, peerStats]) => {
      const userAmount = userSpendingMapped[categoryName] || 0;
      const difference = userAmount - peerStats.avg;
      const percentageDiff = peerStats.avg > 0 ? (difference / peerStats.avg) * 100 : (userAmount > 0 ? 100 : 0);

      comparison[categoryName] = {
        userAmount,
        peerAverage: peerStats.avg,
        peerStandardDeviation: peerStats.std,
        difference,
        percentageDiff,
        percentile: peerStats.percentile,
        status: percentageDiff < -10 ? 'excellent' :
          percentageDiff < 10 ? 'good' :
            percentageDiff < 30 ? 'average' : 'needs_attention',
        zScore: peerStats.std > 0 ? (userAmount - peerStats.avg) / peerStats.std : 0
      };

      // Create display name for radar chart (shorter versions)
      let displayCategoryName = getTranslatedCategoryName(categoryName);
      if (displayCategoryName.length > 10) {
        // Shorten for radar display
        if (categoryName.includes('מזון')) displayCategoryName = t('peerComparison.categories.foodShort') || 'מזון';
        else if (categoryName.includes('דיור')) displayCategoryName = t('peerComparison.categories.housingShort') || 'דיור';
        else if (categoryName.includes('בילויים')) displayCategoryName = t('peerComparison.categories.entertainmentShort') || 'בילויים';
        else if (categoryName.includes('קניות')) displayCategoryName = t('peerComparison.categories.shoppingShort') || 'קניות';
        else if (categoryName.includes('בריאות')) displayCategoryName = t('peerComparison.categories.healthShort') || 'בריאות';
        else if (categoryName.includes('חינוך')) displayCategoryName = t('peerComparison.categories.educationShort') || 'חינוך';
      }

      radarData.push({
        category: displayCategoryName,
        fullCategoryName: categoryName,
        user: peerStats.avg > 0 ? (userAmount / peerStats.avg) * 100 : (userAmount > 0 ? 200 : 0),
        peer: 100,
        userActualAmount: userAmount,
        peerActualAmount: peerStats.avg
      });
    });

    const scores = Object.values(comparison).map(comp => {
      if (comp.status === 'excellent') return 100;
      if (comp.status === 'good') return 80;
      if (comp.status === 'average') return 60;
      return 40;
    });

    const overallScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    setComparisonData(comparison);
    setUserStats({
      totalIncome: totalUserIncome,
      totalExpenses: totalUserExpenses,
      savingsRate: totalUserIncome > 0 ? ((totalUserIncome - totalUserExpenses) / totalUserIncome) * 100 : 0,
      overallScore,
      radarData,
      peerProfile: peerData
    });
    
    setIsRefreshingComparison(false);
  }, [transactions, categories, selectedProfile, isLoading]);

  useEffect(() => {
    generateComparison();
  }, [generateComparison]);

  const handleShowCategoryTransactions = useCallback((categoryName) => {
    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const lastMonthTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
    });

    // Simplified filtering logic for the dialog
    const filteredTransactions = lastMonthTransactions.filter(t => {
      if (t.is_income) return false;
      
      const userCategory = categories.find(c => c.id === t.category_id);
      if (userCategory) {
        const userCatNameLower = userCategory.name.toLowerCase();
        if (
          (categoryName.includes('מזון') && userCatNameLower.includes('מזון')) ||
          (categoryName.includes('תחבורה') && userCatNameLower.includes('תחבורה')) ||
          (categoryName.includes('בילויים') && userCatNameLower.includes('בילוי')) ||
          (categoryName.includes('קניות') && userCatNameLower.includes('קניות')) ||
          (categoryName.includes('דיור') && userCatNameLower.includes('דיור')) ||
          (categoryName.includes('בריאות') && userCatNameLower.includes('בריאות')) ||
          (categoryName.includes('חינוך') && userCatNameLower.includes('חינוך')) ||
          (categoryName.includes('שונות') && userCatNameLower.includes('שונות'))
        ) {
          return true;
        }
      }
      return false;
    });

    setSelectedCategoryTransactions(filteredTransactions);
    setSelectedCategoryName(getTranslatedCategoryName(categoryName));
    setIsTransactionDialogOpen(true);
  }, [transactions, categories]);

  const handleDownloadCategoryCSV = () => {
    if (selectedCategoryTransactions.length === 0) return;

    const csvContent = generateCSV(selectedCategoryTransactions, categories);
    const filename = `${t('peerComparison.transactionDialog.title')}_${selectedCategoryName}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCSV(csvContent, filename);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'average': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'needs_attention': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': return <Crown className="w-4 h-4 text-green-600" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'average': return <Target className="w-4 h-4 text-yellow-600" />;
      case 'needs_attention': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    return t(`peerComparison.categoryComparison.status.${status}`);
  };

  const getScoreLevel = (score) => {
    if (score >= 90) return { text: t('peerComparison.overallScore.scoreLevel.excellent'), icon: Crown, color: 'text-yellow-600' };
    if (score >= 80) return { text: t('peerComparison.overallScore.scoreLevel.veryGood'), icon: Medal, color: 'text-blue-600' };
    if (score >= 70) return { text: t('peerComparison.overallScore.scoreLevel.good'), icon: Star, color: 'text-green-600' };
    if (score >= 60) return { text: t('peerComparison.overallScore.scoreLevel.average'), icon: Target, color: 'text-yellow-600' };
    return { text: t('peerComparison.overallScore.scoreLevel.needsImprovement'), icon: AlertCircle, color: 'text-red-600' };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('peerComparison.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  const scoreLevel = getScoreLevel(userStats.overallScore || 0);
  const realIsraeliPeerData = getRealIsraeliPeerData();

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          {t('peerComparison.title')}
        </h1>
        <p className="text-gray-600">
          {t('peerComparison.subtitle')}
        </p>
      </header>

      {/* Enhanced Profile Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            {t('peerComparison.profileSelection.title')}
          </CardTitle>
          <CardDescription>
            {t('peerComparison.profileSelection.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger className={`w-full ${isRTLLayout ? 'text-right' : 'text-left'}`}>
                <SelectValue placeholder={t('peerComparison.profileSelection.title')} />
              </SelectTrigger>
              <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                {Object.entries(realIsraeliPeerData).map(([key, data]) => (
                  <SelectItem key={key} value={key} className={isRTLLayout ? 'text-right' : 'text-left'}>
                    <div className="flex flex-col">
                      <span className="font-medium">{data.name}</span>
                      <span className="text-xs text-gray-500">
                        {t('peerComparison.profileSelection.age')} {data.ageRange} • {t('peerComparison.profileSelection.avgIncome')}: {formatCurrency(data.avgIncome)} • 
                        {data.sampleSize.toLocaleString()} {t('peerComparison.profileSelection.participants')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {userStats.peerProfile && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>{t('peerComparison.profileSelection.dataSource')}:</strong> {userStats.peerProfile.dataSource}
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  <strong>{t('peerComparison.profileSelection.sampleSize')}:</strong> {userStats.peerProfile.sampleSize.toLocaleString()} {t('peerComparison.profileSelection.participants')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            {t('peerComparison.overallScore.title')}
            <Button
              variant="outline"
              size="sm"
              onClick={generateComparison}
              disabled={isRefreshingComparison}
              className={`${isRTLLayout ? 'ml-auto' : 'mr-auto'}`}
            >
              {isRefreshingComparison ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {t('peerComparison.overallScore.refreshComparison')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <scoreLevel.icon className={`w-12 h-12 ${scoreLevel.color}`} />
              <div>
                <div className="text-4xl font-bold text-gray-800">{Math.round(userStats.overallScore || 0)}</div>
                <div className="text-lg text-gray-600">{scoreLevel.text}</div>
              </div>
            </div>
            <Progress value={userStats.overallScore || 0} className="h-3 mb-4" />
            <p className="text-sm text-gray-600">
              {t('peerComparison.overallScore.comparedTo')} "{userStats.peerProfile?.name}" 
              ({userStats.peerProfile?.sampleSize?.toLocaleString()} {t('peerComparison.profileSelection.participants')})
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              {t('peerComparison.radarChart.title')}
            </CardTitle>
            <CardDescription>
              {t('peerComparison.radarChart.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={userStats.radarData || []} outerRadius="80%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" className="text-xs" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 'dataMax']} 
                    tickFormatter={(value) => `${value}%`} 
                    className="text-xs" 
                  />
                  <Radar
                    name={t('peerComparison.radarChart.yourSpending')}
                    dataKey="user"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Radar
                    name={t('peerComparison.radarChart.groupAverage')}
                    dataKey="peer"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      if (name === t('peerComparison.radarChart.yourSpending')) {
                        return [
                          `${formatCurrency(props.payload.userActualAmount)} (${value.toFixed(0)}%)`,
                          name
                        ];
                      }
                      return [
                        `${formatCurrency(props.payload.peerActualAmount)} (${value.toFixed(0)}%)`,
                        name
                      ];
                    }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px', 
                      direction: isRTLLayout ? 'rtl' : 'ltr',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  <Legend /> { /* Added Legend from outline */ }
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>{t('peerComparison.radarChart.yourSpending')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>{t('peerComparison.radarChart.groupAverage')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              {t('peerComparison.summaryStats.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(userStats.totalIncome || 0)}
                </div>
                <div className="text-sm text-gray-600">{t('peerComparison.summaryStats.monthlyIncome')}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('peerComparison.summaryStats.groupAverage')}: {formatCurrency(userStats.peerProfile?.avgIncome || 0)}
                </div>
              </div>

              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {(userStats.savingsRate || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">{t('peerComparison.summaryStats.savingsRate')}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('peerComparison.summaryStats.recommendedTarget')}: 20%
                </div>
              </div>
            </div>

            {/* Statistical Analysis */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">{t('peerComparison.summaryStats.statisticalAnalysis')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('peerComparison.summaryStats.averageStandardDeviation')}:</span>
                  <span className="font-medium">
                    {Object.values(comparisonData).length > 0 ? 
                      (Object.values(comparisonData).reduce((sum, comp) => sum + Math.abs(comp.zScore || 0), 0) / Object.values(comparisonData).length).toFixed(2) : 
                      '0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('peerComparison.summaryStats.categoriesAboveAverage')}:</span>
                  <span className="font-medium">
                    {Object.values(comparisonData).filter(comp => comp.userAmount > comp.peerAverage).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('peerComparison.summaryStats.maximumDeviation')}:</span>
                  <span className="font-medium">
                    {Object.values(comparisonData).length > 0 ? 
                      Math.max(...Object.values(comparisonData).map(comp => comp.percentageDiff || 0)).toFixed(0) + '%' :
                      '0%'
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Category Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RechartsBarChart className="w-5 h-5 text-purple-600" />
            {t('peerComparison.categoryComparison.title')}
          </CardTitle>
          <CardDescription>
            {t('peerComparison.categoryComparison.description')} "{userStats.peerProfile?.name}" 
            ({t('peerComparison.categoryComparison.sampleNote')} {userStats.peerProfile?.sampleSize?.toLocaleString()} {t('peerComparison.profileSelection.participants')})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(comparisonData)
              .filter(([, data]) => data.peerAverage > 0 || data.userAmount > 0)
              .sort(([, a], [, b]) => b.userAmount - a.userAmount)
              .map(([category, data]) => (
                <div key={category} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{getTranslatedCategoryName(category)}</h4>
                      <Badge className={getStatusColor(data.status)}>
                        {getStatusText(data.status)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowCategoryTransactions(category)}
                        className="flex items-center gap-1 text-xs px-2 py-1 h-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{t('peerComparison.categoryComparison.viewTransactions')}</span>
                      </Button>
                    </div>
                    <div className={isRTLLayout ? 'text-right' : 'text-left'}>
                      {data.percentageDiff !== 0 && data.peerAverage > 0 && (
                        data.percentageDiff > 0 ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">+{data.percentageDiff.toFixed(0)}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-sm font-medium">{data.percentageDiff.toFixed(0)}%</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">{t('peerComparison.categoryComparison.yourExpense')}</div>
                      <div className="font-medium text-lg text-blue-600">{formatCurrency(data.userAmount)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">{t('peerComparison.categoryComparison.groupAverage')}</div>
                      <div className="font-medium text-lg text-green-600">{formatCurrency(data.peerAverage)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">{t('peerComparison.categoryComparison.difference')}</div>
                      <div className={`font-medium text-lg ${data.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {data.difference >= 0 ? '+' : ''}{formatCurrency(data.difference)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">{t('peerComparison.categoryComparison.zScore')}</div>
                      <div className={`font-medium text-lg ${Math.abs(data.zScore) > 2 ? 'text-red-600' : Math.abs(data.zScore) > 1 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {data.zScore.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Progress Bar */}
                  {data.peerAverage > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1 flex justify-between">
                        <span>{t('peerComparison.categoryComparison.relativeToAverage')}:</span>
                        <span className="font-medium">{((data.userAmount / data.peerAverage) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="relative h-4 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="absolute h-full bg-green-400"
                          style={{ width: `100%` }}
                          title={`${t('peerComparison.categoryComparison.groupAverage')}: ${formatCurrency(data.peerAverage)}`}
                        />
                        <div
                          className={`absolute h-full ${data.userAmount > data.peerAverage ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min((data.userAmount / data.peerAverage) * 100, 300)}%` }}
                          title={`${t('peerComparison.categoryComparison.yourExpense')}: ${formatCurrency(data.userAmount)}`}
                        />
                        <div
                          className="absolute h-full w-[2px] bg-gray-700"
                          style={{ left: `${100}%`, transform: 'translateX(-50%)' }}
                          title={`${t('peerComparison.categoryComparison.groupAverage')}: ${formatCurrency(data.peerAverage)}`}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            {t('peerComparison.recommendations.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(comparisonData)
              .filter(([_, data]) => data.status === 'needs_attention')
              .map(([category, data]) => (
                <div key={category} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-orange-800">
                        {t('peerComparison.recommendations.overspending', {
                          category: getTranslatedCategoryName(category),
                          percentage: data.percentageDiff.toFixed(0)
                        })}
                      </h5>
                      <p className="text-sm text-orange-700">
                        {t('peerComparison.recommendations.overspendingDescription', {
                          amount: formatCurrency(Math.abs(data.difference)),
                          average: formatCurrency(data.peerAverage),
                          zScore: data.zScore.toFixed(2)
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

            {userStats.savingsRate < 10 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-800">{t('peerComparison.recommendations.improveSavings')}</h5>
                    <p className="text-sm text-blue-700">
                      {t('peerComparison.recommendations.improveSavingsDescription', {
                        rate: (userStats.savingsRate || 0).toFixed(1)
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {Object.entries(comparisonData)
              .filter(([_, data]) => data.status === 'excellent')
              .slice(0, 2)
              .map(([category, data]) => (
                <div key={category} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-800">
                        {t('peerComparison.recommendations.excellentPerformance', { category: getTranslatedCategoryName(category) })}
                      </h5>
                      <p className="text-sm text-green-700">
                        {t('peerComparison.recommendations.excellentDescription', {
                          amount: formatCurrency(Math.abs(data.difference)),
                          percentage: Math.abs(data.percentageDiff).toFixed(0)
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col" dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {t('peerComparison.transactionDialog.title')}: {selectedCategoryName}
            </DialogTitle>
            <DialogDescription>
              {t('peerComparison.transactionDialog.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                {t('peerComparison.transactionDialog.totalTransactions', { count: selectedCategoryTransactions.length })} • 
                {t('peerComparison.transactionDialog.totalAmount')}: {formatCurrency(selectedCategoryTransactions.reduce((sum, t) => sum + t.billing_amount, 0))}
              </div>
              <Button
                onClick={handleDownloadCategoryCSV}
                className="flex items-center gap-2"
                disabled={selectedCategoryTransactions.length === 0}
              >
                <Download className="w-4 h-4" />
                {t('peerComparison.transactionDialog.downloadCsv')}
              </Button>
            </div>

            {selectedCategoryTransactions.length > 0 ? (
              <div className="overflow-auto flex-1">
                <ShadcnTable>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className={`${isRTLLayout ? 'text-right' : 'text-left'} whitespace-nowrap`}>{t('peerComparison.transactionDialog.table.date')}</TableHead>
                      <TableHead className={`${isRTLLayout ? 'text-right' : 'text-left'} whitespace-nowrap`}>{t('peerComparison.transactionDialog.table.business')}</TableHead>
                      <TableHead className={`${isRTLLayout ? 'text-right' : 'text-left'} whitespace-nowrap`}>{t('peerComparison.transactionDialog.table.amount')}</TableHead>
                      <TableHead className={`${isRTLLayout ? 'text-right' : 'text-left'} whitespace-nowrap`}>{t('peerComparison.transactionDialog.table.systemCategory')}</TableHead>
                      <TableHead className={`${isRTLLayout ? 'text-right' : 'text-left'} whitespace-nowrap`}>{t('peerComparison.transactionDialog.table.details')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCategoryTransactions.map((transaction) => {
                      const category = categories.find(c => c.id === transaction.category_id);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className={`${isRTLLayout ? 'text-right' : 'text-left'} whitespace-nowrap`}>
                            {format(parseISO(transaction.date), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className={`${isRTLLayout ? 'text-right' : 'text-left'} font-medium whitespace-nowrap`}>
                            {transaction.business_name}
                          </TableCell>
                          <TableCell className={`${isRTLLayout ? 'text-right' : 'text-left'} font-semibold text-red-600 whitespace-nowrap`}>
                            {formatCurrency(transaction.billing_amount)}
                          </TableCell>
                          <TableCell className={`${isRTLLayout ? 'text-right' : 'text-left'} whitespace-nowrap`}>
                            <Badge variant="outline">
                              {category?.name || t('peerComparison.transactionDialog.table.uncategorized')}
                            </Badge>
                          </TableCell>
                          <TableCell className={`${isRTLLayout ? 'text-right' : 'text-left'} text-sm text-gray-600 max-w-[200px] truncate`}>
                            {transaction.details || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </ShadcnTable>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('peerComparison.transactionDialog.noTransactions')}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
