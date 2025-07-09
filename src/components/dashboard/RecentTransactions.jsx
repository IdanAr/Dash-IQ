
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t, formatCurrency, formatDate, isRTL, truncateText } from "@/components/utils/i18n";
import { IconRenderer } from '@/components/utils/icons';
import { Receipt } from 'lucide-react';

export default function RecentTransactions({
  transactions = [],
  categories = [],
  title,
  maxItems = 5,
  onTransactionClick,
  filterCategory = null,
  showFilters = false
}) {
  const [showAll, setShowAll] = useState(false);
  const isRTLLayout = isRTL();

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : t('common.uncategorized');
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filterCategory) {
      return sortedTransactions.filter(
        (transaction) => transaction.category_id === filterCategory.id
      );
    }
    return sortedTransactions;
  }, [sortedTransactions, filterCategory]);

  const displayedTransactions = useMemo(() => {
    return showAll ? filteredTransactions : filteredTransactions.slice(0, maxItems);
  }, [showAll, filteredTransactions, maxItems]);

  const displayTitle = title || t('dashboard.recentTransactions');

  const EmptyState = () => (
    <div className="text-center py-8 text-gray-500">
      <div className="mb-3">
        <Receipt className="w-12 h-12 mx-auto text-gray-300" />
      </div>
      <p className="text-sm font-medium">{t('transactions.noTransactionsFound')}</p>
      <p className="text-xs text-gray-400 mt-1">{t('dashboard.noTransactionData')}</p>
    </div>
  );

  return (
    <Card className="h-full flex flex-col bg-white/70 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100/50 p-4 md:p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
            <Receipt className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            {displayTitle}
          </CardTitle>
          {filteredTransactions.length > maxItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-700 text-xs py-1 px-2 h-auto"
            >
              {showAll ? t('common.showLess') : t('common.showMore')}
            </Button>
          )}
        </div>
        {filterCategory && (
          <CardDescription className="text-xs md:text-sm text-gray-600 font-medium mt-1">
            {t('dashboard.transactionsFor')}: <span className="font-medium">{filterCategory.name}</span>
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {filteredTransactions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden p-4 md:p-5">
            {/* Updated headers with proper translations */}
            <div className={`grid grid-cols-4 gap-3 pb-2 mb-3 border-b border-gray-100 text-xs font-medium text-gray-600 ${isRTLLayout ? 'text-right' : ''}`}>
              <div>{t('transactions.date')}</div>
              <div>{t('transactions.businessName')}</div>
              <div>{t('transactions.category')}</div>
              <div className="text-right">{t('transactions.billingAmount')}</div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {displayedTransactions.map((transaction, index) => {
                const category = categories.find(c => c.id === transaction.category_id);
                return (
                  <div
                    key={transaction.id || index}
                    className={`grid grid-cols-4 gap-3 py-2 px-2 rounded-lg text-sm hover:bg-gray-50 transition-colors ${
                      onTransactionClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onTransactionClick?.(transaction)}
                  >
                    <div className="text-gray-600 text-xs whitespace-nowrap">
                      {formatDate(transaction.date, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-gray-900 font-medium truncate" title={transaction.business_name}>
                      {truncateText(transaction.business_name, 15)}
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {category ? (
                        <Badge
                            variant="outline"
                            className="flex items-center gap-1.5 py-0.5 px-2 border-gray-300/70 bg-white text-gray-600"
                        >
                          <IconRenderer
                            iconName={category.icon || 'HelpCircle'}
                            size={12}
                            className="text-gray-500"
                          />
                          <span className="text-xs text-gray-700 truncate" title={getCategoryName(transaction.category_id)}>
                            {truncateText(getCategoryName(transaction.category_id), 12)}
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">{t('common.uncategorized')}</span>
                      )}
                    </div>
                    <div
                      className={`text-right font-bold text-sm whitespace-nowrap ${
                        transaction.is_income ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.is_income ? '+' : '-'}
                      {formatCurrency(transaction.billing_amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
