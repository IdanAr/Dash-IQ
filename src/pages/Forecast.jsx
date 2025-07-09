import React, { useState, useEffect, useCallback } from "react";
import { Transaction, Category } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  Target,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isWithinInterval,
  parseISO,
  differenceInMonths
} from "date-fns";
import { t, formatCurrency, formatDate, formatNumber, isRTL, getCurrentLanguage } from '@/components/utils/i18n';

export default function ForecastPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("spending");
  const isRTLLayout = isRTL();

  // Forecast parameters
  const [forecastPeriod, setForecastPeriod] = useState("6"); // months
  const [forecastMethod, setForecastMethod] = useState("trend"); // trend, average, seasonal
  const [customGrowthRate, setCustomGrowthRate] = useState("0"); // percentage

  // Forecast results
  const [spendingForecast, setSpendingForecast] = useState([]);
  const [incomeForecast, setIncomeForecast] = useState([]);
  const [savingsForecast, setSavingsForecast] = useState([]);
  const [categoryForecast, setCategoryForecast] = useState([]);
  const [forecastSummary, setForecastSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      generateForecast();
    }
  }, [transactions, categories, forecastPeriod, forecastMethod, customGrowthRate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        Transaction.list('-date', 1000),
        Category.list('name')
      ]);

      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('errors.loadingData'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateForecast = () => {
    try {
      const now = new Date();
      const monthsToForecast = parseInt(forecastPeriod);
      const historicalPeriods = 12; // Use last 12 months for analysis

      // Get historical data
      const historicalData = [];
      for (let i = historicalPeriods - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));

        const monthTransactions = transactions.filter(t =>
          isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
        );

        const monthIncome = monthTransactions
          .filter(t => t.is_income)
          .reduce((sum, t) => sum + (t.billing_amount || 0), 0);

        const monthExpenses = monthTransactions
          .filter(t => !t.is_income)
          .reduce((sum, t) => sum + (t.billing_amount || 0), 0);

        historicalData.push({
          month: formatDate(monthStart, 'MMM yyyy'),
          income: Math.round(monthIncome),
          expenses: Math.round(monthExpenses),
          savings: Math.round(monthIncome - monthExpenses),
          date: monthStart
        });
      }

      // Calculate trends and averages
      const avgIncome = historicalData.reduce((sum, d) => sum + d.income, 0) / historicalData.length;
      const avgExpenses = historicalData.reduce((sum, d) => sum + d.expenses, 0) / historicalData.length;
      const avgSavings = avgIncome - avgExpenses;

      // Calculate growth rates
      const incomeGrowthRate = calculateGrowthRate(historicalData.map(d => d.income));
      const expenseGrowthRate = calculateGrowthRate(historicalData.map(d => d.expenses));

      // Generate future forecast
      const forecastData = [];
      for (let i = 1; i <= monthsToForecast; i++) {
        const futureMonth = addMonths(now, i);
        let projectedIncome, projectedExpenses;

        if (forecastMethod === "average") {
          projectedIncome = avgIncome;
          projectedExpenses = avgExpenses;
        } else if (forecastMethod === "trend") {
          projectedIncome = avgIncome * Math.pow(1 + incomeGrowthRate / 100, i);
          projectedExpenses = avgExpenses * Math.pow(1 + expenseGrowthRate / 100, i);
        } else if (forecastMethod === "custom") {
          const growthRate = parseFloat(customGrowthRate) / 100;
          projectedIncome = avgIncome * Math.pow(1 + growthRate, i);
          projectedExpenses = avgExpenses * Math.pow(1 + growthRate, i);
        }

        forecastData.push({
          month: formatDate(futureMonth, 'MMM yyyy'),
          income: Math.round(projectedIncome),
          expenses: Math.round(projectedExpenses),
          savings: Math.round(projectedIncome - projectedExpenses),
          date: futureMonth,
          isForecast: true
        });
      }

      // Combine historical and forecast data
      const combinedData = [...historicalData, ...forecastData];

      setSpendingForecast(combinedData);
      setIncomeForecast(combinedData);
      setSavingsForecast(combinedData);

      // Generate category-wise forecast
      generateCategoryForecast(monthsToForecast);

      // Generate summary
      const totalForecastIncome = forecastData.reduce((sum, d) => sum + d.income, 0);
      const totalForecastExpenses = forecastData.reduce((sum, d) => sum + d.expenses, 0);
      const totalForecastSavings = totalForecastIncome - totalForecastExpenses;

      setForecastSummary({
        totalIncome: Math.round(totalForecastIncome),
        totalExpenses: Math.round(totalForecastExpenses),
        totalSavings: Math.round(totalForecastSavings),
        avgMonthlyIncome: Math.round(totalForecastIncome / monthsToForecast),
        avgMonthlyExpenses: Math.round(totalForecastExpenses / monthsToForecast),
        avgMonthlySavings: Math.round(totalForecastSavings / monthsToForecast),
        savingsRate: totalForecastIncome > 0 ? Math.round((totalForecastSavings / totalForecastIncome) * 100) : 0
      });

    } catch (error) {
      console.error("Error generating forecast:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('forecast.errors.generationFailed'),
      });
    }
  };

  const calculateGrowthRate = (values) => {
    if (values.length < 2) return 0;

    const validValues = values.filter(v => v > 0);
    if (validValues.length < 2) return 0;

    const firstValue = validValues[0];
    const lastValue = validValues[validValues.length - 1];
    const periods = validValues.length - 1;

    if (firstValue === 0) return 0;

    const growthRate = (Math.pow(lastValue / firstValue, 1 / periods) - 1) * 100;
    return Math.max(-50, Math.min(50, growthRate)); // Cap between -50% and 50%
  };

  const generateCategoryForecast = (monthsToForecast) => {
    const categoryData = [];

    categories.filter(c => c.type === 'expense').forEach(category => {
      const categoryTransactions = transactions.filter(t =>
        t.category_id === category.id && !t.is_income
      );

      if (categoryTransactions.length === 0) return;

      // Calculate monthly averages for the category
      const monthlyData = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));

        const monthCategoryTransactions = categoryTransactions.filter(t =>
          isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
        );

        const monthTotal = monthCategoryTransactions.reduce((sum, t) => sum + (t.billing_amount || 0), 0);
        monthlyData.push(monthTotal);
      }

      const avgMonthlySpending = monthlyData.reduce((sum, amount) => sum + amount, 0) / monthlyData.length;
      const growthRate = calculateGrowthRate(monthlyData);

      if (avgMonthlySpending > 0) {
        categoryData.push({
          category: category.name,
          icon: category.icon,
          currentMonthly: Math.round(avgMonthlySpending),
          forecastTotal: Math.round(avgMonthlySpending * monthsToForecast * Math.pow(1 + growthRate / 100, monthsToForecast / 2)),
          growthRate: Math.round(growthRate * 10) / 10,
          trend: growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable'
        });
      }
    });

    setCategoryForecast(categoryData.sort((a, b) => b.forecastTotal - a.forecastTotal));
  };

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="mr-2 text-gray-700">{t('common.loading')}</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('forecast.title')}</h1>
            <p className="text-gray-600">{t('forecast.subtitle')}</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('forecast.noData.title')}
            </h3>
            <p className="text-gray-500 text-center">
              {t('forecast.noData.description')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('forecast.title')}</h1>
          <p className="text-gray-600">{t('forecast.subtitle')}</p>
        </div>
      </div>

      {/* Forecast Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            {t('forecast.configuration.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="forecastPeriod">{t('forecast.configuration.period')}</Label>
              <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">{t('forecast.configuration.periods.3months')}</SelectItem>
                  <SelectItem value="6">{t('forecast.configuration.periods.6months')}</SelectItem>
                  <SelectItem value="12">{t('forecast.configuration.periods.12months')}</SelectItem>
                  <SelectItem value="24">{t('forecast.configuration.periods.24months')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="forecastMethod">{t('forecast.configuration.method')}</Label>
              <Select value={forecastMethod} onValueChange={setForecastMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="average">{t('forecast.configuration.methods.average')}</SelectItem>
                  <SelectItem value="trend">{t('forecast.configuration.methods.trend')}</SelectItem>
                  <SelectItem value="custom">{t('forecast.configuration.methods.custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {forecastMethod === "custom" && (
              <div>
                <Label htmlFor="customGrowthRate">{t('forecast.configuration.growthRate')}</Label>
                <Input
                  id="customGrowthRate"
                  type="number"
                  value={customGrowthRate}
                  onChange={(e) => setCustomGrowthRate(e.target.value)}
                  placeholder="0"
                  className="text-right"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Forecast Summary */}
      {forecastSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('forecast.summary.totalIncome')}</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(forecastSummary.totalIncome)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('forecast.summary.totalExpenses')}</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(forecastSummary.totalExpenses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('forecast.summary.totalSavings')}</p>
                  <p className={`text-xl font-bold ${forecastSummary.totalSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(forecastSummary.totalSavings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('forecast.summary.savingsRate')}</p>
                  <p className={`text-xl font-bold ${forecastSummary.savingsRate >= 20 ? 'text-green-600' : forecastSummary.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {forecastSummary.savingsRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forecast Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            {t('forecast.charts.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="spending">{t('forecast.charts.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="trends">{t('forecast.charts.tabs.trends')}</TabsTrigger>
              <TabsTrigger value="categories">{t('forecast.charts.tabs.categories')}</TabsTrigger>
            </TabsList>

            <TabsContent value="spending" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(value), t(`forecast.charts.${name}`)]}
                      labelFormatter={(label) => `${t('common.month')}: ${label}`}
                    />
                    <Bar dataKey="income" fill="#10B981" name="income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={savingsForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), t('forecast.charts.savings')]}
                      labelFormatter={(label) => `${t('common.month')}: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <h3 className="text-lg font-semibold mb-4">{t('forecast.charts.categoryDistribution')}</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryForecast.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="forecastTotal"
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryForecast.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">{t('forecast.charts.categoryForecast')}</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {categoryForecast.map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{category.category}</span>
                          {category.trend === 'increasing' && <TrendingUp className="w-4 h-4 text-red-500" />}
                          {category.trend === 'decreasing' && <TrendingDown className="w-4 h-4 text-green-500" />}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(category.forecastTotal)}</div>
                          <div className="text-sm text-gray-500">
                            {category.growthRate > 0 ? '+' : ''}{category.growthRate}% {t('forecast.charts.growth')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Forecast Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            {t('forecast.insights.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forecastSummary?.savingsRate < 10 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">{t('forecast.insights.lowSavings.title')}</h4>
                  <p className="text-red-700 text-sm">{t('forecast.insights.lowSavings.description')}</p>
                </div>
              </div>
            )}

            {forecastSummary?.savingsRate >= 20 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800">{t('forecast.insights.goodSavings.title')}</h4>
                  <p className="text-green-700 text-sm">{t('forecast.insights.goodSavings.description')}</p>
                </div>
              </div>
            )}

            {categoryForecast.some(c => c.trend === 'increasing' && c.growthRate > 10) && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">{t('forecast.insights.increasingExpenses.title')}</h4>
                  <p className="text-yellow-700 text-sm">{t('forecast.insights.increasingExpenses.description')}</p>
                  <div className="mt-2">
                    {categoryForecast
                      .filter(c => c.trend === 'increasing' && c.growthRate > 10)
                      .slice(0, 3)
                      .map(category => (
                        <Badge key={category.category} variant="outline" className="mr-2 mb-1">
                          {category.category} (+{category.growthRate}%)
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}