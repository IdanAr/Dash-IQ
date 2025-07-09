
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
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
} from 'recharts';
import { 
  Layers, 
  TrendingUp, 
  Zap, 
  Target,
  Users,
  Brain
} from 'lucide-react';
import { formatNumber } from '@/components/utils/i18n';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function PhoneticClusteringVisualization({ 
  clusters = [], 
  originalTransactionCount = 0,
  processingStats = null 
}) {
  const visualizationData = useMemo(() => {
    if (!clusters.length) return null;

    // Cluster size distribution
    const sizeDistribution = clusters.reduce((acc, cluster) => {
      const sizeRange = cluster.members.length === 1 ? 'יחיד' :
                      cluster.members.length <= 5 ? '2-5' :
                      cluster.members.length <= 10 ? '6-10' :
                      cluster.members.length <= 20 ? '11-20' : '20+';
      
      acc[sizeRange] = (acc[sizeRange] || 0) + 1;
      return acc;
    }, {});

    const distributionChart = Object.entries(sizeDistribution).map(([range, count]) => ({
      range,
      count,
      percentage: ((count / clusters.length) * 100).toFixed(1)
    }));

    // Top clusters by size
    const topClusters = clusters
      .sort((a, b) => b.members.length - a.members.length)
      .slice(0, 10)
      .map((cluster, index) => ({
        id: index + 1,
        businessName: cluster.representative.business_name || 'לא ידוע',
        size: cluster.members.length,
        phoneticKey: cluster.phoneticKey,
        patterns: cluster.patterns?.slice(0, 3) || []
      }));

    // Efficiency metrics
    const totalTransactions = clusters.reduce((sum, c) => sum + c.members.length, 0);
    const compressionRatio = originalTransactionCount ? 
      ((originalTransactionCount - clusters.length) / originalTransactionCount * 100).toFixed(1) : 0;
    
    const averageClusterSize = (totalTransactions / clusters.length).toFixed(1);
    
    return {
      distributionChart,
      topClusters,
      metrics: {
        totalClusters: clusters.length,
        totalTransactions,
        compressionRatio,
        averageClusterSize,
        largestCluster: Math.max(...clusters.map(c => c.members.length)),
        singletonClusters: clusters.filter(c => c.members.length === 1).length
      }
    };
  }, [clusters, originalTransactionCount]);

  if (!visualizationData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center text-gray-500">
            <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>אין נתוני קיבוץ להצגה</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            מדדי יעילות קיבוץ פונטי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">דחיסת נתונים</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {visualizationData.metrics.compressionRatio}%
              </p>
              <p className="text-xs text-gray-600">
                מ-{formatNumber(originalTransactionCount)} ל-{formatNumber(visualizationData.metrics.totalClusters)}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">גודל קבוצה ממוצע</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {visualizationData.metrics.averageClusterSize}
              </p>
              <p className="text-xs text-gray-600">
                עסקאות לקבוצה
              </p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">קבוצה גדולה ביותר</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {visualizationData.metrics.largestCluster}
              </p>
              <p className="text-xs text-gray-600">
                עסקאות דומות
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">קבוצות יחיד</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {visualizationData.metrics.singletonClusters}
              </p>
              <p className="text-xs text-gray-600">
                עסקאות ייחודיות
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cluster Size Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-indigo-600" />
              התפלגות גדלי קבוצות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={visualizationData.distributionChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} קבוצות (${visualizationData.distributionChart.find(d => d.count === value)?.percentage}%)`,
                    'מספר קבוצות'
                  ]}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              יעילות עיבוד
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>דחיסת נתונים</span>
                <span>{visualizationData.metrics.compressionRatio}%</span>
              </div>
              <Progress 
                value={parseFloat(visualizationData.metrics.compressionRatio)} 
                className="h-2" 
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>קבוצות עם מספר חברים</span>
                <span>
                  {((visualizationData.metrics.totalClusters - visualizationData.metrics.singletonClusters) / visualizationData.metrics.totalClusters * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={((visualizationData.metrics.totalClusters - visualizationData.metrics.singletonClusters) / visualizationData.metrics.totalClusters * 100)}
                className="h-2" 
              />
            </div>

            {processingStats && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>אחוז פגיעות מטמון</span>
                  <span>
                    {((processingStats.cacheHits / processingStats.totalClusters) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(processingStats.cacheHits / processingStats.totalClusters) * 100}
                  className="h-2" 
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clusters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            הקבוצות הגדולות ביותר
          </CardTitle>
          <p className="text-sm text-gray-600">
            קבוצות עם המספר הגבוה ביותר של עסקאות דומות פונטית
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visualizationData.topClusters.map((cluster, index) => (
              <div key={cluster.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {cluster.businessName.length > 30 ? 
                        `${cluster.businessName.substring(0, 30)}...` : 
                        cluster.businessName
                      }
                    </p>
                    <div className="flex gap-1 mt-1">
                      {cluster.patterns.map((pattern, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {pattern.length > 10 ? `${pattern.substring(0, 10)}...` : pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge variant="secondary" className="text-sm">
                    {cluster.size} עסקאות
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    חיסכון: {cluster.size - 1} קריאות API
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
