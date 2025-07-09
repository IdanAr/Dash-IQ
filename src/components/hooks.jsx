import { useState, useEffect, useMemo } from 'react';
import { Transaction, Category, Budget } from '@/api/entities';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from 'date-fns';

// Custom hook for financial data management
export const useFinancialData = (options = {}) => {
  const {
    autoLoad = true,
    includeBudgets = false,
    dateRange = null,
    refreshInterval = null
  } = options;

  const [data, setData] = useState({
    transactions: [],
    categories: [],
    budgets: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const loadData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [transactions, categories, budgets] = await Promise.all([
        Transaction.list('-date'),
        Category.list(),
        includeBudgets ? Budget.list() : Promise.resolve([])
      ]);

      let filteredTransactions = transactions;
      
      // Apply date range filter if provided
      if (dateRange && dateRange.start && dateRange.end) {
        filteredTransactions = transactions.filter(t => {
          const transactionDate = parseISO(t.date);
          return isWithinInterval(transactionDate, {
            start: parseISO(dateRange.start),
            end: parseISO(dateRange.end)
          });
        });
      }

      setData({
        transactions: filteredTransactions,
        categories,
        budgets,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error loading financial data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad]);

  // Set up refresh interval if provided
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Computed values
  const computedData = useMemo(() => {
    const { transactions, categories } = data;
    
    if (!transactions.length) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        categoryBreakdown: [],
        monthlyTrends: []
      };
    }

    const categoryMap = categories.reduce((map, cat) => {
      map[cat.id] = cat;
      return map;
    }, {});

    const totalIncome = transactions
      .filter(t => t.is_income)
      .reduce((sum, t) => sum + (t.billing_amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => !t.is_income)
      .reduce((sum, t) => sum + (t.billing_amount || 0), 0);

    const netBalance = totalIncome - totalExpenses;

    // Category breakdown
    const categoryTotals = {};
    transactions.forEach(t => {
      const categoryId = t.category_id;
      const categoryName = categoryMap[categoryId]?.name || 'Uncategorized';
      const amount = t.billing_amount || 0;
      
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = {
          name: categoryName,
          income: 0,
          expenses: 0,
          total: 0,
          count: 0
        };
      }
      
      if (t.is_income) {
        categoryTotals[categoryName].income += amount;
      } else {
        categoryTotals[categoryName].expenses += amount;
      }
      
      categoryTotals[categoryName].total += amount;
      categoryTotals[categoryName].count++;
    });

    const categoryBreakdown = Object.values(categoryTotals)
      .sort((a, b) => b.total - a.total);

    // Monthly trends
    const monthlyData = {};
    transactions.forEach(t => {
      const monthKey = format(parseISO(t.date), 'yyyy-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, month: monthKey };
      }
      
      if (t.is_income) {
        monthlyData[monthKey].income += t.billing_amount || 0;
      } else {
        monthlyData[monthKey].expenses += t.billing_amount || 0;
      }
    });

    const monthlyTrends = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        balance: m.income - m.expenses
      }));

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      categoryBreakdown,
      monthlyTrends
    };
  }, [data.transactions, data.categories]);

  return {
    ...data,
    ...computedData,
    refresh: loadData
  };
};

// Custom hook for budget tracking
export const useBudgetTracking = (categoryId = null) => {
  const [budgetData, setBudgetData] = useState({
    budgets: [],
    spending: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadBudgetData = async () => {
      try {
        setBudgetData(prev => ({ ...prev, loading: true }));

        const [budgets, transactions] = await Promise.all([
          Budget.list(),
          Transaction.list()
        ]);

        // Filter budgets if categoryId provided
        const filteredBudgets = categoryId 
          ? budgets.filter(b => b.category_id === categoryId)
          : budgets;

        // Calculate current month spending for each budget
        const currentMonth = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        
        const currentMonthTransactions = transactions.filter(t => {
          const transactionDate = parseISO(t.date);
          return isWithinInterval(transactionDate, {
            start: currentMonth,
            end: currentMonthEnd
          }) && !t.is_income;
        });

        const spending = {};
        filteredBudgets.forEach(budget => {
          const categorySpending = currentMonthTransactions
            .filter(t => t.category_id === budget.category_id)
            .reduce((sum, t) => sum + (t.billing_amount || 0), 0);
          
          spending[budget.category_id] = {
            budgeted: budget.amount,
            spent: categorySpending,
            remaining: budget.amount - categorySpending,
            percentage: budget.amount > 0 ? (categorySpending / budget.amount) * 100 : 0
          };
        });

        setBudgetData({
          budgets: filteredBudgets,
          spending,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error loading budget data:', error);
        setBudgetData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    loadBudgetData();
  }, [categoryId]);

  return budgetData;
};

// Custom hook for transaction filtering and searching
export const useTransactionFilters = (transactions = []) => {
  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    dateRange: null,
    type: 'all', // 'all', 'income', 'expenses'
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.business_name?.toLowerCase().includes(searchLower) ||
        t.details?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(t => 
        filters.categories.includes(t.category_id)
      );
    }

    // Type filter
    if (filters.type === 'income') {
      filtered = filtered.filter(t => t.is_income);
    } else if (filters.type === 'expenses') {
      filtered = filtered.filter(t => !t.is_income);
    }

    // Date range filter
    if (filters.dateRange?.start && filters.dateRange?.end) {
      filtered = filtered.filter(t => {
        const transactionDate = parseISO(t.date);
        return isWithinInterval(transactionDate, {
          start: parseISO(filters.dateRange.start),
          end: parseISO(filters.dateRange.end)
        });
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (filters.sortBy) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'amount':
          aVal = a.billing_amount || 0;
          bVal = b.billing_amount || 0;
          break;
        case 'business':
          aVal = a.business_name || '';
          bVal = b.business_name || '';
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    return filtered;
  }, [transactions, filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      categories: [],
      dateRange: null,
      type: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  return {
    filters,
    filteredTransactions,
    updateFilter,
    resetFilters,
    totalCount: transactions.length,
    filteredCount: filteredTransactions.length
  };
};

export default useFinancialData;