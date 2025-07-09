
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { t, getCurrentLanguage, isRTL } from "@/components/utils/i18n";
import {
  FileUp,
  FolderTree,
  PiggyBank,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  PlayCircle,
  ArrowRight,
  Star,
  Target,
  TrendingUp
} from "lucide-react";

const WelcomeGuide = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const isRTLLayout = isRTL();
  const currentLanguage = getCurrentLanguage();

  const steps = [
    {
      id: 'welcome',
      titleKey: 'onboarding.welcome.title',
      descriptionKey: 'onboarding.welcome.description',
      icon: Star,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      features: [
        'onboarding.welcome.feature1',
        'onboarding.welcome.feature2',
        'onboarding.welcome.feature3',
        'onboarding.welcome.feature4'
      ]
    },
    {
      id: 'upload',
      titleKey: 'onboarding.upload.title',
      descriptionKey: 'onboarding.upload.description',
      icon: FileUp,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      actionText: 'onboarding.upload.action',
      actionPage: 'Upload',
      tips: [
        'onboarding.upload.tip1',
        'onboarding.upload.tip2',
        'onboarding.upload.tip3'
      ]
    },
    {
      id: 'categories',
      titleKey: 'onboarding.categories.title',
      descriptionKey: 'onboarding.categories.description',
      icon: FolderTree,
      color: 'bg-gradient-to-br from-purple-500 to-violet-600',
      actionText: 'onboarding.categories.action',
      actionPage: 'CategoryManagement',
      tips: [
        'onboarding.categories.tip1',
        'onboarding.categories.tip2',
        'onboarding.categories.tip3'
      ]
    },
    {
      id: 'budget',
      titleKey: 'onboarding.budget.title',
      descriptionKey: 'onboarding.budget.description',
      icon: PiggyBank,
      color: 'bg-gradient-to-br from-orange-500 to-red-600',
      actionText: 'onboarding.budget.action',
      actionPage: 'Budget',
      tips: [
        'onboarding.budget.tip1',
        'onboarding.budget.tip2',
        'onboarding.budget.tip3'
      ]
    },
    {
      id: 'insights',
      titleKey: 'onboarding.insights.title',
      descriptionKey: 'onboarding.insights.description',
      icon: BarChart3,
      color: 'bg-gradient-to-br from-teal-500 to-cyan-600',
      actionText: 'onboarding.insights.action',
      actionPage: 'Dashboard',
      tips: [
        'onboarding.insights.tip1',
        'onboarding.insights.tip2',
        'onboarding.insights.tip3'
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleActionClick = (page) => {
    localStorage.setItem('onboardingCompleted', 'true');
    navigate(createPageUrl(page));
    if (onComplete) {
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t('onboarding.progress')}: {currentStep + 1} {t('common.of')} {steps.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-gray-500 hover:text-gray-700">
              {t('onboarding.skip')}
            </Button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
          <CardHeader className={`${currentStepData.color} text-white p-8`}>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <IconComponent className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl md:text-3xl font-bold mb-2">
                  {t(currentStepData.titleKey)}
                </CardTitle>
                <p className="text-white/90 text-lg">
                  {t(currentStepData.descriptionKey)}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Features List for Welcome Step */}
            {currentStepData.features && (
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {currentStepData.features.map((featureKey, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{t(featureKey)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tips List for Action Steps */}
            {currentStepData.tips && (
              <div className="space-y-3 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('onboarding.tips')}:
                </h3>
                {currentStepData.tips.map((tipKey, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                    <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{t(tipKey)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Button */}
            {currentStepData.actionText && currentStepData.actionPage && (
              <div className="mb-8">
                <Button 
                  onClick={() => handleActionClick(currentStepData.actionPage)}
                  className={`${currentStepData.color} hover:opacity-90 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 w-full md:w-auto`}
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  {t(currentStepData.actionText)}
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                {isRTLLayout ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {t('onboarding.previous')}
              </Button>

              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentStep 
                        ? 'bg-blue-500 scale-125' 
                        : index < currentStep 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
                {isRTLLayout ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">{t('onboarding.quickStart')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {steps.slice(1).map((step) => {
              const StepIcon = step.icon;
              return (
                <Button
                  key={step.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(step.actionPage)}
                  className="bg-white/80 hover:bg-white border-gray-200 flex items-center gap-2"
                >
                  <StepIcon className="w-4 h-4" />
                  {t(step.actionText)}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeGuide;
