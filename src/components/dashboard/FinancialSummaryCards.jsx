import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency } from '@/components/utils/i18n';
import { t } from '@/components/utils/i18n';
import { useUserPreferences } from '@/components/utils/UserPreferencesContext';

const FinancialSummaryCards = ({ 
  totalIncome = 0, 
  totalExpenses = 0, 
  netBalance = 0,
  previousMonthIncome = 0,
  previousMonthExpenses = 0,
  isLoading = false,
  className = "" 
}) => {
  const { preferences } = useUserPreferences();
  
  const incomeChange = previousMonthIncome > 0 
    ? Math.round(((totalIncome - previousMonthIncome) / previousMonthIncome) * 100) 
    : 0;
  
  const expenseChange = previousMonthExpenses > 0 
    ? Math.round(((totalExpenses - previousMonthExpenses) / previousMonthExpenses) * 100) 
    : 0;

  const isPositiveBalance = netBalance >= 0;

  if (isLoading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="bg-white border-gray-200 animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-16 bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {/* Total Income Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">
            {t('dashboard.totalIncome')}
          </CardTitle>
          <ArrowUpCircle className="h-8 w-8 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-800">
            {formatCurrency(totalIncome, preferences?.displayCurrency || 'ILS')}
          </div>
          {incomeChange !== 0 && (
            <p className="text-xs text-green-600 flex items-center mt-1">
              {incomeChange > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(incomeChange)}% {t('dashboard.fromLastPeriod')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total Expenses Card */}
      <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-700">
            {t('dashboard.totalExpenses')}
          </CardTitle>
          <ArrowDownCircle className="h-8 w-8 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-800">
            {formatCurrency(totalExpenses, preferences?.displayCurrency || 'ILS')}
          </div>
          {expenseChange !== 0 && (
            <p className="text-xs text-red-600 flex items-center mt-1">
              {expenseChange > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(expenseChange)}% {t('dashboard.fromLastPeriod')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Net Balance Card */}
      <Card className={`bg-gradient-to-br ${isPositiveBalance 
        ? 'from-blue-50 to-indigo-50 border-blue-200' 
        : 'from-orange-50 to-amber-50 border-orange-200'
      } hover:shadow-lg transition-shadow`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${isPositiveBalance 
            ? 'text-blue-700' 
            : 'text-orange-700'
          }`}>
            {t('dashboard.netBalance')}
          </CardTitle>
          <PiggyBank className={`h-8 w-8 ${isPositiveBalance 
            ? 'text-blue-600' 
            : 'text-orange-600'
          }`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositiveBalance 
            ? 'text-blue-800' 
            : 'text-orange-800'
          }`}>
            {formatCurrency(netBalance, preferences?.displayCurrency || 'ILS')}
          </div>
          <p className={`text-xs ${isPositiveBalance 
            ? 'text-blue-600' 
            : 'text-orange-600'
          } mt-1`}>
            {isPositiveBalance 
              ? t('dashboard.surplus') 
              : t('dashboard.deficit')
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummaryCards;