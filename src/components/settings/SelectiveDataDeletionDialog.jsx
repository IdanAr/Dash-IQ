
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash2, AlertTriangle, FileText, Target, FolderTree, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { t, isRTL } from "@/components/utils/i18n";
import { Transaction, Budget, Category, CategoryRule } from "@/api/entities";

const SelectiveDataDeletionDialog = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({
    transactions: false,
    budgets: false,
    categories: false,
    categoryRules: false
  });
  
  const { toast } = useToast();
  const isRTLLayout = isRTL();

  const requiredConfirmationText = "Delete Data";

  const deletionOptions = [
    {
      id: 'transactions',
      label: 'מחיקת כל העסקאות',
      description: 'מחיקה של כל העסקאות הפיננסיות שהוכנסו למערכת',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'categoryRules',
      label: 'מחיקת חוקי סיווג אוטומטי',
      description: 'מחיקה של כל החוקים לסיווג אוטומטי של עסקאות',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'budgets',
      label: 'מחיקת כל התקציבים',
      description: 'מחיקה של כל התקציבים שהוגדרו במערכת',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'categories',
      label: 'מחיקת קטגוריות מותאמות אישית',
      description: 'מחיקה של קטגוריות שיצרת (לא כולל קטגוריות ברירת מחדל)',
      icon: FolderTree,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const handleOptionChange = (optionId, checked) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: checked
    }));
  };

  const getSelectedCount = () => {
    return Object.values(selectedOptions).filter(Boolean).length;
  };

  const handleDelete = async () => {
    if (confirmationText !== requiredConfirmationText) {
      toast({
        title: 'שגיאה באישור',
        description: `יש להקליד בדיוק: "${requiredConfirmationText}"`,
        variant: "destructive",
      });
      return;
    }

    if (getSelectedCount() === 0) {
      toast({
        title: 'לא נבחרו פריטים',
        description: 'יש לבחור לפחות פריט אחד למחיקה',
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      console.log('Starting selective data deletion...', selectedOptions);
      
      let deletionResults = {
        transactions: 0,
        categoryRules: 0,
        budgets: 0,
        categories: 0
      };

      // Delete transactions
      if (selectedOptions.transactions) {
        console.log('Deleting transactions...');
        const transactions = await Transaction.list();
        for (const transaction of transactions) {
          await Transaction.delete(transaction.id);
        }
        deletionResults.transactions = transactions.length;
        console.log(`Deleted ${transactions.length} transactions`);
      }

      // Delete category rules
      if (selectedOptions.categoryRules) {
        console.log('Deleting category rules...');
        const categoryRules = await CategoryRule.list();
        for (const rule of categoryRules) {
          await CategoryRule.delete(rule.id);
        }
        deletionResults.categoryRules = categoryRules.length;
        console.log(`Deleted ${categoryRules.length} category rules`);
      }

      // Delete budgets
      if (selectedOptions.budgets) {
        console.log('Deleting budgets...');
        const budgets = await Budget.list();
        for (const budget of budgets) {
          await Budget.delete(budget.id);
        }
        deletionResults.budgets = budgets.length;
        console.log(`Deleted ${budgets.length} budgets`);
      }

      // Delete custom categories (but keep default ones)
      if (selectedOptions.categories) {
        console.log('Deleting custom categories...');
        const categories = await Category.list();
        
        // Default category names that should not be deleted
        const defaultCategoryNames = [
          'מזון ומשקאות', 'תחבורה', 'בילויים ופנאי', 'קניות כלליות', 
          'דיור והוצאות בית', 'בריאות וטיפוח', 'חינוך והשכלה', 'שונות',
          'Food & Beverages', 'Transportation', 'Entertainment & Leisure', 
          'General Shopping', 'Housing & Home Expenses', 'Health & Personal Care', 
          'Education & Learning', 'Miscellaneous', 'הכנסות', 'Income'
        ];

        const customCategories = categories.filter(cat => 
          !defaultCategoryNames.includes(cat.name)
        );

        for (const category of customCategories) {
          try {
            await Category.delete(category.id);
            deletionResults.categories++;
          } catch (error) {
            console.warn(`Could not delete category ${category.name}:`, error);
            // Continue with other categories
          }
        }
        console.log(`Deleted ${deletionResults.categories} custom categories`);
      }

      // Show success message
      const deletionSummary = [];
      if (deletionResults.transactions > 0) {
        deletionSummary.push(`${deletionResults.transactions} עסקאות`);
      }
      if (deletionResults.categoryRules > 0) {
        deletionSummary.push(`${deletionResults.categoryRules} חוקי סיווג`);
      }
      if (deletionResults.budgets > 0) {
        deletionSummary.push(`${deletionResults.budgets} תקציבים`);
      }
      if (deletionResults.categories > 0) {
        deletionSummary.push(`${deletionResults.categories} קטגוריות מותאמות`);
      }

      toast({
        title: 'מחיקה הושלמה בהצלחה',
        description: `נמחקו: ${deletionSummary.join(', ')}`,
        duration: 5000,
      });

      // Close dialog and reset
      setIsOpen(false);
      setConfirmationText('');
      setSelectedOptions({
        transactions: false,
        budgets: false,
        categories: false,
        categoryRules: false
      });
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error during selective deletion:', error);
      
      toast({
        title: 'שגיאה במחיקת נתונים',
        description: error.message || 'אירעה שגיאה במהלך מחיקת הנתונים',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open) => {
    if (!isDeleting) {
      setIsOpen(open);
      if (!open) {
        setConfirmationText('');
        setSelectedOptions({
          transactions: false,
          budgets: false,
          categories: false,
          categoryRules: false
        });
      }
    }
  };

  const isConfirmationValid = confirmationText === requiredConfirmationText;
  const hasSelectedOptions = getSelectedCount() > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full flex items-center gap-2"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          מחיקה סלקטיבית של נתונים
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-bold text-red-800">
                מחיקה סלקטיבית של נתונים
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 mt-1">
                בחר את הנתונים שברצונך למחוק מהמערכת
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="my-6 space-y-6">
          {/* Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">אזהרה חשובה:</p>
                <p>פעולת המחיקה אינה ניתנת לביטול. הנתונים שיימחקו לא יוכלו להיות משוחזרים.</p>
              </div>
            </div>
          </div>

          {/* Options Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">בחר נתונים למחיקה:</h3>
            
            <div className="grid gap-3">
              {deletionOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div key={option.id} className={`p-4 border rounded-lg transition-all ${
                    selectedOptions[option.id] 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={option.id}
                        checked={selectedOptions[option.id]}
                        onCheckedChange={(checked) => handleOptionChange(option.id, checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`p-1 rounded ${option.bgColor}`}>
                            <IconComponent className={`w-4 h-4 ${option.color}`} />
                          </div>
                          <Label htmlFor={option.id} className="font-medium cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasSelectedOptions && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  נבחרו {getSelectedCount()} פריטים למחיקה
                </p>
              </div>
            )}
          </div>

          {/* Confirmation Input */}
          {hasSelectedOptions && (
            <div className="space-y-3">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  לאישור המחיקה, הקלד בדיוק:
                </p>
                <code className="text-sm font-mono bg-yellow-100 px-2 py-1 rounded">
                  {requiredConfirmationText}
                </code>
              </div>
              
              <div>
                <Label htmlFor="confirmation">טקסט אישור:</Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={requiredConfirmationText}
                  className={`mt-1 ${
                    confirmationText && !isConfirmationValid 
                      ? 'border-red-300 focus:border-red-300' 
                      : ''
                  }`}
                  disabled={isDeleting}
                />
                {confirmationText && !isConfirmationValid && (
                  <p className="text-xs text-red-600 mt-1">
                    הטקסט אינו תואם לנדרש
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={isDeleting}>
            ביטול
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || !hasSelectedOptions || !isConfirmationValid}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                מוחק...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                מחק נתונים נבחרים
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SelectiveDataDeletionDialog;
