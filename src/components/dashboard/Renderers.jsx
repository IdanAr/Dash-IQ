import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Bell,
  Info,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, isAfter, isBefore } from "date-fns";
import { CustomTooltip } from "@/components/dashboard/CustomTooltip";
import { truncateText } from "@/components/utils";

// Extract render functions from Dashboard to avoid duplication
export function renderCategoryDetails(selectedCategory, stats, budgets, categories, transactions, getDateRange, setSelectedCategory) {
  if (!selectedCategory) return null;
  
  const categoryData = stats.categorySummary.find(c => c.id === selectedCategory);
  if (!categoryData) return null;
  
  const { startDate, endDate } = getDateRange();
  
  // Get transactions for this category within the period
  const categoryTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return t.category_id === selectedCategory && 
           isAfter(transactionDate, startDate) && 
           isBefore(transactionDate, endDate);
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // If this is an expense category, check if it has a budget
  const categoryBudget = budgets.find(b => b.category_id === selectedCategory);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4" />
          חזרה ללוח
        </Button>
        <h2 className="text-lg font-bold">פירוט: {categoryData.name}</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>סיכום קטגוריה</CardTitle>
            <CardDescription>
              {categoryData.type === 'expense' ? 'הוצאות' : 'הכנסות'} בקטגוריה זו
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>סכום כולל:</span>
                <span className="font-bold">₪{categoryData.amount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span>מספר עסקאות:</span>
                <span className="font-bold">{categoryData.count}</span>
              </div>
              
              <div className="flex justify-between">
                <span>אחוז מסך {categoryData.type === 'expense' ? 'ההוצאות' : 'הכנסות'}:</span>
                <span className="font-bold">{categoryData.percentage}%</span>
              </div>
              
              {categoryBudget && (
                <>
                  <hr />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>תקציב:</span>
                      <span className="font-bold">₪{categoryBudget.amount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>ניצול:</span>
                      <span className={`font-bold ${categoryData.amount > categoryBudget.amount ? 'text-red-500' : 'text-green-500'}`}>
                        {((categoryData.amount / categoryBudget.amount) * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <Progress 
                      value={Math.min(((categoryData.amount / categoryBudget.amount) * 100), 100)} 
                      className={categoryData.amount > categoryBudget.amount ? 'bg-red-100' : ''}
                      indicatorClassName={categoryData.amount > categoryBudget.amount ? 'bg-red-500' : undefined}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Additional category details cards here */}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>עסקאות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryTransactions.length > 0 ? (
            <div className="rounded-md border">
              <table className="min-w-full divide-y">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">תאריך</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">בית עסק</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">סכום</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">פרטים</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {categoryTransactions.map(transaction => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {format(new Date(transaction.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {transaction.business_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        ₪{(transaction.billing_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {transaction.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              לא נמצאו עסקאות בקטגוריה זו
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function renderInsights(insightsStats, periodType, setViewMode, setPeriodType) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">תובנות כלכליות</h2>
        <div className="flex items-center gap-4">
          <Tabs value={periodType} onValueChange={setPeriodType}>
            <TabsList>
              <TabsTrigger value="week">שבוע</TabsTrigger>
              <TabsTrigger value="month">חודש</TabsTrigger>
              <TabsTrigger value="quarter">רבעון</TabsTrigger>
              <TabsTrigger value="year">שנה</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode("overview")}
            className="flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            חזרה ללוח
          </Button>
        </div>
      </div>
      
      {/* Monthly Trend */}
      {insightsStats.monthlyTrend && (
        <Card className={insightsStats.monthlyTrend.isIncrease ? 'border-red-200' : 'border-green-200'}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              {insightsStats.monthlyTrend.isIncrease ? (
                <TrendingUp className="w-5 h-5 text-red-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-500" />
              )}
              <span>
                {`שינוי בהוצאות ב${
                  periodType === "week" ? "שבוע" :
                  periodType === "month" ? "חודש" :
                  periodType === "quarter" ? "רבעון" :
                  "שנה"
                } הנוכחי`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">
              ההוצאות {insightsStats.monthlyTrend.isIncrease ? 'עלו' : 'ירדו'} ב-
              <span className={insightsStats.monthlyTrend.isIncrease ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                {Math.abs(insightsStats.monthlyTrend.changePercentage)}%
              </span> 
              {' '}בהשוואה לתקופה הקודמת
              (מ-₪{insightsStats.monthlyTrend.previousTotal.toLocaleString()} ל-₪{insightsStats.monthlyTrend.currentTotal.toLocaleString()})
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Over Budget Categories */}
      {insightsStats.overBudget.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>קטגוריות בחריגה מהתקציב</span>
            </CardTitle>
            <CardDescription>
              {periodType === "week" ? "תקציב שבועי = תקציב חודשי / 4" :
               periodType === "quarter" ? "תקציב רבעוני = תקציב חודשי × 3" :
               periodType === "year" ? "תקציב שנתי = תקציב חודשי × 12" :
               "תקציב חודשי"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insightsStats.overBudget.map((item, index) => (
                <div key={index} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{item.categoryName}</span>
                    <Badge variant="destructive">חריגה של {item.percentage}%</Badge>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>תקציב: ₪{item.budgeted.toLocaleString()}</span>
                    <span>בפועל: ₪{item.actual.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={Math.min(parseInt(item.percentage), 150)} 
                    className="bg-red-100"
                    indicatorClassName="bg-red-500"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Unusual Spending */}
      {insightsStats.unusualSpending.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>שינויים חריגים בהוצאות</span>
            </CardTitle>
            <CardDescription>
              השוואה בין {
                periodType === "week" ? "השבוע הנוכחי לשבוע הקודם" :
                periodType === "month" ? "החודש הנוכחי לחודש הקודם" :
                periodType === "quarter" ? "הרבעון הנוכחי לרבעון הקודם" :
                "השנה הנוכחית לשנה הקודמת"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insightsStats.unusualSpending.map((item, index) => (
                <div key={index} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{item.categoryName}</span>
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      עלייה של {item.increasePercentage}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {periodType === "week" ? "שבוע קודם: " :
                       periodType === "month" ? "חודש קודם: " :
                       periodType === "quarter" ? "רבעון קודם: " :
                       "שנה קודמת: "}
                      ₪{item.previousAmount.toLocaleString()}
                    </span>
                    <span>
                      {periodType === "week" ? "שבוע נוכחי: " :
                       periodType === "month" ? "חודש נוכחי: " :
                       periodType === "quarter" ? "רבעון נוכחי: " :
                       "שנה נוכחית: "}
                      ₪{item.currentAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* No insights available */}
      {!insightsStats.monthlyTrend && 
       insightsStats.overBudget.length === 0 && 
       insightsStats.unusualSpending.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Info className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">אין תובנות זמינות</h3>
            <p className="text-gray-500">
              תובנות יופיעו כאשר יהיו מספיק נתונים להשוואה בין תקופות וחריגות מתקציב
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}