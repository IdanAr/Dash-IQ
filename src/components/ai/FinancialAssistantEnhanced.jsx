import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Loader2, Brain, MessageSquare, TrendingUp, DollarSign, Calendar, BarChart3, X, Copy, Trash2, Star, BookOpen, Lightbulb, HelpCircle } from 'lucide-react';
import { Transaction, Category, Budget, FinancialQuery } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { t, formatCurrency, formatDate, getCurrentLanguage } from '@/components/utils/i18n';
import { debounce } from '@/components/utils';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import MessageRenderer from './MessageRenderer';

// Moved from components/ai/utils/languageDetection.js
const detectLanguage = (text) => {
  if (!text || typeof text !== 'string') return 'en';
  
  const hebrewPattern = /[\u0590-\u05FF]/;
  const arabicPattern = /[\u0600-\u06FF]/;
  const englishPattern = /[a-zA-Z]/;
  
  if (hebrewPattern.test(text)) return 'he';
  if (arabicPattern.test(text)) return 'ar';
  if (englishPattern.test(text)) return 'en';
  
  return getCurrentLanguage() || 'en';
};

// Moved from components/ai/utils/nativeQueries.js
const executeNativeQuery = async (intent, entities, timeframe) => {
  try {
    let transactions = [];
    let categories = [];
    let budgets = [];

    // Load data based on intent
    if (['spending_analysis', 'transaction_count', 'category_summary', 'business_summary', 'trend_analysis'].includes(intent)) {
      transactions = await Transaction.list();
      categories = await Category.list();
    }
    
    if (['budget_status', 'budget_check'].includes(intent)) {
      budgets = await Budget.list();
      categories = await Category.list();
      transactions = await Transaction.list();
    }

    // Apply time filtering
    if (timeframe && transactions.length > 0) {
      const now = new Date();
      let startDate, endDate;

      switch (timeframe) {
        case 'this_month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'last_month':
          const lastMonth = subMonths(now, 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          break;
        case 'last_3_months':
          startDate = startOfMonth(subMonths(now, 3));
          endDate = endOfMonth(now);
          break;
        default:
          startDate = null;
          endDate = null;
      }

      if (startDate && endDate) {
        transactions = transactions.filter(t => {
          const transactionDate = parseISO(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      }
    }

    // Execute query based on intent
    switch (intent) {
      case 'spending_analysis':
        return analyzeSpending(transactions, categories, entities);
      case 'budget_status':
        return analyzeBudgetStatus(budgets, transactions, categories);
      case 'trend_analysis':
        return analyzeTrends(transactions, categories, timeframe);
      case 'category_summary':
        return summarizeCategories(transactions, categories, entities);
      case 'business_summary':
        return summarizeBusinesses(transactions, entities);
      case 'transaction_count':
        return countTransactions(transactions, entities, timeframe);
      default:
        return { error: 'Unsupported query type' };
    }
  } catch (error) {
    console.error('Error executing native query:', error);
    return { error: 'Failed to execute query' };
  }
};

// Query analysis functions
const analyzeSpending = (transactions, categories, entities) => {
  const expenses = transactions.filter(t => !t.is_income);
  const totalSpent = expenses.reduce((sum, t) => sum + (t.billing_amount || 0), 0);
  
  const categoryMap = categories.reduce((map, cat) => {
    map[cat.id] = cat;
    return map;
  }, {});

  const categorySpending = expenses.reduce((acc, t) => {
    const categoryId = t.category_id;
    const categoryName = categoryMap[categoryId]?.name || 'Uncategorized';
    acc[categoryName] = (acc[categoryName] || 0) + (t.billing_amount || 0);
    return acc;
  }, {});

  const topCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return {
    totalSpent,
    transactionCount: expenses.length,
    topCategories: topCategories.map(([name, amount]) => ({ name, amount })),
    categoryBreakdown: categorySpending
  };
};

const analyzeBudgetStatus = (budgets, transactions, categories) => {
  const categoryMap = categories.reduce((map, cat) => {
    map[cat.id] = cat;
    return map;
  }, {});

  const currentMonth = startOfMonth(new Date());
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = parseISO(t.date);
    return transactionDate >= currentMonth;
  });

  const budgetStatus = budgets.map(budget => {
    const categoryName = categoryMap[budget.category_id]?.name || 'Unknown';
    const spent = currentMonthTransactions
      .filter(t => t.category_id === budget.category_id && !t.is_income)
      .reduce((sum, t) => sum + (t.billing_amount || 0), 0);
    
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    return {
      categoryName,
      budgeted: budget.amount,
      spent,
      remaining: budget.amount - spent,
      percentage: Math.round(percentage),
      status: percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'good'
    };
  });

  return { budgetStatus };
};

const analyzeTrends = (transactions, categories, timeframe) => {
  const monthlyData = {};
  
  transactions.forEach(t => {
    const date = parseISO(t.date);
    const monthKey = format(date, 'yyyy-MM');
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    if (t.is_income) {
      monthlyData[monthKey].income += t.billing_amount || 0;
    } else {
      monthlyData[monthKey].expenses += t.billing_amount || 0;
    }
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const trends = sortedMonths.map(month => ({
    month,
    ...monthlyData[month],
    balance: monthlyData[month].income - monthlyData[month].expenses
  }));

  return { trends };
};

const summarizeCategories = (transactions, categories, entities) => {
  const categoryMap = categories.reduce((map, cat) => {
    map[cat.id] = cat;
    return map;
  }, {});

  const categorySummary = categories.map(category => {
    const categoryTransactions = transactions.filter(t => t.category_id === category.id);
    const totalAmount = categoryTransactions.reduce((sum, t) => sum + (t.billing_amount || 0), 0);
    
    return {
      name: category.name,
      type: category.type,
      transactionCount: categoryTransactions.length,
      totalAmount,
      averageAmount: categoryTransactions.length > 0 ? totalAmount / categoryTransactions.length : 0
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  return { categorySummary };
};

const summarizeBusinesses = (transactions, entities) => {
  const businessSummary = {};
  
  transactions.forEach(t => {
    const businessName = t.business_name || 'Unknown';
    if (!businessSummary[businessName]) {
      businessSummary[businessName] = {
        name: businessName,
        transactionCount: 0,
        totalAmount: 0,
        isIncome: t.is_income
      };
    }
    
    businessSummary[businessName].transactionCount++;
    businessSummary[businessName].totalAmount += t.billing_amount || 0;
  });

  const topBusinesses = Object.values(businessSummary)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);

  return { topBusinesses };
};

const countTransactions = (transactions, entities, timeframe) => {
  const totalCount = transactions.length;
  const incomeCount = transactions.filter(t => t.is_income).length;
  const expenseCount = transactions.filter(t => !t.is_income).length;
  
  return {
    totalCount,
    incomeCount,
    expenseCount,
    timeframe: timeframe || 'all_time'
  };
};

// Moved from components/ai/utils/intentAnalysis.js
const analyzeIntent = (question) => {
  const lowerQuestion = question.toLowerCase();
  
  // Hebrew patterns
  const hebrewPatterns = {
    spending_analysis: ['הוצאות', 'הוצאה', 'בזבזתי', 'הוצאתי', 'מוציא', 'הוצא'],
    budget_status: ['תקציב', 'בתקציב', 'חרגתי', 'חריגה'],
    trend_analysis: ['מגמה', 'מגמות', 'משתנה', 'עולה', 'יורד'],
    category_summary: ['קטגוריה', 'קטגוריות', 'סיווג'],
    business_summary: ['עסק', 'עסקים', 'חנות', 'מקום'],
    transaction_count: ['כמה', 'מספר', 'סך', 'סכום'],
  };

  // English patterns
  const englishPatterns = {
    spending_analysis: ['spend', 'spent', 'expense', 'expenses', 'cost', 'money'],
    budget_status: ['budget', 'budgets', 'over budget', 'under budget'],
    trend_analysis: ['trend', 'trends', 'changing', 'increase', 'decrease'],
    category_summary: ['category', 'categories', 'type', 'types'],
    business_summary: ['business', 'businesses', 'store', 'shop', 'place'],
    transaction_count: ['how many', 'count', 'number', 'total'],
  };

  // Time patterns
  const timePatterns = {
    this_month: ['החודש', 'חודש זה', 'this month', 'current month'],
    last_month: ['חודש שעבר', 'החודש הקודם', 'last month', 'previous month'],
    last_3_months: ['3 חודשים', 'שלושה חודשים', '3 months', 'three months', 'quarter'],
  };

  // Entity patterns (categories, businesses)
  const entityPatterns = {
    categories: ['מזון', 'תחבורה', 'בילויים', 'food', 'transport', 'entertainment'],
    businesses: ['סופר', 'דלק', 'מסעדה', 'supermarket', 'gas', 'restaurant'],
  };

  // Detect intent
  let detectedIntent = 'general_info';
  let confidence = 0;

  for (const [intent, patterns] of Object.entries({...hebrewPatterns, ...englishPatterns})) {
    const matchCount = patterns.filter(pattern => lowerQuestion.includes(pattern)).length;
    const intentConfidence = matchCount / patterns.length;
    
    if (intentConfidence > confidence) {
      confidence = intentConfidence;
      detectedIntent = intent;
    }
  }

  // Detect timeframe
  let timeframe = null;
  for (const [time, patterns] of Object.entries(timePatterns)) {
    if (patterns.some(pattern => lowerQuestion.includes(pattern))) {
      timeframe = time;
      break;
    }
  }

  // Detect entities
  const entities = [];
  for (const [entityType, patterns] of Object.entries(entityPatterns)) {
    const matchedEntities = patterns.filter(pattern => lowerQuestion.includes(pattern));
    entities.push(...matchedEntities.map(entity => ({ type: entityType, value: entity })));
  }

  return {
    intent: detectedIntent,
    confidence,
    timeframe,
    entities,
    language: detectLanguage(question)
  };
};

// Moved from components/ai/utils/responseGeneration.js
const generateResponse = (queryResult, intent, language = 'he') => {
  try {
    switch (intent) {
      case 'spending_analysis':
        return generateSpendingResponse(queryResult, language);
      case 'budget_status':
        return generateBudgetResponse(queryResult, language);
      case 'trend_analysis':
        return generateTrendResponse(queryResult, language);
      case 'category_summary':
        return generateCategoryResponse(queryResult, language);
      case 'business_summary':
        return generateBusinessResponse(queryResult, language);
      case 'transaction_count':
        return generateCountResponse(queryResult, language);
      default:
        return language === 'he' 
          ? 'מצטער, לא הצלחתי להבין את השאלה. אנא נסח אותה מחדש.'
          : 'Sorry, I couldn\'t understand the question. Please rephrase it.';
    }
  } catch (error) {
    console.error('Error generating response:', error);
    return language === 'he' 
      ? 'אירעה שגיאה בעיבוד השאלה.'
      : 'An error occurred while processing the question.';
  }
};

const generateSpendingResponse = (result, language) => {
  if (result.error) {
    return language === 'he' ? 'לא נמצאו נתוני הוצאות.' : 'No spending data found.';
  }

  const { totalSpent, transactionCount, topCategories } = result;
  const topCategoriesText = topCategories
    .map(cat => `${cat.name}: ${formatCurrency(cat.amount)}`)
    .join(', ');

  return language === 'he' 
    ? `סך ההוצאות שלך: ${formatCurrency(totalSpent)} ב-${transactionCount} עסקאות. 
       הקטגוריות המובילות: ${topCategoriesText}`
    : `Your total spending: ${formatCurrency(totalSpent)} across ${transactionCount} transactions. 
       Top categories: ${topCategoriesText}`;
};

const generateBudgetResponse = (result, language) => {
  if (result.error || !result.budgetStatus?.length) {
    return language === 'he' ? 'לא נמצאו נתוני תקציב.' : 'No budget data found.';
  }

  const overBudget = result.budgetStatus.filter(b => b.status === 'over');
  const warnings = result.budgetStatus.filter(b => b.status === 'warning');

  let response = language === 'he' ? 'סטטוס התקציב שלך:\n' : 'Your budget status:\n';

  if (overBudget.length > 0) {
    const overText = overBudget.map(b => 
      `${b.categoryName}: חרגת ב-${formatCurrency(Math.abs(b.remaining))}`
    ).join('\n');
    response += language === 'he' 
      ? `🔴 חריגות תקציב:\n${overText}\n`
      : `🔴 Over budget:\n${overText}\n`;
  }

  if (warnings.length > 0) {
    const warningText = warnings.map(b => 
      `${b.categoryName}: ${b.percentage}% מהתקציב`
    ).join('\n');
    response += language === 'he' 
      ? `🟡 התראות:\n${warningText}`
      : `🟡 Warnings:\n${warningText}`;
  }

  return response;
};

const generateTrendResponse = (result, language) => {
  if (result.error || !result.trends?.length) {
    return language === 'he' ? 'לא נמצאו נתוני מגמות.' : 'No trend data found.';
  }

  const trends = result.trends.slice(-3); // Last 3 months
  const trendsText = trends.map(t => 
    `${t.month}: הכנסות ${formatCurrency(t.income)}, הוצאות ${formatCurrency(t.expenses)}`
  ).join('\n');

  return language === 'he' 
    ? `מגמות חודשיות אחרונות:\n${trendsText}`
    : `Recent monthly trends:\n${trendsText}`;
};

const generateCategoryResponse = (result, language) => {
  if (result.error || !result.categorySummary?.length) {
    return language === 'he' ? 'לא נמצאו נתוני קטגוריות.' : 'No category data found.';
  }

  const top5 = result.categorySummary.slice(0, 5);
  const categoriesText = top5.map(cat => 
    `${cat.name}: ${formatCurrency(cat.totalAmount)} (${cat.transactionCount} עסקאות)`
  ).join('\n');

  return language === 'he' 
    ? `סיכום קטגוריות מובילות:\n${categoriesText}`
    : `Top categories summary:\n${categoriesText}`;
};

const generateBusinessResponse = (result, language) => {
  if (result.error || !result.topBusinesses?.length) {
    return language === 'he' ? 'לא נמצאו נתוני עסקים.' : 'No business data found.';
  }

  const top5 = result.topBusinesses.slice(0, 5);
  const businessText = top5.map(biz => 
    `${biz.name}: ${formatCurrency(biz.totalAmount)} (${biz.transactionCount} עסקאות)`
  ).join('\n');

  return language === 'he' 
    ? `עסקים מובילים:\n${businessText}`
    : `Top businesses:\n${businessText}`;
};

const generateCountResponse = (result, language) => {
  if (result.error) {
    return language === 'he' ? 'לא נמצאו נתוני עסקאות.' : 'No transaction data found.';
  }

  const { totalCount, incomeCount, expenseCount } = result;

  return language === 'he' 
    ? `סה"כ עסקאות: ${totalCount} (הכנסות: ${incomeCount}, הוצאות: ${expenseCount})`
    : `Total transactions: ${totalCount} (Income: ${incomeCount}, Expenses: ${expenseCount})`;
};

const FinancialAssistantEnhanced = ({
  isOpen,
  onClose,
  className = ""
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedQueries, setSavedQueries] = useState([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentLanguage = getCurrentLanguage();
  const isRTL = currentLanguage === 'he';

  // Predefined suggested questions
  const defaultSuggestedQuestions = useMemo(() => {
    return currentLanguage === 'he' ? [
      "כמה הוצאתי החודש?",
      "מה הקטגוריות עם ההוצאות הגבוהות ביותר?",
      "איך נראה התקציב שלי?",
      "מה המגמה בהוצאות שלי?",
      "איפה אני מוציא הכי הרבה כסף?",
      "כמה עסקאות יש לי החודש?"
    ] : [
      "How much did I spend this month?",
      "What are my top spending categories?",
      "How is my budget looking?",
      "What's the trend in my expenses?",
      "Where do I spend the most money?",
      "How many transactions do I have this month?"
    ];
  }, [currentLanguage]);

  // Load saved queries and suggested questions on mount
  useEffect(() => {
    loadSavedQueries();
    setSuggestedQuestions(defaultSuggestedQuestions);
  }, [defaultSuggestedQuestions]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSavedQueries = async () => {
    try {
      const queries = await FinancialQuery.list('-created_date', 10);
      setSavedQueries(queries || []);
    } catch (error) {
      console.error('Error loading saved queries:', error);
    }
  };

  const handleSendMessage = useCallback(async (message = inputValue.trim()) => {
    if (!message || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Analyze the question
      const analysis = analyzeIntent(message);

      let response;
      if (analysis.confidence > 0.3) {
        // Use native query processing for high confidence
        const queryResult = await executeNativeQuery(analysis.intent, analysis.entities, analysis.timeframe);
        response = generateResponse(queryResult, analysis.intent, analysis.language);
      } else {
        // Fallback to LLM for complex queries
        response = await processWithLLM(message);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        queryType: analysis.intent,
        confidence: analysis.confidence
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save successful query
      if (response && !response.includes('שגיאה') && !response.includes('error')) {
        try {
          await FinancialQuery.create({
            question: message,
            answer: response,
            query_type: analysis.intent || 'general',
            data_context: {
              confidence: analysis.confidence,
              timeframe: analysis.timeframe,
              entities: analysis.entities
            },
            response_time_ms: Date.now() - userMessage.id
          });
        } catch (saveError) {
          console.error('Error saving query:', saveError);
        }
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: currentLanguage === 'he' 
          ? 'מצטער, אירעה שגיאה בעיבוד השאלה. אנא נסה שוב.'
          : 'Sorry, an error occurred while processing your question. Please try again.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: t('aiAssistant.errorMessage'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [inputValue, isProcessing, currentLanguage, toast]);

  const processWithLLM = async (question) => {
    // This would typically call your LLM integration
    // For now, return a placeholder response
    return currentLanguage === 'he' 
      ? 'מצטער, שאלה זו מורכבת מדي לעיבוד כרגע. אנא נסח אותה בפשטות יותר.'
      : 'Sorry, this question is too complex to process right now. Please rephrase it more simply.';
  };

  const handleSuggestedQuestion = (question) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[80vh] p-0 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Brain className="w-6 h-6 text-blue-600" />
            {t('aiAssistant.title')}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('aiAssistant.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[600px]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-6 pt-0">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    {t('aiAssistant.welcomeMessage')}
                  </p>
                  
                  {/* Suggested Questions */}
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {t('aiAssistant.suggestedQuestions')}:
                    </h4>
                    <div className="grid gap-2">
                      {suggestedQuestions.slice(0, 4).map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="text-right justify-start h-auto p-3 text-sm"
                          onClick={() => handleSuggestedQuestion(question)}
                        >
                          <HelpCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <MessageRenderer key={message.id} message={message} />
              ))}
              
              {isProcessing && (
                <div className="flex items-center gap-2 text-gray-500 p-4 bg-gray-50 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('aiAssistant.processing')}
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('aiAssistant.placeholder')}
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isProcessing}
                size="icon"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
              {messages.length > 0 && (
                <Button
                  onClick={clearChat}
                  variant="outline"
                  size="icon"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialAssistantEnhanced;