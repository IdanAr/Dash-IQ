
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { truncateText } from '@/components/utils';
import { t, formatCurrency, formatDate, isRTL } from "@/components/utils/i18n";
import RecentTransactions from './RecentTransactions';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Receipt, DollarSign, TrendingUp, FolderOpen, PieChart as LucidePieChart } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function CategorySummaryReport({
  category,
  transactions,
  periodLabel
}) {
  const isRTLLayout = isRTL();

  const categoryTransactions = transactions.filter(t => t.category_id === category?.id);
  const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.billing_amount, 0);
  const transactionCount = categoryTransactions.length;
  const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;

  const businessSpending = categoryTransactions.reduce((acc, t) => {
    const name = truncateText(t.business_name, 20);
    acc[name] = (acc[name] || 0) + t.billing_amount;
    return acc;
  }, {});

  const topBusinesses = Object.entries(businessSpending)
    .map(([business, amount]) => ({ business, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (!category) {
    return (
      <Card className="h-64 flex items-center justify-center">
        <CardContent className="text-center">
          <div className="mb-4">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          </div>
          <p className="text-sm">{t('categoryReport.selectCategoryPrompt')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('categoryReport.totalExpenses')}</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('categoryReport.transactionCount')}</p>
                <p className="text-2xl font-bold text-green-600">{transactionCount}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('categoryReport.averagePerTransaction')}</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(averageAmount)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Businesses Pie Chart */}
      {topBusinesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucidePieChart className="w-5 h-5 text-indigo-600" />
              {t('categoryReport.topExpensesDistribution')}
            </CardTitle>
            <CardDescription>
              {t('categoryReport.topBusinessesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topBusinesses}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="business"
                    label={({ business, percent }) => `${business} ${(percent * 100).toFixed(0)}%`}
                  >
                    {topBusinesses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions for Category */}
      <RecentTransactions
        transactions={transactions.slice(0, 10)}
        categories={[category]}
        title={t('categoryReport.transactionsForCategory', { category: category.name })}
        maxItems={10}
      />
    </div>
  );
}
