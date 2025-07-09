
import React, { useState, useEffect } from 'react';
import { Transaction, Category, Budget, User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import InsightCard from '../components/insights/InsightCard';
import { Loader2, AlertTriangle, Brain, Info, FileUp, FolderTree, Calendar, RefreshCw, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, subMonths, subQuarters, subYears, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, parseISO, differenceInCalendarMonths, differenceInDays, addMonths, addQuarters, addYears } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { formatNumber, formatCurrency, t, isRTL, getCurrentLanguage } from '@/components/utils/i18n';
import { useUserPreferences } from '@/components/utils/UserPreferencesContext';

const availableIconsForLLM = ["ShoppingCart", "TrendingUp", "Activity", "AlertTriangle", "Users", "Smile", "PiggyBank", "Home", "Car", "Utensils", "Gift", "Plane", "CreditCard", "Wallet", "Target", "Calendar", "Clock", "ArrowUp", "ArrowDown"];
const INSIGHTS_STORAGE_KEY = 'financialInsights';
const INSIGHTS_REFRESH_INTERVAL_DAYS = 1;

export default function InsightsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
  const isRTLLayout = isRTL();
  const currentLanguage = getCurrentLanguage();
  const dateFnsLocale = currentLanguage === 'he' ? he : undefined;
  const userCurrency = preferences?.displayCurrency || 'ILS';

  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loadingPrerequisites, setLoadingPrerequisites] = useState(true);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false); // Renamed state
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [hasDataForInsights, setHasDataForInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null); // Renamed state
  const [lastGenerated, setLastGenerated] = useState(null); // New state

  // Enhanced time period state
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('monthly');
  const [selectedPeriodOffset, setSelectedPeriodOffset] = useState(0); // 0 = current, 1 = previous, 2 = 2 periods ago, etc.
  const [currentPeriodInfo, setCurrentPeriodInfo] = useState(null);

  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Constants for minimum data requirements
  const MIN_TRANSACTIONS_FOR_INSIGHTS = 10;
  const MIN_CATEGORIES_FOR_INSIGHTS = 3;
  const MIN_DAYS_OF_DATA = 7;

  const createPageUrl = (pageName) => {
    return `/${pageName.toLowerCase()}`;
  };

  // Calculate the current period info based on selected period and offset
  useEffect(() => {
    const now = new Date();
    let periodStart, periodEnd, periodLabel;

    switch (selectedTimePeriod) {
      case 'monthly':
        if (selectedPeriodOffset === 0) {
          periodStart = startOfMonth(now);
          periodEnd = endOfMonth(now);
          periodLabel = t('insights.timePeriods.currentMonth');
        } else {
          const targetMonth = subMonths(now, selectedPeriodOffset);
          periodStart = startOfMonth(targetMonth);
          periodEnd = endOfMonth(targetMonth);
          periodLabel = currentLanguage === 'he'
            ? format(targetMonth, 'MMMM yyyy', { locale: dateFnsLocale })
            : format(targetMonth, 'MMMM yyyy');
        }
        break;

      case 'quarterly':
        if (selectedPeriodOffset === 0) {
          periodStart = startOfQuarter(now);
          periodEnd = endOfQuarter(now);
          periodLabel = t('insights.timePeriods.currentQuarter');
        } else {
          const targetQuarter = subQuarters(now, selectedPeriodOffset);
          periodStart = startOfQuarter(targetQuarter);
          periodEnd = endOfQuarter(targetQuarter);
          const quarterNum = Math.floor(targetQuarter.getMonth() / 3) + 1;
          periodLabel = currentLanguage === 'he'
            ? `${t('insights.timePeriods.quarter')} ${quarterNum} ${targetQuarter.getFullYear()}`
            : `Q${quarterNum} ${targetQuarter.getFullYear()}`;
        }
        break;

      case 'yearly':
        if (selectedPeriodOffset === 0) {
          periodStart = startOfYear(now);
          periodEnd = endOfYear(now);
          periodLabel = t('insights.timePeriods.currentYear');
        } else {
          const targetYear = subYears(now, selectedPeriodOffset);
          periodStart = startOfYear(targetYear);
          periodEnd = endOfYear(targetYear);
          periodLabel = `${targetYear.getFullYear()}`;
        }
        break;

      default: // Should not happen with current select options, but as a fallback
        periodStart = new Date(Math.min(...transactions.map(t => new Date(t.date))));
        periodEnd = now;
        periodLabel = t('insights.timePeriods.all');
    }

    setCurrentPeriodInfo({
      start: periodStart,
      end: periodEnd,
      label: periodLabel,
      formattedRange: `${format(periodStart, 'dd/MM/yyyy')} - ${format(periodEnd, 'dd/MM/yyyy')}`
    });
  }, [selectedTimePeriod, selectedPeriodOffset, transactions, currentLanguage]);

  // Enhanced data validation
  const validateDataForInsights = (transactionsData, categoriesData) => {
    if (!transactionsData || !categoriesData) {
      return {
        hasEnoughData: false,
        reason: 'missing_data',
        message: t('insights.errors.missingData')
      };
    }

    if (transactionsData.length < MIN_TRANSACTIONS_FOR_INSIGHTS) {
      return {
        hasEnoughData: false,
        reason: 'insufficient_transactions',
        message: t('insights.errors.insufficientTransactions', { count: transactionsData.length, required: MIN_TRANSACTIONS_FOR_INSIGHTS }),
        currentCount: transactionsData.length,
        requiredCount: MIN_TRANSACTIONS_FOR_INSIGHTS
      };
    }

    if (categoriesData.length < MIN_CATEGORIES_FOR_INSIGHTS) {
      return {
        hasEnoughData: false,
        reason: 'insufficient_categories',
        message: t('insights.errors.insufficientCategories', { count: categoriesData.length, required: MIN_CATEGORIES_FOR_INSIGHTS }),
        currentCount: categoriesData.length,
        requiredCount: MIN_CATEGORIES_FOR_INSIGHTS
      };
    }

    if (transactionsData.length > 0) {
      const sortedTransactions = transactionsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const oldestDate = parseISO(sortedTransactions[0].date);
      const mostRecentDate = parseISO(sortedTransactions[sortedTransactions.length - 1].date);
      const daysDifference = differenceInDays(mostRecentDate, oldestDate);

      if (daysDifference < MIN_DAYS_OF_DATA) {
        return {
          hasEnoughData: false,
          reason: 'insufficient_time_range',
          message: t('insights.errors.insufficientTimeRange', { days: daysDifference, required: MIN_DAYS_OF_DATA }),
          currentDays: daysDifference,
          requiredDays: MIN_DAYS_OF_DATA
        };
      }
    }

    const expenseTransactions = transactionsData.filter(t => !t.is_income);
    if (expenseTransactions.length < Math.floor(MIN_TRANSACTIONS_FOR_INSIGHTS * 0.7)) {
      return {
        hasEnoughData: false,
        reason: 'insufficient_expenses',
        message: t('insights.errors.insufficientExpenses'),
        expenseCount: expenseTransactions.length,
        totalCount: transactionsData.length
      };
    }

    return { hasEnoughData: true };
  };

  // Enhanced data loading with validation
  const loadPrerequisiteData = async () => {
    setLoadingPrerequisites(true);
    setInsightsError(null); // Use insightsError
    try {
      console.log("Loading prerequisite data...");
      const [userData, transactionsData, categoriesData, budgetsData] = await Promise.all([
        User.me(),
        Transaction.list('-date', 2000), // Get enough transactions for historical analysis
        Category.list('sort_order'),
        Budget.list()
      ]);

      console.log("Data loaded:", {
        transactions: transactionsData.length,
        categories: categoriesData.length,
        budgets: budgetsData.length
      });

      setUser(userData);
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setBudgets(budgetsData);

      // Enhanced validation
      const validation = validateDataForInsights(transactionsData, categoriesData);

      if (validation.hasEnoughData) {
        setHasDataForInsights(true);
        console.log("✅ Data validation passed - sufficient data for insights");
      } else {
        console.log("❌ Data validation failed:", validation.reason, validation.message);
        setHasDataForInsights(false);
        setInsightsError(validation); // Use insightsError
      }

    } catch (err) {
      console.error("Error loading prerequisite data:", err);
      setInsightsError({ // Use insightsError
        hasEnoughData: false,
        reason: 'loading_error',
        message: t('insights.errors.loadingData')
      });
      toast({
        variant: "destructive",
        title: t('insights.errors.loadingDataTitle'),
        description: err.message || t('insights.errors.tryRefresh')
      });
      setHasDataForInsights(false);
    } finally {
      setLoadingPrerequisites(false);
      setInitialLoadComplete(true);
    }
  };

  // Enhanced function to get time period data based on currentPeriodInfo
  const getTimePeriodData = () => {
    if (!currentPeriodInfo) return { currentPeriodTransactions: [], previousPeriodTransactions: [], periodStart: new Date(), periodEnd: new Date(), previousStart: new Date(), previousEnd: new Date() };

    const { start: periodStart, end: periodEnd } = currentPeriodInfo;

    // Calculate previous period for comparison based on the *displayed period's start date*
    let previousStart, previousEnd;
    switch (selectedTimePeriod) {
      case 'monthly':
        const prevMonth = subMonths(periodStart, 1);
        previousStart = startOfMonth(prevMonth);
        previousEnd = endOfMonth(prevMonth);
        break;
      case 'quarterly':
        const prevQuarter = subQuarters(periodStart, 1);
        previousStart = startOfQuarter(prevQuarter);
        previousEnd = endOfQuarter(prevQuarter);
        break;
      case 'yearly':
        const prevYear = subYears(periodStart, 1);
        previousStart = startOfYear(prevYear);
        previousEnd = endOfYear(prevYear);
        break;
      default: // Fallback, though ideally handled by specific period logic
        previousStart = periodStart;
        previousEnd = periodEnd;
    }

    const currentPeriodTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      return date >= periodStart && date <= periodEnd;
    });

    const previousPeriodTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      return date >= previousStart && date <= previousEnd;
    });

    return {
      currentPeriodTransactions,
      previousPeriodTransactions,
      periodStart,
      periodEnd,
      previousStart,
      previousEnd
    };
  };

  // Helper function to ensure currency format consistency
  const ensureCurrencyFormat = (text, currency) => {
    if (!text || typeof text !== 'string') return text;
    
    // Replace currency symbols to match user preference
    if (currency === 'USD') {
      // Convert ₪ to $ and adjust context
      text = text.replace(/₪/g, '$');
      text = text.replace(/שקל/g, 'דולר');
      text = text.replace(/שקלים/g, 'דולרים');
      text = text.replace(/Shekel/gi, 'Dollar');
      text = text.replace(/NIS/gi, 'USD');
    } else if (currency === 'ILS') {
      // Convert $ to ₪ and adjust context
      text = text.replace(/\$/g, '₪');
      text = text.replace(/דולר/g, 'שקל');
      text = text.replace(/דולרים/g, 'שקלים');
      text = text.replace(/Dollar/gi, 'Shekel');
      text = text.replace(/USD/gi, 'NIS');
    }
    
    return text;
  };

  // Enhanced fallback insights with currency support
  const getFallbackInsights = (currency) => {
    const currencySymbol = currency === 'USD' ? '$' : '₪';
    const currencyName = currency === 'USD' ? 
      (currentLanguage === 'he' ? 'דולר' : 'Dollar') : 
      (currentLanguage === 'he' ? 'שקל' : 'Shekel');

    if (currentLanguage === 'he') {
      return [
        {
          title: `ניתוח הוצאות ב${currencyName}`,
          description: `בחן את ההוצאות שלך לפי קטגוריות כדי לזהות הזדמנויות לחיסכון. הקטגוריות עם ההוצאות הגבוהות ביותר דורשות תשומת לב מיוחדת.`,
          recommendation: `זהה את 3 הקטגוריות עם ההוצאות הגבוהות ביותר וקבע יעדי הפחתה של 10-15% בכל אחת מהן.`,
          potentialImpact: `חיסכון פוטנציאלי של מאות ${currencyName}ים לחודש`,
          urgency: 'medium',
          type: 'spending',
          icon: 'PiggyBank'
        },
        {
          title: 'מעקב תקציב חודשי',
          description: `צור תקציב חודשי מפורט ועקוב אחר ההתקדמות שלך. זה יעזור לך לשמור על משמעת כספית ולהימנע מהוצאות מיותרות.`,
          recommendation: `הגדר תקציב חודשי לכל קטגוריה והשתמש בכלי המעקב של המערכת.`,
          potentialImpact: `שיפור בניהול הכספי וחיסכון של עד 20% מההוצאות`,
          urgency: 'high',
          type: 'budget',
          icon: 'Target'
        }
      ];
    } else {
      return [
        {
          title: `Expense Analysis in ${currencyName}s`,
          description: `Review your expenses by category to identify savings opportunities. Categories with the highest spending require special attention.`,
          recommendation: `Identify your top 3 spending categories and set reduction targets of 10-15% for each.`,
          potentialImpact: `Potential savings of hundreds of ${currencyName}s per month`,
          urgency: 'medium',
          type: 'spending',
          icon: 'PiggyBank'
        },
        {
          title: 'Monthly Budget Tracking',
          description: `Create a detailed monthly budget and track your progress. This will help you maintain financial discipline and avoid unnecessary expenses.`,
          recommendation: `Set a monthly budget for each category and use the system's tracking tools.`,
          potentialImpact: `Improved financial management and savings of up to 20% of expenses`,
          urgency: 'high',
          type: 'budget',
          icon: 'Target'
        }
      ];
    }
  };

  // Function to process raw LLM response
  const processInsightsResponse = (responseText, userCurrency) => {
    try {
      // Clean the response text
      let cleanedResponse = responseText.trim();
      
      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try to extract JSON from the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanedResponse);
      
      if (!parsed.insights || !Array.isArray(parsed.insights)) {
        throw new Error('Invalid insights format');
      }

      // Process each insight to ensure currency consistency
      const processedInsights = parsed.insights.map(insight => ({
        ...insight,
        description: ensureCurrencyFormat(insight.description, userCurrency),
        recommendation: ensureCurrencyFormat(insight.recommendation, userCurrency),
        potentialImpact: ensureCurrencyFormat(insight.potentialImpact, userCurrency),
        title: insight.title || (currentLanguage === 'he' ? 'ללא כותרת' : 'No Title'),
        urgency: insight.urgency || 'medium',
        type: insight.type || 'general',
        icon: availableIconsForLLM.includes(insight.icon) ? insight.icon : 'Brain'
      }));

      return processedInsights;
    } catch (error) {
      console.error('Error processing insights response:', error);
      console.log('Raw response:', responseText);
      
      // Return fallback insights with correct currency
      return getFallbackInsights(userCurrency);
    }
  };

  // Enhanced prompt generation with multilingual support for specific time periods
  const generateAdvancedInsightsPrompt = (currentUser, allTransactions, currentCategories, currentBudgets) => {
    if (!currentUser || !currentPeriodInfo || allTransactions.length === 0 || currentCategories.length === 0) {
      return null;
    }

    const { currentPeriodTransactions, previousPeriodTransactions } = getTimePeriodData();

    // Language-specific prompts
    const getLanguageSpecificPrompt = () => {
      if (currentLanguage === 'he') {
        return `
אתה יועץ כלכלי מקצועי הכותב בעברית.
נתח את הנתונים הפיננסיים הבאים ותן תובנות מעמיקות ומעשיות.

מטבע המערכת: ${userCurrency}
כל הסכומים יוצגו במטבע ${userCurrency === 'ILS' ? 'שקל חדש (₪)' : 'דולר אמריקאי ($)'}.

נתוני תקופה נוכחית (${currentPeriodInfo.label}):
${JSON.stringify(currentPeriodTransactions, null, 2)}

נתוני תקופה קודמת:
${JSON.stringify(previousPeriodTransactions, null, 2)}

קטגוריות זמינות:
${JSON.stringify(currentCategories, null, 2)}

תקציבים:
${JSON.stringify(currentBudgets, null, 2)}

הוראות:
1. צור 3-5 תובנות פיננסיות מעמיקות
2. כל תובנה חייבת לכלול כותרת, תיאור, המלצה, והשפעה פוטנציאלית
3. השתמש במטבע ${userCurrency === 'ILS' ? 'שקל (₪)' : 'דולר ($)'} בכל הסכומים
4. תן דוגמאות ספציפיות עם סכומים מדויקים במטבע הנכון
5. דרג את הדחיפות (high/medium/low) וסוג התובנה (spending/budget/trend/general)
6. הוסף סמל מתאים מהרשימה: ${availableIconsForLLM.join(', ')}

פורמט התגובה בדיוק:
{
  "insights": [
    {
      "title": "כותרת התובנה",
      "description": "תיאור מפורט עם סכומים במטבע ${userCurrency}",
      "recommendation": "המלצה ספציפית",
      "potentialImpact": "השפעה פוטנציאלית עם סכום במטבע ${userCurrency}",
      "urgency": "high/medium/low",
      "type": "spending/budget/trend/general",
      "icon": "שם הסמל"
    }
  ]
}
        `;
      } else {
        return `
You are a professional financial advisor writing in English.
Analyze the following financial data and provide deep, actionable insights.

System Currency: ${userCurrency}
All amounts will be displayed in ${userCurrency === 'ILS' ? 'Israeli Shekel (₪)' : 'US Dollar ($)'}.

Current period data (${currentPeriodInfo.label}):
${JSON.stringify(currentPeriodTransactions, null, 2)}

Previous period data:
${JSON.stringify(previousPeriodTransactions, null, 2)}

Available categories:
${JSON.stringify(currentCategories, null, 2)}

Budgets:
${JSON.stringify(currentBudgets, null, 2)}

Instructions:
1. Create 3-5 deep financial insights
2. Each insight must include title, description, recommendation, and potential impact
3. Use ${userCurrency === 'ILS' ? 'Shekel (₪)' : 'Dollar ($)'} currency for all amounts
4. Provide specific examples with exact amounts in the correct currency
5. Rate urgency (high/medium/low) and insight type (spending/budget/trend/general)
6. Add appropriate icon from: ${availableIconsForLLM.join(', ')}

Response format exactly:
{
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed description with amounts in ${userCurrency}",
      "recommendation": "Specific recommendation",
      "potentialImpact": "Potential impact with amount in ${userCurrency}",
      "urgency": "high/medium/low",
      "type": "spending/budget/trend/general",
      "icon": "icon name"
    }
  ]
}
        `;
      }
    };

    return getLanguageSpecificPrompt();
  };

  // Enhanced insight generation for specific periods
  const generateInsights = async (forceRefresh = false) => {
    if (!hasDataForInsights || !currentPeriodInfo || transactions.length === 0 || categories.length === 0) {
      console.log("❌ Cannot generate insights - insufficient data or no period info");
      setInitialLoadComplete(true);
      return;
    }

    const validation = validateDataForInsights(transactions, categories);
    if (!validation.hasEnoughData) {
      console.log("❌ Re-validation failed before insight generation:", validation.reason);
      setInsightsError(validation);
      setHasDataForInsights(false);
      setInitialLoadComplete(true);
      return;
    }

    console.log(`✅ Starting insights generation for period: ${currentPeriodInfo.label} with currency: ${userCurrency}`);
    setIsGeneratingInsights(true);
    setInsightsError(null);

    try {
      // Period-specific cache key, now includes currency
      const cacheKey = `${INSIGHTS_STORAGE_KEY}_${selectedTimePeriod}_${selectedPeriodOffset}_${currentLanguage}_${userCurrency}`;

      if (!forceRefresh) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const { insights: cachedInsights, timestamp } = JSON.parse(cachedData);
            const now = Date.now();
            const cacheAge = (now - timestamp) / (1000 * 60 * 60 * 24); // days

            if (cacheAge < INSIGHTS_REFRESH_INTERVAL_DAYS && Array.isArray(cachedInsights) && cachedInsights.length > 0) {
              console.log(`📋 Using cached insights for period: ${currentPeriodInfo.label} and currency: ${userCurrency}`);
              setInsights(cachedInsights);
              setInitialLoadComplete(true);
              setIsGeneratingInsights(false);
              setLastGenerated(new Date(timestamp));
              return;
            }
          } catch (cacheError) {
            console.warn("⚠️ Error parsing cached insights:", cacheError);
            localStorage.removeItem(cacheKey);
          }
        }
      }

      // Generate new insights for the specific period
      const prompt = generateAdvancedInsightsPrompt(user, transactions, categories, budgets);

      if (!prompt) {
        throw new Error(currentLanguage === 'he' ? 'לא ניתן ליצור prompt לתובנות' : 'Cannot generate insights prompt');
      }

      console.log(`🤖 Calling LLM for insights generation for period: ${currentPeriodInfo.label}`);

      const llmResponse = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  recommendation: { type: "string" },
                  potentialImpact: { type: "string" }, // Added potentialImpact
                  urgency: { type: "string", enum: ["high", "medium", "low"] },
                  type: { type: "string", enum: ["spending", "budget", "trend", "general"] },
                  icon: { type: "string" }
                },
                required: ["title", "description", "recommendation", "urgency", "type"] // Updated required fields
              }
            }
          },
          required: ["insights"]
        }
      });

      console.log("🎯 LLM Response received:", llmResponse);

      // Process response with currency context
      const processedInsights = processInsightsResponse(JSON.stringify(llmResponse), userCurrency);

      if (processedInsights.length === 0) {
        throw new Error(currentLanguage === 'he' ? 'לא נמצאו תובנות תקינות' : 'No valid insights found');
      }

      console.log(`✅ Generated ${processedInsights.length} valid insights`);
      setInsights(processedInsights);
      setLastGenerated(new Date());

      // Cache the results
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          insights: processedInsights,
          timestamp: Date.now(),
          timePeriod: selectedTimePeriod,
          currency: userCurrency
        }));
      } catch (storageError) {
        console.warn("⚠️ Could not cache insights:", storageError);
      }

      if (processedInsights.length < llmResponse.insights.length) {
        toast({
          title: currentLanguage === 'he' ? 'אזהרה' : 'Warning',
          description: currentLanguage === 'he' ? 'חלק מהתובנות לא היו תקינות או חסרו שדות' : 'Some insights were invalid or missing fields',
          variant: "default"
        });
      }
      toast({
        title: t('insights.success.generated'),
        description: t('insights.success.generatedDescription', { count: processedInsights.length }),
      });


    } catch (error) {
      console.error("❌ Error generating insights:", error);
      const fallbackInsights = getFallbackInsights(userCurrency);
      setInsights(fallbackInsights);
      setInsightsError({
        hasEnoughData: false,
        reason: 'generation_error',
        message: error.message || (currentLanguage === 'he' ? 'שגיאה ביצירת תובנות' : 'Error generating insights'),
        canRetry: true
      });
      toast({
        variant: "destructive",
        title: currentLanguage === 'he' ? 'שגיאה' : 'Error',
        description: error.message || (currentLanguage === 'he' ? 'נסה שוב בעוד כמה דקות' : 'Try again in a few minutes')
      });
    } finally {
      setIsGeneratingInsights(false);
      setInitialLoadComplete(true);
    }
  };

  // Navigation functions for period navigation
  const canNavigatePrevious = () => {
    // Allow going back up to 24 periods (e.g., 2 years of monthly data)
    // or to the point where there are very few transactions left (adjust logic as needed)
    return selectedPeriodOffset < 24; // Arbitrary limit, could be dynamic
  };

  const canNavigateNext = () => {
    return selectedPeriodOffset > 0;
  };

  const navigatePreviousPeriod = () => {
    if (canNavigatePrevious()) {
      setSelectedPeriodOffset(prev => prev + 1);
    }
  };

  const navigateNextPeriod = () => {
    if (canNavigateNext()) {
      setSelectedPeriodOffset(prev => prev - 1);
    }
  };

  const resetToCurrentPeriod = () => {
    setSelectedPeriodOffset(0);
  };

  // Load data on component mount
  useEffect(() => {
    loadPrerequisiteData();
  }, []);

  // New: loadCachedInsights function
  const loadCachedInsights = () => {
    if (typeof window === 'undefined') return false;

    try {
      const cached = localStorage.getItem(INSIGHTS_STORAGE_KEY);
      if (!cached) return false;

      const { insights: cachedInsights, timestamp, timePeriod, currency } = JSON.parse(cached); // Destructure currency
      const age = Date.now() - timestamp;
      const maxAge = INSIGHTS_REFRESH_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

      // Check if cache is still valid, time period matches, and currency matches
      if (age < maxAge && timePeriod === selectedTimePeriod && currency === userCurrency) {
        setInsights(cachedInsights);
        setLastGenerated(new Date(timestamp));
        console.log("Cached insights loaded successfully.");
        return true;
      }

      // Clear outdated cache (either too old, wrong period, or wrong currency)
      console.log("Cached insights are outdated or mismatch, clearing cache.");
      localStorage.removeItem(INSIGHTS_STORAGE_KEY);
      return false;
    } catch (error) {
      console.error('Error loading cached insights:', error);
      localStorage.removeItem(INSIGHTS_STORAGE_KEY);
      return false;
    }
  };

  // Generate insights when data is ready or settings change
  useEffect(() => {
    if (hasDataForInsights && !loadingPrerequisites && currentPeriodInfo) {
      // Attempt to load from cache first
      if (!loadCachedInsights()) {
        generateInsights();
      }
    }
  }, [hasDataForInsights, loadingPrerequisites, selectedTimePeriod, selectedPeriodOffset, currentLanguage, userCurrency, currentPeriodInfo]); // Add userCurrency as dependency


  // Filter insights based on selected filters
  const filteredInsights = insights.filter(insight => {
    const urgencyMatch = filterUrgency === 'all' || insight.urgency === filterUrgency;
    const typeMatch = filterType === 'all' || insight.type === filterType;
    return urgencyMatch && typeMatch;
  });

  // Loading state
  if (loadingPrerequisites) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">{t('insights.loading.prerequisites')}</h2>
          <p className="text-gray-600">
            {t('insights.loading.validatingData')}
          </p>
        </div>
      </div>
    );
  }

  // Enhanced no data state with detailed information
  if (initialLoadComplete && (!hasDataForInsights || (insightsError && !insightsError.hasEnoughData))) {
    const errorInfo = insightsError || { reason: 'unknown', message: t('insights.noData.description') };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6 text-center" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Brain className="w-20 h-20 text-blue-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-700 mb-4">
              {t('insights.noData.title')}
            </h2>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200 mb-6">
              <p className="text-lg text-gray-600 mb-4">{errorInfo.message}</p>

              {errorInfo.reason === 'insufficient_transactions' && (
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-medium mb-2">
                    {t('insights.noData.whatIsNeeded')}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-start">
                    <li>
                      {t('insights.noData.requiredTransactions', { required: MIN_TRANSACTIONS_FOR_INSIGHTS, current: errorInfo.currentCount })}
                    </li>
                    <li>
                      {t('insights.noData.transactionsOverDays', { days: MIN_DAYS_OF_DATA })}
                    </li>
                    <li>
                      {t('insights.noData.differentCategories', { categories: MIN_CATEGORIES_FOR_INSIGHTS })}
                    </li>
                    <li>
                      {t('insights.noData.sufficientExpenseTransactions')}
                    </li>
                  </ul>
                </div>
              )}

              {errorInfo.reason === 'insufficient_categories' && (
                <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-800">
                  <p className="font-medium mb-2">
                    {t('insights.noData.moreCategoriesNeeded')}
                  </p>
                  <p>
                    {t('insights.noData.categoryCountInfo', { current: errorInfo.currentCount, required: errorInfo.requiredCount })}
                  </p>
                </div>
              )}

              {errorInfo.reason === 'insufficient_time_range' && (
                <div className="bg-orange-50 rounded-lg p-4 text-sm text-orange-800">
                  <p className="font-medium mb-2">
                    {t('insights.noData.widerTimeRangeNeeded')}
                  </p>
                  <p>
                    {t('insights.noData.timeRangeInfo', { current: errorInfo.currentDays, required: errorInfo.requiredDays })}
                  </p>
                </div>
              )}
              {errorInfo.reason === 'insufficient_expenses' && (
                <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
                  <p className="font-medium mb-2">
                    {t('insights.noData.moreExpenseTransactionsNeeded')}
                  </p>
                  <p>
                    {t('insights.noData.expenseCountInfo', { expenseCount: errorInfo.expenseCount, totalCount: errorInfo.totalCount })}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
              <Card className="bg-white/80 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('Upload'))}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2 text-blue-600">
                    <FileUp size={20} />
                    {t('insights.noData.uploadTransactions')}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-white/80 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('CategoryManagement'))}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2 text-purple-600">
                    <FolderTree size={20} />
                    {t('insights.noData.manageCategories')}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Button variant="outline" onClick={loadPrerequisiteData} className="mt-6">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('insights.checkAgain')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header with Period Navigation */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {t('insights.title')}
                </h1>
                <p className="text-gray-600 mt-1">{t('insights.subtitle')}</p>
                {currentPeriodInfo && (
                  <Badge variant="outline" className="mt-2 text-sm bg-white border-blue-200 text-blue-700 font-medium">
                    {currentPeriodInfo.label}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Time Period Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <Select value={selectedTimePeriod} onValueChange={(value) => {
                  setSelectedTimePeriod(value);
                  setSelectedPeriodOffset(0); // Reset to current period when changing type
                }}>
                  <SelectTrigger className="w-36 bg-white/90">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                    <SelectItem value="monthly">{t('insights.timePeriods.monthly')}</SelectItem>
                    <SelectItem value="quarterly">{t('insights.timePeriods.quarterly')}</SelectItem>
                    <SelectItem value="yearly">{t('insights.timePeriods.yearly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Period Navigation */}
              <div className="flex items-center gap-1 bg-white/90 rounded-lg p-1 border border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigatePreviousPeriod}
                  disabled={!canNavigatePrevious() || isGeneratingInsights}
                  className="h-8 w-8 p-0"
                >
                  {isRTLLayout ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToCurrentPeriod}
                  disabled={selectedPeriodOffset === 0 || isGeneratingInsights}
                  className="h-8 px-2 text-xs"
                >
                  {t('insights.currentPeriod')}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateNextPeriod}
                  disabled={!canNavigateNext() || isGeneratingInsights}
                  className="h-8 w-8 p-0"
                >
                  {isRTLLayout ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>

              {/* Historical Period Indicator */}
              {selectedPeriodOffset > 0 && (
                <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1 shadow-sm">
                  <History className="w-3 h-3" />
                  {t('insights.historicalPeriod')}
                </Badge>
              )}

              <Button
                onClick={() => generateInsights(true)}
                disabled={isGeneratingInsights || !hasDataForInsights || !currentPeriodInfo}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 ${isGeneratingInsights ? 'animate-spin mr-2' : isRTLLayout ? 'ml-2' : 'mr-2'}`} />
                {t('insights.refreshInsights')}
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-700">{t('insights.filters.filterBy')}:</span>

              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="w-40 bg-white/90">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                  <SelectItem value="all">{t('insights.filters.allUrgency')}</SelectItem>
                  <SelectItem value="high">{t('insights.filters.highUrgency')}</SelectItem>
                  <SelectItem value="medium">{t('insights.filters.mediumUrgency')}</SelectItem>
                  <SelectItem value="low">{t('insights.filters.lowUrgency')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40 bg-white/90">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                  <SelectItem value="all">{t('insights.filters.allTypes')}</SelectItem>
                  <SelectItem value="spending">{t('insights.filters.spending')}</SelectItem>
                  <SelectItem value="budget">{t('insights.filters.budget')}</SelectItem>
                  <SelectItem value="trend">{t('insights.filters.trend')}</SelectItem>
                  <SelectItem value="general">{t('insights.filters.general')}</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600">
                {t('insights.filters.showing', { count: filteredInsights.length, total: filteredInsights.length })} {t('insights.filters.results')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights Content */}
        {isGeneratingInsights ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('insights.generating.title')}</h3>
            <p className="text-gray-600">
              {currentPeriodInfo ?
                t('insights.generating.periodDescription', { periodLabel: currentPeriodInfo.label }) :
                t('insights.generating.description')
              }
            </p>
          </div>
        ) : insightsError && insightsError.reason === 'generation_error' ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">{t('insights.error.title')}</h3>
              <p className="text-red-600 mb-4">{insightsError.message}</p>
              <Button onClick={() => generateInsights(true)} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                {t('insights.error.tryAgain')}
              </Button>
            </CardContent>
          </Card>
        ) : filteredInsights.length === 0 ? (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6 text-center">
              <Info className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                {insights.length === 0 ? t('insights.noNewInsights.title') : t('insights.noFilterMatch.title')}
              </h3>
              <p className="text-yellow-600">
                {insights.length === 0 ?
                  (currentPeriodInfo ?
                    t('insights.noNewInsights.periodDescription', { periodLabel: currentPeriodInfo.label }) :
                    t('insights.noNewInsights.description')) :
                  t('insights.noFilterMatch.description')
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredInsights.map((insight, index) => (
              <InsightCard
                key={`${selectedTimePeriod}-${selectedPeriodOffset}-${index}`}
                insight={insight}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
