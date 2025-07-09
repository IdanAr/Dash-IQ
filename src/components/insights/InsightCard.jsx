import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  Users, 
  Smile, 
  PiggyBank, 
  Home, 
  Car, 
  Utensils, 
  Gift, 
  Plane,
  ShoppingCart,
  CreditCard,
  Wallet,
  Target,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Brain,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Star
} from 'lucide-react';
import { t, isRTL } from '@/components/utils/i18n';
import { useUserPreferences } from '@/components/utils/UserPreferencesContext';

// Enhanced icon mapping with more financial icons
const iconMap = {
  TrendingUp, TrendingDown, Activity, AlertTriangle, Users, Smile, 
  PiggyBank, Home, Car, Utensils, Gift, Plane, ShoppingCart,
  CreditCard, Wallet, Target, Calendar, Clock, ArrowUp, ArrowDown, Brain
};

export default function InsightCard({ insight }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { preferences } = useUserPreferences();
  const isRTLLayout = isRTL();
  const userCurrency = preferences?.displayCurrency || 'ILS';

  if (!insight) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm">{t('insights.card.errorLoading')}</p>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = iconMap[insight.icon] || Brain;
  
  // Enhanced urgency colors and styling
  const getUrgencyConfig = (urgency) => {
    switch (urgency) {
      case 'high':
        return {
          badgeClass: 'bg-red-100 text-red-800 border-red-200',
          cardClass: 'border-red-200 hover:border-red-300 bg-gradient-to-br from-red-50 to-white',
          iconClass: 'bg-gradient-to-br from-red-500 to-red-600',
          label: t('insights.urgency.high')
        };
      case 'medium':
        return {
          badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          cardClass: 'border-yellow-200 hover:border-yellow-300 bg-gradient-to-br from-yellow-50 to-white',
          iconClass: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
          label: t('insights.urgency.medium')
        };
      case 'low':
        return {
          badgeClass: 'bg-green-100 text-green-800 border-green-200',
          cardClass: 'border-green-200 hover:border-green-300 bg-gradient-to-br from-green-50 to-white',
          iconClass: 'bg-gradient-to-br from-green-500 to-green-600',
          label: t('insights.urgency.low')
        };
      default:
        return {
          badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
          cardClass: 'border-gray-200 hover:border-gray-300 bg-gradient-to-br from-gray-50 to-white',
          iconClass: 'bg-gradient-to-br from-gray-500 to-gray-600',
          label: insight.urgency || 'unknown'
        };
    }
  };

  // Enhanced type colors
  const getTypeConfig = (type) => {
    switch (type) {
      case 'spending':
        return {
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          label: t('insights.types.spending')
        };
      case 'budget':
        return {
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          label: t('insights.types.budget')
        };
      case 'trend':
        return {
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          label: t('insights.types.trend')
        };
      case 'general':
        return {
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          label: t('insights.types.general')
        };
      default:
        return {
          badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
          label: insight.type || 'unknown'
        };
    }
  };

  // Function to ensure currency consistency in text
  const formatInsightText = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // If user currency is USD, replace ₪ with $ and vice versa
    if (userCurrency === 'USD') {
      text = text.replace(/₪/g, '$');
      text = text.replace(/שקל/g, 'דולר');
      text = text.replace(/שקלים/g, 'דולרים');
      text = text.replace(/Shekel/gi, 'Dollar');
      text = text.replace(/NIS/gi, 'USD');
    } else if (userCurrency === 'ILS') {
      text = text.replace(/\$/g, '₪');
      text = text.replace(/דולר/g, 'שקל');
      text = text.replace(/דולרים/g, 'שקלים');
      text = text.replace(/Dollar/gi, 'Shekel');
      text = text.replace(/USD/gi, 'NIS');
    }
    
    return text;
  };

  const urgencyConfig = getUrgencyConfig(insight.urgency);
  const typeConfig = getTypeConfig(insight.type);

  return (
    <Card 
      className={`${urgencyConfig.cardClass} border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
      onClick={() => setIsExpanded(!isExpanded)}
      dir={isRTLLayout ? 'rtl' : 'ltr'}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-3 rounded-xl ${urgencyConfig.iconClass} shadow-lg flex-shrink-0`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
                {formatInsightText(insight.title) || t('insights.card.noTitle')}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className={`text-xs font-medium border ${urgencyConfig.badgeClass}`}>
                  {urgencyConfig.label}
                </Badge>
                <Badge variant="outline" className={`text-xs font-medium border ${typeConfig.badgeClass}`}>
                  {typeConfig.label}
                </Badge>
                {/* Currency indicator badge */}
                <Badge variant="outline" className="text-xs font-medium border border-gray-300 bg-gray-50 text-gray-600">
                  {userCurrency}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 hover:bg-white/50"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Description */}
          <div>
            <p className={`text-gray-700 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
              {formatInsightText(insight.description) || t('insights.card.noDescription')}
            </p>
          </div>

          {/* Recommendation - Always visible for high urgency, expandable for others */}
          {(insight.urgency === 'high' || isExpanded) && insight.recommendation && (
            <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <h4 className="font-semibold text-gray-900 text-sm">
                  {t('insights.card.recommendation')}
                </h4>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {formatInsightText(insight.recommendation)}
              </p>
            </div>
          )}

          {/* Potential Impact - Only when expanded */}
          {isExpanded && insight.potentialImpact && (
            <div className="bg-blue-50/70 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-2 mb-2">
                <Star className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <h4 className="font-semibold text-blue-900 text-sm">
                  {t('insights.card.potentialImpact')}
                </h4>
              </div>
              <p className="text-blue-800 text-sm leading-relaxed">
                {formatInsightText(insight.potentialImpact)}
              </p>
            </div>
          )}

          {/* Expand/Collapse hint for low and medium urgency */}
          {!isExpanded && insight.urgency !== 'high' && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
              >
                {t('insights.card.clickToExpand')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}