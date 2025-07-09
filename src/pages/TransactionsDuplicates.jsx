import React, { useState, useEffect, useCallback } from "react";
import { Transaction } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  Copy 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { t, isRTL, formatCurrency, formatDate } from '@/components/utils/i18n';

export default function TransactionsDuplicates() {
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [currentStep, setCurrentStep] = useState('analyzing');
  const [progress, setProgress] = useState(0);
  const [actionMap, setActionMap] = useState({}); // Maps transaction ID to action
  const [isApplying, setIsApplying] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const isRTLLayout = isRTL();

  // Function to get confidence badge variant
  const getConfidenceBadgeVariant = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Check if there are any actions selected
  const hasActions = Object.values(actionMap).some(action => action !== 'keep');

  useEffect(() => {
    findDuplicates();
  }, []);

  const findDuplicates = async () => {
    setIsAnalyzing(true);
    setCurrentStep('analyzing');
    setProgress(0);

    try {
      // Simulate progress steps
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep('patterns');
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep('grouping');
      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get all transactions - exclude those marked as reviewed duplicates
      const transactions = await Transaction.list('-date', 5000);
      console.log(`Analyzing ${transactions.length} transactions for duplicates`);
      
      // Filter out transactions that were already reviewed as duplicates
      const unreviewedTransactions = transactions.filter(transaction => 
        !transaction.is_reviewed_duplicate
      );
      
      console.log(`After filtering reviewed duplicates: ${unreviewedTransactions.length} transactions`);
      
      const duplicateMap = new Map();
      
      unreviewedTransactions.forEach(transaction => {
        const date = formatDate(new Date(transaction.date), 'yyyy-MM-dd');
        const businessName = transaction.business_name?.toLowerCase().trim();
        const amount = parseFloat(transaction.billing_amount).toFixed(2);
        
        const key = `${date}|${businessName}|${amount}`;
        
        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, []);
        }
        duplicateMap.get(key).push(transaction);
      });
      
      const duplicateSetsFound = Array.from(duplicateMap.values())
        .filter(group => group.length > 1)
        .map((transactions, index) => ({
          id: `group_${index}`,
          transactions,
          confidence: 'high', // Since we're matching exact date, business, and amount
          reasons: ['exactMatch', 'dateProximity', 'amountMatch']
        }));
      
      console.log(`Found ${duplicateSetsFound.length} potential duplicate groups`);
      
      setDuplicateGroups(duplicateSetsFound);
      setProgress(100);
      
      if (duplicateSetsFound.length === 0) {
        toast({
          title: t('transactions.duplicates.noduplicatesFound'),
          description: t('transactions.duplicates.noduplicatesDescription'),
        });
      }
    } catch (error) {
      console.error("Error finding duplicates:", error);
      toast({
        title: t('common.error'),
        description: "שגיאה בחיפוש כפילויות",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setCurrentStep('analyzing');
      setProgress(0);
    }
  };

  const applyActions = async () => {
    if (!hasActions) {
      toast({
        title: t('common.warning'),
        description: "לא נבחרו פעולות לביצוע",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);

    try {
      const idsToDelete = [];
      const idsToMarkReviewed = [];

      Object.entries(actionMap).forEach(([transactionId, action]) => {
        if (action === 'delete') {
          idsToDelete.push(transactionId);
        } else if (action === 'reviewed') {
          idsToMarkReviewed.push(transactionId);
        }
      });

      // Delete transactions
      if (idsToDelete.length > 0) {
        const deletePromises = idsToDelete.map(id => Transaction.delete(id));
        await Promise.all(deletePromises);
      }
      
      // Mark as reviewed (update transactions with is_reviewed_duplicate flag)
      if (idsToMarkReviewed.length > 0) {
        const updatePromises = idsToMarkReviewed.map(async (id) => {
          const transactions = await Transaction.list();
          const transaction = transactions.find(t => t.id === id);
          if (transaction) {
            return Transaction.update(id, { 
              ...transaction, 
              is_reviewed_duplicate: true 
            });
          }
        });
        await Promise.all(updatePromises.filter(Boolean));
      }
      
      toast({
        title: t('common.success'),
        description: t('transactions.duplicates.actionsApplied'),
      });
      
      // Clear action map and reload duplicates to reflect changes
      setActionMap({});
      findDuplicates();
      
    } catch (error) {
      console.error("Error applying actions:", error);
      toast({
        title: t('common.error'),
        description: "שגיאה ביישום הפעולות",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Search className="w-8 h-8 text-orange-600" />
            {t('transactions.duplicates.manageTitle')}
          </h1>
          <p className="text-gray-600 mt-1">{t('transactions.duplicates.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl('Transactions'))}
          className="flex items-center gap-2"
        >
          <ArrowRight className={`w-4 h-4 ${isRTLLayout ? 'rotate-180' : ''}`} />
          {t('transactions.duplicates.backToTransactions')}
        </Button>
      </div>

      {isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full">
                <Search className="w-8 h-8 text-orange-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('transactions.duplicates.processing')}</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {currentStep === 'analyzing' && t('transactions.duplicates.analyzingTransactions')}
                    {currentStep === 'patterns' && t('transactions.duplicates.findingPatterns')}
                    {currentStep === 'grouping' && t('transactions.duplicates.groupingSimilar')}
                  </div>
                  {progress > 0 && (
                    <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isAnalyzing && duplicateGroups.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('transactions.duplicates.noduplicatesFound')}</h3>
            <p className="text-gray-600">{t('transactions.duplicates.noduplicatesDescription')}</p>
          </CardContent>
        </Card>
      )}

      {!isAnalyzing && duplicateGroups.length > 0 && (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-800">
                    {t('transactions.duplicates.analysisComplete')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('transactions.duplicates.foundGroups', { count: duplicateGroups.length })} • {' '}
                    {t('transactions.duplicates.totalDuplicates', { 
                      count: duplicateGroups.reduce((sum, group) => sum + group.transactions.length, 0) 
                    })}
                  </p>
                </div>
                <Button
                  onClick={applyActions}
                  disabled={!hasActions || isApplying}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('transactions.duplicates.applyActions')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {duplicateGroups.map((group, groupIndex) => (
              <Card key={groupIndex} className="border-orange-200">
                <CardHeader className="bg-orange-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                      <Copy className="w-5 h-5" />
                      {t('transactions.duplicates.group')} {groupIndex + 1}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getConfidenceBadgeVariant(group.confidence)}>
                        {t('transactions.duplicates.confidence')}: {t(`transactions.duplicates.${group.confidence}`)}
                      </Badge>
                    </div>
                  </div>
                  {group.reasons && group.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {group.reasons.map((reason, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {t(`transactions.duplicates.${reason}`)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            {t('transactions.duplicates.transaction')}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            {t('transactions.duplicates.date')}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            {t('transactions.duplicates.business')}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            {t('transactions.duplicates.amount')}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            {t('transactions.duplicates.action')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {group.transactions.map((transaction, transactionIndex) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              #{transactionIndex + 1}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatDate(new Date(transaction.date))}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {transaction.business_name}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono">
                              {formatCurrency(Math.abs(transaction.billing_amount))}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={actionMap[transaction.id] || 'keep'}
                                onChange={(e) => setActionMap(prev => ({
                                  ...prev,
                                  [transaction.id]: e.target.value
                                }))}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="keep">{t('transactions.duplicates.keepOriginal')}</option>
                                <option value="delete">{t('transactions.duplicates.deleteTransaction')}</option>
                                <option value="reviewed">{t('transactions.duplicates.markAsReviewed')}</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}