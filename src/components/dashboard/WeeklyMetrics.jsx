
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, AlertTriangle, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Clock,
  PiggyBank, Wallet, BarChart
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
  isSameWeek,
  isBefore,
  isAfter,
  getQuarter,
  subMonths,
  subQuarters,
  subYears,
  addMonths,
  addQuarters,
  addYears,
  subDays,
  addDays
} from "date-fns";
import { he } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { t, formatCurrency, isRTL } from "@/components/utils/i18n";


export default function WeeklyMetrics({ transactions, budgets, categories, periodType: initialPeriodType = "week" }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentPeriodType, setCurrentPeriodType] = useState(initialPeriodType);

  const [weeklyBudget, setWeeklyBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [budgetStatus, setBudgetStatus] = useState("good"); // good, warning, danger
  const [budgetUsagePercentage, setBudgetUsagePercentage] = useState(0);
  const [averageDailySpending, setAverageDailySpending] = useState(0);
  const [forecast, setForecast] = useState({ projectedTotal: 0, estimatedBalance: 0, recommendation: "" });
  const [currentPeriodName, setCurrentPeriodName] = useState("");

  const isRTLLayout = isRTL();

  useEffect(() => {
    calculateMetrics();
  }, [transactions, budgets, categories, currentPeriodType, selectedDate]);

  const calculateMetrics = () => {
    const today = new Date();

    let periodStart, periodEnd;
    let periodDays;
    let periodNameDisplay;

    switch (currentPeriodType) {
      case "week":
        periodStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
        periodEnd = endOfWeek(selectedDate, { weekStartsOn: 0 }); // Saturday
        periodDays = 7;
        periodNameDisplay = `${format(periodStart, "dd/MM", { locale: he })} - ${format(periodEnd, "dd/MM", { locale: he })}`;
        break;
      case "month":
        periodStart = startOfMonth(selectedDate);
        periodEnd = endOfMonth(selectedDate);
        periodDays = differenceInDays(periodEnd, periodStart) + 1;
        periodNameDisplay = format(selectedDate, "MMMM yyyy", { locale: he });
        break;
      case "quarter":
        periodStart = startOfQuarter(selectedDate);
        periodEnd = endOfQuarter(selectedDate);
        periodDays = differenceInDays(periodEnd, periodStart) + 1;
        periodNameDisplay = `${t('periods.quarterlyShort')} Q${getQuarter(selectedDate)} ${format(selectedDate, "yyyy")}`;
        break;
      case "year":
        periodStart = startOfYear(selectedDate);
        periodEnd = endOfYear(selectedDate);
        periodDays = differenceInDays(periodEnd, periodStart) + 1;
        periodNameDisplay = format(selectedDate, "yyyy");
        break;
      default:
        periodStart = startOfMonth(selectedDate);
        periodEnd = endOfMonth(selectedDate);
        periodDays = differenceInDays(periodEnd, periodStart) + 1;
        periodNameDisplay = format(selectedDate, "MMMM yyyy", { locale: he });
    }

    setCurrentPeriodName(periodNameDisplay);

    const getBudgetMultiplier = () => {
      switch (currentPeriodType) {
        case "week": return 7 / 30; // ~0.23 of monthly budget
        case "month": return 1;
        case "quarter": return 3; // Quarterly is 3x monthly
        case "year": return 12; // Yearly is 12x monthly
        default: return 1;
      }
    };

    const budgetMultiplier = getBudgetMultiplier();

    const totalPeriodBudget = Math.round(budgets.reduce((total, budget) => {
      const category = categories.find(c => c.id === budget.category_id);
      if (category && category.type === "expense") {
        return total + (budget.amount * budgetMultiplier);
      }
      return total;
    }, 0));

    const periodExpenses = Math.round(transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return !t.is_income && isWithinInterval(transactionDate, { start: periodStart, end: periodEnd });
      })
      .reduce((total, t) => total + (t.billing_amount || 0), 0));

    const daysElapsedInPeriod = isBefore(today, periodStart)
      ? 0
      : isAfter(today, periodEnd)
        ? periodDays
        : differenceInDays(today, periodStart) + 1;

    const daysRemainingInPeriod = periodDays - daysElapsedInPeriod;

    const usagePercentage = totalPeriodBudget > 0 ? (periodExpenses / totalPeriodBudget) * 100 : 0;
    const avgDailySpending = daysElapsedInPeriod > 0 ? periodExpenses / daysElapsedInPeriod : 0;

    let status = "good";
    const timeProgress = (daysElapsedInPeriod / periodDays) * 100;
    if (usagePercentage > 100) {
      status = "danger";
    } else if (usagePercentage > timeProgress + 15) { // If spending significantly outpaces time
      status = "warning";
    }

    // Forecast calculation
    const projectedTotal = daysElapsedInPeriod > 0
      ? avgDailySpending * periodDays
      : periodExpenses; // If no days elapsed, current spent is the projection
    const estimatedBalance = totalPeriodBudget - projectedTotal;

    let recommendationText = "";
    if (estimatedBalance < 0) {
      const dailyToStayOnBudget = Math.max(0, (totalPeriodBudget - periodExpenses) / daysRemainingInPeriod);
      if (isFinite(dailyToStayOnBudget) && daysRemainingInPeriod > 0) {
        recommendationText = t('weeklyMetrics.recommendationNegative', {
          amount: formatCurrency(dailyToStayOnBudget),
          period: getPeriodName(currentPeriodType)
        });
      } else {
        recommendationText = t('weeklyMetrics.recommendationAlreadyOver');
      }
    } else {
      recommendationText = t('weeklyMetrics.recommendationPositive');
    }

    setWeeklyBudget(totalPeriodBudget);
    setTotalSpent(periodExpenses);
    setBudgetStatus(status);
    setBudgetUsagePercentage(usagePercentage);
    setAverageDailySpending(avgDailySpending);
    setForecast({
      projectedTotal: Math.round(projectedTotal),
      estimatedBalance: Math.round(estimatedBalance),
      recommendation: recommendationText
    });
  };

  const getPeriodName = (period) => {
    switch(period) {
      case "week": return t('periods.weekly');
      case "month": return t('periods.monthly');
      case "quarter": return t('periods.quarterly');
      case "year": return t('periods.yearly');
      default: return t('periods.weekly');
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case "good": return t('weeklyMetrics.onBudget');
      case "warning": return t('weeklyMetrics.nearLimit');
      case "danger": return t('weeklyMetrics.overBudget');
      default: return t('weeklyMetrics.onBudget');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "good": return "bg-green-100 text-green-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "danger": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Function to format large numbers in short form
  const formatShortCurrency = (amount) => {
    if (amount >= 1000000) {
      return `₪${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₪${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₪${Math.round(amount)}`;
    }
  };

  const renderMetricCard = (title, value, subtitle) => (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-2"> {/* Further reduced padding */}
        <div className="text-center" dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <p className="text-xs font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-base font-bold text-gray-800 truncate" title={value}> {/* Reduced from text-lg to text-base, removed color classes */}
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const navigatePeriod = (direction) => {
    let newDate = new Date(selectedDate);
    
    switch (currentPeriodType) {
      case "week":
        newDate = direction === "prev" ? subWeeks(newDate, 1) : addWeeks(newDate, 1);
        break;
      case "month":
        newDate = direction === "prev" ? subMonths(newDate, 1) : addMonths(newDate, 1);
        break;
      case "quarter":
        newDate = direction === "prev" ? subQuarters(newDate, 1) : addQuarters(newDate, 1);
        break;
      case "year":
        newDate = direction === "prev" ? subYears(newDate, 1) : addYears(newDate, 1);
        break;
      default:
        newDate = direction === "prev" ? subMonths(newDate, 1) : addMonths(newDate, 1);
    }
    
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      {/* Header with Period Navigation */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                {t('weeklyMetrics.title', { period: getPeriodName(currentPeriodType) })}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                {currentPeriodName}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={currentPeriodType} onValueChange={setCurrentPeriodType}>
                <SelectTrigger className="w-32 bg-white border-gray-300">
                  <SelectValue placeholder={t('periods.selectPeriod')} />
                </SelectTrigger>
                <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                  <SelectItem value="week">{t('periods.weekly')}</SelectItem>
                  <SelectItem value="month">{t('periods.monthly')}</SelectItem>
                  <SelectItem value="quarter">{t('periods.quarterly')}</SelectItem>
                  <SelectItem value="year">{t('periods.yearly')}</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePeriod('prev')}
                  className="bg-white border-gray-300"
                  aria-label={t('weeklyMetrics.previousPeriod')}
                >
                  {isRTLLayout ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePeriod('next')}
                  className="bg-white border-gray-300"
                  aria-label={t('weeklyMetrics.nextPeriod')}
                >
                  {isRTLLayout ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Budget Status - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {renderMetricCard(
          t('weeklyMetrics.budgetForPeriod'),
          formatShortCurrency(weeklyBudget),
          t('weeklyMetrics.totalBudget')
        )}
        
        {renderMetricCard(
          t('weeklyMetrics.spentSoFar'),
          formatShortCurrency(totalSpent),
          getStatusText(budgetStatus)
        )}
        
        {renderMetricCard(
          t('weeklyMetrics.remaining'),
          formatShortCurrency(Math.max(0, weeklyBudget - totalSpent)),
          `${Math.round(budgetUsagePercentage)}% ${t('weeklyMetrics.used')}`
        )}
        
        {renderMetricCard(
          t('weeklyMetrics.avgDailySpending'),
          formatShortCurrency(averageDailySpending),
          t('weeklyMetrics.thisPeriod')
        )}
      </div>

      {/* Budget Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{t('weeklyMetrics.budgetProgress')}</h3>
              <Badge className={getStatusColor(budgetStatus)}>
                {getStatusText(budgetStatus)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatCurrency(totalSpent)}</span>
                <span>{formatCurrency(weeklyBudget)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    budgetStatus === 'danger' ? 'bg-red-500' : 
                    budgetStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsagePercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                {budgetUsagePercentage.toFixed(1)}% {t('weeklyMetrics.ofBudgetUsed')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Forecast Card */}
      {forecast.projectedTotal > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              {t('weeklyMetrics.forecastTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('weeklyMetrics.projectedTotal')}</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(forecast.projectedTotal)}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('weeklyMetrics.estimatedBalance')}</p>
                  <p className={`text-xl font-bold ${forecast.estimatedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(forecast.estimatedBalance)}
                  </p>
                </div>
              </div>
              
              {forecast.recommendation && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {t('weeklyMetrics.dailyRecommendation')}
                  </h4>
                  <p className="text-sm text-yellow-700">{forecast.recommendation}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
