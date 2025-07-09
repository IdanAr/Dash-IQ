
import React, { useState, useEffect } from "react";
import { Transaction, Category, EmergencyFundCalculation, BudgetRuleCalculation } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  PiggyBank,
  Target,
  TrendingUp,
  DollarSign,
  Calculator,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Percent,
  BarChart3,
  Shield,
  Wallet,
  Heart,
  Crown,
  Star,
  Zap,
  Info as InfoIcon // Added Info as InfoIcon
} from "lucide-react";
import { t, isRTL, formatCurrency, formatDate, formatNumber } from '@/components/utils/i18n'; // Updated i18n import
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  parseISO,
  differenceInMonths,
  addMonths,
  format as formatFns // Changed alias from formatDate to formatFns
} from "date-fns";

const ENHANCED_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function SavingsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("emergencyFund");
  const isRTLLayout = isRTL();

  // Emergency Fund Calculator State
  const [emergencyFundForm, setEmergencyFundForm] = useState({
    currentSavings: "",
    monthlyExpenses: "",
    targetMonths: "6"
  });
  const [emergencyFundResults, setEmergencyFundResults] = useState(null);
  const [isCalculatingEmergencyFund, setIsCalculatingEmergencyFund] = useState(false);

  // 50/30/20 Budget Rule State
  const [budgetRuleForm, setBudgetRuleForm] = useState({
    monthlyIncome: "",
    currentNeeds: "",
    currentWants: "",
    currentSavings: ""
  });
  const [budgetRuleResults, setBudgetRuleResults] = useState(null);
  const [isCalculatingBudgetRule, setIsCalculatingBudgetRule] = useState(false);

  // Savings Goals State
  const [savingsGoalForm, setSavingsGoalForm] = useState({
    goalName: "",
    targetAmount: "",
    currentSaved: "",
    targetDate: "",
    monthlySavings: ""
  });
  const [savingsGoalResults, setSavingsGoalResults] = useState(null);

  // Financial Health State
  const [financialHealthScore, setFinancialHealthScore] = useState(null);
  const [isCalculatingHealthScore, setIsCalculatingHealthScore] = useState(false);

  // Compound Interest State
  const [compoundInterestForm, setCompoundInterestForm] = useState({
    initialAmount: "",
    monthlyContribution: "",
    annualReturn: "7",
    timeHorizon: "10"
  });
  const [compoundInterestResults, setCompoundInterestResults] = useState(null);
  const [compoundInterestChart, setCompoundInterestChart] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        Transaction.list('-date', 500),
        Category.list('name')
      ]);
      
      setTransactions(transactionsData);
      setCategories(categoriesData);

      // Auto-calculate monthly expenses for emergency fund
      if (transactionsData.length > 0) {
        calculateMonthlyExpenses(transactionsData);
      }
    } catch (error) {
      console.error("Error loading savings data:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('errors.loadingData'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyExpenses = (transactionsData) => {
    const now = new Date();
    const lastThreeMonths = [];
    
    for (let i = 0; i < 3; i++) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      
      const monthExpenses = transactionsData
        .filter(t => !t.is_income && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
        .reduce((sum, t) => sum + (t.billing_amount || 0), 0);
      
      lastThreeMonths.push(monthExpenses);
    }
    
    const avgMonthlyExpenses = lastThreeMonths.reduce((sum, expense) => sum + expense, 0) / lastThreeMonths.length;
    
    setEmergencyFundForm(prev => ({
      ...prev,
      monthlyExpenses: Math.round(avgMonthlyExpenses).toString()
    }));
  };

  const calculateEmergencyFund = async () => {
    if (!emergencyFundForm.monthlyExpenses || !emergencyFundForm.targetMonths) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('savings.common.pleaseFillAllFields')
      });
      return;
    }

    setIsCalculatingEmergencyFund(true);
    
    try {
      const monthlyExpenses = parseFloat(emergencyFundForm.monthlyExpenses);
      const currentSavings = parseFloat(emergencyFundForm.currentSavings) || 0;
      const targetMonths = parseFloat(emergencyFundForm.targetMonths);
      
      const targetAmount = monthlyExpenses * targetMonths;
      const amountNeeded = Math.max(0, targetAmount - currentSavings);
      const monthsToGoal = amountNeeded > 0 ? Math.ceil(amountNeeded / (monthlyExpenses * 0.2)) : 0; // Assume 20% of expenses can be saved
      const monthlySavingsNeeded = monthsToGoal > 0 ? Math.ceil(amountNeeded / monthsToGoal) : 0;
      
      let status = 'needsImprovement';
      if (currentSavings >= targetAmount) {
        status = 'excellent';
      } else if (currentSavings >= targetAmount * 0.5) {
        status = 'good';
      }

      const results = {
        targetAmount: Math.round(targetAmount),
        amountNeeded: Math.round(amountNeeded),
        monthsToGoal,
        monthlySavingsNeeded,
        currentCoverage: monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0,
        progressPercentage: Math.min((currentSavings / targetAmount) * 100, 100),
        status
      };

      setEmergencyFundResults(results);

      // Save calculation to database
      await EmergencyFundCalculation.create({
        monthly_expenses: monthlyExpenses,
        current_savings: currentSavings,
        target_months: targetMonths,
        target_amount: targetAmount,
        monthly_save_amount: monthlySavingsNeeded,
        months_to_goal: monthsToGoal,
        calculation_date: new Date().toISOString(),
        notes: t('savings.emergencyFund.results.title')
      });

      toast({
        title: t('common.success'),
        description: t('savings.common.calculationSaved')
      });

    } catch (error) {
      console.error("Error calculating emergency fund:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('savings.common.invalidInput')
      });
    } finally {
      setIsCalculatingEmergencyFund(false);
    }
  };

  const calculateBudgetRule = async () => {
    if (!budgetRuleForm.monthlyIncome) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('savings.common.pleaseFillAllFields')
      });
      return;
    }

    setIsCalculatingBudgetRule(true);
    
    try {
      const monthlyIncome = parseFloat(budgetRuleForm.monthlyIncome);
      const currentNeeds = parseFloat(budgetRuleForm.currentNeeds) || 0;
      const currentWants = parseFloat(budgetRuleForm.currentWants) || 0;
      const currentSavings = parseFloat(budgetRuleForm.currentSavings) || 0;
      
      const recommendedNeeds = monthlyIncome * 0.5;
      const recommendedWants = monthlyIncome * 0.3;
      const recommendedSavings = monthlyIncome * 0.2;
      
      const needsDiff = currentNeeds - recommendedNeeds;
      const wantsDiff = currentWants - recommendedWants;
      const savingsDiff = currentSavings - recommendedSavings;
      
      let overallStatus = 'excellent';
      const tolerancePercentage = 0.1; // 10% tolerance
      
      if (Math.abs(needsDiff) > recommendedNeeds * tolerancePercentage ||
          Math.abs(wantsDiff) > recommendedWants * tolerancePercentage ||
          Math.abs(savingsDiff) > recommendedSavings * tolerancePercentage) {
        overallStatus = Math.abs(needsDiff) > recommendedNeeds * 0.2 ||
                      Math.abs(wantsDiff) > recommendedWants * 0.2 ||
                      Math.abs(savingsDiff) > recommendedSavings * 0.2 ? 'needsAdjustment' : 'good';
      }

      const results = {
        recommendedNeeds: Math.round(recommendedNeeds),
        recommendedWants: Math.round(recommendedWants),
        recommendedSavings: Math.round(recommendedSavings),
        needsDiff: Math.round(needsDiff),
        wantsDiff: Math.round(wantsDiff),
        savingsDiff: Math.round(savingsDiff),
        overallStatus,
        currentSavingsRate: monthlyIncome > 0 ? (currentSavings / monthlyIncome) * 100 : 0
      };

      setBudgetRuleResults(results);

      // Save calculation to database
      await BudgetRuleCalculation.create({
        monthly_income: monthlyIncome,
        needs_amount: recommendedNeeds,
        wants_amount: recommendedWants,
        savings_amount: recommendedSavings,
        current_needs_spending: currentNeeds,
        current_wants_spending: currentWants,
        current_savings_rate: results.currentSavingsRate,
        calculation_date: new Date().toISOString(),
        notes: t('savings.budgetRule.results.title')
      });

      toast({
        title: t('common.success'),
        description: t('savings.common.calculationSaved')
      });

    } catch (error) {
      console.error("Error calculating budget rule:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('savings.common.invalidInput')
      });
    } finally {
      setIsCalculatingBudgetRule(false);
    }
  };

  const calculateSavingsGoal = () => {
    if (!savingsGoalForm.goalName || !savingsGoalForm.targetAmount) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('savings.common.pleaseFillAllFields')
      });
      return;
    }

    try {
      const targetAmount = parseFloat(savingsGoalForm.targetAmount);
      const currentSaved = parseFloat(savingsGoalForm.currentSaved) || 0;
      const monthlySavings = parseFloat(savingsGoalForm.monthlySavings) || 0;
      const amountNeeded = Math.max(0, targetAmount - currentSaved);
      
      let monthsToGoal = 0;
      let projectedCompletion = null;
      let status = 'onTrack';
      
      if (monthlySavings > 0 && amountNeeded > 0) {
        monthsToGoal = Math.ceil(amountNeeded / monthlySavings);
        projectedCompletion = addMonths(new Date(), monthsToGoal);
        
        if (savingsGoalForm.targetDate) {
          const targetDate = new Date(savingsGoalForm.targetDate);
          const monthsAvailable = differenceInMonths(targetDate, new Date());
          
          if (monthsToGoal > monthsAvailable) {
            status = 'behindSchedule';
          } else if (monthsToGoal < monthsAvailable * 0.8) {
            status = 'aheadOfSchedule';
          }
        }
      }

      const results = {
        targetAmount: Math.round(targetAmount),
        currentSaved: Math.round(currentSaved),
        amountNeeded: Math.round(amountNeeded),
        monthsToGoal,
        projectedCompletion,
        progressPercentage: Math.min((currentSaved / targetAmount) * 100, 100),
        status,
        monthlySavingsNeeded: monthlySavings
      };

      setSavingsGoalResults(results);

      toast({
        title: t('common.success'),
        description: t('savings.common.calculationSaved')
      });

    } catch (error) {
      console.error("Error calculating savings goal:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('savings.common.invalidInput')
      });
    }
  };

  const calculateFinancialHealth = async () => {
    setIsCalculatingHealthScore(true);
    
    try {
      const now = new Date();
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      const lastMonthTransactions = transactions.filter(t => 
        isWithinInterval(parseISO(t.date), { start: lastMonthStart, end: lastMonthEnd })
      );

      const monthlyIncome = lastMonthTransactions
        .filter(t => t.is_income)
        .reduce((sum, t) => sum + (t.billing_amount || 0), 0);

      const monthlyExpenses = lastMonthTransactions
        .filter(t => !t.is_income)
        .reduce((sum, t) => sum + (t.billing_amount || 0), 0);

      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
      
      // Scoring criteria
      let emergencyFundScore = 0;
      if (emergencyFundResults) {
        const coverage = emergencyFundResults.currentCoverage;
        if (coverage >= 6) emergencyFundScore = 25;
        else if (coverage >= 3) emergencyFundScore = 20;
        else if (coverage >= 1) emergencyFundScore = 15;
        else emergencyFundScore = 5;
      }

      let savingsRateScore = 0;
      if (savingsRate >= 20) savingsRateScore = 25;
      else if (savingsRate >= 15) savingsRateScore = 20;
      else if (savingsRate >= 10) savingsRateScore = 15;
      else if (savingsRate >= 5) savingsRateScore = 10;
      else savingsRateScore = 5;

      let budgetScore = 20; // Default if no budget rule calculated
      if (budgetRuleResults) {
        if (budgetRuleResults.overallStatus === 'excellent') budgetScore = 25;
        else if (budgetRuleResults.overallStatus === 'good') budgetScore = 20;
        else budgetScore = 10;
      }

      const debtToIncomeScore = 15; // Simplified - assume good debt ratio
      const diversificationScore = 10; // Simplified - basic score

      const totalScore = emergencyFundScore + savingsRateScore + budgetScore + debtToIncomeScore + diversificationScore;
      
      let scoreCategory = 'poor';
      if (totalScore >= 90) scoreCategory = 'excellent';
      else if (totalScore >= 70) scoreCategory = 'good';
      else if (totalScore >= 50) scoreCategory = 'fair';

      const healthScore = {
        totalScore,
        scoreCategory,
        breakdown: {
          emergencyFund: emergencyFundScore,
          savingsRate: savingsRateScore,
          budgetAdherence: budgetScore,
          debtToIncome: debtToIncomeScore,
          diversification: diversificationScore
        },
        recommendations: []
      };

      // Generate recommendations
      if (emergencyFundScore < 20) {
        healthScore.recommendations.push('buildEmergencyFund');
      }
      if (savingsRateScore < 20) {
        healthScore.recommendations.push('increaseSavings');
      }
      if (budgetScore < 20) {
        healthScore.recommendations.push('stickToBudget');
      }

      setFinancialHealthScore(healthScore);

      toast({
        title: t('common.success'),
        description: t('savings.common.calculationSaved')
      });

    } catch (error) {
      console.error("Error calculating financial health:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('savings.common.invalidInput')
      });
    } finally {
      setIsCalculatingHealthScore(false);
    }
  };

  const calculateCompoundInterest = () => {
    if (!compoundInterestForm.initialAmount || !compoundInterestForm.annualReturn || !compoundInterestForm.timeHorizon) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('savings.common.pleaseFillAllFields')
      });
      return;
    }

    try {
      const initialAmount = parseFloat(compoundInterestForm.initialAmount);
      const monthlyContribution = parseFloat(compoundInterestForm.monthlyContribution) || 0;
      const annualReturn = parseFloat(compoundInterestForm.annualReturn) / 100;
      const timeHorizon = parseInt(compoundInterestForm.timeHorizon);
      const monthlyReturn = annualReturn / 12;

      let balance = initialAmount;
      const chartData = [];
      let totalContributions = initialAmount;

      // Calculate compound growth month by month
      for (let year = 0; year <= timeHorizon; year++) {
        if (year === 0) {
          chartData.push({
            year: year,
            total: Math.round(balance),
            contributions: Math.round(totalContributions),
            interest: 0
          });
          continue;
        }

        // Calculate monthly for this year
        for (let month = 1; month <= 12; month++) {
          balance = balance * (1 + monthlyReturn) + monthlyContribution;
          totalContributions += monthlyContribution;
        }

        const interest = balance - totalContributions;
        chartData.push({
          year: year,
          total: Math.round(balance),
          contributions: Math.round(totalContributions),
          interest: Math.round(interest)
        });
      }

      const finalAmount = balance;
      const totalInterest = finalAmount - totalContributions;
      const monthlyGrowth = timeHorizon > 0 ? Math.pow(finalAmount / initialAmount, 1 / (timeHorizon * 12)) - 1 : 0;

      const results = {
        finalAmount: Math.round(finalAmount),
        totalContributions: Math.round(totalContributions),
        totalInterest: Math.round(totalInterest),
        monthlyGrowth: monthlyGrowth * 100,
        breakevenYears: Math.log(2) / Math.log(1 + annualReturn), // Years to double
        annualizedReturn: annualReturn * 100
      };

      setCompoundInterestResults(results);
      setCompoundInterestChart(chartData);

      toast({
        title: t('common.success'),
        description: t('savings.common.calculationSaved')
      });

    } catch (error) {
      console.error("Error calculating compound interest:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('savings.common.invalidInput')
      });
    }
  };

  const getScoreIcon = (category) => {
    switch (category) {
      case 'excellent': return <Crown className="w-6 h-6 text-yellow-500" />;
      case 'good': return <Star className="w-6 h-6 text-blue-500" />;
      case 'fair': return <Target className="w-6 h-6 text-yellow-500" />;
      case 'poor': return <AlertCircle className="w-6 h-6 text-red-500" />;
      default: return <Target className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'average': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'needsImprovement': 
      case 'needsAdjustment': 
      case 'behindSchedule': return 'bg-red-100 text-red-800 border-red-200';
      case 'onTrack':
      case 'aheadOfSchedule': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('savings.common.loadingCalculation')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <PiggyBank className="w-8 h-8 text-green-600" />
          {t('savings.title')}
        </h1>
        <p className="text-gray-600">
          {t('savings.subtitle')}
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 gap-1 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="emergencyFund" 
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all text-xs md:text-sm"
          >
            <Shield className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('savings.tabs.emergencyFund')}</span>
            <span className="sm:hidden">{t('savings.tabs.emergencyFund').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="budgetRule" 
            className="data-[state=active]:bg-white data-[state=active]:text-green-600 transition-all text-xs md:text-sm"
          >
            <Calculator className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('savings.tabs.budgetRule')}</span>
            <span className="sm:hidden">50/30/20</span>
          </TabsTrigger>
          <TabsTrigger 
            value="savingsGoals" 
            className="data-[state=active]:bg-white data-[state=active]:text-purple-600 transition-all text-xs md:text-sm"
          >
            <Target className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('savings.tabs.savingsGoals')}</span>
            <span className="sm:hidden">{t('savings.tabs.savingsGoals').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="financialHealth" 
            className="data-[state=active]:bg-white data-[state=active]:text-red-600 transition-all text-xs md:text-sm"
          >
            <Heart className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('savings.tabs.financialHealth')}</span>
            <span className="sm:hidden">{t('savings.tabs.financialHealth').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="compoundInterest" 
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 transition-all text-xs md:text-sm"
          >
            <Zap className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('savings.tabs.compoundInterest')}</span>
            <span className="sm:hidden">{t('savings.tabs.compoundInterest').split(' ')[1]}</span>
          </TabsTrigger>
        </TabsList>

        {/* Emergency Fund Calculator */}
        <TabsContent value="emergencyFund" className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Shield className="w-6 h-6" />
                {t('savings.emergencyFund.title')}
              </CardTitle>
              <CardDescription className="text-blue-700">
                {t('savings.emergencyFund.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentSavings">{t('savings.emergencyFund.currentSavings')}</Label>
                  <Input
                    id="currentSavings"
                    type="number"
                    placeholder={t('savings.emergencyFund.currentSavingsPlaceholder')}
                    value={emergencyFundForm.currentSavings}
                    onChange={(e) => setEmergencyFundForm(prev => ({ ...prev, currentSavings: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyExpenses">{t('savings.emergencyFund.monthlyExpenses')}</Label>
                  <Input
                    id="monthlyExpenses"
                    type="number"
                    placeholder={t('savings.emergencyFund.monthlyExpensesPlaceholder')}
                    value={emergencyFundForm.monthlyExpenses}
                    onChange={(e) => setEmergencyFundForm(prev => ({ ...prev, monthlyExpenses: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetMonths">
                    {t('savings.emergencyFund.targetMonths')}
                    <span className="text-xs text-gray-500 block">{t('savings.emergencyFund.targetMonthsDescription')}</span>
                  </Label>
                  <Input
                    id="targetMonths"
                    type="number"
                    min="1"
                    max="12"
                    value={emergencyFundForm.targetMonths}
                    onChange={(e) => setEmergencyFundForm(prev => ({ ...prev, targetMonths: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
              </div>
              
              <Button 
                onClick={calculateEmergencyFund} 
                disabled={isCalculatingEmergencyFund}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCalculatingEmergencyFund ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('savings.emergencyFund.calculating')}
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    {t('savings.emergencyFund.calculate')}
                  </>
                )}
              </Button>

              {emergencyFundResults && (
                <div className="mt-6 p-6 bg-white rounded-lg border border-blue-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('savings.emergencyFund.results.title')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(emergencyFundResults.targetAmount)}</div>
                      <div className="text-sm text-gray-600">{t('savings.emergencyFund.results.targetAmount')}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">{emergencyFundResults.currentCoverage.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">{t('savings.emergencyFund.results.currentStatus')}</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{emergencyFundResults.monthsToGoal}</div>
                      <div className="text-sm text-gray-600">{t('savings.emergencyFund.results.monthsToGoal')}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(emergencyFundResults.monthlySavingsNeeded)}</div>
                      <div className="text-sm text-gray-600">{t('savings.emergencyFund.results.monthlySavingsNeeded')}</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{t('savings.emergencyFund.results.currentStatus')}</span>
                      <Badge className={getStatusColor(emergencyFundResults.status)}>
                        {t(`savings.emergencyFund.results.status.${emergencyFundResults.status}`)}
                      </Badge>
                    </div>
                    <Progress value={emergencyFundResults.progressPercentage} className="h-3" />
                    <div className="text-center text-sm text-gray-600 mt-1">
                      {emergencyFundResults.progressPercentage.toFixed(1)}% {t('common.complete')}
                    </div>
                  </div>

                  {emergencyFundResults.status !== 'excellent' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">{t('savings.emergencyFund.recommendations.title')}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <strong>{t('savings.emergencyFund.recommendations.startNow')}</strong>
                            <p className="text-gray-600">{t('savings.emergencyFund.recommendations.startNowDescription')}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <strong>{t('savings.emergencyFund.recommendations.autoTransfer')}</strong>
                            <p className="text-gray-600">{t('savings.emergencyFund.recommendations.autoTransferDescription')}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <strong>{t('savings.emergencyFund.recommendations.separateAccount')}</strong>
                            <p className="text-gray-600">{t('savings.emergencyFund.recommendations.separateAccountDescription')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 50/30/20 Budget Rule */}
        <TabsContent value="budgetRule" className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Calculator className="w-6 h-6" />
                {t('savings.budgetRule.title')}
              </CardTitle>
              <CardDescription className="text-green-700">
                {t('savings.budgetRule.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome">{t('savings.budgetRule.monthlyIncome')} *</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    placeholder={t('savings.budgetRule.monthlyIncomePlaceholder')}
                    value={budgetRuleForm.monthlyIncome}
                    onChange={(e) => setBudgetRuleForm(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentNeeds">{t('savings.budgetRule.currentNeeds')}</Label>
                  <Input
                    id="currentNeeds"
                    type="number"
                    placeholder={t('savings.budgetRule.currentNeedsPlaceholder')}
                    value={budgetRuleForm.currentNeeds}
                    onChange={(e) => setBudgetRuleForm(prev => ({ ...prev, currentNeeds: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentWants">{t('savings.budgetRule.currentWants')}</Label>
                  <Input
                    id="currentWants"
                    type="number"
                    placeholder={t('savings.budgetRule.currentWantsPlaceholder')}
                    value={budgetRuleForm.currentWants}
                    onChange={(e) => setBudgetRuleForm(prev => ({ ...prev, currentWants: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentSavingsRule">{t('savings.budgetRule.currentSavings')}</Label>
                  <Input
                    id="currentSavingsRule"
                    type="number"
                    placeholder={t('savings.budgetRule.currentSavingsPlaceholder')}
                    value={budgetRuleForm.currentSavings}
                    onChange={(e) => setBudgetRuleForm(prev => ({ ...prev, currentSavings: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
              </div>
              
              <Button 
                onClick={calculateBudgetRule} 
                disabled={isCalculatingBudgetRule}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isCalculatingBudgetRule ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('savings.budgetRule.calculating')}
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    {t('savings.budgetRule.calculate')}
                  </>
                )}
              </Button>

              {budgetRuleResults && (
                <div className="mt-6 p-6 bg-white rounded-lg border border-green-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{t('savings.budgetRule.results.title')}</h3>
                    <Badge className={getStatusColor(budgetRuleResults.overallStatus)}>
                      {t(`savings.budgetRule.status.${budgetRuleResults.overallStatus}`)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(budgetRuleResults.recommendedNeeds)}</div>
                      <div className="text-sm font-medium text-gray-800">{t('savings.budgetRule.results.needs')}</div>
                      <div className="text-xs text-gray-600 mt-1">{t('savings.budgetRule.results.needsDescription')}</div>
                      {budgetRuleForm.currentNeeds && (
                        <div className={`text-xs mt-1 font-medium ${budgetRuleResults.needsDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {budgetRuleResults.needsDiff > 0 ? '+' : ''}{formatCurrency(budgetRuleResults.needsDiff)}
                        </div>
                      )}
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(budgetRuleResults.recommendedWants)}</div>
                      <div className="text-sm font-medium text-gray-800">{t('savings.budgetRule.results.wants')}</div>
                      <div className="text-xs text-gray-600 mt-1">{t('savings.budgetRule.results.wantsDescription')}</div>
                      {budgetRuleForm.currentWants && (
                        <div className={`text-xs mt-1 font-medium ${budgetRuleResults.wantsDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {budgetRuleResults.wantsDiff > 0 ? '+' : ''}{formatCurrency(budgetRuleResults.wantsDiff)}
                        </div>
                      )}
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(budgetRuleResults.recommendedSavings)}</div>
                      <div className="text-sm font-medium text-gray-800">{t('savings.budgetRule.results.savings')}</div>
                      <div className="text-xs text-gray-600 mt-1">{t('savings.budgetRule.results.savingsDescription')}</div>
                      {budgetRuleForm.currentSavings && (
                        <div className={`text-xs mt-1 font-medium ${budgetRuleResults.savingsDiff < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {budgetRuleResults.savingsDiff > 0 ? '+' : ''}{formatCurrency(budgetRuleResults.savingsDiff)}
                        </div>
                      )}
                    </div>
                  </div>

                  {budgetRuleResults.overallStatus !== 'excellent' && (
                    <div className="mt-6 bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">{t('savings.budgetRule.tips.title')}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <strong>{t('savings.budgetRule.tips.trackExpenses')}</strong>
                            <p className="text-gray-600">{t('savings.budgetRule.tips.trackExpensesDescription')}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <strong>{t('savings.budgetRule.tips.reduceFees')}</strong>
                            <p className="text-gray-600">{t('savings.budgetRule.tips.reduceFeesDescription')}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <strong>{t('savings.budgetRule.tips.increaseIncome')}</strong>
                            <p className="text-gray-600">{t('savings.budgetRule.tips.increaseIncomeDescription')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Savings Goals Tracker */}
        <TabsContent value="savingsGoals" className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Target className="w-6 h-6" />
                {t('savings.savingsGoals.title')}
              </CardTitle>
              <CardDescription className="text-purple-700">
                {t('savings.savingsGoals.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goalName">{t('savings.savingsGoals.goalName')} *</Label>
                  <Input
                    id="goalName"
                    placeholder={t('savings.savingsGoals.goalNamePlaceholder')}
                    value={savingsGoalForm.goalName}
                    onChange={(e) => setSavingsGoalForm(prev => ({ ...prev, goalName: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">{t('savings.savingsGoals.targetAmount')} *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    placeholder={t('savings.savingsGoals.targetAmountPlaceholder')}
                    value={savingsGoalForm.targetAmount}
                    onChange={(e) => setSavingsGoalForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentSaved">{t('savings.savingsGoals.currentSaved')}</Label>
                  <Input
                    id="currentSaved"
                    type="number"
                    placeholder={t('savings.savingsGoals.currentSavedPlaceholder')}
                    value={savingsGoalForm.currentSaved}
                    onChange={(e) => setSavingsGoalForm(prev => ({ ...prev, currentSaved: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetDate">{t('savings.savingsGoals.targetDate')}</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={savingsGoalForm.targetDate}
                    onChange={(e) => setSavingsGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="monthlySavings">{t('savings.savingsGoals.monthlySavings')}</Label>
                  <Input
                    id="monthlySavings"
                    type="number"
                    placeholder={t('savings.savingsGoals.monthlySavingsPlaceholder')}
                    value={savingsGoalForm.monthlySavings}
                    onChange={(e) => setSavingsGoalForm(prev => ({ ...prev, monthlySavings: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
              </div>
              
              <Button 
                onClick={calculateSavingsGoal}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Target className="w-4 h-4 mr-2" />
                {t('savings.savingsGoals.calculate')}
              </Button>

              {savingsGoalResults && (
                <div className="mt-6 p-6 bg-white rounded-lg border border-purple-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{t('savings.savingsGoals.results.title')}</h3>
                    <Badge className={getStatusColor(savingsGoalResults.status)}>
                      {t(`savings.savingsGoals.results.${savingsGoalResults.status}`)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(savingsGoalResults.targetAmount)}</div>
                      <div className="text-sm text-gray-600">{t('savings.savingsGoals.targetAmount')}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(savingsGoalResults.currentSaved)}</div>
                      <div className="text-sm text-gray-600">{t('savings.savingsGoals.currentSaved')}</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{savingsGoalResults.monthsToGoal}</div>
                      <div className="text-sm text-gray-600">
                        {savingsGoalResults.monthsToGoal > 12 
                          ? `${Math.floor(savingsGoalResults.monthsToGoal / 12)} ${t('savings.savingsGoals.results.years')}, ${savingsGoalResults.monthsToGoal % 12} ${t('savings.savingsGoals.results.months')}`
                          : `${t('savings.savingsGoals.results.timeToGoal')}`
                        }
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{formatCurrency(savingsGoalResults.monthlySavingsNeeded)}</div>
                      <div className="text-sm text-gray-600">{t('savings.savingsGoals.results.monthlyRequired')}</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{t('savings.savingsGoals.results.progress')}</span>
                      <span className="text-sm text-gray-600">{savingsGoalResults.progressPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={savingsGoalResults.progressPercentage} className="h-3" />
                  </div>

                  {savingsGoalResults.projectedCompletion && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">{t('savings.savingsGoals.results.projectedCompletion')}</div>
                      <div className="font-medium text-gray-800">
                        {formatFns(savingsGoalResults.projectedCompletion, 'MMMM yyyy')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Health Score */}
        <TabsContent value="financialHealth" className="space-y-6">
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Heart className="w-6 h-6" />
                {t('savings.financialHealth.title')}
              </CardTitle>
              <CardDescription className="text-red-700">
                {t('savings.financialHealth.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={calculateFinancialHealth} 
                disabled={isCalculatingHealthScore}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isCalculatingHealthScore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('savings.financialHealth.calculating')}
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    {t('savings.financialHealth.calculate')}
                  </>
                )}
              </Button>

              {financialHealthScore && (
                <div className="mt-6 p-6 bg-white rounded-lg border border-red-200 shadow-sm">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {getScoreIcon(financialHealthScore.scoreCategory)}
                      <div>
                        <div className="text-4xl font-bold text-gray-800">{financialHealthScore.totalScore}</div>
                        <div className="text-lg text-gray-600">{t('savings.financialHealth.outOf')}</div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(financialHealthScore.scoreCategory)}>
                      {t(`savings.financialHealth.scoreRanges.${financialHealthScore.scoreCategory}`)}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      {t(`savings.financialHealth.scoreRanges.${financialHealthScore.scoreCategory}Description`)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    {Object.entries(financialHealthScore.breakdown).map(([category, score]) => (
                      <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-800">{score}/25</div>
                        <div className="text-xs text-gray-600">{t(`savings.financialHealth.categories.${category}`)}</div>
                      </div>
                    ))}
                  </div>

                  {financialHealthScore.recommendations.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">{t('savings.financialHealth.recommendations.title')}</h4>
                      <div className="space-y-2 text-sm">
                        {financialHealthScore.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                            <span className="text-red-700">{t(`savings.financialHealth.recommendations.${recommendation}`)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compound Interest Calculator */}
        <TabsContent value="compoundInterest" className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Zap className="w-6 h-6" />
                {t('savings.compoundInterest.title')}
              </CardTitle>
              <CardDescription className="text-indigo-700">
                {t('savings.compoundInterest.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialAmount">{t('savings.compoundInterest.initialAmount')} *</Label>
                  <Input
                    id="initialAmount"
                    type="number"
                    placeholder={t('savings.compoundInterest.initialAmountPlaceholder')}
                    value={compoundInterestForm.initialAmount}
                    onChange={(e) => setCompoundInterestForm(prev => ({ ...prev, initialAmount: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyContribution">{t('savings.compoundInterest.monthlyContribution')}</Label>
                  <Input
                    id="monthlyContribution"
                    type="number"
                    placeholder={t('savings.compoundInterest.monthlyContributionPlaceholder')}
                    value={compoundInterestForm.monthlyContribution}
                    onChange={(e) => setCompoundInterestForm(prev => ({ ...prev, monthlyContribution: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualReturn">{t('savings.compoundInterest.annualReturn')} *</Label>
                  <Input
                    id="annualReturn"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    placeholder={t('savings.compoundInterest.annualReturnPlaceholder')}
                    value={compoundInterestForm.annualReturn}
                    onChange={(e) => setCompoundInterestForm(prev => ({ ...prev, annualReturn: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeHorizon">{t('savings.compoundInterest.timeHorizon')} *</Label>
                  <Input
                    id="timeHorizon"
                    type="number"
                    min="1"
                    max="50"
                    placeholder={t('savings.compoundInterest.timeHorizonPlaceholder')}
                    value={compoundInterestForm.timeHorizon}
                    onChange={(e) => setCompoundInterestForm(prev => ({ ...prev, timeHorizon: e.target.value }))}
                    className={isRTLLayout ? 'text-right' : 'text-left'}
                  />
                </div>
              </div>
              
              <Button 
                onClick={calculateCompoundInterest}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                {t('savings.compoundInterest.calculate')}
              </Button>

              {compoundInterestResults && (
                <div className="mt-6 space-y-6">
                  <div className="p-6 bg-white rounded-lg border border-indigo-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('savings.compoundInterest.results.title')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600">{formatCurrency(compoundInterestResults.finalAmount)}</div>
                        <div className="text-sm text-gray-600">{t('savings.compoundInterest.results.finalAmount')}</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(compoundInterestResults.totalContributions)}</div>
                        <div className="text-sm text-gray-600">{t('savings.compoundInterest.results.totalContributions')}</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(compoundInterestResults.totalInterest)}</div>
                        <div className="text-sm text-gray-600">{t('savings.compoundInterest.results.totalInterest')}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-800">{compoundInterestResults.breakevenYears.toFixed(1)} {t('common.years')}</div>
                        <div className="text-sm text-gray-600">{t('savings.compoundInterest.results.breakeven')}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-800">{compoundInterestResults.monthlyGrowth.toFixed(2)}%</div>
                        <div className="text-sm text-gray-600">{t('savings.compoundInterest.results.monthlyGrowth')}</div>
                      </div>
                    </div>
                  </div>

                  {compoundInterestChart.length > 0 && (
                    <div className="p-6 bg-white rounded-lg border border-indigo-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('savings.compoundInterest.chart.title')}</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={compoundInterestChart}>
                            <defs>
                              <linearGradient id="contributionsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                              </linearGradient>
                              <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(value) => formatCurrency(value).replace(/[₪$]/g, '')} tick={{ fontSize: 12 }} />
                            <Tooltip 
                              formatter={(value, name) => [formatCurrency(value), t(`savings.compoundInterest.chart.${name}`)]} 
                              labelFormatter={(label) => `${t('common.year')} ${label}`}
                            />
                            <Area
                              type="monotone"
                              dataKey="contributions"
                              stackId="1"
                              stroke="#3B82F6"
                              fill="url(#contributionsGradient)"
                              name="contributions"
                            />
                            <Area
                              type="monotone"
                              dataKey="interest"
                              stackId="1"
                              stroke="#10B981"
                              fill="url(#interestGradient)"
                              name="interest"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="font-medium text-indigo-800 mb-2">{t('savings.compoundInterest.tips.title')}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <strong>{t('savings.compoundInterest.tips.startEarly')}</strong>
                          <p className="text-gray-600">{t('savings.compoundInterest.tips.startEarlyDescription')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <strong>{t('savings.compoundInterest.tips.consistentInvesting')}</strong>
                          <p className="text-gray-600">{t('savings.compoundInterest.tips.consistentInvestingDescription')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <strong>{t('savings.compoundInterest.tips.longTermThinking')}</strong>
                          <p className="text-gray-600">{t('savings.compoundInterest.tips.longTermThinkingDescription')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
