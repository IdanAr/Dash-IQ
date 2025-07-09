
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Transaction, Category, Budget } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bell,
  BarChart3,
  FileUp,
  FolderTree,
  PieChart as PieChartIcon,
  Info as InfoIcon
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  isWithinInterval,
  differenceInDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addQuarters,
  subQuarters,
  addYears,
  subYears,
  isSameWeek,
  isAfter,
  isBefore,
  getQuarter,
  getYear,
  parseISO,
  addDays
} from "date-fns";
import { he } from "date-fns/locale";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ReferenceLine, Label } from "recharts";
import { truncateText } from "@/components/utils";
import { CustomTooltip } from "../components/dashboard/CustomTooltip";
import { IconRenderer } from "@/components/utils/icons";
import { createPageUrl } from "@/utils";
import BudgetMetrics from "../components/dashboard/WeeklyMetrics";
import MonthlyComparison from "../components/dashboard/MonthlyComparison";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import CategorySummaryReport from "../components/dashboard/CategorySummaryReport";
import FinancialAssistant from "@/components/ai/FinancialAssistant";
import FinancialSummaryCards from '../components/dashboard/FinancialSummaryCards'; // New import
import { t, isRTL, formatCurrency, formatDate, getCurrentLanguage } from "@/components/utils/i18n";
import { initializeNewUser } from "@/components/utils/initializeUser";
import WelcomeGuide from "@/components/onboarding/WelcomeGuide";
import { useUserPreferences } from "@/components/utils/UserPreferencesContext";

const ENHANCED_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
  '#14B8A6',
  '#A855F7'
];

const CARD_GRADIENTS = {
  income: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
  expense: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
  balance: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
  budget: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
  insights: 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50'
};

const getPreviousPeriodRange = (currentStartDate, currentEndDate, periodType) => {
  let previousStart, previousEnd;
  // const daysInCurrentPeriod = differenceInDays(currentEndDate, currentStartDate) + 1; // Not used

  switch (periodType) {
    case "week":
      previousStart = subWeeks(currentStartDate, 1);
      previousEnd = endOfWeek(previousStart, { weekStartsOn: 0 });
      break;
    case "month":
      const prevMonthDate = subMonths(currentStartDate, 1);
      previousStart = startOfMonth(prevMonthDate);
      previousEnd = endOfMonth(prevMonthDate);
      break;
    case "quarter":
      const prevQuarterDate = subQuarters(currentStartDate, 1);
      previousStart = startOfQuarter(prevQuarterDate);
      previousEnd = endOfQuarter(prevQuarterDate);
      break;
    case "year":
      const prevYearDate = subYears(currentStartDate, 1);
      previousStart = startOfYear(prevYearDate);
      previousEnd = endOfYear(prevYearDate);
      break;
    default:
      const defaultPrevMonth = subMonths(currentStartDate, 1);
      previousStart = startOfMonth(defaultPrevMonth);
      previousEnd = endOfMonth(defaultPrevMonth);
  }
  return { previousStart, previousEnd };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [periodType, setPeriodType] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("overview");
  // const [selectedCategory, setSelectedCategory] = useState(null); // Not used
  const [selectedCategoryForReport, setSelectedCategoryForReport] = useState(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [filteredCategoryIds, setFilteredCategoryIds] = useState([]);
  const { toast } = useToast();
  const isRTLLayout = isRTL();

  const { preferences } = useUserPreferences();

  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(
    localStorage.getItem('userInitialized') === 'true'
  );

  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);

  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netFlow: 0,
    categorySummary: [],
    transactionsByDate: [],
    expenseCategoriesChart: [],
    incomeCategoriesChart: []
  });
  const [insightsStats, setInsightsStats] = useState({
    overBudget: [],
    unusualSpending: [],
    spendingTrend: null, // For quick insights card
    previousTotalIncome: 0, // For FinancialSummaryCards
    previousTotalExpenses: 0 // For FinancialSummaryCards
  });

  const [summaryKPIs, setSummaryKPIs] = useState({
    totalAmount: 0,
    transactionCount: 0,
    averageTransaction: 0,
    percentageOfTotal: 0,
    topBusinesses: [],
    spendingTrend: null, // For category report KPI, not the main overview
    budgetStatus: null
  });

  const [transactionsFromTopBusinesses, setTransactionsFromTopBusinesses] = useState([]);

  // Memoize expensive chart data calculations
  const chartData = useMemo(() => {
    if (!stats.transactionsByDate.length) return { barChartData: [], pieChartData: [] };
    
    return {
      barChartData: stats.transactionsByDate,
      pieChartData: stats.expenseCategoriesChart
    };
  }, [stats.transactionsByDate, stats.expenseCategoriesChart]);

  const monthlyTrendData = useMemo(() => {
    if (!transactions.length) return [];
    
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(currentDate, i));
      const monthEnd = endOfMonth(subMonths(currentDate, i));

      const monthlyExpenses = transactions
        .filter(t => !t.is_income && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
        .reduce((sum, t) => sum + t.billing_amount, 0);

      trendData.push({
        name: format(monthStart, 'MMM yy', { locale: he }), // e.g., 'Jan 23'
        expenses: Math.round(monthlyExpenses),
      });
    }
    return trendData;
  }, [transactions, currentDate]);

  const topExpenseCategoriesData = useMemo(() => {
    if (!chartData.pieChartData.length) return [];
    return [...chartData.pieChartData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [chartData.pieChartData]);

  const getDateRange = useCallback((dateContext, pType) => {
    switch (pType) {
      case "week":
        return { startDate: startOfWeek(dateContext, { weekStartsOn: 0 }), endDate: endOfWeek(dateContext, { weekStartsOn: 0 }) };
      case "month":
        return { startDate: startOfMonth(dateContext), endDate: endOfMonth(dateContext) };
      case "quarter":
        return { startDate: startOfQuarter(dateContext), endDate: endOfQuarter(dateContext) };
      case "year":
        return { startDate: startOfYear(dateContext), endDate: endOfYear(dateContext) };
      default:
        return { startDate: startOfMonth(dateContext), endDate: endOfMonth(dateContext) };
    }
  }, []);

  const calculateStats = useCallback((transactionsData, categoriesData, budgetsData, pType, dateCtx, filterCategoryIds = []) => {
    // Add memoization key for caching
    const cacheKey = `${pType}-${dateCtx.getTime()}-${filterCategoryIds.join(',')}-${transactionsData.length}`;

    // Simple in-memory cache
    if (window.statsCache && window.statsCache[cacheKey]) {
      return window.statsCache[cacheKey];
    }

    const { startDate: viewStartDate, endDate: viewEndDate } = getDateRange(dateCtx, pType);

    const filteredTransactions = transactionsData.filter(t => {
      const transactionDate = parseISO(t.date);
      const isInPeriod = isWithinInterval(transactionDate, { start: viewStartDate, end: viewEndDate });

      if (filterCategoryIds.length > 0) {
        return isInPeriod && filterCategoryIds.includes(t.category_id);
      }

      return isInPeriod;
    });

    const allPeriodTransactions = transactionsData.filter(t => {
      const transactionDate = parseISO(t.date);
      return isWithinInterval(transactionDate, { start: viewStartDate, end: viewEndDate });
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    allPeriodTransactions.forEach(t => {
      if (t.is_income) {
        totalIncome += Math.round(t.billing_amount);
      } else {
        totalExpenses += Math.round(t.billing_amount);
      }
    });

    const categoryTotals = {};
    filteredTransactions.forEach(t => {
      if (t.category_id) {
        if (!categoryTotals[t.category_id]) {
          categoryTotals[t.category_id] = { amount: 0, count: 0 };
        }
        categoryTotals[t.category_id].amount += Math.round(t.billing_amount);
        categoryTotals[t.category_id].count++;
      }
    });

    const categorySummary = categoriesData.map(category => {
      const budgetItem = budgetsData.find(b => b.category_id === category.id);
      const totalSpent = categoryTotals[category.id]?.amount || 0;
      let adjustedBudget = null;
      let budgetPercentage = null;

      if (budgetItem) {
        switch (budgetItem.period) {
          case "monthly":
            if (pType === "week") adjustedBudget = Math.round(budgetItem.amount / 4.33);
            else if (pType === "month") adjustedBudget = Math.round(budgetItem.amount);
            else if (pType === "quarter") adjustedBudget = Math.round(budgetItem.amount * 3);
            else if (pType === "year") adjustedBudget = Math.round(budgetItem.amount * 12);
            break;
          case "quarterly":
            if (pType === "week") adjustedBudget = Math.round(budgetItem.amount / 13);
            else if (pType === "month") adjustedBudget = Math.round(budgetItem.amount / 3);
            else if (pType === "quarter") adjustedBudget = Math.round(budgetItem.amount);
            else if (pType === "year") adjustedBudget = Math.round(budgetItem.amount * 4);
            break;
          case "yearly":
            if (pType === "week") adjustedBudget = Math.round(budgetItem.amount / 52);
            else if (pType === "month") adjustedBudget = Math.round(budgetItem.amount / 12);
            else if (pType === "quarter") adjustedBudget = Math.round(budgetItem.amount / 4);
            else if (pType === "year") adjustedBudget = Math.round(budgetItem.amount);
            break;
          default:
            adjustedBudget = Math.round(budgetItem.amount);
        }
        if (adjustedBudget > 0) {
          budgetPercentage = Math.round((totalSpent / adjustedBudget) * 100);
        }
      }

      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        type: category.type,
        amount: totalSpent,
        count: categoryTotals[category.id]?.count || 0,
        budget: adjustedBudget,
        budgetOriginalAmount: budgetItem?.amount ? Math.round(budgetItem.amount) : null,
        budgetPeriod: budgetItem?.period,
        budgetPercentage: budgetPercentage
      };
    });

    const transactionsByDate = [];
    if (viewStartDate && viewEndDate) {
      const groupedByDate = {};
      const transactionsToUseForChart = filterCategoryIds.length > 0 ? filteredTransactions : allPeriodTransactions;

      transactionsToUseForChart.forEach(t => {
        const dateStr = format(parseISO(t.date), 'yyyy-MM-dd');
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = { date: dateStr, income: 0, expenses: 0 };
        }
        if (t.is_income) groupedByDate[dateStr].income += Math.round(t.billing_amount);
        else groupedByDate[dateStr].expenses += Math.round(t.billing_amount);
      });

      let currentDatePointer = new Date(viewStartDate);
      while (currentDatePointer <= viewEndDate) {
        const dateStr = format(currentDatePointer, 'yyyy-MM-dd');
        if (!groupedByDate[dateStr]) {
          transactionsByDate.push({ date: dateStr, income: 0, expenses: 0, shortDate: format(currentDatePointer, "dd/MM", { locale: he }) });
        } else {
          transactionsByDate.push({ ...groupedByDate[dateStr], shortDate: format(parseISO(dateStr), "dd/MM", { locale: he }) });
        }
        currentDatePointer = addDays(currentDatePointer, 1);
      }
      transactionsByDate.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    let expenseCategoriesChart = categorySummary
      .filter(c => c.type === 'expense' && c.amount > 0);
    let incomeCategoriesChart = categorySummary
      .filter(c => c.type === 'income' && c.amount > 0);

    if (filterCategoryIds.length > 0) {
      expenseCategoriesChart = expenseCategoriesChart.filter(c => filterCategoryIds.includes(c.id));
      incomeCategoriesChart = incomeCategoriesChart.filter(c => filterCategoryIds.includes(c.id));
    }

    expenseCategoriesChart = expenseCategoriesChart.map(c => ({ name: c.name, value: c.amount, icon: c.icon }));
    incomeCategoriesChart = incomeCategoriesChart.map(c => ({ name: c.name, value: c.amount, icon: c.icon }));

    const result = {
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      netFlow: Math.round(totalIncome - totalExpenses),
      categorySummary,
      transactionsByDate,
      expenseCategoriesChart,
      incomeCategoriesChart,
    };

    // Cache the result
    if (!window.statsCache) window.statsCache = {};
    window.statsCache[cacheKey] = result;
    
    return result;
  }, [getDateRange]);

  const generateInsights = useCallback((transactionsData, categoriesData, budgetsData, pType, dateCtx) => {
    const { startDate: viewStartDate, endDate: viewEndDate } = getDateRange(dateCtx, pType);
    const { previousStart, previousEnd } = getPreviousPeriodRange(viewStartDate, viewEndDate, pType);

    const currentPeriodTransactions = transactionsData.filter(t => {
      const transactionDate = parseISO(t.date);
      return isWithinInterval(transactionDate, { start: viewStartDate, end: viewEndDate });
    });

    const previousPeriodTransactions = transactionsData.filter(t => {
      const transactionDate = parseISO(t.date);
      return isWithinInterval(transactionDate, { start: previousStart, end: previousEnd });
    });

    const currentTotalExpenses = Math.round(currentPeriodTransactions
      .filter(t => !t.is_income)
      .reduce((sum, t) => sum + t.billing_amount, 0));
    const previousTotalExpenses = Math.round(previousPeriodTransactions
      .filter(t => !t.is_income)
      .reduce((sum, t) => sum + t.billing_amount, 0));
    
    const currentTotalIncome = Math.round(currentPeriodTransactions
      .filter(t => t.is_income)
      .reduce((sum, t) => sum + t.billing_amount, 0));
    const previousTotalIncome = Math.round(previousPeriodTransactions
      .filter(t => t.is_income)
      .reduce((sum, t) => sum + t.billing_amount, 0));

    let spendingTrend = null;
    if (previousTotalExpenses > 0) {
      const changePercentage = ((currentTotalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100;
      spendingTrend = {
        isIncrease: currentTotalExpenses > previousTotalExpenses,
        changePercentage: Math.round(changePercentage),
        currentAmount: currentTotalExpenses,
        previousAmount: previousTotalExpenses
      };
    } else if (currentTotalExpenses > 0) { // If previous was 0 but current is positive
      spendingTrend = {
          isIncrease: true,
          changePercentage: 100, // 100% increase from zero
          currentAmount: currentTotalExpenses,
          previousAmount: 0
      };
    }


    const overBudget = [];
    const currentStatsForBudgets = calculateStats(transactionsData, categoriesData, budgetsData, pType, dateCtx);

    currentStatsForBudgets.categorySummary.forEach(summaryItem => {
      if (summaryItem.type === 'expense' && summaryItem.budget && summaryItem.amount > summaryItem.budget) {
        overBudget.push({
          categoryId: summaryItem.id,
          categoryName: summaryItem.name,
          icon: summaryItem.icon,
          actual: Math.round(summaryItem.amount),
          budgeted: Math.round(summaryItem.budget),
          overPercentage: Math.round(((summaryItem.amount - summaryItem.budget) / summaryItem.budget) * 100)
        });
      }
    });

    const unusualSpending = [];
    // Only calculate previous stats for insights. For summary cards, we use raw previous totals.
    const previousStatsForInsights = calculateStats(transactionsData, categoriesData, budgetsData, pType, previousStart);

    currentStatsForBudgets.categorySummary.forEach(currentCatSummary => {
      if (currentCatSummary.type === 'expense' && currentCatSummary.amount > 0) {
        const prevCatSummary = previousStatsForInsights.categorySummary.find(pcs => pcs.id === currentCatSummary.id);
        const prevAmount = prevCatSummary?.amount || 0;

        if (prevAmount > 0 && currentCatSummary.amount > prevAmount * 1.5) {
          unusualSpending.push({
            categoryId: currentCatSummary.id,
            categoryName: currentCatSummary.name,
            icon: currentCatSummary.icon,
            currentAmount: Math.round(currentCatSummary.amount),
            previousAmount: Math.round(prevAmount),
            increasePercentage: Math.round(((currentCatSummary.amount - prevAmount) / prevAmount) * 100)
          });
        } else if (prevAmount === 0 && currentCatSummary.amount > 50) { // Threshold for "new" significant spending
          unusualSpending.push({
            categoryId: currentCatSummary.id,
            categoryName: currentCatSummary.name,
            icon: currentCatSummary.icon,
            currentAmount: Math.round(currentCatSummary.amount),
            previousAmount: 0,
            increasePercentage: 100
          });
        }
      }
    });

    return {
      overBudget: overBudget.sort((a, b) => b.overPercentage - a.overPercentage),
      unusualSpending: unusualSpending.sort((a, b) => b.increasePercentage - a.increasePercentage),
      spendingTrend, // This specific trend is for the insights card
      previousTotalIncome, // Raw value for FinancialSummaryCards
      previousTotalExpenses // Raw value for FinancialSummaryCards
    };
  }, [getDateRange, calculateStats]);

  const calculateSummaryKPIs = useCallback(() => {
    const { startDate: viewStartDate, endDate: viewEndDate } = getDateRange(currentDate, periodType);
    const { previousStart, previousEnd } = getPreviousPeriodRange(viewStartDate, viewEndDate, periodType);

    const currentTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.date);
      const isInPeriod = isWithinInterval(transactionDate, { start: viewStartDate, end: viewEndDate });

      if (selectedCategoryForReport) {
        return isInPeriod && t.category_id === selectedCategoryForReport.id;
      }

      if (filteredCategoryIds.length > 0) {
        return isInPeriod && !t.is_income && filteredCategoryIds.includes(t.category_id);
      }

      return isInPeriod && !t.is_income;
    });

    const previousTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.date);
      const isInPeriod = isWithinInterval(transactionDate, { start: previousStart, end: previousEnd });

      if (selectedCategoryForReport) {
        return isInPeriod && t.category_id === selectedCategoryForReport.id;
      }

      if (filteredCategoryIds.length > 0) {
        return isInPeriod && !t.is_income && filteredCategoryIds.includes(t.category_id);
      }

      return isInPeriod && !t.is_income;
    });

    const totalAmount = Math.round(currentTransactions.reduce((sum, t) => sum + t.billing_amount, 0));
    const transactionCount = currentTransactions.length;
    const averageTransaction = transactionCount > 0 ? Math.round(totalAmount / transactionCount) : 0;

    const previousAmount = Math.round(previousTransactions.reduce((sum, t) => sum + t.billing_amount, 0));
    const spendingTrend = previousAmount > 0
      ? Math.round(((totalAmount - previousAmount) / previousAmount) * 100)
      : totalAmount > 0 ? 100 : 0; // If previous was 0 and current is >0, consider 100% increase

    let totalExpensesForPercentage;
    if (filteredCategoryIds.length > 0) {
      totalExpensesForPercentage = transactions
        .filter(t => {
          const transactionDate = parseISO(t.date);
          return isWithinInterval(transactionDate, { start: viewStartDate, end: viewEndDate }) &&
            !t.is_income &&
            filteredCategoryIds.includes(t.category_id);
        })
        .reduce((sum, t) => sum + t.billing_amount, 0);
    } else {
      totalExpensesForPercentage = transactions
        .filter(t => {
          const transactionDate = parseISO(t.date);
          return isWithinInterval(transactionDate, { start: viewStartDate, end: viewEndDate }) && !t.is_income;
        })
        .reduce((sum, t) => sum + t.billing_amount, 0);
    }

    const percentageOfTotal = totalExpensesForPercentage > 0 ? Math.round((totalAmount / totalExpensesForPercentage) * 100) : 0;

    const businessSpending = currentTransactions.reduce((acc, t) => {
      const name = t.business_name;
      acc[name] = Math.round((acc[name] || 0) + t.billing_amount);
      return acc;
    }, {});

    const topBusinesses = Object.entries(businessSpending)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    let budgetStatus = null;
    if (selectedCategoryForReport) {
      const budget = budgets.find(b => b.category_id === selectedCategoryForReport.id);
      if (budget) {
        const budgetMultiplier = getBudgetMultiplier(periodType);
        const adjustedBudget = Math.round(budget.amount * budgetMultiplier);
        const percentage = adjustedBudget > 0 ? Math.round((totalAmount / adjustedBudget) * 100) : 0;

        budgetStatus = {
          budgetAmount: adjustedBudget,
          spentAmount: totalAmount,
          percentage: percentage,
          status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
        };
      }
    }

    setSummaryKPIs({
      totalAmount,
      transactionCount,
      averageTransaction,
      percentageOfTotal,
      topBusinesses,
      spendingTrend,
      budgetStatus
    });
  }, [transactions, currentDate, periodType, budgets, getDateRange, selectedCategoryForReport, filteredCategoryIds]);

  const getBudgetMultiplier = (pType) => {
    switch (pType) {
      case "week": return 7 / 30; // Approximation
      case "month": return 1;
      case "quarter": return 3;
      case "year": return 12;
      default: return 1;
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Optimize data loading - only fetch recent transactions for dashboard
      const [transactionsData, categoriesData, budgetsData] = await Promise.all([
        Transaction.list('-date', 1000), // Limit to last 1000 transactions
        Category.list('sort_order'),
        Budget.list()
      ]);

      const dataExists = transactionsData.length > 0 || categoriesData.length > 0 || budgetsData.length > 0;
      setHasData(dataExists);

      setTransactions(transactionsData);
      setCategories(categoriesData);
      setBudgets(budgetsData);

      if (dataExists) {
        // Use requestIdleCallback for non-critical calculations
        const calculateAndSetStats = () => {
          const calculatedStats = calculateStats(transactionsData, categoriesData, budgetsData, periodType, currentDate, filteredCategoryIds);
          setStats(calculatedStats);

          const generatedInsights = generateInsights(transactionsData, categoriesData, budgetsData, periodType, currentDate);
          setInsightsStats(generatedInsights);
        };

        if (window.requestIdleCallback) {
          window.requestIdleCallback(calculateAndSetStats);
        } else {
          setTimeout(calculateAndSetStats, 0);
        }
      } else {
        setStats({
          totalIncome: 0, totalExpenses: 0, netFlow: 0, categorySummary: [],
          transactionsByDate: [], expenseCategoriesChart: [], incomeCategoriesChart: []
        });
        setInsightsStats({
          overBudget: [],
          unusualSpending: [],
          spendingTrend: null,
          previousTotalIncome: 0,
          previousTotalExpenses: 0
        });
        setSummaryKPIs({
          totalAmount: 0,
          transactionCount: 0,
          averageTransaction: 0,
          percentageOfTotal: 0,
          topBusinesses: [],
          spendingTrend: null,
          budgetStatus: null
        });
        setTransactionsFromTopBusinesses([]);
      }

    }
    catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: t('common.error'),
        description: t('errors.loadingData'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setInitialLoadComplete(true);
    }
  }, [periodType, currentDate, toast, calculateStats, generateInsights, filteredCategoryIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const initializeUserIfNeeded = async () => {
      if (!hasInitialized && !isInitializing && initialLoadComplete) {
        console.log('[DASHBOARD] Checking if user initialization is needed...');
        
        // Check if user has any data at all
        const hasAnyData = transactions.length > 0 || categories.length > 0 || budgets.length > 0;
        
        if (!hasAnyData) {
          console.log('[DASHBOARD] No user data found, initializing new user...');
          setIsInitializing(true);
          
          try {
            const initResult = await initializeNewUser();
            console.log('[DASHBOARD] User initialization result:', initResult);
            
            if (initResult.success && initResult.details.categories.categoriesCreated > 0) {
              toast({
                title: "ברוכים הבאים!",
                description: `המערכת הוכנה עבורך עם ${initResult.details.categories.categoriesCreated} קטגוריות ברירת מחדל.`,
                duration: 5000,
              });
              
              // Reload data to show the new categories
              setTimeout(() => {
                loadData();
              }, 1000);
            }
            
            // Mark as initialized
            localStorage.setItem('userInitialized', 'true');
            setHasInitialized(true);
            
          } catch (error) {
            console.error('[DASHBOARD] Error during user initialization:', error);
            toast({
              title: "שגיאה באתחול",
              description: "אירעה שגיאה באתחול המערכת. אנא רענן את הדף.",
              variant: "destructive",
            });
          } finally {
            setIsInitializing(false);
          }
        } else {
          console.log('[DASHBOARD] User data exists, marking as initialized');
          localStorage.setItem('userInitialized', 'true');
          setHasInitialized(true);
        }
      }
    };

    initializeUserIfNeeded();
  }, [initialLoadComplete, transactions.length, categories.length, budgets.length, hasInitialized, isInitializing, toast, loadData]);

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboarding = () => {
      const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
      const hasAnyData = transactions.length > 0 || categories.length > 0 || budgets.length > 0;
      
      // Show guide if user hasn't completed onboarding AND doesn't have much data
      if (!hasCompletedOnboarding && !hasAnyData && initialLoadComplete) {
        setShowWelcomeGuide(true);
      }
    };

    if (initialLoadComplete) {
      checkOnboarding();
    }
  }, [initialLoadComplete, transactions.length, categories.length, budgets.length]);

  const handleCompleteOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowWelcomeGuide(false);
  };

  useEffect(() => {
    if (initialLoadComplete && hasData && transactions.length > 0) {
      calculateSummaryKPIs();
    }
  }, [initialLoadComplete, hasData, transactions, selectedCategoryForReport, currentDate, periodType, calculateSummaryKPIs, filteredCategoryIds]);

  useEffect(() => {
    if (initialLoadComplete && hasData && summaryKPIs.topBusinesses.length > 0 && transactions.length > 0) {
      const { startDate: viewStartDate, endDate: viewEndDate } = getDateRange(currentDate, periodType);
      let collectedTransactions = [];

      for (const business of summaryKPIs.topBusinesses) {
        if (collectedTransactions.length >= 10) break;

        const businessTransactions = transactions
          .filter(t =>
            t.business_name === business.name &&
            !t.is_income &&
            isWithinInterval(parseISO(t.date), { start: viewStartDate, end: viewEndDate }) &&
            (filteredCategoryIds.length === 0 || filteredCategoryIds.includes(t.category_id))
          )
          .sort((a, b) => parseISO(b.date) - parseISO(a.date));

        for (const bt of businessTransactions) {
          if (collectedTransactions.length < 10) {
            collectedTransactions.push(bt);
          } else {
            break;
          }
        }
      }
      setTransactionsFromTopBusinesses(collectedTransactions);
    } else {
      setTransactionsFromTopBusinesses([]);
    }
  }, [initialLoadComplete, hasData, summaryKPIs.topBusinesses, transactions, currentDate, periodType, getDateRange, filteredCategoryIds]);

  const navigatePeriod = (direction) => {
    let newDate;
    switch (periodType) {
      case "week":
        newDate = direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
        break;
      case "month":
        newDate = direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1);
        break;
      case "quarter":
        newDate = direction === "prev" ? subQuarters(currentDate, 1) : addQuarters(currentDate, 1);
        break;
      case "year":
        newDate = direction === "prev" ? subYears(currentDate, 1) : addYears(currentDate, 1);
        break;
      default:
        return;
    }
    const today = new Date();
    // Prevent navigating past today for most cases, allowing current period to include today
    if (isAfter(newDate, today)) {
        let isFuture = false;
        if (periodType === "week" && !isSameWeek(newDate, today, { weekStartsOn: 0 })) {
            isFuture = true;
        } else if (periodType === "month" && startOfMonth(newDate) > startOfMonth(today)) {
            isFuture = true;
        } else if (periodType === "quarter" && startOfQuarter(newDate) > startOfQuarter(today)) {
            isFuture = true;
        } else if (periodType === "year" && startOfYear(newDate) > startOfYear(today)) {
            isFuture = true;
        }
        if (isFuture) {
            return;
        }
    }
    setCurrentDate(newDate);
  };

  const PeriodSelector = () => (
    <div className="flex items-center gap-3">
      <Select value={periodType} onValueChange={setPeriodType}>
        <SelectTrigger className="w-[140px] bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200/50 hover:ring-blue-300/60 hover:bg-blue-50/80 transition-all duration-200 rtl:text-right">
          <SelectValue placeholder={t('dashboard.selectPeriod')} />
        </SelectTrigger>
        <SelectContent className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rtl:text-right" dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <SelectItem value="week" className="hover:bg-blue-50/80 hover:text-blue-900 transition-colors rtl:text-right">{t('periods.weekly')}</SelectItem>
          <SelectItem value="month" className="hover:bg-blue-50/80 hover:text-blue-900 transition-colors rtl:text-right">{t('periods.monthly')}</SelectItem>
          <SelectItem value="quarter" className="hover:bg-blue-50/80 hover:text-blue-900 transition-colors rtl:text-right">{t('periods.quarterly')}</SelectItem>
          <SelectItem value="year" className="hover:bg-blue-50/80 hover:text-blue-900 transition-colors rtl:text-right">{t('periods.yearly')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const getCurrentPeriodLabel = useCallback(() => {
    const { startDate, endDate } = getDateRange(currentDate, periodType);
    if (!startDate || !endDate) return t('common.loading');
    
    // Updated to respect language setting for month names
    const dateOptions = { locale: getCurrentLanguage() === 'he' ? he : undefined };
    
    if (periodType === "week") {
      return `${format(startDate, "d MMM", dateOptions)} - ${format(endDate, "d MMM yyyy", dateOptions)}`;
    } else if (periodType === "month") {
      return format(startDate, "MMMM yyyy", dateOptions);
    } else if (periodType === "quarter") {
      return `Q${getQuarter(startDate)} ${getYear(startDate)}`;
    } else if (periodType === "year") {
      return format(startDate, "yyyy");
    }
    return "";
  }, [currentDate, periodType, getDateRange]);

  // OverviewCard component moved to FinancialSummaryCards.jsx
  // Removed from here:
  // const OverviewCard = ({ title, value, icon, trend, trendPeriodLabel, isLoading, gradient, iconColor }) => {
  //   const IconComponent = icon;
  //   return (
  //     <Card className={`${gradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:bg-white/20 group`}>
  //       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
  //         <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
  //           {title}
  //         </CardTitle>
  //         <div className={`p-3 rounded-full ${iconColor} group-hover:scale-110 group-hover:shadow-lg transition-all duration-200`}>
  //           <IconComponent className="h-5 w-5 text-white" />
  //         </div>
  //       </CardHeader>
  //       <CardContent>
  //         {isLoading ? (
  //           <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse w-3/4"></div>
  //         ) : (
  //           <div className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
  //             {formatCurrency(value, preferences.currency)}
  //           </div>
  //         )}
  //         {trend && !isLoading && (
  //           <div className="flex items-center text-sm">
  //             {trend.changePercentage >= 0 ? (
  //               <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
  //             ) : (
  //               <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
  //             )}
  //             <span className={`font-medium ${trend.changePercentage >= 0 ? "text-green-700" : "text-red-700"}`}>
  //               {trend.changePercentage >= 0 ? '+' : ''}{trend.changePercentage}%
  //             </span>
  //             <span className="text-gray-600 mr-1 group-hover:text-gray-700 transition-colors">{t('dashboard.comparedToPrevious')}</span>
  //           </div>
  //         )}
  //       </CardContent>
  //     </Card>
  //   );
  // };

  const renderPieTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = stats.totalExpenses > 0 ? Math.round((data.value / stats.totalExpenses) * 100) : 0;
      return (
        <div className="bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-2xl p-4 text-sm" dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <div className="flex items-center mb-2">
            <IconRenderer iconName={data.icon} size={18} className="ml-2" style={{ color: payload[0].fill }} />
            <strong className="text-gray-800" style={{ color: payload[0].fill }}>{data.name}</strong>
          </div>
          <p className="text-gray-700 font-medium">{t('dashboard.amount')}: {formatCurrency(data.value, preferences.currency)}</p>
          <p className="text-gray-600">{t('dashboard.percentageOfExpenses')}: {percent}%</p>
        </div>
      );
    }
    return null;
  }, [stats.totalExpenses, isRTLLayout, preferences.currency]);

  const renderBarTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-2xl p-4 text-sm" dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <div className="font-semibold text-gray-800 mb-2">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-gray-700">{entry.name}</span>
              </div>
              <span className="font-medium text-gray-900">{formatCurrency(entry.value, preferences.currency)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  }, [isRTLLayout, preferences.currency]);

  const renderCustomLegend = useCallback((props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs mt-4">
        {payload.map((entry, index) => {
          const categoryData = chartData.pieChartData.find(cat => cat.name === entry.value); // Use memoized chartData
          return (
            <li key={`item-${index}`} className="flex items-center bg-white/50 rounded-full px-3 py-1">
              <span style={{ backgroundColor: entry.color, width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', marginRight: '6px' }}></span>
              <IconRenderer iconName={categoryData?.icon || entry.payload?.icon} size={14} className="mr-1" style={{ color: entry.color }} />
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.value} ({formatCurrency(entry.payload?.value || 0, preferences.currency)})
              </span>
            </li>
          );
        })}
      </ul>
    );
  }, [chartData.pieChartData, preferences.currency]); // Dependency on chartData.pieChartData

  const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent * 100 < 7) {
      return null;
    }

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="10px"
        fontWeight="bold"
        className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
      >
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  }, []);

  const handleCategoryReportSelect = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setSelectedCategoryForReport(category);
    } else {
      setSelectedCategoryForReport(null);
    }
  };

  const handleCategoryFilterChange = useCallback((selectedCategoryIds) => {
    setFilteredCategoryIds(selectedCategoryIds || []);
    if (selectedCategoryIds && selectedCategoryIds.length > 1) {
      setSelectedCategoryForReport(null);
    }
  }, []);

  const getFilteredCategoriesLabel = () => {
    if (filteredCategoryIds.length === 0) return "";
    if (filteredCategoryIds.length === 1) {
      const cat = categories.find(c => c.id === filteredCategoryIds[0]);
      return cat ? ` (${cat.name})` : "";
    }
    return ` (${t('dashboard.selectedCategories', { count: filteredCategoryIds.length })})`;
  };

  const SummaryKPICards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-white/80 border border-gray-200">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 mb-1">
            {selectedCategoryForReport ? t('dashboard.categoryAmount') : (filteredCategoryIds.length > 0 ? t('dashboard.filteredExpenses') : t('dashboard.totalExpenses'))}
          </div>
          <div className="text-xl font-bold text-blue-700">
            {formatCurrency(summaryKPIs.totalAmount, preferences.currency)}
          </div>
          {summaryKPIs.spendingTrend !== null && (
            <div className="flex items-center text-xs mt-1">
              {summaryKPIs.spendingTrend >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-red-500" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-green-500" />
              )}
              <span className={summaryKPIs.spendingTrend >= 0 ? "text-red-600" : "text-green-600"}>
                {summaryKPIs.spendingTrend >= 0 ? '+' : ''}{summaryKPIs.spendingTrend.toFixed(1)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80 border border-gray-200">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 mb-1">{t('dashboard.transactionCount')}</div>
          <div className="text-xl font-bold text-blue-700">
            {summaryKPIs.transactionCount}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 border border-gray-200">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 mb-1">{t('dashboard.averageTransaction')}</div>
          <div className="text-xl font-bold text-blue-700">
            {formatCurrency(summaryKPIs.averageTransaction, preferences.currency)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 border border-gray-200">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 mb-1">
            {selectedCategoryForReport ? t('dashboard.percentageOfExpenses') : (filteredCategoryIds.length > 0 ? t('dashboard.percentageOfFilteredExpenses') : t('dashboard.percentageOfTotal'))}
          </div>
          <div className="text-xl font-bold text-blue-700">
            {summaryKPIs.percentageOfTotal.toFixed(1)}%
          </div>
          {summaryKPIs.budgetStatus && (
            <div className="mt-1">
              <Badge className={
                summaryKPIs.budgetStatus.status === 'over' ? 'bg-red-100 text-red-800' :
                  summaryKPIs.budgetStatus.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
              }>
                {t('dashboard.budget')}: {summaryKPIs.budgetStatus.percentage.toFixed(0)}%
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (viewMode === 'categoryDetail' && selectedCategoryForReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <Button
          onClick={() => {
            setViewMode('overview');
            setSelectedCategoryForReport(null);
          }}
          className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <ChevronRight className="w-4 h-4 ml-1" />
          {t('dashboard.backToOverview')}
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {t('dashboard.categoryDetail')}: {selectedCategoryForReport.name}
        </h2>
        <CategorySummaryReport
          category={selectedCategoryForReport}
          transactions={transactions.filter(t => t.category_id === selectedCategoryForReport.id && isWithinInterval(parseISO(t.date), getDateRange(currentDate, periodType)))}
          periodLabel={getCurrentPeriodLabel()}
        />
      </div>
    );
  }

  // Add loading state for initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6 text-center" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">מכין את המערכת עבורך...</h2>
        <p className="text-gray-600">אנא המתן בזמן שאנחנו מגדירים את הקטגוריות וההגדרות הבסיסיות</p>
      </div>
    );
  }

  // Show welcome guide if needed
  if (showWelcomeGuide) {
    return <WelcomeGuide onComplete={handleCompleteOnboarding} />;
  }

  // Empty State UI - Updated
  if (initialLoadComplete && !isLoading && !hasData && !isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6 text-center" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <LayoutDashboard className="w-20 h-20 text-blue-300 mb-6" />
        <h2 className="text-3xl font-bold text-gray-700 mb-4">{t('dashboard.welcomeTitle')}</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl">
          {t('dashboard.welcomeDescription')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <Card className="bg-white/80 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('Upload'))}>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-blue-600">
                <FileUp size={20}/> {t('dashboard.uploadTransactions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{t('dashboard.uploadDescription')}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('Budget'))}>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-green-600">
                <PiggyBank size={20}/> {t('dashboard.createBudget')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{t('dashboard.budgetDescription')}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('CategoryManagement'))}>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-purple-600">
                <FolderTree size={20}/> {t('dashboard.manageCategories')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{t('dashboard.categoriesDescription')}</p>
            </CardContent>
          </Card>
        </div>
         <Button
            variant="outline"
            onClick={loadData}
            className="mt-10 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('dashboard.reloadData')}
          </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 space-y-8 p-4 md:p-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <header className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl border border-white/20 hover:bg-white/80 hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {t('dashboard.title')}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <PeriodSelector />
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigatePeriod("prev")}
                className="bg-white/70 hover:bg-blue-50/90 hover:text-blue-700 backdrop-blur-sm shadow-md rounded-full border border-transparent hover:border-blue-200/60 transition-all duration-200"
                aria-label={t('dashboard.previousPeriod')}
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>

              <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-md border border-white/30 min-w-[150px] md:min-w-[180px] text-center hover:bg-white/90 hover:shadow-lg transition-all duration-200">
                <span className="text-xs md:text-sm font-semibold text-gray-800">
                  {isLoading ? t('common.loading') : getCurrentPeriodLabel()}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigatePeriod("next")}
                disabled={isLoading || (periodType !== 'week' && isAfter(addMonths(currentDate, periodType === 'month' ? 1 : 0), new Date()))} // Simplified disable logic
                className="bg-white/70 hover:bg-blue-50/90 hover:text-blue-700 backdrop-blur-sm shadow-md rounded-full border border-transparent hover:border-blue-200/60 disabled:opacity-40 disabled:hover:bg-white/70 disabled:hover:text-gray-500 transition-all duration-200"
                aria-label={t('dashboard.nextPeriod')}
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {initialLoadComplete && isLoading && !transactions.length && (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gradient-to-br from-gray-100 to-gray-200 border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-150 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
                <div className="h-3 md:h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full w-1/3 animate-pulse"></div>
                <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 md:h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg w-3/4 animate-pulse mb-2 md:mb-3"></div>
                <div className="h-3 md:h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {initialLoadComplete && hasData && (
        <>
          <FinancialSummaryCards
            totalIncome={stats.totalIncome}
            totalExpenses={stats.totalExpenses}
            netBalance={stats.netFlow}
            previousMonthIncome={insightsStats.previousTotalIncome}
            previousMonthExpenses={insightsStats.previousTotalExpenses}
            isLoading={isLoading}
            preferences={preferences}
            gradients={CARD_GRADIENTS}
          />

          <MonthlyComparison
            transactions={transactions}
            categories={categories}
            periodType={periodType}
            onCategorySelect={handleCategoryReportSelect}
            onCategoryFilterChange={handleCategoryFilterChange}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            <div className="xl:col-span-2 space-y-6 md:space-y-8">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:bg-white/80 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100/50 p-4 md:p-5 hover:from-purple-100/80 hover:to-pink-100/80 transition-all duration-300">
                  <CardTitle className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                    <PiggyBank className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                    {t('dashboard.expenseDistribution')}{getFilteredCategoriesLabel()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] md:h-[350px] pt-3 md:pt-4 px-2">
                  {chartData.pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <defs>
                          {ENHANCED_COLORS.map((color, index) => (
                            <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity={0.85} />
                              <stop offset="100%" stopColor={color} stopOpacity={0.55} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={chartData.pieChartData}
                          cx="50%"
                          cy="45%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={70}
                          innerRadius={35}
                          fill="#8884d8"
                          dataKey="value"
                          stroke="#ffffff"
                          strokeWidth={2}
                          onClick={(data) => {
                            const category = categories.find(c => c.name === data.name);
                            if (category) {
                              handleCategoryReportSelect(category.id);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {chartData.pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#pieGradient${index % ENHANCED_COLORS.length})`} />
                          ))}
                        </Pie>
                        <Tooltip content={renderPieTooltip} />
                        <Legend content={renderCustomLegend} wrapperStyle={{ fontSize: '10px', lineHeight: '1.2' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <PieChartIcon className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-sm">{t('dashboard.noExpensesToShow')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:bg-white/80 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100/50 p-4 md:p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                        <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                        {selectedCategoryForReport ? t('dashboard.categorySummary', { category: selectedCategoryForReport.name }) : t('dashboard.generalSummary')}{getFilteredCategoriesLabel()}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 font-medium mt-1">
                        {selectedCategoryForReport
                          ? t('dashboard.categoryAnalysisDescription', { category: selectedCategoryForReport.name, period: getCurrentPeriodLabel() })
                          : t('dashboard.generalAnalysisDescription', { period: getCurrentPeriodLabel() })
                        }
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedCategoryForReport && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCategoryForReport(null)}
                          className="bg-white/80 hover:bg-white/100"
                        >
                          {t('dashboard.backToGeneral')}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                        className="bg-white/80 hover:bg-white/100 flex items-center gap-2"
                      >
                        {isSummaryExpanded ? (
                          <>
                            <ChevronRight className="w-4 h-4" />
                            {t('common.collapse')}
                          </>
                        ) : (
                          <>
                            <ChevronLeft className="w-4 h-4" />
                            {t('common.expand')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <SummaryKPICards />

                  {summaryKPIs.topBusinesses.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <PiggyBank className="w-4 h-4 text-purple-600" />
                        {t('dashboard.topBusinesses')} {!isSummaryExpanded && t('dashboard.topThree')}
                      </h4>
                      <div className="grid gap-3">
                        {summaryKPIs.topBusinesses.slice(0, isSummaryExpanded ? summaryKPIs.topBusinesses.length : 3).map((business, index) => (
                          <div key={business.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                {index + 1}
                              </Badge>
                               <span className="font-medium text-gray-700">{truncateText(business.name, 30)}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{formatCurrency(business.amount, preferences.currency)}</div>
                              <div className="text-xs text-gray-500">
                                {((business.amount / summaryKPIs.totalAmount) * 100).toFixed(1)}% {t('dashboard.ofAmount')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!isSummaryExpanded && summaryKPIs.topBusinesses.length > 3 && (
                        <div className="text-center mt-3">
                          <span className="text-sm text-gray-500">
                            {t('dashboard.andMoreBusinesses', { count: (summaryKPIs.topBusinesses.length - 3).toLocaleString() })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {isSummaryExpanded && (
                    <div className="mt-6">
                      <RecentTransactions
                        transactions={transactionsFromTopBusinesses}
                        categories={categories}
                        title={t('dashboard.recentTransactionsFromTopBusinesses')}
                        limit={10}
                        periodLabel={getCurrentPeriodLabel()}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:bg-white/80 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 p-4 md:p-5 hover:from-blue-100/80 hover:to-indigo-100/80 transition-all duration-300">
                  <CardTitle className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                    <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                    {t('dashboard.incomeVsExpenses')}{getFilteredCategoriesLabel()}
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm text-gray-600 font-medium">
                    {t('dashboard.incomeExpensesTrend')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] md:h-[400px] pt-4 md:pt-6 px-2 md:px-4">
                  {chartData.barChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.barChartData} margin={{ top: 15, right: 20, left: 5, bottom: 15 }}>
                        <defs>
                          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0.4} />
                          </linearGradient>
                          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#EF4444" stopOpacity={0.4} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.6} />
                        <XAxis
                          dataKey="shortDate"
                          tick={{ fontSize: 10, fill: '#6B7280' }}
                          axisLine={{ stroke: '#D1D5DB' }}
                          tickLine={{ stroke: '#D1D5DB' }}
                          angle={periodType === 'month' || periodType === 'quarter' ? -30 : 0}
                          textAnchor={periodType === 'month' || periodType === 'quarter' ? "end" : "middle"}
                          height={periodType === 'month' || periodType === 'quarter' ? 40 : 20}
                          interval={chartData.barChartData.length > 15 ? Math.floor(chartData.barChartData.length / 10) : 0}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#6B7280' }}
                          axisLine={{ stroke: '#D1D5DB' }}
                          tickLine={{ stroke: '#D1D5DB' }}
                          tickFormatter={(value) => formatCurrency(value, preferences.currency).replace(/[₪$]/g, '')}
                          width={60}
                        />
                        <Tooltip content={<CustomTooltip currency={preferences.currency} />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                        <Legend
                          wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: '500' }}
                          iconSize={10}
                        />
                        <Bar
                          name={t('dashboard.income')}
                          dataKey="income"
                          fill="url(#incomeGradient)"
                          radius={[4, 4, 0, 0]}
                          barSize={periodType === 'year' || periodType === 'quarter' ? 20 : (periodType === 'month' ? 12 : 8)}
                        />
                        <Bar
                          name={t('dashboard.expenses')}
                          dataKey="expenses"
                          fill="url(#expenseGradient)"
                          radius={[4, 4, 0, 0]}
                          barSize={periodType === 'year' || periodType === 'quarter' ? 20 : (periodType === 'month' ? 12 : 8)}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-sm">{t('dashboard.noTransactionData')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 md:space-y-8">
              <BudgetMetrics
                transactions={transactions}
                budgets={budgets}
                categories={categories}
                periodType={periodType}
                currentDate={currentDate}
              />

              {(insightsStats.overBudget.length > 0 || insightsStats.unusualSpending.length > 0 || insightsStats.spendingTrend) && (
                <Card className={`${CARD_GRADIENTS.insights} border-0 shadow-xl rounded-2xl overflow-hidden hover:bg-white/20 hover:shadow-2xl transition-all duration-300`}>
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border-b border-violet-100/50 p-4 md:p-5 hover:from-violet-100/80 hover:to-fuchsia-100/80 transition-all duration-300">
                    <CardTitle className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                      <Bell className="w-5 h-5 md:w-6 md:h-6 text-violet-600" />
                      {t('dashboard.quickInsights')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 text-sm p-4 md:p-6">
                    {insightsStats.spendingTrend && (
                      <div className={`flex items-start p-3 md:p-4 rounded-xl ${insightsStats.spendingTrend.isIncrease ? 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/70' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/70'} shadow-sm`}>
                        <div className={`p-1.5 md:p-2 rounded-lg mr-2 md:mr-3 ${insightsStats.spendingTrend.isIncrease ? 'bg-red-100' : 'bg-green-100'}`}>
                          {insightsStats.spendingTrend.isIncrease ?
                            <TrendingUp size={16} className="text-red-600" /> :
                            <TrendingDown size={16} className="text-green-600" />
                          }
                        </div>
                        <div>
                          <div className={`font-semibold text-xs md:text-sm ${insightsStats.spendingTrend.isIncrease ? 'text-red-800' : 'text-green-800'}`}>
                            {t('dashboard.expensesThisPeriod')} <strong>{formatCurrency(insightsStats.spendingTrend.currentAmount, preferences.currency)}</strong>
                          </div>
                          <p className={`text-xs ${insightsStats.spendingTrend.isIncrease ? 'text-red-700' : 'text-green-700'}`}>
                            {t('dashboard.increase')}: <strong>{Math.abs(insightsStats.spendingTrend.changePercentage)}%</strong> {t('dashboard.comparedToPrevious')} {formatCurrency(insightsStats.spendingTrend.previousAmount, preferences.currency)}
                          </p>
                        </div>
                      </div>
                    )}

                    {insightsStats.overBudget.slice(0, 1).map(item => (
                      <div key={`over-${item.categoryId}`} className="flex items-start p-3 md:p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/70 shadow-sm">
                        <div className="p-1.5 md:p-2 bg-red-100 rounded-lg mr-2 md:mr-3">
                          <AlertTriangle size={16} className="text-red-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-red-800 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                            <IconRenderer iconName={item.icon} size={14} />
                            {t('dashboard.budgetOverrun')} {item.categoryName}
                          </div>
                          <p className="text-xs text-red-700">
                            {t('dashboard.spent')} <strong>{formatCurrency(item.actual, preferences.currency)}</strong> {t('common.of')} <strong>{formatCurrency(item.budgeted, preferences.currency)}</strong>
                            <span className="block text-xxs md:text-xs opacity-80">{t('dashboard.overrun')} {item.overPercentage.toFixed(0)}%</span>
                          </p>
                        </div>
                      </div>
                    ))}

                    {insightsStats.unusualSpending.slice(0, 1).map(item => (
                      <div key={`unusual-${item.categoryId}`} className="flex items-start p-3 md:p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/70 shadow-sm">
                        <div className="p-1.5 md:p-2 bg-amber-100 rounded-lg mr-2 md:mr-3">
                          <AlertTriangle size={16} className="text-amber-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-amber-800 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                            <IconRenderer iconName={item.icon} size={14} />
                            {t('dashboard.unusualSpending')} {item.categoryName}
                          </div>
                          <p className="text-xs text-amber-700">
                            <strong>{formatCurrency(item.currentAmount, preferences.currency)}</strong>, {t('dashboard.increase')} <strong>{item.increasePercentage}%</strong>
                            <span className="block text-xxs md:text-xs opacity-80">{t('dashboard.comparedTo')} {formatCurrency(item.previousAmount, preferences.currency)} {t('dashboard.previousPeriod')}</span>
                          </p>
                        </div>
                      </div>
                    ))}

                    {(insightsStats.overBudget.length > 0 || insightsStats.unusualSpending.length > 0) && (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs md:text-sm text-violet-600 hover:text-violet-800 hover:bg-violet-50/50 font-semibold hover:underline mt-2 px-2 py-1 rounded transition-all duration-200"
                        onClick={() => navigate(createPageUrl("Insights"))}
                      >
                        {t('dashboard.viewAllInsights')} ←
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 md:gap-8">
            {/* Monthly Spending Trend Chart */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:bg-white/80 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 p-4 md:p-5 hover:from-blue-100/80 hover:to-indigo-100/80 transition-all duration-300">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-bold text-gray-800">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  {t('dashboard.monthlyTrend.title')}
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-gray-600 font-medium">
                  {t('dashboard.monthlyTrend.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[350px] pt-4 md:pt-6 px-2 md:px-4">
                {monthlyTrendData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">{t('dashboard.monthlyTrend.noData')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.6} />
                      <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#D1D5DB' }} tickLine={{ stroke: '#D1D5DB' }} />
                      <YAxis tickFormatter={(value) => formatCurrency(value, preferences.currency).replace(/[₪$]/g, '')} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#D1D5DB' }} tickLine={{ stroke: '#D1D5DB' }} width={60}/>
                      <Tooltip content={<CustomTooltip currency={preferences.currency} />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: '500' }} iconSize={10} />
                      <Line type="monotone" dataKey="expenses" stroke="#3B82F6" strokeWidth={2} name={t('dashboard.expenses')} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Categories Pie Chart */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:bg-white/80 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100/50 p-4 md:p-5 hover:from-purple-100/80 hover:to-pink-100/80 transition-all duration-300">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-bold text-gray-800">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  {t('dashboard.topCategories.title')}
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-gray-600 font-medium">
                  {t('dashboard.topCategories.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[350px] pt-4 md:pt-6 px-2 md:px-4">
                {topExpenseCategoriesData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <PieChartIcon className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">{t('dashboard.topCategories.noData')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <defs>
                        {ENHANCED_COLORS.map((color, index) => (
                          <linearGradient key={index} id={`topCatPieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.85} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.55} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={topExpenseCategoriesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {topExpenseCategoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#topCatPieGradient${index % ENHANCED_COLORS.length})`} />
                        ))}
                      </Pie>
                      <Tooltip content={renderPieTooltip} />
                      <Legend wrapperStyle={{ fontSize: '10px', lineHeight: '1.2' }} iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      
      <FinancialAssistant 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)} 
      />
    </div>
  );
}
