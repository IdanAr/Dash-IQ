
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Transaction, Category } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Edit, Search, Filter, SortDesc, Download, Plus, Check, X, Trash2, Clipboard, ScanLine, ChevronDown, Brain } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
// DuplicatesDialog is removed as its functionality is moved to a separate page
// import DuplicatesDialog from "../components/transactions/DuplicatesDialog"; 
import { truncateText } from "@/components/utils";
import { FolderOpen, PlusCircle, FileUp } from "lucide-react";
import { t, isRTL, formatCurrency, formatDate } from '@/components/utils/i18n';
// Removed performanceMonitor import as it's no longer used for debounce or measurePerformance here
import { debounce } from '@/components/utils/index'; // Added debounce import
import EnhancedClassificationEngine from "../components/transactions/EnhancedClassificationEngine";
import PhoneticClusteringVisualization from "../components/transactions/PhoneticClusteringVisualization";

// Component for adding/editing a transaction
const AddTransactionModal = ({ isOpen, onClose, onSave, categories, initialData }) => {
    const [formData, setFormData] = useState(initialData || {
        date: format(new Date(), 'yyyy-MM-dd'),
        business_name: "",
        category_id: "",
        billing_amount: "",
        is_income: false,
        details: ""
    });
    const isEditing = !!initialData;
    const isRTLLayout = isRTL();

    useEffect(() => {
        setFormData(initialData || {
            date: format(new Date(), 'yyyy-MM-dd'),
            business_name: "",
            category_id: "",
            billing_amount: "",
            is_income: false,
            details: ""
        });
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleAmountChange = (e) => {
        setFormData(prev => ({
            ...prev,
            billing_amount: e.target.value,
            transaction_amount: parseFloat(e.target.value)
        }));
    };

    const handleCategoryChange = (value) => {
        const category = categories.find(c => c.id === value);
        setFormData(prev => ({
            ...prev,
            category_id: value,
            is_income: category?.type === 'income'
        }));
    };

    const handleRadioChange = (isIncomeValue) => {
        setFormData(prev => ({
            ...prev,
            is_income: isIncomeValue,
            category_id: ''
        }));
    };

    const handleSubmit = () => {
        if (!formData.business_name || !formData.billing_amount) {
            return;
        }
        onSave(formData, isEditing);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]" dir={isRTLLayout ? 'rtl' : 'ltr'}>
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        {isEditing ? t('transactions.modal.editTitle') : t('transactions.modal.addTitle')}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 mt-1">
                        {isEditing ? t('transactions.modal.editDescription') : t('transactions.modal.addDescription')}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-gray-700 font-medium">
                            {t('transactions.modal.fields.date')} *
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_name" className="text-gray-700 font-medium">
                            {t('transactions.modal.fields.businessName')} *
                        </Label>
                        <Input
                            id="business_name"
                            type="text"
                            placeholder={t('transactions.modal.placeholders.businessName')}
                            value={formData.business_name}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="billing_amount" className="text-gray-700 font-medium">
                            {t('transactions.modal.fields.amount')} *
                        </Label>
                        <Input
                            id="billing_amount"
                            type="number"
                            step="0.01"
                            placeholder={t('transactions.modal.placeholders.amount')}
                            value={formData.billing_amount}
                            onChange={handleAmountChange}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                            {t('transactions.modal.fields.type')} *
                        </Label>
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="transactionType"
                                    checked={!formData.is_income}
                                    onChange={() => handleRadioChange(false)}
                                    className="text-blue-600"
                                />
                                <span>{t('transactions.modal.types.expense')}</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="transactionType"
                                    checked={formData.is_income}
                                    onChange={() => handleRadioChange(true)}
                                    className="text-blue-600"
                                />
                                <span>{t('transactions.modal.types.income')}</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category_id" className="text-gray-700 font-medium">
                            {t('transactions.modal.fields.category')} *
                        </Label>
                        <Select value={formData.category_id} onValueChange={handleCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('common.select')} />
                            </SelectTrigger>
                            <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                                {categories
                                    .filter(cat => cat.type === (formData.is_income ? 'income' : 'expense'))
                                    .map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="details" className="text-gray-700 font-medium">
                            {t('transactions.modal.fields.details')}
                        </Label>
                        <Input
                            id="details"
                            type="text"
                            placeholder={t('transactions.modal.placeholders.details')}
                            value={formData.details || ""}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose}>
                        {t('transactions.modal.actions.cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.business_name || !formData.billing_amount || !formData.category_id}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isEditing ? t('transactions.modal.actions.update') : t('transactions.modal.actions.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); // Renamed from showModal
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [filter, setFilter] = useState({
    search: "",
    categories: [],
    startDate: "",
    endDate: "",
    type: ""
  });
  const [sortBy, setSortBy] = useState({ field: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // New state for bulk operations. Duplicates states removed as functionality moved to new page.
  const [isBulkCategoryDialogOpen, setIsBulkCategoryDialogOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  // isDuplicatesDialogOpen, duplicateSets, isDuplicatesLoading states removed.
  const [isExporting, setIsExporting] = useState(false); // New state for export
  
  // Delete confirmation states
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // New states for Classification Engine
  const [showClassificationEngine, setShowClassificationEngine] = useState(false);
  const [classificationResults, setClassificationResults] = useState(null);
  const [classificationStats, setClassificationStats] = useState(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRTLLayout = isRTL();

  // Helper function to get category name - moved to top level
  const getCategoryName = useCallback((categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || t('common.uncategorized');
  }, [categories]);

  // Fixed debounced search
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      setFilter(prev => ({ ...prev, search: searchTerm }));
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Enhanced sorting function
  const handleSort = (field) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  // Enhanced filtered and sorted transactions
  const filteredAndSortedTransactions = useMemo(() => {
    const applySearch = (transactionsToFilter) => {
        if (!filter.search) return transactionsToFilter;
        const searchTerm = filter.search.toLowerCase();
        return transactionsToFilter.filter(t =>
            t.business_name.toLowerCase().includes(searchTerm) ||
            t.details?.toLowerCase().includes(searchTerm) ||
            getCategoryName(t.category_id).toLowerCase().includes(searchTerm)
        );
    };

    const applyDateRange = (transactionsToFilter) => {
        return transactionsToFilter.filter(t => {
            const transactionDate = new Date(t.date);
            if (filter.startDate && transactionDate < new Date(filter.startDate)) return false;
            if (filter.endDate && transactionDate > new Date(filter.endDate)) return false;
            return true;
        });
    };

    const applyCategoryFilter = (transactionsToFilter) => {
        if (filter.categories.length === 0) return transactionsToFilter;
        return transactionsToFilter.filter(t => filter.categories.includes(t.category_id));
    };

    const applyTypeFilter = (transactionsToFilter) => {
        if (!filter.type) return transactionsToFilter;
        return transactionsToFilter.filter(t => (filter.type === 'income' ? t.is_income : !t.is_income));
    };

    const applySorting = (transactionsToSort) => {
        return [...transactionsToSort].sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy.field) {
                case 'date':
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
                    break;
                case 'business_name':
                    aValue = a.business_name?.toLowerCase();
                    bValue = b.business_name?.toLowerCase();
                    break;
                case 'category':
                    aValue = getCategoryName(a.category_id)?.toLowerCase();
                    bValue = getCategoryName(b.category_id)?.toLowerCase();
                    break;
                case 'amount':
                    aValue = parseFloat(a.billing_amount) || 0;
                    bValue = parseFloat(b.billing_amount) || 0;
                    break;
                case 'type':
                    aValue = a.is_income ? 1 : 0;
                    bValue = b.is_income ? 1 : 0;
                    break;
                default:
                    return 0;
            }
            
            // Handle null/undefined values for string comparisons gracefully
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                if (aValue < bValue) return sortBy.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortBy.direction === 'asc' ? 1 : -1;
                return 0;
            } else {
                if (aValue < bValue) return sortBy.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortBy.direction === 'asc' ? 1 : -1;
                return 0;
            }
        });
    };

    let result = transactions;
    result = applySearch(result);
    result = applyDateRange(result);
    result = applyCategoryFilter(result);
    result = applyTypeFilter(result);
    result = applySorting(result);
    
    return result;
  }, [transactions, filter, getCategoryName, sortBy]);

  // Memoized pagination data
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedTransactions, currentPage, itemsPerPage]);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Removed performanceMonitor.measurePerformance as it's no longer used
      const [transactionsData, categoriesData] = await Promise.all([
        Transaction.list('-date', 5000), 
        Category.list('name')
      ]);

      const data = [transactionsData, categoriesData];

      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({
        title: t('common.error'),
        description: t('transactions.messages.loadingError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTransactions();
    return () => {
      // Removed performanceMonitor.clearCache() as performanceMonitor is no longer used
    };
  }, [loadTransactions]);

  const handleSaveTransaction = async (formData, isEditing) => {
    try {
      const transactionData = {
        date: formData.date,
        business_name: formData.business_name,
        billing_amount: parseFloat(formData.billing_amount),
        transaction_amount: parseFloat(formData.billing_amount),
        category_id: formData.category_id,
        is_income: formData.is_income,
        details: formData.details || null
      };

      if (isEditing) {
        await Transaction.update(editingTransaction.id, transactionData);
        toast({
          title: t('toast.success'),
          description: t('toast.transactionUpdated'),
        });
      } else {
        await Transaction.create(transactionData);
        toast({
          title: t('toast.success'),
          description: t('toast.transactionAdded'),
        });
      }

      setIsFormOpen(false); // Changed from setShowModal
      setEditingTransaction(null);
      loadTransactions();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast({
        title: t('toast.error'),
        description: t('toast.serverError'),
        variant: "destructive",
      });
    }
  };

  // Individual transaction delete function
  const handleDeleteTransaction = async (transactionId) => {
    try {
      await Transaction.delete(transactionId);
      toast({
        title: t('toast.success'),
        description: t('toast.transactionDeleted'),
      });
      
      // Remove from selected transactions if it was selected
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
      
      loadTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: t('toast.error'),
        description: t('toast.serverError'),
        variant: "destructive",
      });
    }
  };

  // Bulk delete function
  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: t('common.warning'),
        description: t('transactions.bulkActions.noTransactionsSelected'),
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete all selected transactions
      const deletePromises = selectedTransactions.map(id => Transaction.delete(id));
      await Promise.all(deletePromises);

      toast({
        title: t('common.success'),
        description: t('transactions.bulkActions.deleteSuccess', { count: selectedTransactions.length }),
      });

      // Clear selection and reload
      setSelectedTransactions([]);
      setShowBulkDeleteConfirm(false);
      loadTransactions();
    } catch (error) {
      console.error("Error bulk deleting transactions:", error);
      toast({
        title: t('common.error'),
        description: t('transactions.messages.deletingError'),
        variant: "destructive",
      });
    }
  };

  const handleBulkCategorize = async () => {
    if (selectedTransactions.length === 0 || !bulkCategoryId) {
      toast({
        title: t('common.error'),
        description: t('transactions.bulkActions.selectCategoryAndTransactions'),
        variant: "destructive",
      });
      return;
    }

    try {
      const updatePromises = selectedTransactions.map(transactionId => {
        const transaction = transactions.find(t => t.id === transactionId);
        return Transaction.update(transactionId, { ...transaction, category_id: bulkCategoryId });
      });

      await Promise.all(updatePromises);

      const categoryName = categories.find(c => c.id === bulkCategoryId)?.name || t('common.uncategorized');
      toast({
        title: t('common.success'),
        description: t('transactions.bulkActions.categorizeSuccess', {
          count: selectedTransactions.length,
          categoryName
        }),
      });

      setSelectedTransactions([]);
      setBulkCategoryId("");
      setIsBulkCategoryDialogOpen(false);
      loadTransactions();
    } catch (error) {
      console.error("Error bulk categorizing:", error);
      toast({
        title: t('common.error'),
        description: t('transactions.messages.savingError'),
        variant: "destructive",
      });
    }
  };

  // findDuplicates, handleResolveDuplicates, handleIgnoreDuplicateSet functions are removed
  // as duplicate detection is now handled via navigation to a separate page.

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const csvHeaders = [
        'Date',
        'Business Name', 
        'Transaction Amount',
        'Billing Amount',
        'Details',
        'Category',
        'Is Income'
      ];

      const csvData = filteredAndSortedTransactions.map(transaction => {
        const category = categories.find(c => c.id === transaction.category_id);
        // Format date as DD/MM/YYYY
        const formattedDate = format(parseISO(transaction.date), 'dd/MM/yyyy');
        
        // Function to escape double quotes within a field and wrap in double quotes
        const escapeAndQuote = (value) => {
          const stringValue = String(value || '');
          return `"${stringValue.replace(/"/g, '""')}"`;
        };

        return [
          formattedDate,
          escapeAndQuote(transaction.business_name),
          parseFloat(transaction.transaction_amount || 0).toString(),
          parseFloat(transaction.billing_amount || 0).toString(),
          escapeAndQuote(transaction.details),
          escapeAndQuote(category ? category.name : t('common.uncategorized')),
          transaction.is_income ? 'Yes' : 'No'
        ].join(',');
      });

      const csvContent = [csvHeaders.join(','), ...csvData].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({
        title: t('common.success'),
        description: t('transactions.messages.exportSuccess'),
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: t('common.error'),
        description: t('transactions.messages.exportError'),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCategoryFilterChange = (categoryId) => {
    setFilter(prev => {
      const updatedCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories: updatedCategories };
    });
  };

  const clearCategoryFilters = () => {
    setFilter(prev => ({ ...prev, categories: [] }));
  };

  // Handle select all checkbox
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTransactions(paginatedTransactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  // Handle individual transaction selection
  const handleTransactionSelect = (transactionId, checked) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleClassificationComplete = async (results, stats) => {
    try {
      console.log('Classification completed:', { results: results.length, stats });
      
      // Apply classifications to transactions
      const updates = [];
      for (const result of results) {
        if (result.confidence >= 0.6) { // Only apply high-confidence classifications
          const category = categories.find(c => c.name === result.suggestedCategory);
          if (category) {
            updates.push({
              id: result.transactionId,
              category_id: category.id
            });
          }
        }
      }
      
      // Batch update transactions
      const updatePromises = updates.map(update => 
        Transaction.update(update.id, { category_id: update.category_id })
      );
      
      await Promise.all(updatePromises);
      
      toast({
        title: t('common.success'),
        description: `${updates.length} עסקאות סווגו אוטומטית בהצלחה`,
      });
      
      // Reload transactions to show updated categories
      loadTransactions();
      
      setClassificationResults(results);
      setClassificationStats(stats);
      
    } catch (error) {
      console.error('Error applying classifications:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: 'שגיאה ביישום התוצאות',
      });
    }
  };

  // Helper function to render sort icon with proper RTL support
  const renderSortIcon = (field) => {
    if (sortBy.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortBy.direction === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Updated total filtered transactions count
  const totalFilteredTransactions = filteredAndSortedTransactions.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-blue-600" />
              {t('transactions.title')}
            </h1>
            <p className="text-gray-600 mt-1">{t('transactions.subtitle')}</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('transactions.empty.title')}
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {t('transactions.empty.description')}
            </p>
            <div className="flex gap-4">
              <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                {t('transactions.empty.addFirst')}
              </Button>
              <Button variant="outline" onClick={() => navigate(createPageUrl('Upload'))}>
                <FileUp className="w-4 h-4 mr-2" />
                {t('transactions.empty.uploadFile')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <AddTransactionModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveTransaction}
          categories={categories}
          initialData={editingTransaction}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-blue-600" />
            {t('transactions.title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('transactions.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {/* New Duplicates button navigates to a new page */}
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('TransactionsDuplicates'))}
            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            <Search className="w-4 h-4 mr-2" />
            {t('transactions.findDuplicates')}
          </Button>
          {/* Original Export button */}
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={isExporting}
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? t('common.loading') : t('transactions.exportCSV')}
          </Button>
          {/* Original Add Transaction button */}
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('transactions.addTransaction')}
          </Button>
        </div>
      </div>

      {/* Enhanced Classification Engine */}
      {showClassificationEngine && (
        <EnhancedClassificationEngine
          transactions={filteredAndSortedTransactions.filter(t => !t.category_id)} // Only unclassified
          onClassificationComplete={handleClassificationComplete}
          onProgress={(progress, step) => {
            console.log('Classification progress:', progress, step);
          }}
          categories={categories}
        />
      )}

      {/* Clustering Visualization */}
      {classificationResults && (
        <PhoneticClusteringVisualization
          clusters={classificationStats?.clusteringInfo?.clusters || []} // Added optional chaining
          originalTransactionCount={classificationStats?.totalTransactions} // Added optional chaining
          processingStats={classificationStats}
          categories={categories} // Pass categories for mapping IDs to names if needed
        />
      )}

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('transactions.filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">{t('transactions.filters.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('transactions.filters.searchPlaceholder')}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="startDate">{t('transactions.filters.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">{t('transactions.filters.endDate')}</Label>
              <Input
                id="endDate"
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="type">{t('transactions.filters.type')}</Label>
              <Select value={filter.type} onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transactions.filters.allTypes')} />
                </SelectTrigger>
                <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                  <SelectItem value={null}>{t('transactions.filters.allTypes')}</SelectItem>
                  <SelectItem value="expense">{t('transactions.filters.expenses')}</SelectItem>
                  <SelectItem value="income">{t('transactions.filters.income')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Label>{t('transactions.filters.categories')}</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={filter.categories.includes(category.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleCategoryFilterChange(category.id)}
                >
                  {category.name}
                  {filter.categories.includes(category.id) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
            {filter.categories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCategoryFilters}
                className="mt-2"
              >
                {t('transactions.filters.clearCategories')}
              </Button>
            )}
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              {t('transactions.filters.showing')} {totalFilteredTransactions} {t('common.of')} {transactions.length} {t('transactions.filters.results')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter({ search: "", categories: [], startDate: "", endDate: "", type: "" })}
            >
              {t('transactions.filters.clearAll')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTransactions.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('transactions.bulkActions.selectedCount', { count: selectedTransactions.length })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkCategoryDialogOpen(true)}
                >
                  <Clipboard className="w-4 h-4 mr-2" />
                  {t('transactions.bulkActions.changeCategory')}

                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('transactions.bulkActions.deleteSelected')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('transactions.table.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div dir={isRTLLayout ? 'rtl' : 'ltr'}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={`w-[50px] ${isRTLLayout ? 'text-right' : 'text-left'}`}>
                    <div className={`flex ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                      <Checkbox
                        checked={selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label={t('transactions.table.selectAll')}
                      />
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`cursor-pointer hover:bg-gray-50 select-none ${isRTLLayout ? 'text-right' : 'text-left'}`}
                    onClick={() => handleSort('date')}
                  >
                    <div className={`flex items-center gap-1 ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                      <span>{t('transactions.table.date')}</span>
                      {renderSortIcon('date')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`cursor-pointer hover:bg-gray-50 select-none ${isRTLLayout ? 'text-right' : 'text-left'}`}
                    onClick={() => handleSort('business_name')}
                  >
                    <div className={`flex items-center gap-1 ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                      <span>{t('transactions.table.businessName')}</span>
                      {renderSortIcon('business_name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`cursor-pointer hover:bg-gray-50 select-none ${isRTLLayout ? 'text-right' : 'text-left'}`}
                    onClick={() => handleSort('category')}
                  >
                    <div className={`flex items-center gap-1 ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                      <span>{t('transactions.table.category')}</span>
                      {renderSortIcon('category')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`cursor-pointer hover:bg-gray-50 select-none ${isRTLLayout ? 'text-right' : 'text-left'}`}
                    onClick={() => handleSort('amount')}
                  >
                    <div className={`flex items-center gap-1 ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                      <span>{t('transactions.table.amount')}</span>
                      {renderSortIcon('amount')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`cursor-pointer hover:bg-gray-50 select-none ${isRTLLayout ? 'text-right' : 'text-left'}`}
                    onClick={() => handleSort('type')}
                  >
                    <div className={`flex items-center gap-1 ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                      <span>{t('transactions.table.type')}</span>
                      {renderSortIcon('type')}
                    </div>
                  </TableHead>
                  <TableHead className={isRTLLayout ? 'text-right' : 'text-left'}>
                    <div className={`flex ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                      {t('transactions.table.actions')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className={isRTLLayout ? 'text-right' : 'text-left'}>
                      <div className={`flex ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                        <Checkbox
                          checked={selectedTransactions.includes(transaction.id)}
                          onCheckedChange={(checked) => handleTransactionSelect(transaction.id, checked)}
                          aria-label={t('transactions.table.selectTransactionAria', { id: transaction.id })}
                        />
                      </div>
                    </TableCell>
                    <TableCell className={isRTLLayout ? 'text-right' : 'text-left'}>
                      <div className={`flex ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                        {formatDate(new Date(transaction.date), 'dd/MM/yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className={isRTLLayout ? 'text-right' : 'text-left'}>
                      <div className={`flex ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                        {truncateText(transaction.business_name, 30)}
                      </div>
                    </TableCell>
                    <TableCell className={isRTLLayout ? 'text-right' : 'text-left'}>
                      <div className={`flex ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                        <Badge variant="outline">
                          {getCategoryName(transaction.category_id)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className={`font-medium ${isRTLLayout ? 'text-right' : 'text-left'}`}>
                      <div className={`flex ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                        {formatCurrency(transaction.billing_amount)}
                      </div>
                    </TableCell>
                    <TableCell className={isRTLLayout ? 'text-right' : 'text-left'}>
                      <div className={`flex ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                        <Badge className={transaction.is_income ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {transaction.is_income ? t('transactions.table.income') : t('transactions.table.expense')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className={isRTLLayout ? 'text-right' : 'text-left'}>
                      <div className={`flex gap-2 ${isRTLLayout ? 'justify-end' : 'justify-start'}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTransaction(transaction);
                            setIsFormOpen(true); // Changed from setShowModal
                          }}
                          aria-label={t('transactions.table.editTransactionAria', { id: transaction.id })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTransaction(transaction)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label={t('transactions.table.deleteTransactionAria', { id: transaction.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalFilteredTransactions === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('transactions.table.noData')}</p>
            </div>
          )}

          {/* Updated Pagination with RTL support */}
          {totalFilteredTransactions > itemsPerPage && (
            <div 
              className="flex justify-between items-center mt-4"
              style={{ 
                flexDirection: isRTLLayout ? 'row-reverse' : 'row',
                textAlign: isRTLLayout ? 'right' : 'left'
              }}
            >
              <p className="text-sm text-gray-600">
                {t('transactions.pagination.showing')} {Math.min(currentPage * itemsPerPage, totalFilteredTransactions)} {t('common.of')} {totalFilteredTransactions} {t('transactions.title')}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage * itemsPerPage >= totalFilteredTransactions}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
        <AlertDialogContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDeleteTransaction(deletingTransaction.id);
                setDeletingTransaction(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.bulkActions.confirmDelete', { count: selectedTransactions.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Category Change Dialog */}
      <Dialog open={isBulkCategoryDialogOpen} onOpenChange={setIsBulkCategoryDialogOpen}>
        <DialogContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('transactions.bulkActions.changeCategoryTitle')}</DialogTitle>
            {/* FIX: Removed duplicate closing </DialogDescription> tag here */}
            <DialogDescription>
              {t('transactions.bulkActions.changeCategoryDescription', { count: selectedTransactions.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkCategory">{t('transactions.bulkActions.selectNewCategory')}</Label>
              <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transactions.bulkActions.selectCategory')} />
                </SelectTrigger>
                <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsBulkCategoryDialogOpen(false); setBulkCategoryId(""); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleBulkCategorize} disabled={!bulkCategoryId}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DuplicatesDialog component removed as its functionality is moved to a separate page */}
      {/*
      <DuplicatesDialog
        isOpen={isDuplicatesDialogOpen}
        onClose={() => {setIsDuplicatesDialogOpen(false); setDuplicateSets([]);}}
        duplicateSets={duplicateSets}
        onResolve={handleResolveDuplicates}
        onIgnoreSet={handleIgnoreDuplicateSet}
        categories={categories}
        isLoading={isDuplicatesLoading}
        isRTLLayout={isRTLLayout}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        t={t}
      />
      */}

      <AddTransactionModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false); // Changed from setShowModal
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        initialData={editingTransaction}
      />
    </div>
  );
}
