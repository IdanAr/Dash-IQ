
import React, { createContext, useContext, useState, useEffect } from 'react';

// Extract original Hebrew and English translation data
const heTranslations = {
  common: {
    loading: "טוען...",
    save: "שמור",
    cancel: "בטל",
    delete: "מחק",
    edit: "ערוך",
    add: "הוסף",
    create: "צור",
    update: "עדכן",
    close: "סגור",
    confirm: "אשר",
    error: "שגיאה",
    success: "הצלחה",
    warning: "אזהרה",
    info: "מידע",
    yes: "כן",
    no: "לא",
    search: "חפש",
    filter: "סנן",
    reset: "אפס",
    back: "חזור",
    next: "הבא",
    previous: "הקודם",
    view: "צפה",
    export: "ייצא",
    import: "ייבא",
    upload: "העלה",
    download: "הורד",
    ok: "אישור",
    apply: "החל",
    submit: "שלח",
    select: "בחר",
    clear: "נקה",
    refresh: "רענן",
    more: "עוד",
    less: "פחות",
    all: "הכל",
    none: "ללא",
    sort: "מיין",
    actions: "פעולות",
    settings: "הגדרות",
    help: "עזרה",
    expand: "הרחב",
    collapse: "כווץ",
    required: "שדה חובה",
    optional: "אופציונלי",
    enabled: "מופעל",
    disabled: "מכובה",
    active: "פעיל",
    inactive: "לא פעיל",
    today: "היום",
    yesterday: "אתמול",
    tomorrow: "מחר",
    day: "יום",
    week: "שבוע",
    month: "חודש",
    year: "שנה",
    amount: "סכום",
    total: "סך הכל",
    average: "ממוצע",
    count: "ספירה",
    status: "סטטוס",
    type: "סוג",
    category: "קטגוריה",
    title: "כותרת",
    name: "שם",
    description: "תיאור",
    details: "פרטים",
    date: "תאריך",
    time: "שעה",
    of: "מתוך",
    decrease: "ירידה",
    increase: "עלייה",
    uncategorized: "לא מסווג",
    showMore: "הצג עוד",
    showLess: "הצג פחות",
    selectAll: "בחר הכל",
    deselectAll: "בטל בחירה מהכל",
    additionalTools: "כלים נוספים",
    topThree: "3 המובילים",
    averageTransaction: "עסקה ממוצעת",
    incomeExpensesTrend: "מגמת הכנסות והוצאות",
    topBusinesses: "בתי העסק המובילים",
    noResultsFound: "לא נמצאו תוצאות",
    tryDifferentSearch: "נסה חיפוש אחר או שנה את המסננים",
    items: "פריטים",
    totalItems: "סך פריטים",
    selectedItems: "פריטים נבחרים",
    dismiss: "סגור",
    retry: "נסה שוב",
    undo: "בטל",
    redo: "חזור",
    refreshData: "רענן נתונים"
  },
  navigation: {
    dashboard: "לוח בקרה",
    upload: "העלאת קבצים",
    transactions: "עסקאות",
    budget: "תקציב",
    categoryManagement: "ניהול קטגוריות",
    insights: "תובנות",
    forecast: "תחזית",
    peerComparison: "השוואת עמיתים",
    successStories: "סיפורי הצלחה",
    savings: "חיסכון",
    dataSnapshots: "גיבוי ושחזור", // הוספת תרגום
    menu: "תפריט",
    openMenu: "פתח תפריט",
    closeMenu: "סגור תפריט",
    version: "גרסה"
  },
  dashboard: {
    title: "לוח בקרה",
    subtitle: "סקירה כללית של המצב הפיננסי שלך",
    totalIncome: "סה\"כ הכנסות",
    totalExpenses: "סה\"כ הוצאות",
    netBalance: "יתרה נקייה",
    surplus: "עודף תקציבי",
    deficit: "גירעון תקציבי",
    fromLastPeriod: "מהתקופה הקודמת",
    comparedToPrevious: "בהשוואה לקודם",
    netBalanceDescription: "הפרש בין הכנסות להוצאות",
    expenseDistribution: "התפלגות הוצאות",
    incomeVsExpenses: "הכנסות מול הוצאות",
    incomeExpensesTrend: "מגמת הכנסות והוצאות לפי זמן",
    quickInsights: "תובנות מהירות",
    amount: "סכום",
    percentageOfExpenses: "אחוז מההוצאות",
    income: "הכנסות",
    expenses: "הוצאות",
    noExpensesToShow: "אין הוצאות להציג",
    noTransactionData: "אין נתוני עסקאות",
    expensesThisPeriod: "הוצאות בתקופה זו",
    increase: "עלייה",
    // comparedToPrevious: "בהשוואה לתקופה הקודמת", // This was moved and rephrased
    comparedTo: "בהשוואה ל",
    previousPeriod: "תקופה קודמת",
    budgetOverrun: "חריגה מתקציב ב",
    spent: "הוצא",
    of: "מתוך",
    overrun: "חריגה",
    unusualSpending: "הוצאה חריגה ב",
    viewAllInsights: "צפה בכל התובנות",
    selectPeriod: "בחר תקופה",
    nextPeriod: "תקופה הבאה",
    loading: "טוען...",
    welcomeTitle: "ברוכים הבאים למערכת הניהול הפיננסי",
    welcomeDescription: "התחל לנהל את הכספים שלך בצורה חכמה ויעילה",
    uploadTransactions: "העלה עסקאות",
    uploadDescription: "העלה קבצי בנק והתחל לעקוב אחר ההוצאות שלך",
    createBudget: "צור תקציב",
    budgetDescription: "הגדר תקציבים לקטגוריות שונות ועקוב אחר ההתקדמות",
    manageCategories: "נהל קטגוריות",
    categoriesDescription: "ארגן את העסקאות שלך עם קטגוריות מותאמות אישית",
    reloadData: "טען נתונים מחדש",
    backToOverview: "חזור לסקירה כללית",
    categoryDetail: "פירוט קטגוריה",
    generalSummary: "סיכום כללי",
    categorySummary: "סיכום קטגוריה: {{category}}",
    generalAnalysisDescription: "ניתוח פיננסי עבור {{period}}",
    categoryAnalysisDescription: "ניתוח קטגוריה {{category}} עבור {{period}}",
    backToGeneral: "חזור לכללי",
    categoryAmount: "סכום קטגוריה",
    filteredExpenses: "הוצאות מסוננות",
    transactionCount: "מספר עסקאות",
    averageTransaction: "עסקה ממוצעת",
    percentageOfTotal: "אחוז מסך הכל",
    percentageOfFilteredExpenses: "אחוז מההוצאות המסוננות",
    budget: "תקציב",
    topBusinesses: "עסקים מובילים",
    topThree: "(3 הראשונים)",
    andMoreBusinesses: "ועוד {{count}} עסקים נוספים",
    ofAmount: "מהסכום",
    recentTransactionsFromTopBusinesses: "עסקאות אחרונות מעסקים מובילים",
    selectedCategories: "{{count}} קטגוריות נבחרות",
    monthlyTrend: {
      title: "מגמה חודשית",
      description: "מעקב אחר מגמת ההוצאות בחודשים האחרונים",
      noData: "אין נתונים להציג"
    },
    topCategories: {
      title: "קטגוריות מובילות",
      description: "5 הקטגוריות עם ההוצאות הגבוהות ביותר",
      noData: "אין נתונים להציג"
    },
  },
  transactions: {
    title: "עסקאות",
    subtitle: "נהל ועקוב אחר כל העסקאות שלך",
    addTransaction: "הוסף עסקה",
    exportCSV: "ייצא ל-CSV",
    findDuplicates: "מצא כפילויות",
    duplicateManagement: "ניהול כפילויות",

    filters: {
      title: "מסננים",
      search: "חיפוש",
      searchPlaceholder: "חפש עסקאות...",
      categories: "קטגוריות",
      allCategories: "כל הקטגוריות",
      clearCategories: "נקה קטגוריות",
      startDate: "תאריך התחלה",
      endDate: "תאריך סיום",
      type: "סוג עסקה",
      allTypes: "כל הסוגים",
      expenses: "הוצאות",
      income: "הכנסות",
      showing: "מציג",
      results: "תוצאות",
      clearAll: "נקה הכל"
    },

    duplicates: {
      title: "ניהול כפילויות",
      subtitle: "מצא וטפל בעסקאות כפולות במערכת",
      manageTitle: "ניהול כפילויות עסקאות",
      analysisComplete: "ניתוח הכפילויות הושלם",
      foundGroups: "נמצאו {{count}} קבוצות כפילויות",
      totalDuplicates: "סה\"כ {{count}} עסקאות כפולות",
      noduplicatesFound: "לא נמצאו כפילויות",
      noduplicatesDescription: "כל העסקאות שלך ייחודיות",
      processing: "מעבד נתונים ומחפש כפילויות...",
      analyzingTransactions: "מנתח עסקאות",
      findingPatterns: "מוצא דפוסים",
      groupingSimilar: "מקבץ עסקאות דומות",
      analyzingComplete: "ניתוח הושלם",
      keepOriginal: "שמור מקורי",
      deleteTransaction: "מחק עסקה",
      markAsReviewed: "סמן כנבדק",
      selectAction: "בחר פעולה",
      confidence: "רמת ביטחון",
      high: "גבוהה",
      medium: "בינונית",
      low: "נמוכה",
      reasons: "סיבות להתאמה",
      exactMatch: "התאמה מדויקת",
      dateProximity: "תאריכים קרובים",
      amountMatch: "סכום זהה",
      businessSimilarity: "בית עסק דומה",
      applyActions: "החל פעולות",
      actionsApplied: "הפעולות בוצעו בהצלחה",
      group: "קבוצה",
      transaction: "עסקה",
      date: "תאריך",
      business: "בית עסק",
      amount: "סכום",
      action: "פעולה",
      backToTransactions: "חזור לעסקאות"
    },

    table: {
      title: "רשימת עסקאות",
      selectAll: "בחר הכל",
      date: "תאריך",
      businessName: "שם העסק",
      category: "קטגוריה",
      amount: "סכום",
      type: "סוג",
      actions: "פעולות",
      income: "הכנסה",
      expense: "הוצאה",
      noData: "לא נמצאו עסקאות",
      selectTransactionAria: "בחר עסקה {{id}}",
      editTransactionAria: "ערוך עסקה {{id}}"
    },
    bulkActions: {
      selectedCount: "נבחרו {{count}} עסקאות",
      categorize: "סווג",
      delete: "מחק נבחרות",
      confirmDelete: "האם אתה בטוח שברצונך למחוק {{count}} עסקאות?",
      categorizeSuccess: "{{count}} עסקאות סווגו בהצלחה תחת '{{categoryName}}'",
      deleteSuccess: "{{count}} עסקאות נמחקו בהצלחה"
    },
    pagination: {
      showing: "מציג",
      totalShowing: "מציג"
    },
    confirmDelete: "האם אתה בטוח שברצונך למחוק עסקה זו?",
    modal: {
      addTitle: "הוסף עסקה חדשה",
      editTitle: "ערוך עסקה",
      addDescription: "הזן את פרטי העסקה החדשה",
      editDescription: "ערוך את פרטי העסקה",
      fields: {
        date: "תאריך",
        businessName: "שם העסק",
        category: "קטגוריה",
        amount: "סכום",
        type: "סוג עסקה",
        details: "פרטים נוספים"
      },
      types: {
        expense: "הוצאה",
        income: "הכנסה"
      },
      placeholders: {
        businessName: "הזן שם העסק...",
        amount: "הזן סכום...",
        details: "פרטים נוספים (אופציונלי)..."
      },
      actions: {
        cancel: "בטל",
        save: "שמור עסקה",
        update: "עדכן עסקה"
      }
    },
    messages: {
      loadingError: "שגיאה בטעינת העסקאות",
      transactionAdded: "העסקה נוספה בהצלחה",
      transactionUpdated: "העסקה עודכנה בהצלחה",
      transactionDeleted: "העסקה נמחקה בהצלחה",
      savingError: "שגיאה בשמירת העסקה",
      deletingError: "שגיאה במחיקת העסקה"
    },
    empty: {
      title: "אין עסקאות עדיין",
      description: "התחל על ידי הוספת עסקה ראשונה או העלאת קובץ CSV",
      addFirst: "הוסף עסקה ראשונה",
      uploadFile: "העלה קובץ"
    }
  },
  budget: {
    title: "תקציב",
    subtitle: "נהל ועקוב אחר התקציבים שלך",
    createBudget: "צור תקציב",
    editBudget: "ערוך תקציב",
    budgetList: "רשימת תקציבים",
    noBudgets: "אין תקציבים",
    noBudgetsDescription: "צור תקציב ראשון כדי להתחיל לעקוב אחר ההוצאות שלך",
    createFirstBudget: "צור תקציב ראשון",
    selectCategory: "בחר קטגוריה",
    budgetAmount: "סכום התקציב",
    budgetPeriod: "תקופת התקציב",
    selectPeriod: "בחר תקופה",
    startDate: "תאריך התחלה",
    budgetProgress: "התקדמות התקציב",
    spentAmount: "סכום שהוצא",
    remainingAmount: "סכום נותר",
    transactionsThisPeriod: "עסקאות בתקופה זו",
    budgetExists: "כבר קיים תקציב עבור קטגוריה זו",
    budgetCreated: "התקציב נוצר בהצלחה",
    budgetUpdated: "התקציב עודכן בהצלחה",
    budgetDeleted: "התקציב נמחק בהצלחה",
    confirmDelete: "האם אתה בטוח שברצונך למחוק תקציב זה?",
    overBudget: "חריגה מהתקציב",
    warning: "אזהרה",
    onTrack: "במסלול נכון",
    budgetSet: "תקציב נקבע",
    periods: {
      monthly: "חודשי",
      quarterly: "רבעוני",
      yearly: "שנתי"
    },
    budgetForm: {
      categoryRequired: "יש לבחור קטגוריה",
      amountRequired: "יש להזין סכום תקציב",
      periodRequired: "יש לבחור תקופת תקציב"
    },
    overview: {
      totalBudgeted: "סך התקציב",
      totalSpent: "סך ההוצאות",
      remainingBudget: "תקציב נותר",
      budgetUtilization: "ניצול התקציב",
      categoriesOverBudget: "קטגוריות שחרגו"
    }
  },
  categories: {
    title: "ניהול קטגוריות",
    subtitle: "נהל קטגוריות וחוקי סיווג אוטומטי",
    allCategories: "כל הקטגוריות",
    expenseCategories: "קטגוריות הוצאה",
    incomeCategories: "קטגוריות הכנסה",
    addCategory: "הוסף קטגוריה",
    categoryName: "שם הקטגוריה",
    categoryNamePlaceholder: "הזן שם קטגוריה...",
    categoryNameTooShort: "שם הקטגוריה חייב להכיל לפחות 2 תווים",
    categoryType: "סוג קטגוריה",
    selectType: "בחר סוג",
    categoryIcon: "סמל קטגוריה",
    selectIcon: "בחר סמל",
    iconRequired: "יש לבחור סמל",
    preview: "תצוגה מקדימה",
    expense: "הוצאה",
    income: "הכנסה",
    selectCategory: "בחר קטגוריה",
    createCategory: "צור קטגוריה",
    updateCategory: "עדכן קטגוריה",
    empty: {
      title: "אין קטגוריות",
      description: "צור קטגוריה ראשונה כדי להתחיל לארגן את העסקאות שלך",
      addFirst: "צור קטגוריה ראשונה"
    },
    table: {
      name: "שם",
      type: "סוג",
      icon: "סמל",
      transactionCount: "מספר עסקאות",
      actions: "פעולות"
    },
    form: {
      addTitle: "הוסף קטגוריה חדשה",
      editTitle: "ערוך קטגוריה"
    },
    messages: {
      categoryAdded: "הקטגוריה נוספה בהצלחה",
      categoryUpdated: "הקטגוריה עודכנה בהצלחה",
      categoryDeleted: "הקטגוריה נמחקה בהצלחה",
      categoryInUse: "לא ניתן למחוק קטגוריה שבשימוש בעסקאות"
    },
    dialogs: {
      deleteCategory: "מחק קטגוריה",
      deleteCategoryDescription: "האם אתה בטוח שברצונך למחוק את הקטגוריה '{{name}}'?",
      cancel: "ביטול",
      delete: "מחק"
    },
    rules: {
      title: "חוקי סיווג אוטומטי",
      subtitle: "הגדר חוקים לסיווג אוטומטי של עסקאות",
      addRule: "הוסף חוק",
      businessPattern: "תבנית שם בית עסק",
      patternPlaceholder: "לדוגמה: *סופר*",
      category: "קטגוריה",
      patternRequired: "יש להזין תבנית",
      categoryRequired: "יש לבחור קטגוריה",
      patternHelp: "השתמש ב-* עבור כל טקסט",
      deleteRule: "מחק חוק",
      deleteRuleDescription: "האם אתה בטוח שברצונך למחוק את החוק עבור התבנית '{{pattern}}'?",
      empty: {
        title: "אין חוקי סיווג",
        description: "צור חוקים לסיווג אוטומטי של עסקאות חדשות"
      },
      table: {
        pattern: "תבנית",
        category: "קטגוריה",
        actions: "פעולות"
      },
      form: {
        title: "הוסף חוק סיווג",
        editTitle: "ערוך חוק סיווג",
        description: "חוקי הסיווג מאפשרים לסווג עסקאות חדשות באופן אוטומטי",
        patternHelp: "השתמש ב-* לציון כל טקסט. לדוגמה: *סופר* יתאים לכל שם שמכיל את המילה 'סופר'",
        examples: {
          title: "דוגמאות לתבניות",
          supermarket: "*סופר* - יתאים לכל סופרמרקט",
          gas: "*דלק* - יתאים לתחנות דלק",
          pharmacy: "*בית מרקחת* - יתאים לבתי מרקחת"
        }
      },
      messages: {
        ruleAdded: "החוק נוסף בהצלחה",
        ruleUpdated: "החוק עודכן בהצלחה",
        ruleDeleted: "החוק נמחק בהצלחה"
      }
    }
  },
  insights: {
    title: "תובנות פיננסיות",
    subtitle: "תובנות מותאמות אישית על בסיס הנתונים הפיננסיים שלך",
    currentPeriod: "נוכחי",
    historicalPeriod: "תקופה היסטורית",
    checkAgain: "בדוק שוב",
    refreshInsights: "רענן תובנות",
    loading: {
      prerequisites: "טוען נתונים בסיסיים...",
      analyzing: "מנתח נתונים פיננסיים...",
    },
    generating: {
      title: "מייצר תובנות פיננסיות חכמות",
      description: "זה עלול לקחת מספר שניות..."
    },
    timePeriods: {
      monthly: "חודשי",
      quarterly: "רבעוני",
      yearly: "שנתי",
      all: "כל התקופות"
    },
    filters: {
      filterBy: "סנן לפי",
      allUrgency: "כל הדחיפויות",
      highUrgency: "דחיפות גבוהה",
      mediumUrgency: "דחיפות בינונית",
      lowUrgency: "דחיפות נמוכה",
      allTypes: "כל הסוגים",
      spending: "הוצאות",
      budget: "תקציב",
      trend: "מגמות",
      general: "כללי",
      showing: "מציג",
      results: "תוצאות"
    },
    urgency: {
      high: "דחיפות גבוהה",
      medium: "דחיפות בינונית",
      low: "דחיפות נמוכה"
    },
    types: {
      spending: "הוצאות",
      budget: "תקציב",
      trend: "מגמות",
      general: "כללי"
    },
    card: {
      noTitle: "ללא כותרת",
      noDescription: "ללא תיאור",
      recommendation: "המלצה",
      potentialImpact: "השפעה פוטנציאלית",
      clickToExpand: "לחץ להרחבה",
      errorLoading: "שגיאה בטעינת התובנה"
    },
    noData: {
      title: "אין מספיק נתונים",
      description: "נדרשים לפחות 10 עסקאות ו-3 קטגוריות כדי ליצור תובנות משמעותיות",
      uploadTransactions: "העלה עסקאות",
      manageCategories: "נהל קטגוריות"
    },
    noNewInsights: {
      title: "אין תובנות חדשות",
      description: "לא נמצאו תובנות חדשות עבור התקופה שנבחרה"
    },
    noFilterMatch: {
      title: "אין תוצאות מתאימות",
      description: "לא נמצאו תובנות העונות על הסינון שנבחר"
    },
    errors: {
      loadingData: "שגיאה בטעינת הנתונים",
      loadingDataTitle: "שגיאה בטעינה",
      tryRefresh: "נסה לרענן את הדף"
    },
    error: {
      title: "שגיאה ביצירת תובנות",
      tryAgain: "נסה שוב"
    }
  },
  forecast: {
    title: "תחזית פיננסית",
    subtitle: "צפה בתחזיות לעתיד הפיננסי שלך על בסיס נתונים היסטוריים",
    noData: {
      title: "אין נתונים מספיקים לתחזית",
      description: "הוסף עסקאות נוספות כדי לקבל תחזית פיננסית מדויקת"
    },
    configuration: {
      title: "הגדרות תחזית",
      period: "תקופת תחזית",
      method: "שיטת תחזית",
      growthRate: "שיעור גידול מותאם אישית (%)",
      periods: {
        "3months": "3 חודשים",
        "6months": "6 חודשים",
        "12months": "12 חודשים",
        "24months": "24 חודשים"
      },
      methods: {
        average: "ממוצע היסטורי",
        trend: "ניתוח מגמות",
        custom: "שיעור גידול מותאם אישית"
      }
    },
    summary: {
      totalIncome: "סך הכנסות צפויות",
      totalExpenses: "סך הוצאות צפויות",
      totalSavings: "סך חיסכון צפוי",
      savingsRate: "שיעור חיסכון צפוי"
    },
    charts: {
      title: "גרפי תחזית",
      tabs: {
        overview: "סקירה כללית",
        trends: "מגמות חיסכון",
        categories: "תחזית לפי קטגוריות"
      },
      income: "הכנסות",
      expenses: "הוצאות",
      savings: "חיסכון",
      categoryDistribution: "התפלגות קטגוריות",
      categoryForecast: "תחזית לפי קטגוריה",
      growth: "גידול"
    },
    insights: {
      title: "תובנות תחזית",
      lowSavings: {
        title: "שיעור חיסכון נמוך",
        description: "התחזית מראה שיעור חיסכון נמוך מ-10%. שקול להפחית הוצאות או להגדיל הכנסות."
      },
      goodSavings: {
        title: "שיעור חיסכון מצוין",
        description: "התחזית מראה שיעור חיסכון גבוה מ-20%. המשך לשמור על הרגלים פיננסיים טובים!"
      },
      increasingExpenses: {
        title: "הוצאות הולכות וגדלות",
        description: "זוהו קטגוריות עם מגמת גידול גבוהה בהוצאות. שקול לעקוב ולפקח על הקטגוריות הבאות:"
      }
    },
    errors: {
      generationFailed: "שגיאה ביצירת התחזית. נסה שוב מאוחר יותר."
    }
  },
  peerComparison: {
    title: "השוואה מתקדמת לעמיתים",
    subtitle: "השוואה מבוססת נתונים אמיתיים של הלשכה המרכזית לסטטיסטיקה ובנק ישראל",
    profileSelection: {
      title: "בחר קבוצת השוואה מדויקת",
      description: "ההשוואה מבוססת על נתונים אמיתיים מהלשכה המרכזית לסטטיסטיקה ובנק ישראל",
      dataSource: "מקור הנתונים",
      sampleSize: "גודל המדגם",
      participants: "משתתפים",
      age: "גיל",
      avgIncome: "הכנסה ממוצעת"
    },
    overallScore: {
      title: "הציון הפיננסי שלך מול הקבוצה",
      refreshComparison: "רענן השוואה",
      comparedTo: "השוואה לקבוצת",
      scoreLevel: {
        excellent: "מעולה",
        veryGood: "טוב מאוד",
        good: "טוב",
        average: "ממוצע",
        needsImprovement: "זקוק לשיפור"
      }
    },
    radarChart: {
      title: "פרופיל הוצאות - השוואה ויזואלית מתקדמת",
      description: "ההשוואה מציגה את הסככום והאחוז המדויק, ללא הגבלה. 100% = ממוצע הקבוצה",
      yourSpending: "ההוצאות שלך",
      groupAverage: "ממוצע הקבוצה (100%)"
    },
    summaryStats: {
      title: "נתונים כלליים ומיקום בקבוצה",
      monthlyIncome: "הכנסות חודשיות",
      savingsRate: "שיעור חיסכון",
      recommendedTarget: "יעד מומלץ",
      statisticalAnalysis: "ניתוח סטטיסטי מתקדם",
      averageStandardDeviation: "סטיית תקן ממוצעת",
      categoriesAboveAverage: "מספר קטגוריות מעל הממוצע",
      maximumDeviation: "חריגה מקסימלית",
      groupAverage: "ממוצע קבוצה"
    },
    categoryComparison: {
      title: "השוואה מפורטת לפי קטגוריות",
      description: "השוואה מדויקת מול נתוני",
      sampleNote: "מדגם של",
      yourExpense: "ההוצאה שלך",
      groupAverage: "ממוצע הקבוצה",
      difference: "הפרש",
      zScore: "Z-Score",
      relativeToAverage: "ההוצאה שלך יחסית לממוצע הקבוצה",
      viewTransactions: "צפה בעסקאות",
      status: {
        excellent: "מעולה",
        good: "טוב",
        average: "ממוצע",
        needsAttention: "זקוק לתשומת לב"
      }
    },
    recommendations: {
      title: "המלצות מבוססות נתונים",
      overspending: "חריגה ב{{category}} - {{percentage}}% מעל הממוצע",
      overspendingDescription: "אתה מוציא {{amount}} יותר מהממוצע של הקבוצה. ממוצע הקבוצה: {{average}} (Z-Score: {{zScore}})",
      improveSavings: "שפר את שיעור החיסכון",
      improveSavingsDescription: "שיעור החיסכון שלך הוא {{rate}}%. מומלץ לחסוך לפחות 20% מההכנסות החודשיות.",
      excellentPerformance: "ביצוע מצוין ב{{category}}!",
      excellentDescription: "אתה מוציא {{amount}} פחות מהממוצע של הקבוצה ({{percentage}}% פחות)."
    },
    transactionDialog: {
      title: "עסקאות בקטגוריה",
      description: "רשימת כל העסקאות שנכללו בחישוב עבור קטגוריה זו בחודש שעבר",
      totalTransactions: "סה\"כ {{count}} עסקאות",
      totalAmount: "סכום כולל",
      downloadCsv: "הורד כ-CSV",
      table: {
        date: "תאריך",
        business: "בית עסק",
        amount: "סכום",
        systemCategory: "קטגוריה במערכת",
        details: "פרטים",
        uncategorized: "לא מסווג"
      },
      noTransactions: "לא נמצאו עסקאות בקטגוריה זו"
    },
    categories: {
      food: "מזון ומשקאות",
      transportation: "תחבורה",
      entertainment: "בילויים ופנאי",
      shopping: "קניות כלליות",
      housing: "דיור והוצאות בית",
      health: "בריאות וטיפוח",
      education: "חינוך והשכלה",
      miscellaneous: "שונות",
      foodShort: "מזון",
      housingShort: "דיור",
      entertainmentShort: "בילויים",
      shoppingShort: "קניות",
      healthShort: "בריאות",
      educationShort: "חינוך"
    },
    profiles: {
      young_professional_tlv: "אנשי מקצוע צעירים - תל אביב",
      young_professional_general: "אנשי מקצוע צעירים - כלל הארץ",
      family_with_children: "משפחות עם ילדים",
      seniors: "גיל הזהב (65+)"
    },
    loading: "טוען השוואה מתקדמת לעמיתים..."
  },
  successStories: {
    title: "סיפורי הצלחה פיננסיים",
    subtitle: "השראה אמיתית מאנשים שהצליחו לשפר את המצב הכספי שלהם",
    tabs: {
      stories: "סיפורי הצלחה",
      myProgress: "ההתקדמות שלי",
      tips: "טיפים מעשיים",
      motivation: "השראה יומית"
    },
    stories: {
      title: "סיפורי הצלחה אמיתיים מישראל",
      description: "אנשים אמיתיים שהצליחו לשנות את המצב הכספי שלהם",
      readMore: "קרא עוד",
      readLess: "קרא פחות",
      categories: {
        debt: "פירעון חובות",
        savings: "חיסכון",
        investment: "השקעות",
        budgeting: "תקצוב",
        career: "קריירה",
        business: "עסקים"
      },
      filterBy: "סנן לפי קטגוריה",
      allCategories: "כל הקטגוריות",
      timeframe: "מסגרת זמן",
      outcome: "התוצאה",
      challenge: "האתגר",
      solution: "הפתרון",
      result: "התוצאה הסופית",
      lessonLearned: "הלקח הנלמד",
      months: "חודשים",
      years: "שנים",
      inspiration: {
        title: "מה שאפשר ללמוד מהסיפור הזה",
        takeaway: "המסקנה המרכזית"
      }
    },
    myProgress: {
      title: "המסע הפיננסי שלך",
      description: "עקוב אחר ההתקדמות שלך ותחגוג את ההישגים",
      startDate: "תאריך התחלה",
      currentStatus: "מצב נוכחי",
      achievements: "הישגים",
      nextGoals: "יעדים הבאים",
      milestones: {
        title: "אבני דרך חשובות",
        firstBudget: "תקציב ראשון נוצר",
        firstSavings: "חיסכון ראשון הושג",
        debtReduction: "הקטנת חובות",
        emergencyFund: "קרן חירום הוקמה",
        investmentStart: "התחלת השקעות",
        financialGoals: "השגת יעדים פיננסיים"
      },
      metrics: {
        monthsTracking: "חודשי מעקב",
        totalSaved: "סך החיסכון",
        debtReduced: "חובות שהופחתו",
        budgetSuccess: "הצלחה בתקציב",
        savingsRate: "שיעור חיסכון"
      },
      encouragement: {
        title: "דברי עידוד",
        justStarted: "מעולה! התחלת את המסע הפיננסי שלך",
        makingProgress: "אתה עושה התקדמות נהדרת!",
        onTrack: "אתה בדרך הנכונה להשגת היעדים",
        excellent: "הישגים מרשימים! המשך כך!"
      },
      noData: {
        title: "התחל את המסע הפיננסי שלך",
        description: "צור תקציב ראשון והתחל לעקוב אחר העסקאות שלך",
        cta: "צור תקציב עכשיו"
      }
    },
    tips: {
      title: "טיפים מעשיים לניהול כספי",
      description: "עצות מוכחות מאנשים שהצליחו לשפר את המצב הפיננסי שלהם",
      categories: {
        budgeting: "תקצוב",
        saving: "חיסכון",
        debt: "ניהול חובות",
        investing: "השקעות",
        mindset: "גישה נפשית"
      },
      difficulty: {
        beginner: "מתחיל",
        intermediate: "בינוני",
        advanced: "מתקדם"
      },
      timeToImplement: "זמן יישום",
      potentialSavings: "חיסכון פוטנציאלי",
      tipDetails: {
        overview: "סקירה",
        steps: "שלבי יישום",
        benefits: "יתרונות",
        commonMistakes: "טעויות נפוצות"
      },
      budgetingTips: [
        {
          title: "כלל 50/30/20",
          description: "חלק את ההכנסות: 50% צרכים, 30% רצונות, 20% חיסכון",
          difficulty: "beginner",
          timeToImplement: "שבוע אחד",
          potentialSavings: "עד 20% מההכנסות"
        },
        {
          title: "תקציב אפס",
          description: "כל שקל צריך לקבל יעד מראש",
          difficulty: "intermediate",
          timeToImplement: "חודש אחד",
          potentialSavings: "עד 15% מההכנסות"
        }
      ],
      savingTips: [
        {
          title: "חיסכון אוטומטי",
          description: "הגדר העברה אוטומטית לחיסכונות בתחילת כל חודש",
          difficulty: "beginner",
          timeToImplement: "יום אחד",
          potentialSavings: "10-20% מההכנסות"
        },
        {
          title: "אתגר 52 שבועות",
          description: "חסוך בשבוע הראשון ₪1, בשני ₪2, וכן הלאה",
          difficulty: "beginner",
          timeToImplement: "שנה שלמה",
          potentialSavings: "₪1,378 בשנה"
        }
      ],
      debtTips: [
        {
          title: "שיטת כדור השלג",
          description: "פרע תחילה את החוב הקטן ביותר, אז עבור לבא בתור",
          difficulty: "intermediate",
          timeToImplement: "תלוי בחובות",
          potentialSavings: "חיסכון בריבית"
        }
      ],
      investingTips: [
        {
          title: "השקעה הדרגתית",
          description: "השקע סכום קבוע כל חודש ללא קשר למצב השוק",
          difficulty: "intermediate",
          timeToImplement: "מתמיד",
          potentialSavings: "תשואה ארוכת טווח"
        }
      ],
      mindsetTips: [
        {
          title: "ויזואליזציה של יעדים",
          description: "צור תמונה ברורה של היעדים הפיננסיים שלך",
          difficulty: "beginner",
          timeToImplement: "שעה אחת",
          potentialSavings: "מוטיבציה גבוהה יותר"
        }
      ]
    },
    motivation: {
      title: "השראה יומית",
      description: "ציטוטים ומחשבות מעוררות השראה למסע הפיננסי שלך",
      quoteOfTheDay: "ציטוט היום",
      financialWisdom: "חוכמה פיננסית",
      categories: {
        success: "הצלחה",
        persistence: "התמדה",
        planning: "תכנון",
        discipline: "משמעת",
        wealth: "עושר",
        mindset: "גישה"
      },
      quotes: [
        {
          quote: "עושר אינו מגיע מהכנסה גבוהה, אלא מהוצאות נמוכות יחסית להכנסה",
          author: "רוברט קיוסאקי",
          category: "wealth"
        },
        {
          quote: "זה לא כמה שאתה מרוויח, אלא כמה שאתה חוסך",
          author: "וורן באפט",
          category: "success"
        },
        {
          quote: "הצעד הראשון לקראת עושר הוא חיסכון",
          author: "בנג'מין פרנקלין",
          category: "planning"
        },
        {
          quote: "משמעת עצמית היא הבסיס של כל הישג",
          author: "ג'ים רון",
          category: "discipline"
        },
        {
          quote: "הזמן הטוב ביותר לשתול עץ היה לפני 20 שנה. הזמן השני הטוב ביותר הוא עכשיו",
          author: "פתגם סיני",
          category: "persistence"
        }
      ],
      dailyChallenge: {
        title: "האתגר היומי",
        description: "אתגר קטן שיכול לשפר את המצב הפיננסי שלך היום",
        challenges: [
          "בדוק את יתרת החשבון שלך ורשום את ההוצאות של היום",
          "מצא הוצאה אחת שאתה יכול לחסוך עליה השבוע",
          "קבע יעד חיסכון קטן לחודש הבא",
          "בדוק אם יש לך מנויים שאתה לא משתמש בהם",
          "חשב על דרך להגדיל את ההכנסות שלך",
          "קרא מאמר אחד על השקעות או ניהול כספי"
        ]
      },
      weeklyGoal: {
        title: "יעד השבוע",
        description: "יעד פיננסי קטן להשבוע הקרוב"
      }
    },
    common: {
      readMore: "קרא עוד",
      readLess: "קרא פחות",
      share: "שתף",
      save: "שמור",
      like: "אהבתי",
      comment: "הוסף תגובה",
      filterBy: "סנן לפי",
      sortBy: "מיין לפי",
      newest: "הכי חדש",
      oldest: "הכי ישן",
      mostPopular: "הכי פופולרי",
      relevance: "רלוונטיות",
      difficulty: "רמת קושי",
      timeRequired: "זמן נדרש",
      potentialImpact: "השפעה פוטנציאלית",
      getStarted: "התחל עכשיו",
      learnMore: "למד עוד",
      apply: "יישם",
      bookmark: "שמור למועדפים"
    }
  },
  savings: {
    title: "חיסכון ותכנון פיננסי",
    subtitle: "כלים מתקדמים לתכנון חיסכון וניהול כספי חכם",
    tabs: {
      emergencyFund: "קרן חירום",
      budgetRule: "כלל 50/30/20",
      savingsGoals: "יעדי חיסכון",
      financialHealth: "בריאות פיננסית",
      compoundInterest: "ריבית דריבית"
    },
    emergencyFund: {
      title: "מחשבון קרן חירום",
      description: "חשב כמה כסף צריך להיות לך בקרן החירום ותכנן איך להגיע ליעד",
      currentSavings: "חיסכון נוכחי לקרן חירום",
      currentSavingsPlaceholder: "הזן סכום נוכחי...",
      monthlyExpenses: "הוצאות חודשיות ממוצעות",
      monthlyExpensesPlaceholder: "הוצאות ממוצעות לחודש...",
      targetMonths: "מספר חודשים לכיסוי",
      targetMonthsDescription: "בדרך כלל מומלץ 3-6 חודשים",
      calculate: "חשב קרן חירום",
      calculating: "מחשב...",
      results: {
        title: "תוצאות חישוב קרן חירום",
        targetAmount: "סכום יעד לקרן חירום",
        currentStatus: "מצב נוכחי",
        monthsToGoal: "חודשים ליעד",
        monthlySavingsNeeded: "חיסכון חודשי נדרש",
        status: {
          excellent: "מעולה! יש לך קרן חירום מלאה",
          good: "טוב! אתה בדרך הנכונה",
          needsImprovement: "זקוק לשיפור - התחל לחסוך עכשיו"
        }
      },
      recommendations: {
        title: "המלצות לקרן חירום",
        startNow: "התחל לחסוך עכשיו",
        startNowDescription: "גם סכום קטן כל חודש יכול לעזור",
        autoTransfer: "הגדר העברה אוטומטית",
        autoTransferDescription: "הגדר העברה חודשית אוטומטית לחיסכונות",
        separateAccount: "חשבון נפרד",
        separateAccountDescription: "שמור את קרן החירום בחשבון נפרד ונגיש"
      }
    },
    budgetRule: {
      title: "כלל 50/30/20 לתקצוב",
      description: "חלק את ההכנסות שלך לפי הכלל הזהוב: 50% צרכים, 30% רצונות, 20% חיסכון",
      monthlyIncome: "הכנסה חודשית נטו",
      monthlyIncomePlaceholder: "הכנסה נטו לאחר מיסים...",
      currentNeeds: "הוצאות נוכחיות על צרכים (אופציונלי)",
      currentNeedsPlaceholder: "דיור, מזון, תחבורה...",
      currentWants: "הוצאות נוכחיות על רצונות (אופציונלי)",
      currentWantsPlaceholder: "בילויים, קניות, חופשות...",
      currentSavings: "חיסכון נוכחי (אופציונלי)",
      currentSavingsPlaceholder: "חיסכון והשקעות...",
      calculate: "חשב חלוקה לפי כלל 50/30/20",
      calculating: "מחשב...",
      results: {
        title: "החלוקה המומלצת לפי כלל 50/30/20",
        needs: "צרכים (50%)",
        needsDescription: "דיור, מזון, תחבורה, ביטוחים",
        wants: "רצונות (30%)",
        wantsDescription: "בילויים, אוכל בחוץ, קניות",
        savings: "חיסכון (20%)",
        savingsDescription: "חיסכונות, השקעות, פרעון חובות",
        comparison: "השוואה למצב הנוכחי"
      },
      status: {
        excellent: "מעולה! אתה עומד בכלל",
        good: "טוב! קרוב לכלל המומלץ",
        needsAdjustment: "זקוק להתאמה"
      },
      tips: {
        title: "טיפים ליישום כלל 50/30/20",
        trackExpenses: "עקוב אחר הוצאות",
        trackExpensesDescription: "רשום את ההוצאות שלך במשך חודש כדי לזהות דפוסים",
        reduceFees: "צמצם עמלות",
        reduceFeesDescription: "בדוק חשבונות בנק, ביטוחים ומנויים מיותרים",
        increaseIncome: "הגדל הכנסות",
        increaseIncomeDescription: "חפש דרכים להגדיל הכנסות או לשפר מיומנויות"
      }
    },
    savingsGoals: {
      title: "מעקב יעדי חיסכון",
      description: "הגדר ועקוב אחר יעדי החיסכון שלך",
      goalName: "שם היעד",
      goalNamePlaceholder: "למשל: רכב חדש, חופשה...",
      targetAmount: "סכום יעד",
      targetAmountPlaceholder: "כמה כסף אתה צריך...",
      currentSaved: "כבר נחסך",
      currentSavedPlaceholder: "כמה כבר חסכת...",
      targetDate: "תאריך יעד",
      targetDatePlaceholder: "מתי אתה רוצה להשיג את היעד...",
      monthlySavings: "חיסכון חודשי מתוכנן",
      monthlySavingsPlaceholder: "כמה תחסוך כל חודש...",
      calculate: "חשב תוכנית חיסכון",
      addGoal: "הוסף יעד חיסכון",
      results: {
        title: "תוכנית החיסכון שלך",
        timeToGoal: "זמן ליעד",
        monthlyRequired: "נדרש חיסכון חודשי",
        progress: "התקדמות",
        projectedCompletion: "צפוי להסתיים ב",
        onTrack: "בדרך ליעד!",
        behindSchedule: "מאחור בלוח הזמנים",
        aheadOfSchedule: "מקדים את לוח הזמנים",
        months: "חודשים",
        years: "שנים"
      }
    },
    financialHealth: {
      title: "ציון בריאות פיננסית",
      description: "קבל ציון מקיף על המצב הפיננסי שלך",
      calculate: "חשב ציון בריאות פיננסית",
      calculating: "מחשב ציון...",
      score: "הציון שלך",
      outOf: "מתוך 100",
      categories: {
        emergencyFund: "קרן חירום",
        debtToIncome: "יחס חוב להכנסה",
        savingsRate: "שיעור חיסכון",
        budgetAdherence: "עמידה בתקציב",
        diversification: "פיזור השקעות"
      },
      scoreRanges: {
        excellent: "מעולה (90-100)",
        excellentDescription: "המצב הפיננסי שלך יציב ובריא מאוד",
        good: "טוב (70-89)",
        goodDescription: "המצב הפיננסי שלך טוב עם מקום לשיפור קל",
        fair: "בינוני (50-69)",
        fairDescription: "יש צורך בשיפורים בניהול הכספי",
        poor: "זקוק לשיפור (0-49)",
        poorDescription: "דרושה תשומת לב דחופה למצב הפיננסי"
      },
      recommendations: {
        title: "המלצות לשיפור",
        buildEmergencyFund: "בנה קרן חירום",
        reduceDebt: "צמצם חובות",
        increaseSavings: "הגדל חיסכונות",
        stickToBudget: "עמוד בתקציב",
        diversifyInvestments: "פזר השקעות"
      }
    },
    compoundInterest: {
      title: "מחשבון ריבית דריבית",
      description: "ראה איך ההשקעות שלך יכולות לגדול עם הזמן",
      initialAmount: "סכום התחלתי",
      initialAmountPlaceholder: "סכום ההשקעה הראשוני...",
      monthlyContribution: "הפקדה חודשית",
      monthlyContributionPlaceholder: "כמה תוסיף כל חודש...",
      annualReturn: "תשואה שנתית משוערת (%)",
      annualReturnPlaceholder: "אחוז תשואה שנתי...",
      timeHorizon: "אופק זמן (שנים)",
      timeHorizonPlaceholder: "למשך כמה שנים...",
      calculate: "חשב צמיחה",
      calculating: "מחשב...",
      results: {
        title: "תוצאות ריבית דריבית",
        finalAmount: "סכום סופי",
        totalContributions: "סה\"כ הפקדות",
        totalInterest: "סה\"כ רווח מריבית",
        breakeven: "נקודת איזון",
        powerOfTime: "כוח הזמן",
        monthlyGrowth: "צמיחה חודשית ממוצעת"
      },
      chart: {
        title: "גרף צמיחת ההשקעה",
        contributions: "הפקדות",
        interest: "ריבית דריבית",
        total: "סך הכל"
      },
      tips: {
        title: "טיפים לריבית דריבית",
        startEarly: "התחל מוקדם",
        startEarlyDescription: "ככל שתתחיל מוקדם יותר, כך הריבית הדריבית תעבוד יותר לטובתך",
        consistentInvesting: "השקעה עקבית",
        consistentInvestingDescription: "השקעה קבועה כל חודש חשובה יותר מסכומים גדולים חד פעמיים",
        longTermThinking: "חשיבה ארוכת טווח",
        longTermThinkingDescription: "ככל שאופק הזמן ארוך יותר, כך השפעת הריבית הדריבית גדולה יותר"
      }
    },
    common: {
      backToOverview: "חזור לסקירה כללית",
      saveCalculation: "שמור חישוב",
      loadPreviousCalculation: "טען חישוב קודם",
      exportResults: "ייצא תוצאות",
      shareResults: "שתף תוצאות",
      calculationSaved: "החישוב נשמר בהצלחה",
      noDataAvailable: "אין נתונים זמינים",
      loadingCalculation: "טוען חישוב...",
      invalidInput: "נתונים לא תקינים",
      pleaseFillAllFields: "אנא מלא את כל השדות הנדרשים",
      resetForm: "אפס טופס",
      edit: "ערוך",
      delete: "מחק",
      confirm: "אשר"
    }
  },
  aiAssistant: {
    title: "עוזר פיננסי חכם",
    subtitle: "שאל שאלות על הנתונים הפיננסיים שלך",
    placeholder: "שאל אותי שאלה על הנתונים הפיננסיים שלך...",
    askQuestion: "שאל שאלה",
    processing: "מעבד...",
    suggestedQuestions: "שאלות מוצעות",
    recentQueries: "שאילתות אחרונות",
    clearChat: "נקה שיחה",
    copyMessage: "העתק הודעה",
    errorMessage: "אירעה שגיאה בעיבוד השאלה",
    welcomeMessage: "שלום! אני העוזר הפיננסי החכם שלך. שאל אותי כל שאלה על הנתונים הפיננסיים שלך!",
    categories: {
      spending: "הוצאות",
      income: "הכנסות",
      trends: "מגמות",
      budget: "תקציב"
    },
    queryTypes: {
      spending_analysis: "ניתוח הוצאות",
      income_analysis: "ניתוח הכנסות",
      trend_analysis: "ניתוח מגמות",
      budget_status: "סטטוס תקציב",
      category_summary: "סיכום קטגוריות",
      business_summary: "סיכום בתי עסק",
      transaction_count: "ספירת עסקאות",
      general_info: "מידע כללי"
    }
  },
  settings: {
    title: "הגדרות",
    subtitle: "נהל את העדפות המערכת שלך",
    settingsSaved: "ההגדרות נשמרו בהצלחה",
    general: "הגדרות כלליות",
    appearance: "מראה וממשק",
    notifications: "התראות",
    language: "שפה",
    selectLanguage: "בחר שפה",
    languageDescription: "שפת הממשק תשתנה לאחר שמירת ההגדרות",
    currencySettings: "הגדרות מטבע",
    selectCurrency: "בחר מטבע",
    currencyDescription: "מטבע זה יוצג בכל חלקי המערכת",
    dateFormatSettings: "הגדרות פורמט תאריך",
    selectDateFormat: "בחר פורמט תאריך",
    dateFormatDescription: "פורמט התאריכים בכל המערכת",
    timeZoneSettings: "הגדרות אזור זמן",
    selectTimeZone: "בחר אזור זמן",
    timeZoneDescription: "אזור הזמן לחישוב תאריכים ושעות",
    theme: "ערכת נושא",
    themeLight: "בהיר",
    themeDark: "כהה",
    themeAuto: "אוטומטי",
    themeDescription: "בחר את ערכת הנושא המועדפת עליך",
    fontSize: {
      title: "גודל גופן",
      small: "קטן",
      medium: "בינוני",
      large: "גדול",
      xlarge: "גדול מאוד"
    },
    accessibility: "נגישות",
    highContrast: "ניגודיות גבוהה",
    highContrastDescription: "הגדל את הניגודיות לקריאה טובה יותר",
    reducedMotion: "הפחתת תנועה",
    reducedMotionDescription: "הפחת אנימציות ותנועות במערכת",
    emailNotifications: "התראות אימייל",
    emailNotificationsDescription: "קבל התראות חשובות באימייל",
    pushNotifications: "התראות דחיפה",
    pushNotificationsDescription: "קבל התראות בדפדפן",
    smsNotifications: "התראות SMS",
    smsNotificationsDescription: "קבל התראות בהודעות טקסט",
    budgetAlerts: "התראות תקציב",
    budgetAlertsDescription: "התרע כאשר מתקרב לגבול התקציב",
    monthlyReports: "דוחות חודשיים",
    monthlyReportsDescription: "קבל סיכום חודשי של הפעילות הפיננסית",
    transactionAlerts: "התראות עסקאות",
    transactionAlertsDescription: "התרע על עסקאות חדשות שמתווספות",
    shareData: "שיתוף נתונים",
    shareDataDescription: "אפשר שיתוף נתונים אנונימיים לשיפור המערכת",
    analytics: "ניתוח שימוש",
    analyticsDescription: "אפשר איסוף נתוני שימוש לשיפור החוויה",
    cookiesConsent: "הסכמה לעוגיות",
    cookiesConsentDescription: "אפשר שימוש בעוגיות לשיפור הפונקציונליות",
    resetToDefaults: "אפס להגדרות ברירת מחדל",
    confirmReset: "האם אתה בטוח שברצונך לאפס את כל ההגדרות לברירת המחדל?",
    unsavedChanges: "יש לך שינויים שלא נשמרו. אל תשכח לשמור!",
    backup: {
      title: "ניהול גיבויים",
      subtitle: "נהל גיבויים ושחזור נתונים",
      createNow: "צור גיבוי עכשיו",
      creating: "יוצר גיבוי...",
      backupCreated: "הגיבוי נוצר בהצלחה",
      configurationSaved: "הגדרות הגיבוי נשמרו",
      backupDeleted: "הגיבוי נמחק בהצלחה",
      restoreCompleted: "השחזור הושלם בהצלחה",
      restoring: "משחזר נתונים...",
      status: {
        completed: "הושלם",
        failed: "נכשל",
        inProgress: "בביצוע"
      },
      method: {
        manual: "ידני",
        automatic: "אוטומטי"
      },
      table: {
        date: "תאריך",
        time: "שעה",
        method: "שיטה",
        status: "סטטוס",
        size: "גודל",
        retention: "תקופת שמירה",
        timeZone: "אזור זמן",
        actions: "פעולות"
      },
      automaticBackup: "גיבוי אוטומטי",
      enableAutoBackup: "הפעל גיבוי אוטומטי",
      autoBackupDescription: "צור גיבויים אוטומטיים לפי לוח הזמנים שהגדרת",
      frequency: "תדירות",
      scheduleTime: "שעת ביצוע",
      scheduleTimeDescription: "הגיבוי יתבצע בשעה זו מדי יום",
      timeZone: "אזור זמן",
      retentionPeriod: "תקופת שמירה",
      retentionDescription: "גיבויים יימחקו אוטומטית לאחר תקופה זו",
      frequencies: {
        daily: "יומי",
        weekly: "שבועי",
        monthly: "חודשי",
        yearly: "שנתי"
      },
      days: "ימים",
      totalBackups: "סה״כ גיבויים",
      successful: "מוצלחים",
      lastBackup: "גיבוי אחרון",
      noBackups: "אין גיבויים",
      noBackupsDescription: "עדיין לא נוצרו גיבויים במערכת",
      createFirstBackup: "צור גיבוי ראשון",
      backupHistory: "היסטוריית גיבויים",
      currentConfiguration: "הגדרה נוכחית",
      tabs: {
        backups: "גיבויים",
        settings: "הגדרות"
      },
      restore: "שחזר",
      confirmRestore: "אישור שחזור נתונים",
      restoreWarning: "פעולה זו תחליף את כל הנתונים הקיימים במערכת בנתונים מהגיבוי שנבחר. פעולה זו אינה ניתנת לביטוב.",
      backupDetails: "פרטי הגיבוי",
      entities: "ישויות",
      transactions: "עסקאות",
      categories: "קטגוריות",
      budgets: "תקציבים",
      confirmDelete: "אישור מחיקת גיבוי",
      deleteWarning: "האם אתה בטוח שברצונך למחוק גיבוי זה? פעולה זו אינה ניתנת לביטול.",
      messages: {
        backupCreated: "הגיבוי נוצר בהצלחה",
        backupDeleted: "הגיבוי נמחק בהצלחה",
        restoreCompleted: "השחזור הושלם בהצלחה. הדף יטען מחדש תוך רגעים ספורים.",
        configSaved: "הגדרות הגיבוי נשמרו בהצלחה"
      }
    },
    advanced: {
      title: "הגדרות מתקדמות",
      description: "פעולות מתקדמות שדורשות זהירות מיוחדת",
      cleanState: {
        sectionTitle: "איפוס למצב נקי",
        sectionDescription: "מחיקה מלאה של כל הנתונים והחזרה למצב התחלתי",
        button: "איפוס למצב נקי",
        title: "האם אתה בטוח?",
        description: "פעולה זו תמחק לצמיתות את כל הנתונים שלך ותחזיר את המערכת למצב התחלתי. לא ניתן לבטל פעולה זו!",
        warningTitle: "מה יימחק",
        warningHeader: "אזהרה חמורה:",
        warning1: "כל העסקאות והנתונים הפיננסיים",
        warning2: "כל הקטגוריות המותאמות אישית",
        warning3: "כל התקציבים וההגדרות",
        warning4: "כל חוקי הסיווג האוטומטי",
        warning5: "כל הגיבויים והדוחות השמורים",
        warning6: "כל ההעדפות האישיות",
        irreversibleWarning: "פעולה זו אינה ניתנת לביטול ולא ניתן לשחזר את הנתונים לאחר מכן!",
        typeToConfirm: "הקלד את הטקסט הבא כדי לאשר:",
        confirmationText: "מחק את כל הנתונים",
        confirmationLabel: "הקלד '{{requiredText}}' כדי לאשר:",
        confirmationPlaceholder: "הקלד כאן...",
        processing: "מבצע איפוס...",
        loadingButton: "מבצע איפוס...",
        confirmButton: "מחק הכל",
        successTitle: "איפוס בוצע בהצלחה",
        successDescription: "כל הנתונים נמחקו והמערכת אופסה למצב התחלתי",
        error: "שגיאה באיפוס",
        wrongConfirmation: "הטקסט שהקלדת אינו תואם",
        genericError: "אירעה שגיאה במהלך האיפוס"
      }
    },
    dialogs: {
      cancel: "ביטול",
      confirm: "אישור",
      cleanState: {
        title: "איפוס למצב נקי",
        warningHeader: "אזהרה חמורה:",
        warning1: "כל העסקאות והנתונים הפיננסיים ימחקו",
        warning2: "כל הקטגוריות המותאמות אישית ימחקו",
        warning3: "כל התקציבים וההגדרות ימחקו",
        warning4: "כל חוקי הסיווג האוטומטי ימחקו",
        warning5: "כל הגיבויים והדוחות השמורים ימחקו",
        warning6: "כל ההעדפות האישיות ימחקו",
        irreversibleWarning: "פעולה זו אינה ניתנת לביטול!",
        confirmationLabel: "הקלד '{{requiredText}}' כדי לאשר:",
        loadingButton: "מבצע איפוס...",
        confirmButton: "מחק הכל"
      }
    },
    tabs: {
      general: "כללי",
      appearance: "מראה",
      notifications: "התראות",
      backup: "גיבוי",
      advanced: "מתקדם",
      privacy: "פרטיות"
    }
  },
  upload: {
    title: "העלאת נתונים",
    subtitle: "העלה קבצי CSV לייבוא עסקאות",
    guide: {
      title: "מדריך העלאת קובץ CSV",
      step1: {
        number: "1",
        title: "הורד את קובץ התבנית",
        description: "השתמש בתבנית הקובץ שלנו הכוללת את העמודות הנדרשות",
        button: "הורד תבנית CSV",
        success: "תבנית הורדה בהצלחה",
        successDescription: "השתמש בתבנית זו עם כותרות באנגלית להכנת קובץ העסקאות שלך"
      },
      step2: {
        number: "2",
        title: "מלא את הנתונים בקובץ",
        description: "הזן את הנתונים בהתאם לפורמט הבא:",
        fields: {
          date: "תאריך: בפורמט YYYY-MM-DD (date)",
          businessName: "שם העסק: שם בית העסק או מקור ההכנסה (business_name)",
          amount: "סכום: הסכום הכולל של העסקה (amount)",
          description: "פירוט: מידע נוסף על העסקה - אופציונלי (description)"
        },
        note: "שימו לב: השתמשו בכותרות באנגלית בקובץ CSV (UTF-8 format): date, business_name, amount, description",
        autoDetect: "המערכת תדע לזהות באופן אוטומטי אם מדובר בהוצאה או הכנסה על בסיס נתונים אחרים."
      },
      step3: {
        number: "3",
        title: "העלה את הקובץ",
        description: "בחר את קובץ ה-CSV המוכן והמערכת תעבד אותו אוטומטית"
      }
    },
    dropZone: {
      title: "גרור קובץ לכאן או לחץ לבחירת קובץ",
      fileSelected: "קובץ נבחר:",
      processing: "מעבד...",
      processFile: "עבד קובץ"
    },
    categorization: {
      title: "סיווג עסקאות ({{count}})",
      tabs: {
        all: "הכל",
        categorized: "מסווגות",
        uncategorized: "לא מסווגות"
      },
      autoCategorizingProgress: "מבצע סיווג אוטומטי...",
      bulkCategorize: {
        title: "סיווג מהיר לכל העסקאות הלא מסווגות",
        description: "בחר קטגוריה לסיווג כל העסקאות שלא סווגו:"
      },
      table: {
        date: "תאריך",
        business: "בית עסק",
        amount: "סכום",
        type: "סוג",
        category: "קטגוריה",
        typeExpense: "הוצאה",
        typeIncome: "הכנסה",
        selectCategory: "בחר קטגוריה"
      },
      actions: {
        cancel: "בטל",
        save: "שמור עסקאות ({{count}})",
        saving: "שומר..."
      }
    },
    history: {
      title: "היסטוריית העלאות",
      table: {
        uploadDate: "תאריך העלאה",
        filename: "שם הקובץ",
        recordCount: "מספר רשומות",
        status: "סטטוס",
        details: "פרטים"
      },
      status: {
        success: "הצלחה מלאה",
        partial: "הצלחה חלקית",
        failed: "כשלון"
      },
      empty: {
        title: "אין היסטוריית העלאות",
        description: "העלאות קבצים חדשות יופיעו כאן"
      }
    },
    duplicates: {
      title: "נמצאו עסקאות שעשויות להיות כפולות",
      description: "נא לבחור כיצד לטפל בכל עסקה חדשה שזוהתה ככפילות אפשרית.",
      example: "לדוגמה, העסקה החדשה:",
      similarTo: "דומה לעסקה קיימת:",
      table: {
        date: "תאריך",
        business: "עסק",
        amount: "סכום",
        action: "פעולה"
      },
      actions: {
        add: "הוסף בכל זאת",
        skip: "דלג (כפילות)",
        skipAll: "דלג על כל הכפילויות",
        addAll: "הוסף את כל העסקאות",
        continue: "המשך עם הבחירות"
      }
    },
    messages: {
      fileProcessedSuccess: "הקובץ עובד בהצלחה",
      transactionsReady: "{{count}} עסקאות מוכנות לסיווג ושמירה.",
      invalidRecordsSkipped: "רשומות לא תקינות דולגו",
      skippedRecordsDescription: "{{count}} עסקאות דולגו עקב חוסר בנתונים קריטיים לאחר ניסיון עיבוד.",
      noValidTransactions: "לא נמצאו עסקאות תקינות בקובץ לאחר עיבוד הנתונים.",
      transactionsSaved: "העסקאות נשמרו בהצלחה",
      savedCount: "נשמרו {{count}} עסקאות.",
      duplicatesProcessed: "עיבוד כפילויות הושלם",
      duplicatesResult: "{{created}} עסקאות חדשות נוספו, {{skipped}} נבדקו/דולגו."
    },
    errors: {
      invalidFile: "קובץ לא תקין",
      invalidFileDescription: "נא לבחור קובץ CSV תקין להעלאה. ודא שהקובץ אינו ריק.",
      uploadFailed: "עיבוד הקובץ נכשל",
      timeout: "הפעולה ארכה זמן רב מדי. נא לנסות עם קובץ קטן יותר.",
      sqlError: "בעיה בעיבוד הקובץ. אנא השתמש בתבנית CSV שלנו עם כותרות באנגלית: date, business_name, amount, description.",
      noTransactions: "לא נמצאו עסקאות בקובץ. אנא ודא שהקובץ מכיל נתוני עסקאות בפורמט CSV עם כותרות באנגלית: date, business_name, amount, description.",
      retrying: "בעיה בעיבוד, מנסה שוב...",
      maxRetriesReached: "מספר הניסיונות המקסימלי הושג. אנא בדוק את פורמט הקובץ ונסה שוב.",
      generalError: "שגיאה כללית בעיבוד הקובץ"
    }
  },
  monthlyComparison: {
    weeklyComparison: "השוואה שבועית",
    monthlyComparison: "השוואה חודשית",
    quarterlyComparison: "השוואה רבעונית",
    yearlyComparison: "השוואה שנתית",
    weeklyDescription: "השוואת הוצאות והכנסות ל-6 השבועות האחרונים",
    monthlyDescription: "השוואת הוצאות והכנסות ל-6 החודשים האחרונים",
    quarterlyDescription: "השוואת הוצאות והכנסות ל-6 הרבעונים האחרונים",
    yearlyDescription: "השוואת הוצאות והכנסות ל-6 השנים האחרונות",
    exportToExcel: "ייצוא לאקסל",
    filterByCategory: "סינון הוצאות לפי קטגוריה",
    allExpenses: "כל ההוצאות",
    selectedCategory: "קטגוריה נבחרת",
    selectedCategoriesCount: "{{count}} קטגוריות נבחרות",
    period: "תקופה",
    income: "הכנסות",
    totalExpenses: "הוצאות (סה״כ)",
    selectedCategoriesExpense: "הוצאות קטגוריות נבחרות",
    balance: "יתרה"
  },
  categoryReport: {
    selectCategoryPrompt: "בחר קטגוריה לצפייה בסיכום.",
    totalExpenses: "סה״כ הוצאות בקטגוריה",
    transactionCount: "מספר עסקאות",
    averagePerTransaction: "ממוצע לעסקה",
    topExpensesDistribution: "התפלגות הוצאות עיקריות בקטגוריה",
    topBusinessesDescription: "תצוגה של 5 בתי העסק עם ההוצאה הגבוהה ביותר בקטגוריה זו.",
    transactionsForCategory: "עסקאות עבור {{category}}"
  },
  accessibility: {
    title: "נגישות",
    openPanel: "פתח פאנל נגישות",
    closePanel: "סגור פאנל נגישות",
    fontSize: "גודל גופן",
    small: "קטן",
    medium: "בינוני",
    large: "גדול",
    extraLarge: "גדול מאוד",
    letterSpacing: "ריווח אותיות",
    normal: "רגיל",
    increased: "מוגבר",
    wide: "רחב",
    displayMode: "מצב תצוגה",
    highContrast: "ניגודיות גבוהה",
    inverted: "הפוך",
    dark: "כהה",
    dyslexicFont: "גופן לדיסלקציה",
    reducedMotion: "הפחתת תנועה",
    highlightTitles: "הדגשת כותרות",
    highlightLinks: "הדגשת קישורים",
    readableFont: "גופן קריא",
    enabled: "מופעל",
    disabled: "מכובה",
    resetAll: "איפוס הכל"
  },
  weeklyMetrics: {
    title: "מדדי {{period}}",
    weeklyComparison: "השוואה שבועית",
    monthlyDescription: "מעקב אחר התקדמות התקציב החודשי",
    quarterlyDescription: "מעקב אחר התקדמות התקציב הרבעוני",
    yearlyDescription: "מעקב אחר התקדמות התקציב השנתי",
    weeklyDescription: "מעקב אחר התקדמות התקציב השבועי",
    budgetForPeriod: "תקציב לתקופה",
    totalBudget: "סה\"כ תקציב",
    spentSoFar: "הוצא עד כה",
    remaining: "נותר",
    used: "בשימוש",
    avgDailySpending: "הוצאה יומית ממוצעת",
    thisPeriod: "תקופה זו",
    budgetProgress: "התקדמות תקציב",
    forecastTitle: "תחזית",
    projectedTotal: "סה\"כ צפוי",
    estimatedBalance: "יתרה משוערת",
    dailyRecommendation: "המלצה יומית",
    recommendationNegative: "כדי להישאר בתקציב, הגבל הוצאות ל-{{amount}} ליום עד סוף ה{{period}}",
    recommendationAlreadyOver: "חרגת מהתקציב. שקול להתאים את ההוצאות לתקופה הבאה",
    recommendationPositive: "אתה בדרך הנכונה! המשך כך",
    onBudget: "בתקציב",
    nearLimit: "קרוב לגבול",
    overBudget: "חריגה מתקציב",
    ofBudgetUsed: "מהתקציב בשימוש",
    previousPeriod: "תקופה קודמת",
    nextPeriod: "תקופה הבאה"
  },
  periods: {
    weekly: "שבועי",
    monthly: "חודשי",
    quarterly: "רבעוני",
    yearly: "שנתי",
    quarterlyShort: "רבעון",
    currentWeek: "השבוע הנוכחי",
    currentMonth: "החודש הנוכחי",
    currentQuarter: "הרבעון הנוכחי",
    currentYear: "השנה הנוכחית",
    lastWeek: "השבוע שעבר",
    lastMonth: "החודש שעבר",
    lastQuarter: "הרבעון שעבר",
    lastYear: "השנה שעברה",
    thisWeek: "השבוע",
    thisMonth: "החודש",
    thisQuarter: "הרובע",
    thisYear: "השנה"
  },
  errors: {
    general: "אירעה שגיאה לא צפויה",
    network: "בעיית רשת - בדוק את החיבור לאינטרנט",
    loadingData: "שגיאה בטעינת הנתונים",
    savingData: "שגיאה בשמירת הנתונים",
    deletingData: "שגיאה במחיקת הנתונים",
    invalidInput: "קלט לא תקין",
    unauthorized: "אין הרשאה לבצע פעולה זו",
    notFound: "הפריט המבוקש לא נמצא",
    serverError: "שגיאת שרת פנימית",
    timeout: "הפעולה ארכה זמן רבה מדי",
    validationFailed: "שגיאת ולידציה",
    duplicateEntry: "רשומה כפולה",
    insufficientData: "אין מספיק נתונים",
    formatError: "שגיאת פורמט",
    uploadFailed: "העלאה נכשלה",
    downloadFailed: "הורדה נכשלה",
    processingFailed: "עיבוד נכשל",
    generatingInsights: "שגיאה ביצירת תובנות",
    categoryInUse: "הקטגוריה בשימוש ולא ניתן למחוק",
    budgetExists: "תקציב עבור קטגוריה זו כבר קיים"
  },
  app: {
    title: "ניהול פיננסי חכם"
  },
  additionalTools: "כלים נוספים",
  dataSnapshots: {
    title: "גיבוי ושחזור נתונים",
    subtitle: "נהל גיבויים של המידע שלך ושחזר מידע לנקודות זמן קודמות",
    createSnapshot: "צור גיבוי חדש",
    createSnapshotDescription: "הגיבוי יכלול את כל העסקאות, הקטגוריות, התקציבים וחוקי הסיווג שלך",
    snapshotTitle: "כותרת הגיבוי",
    snapshotDescription: "תיאור (אופציונלי)",
    retentionDays: "תקופת שמירה (ימים)",
    retentionNote: "הגיבוי יימחק אוטומטית אחרי {days} ימים",
    creating: "יוצר גיבוי...",
    restoring: "משחזר...",
    availableSnapshots: "גיבויים זמינים",
    noSnapshots: "אין גיבויים",
    noSnapshotsDescription: "צור את הגיבוי הראשון שלך כדי להתחיל",
    createFirstSnapshot: "צור גיבוי ראשון",
    snapshotCreated: "גיבוי נוצר בהצלחה",
    snapshotDeleted: "הגיבוי נמחק בהצלחה",
    restoreSuccess: "השחזור הושלם בהצלחה",
    confirmRestore: "אישור שחזור נתונים",
    confirmRestoreDescription: "פעולה זו תחליף את כל הנתונים הקיימים במערכת בנתונים מהגיבוי",
    cannotUndo: "זהירות: פעולה זו אינה ניתנת לביטול!",
    dataToReplace: "הנתונים שיוחלפו:",
    confirmDelete: "מחיקת גיבוי",
    confirmDeleteDescription: "האם אתה בטוח שברצונך למחוק את הגיבוי? פעולה זו אינה ניתנת לביטול.",
    restore: "שחזר",
    delete: "מחק",
    cancel: "ביטול",
    confirm: "אישור",
    validate: "אמת",
    dismiss: "סגור",
    loading: "טוען גיבויים...",
    expires: "פג תוקף",
    duration: "משך זמן",
    dataRestored: "נתונים ששוחזרו",
    howItWorks: "איך זה עובד?",
    step1: "צור גיבוי",
    step1Description: "לחץ על 'צור גיבוי חדש' כדי לשמור את כל הנתונים הנוכחיים",
    step2: "שחזר מגיבוי",
    step2Description: "לחץ על 'שחזר' ליד הגיבוי הרצוי כדי לחזור לאותה נקודת זמן",
    step3: "נהל גיבויים",
    step3Description: "מחק גיבויים ישנים או לא רלוונטיים כדי לחסוך מקום",
    titleRequired: "יש להזין כותרת לגיבוי",
    titlePlaceholder: "למשל: גיבוי לפני עדכון הקטגוריות",
    descriptionPlaceholder: "תיאור קצר של הגיבוי והסיבה ליצירתו",
    loadError: "שגיאה בטעינת רשימת הגיבויים",
    createError: "שגיאה ביצירת הגיבוי",
    restoreError: "שגיאה בשחזור הגיבוי",
    deleteError: "שגיאה במחיקת הגיבוי",
    restoreFailed: "השחזור נכשל",
    validationSuccess: "אימות הגיבוי הושלם בהצלחה",
    validationFailed: "אימות הגיבוי נכשל",
    validationError: "שגיאה באימות הגיבוי",
    status: {
      ready: "מוכן",
      creating: "נוצר",
      corrupted: "פגום"
    },
    entities: {
      transactions: "עסקאות",
      categories: "קטגוריות",
      budgets: "תקציבים",
      categoryRules: "חוקי סיווג"
    }
  },
  auth: {
    signOut: "התנתק",
    signingOut: "מתנתק...",
    signingOutDescription: "מתנתק מהמערכת",
    signOutError: "שגיאה בהתנתקות",
    signOutErrorDescription: "אירעה שגיאה במהלך ההתנתקות. נסה שוב."
  },
  onboarding: {
    progress: "התקדמות",
    skip: "דלג",
    tips: "טיפים",
    previous: "קודם",
    next: "הבא",
    getStarted: "בואו נתחיל!",
    quickStart: "או התחל ישירות עם:",

    welcome: {
      title: "ברוכים הבאים לדש:IQ!",
      description: "מערכת ניהול פיננסי אישי חכמה ומתקדמת",
      feature1: "ניתוח אוטומטי של ההוצאות שלך",
      feature2: "תובנות מותאמות אישית על ההרגלים הפיננסיים",
      feature3: "ניהול תקציב חכם עם התראות",
      feature4: "עוזר AI פיננסי מובנה"
    },

    upload: {
      title: "שלב 1: העלאת נתונים",
      description: "התחל בהעלאת קובץ CSV עם הנתונים הפיננסיים שלך",
      action: "התחל להעלות נתונים",
      tip1: "תמך בקבצי CSV מהבנק או מכרטיסי אשראי",
      tip2: "הקובץ צריך להכיל עמודות: תאריך, שם עסק, סכום",
      tip3: "המערכת תזהה אוטומטי בין הכנסות להוצאות"
    },

    categories: {
      title: "שלב 2: ארגון קטגוריות",
      description: "ארגן את העסקאות שלך לקטגוריות ברורות לניתוח טוב יותר",
      action: "נהל קטגוריות",
      tip1: "כבר יצרנו עבורך קטגוריות בסיסיות",
      tip2: "אפשר ליצור קטגוריות מותאמות אישית",
      tip3: "הגדר חוקים אוטומטיים לסיווג עסקאות"
    },

    budget: {
      title: "שלב 3: הגדרת תקציב",
      description: "הגדר תקציבים לכל קטגוריה כדי לשלוט בהוצאות",
      action: "צור תקציב",
      tip1: "התחל עם תקציב חודשי פשוט",
      tip2: "קבל התראות כשאתה מתקרב לגבול",
      tip3: "עקוב אחר ההתקדמות בזמן אמת"
    },

    insights: {
      title: "שלב 4: תובנות ומעקב",
      description: "עכשיו אפשר לראות את התמונה המלאה ולקבל תובנות חכמות",
      action: "צפה בדשבורד",
      tip1: "קבל ניתוח מפורט של הרגלי ההוצאה",
      tip2: "זהה הזדמנויות לחיסכון",
      tip3: "עקוב אחר מגמות לאורך זמן"
    }
  },
  toast: {
    // General success messages
    success: "הצלחה",
    error: "שגיאה",
    info: "מידע",
    warning: "אזהרה",
    
    // Settings related toasts
    settingsSaved: "ההגדרות נשמרו בהצלחה",
    languageChanged: "השפה שונתה בהצלחה",
    currencyChanged: "המטבע שונה בהצלחה",
    preferencesUpdated: "העדפותיך עודכנו בהצלחה",
    
    // Transaction related toasts
    transactionAdded: "העסקה נוספה בהצלחה",
    transactionUpdated: "העסקה עודכנה בהצלחה",
    transactionDeleted: "העסקה נמחקה בהצלחה",
    transactionsImported: "העסקאות יובאו בהצלחה",
    transactionsCategorized: "העסקאות סווגו בהצלחה",
    
    // Category related toasts
    categoryAdded: "הקטגוריה נוספה בהצלחה",
    categoryUpdated: "הקטגוריה עודכנה בהצלחה",
    categoryDeleted: "הקטגוריה נמחקה בהצלחה",
    categoryInUse: "לא ניתן למחוק קטגוריה הנמצאת בשימוש",
    
    // Budget related toasts
    budgetCreated: "התקציב נוצר בהצלחה",
    budgetUpdated: "התקציב עודכן בהצלחה",
    budgetDeleted: "התקציב נמחק בהצלחה",
    budgetExists: "תקציב לקטגוריה זו כבר קיים",
    
    // Upload related toasts
    fileUploaded: "הקובץ הועלה בהצלחה",
    fileProcessed: "הקובץ עובד בהצלחה",
    uploadError: "שגיאה בהעלאת הקובץ",
    fileFormatError: "פורמט הקובץ לא נתמך",
    
    // Backup/Snapshot related toasts
    snapshotCreated: "הגיבוי נוצר בהצלחה",
    snapshotDeleted: "הגיבוי נמחק בהצלחה",
    snapshotRestored: "הגיבוי שוחזר בהצלחה",
    backupError: "שגיאה ביצירת גיבוי",
    
    // Clean state related toasts
    cleanState: {
      successTitle: "איפוס הושלם בהצלחה",
      successDescription: "נמחקו {{totalDeleted}} רשומות: {{transactions}} עסקאות, {{budgets}} תקציבים, {{categories}} קטגוריות",
      noDataDeletedTitle: "המערכת כבר נקייה",
      noDataDeletedDescription: "לא נמצאו נתונים למחיקה",
      partialSuccessTitle: "איפוס הושלם חלקית",
      partialSuccessDescription: "חלק מהנתונים נמחקו בהצלחה",
      categoriesRestoredTitle: "קטגוריות ברירת מחדל שוחזרו",
      categoriesRestoredDescription: "נוצרו מחדש {{count}} קטגוריות ברירת מחדל",
      confirmationError: "טקסט אישור שגוי",
      confirmationDescription: "יש להקליד: {{requiredText}}",
      startingTitle: "מתחיל איפוס",
      startingDescription: "מוחק את כל הנתונים ומחזיר למצב ברירת מחדל",
      errorTitle: "שגיאה באיפוס",
      errorGeneral: "אירעה שגיאה במהלך איפוס המערכת",
      errorRateLimit: "יותר מדי בקשות. נסה שוב בעוד כמה דקות",
      errorServer: "שגיאת שרת. נסה שוב מאוחר יותר"
    },
    
    // Duplicate management toasts
    duplicatesFound: "נמצאו עסקאות כפולות",
    duplicatesResolved: "כפילויות טופלו בהצלחה",
    duplicateSkipped: "עסקה כפולה דולגה",
    
    // Rule management toasts
    ruleAdded: "חוק הסיווג נוסף בהצלחה",
    ruleUpdated: "חוק הסיווג עודכן בהצלחה",
    ruleDeleted: "חוק הסיווג נמחק בהצלחה",
    
    // Authentication toasts
    loginSuccess: "התחברת בהצלחה",
    logoutSuccess: "התנתקת בהצלחה",
    sessionExpired: "פג תוקף ההתחברות",
    
    // Data loading toasts
    dataLoaded: "הנתונים נטענו בהצלחה",
    dataRefreshed: "הנתונים רועננו בהצלחה",
    loadingError: "שגיאה בטעינת הנתונים",
    
    // Export/Import toasts
    dataExported: "הנתונים יוצאו בהצלחה",
    exportError: "שגיאה בייצוא הנתונים",
    templateDownloaded: "תבנית הורדה בהצלחה",
    
    // Validation toasts
    invalidInput: "קלט לא תקין",
    requiredField: "שדה חובה חסר",
    validationError: "שגיאת תקינות נתונים",
    
    // Network toasts
    networkError: "בעיית רשת - בדוק את החיבור לאינטרנט",
    serverError: "שגיאת שרת - נסה שוב מאוחר יותר",
    rateLimitError: "יותר מדי בקשות - נסה שוב בעוד כמה דקות"
  },
};

const enTranslations = {
  common: {
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    actions: "Actions",
    submit: "Submit",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    yes: "Yes",
    no: "No",
    ok: "OK",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    confirm: "Confirm",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    showMore: "Show More",
    showLess: "Show Less",
    expand: "Expand",
    collapse: "Collapse",
    required: "Required",
    optional: "Optional",
    category: "Category",
    amount: "Amount",
    date: "Date",
    description: "Description",
    status: "Status",
    type: "Type",
    name: "Name",
    total: "Total",
    uncategorized: "Uncategorized",
    increase: "increase",
    decrease: "decrease",
    of: "of",
    additionalTools: "Additional Tools",
    subtotal: "Subtotal",
    tax: "Tax",
    discount: "Discount",
    quantity: "Quantity",
    price: "Price",
    currency: "Currency",
    language: "Language",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",
    login: "Login",
    register: "Register",
    forgotPassword: "Forgot Password",
    changePassword: "Change Password",
    home: "Home",
    dashboard: "Dashboard",
    reports: "Reports",
    analytics: "Analytics",
    export: "Export",
    import: "Import",
    print: "Print",
    share: "Share",
    copy: "Copy",
    paste: "Paste",
    cut: "Cut",
    undo: "Undo",
    redo: "Redo",
    refresh: "Refresh",
    reload: "Reload",
    reset: "Reset",
    clear: "Clear",
    apply: "Apply",
    preview: "Preview",
    upload: "Upload",
    download: "Download",
    view: "View",
    hide: "Hide",
    show: "Show",
    enable: "Enable",
    disable: "Disabled",
    active: "Active",
    inactive: "Inactive",
    online: "Online",
    offline: "Offline",
    public: "Public",
    private: "Private",
    draft: "Draft",
    published: "Published",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
    inProgress: "In Progress",
    cancelled: "Cancelled",
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    thisYear: "This Year",
    lastYear: "Last Year",
    income: "Income",
    expenses: "Expenses",
    profit: "Profit",
    loss: "Loss",
    balance: "Balance",
    topThree: "Top 3",
    averageTransaction: "Average Transaction",
    incomeExpensesTrend: "Income and Expenses Trend",
    topBusinesses: "Top Businesses",
    noResultsFound: "No Results Found",
    tryDifferentSearch: "Try a different search or change filters",
    items: "items",
    totalItems: "Total Items",
    selectedItems: "Selected Items",
    dismiss: "Dismiss",
    retry: "Retry",
    refreshData: "Refresh Data",
    email: "Email",
    phone: "Phone",
    address: "Address"
  },
  navigation: {
    dashboard: "Dashboard",
    upload: "Upload",
    transactions: "Transactions",
    budget: "Budget",
    categoryManagement: "Categories",
    insights: "Insights",
    settings: "Settings",
    forecast: "Forecast",
    peerComparison: "Peer Comparison",
    successStories: "Success Stories",
    savings: "Savings",
    dataSnapshots: "Data Snapshots",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    version: "Version"
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of your financial situation",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    netBalance: "Net Balance",
    surplus: "Budget Surplus",
    deficit: "Budget Deficit",
    fromLastPeriod: "vs. Last Period",
    comparedToPrevious: "compared to previous",
    netBalanceDescription: "Difference between income and expenses",
    expenseDistribution: "Expense Distribution",
    incomeVsExpenses: "Income vs Expenses",
    incomeExpensesTrend: "Income and expenses trend over time",
    quickInsights: "Quick Insights",
    amount: "Amount",
    percentageOfExpenses: "Percentage of expenses",
    income: "Income",
    expenses: "Expenses",
    noExpensesToShow: "No expenses to show",
    noTransactionData: "No transaction data",
    expensesThisPeriod: "Expenses this period",
    increase: "increase",
    // comparedToPrevious: "compared to previous period", // This was moved and rephrased
    comparedTo: "compared to",
    previousPeriod: "previous period",
    budgetOverrun: "Budget overrun in",
    spent: "spent",
    of: "of",
    overrun: "overrun",
    unusualSpending: "Unusual spending in",
    viewAllInsights: "View all insights",
    selectPeriod: "Select period",
    nextPeriod: "Next period",
    loading: "Loading...",
    welcomeTitle: "Welcome to Financial Management System",
    welcomeDescription: "Start managing your finances smartly and efficiently",
    uploadTransactions: "Upload Transactions",
    uploadDescription: "Upload bank files and start tracking your expenses",
    createBudget: "Create Budget",
    budgetDescription: "Set budgets for different categories and track progress",
    manageCategories: "Manage Categories",
    categoriesDescription: "Organize your transactions with custom categories",
    reloadData: "Reload Data",
    backToOverview: "Back to Overview",
    categoryDetail: "Category Detail",
    generalSummary: "General Summary",
    categorySummary: "Category Summary: {{category}}",
    generalAnalysisDescription: "Financial analysis for {{period}}",
    categoryAnalysisDescription: "Analysis of {{category}} category for {{period}}",
    backToGeneral: "Back to General",
    categoryAmount: "Category Amount",
    filteredExpenses: "Filtered Expenses",
    transactionCount: "Transaction Count",
    averageTransaction: "Average Transaction",
    percentageOfTotal: "Percentage of Total",
    percentageOfFilteredExpenses: "Percentage of Filtered Expenses",
    budget: "Budget",
    topBusinesses: "Top Businesses",
    topThree: "(Top 3)",
    andMoreBusinesses: "and {{count}} more businesses",
    ofAmount: "of amount",
    recentTransactionsFromTopBusinesses: "Recent Transactions from Top Businesses",
    selectedCategories: "{{count}} selected categories",
    monthlyTrend: {
      title: "Monthly Trend",
      description: "Track spending trends over recent months",
      noData: "No data to display"
    },
    topCategories: {
      title: "Top Categories",
      description: "Top 5 categories with highest expenses",
      noData: "No data to display"
    },
  },
  transactions: {
    title: "Transactions",
    subtitle: "Manage and track all your transactions",
    addTransaction: "Add Transaction",
    exportCSV: "Export to CSV",
    findDuplicates: "Find Duplicates",
    duplicateManagement: "Duplicate Management",

    filters: {
      title: "Filters",
      search: "Search",
      searchPlaceholder: "Search transactions...",
      categories: "Categories",
      allCategories: "All Categories",
      clearCategories: "Clear Categories",
      startDate: "Start Date",
      endDate: "End Date",
      type: "Transaction Type",
      allTypes: "All Types",
      expenses: "Expenses",
      income: "Income",
      showing: "Showing",
      results: "Results",
      clearAll: "Clear All"
    },

    duplicates: {
      title: "Duplicate Management",
      subtitle: "Find and handle duplicate transactions in the system",
      manageTitle: "Transaction Duplicate Management",
      analysisComplete: "Duplicate analysis completed",
      foundGroups: "Found {{count}} duplicate groups",
      totalDuplicates: "Total {{count}} duplicate transactions",
      noduplicatesFound: "No duplicates found",
      noduplicatesDescription: "All your transactions are unique",
      processing: "Processing data and searching for duplicates...",
      analyzingTransactions: "Analyzing transactions",
      findingPatterns: "Finding patterns",
      groupingSimilar: "Grouping similar transactions",
      analyzingComplete: "Analysis completed",
      keepOriginal: "Keep Original",
      deleteTransaction: "Delete Transaction",
      markAsReviewed: "Mark as Reviewed",
      selectAction: "Select Action",
      confidence: "Confidence Level",
      high: "High",
      medium: "Medium",
      low: "Low",
      reasons: "Match Reasons",
      exactMatch: "Exact match",
      dateProximity: "Close dates",
      amountMatch: "Same amount",
      businessSimilarity: "Similar business",
      applyActions: "Apply Actions",
      actionsApplied: "Actions applied successfully",
      group: "Group",
      transaction: "Transaction",
      date: "Date",
      business: "Business",
      amount: "Amount",
      action: "Action",
      backToTransactions: "Back to Transactions"
    },

    table: {
      title: "Transaction List",
      selectAll: "Select All",
      date: "Date",
      businessName: "Business Name",
      category: "Category",
      amount: "Amount",
      type: "Type",
      actions: "Actions",
      income: "Income",
      expense: "Expense",
      noData: "No transactions found",
      selectTransactionAria: "Select transaction {{id}}",
      editTransactionAria: "Edit transaction {{id}}"
    },
    bulkActions: {
      selectedCount: "{{count}} transactions selected",
      categorize: "Categorize",
      delete: "Delete Selected",
      confirmDelete: "Are you sure you want to delete {{count}} transactions?",
      categorizeSuccess: "{{count}} transactions categorized successfully under '{{categoryName}}'",
      deleteSuccess: "{{count}} transactions deleted successfully"
    },
    pagination: {
      showing: "Showing",
      totalShowing: "Showing"
    },
    confirmDelete: "Are you sure you want to delete this transaction?",
    modal: {
      addTitle: "Add New Transaction",
      editTitle: "Edit Transaction",
      addDescription: "Enter new transaction details",
      editDescription: "Edit transaction details",
      fields: {
        date: "Date",
        businessName: "Business Name",
        category: "Category",
        amount: "Amount",
        type: "Transaction Type",
        details: "Additional Details"
      },
      types: {
        expense: "Expense",
        income: "Income"
      },
      placeholders: {
        businessName: "Enter business name...",
        amount: "Enter amount...",
        details: "Additional details (optional)..."
      },
      actions: {
        cancel: "Cancel",
        save: "Save Transaction",
        update: "Update Transaction"
      }
    },
    messages: {
      loadingError: "Error loading transactions",
      transactionAdded: "Transaction added successfully",
      transactionUpdated: "Transaction updated successfully",
      transactionDeleted: "Transaction deleted successfully",
      savingError: "Error saving transaction",
      deletingError: "Error deleting transaction"
    },
    empty: {
      title: "No Transactions Yet",
      description: "Start by adding your first transaction or uploading a CSV file",
      addFirst: "Add First Transaction",
      uploadFile: "Upload File"
    }
  },
  budget: {
    title: "Budget",
    subtitle: "Manage and track your budgets",
    createBudget: "Create Budget",
    editBudget: "Edit Budget",
    budgetList: "Budget List",
    noBudgets: "No Budgets",
    noBudgetsDescription: "Create your first budget to start tracking your expenses",
    createFirstBudget: "Create First Budget",
    selectCategory: "Select Category",
    budgetAmount: "Budget Amount",
    budgetPeriod: "Budget Period",
    selectPeriod: "Select Period",
    startDate: "Start Date",
    budgetProgress: "Budget Progress",
    spentAmount: "Amount Spent",
    remainingAmount: "Amount Remaining",
    transactionsThisPeriod: "Transactions this period",
    budgetExists: "Budget already exists for this category",
    budgetCreated: "Budget created successfully",
    budgetUpdated: "Budget updated successfully",
    budgetDeleted: "Budget deleted successfully",
    confirmDelete: "Are you sure you want to delete this budget?",
    overBudget: "Over Budget",
    warning: "Warning",
    onTrack: "On Track",
    budgetSet: "Budget Set",
    periods: {
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly"
    },
    budgetForm: {
      categoryRequired: "Please select a category",
      amountRequired: "Please enter budget amount",
      periodRequired: "Please select budget period"
    },
    overview: {
      totalBudgeted: "Total Budgeted",
      totalSpent: "Total Spent",
      remainingBudget: "Remaining Budget",
      budgetUtilization: "Budget Utilization",
      categoriesOverBudget: "Categories Over Budget"
    }
  },
  categories: {
    title: "Category Management",
    subtitle: "Set up rules for automatic classification of transactions",
    allCategories: "All Categories",
    expenseCategories: "Expense Categories",
    incomeCategories: "Income Categories",
    addCategory: "Add Category",
    categoryName: "Category Name",
    categoryNamePlaceholder: "Enter category name...",
    categoryNameTooShort: "Category name must be at least 2 characters",
    categoryType: "Category Type",
    selectType: "Select Type",
    categoryIcon: "Category Icon",
    selectIcon: "Select Icon",
    iconRequired: "Please select an icon",
    preview: "Preview",
    expense: "Expense",
    income: "Income",
    selectCategory: "Select Category",
    createCategory: "Create Category",
    updateCategory: "Update Category",
    empty: {
      title: "No Categories",
      description: "Create your first category to start organizing your transactions",
      addFirst: "Create First Category"
    },
    table: {
      name: "Name",
      type: "Type",
      icon: "Icon",
      transactionCount: "Transaction Count",
      actions: "Actions"
    },
    form: {
      addTitle: "Add New Category",
      editTitle: "Edit Category"
    },
    messages: {
      categoryAdded: "Category added successfully",
      categoryUpdated: "Category updated successfully",
      categoryDeleted: "Category deleted successfully",
      categoryInUse: "Cannot delete category that is in use by transactions"
    },
    dialogs: {
      deleteCategory: "Delete Category",
      deleteCategoryDescription: "Are you sure you want to delete the category '{{name}}'?",
      cancel: "Cancel",
      delete: "Delete"
    },
    rules: {
      title: "Automatic Classification Rules",
      subtitle: "Set up rules for automatic classification of transactions",
      addRule: "Add Rule",
      businessPattern: "Business Name Pattern",
      patternPlaceholder: "e.g., *Super*",
      category: "Category",
      patternRequired: "Please enter a pattern",
      categoryRequired: "Please select a category",
      patternHelp: "Use * for any text",
      deleteRule: "Delete Rule",
      deleteRuleDescription: "Are you sure you want to delete the rule for pattern '{{pattern}}'?",
      empty: {
        title: "No Classification Rules",
        description: "Create rules for automatic classification of new transactions"
      },
      table: {
        pattern: "Pattern",
        category: "Category",
        actions: "Actions"
      },
      form: {
        title: "Add Classification Rule",
        editTitle: "Edit Classification Rule",
        description: "Classification rules enable automatic categorization of new transactions",
        patternHelp: "Use * to denote any text. For example: *Super* will match any name containing 'Super'",
        examples: {
          title: "Pattern Examples",
          supermarket: "*Super* - matches any supermarket",
          gas: "*Gas* - matches gas stations",
          pharmacy: "*Pharmacy* - matches pharmacies"
        }
      },
      messages: {
        ruleAdded: "Rule added successfully",
        ruleUpdated: "Rule updated successfully",
        ruleDeleted: "Rule deleted successfully"
      }
    }
  },
  insights: {
    title: "Financial Insights",
    subtitle: "Personalized insights based on your financial data",
    currentPeriod: "Current",
    historicalPeriod: "Historical Period",
    checkAgain: "Check Again",
    refreshInsights: "Refresh Insights",
    loading: {
      prerequisites: "Loading prerequisites...",
      analyzing: "Analyzing financial data...",
    },
    generating: {
      title: "Generating Smart Financial Insights",
      description: "This may take a few seconds..."
    },
    timePeriods: {
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly",
      all: "All Periods"
    },
    filters: {
      filterBy: "Filter By",
      allUrgency: "All Urgency",
      highUrgency: "High Urgency",
      mediumUrgency: "Medium Urgency",
      lowUrgency: "Low Urgency",
      allTypes: "All Types",
      spending: "Spending",
      budget: "Budget",
      trend: "Trend",
      general: "General",
      showing: "Showing",
      results: "Results"
    },
    urgency: {
      high: "High Urgency",
      medium: "Medium Urgency",
      low: "Low Urgency"
    },
    types: {
      spending: "Spending",
      budget: "Budget",
      trend: "Trend",
      general: "General"
    },
    card: {
      noTitle: "No Title",
      noDescription: "No Description",
      recommendation: "Recommendation",
      potentialImpact: "Potential Impact",
      clickToExpand: "Click to expand",
      errorLoading: "Error loading insight"
    },
    noData: {
      title: "Insufficient Data",
      description: "At least 10 transactions and 3 categories are required to generate meaningful insights",
      uploadTransactions: "Upload Transactions",
      manageCategories: "Manage Categories"
    },
    noNewInsights: {
      title: "No New Insights",
      description: "No new insights found for the selected period"
    },
    noFilterMatch: {
      title: "No Matching Results",
      description: "No insights found matching the selected filter"
    },
    errors: {
      loadingData: "Error loading data",
      loadingDataTitle: "Loading Error",
      tryRefresh: "Try refreshing the page"
    },
    error: {
      title: "Error generating insights",
      tryAgain: "Try Again"
    }
  },
  forecast: {
    title: "Financial Forecast",
    subtitle: "View predictions for your financial future based on historical data",
    noData: {
      title: "Insufficient Data for Forecast",
      description: "Add more transactions to get accurate financial predictions"
    },
    configuration: {
      title: "Forecast Settings",
      period: "Forecast Period",
      method: "Forecast Method",
      growthRate: "Custom Growth Rate (%)",
      periods: {
        "3months": "3 Months",
        "6months": "6 Months",
        "12months": "12 Months",
        "24months": "24 Months"
      },
      methods: {
        average: "Historical Average",
        trend: "Trend Analysis",
        custom: "Custom Growth Rate"
      }
    },
    summary: {
      totalIncome: "Expected Total Income",
      totalExpenses: "Expected Total Expenses",
      totalSavings: "Expected Total Savings",
      savingsRate: "Expected Savings Rate"
    },
    charts: {
      title: "Forecast Charts",
      tabs: {
        overview: "Overview",
        trends: "Savings Trends",
        categories: "Category Forecast"
      },
      income: "Income",
      expenses: "Expenses",
      savings: "Savings",
      categoryDistribution: "Category Distribution",
      categoryForecast: "Category Forecast",
      growth: "Growth"
    },
    insights: {
      title: "Forecast Insights",
      lowSavings: {
        title: "Low Savings Rate",
        description: "The forecast shows a savings rate below 10%. Consider reducing expenses or increasing income."
      },
      goodSavings: {
        title: "Excellent Savings Rate",
        description: "The forecast shows a savings rate above 20%. Keep maintaining good financial habits!"
      },
      increasingExpenses: {
        title: "Growing Expenses",
        description: "Categories with high expense growth trends identified. Consider monitoring these categories:"
      }
    },
    errors: {
      generationFailed: "Error generating forecast. Please try again later."
    }
  },
  savings: {
    title: "Savings & Financial Planning",
    subtitle: "Advanced tools for savings planning and smart financial management",
    tabs: {
      emergencyFund: "Emergency Fund",
      budgetRule: "50/30/20 Rule",
      savingsGoals: "Savings Goals",
      financialHealth: "Financial Health",
      compoundInterest: "Compound Interest"
    },
    emergencyFund: {
      title: "Emergency Fund Calculator",
      description: "Calculate how much money you should have in your emergency fund and plan how to reach your goal",
      currentSavings: "Current emergency fund savings",
      currentSavingsPlaceholder: "Enter current amount...",
      monthlyExpenses: "Average monthly expenses",
      monthlyExpensesPlaceholder: "Average monthly expenses...",
      targetMonths: "Number of months to cover",
      targetMonthsDescription: "Usually 3-6 months is recommended",
      calculate: "Calculate Emergency Fund",
      calculating: "Calculating...",
      results: {
        title: "Emergency Fund Calculation Results",
        targetAmount: "Emergency fund target amount",
        currentStatus: "Current status",
        monthsToGoal: "Months to goal",
        monthlySavingsNeeded: "Monthly savings needed",
        status: {
          excellent: "Excellent! You have a full emergency fund",
          good: "Good! You're on the right track",
          needsImprovement: "Needs improvement - start saving now"
        }
      },
      recommendations: {
        title: "Emergency Fund Recommendations",
        startNow: "Start saving now",
        startNowDescription: "Even a small amount each month can help",
        autoTransfer: "Set up automatic transfer",
        autoTransferDescription: "Set up automatic monthly transfer to savings",
        separateAccount: "Separate account",
        separateAccountDescription: "Keep emergency fund in a separate, accessible account"
      }
    },
    budgetRule: {
      title: "50/30/20 Budget Rule",
      description: "Divide your income according to the golden rule: 50% needs, 30% wants, 20% savings",
      monthlyIncome: "Net monthly income",
      monthlyIncomePlaceholder: "Net income after taxes...",
      currentNeeds: "Current spending on needs (optional)",
      currentNeedsPlaceholder: "Housing, food, transportation...",
      currentWants: "Current spending on wants (optional)",
      currentWantsPlaceholder: "Entertainment, shopping, vacations...",
      currentSavings: "Current savings (optional)",
      currentSavingsPlaceholder: "Savings and investments...",
      calculate: "Calculate 50/30/20 Allocation",
      calculating: "Calculating...",
      results: {
        title: "Recommended 50/30/20 Allocation",
        needs: "Needs (50%)",
        needsDescription: "Housing, food, transportation, insurance",
        wants: "Wants (30%)",
        wantsDescription: "Entertainment, dining out, shopping",
        savings: "Savings (20%)",
        savingsDescription: "Savings, investments, debt repayment",
        comparison: "Comparison to current situation"
      },
      status: {
        excellent: "Excellent! You're following the rule",
        good: "Good! Close to recommended rule",
        needsAdjustment: "Needs adjustment"
      },
      tips: {
        title: "Tips for Implementing 50/30/20 Rule",
        trackExpenses: "Track expenses",
        trackExpensesDescription: "Record your expenses for a month to identify patterns",
        reduceFees: "Reduce fees",
        reduceFeesDescription: "Check bank accounts, insurance, and unnecessary subscriptions",
        increaseIncome: "Increase income",
        increaseIncomeDescription: "Look for ways to increase income or improve skills"
      }
    },
    savingsGoals: {
      title: "Savings Goals Tracker",
      description: "Set and track your savings goals",
      goalName: "Goal name",
      goalNamePlaceholder: "e.g., New car, vacation...",
      targetAmount: "Target amount",
      targetAmountPlaceholder: "How much money you need...",
      currentSaved: "Already saved",
      currentSavedPlaceholder: "How much you've already saved...",
      targetDate: "Target date",
      targetDatePlaceholder: "When you want to achieve the goal...",
      monthlySavings: "Planned monthly savings",
      monthlySavingsPlaceholder: "How much you'll add each month...",
      calculate: "Calculate Savings Plan",
      addGoal: "Add Savings Goal",
      results: {
        title: "Your Savings Plan",
        timeToGoal: "Time to goal",
        monthlyRequired: "Monthly savings required",
        progress: "Progress",
        projectedCompletion: "Projected completion",
        onTrack: "On track!",
        behindSchedule: "Behind schedule",
        aheadOfSchedule: "Ahead of schedule",
        months: "months",
        years: "years"
      }
    },
    financialHealth: {
      title: "Financial Health Score",
      description: "Get a comprehensive score on your financial situation",
      calculate: "Calculate Financial Health Score",
      calculating: "Calculating score...",
      score: "Your Score",
      outOf: "out of 100",
      categories: {
        emergencyFund: "Emergency Fund",
        debtToIncome: "Debt to Income Ratio",
        savingsRate: "Savings Rate",
        budgetAdherence: "Budget Adherence",
        diversification: "Investment Diversification"
      },
      scoreRanges: {
        excellent: "Excellent (90-100)",
        excellentDescription: "Your financial situation is stable and very healthy",
        good: "Good (70-89)",
        goodDescription: "Your financial situation is good with room for slight improvement",
        fair: "Fair (50-69)",
        fairDescription: "Financial management needs improvement",
        poor: "Needs Improvement (0-49)",
        poorDescription: "Urgent attention needed for financial situation"
      }
    },
    compoundInterest: {
      title: "Compound Interest Calculator",
      description: "See how your investments can grow over time",
      initialAmount: "Initial amount",
      initialAmountPlaceholder: "Initial investment amount...",
      monthlyContribution: "Monthly contribution",
      monthlyContributionPlaceholder: "How much you'll add each month...",
      annualReturn: "Estimated annual return (%)",
      annualReturnPlaceholder: "Annual return percentage...",
      timeHorizon: "Time horizon (years)",
      timeHorizonPlaceholder: "For how many years...",
      calculate: "Calculate Growth",
      calculating: "Calculating...",
      results: {
        title: "Compound Interest Results",
        finalAmount: "Final amount",
        totalContributions: "Total contributions",
        totalInterest: "Total interest earned",
        breakeven: "Breakeven point",
        powerOfTime: "Power of time",
        monthlyGrowth: "Average monthly growth"
      },
      chart: {
        title: "Investment Growth Chart",
        contributions: "Contributions",
        interest: "Compound Interest",
        total: "Total"
      },
      tips: {
        title: "Compound Interest Tips",
        startEarly: "Start early",
        startEarlyDescription: "The earlier you start, the more compound interest works in your favor",
        consistentInvesting: "Consistent investing",
        consistentInvestingDescription: "Regular monthly investing is more important than large one-time amounts",
        longTermThinking: "Long-term thinking",
        longTermThinkingDescription: "The longer the time horizon, the greater the effect of compound interest"
      }
    },
    common: {
      backToOverview: "Back to overview",
      saveCalculation: "Save calculation",
      loadPreviousCalculation: "Load previous calculation",
      exportResults: "Export results",
      shareResults: "Share results",
      calculationSaved: "Calculation saved successfully",
      noDataAvailable: "No data available",
      loadingCalculation: "Loading calculation...",
      invalidInput: "Invalid input",
      pleaseFillAllFields: "Please fill all required fields",
      resetForm: "Reset form",
      edit: "Edit",
      delete: "Delete",
      confirm: "Confirm"
    }
  },
  aiAssistant: {
    title: "Smart Financial Assistant",
    subtitle: "Ask me any question about your financial situation and I'll help you understand and analyze your data",
    placeholder: "Ask me about your expenses, budgets, or trends...",
    askQuestion: "Ask Question",
    processing: "Processing...",
    suggestedQuestions: "Suggested Questions",
    recentQueries: "Recent Queries",
    clearChat: "Clear Chat",
    copyMessage: "Copy Message",
    errorMessage: "An error occurred processing your question",
    welcomeMessage: "Hello! I'm your Smart Financial Assistant. Ask me anything about your financial data!",
    categories: {
      spending: "Spending",
      income: "Income",
      trends: "Trends",
      budget: "Budget"
    },
    queryTypes: {
      spending_analysis: "Spending Analysis",
      income_analysis: "Income Analysis",
      trend_analysis: "Trend Analysis",
      budget_status: "Budget Status",
      category_summary: "Category Summary",
      business_summary: "Business Summary",
      transaction_count: "Transaction Count",
      general_info: "General Info"
    }
  },
  settings: {
    title: "Settings",
    subtitle: "Manage your system preferences",
    settingsSaved: "Settings saved successfully",
    general: "General Settings",
    appearance: "Appearance & Interface",
    notifications: "Notifications",
    language: "Language",
    selectLanguage: "Select Language",
    languageDescription: "Interface language will change after saving settings",
    currencySettings: "Currency Settings",
    selectCurrency: "Select Currency",
    currencyDescription: "This currency will be displayed throughout the system",
    dateFormatSettings: "Date Format Settings",
    selectDateFormat: "Select Date Format",
    dateFormatDescription: "Date format used throughout the system",
    timeZoneSettings: "Time Zone Settings",
    selectTimeZone: "Select Time Zone",
    timeZoneDescription: "Time zone for date and time calculations",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeAuto: "Auto",
    themeDescription: "Choose your preferred theme",
    fontSize: {
      title: "Font Size",
      small: "Small",
      medium: "Medium",
      large: "Large",
      xlarge: "Extra Large"
    },
    accessibility: "Accessibility",
    highContrast: "High Contrast",
    highContrastDescription: "Increase contrast for better readability",
    reducedMotion: "Reduced Motion",
    reducedMotionDescription: "Reduce animations and movements in the system",
    emailNotifications: "Email Notifications",
    pushNotifications: "Push Notifications",
    pushNotificationsDescription: "Receive notifications in your browser",
    smsNotifications: "SMS Notifications",
    smsNotificationsDescription: "Receive alerts via text message",
    budgetAlerts: "Budget Alerts",
    budgetAlertsDescription: "Get notified when approaching budget limits",
    monthlyReports: "Monthly Reports",
    monthlyReportsDescription: "Receive monthly summary of financial activity",
    transactionAlerts: "Transaction Alerts",
    transactionAlertsDescription: "Get notified about new transactions",
    shareData: "Share Data",
    shareDataDescription: "Allow anonymous data sharing to improve the system",
    analytics: "Usage Analytics",
    analyticsDescription: "Allow usage data collection to improve experience",
    cookiesConsent: "Cookies Consent",
    cookiesConsentDescription: "Allow cookies usage for enhanced functionality",
    resetToDefaults: "Reset to Defaults",
    confirmReset: "Are you sure you want to reset all settings to default values?",
    unsavedChanges: "You have unsaved changes. Don't forget to save!",
    backup: {
      title: "Backup Management",
      subtitle: "Manage backups and data restoration",
      createNow: "Create Backup Now",
      creating: "Creating backup...",
      backupCreated: "Backup created successfully",
      configurationSaved: "Backup settings saved",
      backupDeleted: "Backup deleted successfully",
      restoreCompleted: "Restore completed successfully",
      restoring: "Restoring data...",
      status: {
        completed: "Completed",
        failed: "Failed",
        inProgress: "In Progress"
      },
      method: {
        manual: "Manual",
        automatic: "Automatic"
      },
      table: {
        date: "Date",
        time: "Time",
        method: "Method",
        status: "Status",
        size: "Size",
        retention: "Retention",
        timeZone: "Time Zone",
        actions: "Actions"
      },
      automaticBackup: "Automatic Backup",
      enableAutoBackup: "Enable Automatic Backup",
      autoBackupDescription: "Create automatic backups according to your schedule",
      frequency: "Frequency",
      scheduleTime: "Schedule Time",
      scheduleTimeDescription: "Backup will be performed at this time daily",
      timeZone: "Time Zone",
      retentionPeriod: "Retention Period",
      retentionDescription: "Backups will be automatically deleted after this period",
      frequencies: {
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        yearly: "Yearly"
      },
      days: "days",
      totalBackups: "Total Backups",
      successful: "Successful",
      lastBackup: "Last Backup",
      noBackups: "No Backups",
      noBackupsDescription: "No backups have been created in the system yet",
      createFirstBackup: "Create First Backup",
      backupHistory: "Backup History",
      currentConfiguration: "Current Configuration",
      tabs: {
        backups: "Backups",
        settings: "Settings"
      },
      restore: "Restore",
      confirmRestore: "Confirm Data Restore",
      restoreWarning: "This action will replace all existing data in the system with data from the selected backup. This action cannot be undone.",
      backupDetails: "Backup Details",
      entities: "Entities",
      transactions: "Transactions",
      categories: "Categories",
      budgets: "Budgets",
      confirmDelete: "Confirm Backup Deletion",
      deleteWarning: "Are you sure you want to delete this backup? This action cannot be undone.",
      messages: {
        backupCreated: "Backup created successfully",
        backupDeleted: "Backup deleted successfully",
        restoreCompleted: "Restore completed successfully. The page will reload in a few moments.",
        configSaved: "Backup settings saved successfully"
      }
    },
    advanced: {
      title: "Advanced Settings",
      description: "Advanced operations that require special caution",

      cleanState: {
        sectionTitle: "Reset to Clean State",
        sectionDescription: "Complete deletion of all data and return to initial state",
        button: "Reset to Clean State",
        title: "Are you sure?",
        description: "This action will permanently delete all your data and reset the system to its initial state. This action cannot be undone!",
        warningTitle: "What will be deleted",
        warningHeader: "Severe Warning:",
        warning1: "All transactions and financial data",
        warning2: "All custom categories",
        warning3: "All budgets and settings",
        warning4: "All automatic classification rules",
        warning5: "All saved backups and reports",
        warning6: "All personal preferences",
        irreversibleWarning: "This action cannot be undone and data cannot be recovered afterwards!",
        typeToConfirm: "Type the following text to confirm:",
        confirmationText: "DELETE EVERYTHING",
        confirmationLabel: "Type '{{requiredText}}' to confirm:",
        confirmationPlaceholder: "Type here...",
        processing: "Resetting...",
        loadingButton: "Resetting...",
        confirmButton: "Delete Everything",
        successTitle: "Reset Completed Successfully",
        successDescription: "All data has been deleted and the system has been reset to its initial state",
        error: "Reset Error",
        wrongConfirmation: "The text you entered does not match",
        genericError: "An error occurred during the reset"
      }
    },
    dialogs: {
      cancel: "Cancel",
      confirm: "Confirm",
      cleanState: {
        title: "Reset to Clean State",
        warningHeader: "Severe Warning:",
        warning1: "All transactions and financial data will be deleted",
        warning2: "All custom categories will be deleted",
        warning3: "All budgets and settings will be deleted",
        warning4: "All automatic classification rules will be deleted",
        warning5: "All saved backups and reports will be deleted",
        warning6: "All personal preferences will be deleted",
        irreversibleWarning: "This action cannot be undone!",
        confirmationLabel: "Type '{{requiredText}}' to confirm:",
        loadingButton: "Resetting...",
        confirmButton: "Delete Everything"
      }
    },
    tabs: {
      general: "General",
      appearance: "Appearance",
      notifications: "Notifications",
      backup: "Backup",
      advanced: "Advanced",
      privacy: "Privacy"
    }
  },
  upload: {
    title: "Data Upload",
    subtitle: "Upload CSV files to import transactions",
    guide: {
      title: "CSV File Upload Guide",
      step1: {
        number: "1",
        title: "Download Template File",
        description: "Use our template file that includes all required columns",
        button: "Download CSV Template",
        success: "Template downloaded successfully",
        successDescription: "Use this template with English headers to prepare your transaction file"
      },
      step2: {
        number: "2",
        title: "Fill Data in File",
        description: "Enter data according to the following format:",
        fields: {
          date: "Date: In YYYY-MM-DD format (date)",
          businessName: "Business Name: Name of business or income source (business_name)",
          amount: "Amount: Total transaction amount (amount)",
          description: "Description: Additional transaction info - optional (description)"
        },
        note: "Note: Use English headers in CSV file: date, business_name, amount, description",
        autoDetect: "The system will automatically detect whether it's an expense or income based on other data."
      },
      step3: {
        number: "3",
        title: "Upload File",
        description: "Select the prepared CSV file and the system will process it automatically"
      }
    },
    dropZone: {
      title: "Drag file here or click to select file",
      fileSelected: "File selected:",
      processing: "Processing...",
      processFile: "Process File"
    },
    categorization: {
      title: "Categorize Transactions ({{count}})",
      tabs: {
        all: "All",
        categorized: "Categorized",
        uncategorized: "Uncategorized"
      },
      autoCategorizingProgress: "Performing automatic categorization...",
      bulkCategorize: {
        title: "Quick categorization for all uncategorized transactions",
        description: "Select category to categorize all uncategorized transactions:"
      },
      table: {
        date: "Date",
        business: "Business",
        amount: "Amount",
        type: "Type",
        category: "Category",
        typeExpense: "Expense",
        typeIncome: "Income",
        selectCategory: "Select Category"
      },
      actions: {
        cancel: "Cancel",
        save: "Save Transactions ({{count}})",
        saving: "Saving..."
      }
    },
    history: {
      title: "Upload History",
      table: {
        uploadDate: "Upload Date",
        filename: "Filename",
        recordCount: "Record Count",
        status: "Status",
        details: "Details"
      },
      status: {
        success: "Complete Success",
        partial: "Partial Success",
        failed: "Failed"
      },
      empty: {
        title: "No Upload History",
        description: "New file uploads will appear here"
      }
    },
    duplicates: {
      title: "Found transactions that may be duplicates",
      description: "Please choose how to handle each new transaction identified as a possible duplicate.",
      example: "For example, the new transaction:",
      similarTo: "Similar to existing transaction:",
      table: {
        date: "Date",
        business: "Business",
        amount: "Amount",
        action: "Action"
      },
      actions: {
        add: "Add Anyway",
        skip: "Skip (Duplicate)",
        skipAll: "Skip All Duplicates",
        addAll: "Add All Transactions",
        continue: "Continue with Selections"
      }
    },
    messages: {
      fileProcessedSuccess: "File processed successfully",
      transactionsReady: "{{count}} transactions ready for categorization and saving.",
      invalidRecordsSkipped: "Invalid records skipped",
      skippedRecordsDescription: "{{count}} transactions skipped due to missing critical data after processing attempt.",
      noValidTransactions: "No valid transactions found in file after data processing.",
      transactionsSaved: "Transactions saved successfully",
      savedCount: "Saved {{count}} transactions.",
      duplicatesProcessed: "Duplicate processing completed",
      duplicatesResult: "{{created}} new transactions added, {{skipped}} checked/skipped."
    },
    errors: {
      invalidFile: "Invalid File",
      invalidFileDescription: "Please select a valid CSV file for upload. Ensure the file is not empty.",
      uploadFailed: "File processing failed",
      timeout: "Operation took too long. Please try with a smaller file.",
      sqlError: "Problem processing file. Please use our CSV template with English headers: date, business_name, amount, description.",
      noTransactions: "No transactions found in file. Please ensure the file contains transaction data in CSV format with English headers: date, business_name, amount, description.",
      retrying: "Processing issue, retrying...",
      maxRetriesReached: "Maximum retry attempts reached. Please check file format and try again.",
      generalError: "General error processing file"
    }
  },
  monthlyComparison: {
    weeklyComparison: "Weekly Comparison",
    monthlyComparison: "Monthly Comparison",
    quarterlyComparison: "Quarterly Comparison",
    yearlyComparison: "Yearly Comparison",
    weeklyDescription: "Compare expenses and income for the last 6 weeks",
    monthlyDescription: "Compare expenses and income for the last 6 months",
    quarterlyDescription: "Compare expenses and income for the last 6 quarters",
    yearlyDescription: "Compare expenses and income for the last 6 years",
    exportToExcel: "Export to Excel",
    filterByCategory: "Filter expenses by category",
    allExpenses: "All Expenses",
    selectedCategory: "Selected Category",
    selectedCategoriesCount: "{{count}} selected categories",
    period: "Period",
    income: "Income",
    totalExpenses: "Total Expenses",
    selectedCategoriesExpense: "Selected Categories Expenses",
    balance: "Balance"
  },
  categoryReport: {
    selectCategoryPrompt: "Select a category to view summary.",
    totalExpenses: "Total Category Expenses",
    transactionCount: "Number of Transactions",
    averagePerTransaction: "Average per Transaction",
    topExpensesDistribution: "Top Expenses Distribution in Category",
    topBusinessesDescription: "View of 5 businesses with highest expenses in this category.",
    transactionsForCategory: "Transactions for {{category}}"
  },
  accessibility: {
    title: "Accessibility",
    openPanel: "Open accessibility panel",
    closePanel: "Close accessibility panel",
    fontSize: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    extraLarge: "Extra Large",
    letterSpacing: "Letter Spacing",
    normal: "Normal",
    increased: "Increased",
    wide: "Wide",
    displayMode: "Display Mode",
    highContrast: "High Contrast",
    inverted: "Inverted",
    dark: "Dark",
    dyslexicFont: "Dyslexic Font",
    reducedMotion: "Reduce Motion",
    highlightTitles: "Highlight Titles",
    highlightLinks: "Highlight Links",
    readableFont: "Readable Font",
    enabled: "Enabled",
    disabled: "Disabled",
    resetAll: "Reset All"
  },
  weeklyMetrics: {
    title: "{{period}} Metrics",
    weeklyComparison: "Weekly Comparison",
    monthlyDescription: "Track your monthly budget progress",
    quarterlyDescription: "Track your quarterly budget progress",
    yearlyDescription: "Track your yearly budget progress",
    weeklyDescription: "Track your weekly budget progress",
    budgetForPeriod: "Budget for Period",
    totalBudget: "Total Budget",
    spentSoFar: "Spent So Far",
    remaining: "Remaining",
    used: "used",
    avgDailySpending: "Avg Daily Spending",
    thisPeriod: "This Period",
    budgetProgress: "Budget Progress",
    forecastTitle: "Forecast",
    projectedTotal: "Projected Total",
    estimatedBalance: "Estimated Balance",
    dailyRecommendation: "Daily Recommendation",
    recommendationNegative: "To stay on budget, limit spending to {{amount}} per day until end of {{period}}",
    recommendationAlreadyOver: "You're over budget. Consider adjusting expenses for next period",
    recommendationPositive: "You're on track! Keep it up",
    onBudget: "On Budget",
    nearLimit: "Near Limit",
    overBudget: "Over Budget",
    ofBudgetUsed: "of budget used",
    previousPeriod: "Previous Period",
    nextPeriod: "Next Period"
  },
  periods: {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    selectPeriod: "Select Period",
    quarterlyShort: "Q",
    currentWeek: "Current Week",
    currentMonth: "Current Month",
    currentQuarter: "Current Quarter",
    currentYear: "Current Year",
    lastWeek: "Last Week",
    lastMonth: "Last Month",
    lastQuarter: "Last Quarter",
    lastYear: "Last Year",
    thisWeek: "This Week",
    thisMonth: "This Month",
    thisQuarter: "This Quarter",
    thisYear: "This Year"
  },
  errors: {
    general: "An unexpected error occurred",
    network: "Network issue - check your internet connection",
    loadingData: "Error loading data",
    savingData: "Error saving data",
    deletingData: "Error deleting data",
    invalidInput: "Invalid input",
    unauthorized: "Not authorized to perform this action",
    notFound: "Requested item not found",
    serverError: "Internal server error",
    timeout: "Operation took too long",
    validationFailed: "Validation error",
    duplicateEntry: "Duplicate entry",
    insufficientData: "Insufficient data",
    formatError: "Format error",
    uploadFailed: "Upload failed",
    downloadFailed: "Download failed",
    processingFailed: "Processing failed",
    generatingInsights: "Error generating insights",
    categoryInUse: "Category is in use and cannot be deleted",
    budgetExists: "Budget for this category already exists"
  },
  app: {
    title: "Smart Financial Management"
  },
  additionalTools: "Additional Tools",
  peerComparison: {
    title: "Advanced Peer Comparison",
    subtitle: "Comparison based on real data from the Central Bureau of Statistics and Bank of Israel",
    profileSelection: {
      title: "Select Accurate Comparison Group",
      description: "The comparison is based on real data from the Central Bureau of Statistics and Bank of Israel",
      dataSource: "Data Source",
      sampleSize: "Sample Size",
      participants: "participants",
      age: "Age",
      avgIncome: "Avg Income"
    },
    overallScore: {
      title: "Your Financial Score vs. Group",
      refreshComparison: "Refresh Comparison",
      comparedTo: "Compared to group",
      scoreLevel: {
        excellent: "Excellent",
        veryGood: "Very Good",
        good: "Good",
        average: "Average",
        needsImprovement: "Needs Improvement"
      }
    },
    radarChart: {
      title: "Spending Profile - Advanced Visual Comparison",
      description: "The comparison shows exact amounts and percentages, unlimited. 100% = group average",
      yourSpending: "Your Spending",
      groupAverage: "Group Average (100%)"
    },
    summaryStats: {
      title: "General Data and Position in Group",
      monthlyIncome: "Monthly Income",
      savingsRate: "Savings Rate",
      recommendedTarget: "Recommended Target",
      statisticalAnalysis: "Advanced Statistical Analysis",
      averageStandardDeviation: "Average Standard Deviation",
      categoriesAboveAverage: "Categories Above Average",
      maximumDeviation: "Maximum Deviation",
      groupAverage: "Group Average"
    },
    categoryComparison: {
      title: "Detailed Category Comparison",
      description: "Accurate comparison with data from",
      sampleNote: "sample of",
      yourExpense: "Your Expense",
      groupAverage: "Group Average",
      difference: "Difference",
      zScore: "Z-Score",
      relativeToAverage: "Your spending relative to group average",
      viewTransactions: "View Transactions",
      status: {
        excellent: "Excellent",
        good: "Good",
        average: "Average",
        needsAttention: "Needs Attention"
      }
    },
    recommendations: {
      title: "Data-Based Recommendations",
      overspending: "Overspending in {{category}} - {{percentage}}% above average",
      overspendingDescription: "You spend {{amount}} more than the group average. Group average: {{average}} (Z-Score: {{zScore}})",
      improveSavings: "Improve Savings Rate",
      improveSavingsDescription: "Your savings rate is {{rate}}%. It's recommended to save at least 20% of monthly income.",
      excellentPerformance: "Excellent performance in {{category}}!",
      excellentDescription: "You spend {{amount}} less than the group average ({{percentage}}% less)."
    },
    transactionDialog: {
      title: "Category Transactions",
      description: "List of all transactions included in calculation for this category last month",
      totalTransactions: "Total {{count}} transactions",
      totalAmount: "Total Amount",
      downloadCsv: "Download as CSV",
      table: {
        date: "Date",
        business: "Business",
        amount: "Amount",
        systemCategory: "System Category",
        details: "Details",
        uncategorized: "Uncategorized"
      },
      noTransactions: "No transactions found in this category"
    },
    categories: {
      food: "Food & Beverages",
      transportation: "Transportation",
      entertainment: "Entertainment & Leisure",
      shopping: "General Shopping",
      housing: "Housing & Home Expenses",
      health: "Health & Personal Care",
      education: "Education & Learning",
      miscellaneous: "Miscellaneous",
      foodShort: "Food",
      housingShort: "Housing",
      entertainmentShort: "Entertainment",
      shoppingShort: "Shopping",
      healthShort: "Health",
      educationShort: "Education"
    },
    profiles: {
      young_professional_tlv: "Young Professionals - Tel Aviv",
      young_professional_general: "Young Professionals - Nationwide",
      family_with_children: "Families with Children",
      seniors: "Seniors (65+)"
    },
    loading: "Loading advanced peer comparison..."
  },
  successStories: {
    title: "Financial Success Stories",
    subtitle: "Real inspiration from people who successfully improved their financial situation",
    tabs: {
      stories: "Success Stories",
      myProgress: "My Progress",
      tips: "Practical Tips",
      motivation: "Daily Inspiration"
    },
    stories: {
      title: "Real Success Stories from Israel",
      description: "Real people who successfully changed their financial situation",
      readMore: "Read more",
      readLess: "Read less",
      categories: {
        debt: "Debt Payoff",
        savings: "Savings",
        investment: "Investments",
        budgeting: "Budgeting",
        career: "Career",
        business: "Business"
      },
      filterBy: "Filter by category",
      allCategories: "All Categories",
      timeframe: "Timeframe",
      outcome: "Outcome",
      challenge: "Challenge",
      solution: "Solution",
      result: "Final Result",
      lessonLearned: "Lesson Learned",
      months: "months",
      years: "years",
      inspiration: {
        title: "What you can learn from this story",
        takeaway: "Key Takeaway"
      }
    },
    myProgress: {
      title: "Your Financial Journey",
      description: "Track your progress and celebrate your achievements",
      startDate: "Start Date",
      currentStatus: "Current Status",
      achievements: "Achievements",
      nextGoals: "Next Goals",
      milestones: {
        title: "Important Milestones",
        firstBudget: "First budget created",
        firstSavings: "First savings achieved",
        debtReduction: "Debt reduction",
        emergencyFund: "Emergency fund established",
        investmentStart: "Investment journey started",
        financialGoals: "Financial goals achieved"
      },
      metrics: {
        monthsTracking: "Months tracking",
        totalSaved: "Total saved",
        debtReduced: "Debt reduced",
        budgetSuccess: "Budget success",
        savingsRate: "Savings rate"
      },
      encouragement: {
        title: "Words of Encouragement",
        justStarted: "Great! You've started your financial journey",
        makingProgress: "You're making excellent progress!",
        onTrack: "You're on track to achieve your goals",
        excellent: "Impressive achievements! Keep it up!"
      },
      noData: {
        title: "Start Your Financial Journey",
        description: "Create your first budget and start tracking your transactions",
        cta: "Create Budget Now"
      }
    },
    tips: {
      title: "Practical Financial Management Tips",
      description: "Proven advice from people who successfully improved their financial situation",
      categories: {
        budgeting: "Budgeting",
        saving: "Saving",
        debt: "Debt Management",
        investing: "Investing",
        mindset: "Mindset"
      },
      difficulty: {
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced"
      },
      timeToImplement: "Implementation time",
      potentialSavings: "Potential savings",
      tipDetails: {
        overview: "Overview",
        steps: "Implementation steps",
        benefits: "Benefits",
        commonMistakes: "Common mistakes"
      }
    },
    motivation: {
      title: "Daily Inspiration",
      description: "Inspiring quotes and thoughts for your financial journey",
      quoteOfTheDay: "Quote of the Day",
      financialWisdom: "Financial Wisdom",
      categories: {
        success: "Success",
        persistence: "Persistence",
        planning: "Planning",
        discipline: "Discipline",
        wealth: "Wealth",
        mindset: "Mindset"
      },
      dailyChallenge: {
        title: "Daily Challenge",
        description: "A small challenge that can improve your financial situation today"
      },
      weeklyGoal: {
        title: "Weekly Goal",
        description: "A small financial goal for the upcoming week"
      }
    },
    common: {
      readMore: "Read more",
      readLess: "Read less",
      share: "Share",
      save: "Save",
      like: "Like",
      comment: "Add comment",
      filterBy: "Filter by",
      sortBy: "Sort by",
      newest: "Newest",
      oldest: "Oldest",
      mostPopular: "Most Popular",
      relevance: "Relevance",
      difficulty: "Difficulty level",
      timeRequired: "Time required",
      potentialImpact: "Potential impact",
      getStarted: "Get Started",
      learnMore: "Learn More",
      apply: "Apply",
      bookmark: "Bookmark"
    }
  },
  auth: {
    signOut: "Sign Out",
    signingOut: "Signing Out...",
    signingOutDescription: "Signing out of the system",
    signOutError: "Sign Out Error",
    signOutErrorDescription: "An error occurred during sign out. Please try again."
  },
  onboarding: {
    progress: "Progress",
    skip: "Skip",
    tips: "Tips",
    previous: "Previous",
    next: "Next",
    getStarted: "Let's Get Started!",
    quickStart: "Or start directly with:",

    welcome: {
      title: "Welcome to Dash:IQ!",
      description: "Smart and advanced personal financial management system",
      feature1: "Automatic analysis of your expenses",
      feature2: "Personalized insights on financial habits",
      feature3: "Smart budget management with alerts",
      feature4: "Built-in AI financial assistant"
    },

    upload: {
      title: "Step 1: Upload Data",
      description: "Start by uploading a CSV file with your financial data",
      action: "Start Uploading Data",
      tip1: "Supports CSV files from banks or credit cards",
      tip2: "File should contain columns: date, business name, amount",
      tip3: "System automatically detects income vs expenses"
    },

    categories: {
      title: "Step 2: Organize Categories",
      description: "Organize your transactions into clear categories for better analysis",
      action: "Manage Categories",
      tip1: "We've already created basic categories for you",
      tip2: "You can create custom categories",
      tip3: "Set up automatic rules for transaction classification"
    },

    budget: {
      title: "Step 3: Set Budget",
      description: "Set budgets for each category to control your spending",
      action: "Create Budget",
      tip1: "Start with a simple monthly budget",
      tip2: "Get alerts when approaching limits",
      tip3: "Track progress in real-time"
    },

    insights: {
      title: "Step 4: Insights & Tracking",
      description: "Now you can see the full picture and get smart insights",
      action: "View Dashboard",
      tip1: "Get detailed analysis of spending habits",
      tip2: "Identify savings opportunities",
      tip3: "Track trends over time"
    }
  },
  toast: {
    // General success messages
    success: "Success",
    error: "Error",
    info: "Info",
    warning: "Warning",
    
    // Settings related toasts
    settingsSaved: "Settings saved successfully",
    languageChanged: "Language changed successfully",
    currencyChanged: "Currency changed successfully",
    preferencesUpdated: "Your preferences have been updated successfully",
    
    // Transaction related toasts
    transactionAdded: "Transaction added successfully",
    transactionUpdated: "Transaction updated successfully",
    transactionDeleted: "Transaction deleted successfully",
    transactionsImported: "Transactions imported successfully",
    transactionsCategorized: "Transactions categorized successfully",
    
    // Category related toasts
    categoryAdded: "Category added successfully",
    categoryUpdated: "Category updated successfully",
    categoryDeleted: "Category deleted successfully",
    categoryInUse: "Cannot delete category that is in use",
    
    // Budget related toasts
    budgetCreated: "Budget created successfully",
    budgetUpdated: "Budget updated successfully",
    budgetDeleted: "Budget deleted successfully",
    budgetExists: "Budget for this category already exists",
    
    // Upload related toasts
    fileUploaded: "File uploaded successfully",
    fileProcessed: "File processed successfully",
    uploadError: "Error uploading file",
    fileFormatError: "File format not supported",
    
    // Backup/Snapshot related toasts
    snapshotCreated: "Backup created successfully",
    snapshotDeleted: "Backup deleted successfully",
    snapshotRestored: "Backup restored successfully",
    backupError: "Error creating backup",
    
    // Clean state related toasts
    cleanState: {
      successTitle: "Reset Completed Successfully",
      successDescription: "Deleted {{totalDeleted}} records: {{transactions}} transactions, {{budgets}} budgets, {{categories}} categories",
      noDataDeletedTitle: "System Already Clean",
      noDataDeletedDescription: "No data found to delete",
      partialSuccessTitle: "Reset Partially Completed",
      partialSuccessDescription: "Some data was successfully deleted",
      categoriesRestoredTitle: "Default Categories Restored",
      categoriesRestoredDescription: "Recreated {{count}} default categories",
      confirmationError: "Wrong confirmation text",
      confirmationDescription: "Please type: {{requiredText}}",
      startingTitle: "Starting Reset",
      startingDescription: "Deleting all data and returning to default state",
      errorTitle: "Reset Error",
      errorGeneral: "An error occurred during system reset",
      errorRateLimit: "Too many requests. Please try again in a few minutes",
      errorServer: "Server error. Please try again later"
    },
    
    // Duplicate management toasts
    duplicatesFound: "Duplicate transactions found",
    duplicatesResolved: "Duplicates resolved successfully",
    duplicateSkipped: "Duplicate transaction skipped",
    
    // Rule management toasts
    ruleAdded: "Classification rule added successfully",
    ruleUpdated: "Classification rule updated successfully",
    ruleDeleted: "Classification rule deleted successfully",
    
    // Authentication toasts
    loginSuccess: "Logged in successfully",
    logoutSuccess: "Logged out successfully",
    sessionExpired: "Session expired",
    
    // Data loading toasts
    dataLoaded: "Data loaded successfully",
    dataRefreshed: "Data refreshed successfully",
    loadingError: "Error loading data",
    
    // Export/Import toasts
    dataExported: "Data exported successfully",
    exportError: "Error exporting data",
    templateDownloaded: "Template downloaded successfully",
    
    // Validation toasts
    invalidInput: "Invalid input",
    requiredField: "Required field missing",
    validationError: "Data validation error",
    
    // Network toasts
    networkError: "Network issue - check your internet connection",
    serverError: "Server error - please try again later",
    rateLimitError: "Too many requests - please try again in a few minutes"
  },
};

// Supported languages - Hebrew and English only
export const SUPPORTED_LANGUAGES = {
  he: {
    code: 'he',
    name: 'עברית',
    nativeName: 'עברית',
    direction: 'rtl',
    flag: '🇮🇱',
    locale: 'he-IL'
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
    locale: 'en-US'
  }
};

const DEFAULT_LANGUAGE = 'he';

const translations = {
  he: heTranslations,
  en: enTranslations
};

// Language change listeners
const languageChangeListeners = new Set();

// Get language from localStorage or default
const getStoredLanguage = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preferredLanguage');
    if (stored && SUPPORTED_LANGUAGES[stored]) {
      return stored;
    }

    // Try to detect from browser
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGUAGES[browserLang]) {
      return browserLang;
    }
  }
  return DEFAULT_LANGUAGE;
};

// Current language state
let currentLanguage = getStoredLanguage();

// Context
const I18nContext = createContext();

// Provider component
export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getStoredLanguage());

  const changeLanguage = (langCode) => {
    if (SUPPORTED_LANGUAGES[langCode]) {
      setLanguageState(langCode);
      currentLanguage = langCode;

      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredLanguage', langCode);
        document.documentElement.dir = SUPPORTED_LANGUAGES[langCode].direction;
        document.documentElement.lang = langCode;

        // Force re-render of the entire app
        // Using setTimeout to ensure all synchronous updates complete before reload
        setTimeout(() => {
          window.location.reload();
        }, 0);
      }

      languageChangeListeners.forEach(listener => listener(langCode));
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.dir = SUPPORTED_LANGUAGES[language].direction;
      document.documentElement.lang = language;
    }
  }, [language]);

  const value = {
    currentLanguage: language,
    changeLanguage,
    availableLanguages: Object.values(SUPPORTED_LANGUAGES)
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook to use i18n context
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    // Return fallback object instead of throwing error
    // Note: The `changeLanguage` here refers to the exported utility function, which reloads the page.
    return {
      currentLanguage: getCurrentLanguage(),
      changeLanguage: changeLanguage, // Corrected: refers to the globally exported `changeLanguage` utility
      availableLanguages: Object.values(SUPPORTED_LANGUAGES)
    };
  }
  return context;
};

// Get nested value from object using dot notation
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// Translation function with better fallback
export const t = (key, options = {}) => {
  const currentLang = getCurrentLanguage();
  const currentTranslations = translations[currentLang] || translations[DEFAULT_LANGUAGE];

  let translation = getNestedValue(currentTranslations, key);

  // Fallback to default language if translation not found
  if (translation === null && currentLang !== DEFAULT_LANGUAGE) {
    translation = getNestedValue(translations[DEFAULT_LANGUAGE], key);
  }

  // If still not found, return a user-friendly fallback
  if (translation === null) {
    console.warn(`Translation missing for key: ${key} in language: ${currentLang}`);
    // Return the last part of the key as fallback
    return key.split('.').pop();
  }

  // Handle interpolation
  if (typeof translation === 'string' && options) {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return options[variable] !== undefined ? options[variable] : match;
    });
  }

  return translation;
};

// Get current language
export const getCurrentLanguage = () => {
  return currentLanguage;
};

// Set language (utility function, typically used outside React components or for initial setup)
// Renamed from `setLanguage` to `changeLanguage` for consistency
export const changeLanguage = (langCode) => {
  if (SUPPORTED_LANGUAGES[langCode]) {
    currentLanguage = langCode;

    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', langCode);
      document.documentElement.dir = SUPPORTED_LANGUAGES[langCode].direction;
      document.documentElement.lang = langCode;

      languageChangeListeners.forEach(listener => listener(langCode));

      // Force page reload to ensure all components update
      // Using setTimeout to ensure all synchronous updates complete before reload
      setTimeout(() => {
        window.location.reload();
      }, 0);
    }
  }
};

// Get language info
export const getLanguageInfo = (langCode = null) => {
  const lang = langCode || getCurrentLanguage();
  return SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
};

// Check if current language is RTL
export const isRTL = (langCode = null) => {
  const lang = langCode || getCurrentLanguage();
  return SUPPORTED_LANGUAGES[lang]?.direction === 'rtl';
};

// Subscribe to language changes
export const subscribeToLanguageChange = (callback) => {
  languageChangeListeners.add(callback);
  return () => languageChangeListeners.delete(callback);
};

// Get supported languages for external use
export function getSupportedLanguages() {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    code,
    ...info
  }));
}

// Available currencies (limited to USD and ILS only)
const SUPPORTED_CURRENCIES = {
  'USD': {
    symbol: '$',
    code: 'USD',
    name: 'US Dollar',
    nameHe: 'דולר אמריקאי'
  },
  'ILS': {
    symbol: '₪',
    code: 'ILS', 
    name: 'Israeli Shekel',
    nameHe: 'שקל חדש'
  }
};

// Get user currency from cache or context
const getUserCurrency = () => {
  if (typeof window === 'undefined') return 'ILS';
  
  // Try localStorage first
  const cached = localStorage.getItem('userCurrency');
  if (cached && SUPPORTED_CURRENCIES[cached]) {
    return cached;
  }
  
  return 'ILS'; // Default fallback
};

// Format currency based on user preferences
export const formatCurrency = (amount, options = {}) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₪0';
  }

  const currency = options.currency || getUserCurrency();
  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['ILS'];
  
  // Use simple formatting for better performance and reliability
  const formattedNumber = Math.round(amount).toLocaleString();
  
  // Return with symbol based on currency
  if (currency === 'USD') {
    return `$${formattedNumber}`;
  } else {
    return `₪${formattedNumber}`;
  }
};

// Get currency symbol only
export const getCurrencySymbol = (currency = null) => {
  const curr = currency || getUserCurrency();
  return SUPPORTED_CURRENCIES[curr]?.symbol || '₪';
};

// Get supported currencies list
export const getSupportedCurrencies = () => {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    code,
    symbol: info.symbol,
    name: getCurrentLanguage() === 'he' ? info.nameHe : info.name
  }));
};

// Format date based on current language
export const formatDate = (date, options = {}) => {
  const langInfo = getLanguageInfo();
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  try {
    return new Intl.DateTimeFormat(langInfo.locale, {
      ...defaultOptions,
      ...options
    }).format(new Date(date));
  } catch (error) {
    // Fallback formatting
    console.error("Error formatting date:", error);
    return new Date(date).toLocaleDateString();
  }
};

// Format number based on current language
export const formatNumber = (number, options = {}) => {
  const langInfo = getLanguageInfo();

  try {
    return new Intl.NumberFormat(langInfo.locale, options).format(number);
  } catch (error) {
    // Fallback formatting
    console.error("Error formatting number:", error);
    return number.toLocaleString();
  }
};
