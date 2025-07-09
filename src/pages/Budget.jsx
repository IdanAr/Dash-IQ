
import React, { useState, useEffect } from "react";
import { Budget, Category, Transaction } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Edit,
  Trash2,
  Calendar,
  Target,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  XCircle
} from "lucide-react";
import { formatCurrency, t, isRTL, getCurrentLanguage } from "@/components/utils/i18n";
import { IconRenderer } from "@/components/utils/icons";
import { isWithinInterval, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, parseISO, startOfWeek, endOfWeek, addMonths, subMonths, addQuarters, subQuarters, addYears, subYears, addWeeks, subWeeks, format } from "date-fns";
import { he, enUS } from "date-fns/locale";


export default function BudgetPage() {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetStats, setBudgetStats] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // New state for period selection
  const [currentDate, setCurrentDate] = useState(new Date()); // New state for current viewing period
  const isRTLLayout = isRTL();
  const currentLang = getCurrentLanguage();
  const dateLocale = currentLang === 'he' ? he : enUS;

  // Form state
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    period: "monthly",
    start_date: "",
    end_date: ""
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (budgets.length > 0 && transactions.length > 0 && categories.length > 0) {
      calculateBudgetStats();
    }
  }, [budgets, transactions, categories, selectedPeriod, currentDate]); // Add selectedPeriod and currentDate as dependencies

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [budgetsData, categoriesData, transactionsData] = await Promise.all([
        Budget.list(),
        Category.list('sort_order'),
        Transaction.list('-date', 1000)
      ]);
      setBudgets(budgetsData);
      setCategories(categoriesData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error loading budget data:", error);
      toast({
        variant: "destructive",
        title: t('toast.error'), // Updated toast message
        description: t('toast.serverError'), // Updated toast message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBudgetStats = () => {
    const stats = {};

    // Get period boundaries based on selected period and currentDate
    let periodStart, periodEnd;
    switch (selectedPeriod) {
      case 'weekly':
        periodStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
        periodEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        break;
      case "monthly":
        periodStart = startOfMonth(currentDate);
        periodEnd = endOfMonth(currentDate);
        break;
      case "quarterly":
        periodStart = startOfQuarter(currentDate);
        periodEnd = endOfQuarter(currentDate);
        break;
      case "yearly":
        periodStart = startOfYear(currentDate);
        periodEnd = endOfYear(currentDate);
        break;
      default:
        periodStart = startOfMonth(currentDate);
        periodEnd = endOfMonth(currentDate);
    }

    budgets.forEach(budget => {
      const category = categories.find(c => c.id === budget.category_id);
      if (!category) return;

      // Calculate current period spending
      const categoryTransactions = transactions.filter(t => 
        t.category_id === budget.category_id && 
        !t.is_income &&
        isWithinInterval(parseISO(t.date), { start: periodStart, end: periodEnd })
      );

      const totalSpent = categoryTransactions.reduce((sum, t) => sum + (t.billing_amount || 0), 0);
      
      // Calculate aggregated budget based on selected period and budget's original period
      let aggregatedBudget = budget.amount;
      
      // Convert budget to selected period
      if (selectedPeriod !== budget.period) {
        // Ratios for converting from budget.period to selectedPeriod
        // Example: if budget.period is 'monthly' and selectedPeriod is 'weekly',
        // we need to find how many weeks are in a month (1/4.33) to scale the monthly budget for a week.
        const multipliers = {
          weekly: { monthly: 0.25, quarterly: 0.077, yearly: 0.019 }, // 1 week relative to other periods (1/4, 1/13, 1/52)
          monthly: { weekly: 4, quarterly: 0.33, yearly: 0.083 }, // 1 month relative to other periods (4, 1/3, 1/12)
          quarterly: { weekly: 13, monthly: 3, yearly: 0.25 }, // 1 quarter relative to other periods (13, 3, 1/4)
          yearly: { weekly: 52, monthly: 12, quarterly: 4 } // 1 year relative to other periods (52, 12, 4)
        };

        const conversionMap = multipliers[selectedPeriod]; // Map from budget.period to selectedPeriod
        if (conversionMap && conversionMap[budget.period]) {
            aggregatedBudget = budget.amount * conversionMap[budget.period];
        }
      }

      const percentage = aggregatedBudget > 0 ? Math.round((totalSpent / aggregatedBudget) * 100) : 0;
      const remaining = Math.max(0, aggregatedBudget - totalSpent);

      let status = 'good';
      if (percentage > 100) {
        status = 'over';
      } else if (percentage > 80) {
        status = 'warning';
      }

      stats[budget.id] = {
        totalSpent: Math.round(totalSpent),
        percentage,
        remaining: Math.round(remaining),
        status,
        transactionCount: categoryTransactions.length,
        category: category,
        aggregatedBudget: Math.round(aggregatedBudget),
        originalBudget: budget.amount,
        originalPeriod: budget.period
      };
    });

    setBudgetStats(stats);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.category_id) {
      errors.category_id = t('budget.budgetForm.categoryRequired');
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = t('budget.budgetForm.amountRequired');
    }
    if (!formData.period) {
      errors.period = t('budget.budgetForm.periodRequired');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBudget = async () => {
    if (!validateForm()) return;

    try {
      // Check if budget already exists for this category for the same period type
      const existingBudget = budgets.find(b => 
        b.category_id === formData.category_id && 
        b.period === formData.period && // Ensure same period type to avoid conflicts
        (!editingBudget || b.id !== editingBudget.id)
      );

      if (existingBudget) {
        toast({
          variant: "destructive",
          title: t('toast.warning'), // Updated toast message
          description: t('toast.budgetExists'), // Updated toast message
        });
        return;
      }

      const budgetData = {
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: formData.start_date || new Date().toISOString().split('T')[0],
        end_date: formData.end_date || null
      };

      if (editingBudget) {
        await Budget.update(editingBudget.id, budgetData);
        toast({
          title: t('toast.success'), // Updated toast message
          description: t('toast.budgetUpdated'), // Updated toast message
        });
      } else {
        await Budget.create(budgetData);
        toast({
          title: t('toast.success'), // Updated toast message
          description: t('toast.budgetCreated'), // Updated toast message
        });
      }

      setIsBudgetDialogOpen(false);
      setEditingBudget(null);
      resetForm();
      loadData(); // Corresponds to loadBudgets()
    } catch (error) {
      console.error("Error saving budget:", error);
      toast({
        variant: "destructive",
        title: t('toast.error'), // Updated toast message
        description: t('toast.serverError'), // Updated toast message
      });
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount?.toString() || "",
      period: budget.period,
      start_date: budget.start_date || "",
      end_date: budget.end_date || ""
    });
    setIsBudgetDialogOpen(true);
  };

  const handleDeleteBudget = async (budgetId) => {
    if (window.confirm(t('budget.confirmDelete'))) {
      try {
        await Budget.delete(budgetId);
        toast({
          title: t('toast.success'), // Updated toast message
          description: t('toast.budgetDeleted'), // Updated toast message
        });
        loadData(); // Corresponds to loadBudgets()
      } catch (error) {
        console.error("Error deleting budget:", error);
        toast({
          variant: "destructive",
          title: t('toast.error'), // Updated toast message
          description: t('toast.serverError'), // Updated toast message
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      amount: "",
      period: "monthly",
      start_date: "",
      end_date: ""
    });
    setFormErrors({});
  };

  // Navigation functions
  const navigatePrevious = () => {
    switch (selectedPeriod) {
      case 'weekly':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'monthly':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'quarterly':
        setCurrentDate(subQuarters(currentDate, 1));
        break;
      case 'yearly':
        setCurrentDate(subYears(currentDate, 1));
        break;
      default:
        setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    switch (selectedPeriod) {
      case 'weekly':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'monthly':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'quarterly':
        setCurrentDate(addQuarters(currentDate, 1));
        break;
      case 'yearly':
        setCurrentDate(addYears(currentDate, 1));
        break;
      default:
        setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  // Get current period display text
  const getCurrentPeriodText = () => {
    switch (selectedPeriod) {
      case 'weekly':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'dd/MM', { locale: dateLocale })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: dateLocale })}`;
      case 'monthly':
        return format(currentDate, 'MMMM yyyy', { locale: dateLocale });
      case 'quarterly':
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
        const year = currentDate.getFullYear();
        return currentLang === 'he' ? `${year} רבעון ${quarter}` : `Q${quarter} ${year}`;
      case 'yearly':
        return format(currentDate, 'yyyy', { locale: dateLocale });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: dateLocale });
    }
  };

  // Check if current period is the current actual period
  const isCurrentPeriod = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'weekly':
        const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
        const viewingWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return currentWeekStart.getTime() === viewingWeekStart.getTime();
      case 'monthly':
        return now.getMonth() === currentDate.getMonth() && now.getFullYear() === currentDate.getFullYear();
      case 'quarterly':
        return Math.floor(now.getMonth() / 3) === Math.floor(currentDate.getMonth() / 3) && 
               now.getFullYear() === currentDate.getFullYear();
      case 'yearly':
        return now.getFullYear() === currentDate.getFullYear();
      default:
        return false;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'over': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'good': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'over': return <XCircle className="w-3 h-3" />;
      case 'warning': return <AlertTriangle className="w-3 h-3" />;
      case 'good': return <CheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'over': return t('budget.overBudget');
      case 'warning': return t('budget.warning');
      case 'good': return t('budget.onTrack');
      default: return t('budget.budgetSet');
    }
  };

  // Get period label for display
  const getPeriodLabel = (period) => {
    switch (period) {
      case 'weekly': return t('periods.weekly');
      case 'monthly': return t('periods.monthly');
      case 'quarterly': return t('periods.quarterly');
      case 'yearly': return t('periods.yearly');
      default: return period;
    }
  };

  // Calculate overview stats with period consideration
  const overviewStats = {
    totalBudgeted: Math.round(Object.values(budgetStats).reduce((sum, s) => sum + (s?.aggregatedBudget || 0), 0)),
    totalSpent: Math.round(Object.values(budgetStats).reduce((sum, s) => sum + s.totalSpent, 0)),
    categoriesOverBudget: Object.values(budgetStats).filter(s => s.status === 'over').length,
    budgetUtilization: 0
  };

  overviewStats.budgetUtilization = overviewStats.totalBudgeted > 0 
    ? Math.round((overviewStats.totalSpent / overviewStats.totalBudgeted) * 100) 
    : 0;
  overviewStats.remainingBudget = Math.max(0, overviewStats.totalBudgeted - overviewStats.totalSpent);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('budget.title')}</h1>
            <p className="text-gray-600">{t('budget.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            {/* Period Selection for budget creation/viewing */}
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setCurrentDate(new Date()); // Reset to current date when changing period type
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="weekly">{t('periods.weekly')}</option>
              <option value="monthly">{t('periods.monthly')}</option>
              <option value="quarterly">{t('periods.quarterly')}</option>
              <option value="yearly">{t('periods.yearly')}</option>
            </select>
            
            <Button
              onClick={() => {
                resetForm();
                setEditingBudget(null);
                setIsBudgetDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('budget.createBudget')}
            </Button>
          </div>
        </div>

        {/* Period Navigation */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={navigatePrevious}
                className="flex items-center gap-2"
              >
                {isRTLLayout ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {t('weeklyMetrics.previousPeriod')}
              </Button>
              
              <div className="flex flex-col items-center justify-center gap-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {getCurrentPeriodText()}
                </h2>
                {isCurrentPeriod() ? (
                    <Badge variant="outline" className="text-xs">
                      {t('periods.currentPeriod')}
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={navigateToToday}
                      className="text-sm h-6 px-3"
                    >
                      {t('common.today')}
                    </Button>
                  )}
              </div>
              
              <Button
                variant="ghost"
                onClick={navigateNext}
                className="flex items-center gap-2"
              >
                {t('weeklyMetrics.nextPeriod')}
                {isRTLLayout ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Period Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {t('budget.overview.budgetUtilization')} - {getPeriodLabel(selectedPeriod)}
              </span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              {selectedPeriod === 'weekly' && t('weeklyMetrics.weeklyDescription')}
              {selectedPeriod === 'monthly' && t('weeklyMetrics.monthlyDescription')}
              {selectedPeriod === 'quarterly' && t('weeklyMetrics.quarterlyDescription')}
              {selectedPeriod === 'yearly' && t('weeklyMetrics.yearlyDescription')}
            </p>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className={isRTLLayout ? "text-right" : "text-left"}>
                  <p className="text-sm text-gray-600">
                    {t('budget.overview.totalBudgeted')} ({getPeriodLabel(selectedPeriod)})
                  </p>
                  <p className="text-xl font-bold">{formatCurrency(overviewStats.totalBudgeted)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-red-600" />
                </div>
                <div className={isRTLLayout ? "text-right" : "text-left"}>
                  <p className="text-sm text-gray-600">
                    {t('budget.overview.totalSpent')} ({getPeriodLabel(selectedPeriod)})
                  </p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(overviewStats.totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <PiggyBank className="w-5 h-5 text-green-600" />
                </div>
                <div className={isRTLLayout ? "text-right" : "text-left"}>
                  <p className="text-sm text-gray-600">
                    {t('budget.overview.remainingBudget')} ({getPeriodLabel(selectedPeriod)})
                  </p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(overviewStats.remainingBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div className={isRTLLayout ? "text-right" : "text-left"}>
                  <p className="text-sm text-gray-600">{t('budget.overview.budgetUtilization')}</p>
                  <p className="text-xl font-bold">{overviewStats.budgetUtilization}%</p>
                  {overviewStats.categoriesOverBudget > 0 && (
                    <p className="text-xs text-red-600">
                      {t('budget.overview.categoriesOverBudget')}: {overviewStats.categoriesOverBudget}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-blue-600" />
              {t('budget.budgetList')} - {getPeriodLabel(selectedPeriod)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budgets.length === 0 ? (
              <div className="text-center py-12">
                <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('budget.noBudgets')}</h3>
                <p className="text-gray-500 mb-4">{t('budget.noBudgetsDescription')}</p>
                <Button onClick={() => setIsBudgetDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('budget.createFirstBudget')}
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {budgets.map((budget) => {
                  const stats = budgetStats[budget.id];
                  const category = categories.find(c => c.id === budget.category_id);
                  
                  if (!stats || !category) return null;

                  return (
                    <Card key={budget.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <IconRenderer iconName={category.icon} size={20} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{category.name}</h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {getPeriodLabel(selectedPeriod)}
                                </Badge>
                                {stats.originalPeriod !== selectedPeriod && (
                                  <Badge variant="secondary" className="text-xs">
                                    {t('budget.budgetPeriod')}: {getPeriodLabel(stats.originalPeriod)}
                                  </Badge>
                                )}
                                <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(stats.status)}`}>
                                  {getStatusIcon(stats.status)}
                                  <span className={isRTLLayout ? "mr-1" : "ml-1"}>{getStatusLabel(stats.status)}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBudget(budget)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBudget(budget.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{t('budget.budgetProgress')}</span>
                            <span className="font-medium">{stats.percentage}%</span>
                          </div>
                          
                          <Progress 
                            value={Math.min(stats.percentage, 100)} 
                            className="h-2"
                          />
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className={isRTLLayout ? "text-right" : "text-left"}>
                              <p className="text-gray-600">
                                {t('budget.budgetAmount')} ({getPeriodLabel(selectedPeriod)})
                              </p>
                              <p className="font-semibold">{formatCurrency(stats.aggregatedBudget)}</p>
                              {stats.originalPeriod !== selectedPeriod && (
                                <p className="text-xs text-gray-500">
                                  {t('budget.budgetPeriod')} {getPeriodLabel(stats.originalPeriod)}: {formatCurrency(stats.originalBudget)}
                                </p>
                              )}
                            </div>
                            <div className={isRTLLayout ? "text-right" : "text-left"}>
                              <p className="text-gray-600">{t('budget.spentAmount')}</p>
                              <p className="font-semibold text-red-600">{formatCurrency(stats.totalSpent)}</p>
                            </div>
                            <div className={isRTLLayout ? "text-right" : "text-left"}>
                              <p className="text-gray-600">{t('budget.remainingAmount')}</p>
                              <p className={`font-semibold ${stats.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.remaining)}
                              </p>
                            </div>
                          </div>

                          {stats.transactionCount > 0 && (
                            <div className="text-xs text-gray-500 border-t pt-2">
                              {t('budget.transactionsThisPeriod')}: {stats.transactionCount}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Form Dialog */}
        <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
          <DialogContent className="max-w-md" dir={isRTLLayout ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? t('budget.editBudget') : t('budget.createBudget')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category_id">{t('budget.selectCategory')} *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger className={formErrors.category_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={t('budget.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                    {categories.filter(c => c.type === 'expense').map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <IconRenderer iconName={category.icon} size={16} />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category_id && <p className="text-sm text-red-500">{formErrors.category_id}</p>}
              </div>

              <div>
                <Label htmlFor="amount">{t('budget.budgetAmount')} *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className={formErrors.amount ? "border-red-500" : ""}
                />
                {formErrors.amount && <p className="text-sm text-red-500">{formErrors.amount}</p>}
              </div>

              <div>
                <Label htmlFor="period">{t('budget.budgetPeriod')} *</Label>
                <Select 
                  value={formData.period} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}
                >
                  <SelectTrigger className={formErrors.period ? "border-red-500" : ""}>
                    <SelectValue placeholder={t('budget.selectPeriod')} />
                  </SelectTrigger>
                  <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                    <SelectItem value="weekly">{t('periods.weekly')}</SelectItem>
                    <SelectItem value="monthly">{t('periods.monthly')}</SelectItem>
                    <SelectItem value="quarterly">{t('periods.quarterly')}</SelectItem>
                    <SelectItem value="yearly">{t('periods.yearly')}</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.period && <p className="text-sm text-red-500">{formErrors.period}</p>}
              </div>

              <div>
                <Label htmlFor="start_date">{t('budget.startDate')}</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsBudgetDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSaveBudget}>
                  {editingBudget ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
