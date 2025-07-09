
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Database, 
  Clock, 
  Target,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { enhancedTransactionClassification } from '@/api/functions';
import { t, formatNumber } from '@/components/utils/i18n';

export default function EnhancedClassificationEngine({ 
  transactions = [], 
  onClassificationComplete, 
  onProgress 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const { toast } = useToast();

  const startClassification = useCallback(async () => {
    if (!transactions.length) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: 'אין עסקאות לסיווג',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults(null);
    setStatistics(null);

    try {
      // Step 1: Phonetic clustering
      setCurrentStep('מקבץ עסקאות לפי דמיון פונטי...');
      setProgress(20);
      onProgress?.(20, 'מקבץ עסקאות לפי דמיון פונטי...');

      // Step 2: Batch processing
      setCurrentStep('מעבד סיווג באצווה מותאמת...');
      setProgress(40);
      onProgress?.(40, 'מעבד סיווג באצווה מותאמת...');

      const { data } = await enhancedTransactionClassification({
        action: 'classifyBatch',
        transactions,
        batchSize: 50
      });

      if (!data.success) {
        throw new Error(data.error || 'שגיאה בסיווג עסקאות');
      }

      // Step 3: Processing results
      setCurrentStep('מעבד תוצאות ומעדכן מטמון...');
      setProgress(80);
      onProgress?.(80, 'מעבד תוצאות ומעדכן מטמון...');

      setResults(data.classifications);
      setStatistics(data.statistics);
      setCacheStats(data.cacheStats);

      // Step 4: Complete
      setCurrentStep('הסיווג הושלם בהצלחה!');
      setProgress(100);
      onProgress?.(100, 'הסיווג הושלם בהצלחה!');

      onClassificationComplete?.(data.classifications, data.statistics);

      toast({
        title: t('common.success'),
        description: `סווגו ${data.classifications.length} עסקאות בהצלחה`,
      });

    } catch (error) {
      console.error('Classification error:', error);
      setCurrentStep('שגיאה בסיווג');
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message || 'שגיאה בסיווג עסקאות',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [transactions, onClassificationComplete, onProgress, toast]);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'גבוהה';
    if (confidence >= 0.6) return 'בינונית';
    return 'נמוכה';
  };

  return (
    <div className="space-y-6">
      {/* Main Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            מנוע סיווג עסקאות מתקדם
          </CardTitle>
          <p className="text-gray-600">
            סיווג אוטומטי חכם עם קיבוץ פונטי ועיבוד באצווה לביצועים מיטביים
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">עסקאות לסיווג</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatNumber(transactions.length)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Zap className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">חיסכון בזמן צפוי</p>
                <p className="text-lg font-bold text-green-600">
                  {Math.max(1, Math.floor(transactions.length / 10))} דקות
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">דיוק צפוי</p>
                <p className="text-lg font-bold text-purple-600">85-95%</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={startClassification}
            disabled={isProcessing || transactions.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-spin" />
                מעבד סיווג...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                התחל סיווג חכם
              </>
            )}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Statistics */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              סטטיסטיקות עיבוד
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">קבוצות שנוצרו</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.totalClusters}
                </p>
                <p className="text-xs text-gray-600">
                  מתוך {statistics.totalTransactions} עסקאות
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">פגיעות מטמון</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.cacheHits}
                </p>
                <p className="text-xs text-gray-600">
                  חיסכון בעיבוד
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">סיווגים חדשים</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {statistics.newClassifications}
                </p>
                <p className="text-xs text-gray-600">
                  דורשים עיבוד AI
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">זמן עיבוד</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {(statistics.processingTime / 1000).toFixed(1)}s
                </p>
                <p className="text-xs text-gray-600">
                  זמן כולל
                </p>
              </div>
            </div>

            {/* Confidence Distribution */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">התפלגות רמות ביטחון</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">ביטחון גבוה (80%+)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ 
                          width: `${(statistics.confidenceDistribution.high / statistics.totalClusters) * 100}%` 
                        }}
                      />
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      {statistics.confidenceDistribution.high}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">ביטחון בינוני (60-80%)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ 
                          width: `${(statistics.confidenceDistribution.medium / statistics.totalClusters) * 100}%` 
                        }}
                      />
                    </div>
                    <Badge variant="outline" className="text-yellow-600">
                      {statistics.confidenceDistribution.medium}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">ביטחון נמוך (מתחת ל-60%)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ 
                          width: `${(statistics.confidenceDistribution.low / statistics.totalClusters) * 100}%` 
                        }}
                      />
                    </div>
                    <Badge variant="outline" className="text-red-600">
                      {statistics.confidenceDistribution.low}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Performance */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              ביצועי מטמון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">
                  {(cacheStats.hitRate * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">אחוז פגיעות מטמון</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(cacheStats.cacheSize)}
                </p>
                <p className="text-sm text-gray-600">רשומות במטמון</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(cacheStats.hits)}
                </p>
                <p className="text-sm text-gray-600">פגיעות מוצלחות</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Preview */}
      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              תוצאות סיווג - תצוגה מקדימה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.slice(0, 10).map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getConfidenceColor(result.confidence)}`} />
                    <div>
                      <p className="text-sm font-medium">
                        עסקה {result.transactionId.substring(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-600">
                        {result.reasoning}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {result.suggestedCategory}
                    </Badge>
                    <Badge variant="secondary">
                      {getConfidenceLabel(result.confidence)}
                    </Badge>
                    {result.fromCache && (
                      <Badge variant="outline" className="text-green-600">
                        מטמון
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {results.length > 10 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    מוצגות 10 תוצאות ראשונות מתוך {results.length} תוצאות סיווג.
                    התוצאות המלאות נשלחות לעדכון העסקאות.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
