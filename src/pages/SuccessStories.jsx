
import React, { useState, useEffect } from "react";
import { Transaction, Category, Budget, User } from "@/api/entities"; // Keep these as they are used
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Keep Progress, it's used
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator"; // Added from outline
import { Label } from "@/components/ui/label"; // Added from outline
import { Alert, AlertDescription } from "@/components/ui/alert"; // Added from outline
import { useToast } from "@/components/ui/use-toast";
import {
  Trophy,
  Target,
  TrendingUp,
  TrendingDown, // Keep
  Heart,
  Star,
  BookOpen,
  // Calendar, // Removed - not used in this file
  DollarSign,
  // Users, // Removed - not used in this file
  Award,
  Lightbulb,
  Quote,
  CheckCircle, // Kept and explicitly listed in outline
  Clock,
  ArrowRight,
  Bookmark,
  Share,
  ChevronDown,
  ChevronUp,
  Sparkles,
  // Gift, // Removed - not used in this file
  Crown,
  Zap,
  AlertCircle, // Keep
  PlusCircle, // Keep
  Layers, // Added from outline
  BarChart3, // Added from outline
  AlertTriangle, // Added from outline
  Info, // Added from outline
  Plus // Added from outline
} from "lucide-react";
import { t, isRTL, getCurrentLanguage, formatCurrency, formatDate, formatNumber } from '@/components/utils/i18n'; // Consolidated imports
import {
  parseISO,
  differenceInMonths
  // startOfMonth, // Removed - not used in this file
  // endOfMonth, // Removed - not used in this file
  // subMonths, // Removed - not used in this file
  // isWithinInterval, // Removed - not used in this file
  // format as formatDate // Removed - now comes from i18n utils
} from "date-fns";

// Israeli success stories - language-aware
const getIsraeliSuccessStories = () => {
  const currentLang = getCurrentLanguage();
  
  return [
    {
      id: 1,
      name: currentLang === 'he' ? 'שרה כהן, 32' : currentLang === 'ar' ? 'سارة كوهين، 32' : 'Sarah Cohen, 32',
      location: currentLang === 'he' ? 'תל אביב' : currentLang === 'ar' ? 'تل أبيب' : 'Tel Aviv',
      category: 'debt',
      timeframe: 18,
      challenge: currentLang === 'he' ? 
        'שרה הייתה עם חובות של ₪85,000 מכרטיסי אשראי ו-3 הלוואות שונות. שכרה היה ₪12,000 לחודש והיא לא הצליחה לחסוך כלום.' :
        currentLang === 'ar' ? 
        'كانت سارة مدينة بـ 85,000 شيكل من بطاقات الائتمان و3 قروض مختلفة. راتبها كان 12,000 شيكل شهرياً ولم تتمكن من الادخار.' :
        'Sarah had ₪85,000 in credit card debt and 3 different loans. Her salary was ₪12,000 per month and she couldn\'t save anything.',
      solution: currentLang === 'he' ? 
        'יצרה תקציב מפורט, עברה לדירה קטנה יותר, לקחה עבודה נוספת בסופי שבוע, וניהלה את החובות לפי שיטת "כדור השלג".' :
        currentLang === 'ar' ? 
        'أنشأت ميزانية مفصلة، انتقلت لشقة أصغر، أخذت عملاً إضافياً في نهايات الأسبوع، وأدارت الديون وفق طريقة "كرة الثلج".' :
        'Created a detailed budget, moved to a smaller apartment, took weekend side jobs, and managed debts using the "snowball" method.',
      result: currentLang === 'he' ? 
        'בתוך 18 חודשים פרעה את כל החובות וחסכה ₪25,000 לקרן חירום. היום היא חיה ללא חובות עם ₪150,000 בחיסכונות.' :
        currentLang === 'ar' ? 
        'في غضون 18 شهراً سددت جميع الديون ووفرت 25,000 شيكل لصندوق الطوارئ. اليوم تعيش بلا ديون مع 150,000 شيكل في المدخرات.' :
        'Within 18 months she paid off all debts and saved ₪25,000 for emergency fund. Today she lives debt-free with ₪150,000 in savings.',
      lessonLearned: currentLang === 'he' ? 
        'משמעת וקביעת עדיפויות ברורות הן המפתח להצלחה פיננסית.' :
        currentLang === 'ar' ? 
        'الانضباط وتحديد الأولويات الواضحة هما مفتاح النجاح المالي.' :
        'Discipline and setting clear priorities are the key to financial success.',
      outcome: '₪235,000',
      isExpanded: false
    },
    {
      id: 2,
      name: currentLang === 'he' ? 'דוד לוי, 28' : currentLang === 'ar' ? 'داود ليفي، 28' : 'David Levy, 28',
      location: currentLang === 'he' ? 'חיפה' : currentLang === 'ar' ? 'حيفا' : 'Haifa',
      category: 'savings',
      timeframe: 24,
      challenge: currentLang === 'he' ? 
        'דוד עבד כמהנדס בחברת היי-טק בשכר של ₪18,000 לחודש, אבל בזבז הכל על בילויים, מכונית יקרה וחופשות. בגיל 26 היה לו 0 בחיסכונות.' :
        currentLang === 'ar' ? 
        'عمل داود كمهندس في شركة هاي-تك براتب 18,000 شيكل شهرياً، لكنه أنفق كل شيء على التسلية وسيارة باهظة والإجازات. في سن 26 كان لديه 0 في المدخرات.' :
        'David worked as an engineer in a hi-tech company earning ₪18,000 monthly, but spent everything on entertainment, expensive car and vacations. At 26 he had 0 savings.',
      solution: currentLang === 'he' ? 
        'החל ליישם את כלל 50/30/20, מכר את המכונית היקרה, עבר לדירה עם שותפים והתחיל להשקיע 20% מהשכר בקרנות מדד.' :
        currentLang === 'ar' ? 
        'بدأ بتطبيق قاعدة 50/30/20، باع السيارة الباهظة، انتقل لشقة مع شركاء وبدأ بالاستثمار 20% من الراتب في صناديق مؤشرات.' :
        'Started implementing the 50/30/20 rule, sold the expensive car, moved to a shared apartment and began investing 20% of salary in index funds.',
      result: currentLang === 'he' ? 
        'תוך שנתיים צבר ₪180,000 בחיסכונות והשקעות. קנה דירה עם משכנתא של 70% בלבד והמשיך לחסוך ₪4,000 לחודש.' :
        currentLang === 'ar' ? 
        'في غضون سنتين جمع 180,000 شيكل في المدخرات والاستثمارات. اشترى شقة بقرض عقاري 70% فقط وواصل الادخار 4,000 شيكل شهرياً.' :
        'Within two years accumulated ₪180,000 in savings and investments. Bought an apartment with only 70% mortgage and continued saving ₪4,000 monthly.',
      lessonLearned: currentLang === 'he' ? 
        'התחלה מוקדמת בחיסכון והשקעה מאפשרת חופש פיננסי גדול יותר בעתיד.' :
        currentLang === 'ar' ? 
        'البداية المبكرة في الادخال والاستثمار تتيح حرية مالية أكبر في المستقبل.' :
        'Early start in saving and investing enables greater financial freedom in the future.',
      outcome: '₪180,000',
      isExpanded: false
    },
    {
      id: 3,
      name: currentLang === 'he' ? 'רחל אברהם, 45' : currentLang === 'ar' ? 'راحيل إبراهيم، 45' : 'Rachel Abraham, 45',
      location: currentLang === 'he' ? 'ירושלים' : currentLang === 'ar' ? 'القدس' : 'Jerusalem',
      category: 'business',
      timeframe: 36,
      challenge: currentLang === 'he' ? 
        'רחל הייתה אמא חד הורית עם 3 ילדים, עבדה כמזכירה בשכר של ₪8,500 לחודש. לא הצליחה לחסוך ופחדה מהעתיד הכלכלי של המשפחה.' :
        currentLang === 'ar' ? 
        'كانت راحيل أماً عازبة مع 3 أطفال، عملت كسكرتيرة براتب 8,500 شيكل شهرياً. لم تتمكن من الادخار وخافت من المستقبل الاقتصادي للعائلة.' :
        'Rachel was a single mother with 3 children, worked as a secretary earning ₪8,500 monthly. Couldn\'t save and feared for the family\'s financial future.',
      solution: currentLang === 'he' ? 
        'החלה לעבוד בערבים כמתורגמת פרילנסר, פתחה עסק קטן לתרגום מהבית, הקפידה על תקציב קפדני והשקיעה בקורסי השכלה מקצועית.' :
        currentLang === 'ar' ? 
        'بدأت العمل مساءً كمترجمة مستقلة، فتحت عملاً صغيراً للترجمة من المنزل، حافظت على ميزانية صارمة واستثمرت في دورات التعليم المهني.' :
        'Started working evenings as a freelance translator, opened a small translation business from home, maintained strict budget and invested in professional education courses.',
      result: currentLang === 'he' ? 
        'תוך 3 שנים הכניסה מהעסק הגיעה ל-₪15,000 לחודש. היום היא מנהלת חברת תרגום עם 8 עובדים ומרוויחה ₪45,000 לחודש.' :
        currentLang === 'ar' ? 
        'في غضون 3 سنوات وصل الدخل من العمل إلى 15,000 شيكل شهرياً. اليوم تدير شركة ترجمة مع 8 موظفين وتكسب 45,000 شيكل شهرياً.' :
        'Within 3 years business income reached ₪15,000 monthly. Today she manages a translation company with 8 employees earning ₪45,000 monthly.',
      lessonLearned: currentLang === 'he' ? 
        'השקעה בעצמך ובכישורים שלך היא ההשקעה הטובה ביותר שיש.' :
        currentLang === 'ar' ? 
        'الاستثمار في نفسك وفي مهاراتك هو أفضل استثمار موجود.' :
        'Investing in yourself and your skills is the best investment there is.',
      outcome: '₪45,000/חודש',
      isExpanded: false
    }
  ];
};

// Motivational quotes - language-aware
const getMotivationalQuotes = () => {
  const currentLang = getCurrentLanguage();
  
  const quotes = [
    {
      quote: currentLang === 'he' ? 
        'עושר אינו מגיע מהכנסה גבוהה, אלא מהוצאות נמוכות יחסית להכנסה' :
        currentLang === 'ar' ? 
        'الثروة لا تأتي من الدخل المرتفع، بل من النفقات المنخفضة نسبياً للدخل' :
        'Wealth comes not from high income, but from expenses low relative to income',
      author: currentLang === 'he' ? 'רוברט קיוסאקי' : currentLang === 'ar' ? 'روبرت كيوساكي' : 'Robert Kiyosaki',
      category: 'wealth'
    },
    {
      quote: currentLang === 'he' ? 
        'זה לא כמה שאתה מרוויח, אלא כמה שאתה חוסך' :
        currentLang === 'ar' ? 
        'الأمر ليس كم تكسب، بل كم توفر' :
        'It\'s not how much you make, but how much you save',
      author: currentLang === 'he' ? 'וורן באפט' : currentLang === 'ar' ? 'وارن بافت' : 'Warren Buffett',
      category: 'success'
    },
    {
      quote: currentLang === 'he' ? 
        'הצעד הראשון לקראת עושר הוא חיסכון' :
        currentLang === 'ar' ? 
        'الخطوة الأولى نحو الثروة هي الادخار' :
        'The first step towards wealth is saving',
      author: currentLang === 'he' ? 'בנג\'מין פרנקלין' : currentLang === 'ar' ? 'بنجامين فرانكلين' : 'Benjamin Franklin',
      category: 'planning'
    },
    {
      quote: currentLang === 'he' ? 
        'משמעת עצמית היא הבסיס של כל הישג' :
        currentLang === 'ar' ? 
        'الانضباط الذاتي هو أساس كل إنجاز' :
        'Self-discipline is the foundation of all achievement',
      author: currentLang === 'he' ? 'ג\'ים רון' : currentLang === 'ar' ? 'جيم رون' : 'Jim Rohn',
      category: 'discipline'
    },
    {
      quote: currentLang === 'he' ? 
        'הזמן הטוב ביותר לשתול עץ היה לפני 20 שנה. הזמן השני הטוב ביותר הוא עכשיו' :
        currentLang === 'ar' ? 
        'أفضل وقت لزراعة شجرة كان قبل 20 عاماً. ثاني أفضل وقت هو الآن' :
        'The best time to plant a tree was 20 years ago. The second best time is now',
      author: currentLang === 'he' ? 'פתגם סיני' : currentLang === 'ar' ? 'مثل صيني' : 'Chinese Proverb',
      category: 'persistence'
    }
  ];

  return quotes;
};

// Practical tips - language-aware
const getPracticalTips = () => {
  const currentLang = getCurrentLanguage();
  
  return {
    budgeting: [
      {
        title: currentLang === 'he' ? 'כלל 50/30/20' : currentLang === 'ar' ? 'قاعدة 50/30/20' : '50/30/20 Rule',
        description: currentLang === 'he' ? 
          'חלק את ההכנסות: 50% צרכים, 30% רצונות, 20% חיסכון' :
          currentLang === 'ar' ? 
          'قسم الدخل: 50% احتياجات، 30% رغبات، 20% ادخار' :
          'Divide income: 50% needs, 30% wants, 20% savings',
        difficulty: 'beginner',
        timeToImplement: currentLang === 'he' ? 'שבוע אחד' : currentLang === 'ar' ? 'أسبوع واحد' : 'One week',
        potentialSavings: currentLang === 'he' ? 'עד 20% מההכנסות' : currentLang === 'ar' ? 'حتى 20% من الدخل' : 'Up to 20% of income',
        steps: currentLang === 'he' ? [
          'חשב את ההכנסה החודשית הנטו',
          'רשום את כל ההוצאות הקבועות (צרכים)',
          'קבע תקציב לבילויים וקניות (רצונות)',
          'הפרש 20% לחיסכון והשקעות',
          'עקוב אחר ההוצאות במשך חודש'
        ] : currentLang === 'ar' ? [
          'احسب الدخل الشهري الصافي',
          'اكتب جميع النفقات الثابتة (الاحتياجات)',
          'حدد ميزانية للترفيه والتسوق (الرغبات)',
          'خصص 20% للادخار والاستثمارات',
          'تتبع النفقات لمدة شهر'
        ] : [
          'Calculate net monthly income',
          'List all fixed expenses (needs)',
          'Set budget for entertainment and shopping (wants)',
          'Allocate 20% for savings and investments',
          'Track expenses for one month'
        ]
      }
    ],
    saving: [
      {
        title: currentLang === 'he' ? 'חיסכון אוטומטי' : currentLang === 'ar' ? 'الادخار التلقائي' : 'Automatic Savings',
        description: currentLang === 'he' ? 
          'הגדר העברה אוטומטית לחיסכונות בתחילת כל חודש' :
          currentLang === 'ar' ? 
          'حدد تحويلاً تلقائياً للمدخرات في بداية كل شهر' :
          'Set up automatic transfer to savings at the beginning of each month',
        difficulty: 'beginner',
        timeToImplement: currentLang === 'he' ? 'יום אחד' : currentLang === 'ar' ? 'يوم واحد' : 'One day',
        potentialSavings: currentLang === 'he' ? '10-20% מההכנסות' : currentLang === 'ar' ? '10-20% من الدخل' : '10-20% of income'
      }
    ]
  };
};

export default function SuccessStoriesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("stories");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedStory, setExpandedStory] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [randomQuote, setRandomQuote] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const isRTLLayout = isRTL();

  // Load user data and calculate progress
  useEffect(() => {
    loadUserProgress();
    loadDailyContent();
  }, []);

  const loadUserProgress = async () => {
    setIsLoading(true);
    try {
      const [transactions, budgets, user] = await Promise.all([
        Transaction.list('-date', 200),
        Budget.list(),
        User.me().catch(() => null)
      ]);

      if (transactions.length > 0) {
        calculateUserProgress(transactions, budgets, user);
      }
    } catch (error) {
      console.error("Error loading user progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateUserProgress = (transactions, budgets, user) => {
    const now = new Date();
    const firstTransaction = transactions[transactions.length - 1];
    const startDate = firstTransaction ? parseISO(firstTransaction.date) : now;
    const monthsTracking = differenceInMonths(now, startDate);

    // Calculate financial metrics
    const totalIncome = transactions
      .filter(t => t.is_income)
      .reduce((sum, t) => sum + (t.billing_amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => !t.is_income)
      .reduce((sum, t) => sum + (t.billing_amount || 0), 0);

    const totalSaved = Math.max(0, totalIncome - totalExpenses);
    const savingsRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;

    // Calculate milestones
    const milestones = {
      firstBudget: budgets.length > 0,
      firstSavings: totalSaved > 0,
      debtReduction: false, // Simplified for now
      emergencyFund: totalSaved > 10000, // Simplified threshold
      investmentStart: false, // Would need investment data
      financialGoals: savingsRate > 20
    };

    const achievedMilestones = Object.values(milestones).filter(Boolean).length;
    const totalMilestones = Object.keys(milestones).length;

    // Determine encouragement level
    let encouragementLevel = 'justStarted';
    if (achievedMilestones >= 4) encouragementLevel = 'excellent';
    else if (achievedMilestones >= 2) encouragementLevel = 'onTrack';
    else if (monthsTracking > 3) encouragementLevel = 'makingProgress';

    setUserProgress({
      startDate,
      monthsTracking,
      totalSaved: Math.round(totalSaved),
      savingsRate: Math.round(savingsRate),
      milestones,
      achievedMilestones,
      totalMilestones,
      encouragementLevel,
      budgetCount: budgets.length,
      transactionCount: transactions.length
    });
  };

  const loadDailyContent = () => {
    const quotes = getMotivationalQuotes();
    const randomQuoteIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomQuoteIndex]);

    const challenges = t('successStories.motivation.dailyChallenge.challenges', { returnObjects: true }) || [
      t('successStories.motivation.dailyChallenge.description')
    ];
    const randomChallengeIndex = Math.floor(Math.random() * challenges.length);
    setDailyChallenge(challenges[randomChallengeIndex]);
  };

  const getStories = () => {
    const stories = getIsraeliSuccessStories();
    if (selectedCategory === 'all') {
      return stories;
    }
    return stories.filter(story => story.category === selectedCategory);
  };

  const toggleStoryExpansion = (storyId) => {
    setExpandedStory(expandedStory === storyId ? null : storyId);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      debt: <TrendingDown className="w-4 h-4" />,
      savings: <DollarSign className="w-4 h-4" />,
      investment: <TrendingUp className="w-4 h-4" />,
      budgeting: <Target className="w-4 h-4" />,
      career: <Award className="w-4 h-4" />,
      business: <Crown className="w-4 h-4" />
    };
    return icons[category] || <Star className="w-4 h-4" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      debt: 'bg-red-100 text-red-800 border-red-200',
      savings: 'bg-green-100 text-green-800 border-green-200',
      investment: 'bg-blue-100 text-blue-800 border-blue-200',
      budgeting: 'bg-purple-100 text-purple-800 border-purple-200',
      career: 'bg-orange-100 text-orange-800 border-orange-200',
      business: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-600" />
          {t('successStories.title')}
        </h1>
        <p className="text-gray-600">
          {t('successStories.subtitle')}
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="stories" 
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all text-xs md:text-sm"
          >
            <BookOpen className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('successStories.tabs.stories')}</span>
            <span className="sm:hidden">{t('successStories.tabs.stories').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="myProgress" 
            className="data-[state=active]:bg-white data-[state=active]:text-green-600 transition-all text-xs md:text-sm"
          >
            <Target className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('successStories.tabs.myProgress')}</span>
            <span className="sm:hidden">{t('successStories.tabs.myProgress').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="tips" 
            className="data-[state=active]:bg-white data-[state=active]:text-purple-600 transition-all text-xs md:text-sm"
          >
            <Lightbulb className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('successStories.tabs.tips')}</span>
            <span className="sm:hidden">{t('successStories.tabs.tips').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="motivation" 
            className="data-[state=active]:bg-white data-[state=active]:text-orange-600 transition-all text-xs md:text-sm"
          >
            <Sparkles className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('successStories.tabs.motivation')}</span>
            <span className="sm:hidden">{t('successStories.tabs.motivation').split(' ')[0]}</span>
          </TabsTrigger>
        </TabsList>

        {/* Success Stories Tab */}
        <TabsContent value="stories" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{t('successStories.stories.title')}</h2>
              <p className="text-gray-600">{t('successStories.stories.description')}</p>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-white shadow-sm">
                <SelectValue placeholder={t('successStories.stories.filterBy')} />
              </SelectTrigger>
              <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                <SelectItem value="all">{t('successStories.stories.allCategories')}</SelectItem>
                <SelectItem value="debt">{t('successStories.stories.categories.debt')}</SelectItem>
                <SelectItem value="savings">{t('successStories.stories.categories.savings')}</SelectItem>
                <SelectItem value="investment">{t('successStories.stories.categories.investment')}</SelectItem>
                <SelectItem value="budgeting">{t('successStories.stories.categories.budgeting')}</SelectItem>
                <SelectItem value="career">{t('successStories.stories.categories.career')}</SelectItem>
                <SelectItem value="business">{t('successStories.stories.categories.business')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6">
            {getStories().map((story) => (
              <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {story.name.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-800">{story.name}</CardTitle>
                          <p className="text-sm text-gray-600">{story.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getCategoryColor(story.category)}>
                        {getCategoryIcon(story.category)}
                        <span className="mr-1">{t(`successStories.stories.categories.${story.category}`)}</span>
                      </Badge>
                      <Badge variant="outline" className="bg-white">
                        <Clock className="w-3 h-3 mr-1" />
                        {story.timeframe} {t('successStories.stories.months')}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {story.outcome}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        {t('successStories.stories.challenge')}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{story.challenge}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        {t('successStories.stories.solution')}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{story.solution}</p>
                    </div>

                    {(expandedStory === story.id) && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {t('successStories.stories.result')}
                          </h4>
                          <p className="text-gray-700 leading-relaxed">{story.result}</p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            {t('successStories.stories.inspiration.title')}
                          </h4>
                          <p className="text-blue-700 font-medium">{story.lessonLearned}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="ghost"
                        onClick={() => toggleStoryExpansion(story.id)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        {expandedStory === story.id ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            {t('successStories.common.readLess')}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            {t('successStories.common.readMore')}
                          </>
                        )}
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                          <Bookmark className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Progress Tab */}
        <TabsContent value="myProgress" className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Target className="w-6 h-6" />
                {t('successStories.myProgress.title')}
              </CardTitle>
              <CardDescription className="text-green-700">
                {t('successStories.myProgress.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userProgress ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{userProgress.monthsTracking}</div>
                      <div className="text-sm text-gray-600">{t('successStories.myProgress.metrics.monthsTracking')}</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(userProgress.totalSaved)}</div>
                      <div className="text-sm text-gray-600">{t('successStories.myProgress.metrics.totalSaved')}</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{userProgress.savingsRate}%</div>
                      <div className="text-sm text-gray-600">{t('successStories.myProgress.metrics.savingsRate')}</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{userProgress.budgetCount}</div>
                      <div className="text-sm text-gray-600">{t('navigation.budget')}</div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('successStories.myProgress.milestones.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(userProgress.milestones).map(([milestone, achieved]) => (
                        <div key={milestone} className="flex items-center gap-3">
                          {achieved ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                          )}
                          <span className={achieved ? 'text-gray-800 font-medium' : 'text-gray-600'}>
                            {t(`successStories.myProgress.milestones.${milestone}`)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{t('successStories.myProgress.achievements')}</span>
                        <span className="text-sm text-gray-600">
                          {userProgress.achievedMilestones}/{userProgress.totalMilestones}
                        </span>
                      </div>
                      <Progress 
                        value={(userProgress.achievedMilestones / userProgress.totalMilestones) * 100} 
                        className="h-3" 
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      {t('successStories.myProgress.encouragement.title')}
                    </h4>
                    <p className="text-green-700">
                      {t(`successStories.myProgress.encouragement.${userProgress.encouragementLevel}`)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {t('successStories.myProgress.noData.title')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('successStories.myProgress.noData.description')}
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    {t('successStories.myProgress.noData.cta')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Lightbulb className="w-6 h-6" />
                {t('successStories.tips.title')}
              </CardTitle>
              <CardDescription className="text-purple-700">
                {t('successStories.tips.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {Object.entries(getPracticalTips()).map(([category, tips]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
                      {t(`successStories.tips.categories.${category}`)}
                    </h3>
                    <div className="grid gap-4">
                      {tips.map((tip, index) => (
                        <Card key={index} className="border border-purple-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">{tip.title}</h4>
                                <p className="text-gray-600 text-sm">{tip.description}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {t(`successStories.tips.difficulty.${tip.difficulty}`)}
                                </Badge>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {tip.timeToImplement}
                                </Badge>
                              </div>
                            </div>
                            
                            {tip.steps && (
                              <div className="bg-purple-50 p-3 rounded-lg">
                                <h5 className="font-medium text-purple-800 mb-2">
                                  {t('successStories.tips.tipDetails.steps')}:
                                </h5>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-purple-700">
                                  {tip.steps.map((step, stepIndex) => (
                                    <li key={stepIndex}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-4">
                              <div className="text-sm">
                                <span className="text-gray-600">{t('successStories.tips.potentialSavings')}: </span>
                                <span className="font-medium text-green-600">{tip.potentialSavings}</span>
                              </div>
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                <ArrowRight className="w-4 h-4 mr-1" />
                                {t('successStories.common.apply')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Motivation Tab */}
        <TabsContent value="motivation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quote of the Day */}
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Quote className="w-6 h-6" />
                  {t('successStories.motivation.quoteOfTheDay')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {randomQuote && (
                  <div className="space-y-4">
                    <blockquote className="text-lg font-medium text-gray-800 leading-relaxed italic">
                      "{randomQuote.quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <cite className="text-sm font-medium text-orange-700">
                        — {randomQuote.author}
                      </cite>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        {t(`successStories.motivation.categories.${randomQuote.category}`)}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Challenge */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-800">
                  <Zap className="w-6 h-6" />
                  {t('successStories.motivation.dailyChallenge.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    {dailyChallenge}
                  </p>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('successStories.common.getStarted')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* More Quotes */}
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-800">
                <Sparkles className="w-6 h-6" />
                {t('successStories.motivation.financialWisdom')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {getMotivationalQuotes().slice(1).map((quote, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border border-pink-200">
                    <blockquote className="text-gray-800 font-medium mb-2 italic">
                      "{quote.quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <cite className="text-sm text-pink-700">— {quote.author}</cite>
                      <Badge className="bg-pink-100 text-pink-800 border-pink-200">
                        {t(`successStories.motivation.categories.${quote.category}`)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
