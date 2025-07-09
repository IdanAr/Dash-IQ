
import React, { useState, useEffect } from "react";
import { Transaction, Category } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle, Search, Edit, PlusCircle, Download
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { t, isRTL } from "@/components/utils/i18n";

// Minimal DuplicatesDialog component
function DuplicatesDialog({ isOpen, onClose, duplicates, onResolved }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('transactions.duplicatesDialogTitle')}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-2">{t('transactions.duplicatesFoundMessage')}</p>
          <ul className="list-disc pl-5 space-y-1">
            {duplicates.map((dup, index) => (
              <li key={index} className="text-sm">
                {dup.business_name} - {dup.billing_amount} - {format(new Date(dup.date), "dd/MM/yyyy")}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onResolved}>{t('common.ok')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EnhancedTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);

  // States for Add/Edit Transaction Dialog
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    business_name: "",
    billing_amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    category_id: "",
    details: "",
    is_income: false,
  });
  const [formErrors, setFormErrors] = useState({});

  // States for Duplicate Transactions Dialog
  const [isDuplicatesDialogOpen, setIsDuplicatesDialogOpen] = useState(false);
  const [duplicates, setDuplicates] = useState([]);

  const [bulkEditData, setBulkEditData] = useState({
    category_id: "",
    is_income: false,
    details: "",
    date: ""
  });
  const [bulkEditFields, setBulkEditFields] = useState({
    category_id: false,
    is_income: false,
    details: false,
    date: false
  });
  const [bulkError, setBulkError] = useState(null);
  const [bulkProcessProgress, setBulkProcessProgress] = useState(0);

  const isRTLLayout = isRTL();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        Transaction.list(),
        Category.list()
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.name || t('transactions.unclassified');
  };

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      if (filterType !== "all" &&
          (filterType === "income" ? !transaction.is_income : transaction.is_income)) {
        return false;
      }

      if (filterCategory !== "all" && transaction.category_id !== filterCategory) {
        return false;
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.business_name?.toLowerCase().includes(searchLower) ||
          transaction.details?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const newSelectedIds = new Set(getFilteredTransactions().map(t => t.id));
      setSelectedIds(newSelectedIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectTransaction = (id) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleBulkEdit = async () => {
    setBulkError(null);
    setBulkProcessProgress(0);

    try {
      const updateData = {};
      Object.keys(bulkEditFields).forEach(field => {
        if (bulkEditFields[field]) {
          if (field === 'date' && bulkEditData.date) {
            updateData[field] = new Date(bulkEditData.date).toISOString();
          } else {
            updateData[field] = bulkEditData[field];
          }
        }
      });

      if (Object.keys(updateData).length === 0) {
        throw new Error(t('bulkEdit.selectOneFieldError'));
      }

      const selectedTransactionIds = Array.from(selectedIds);
      const total = selectedTransactionIds.length;
      let completed = 0;

      for (const id of selectedTransactionIds) {
        await Transaction.update(id, updateData);
        completed++;
        setBulkProcessProgress(Math.round((completed / total) * 100));
      }

      setSelectedIds(new Set());
      setShowBulkEditDialog(false);
      setBulkEditFields({
        category_id: false,
        is_income: false,
        details: false,
        date: false
      });
      setBulkEditData({
        category_id: "",
        is_income: false,
        details: "",
        date: ""
      });
      setBulkProcessProgress(0);
      loadData();
    } catch (error) {
      console.error("Error during bulk edit:", error);
      setBulkError(error.message);
      setBulkProcessProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      business_name: "",
      billing_amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      category_id: "",
      details: "",
      is_income: false,
    });
    setFormErrors({});
    setEditingTransaction(null);
  };

  const handleAddTransactionClick = () => {
    resetForm();
    setIsFormDialogOpen(true);
  };

  const handleEditTransactionClick = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      business_name: transaction.business_name,
      billing_amount: transaction.billing_amount,
      date: format(new Date(transaction.date), "yyyy-MM-dd"),
      category_id: transaction.category_id,
      details: transaction.details || "",
      is_income: transaction.is_income,
    });
    setFormErrors({});
    setIsFormDialogOpen(true);
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.business_name) errors.business_name = t('transactions.validation.required');

    const amount = Number(data.billing_amount);
    if (isNaN(amount) || amount <= 0) {
      errors.billing_amount = t('transactions.validation.invalidAmount');
    }

    if (!data.date) errors.date = t('transactions.validation.required');
    if (data.date && new Date(data.date) > new Date()) {
      errors.date = t('transactions.validation.futureDate');
    }

    if (!data.category_id) errors.category_id = t('transactions.validation.required');
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        ...formData,
        billing_amount: Number(formData.billing_amount),
        date: new Date(formData.date).toISOString(),
      };

      if (editingTransaction) {
        await Transaction.update(editingTransaction.id, payload);
      } else {
        await Transaction.create(payload);
      }
      setIsFormDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      if (error.message === "DUPLICATE_TRANSACTION") {
        setDuplicates(error.duplicates || []);
        setIsDuplicatesDialogOpen(true);
      } else {
        alert(t('transactions.saveError', { error: error.message }));
      }
    }
  };

  const exportToCSV = () => {
    const transactionsToExport = getFilteredTransactions();

    const csvHeaders = [
      'Date',
      'Business Name',
      'Transaction Amount',
      'Billing Amount',
      'Details',
      'Category',
      'Is Income',
      'Created Date'
    ];

    const csvData = transactionsToExport.map(transaction => {
      const category = categories.find(c => c.id === transaction.category_id);
      // Format date as DD/MM/YYYY
      const formattedDate = transaction.date ? format(parseISO(transaction.date), 'dd/MM/yyyy') : '';
      // created_date is assumed to exist on the Transaction object
      const formattedCreatedDate = transaction.created_date ? format(parseISO(transaction.created_date), 'dd/MM/yyyy HH:mm') : '';

      const row = [
        formattedDate,
        transaction.business_name || '',
        parseFloat(transaction.billing_amount || 0).toString(), // Using billing_amount for both
        parseFloat(transaction.billing_amount || 0).toString(), // Using billing_amount for both
        transaction.details || '',
        category ? category.name : t('transactions.unclassified'),
        transaction.is_income ? 'Yes' : 'No',
        formattedCreatedDate
      ];

      // CSV escaping logic:
      // 1. Convert field to string.
      // 2. If the field contains a comma, double-quote, or newline,
      //    wrap it in double quotes and escape any internal double quotes by doubling them.
      return row.map(field => {
        let stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvData].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel compatibility
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen" dir={isRTLLayout ? "rtl" : "ltr"}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('transactions.title')}</h1>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowBulkEditDialog(true)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {t('transactions.bulkEdit', { count: selectedIds.size })}
              </Button>
            )}
            <Button
                variant="outline"
                onClick={exportToCSV}
                className="flex items-center gap-2"
            >
                <Download className="w-4 h-4" />
                {t('common.export')}
            </Button>
            <Button onClick={handleAddTransactionClick}>
              <PlusCircle className="w-4 h-4 mr-2" />
              {t('transactions.addTransaction')}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>{t('transactions.listTitle')}</CardTitle>
              <Tabs value={filterType} onValueChange={setFilterType}>
                <TabsList>
                  <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
                  <TabsTrigger value="expense">{t('transactions.expense')}</TabsTrigger>
                  <TabsTrigger value="income">{t('transactions.income')}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('transactions.searchPlaceholder')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('transactions.categoryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('transactions.allCategories')}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <table className="min-w-full divide-y">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-center">
                        <Checkbox
                          checked={selectedIds.size > 0 && selectedIds.size === getFilteredTransactions().length}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('transactions.date')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('transactions.businessName')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('transactions.amount')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('transactions.category')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('transactions.details')}</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('transactions.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : getFilteredTransactions().length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          {t('transactions.noTransactionsFound')}
                        </td>
                      </tr>
                    ) : (
                      getFilteredTransactions().map((transaction) => (
                        <tr
                          key={transaction.id}
                          className={selectedIds.has(transaction.id) ? "bg-blue-50" : ""}
                        >
                          <td className="px-4 py-4 text-center">
                            <Checkbox
                              checked={selectedIds.has(transaction.id)}
                              onCheckedChange={() => handleSelectTransaction(transaction.id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {format(new Date(transaction.date), "dd/MM/yyyy")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {transaction.business_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={transaction.is_income ? "text-green-600" : "text-red-600"}>
                              {transaction.is_income ? "+" : "-"}₪{transaction.billing_amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge>
                              {getCategoryName(transaction.category_id)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {transaction.details || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTransactionClick(transaction)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Edit Dialog */}
        <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('transactions.bulkEditTitle', { count: selectedIds.size })}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {bulkError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{bulkError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={bulkEditFields.category_id}
                    onCheckedChange={(checked) =>
                      setBulkEditFields(prev => ({...prev, category_id: checked}))
                    }
                  />
                  <Label>{t('bulkEdit.category')}</Label>
                </div>
                {bulkEditFields.category_id && (
                  <Select
                    value={bulkEditData.category_id}
                    onValueChange={(value) =>
                      setBulkEditData(prev => ({...prev, category_id: value}))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('bulkEdit.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={bulkEditFields.is_income}
                    onCheckedChange={(checked) =>
                      setBulkEditFields(prev => ({...prev, is_income: checked}))
                    }
                  />
                  <Label>{t('bulkEdit.transactionType')}</Label>
                </div>
                {bulkEditFields.is_income && (
                  <RadioGroup
                    value={bulkEditData.is_income ? "income" : "expense"}
                    onValueChange={(value) =>
                      setBulkEditData(prev => ({...prev, is_income: value === "income"}))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expense" id="bulk-expense" />
                      <Label htmlFor="bulk-expense">{t('bulkEdit.expense')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="income" id="bulk-income" />
                      <Label htmlFor="bulk-income">{t('bulkEdit.income')}</Label>
                    </div>
                  </RadioGroup>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={bulkEditFields.date}
                    onCheckedChange={(checked) =>
                      setBulkEditFields(prev => ({...prev, date: checked}))
                    }
                  />
                  <Label>{t('bulkEdit.date')}</Label>
                </div>
                {bulkEditFields.date && (
                  <Input
                    type="date"
                    value={bulkEditData.date}
                    onChange={(e) =>
                      setBulkEditData(prev => ({...prev, date: e.target.value}))
                    }
                  />
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={bulkEditFields.details}
                    onCheckedChange={(checked) =>
                      setBulkEditFields(prev => ({...prev, details: checked}))
                    }
                  />
                  <Label>{t('bulkEdit.details')}</Label>
                </div>
                {bulkEditFields.details && (
                  <Input
                    placeholder={t('bulkEdit.detailsPlaceholder')}
                    value={bulkEditData.details}
                    onChange={(e) =>
                      setBulkEditData(prev => ({...prev, details: e.target.value}))
                    }
                  />
                )}
              </div>

              {bulkProcessProgress > 0 && (
                <Progress value={bulkProcessProgress} className="w-full" />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkEditDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleBulkEdit}>
                {t('bulkEdit.updateTransactions')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Transaction Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? t('transactions.editTitle') : t('transactions.addTitle')}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="business_name" className="text-right">{t('transactions.businessName')}</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  placeholder={t('transactions.businessNamePlaceholder')}
                  className="col-span-3"
                />
                {formErrors.business_name && <p className="col-span-4 text-red-500 text-sm text-right">{formErrors.business_name}</p>}
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="billing_amount" className="text-right">{t('transactions.billingAmount')}</Label>
                <Input
                  id="billing_amount"
                  type="number"
                  value={formData.billing_amount}
                  onChange={(e) => setFormData({...formData, billing_amount: e.target.value})}
                  placeholder={t('transactions.billingAmountPlaceholder')}
                  className="col-span-3"
                />
                {formErrors.billing_amount && <p className="col-span-4 text-red-500 text-sm text-right">{formErrors.billing_amount}</p>}
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">{t('transactions.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="col-span-3"
                />
                {formErrors.date && <p className="col-span-4 text-red-500 text-sm text-right">{formErrors.date}</p>}
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category_id" className="text-right">{t('transactions.category')}</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({...formData, category_id: value})}
                >
                  <SelectTrigger id="category_id" className="col-span-3">
                    <SelectValue placeholder={t('transactions.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category_id && <p className="col-span-4 text-red-500 text-sm text-right">{formErrors.category_id}</p>}
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="details" className="text-right">{t('transactions.details')}</Label>
                <Input
                  id="details"
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  placeholder={t('transactions.detailsPlaceholder')}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_income" className="text-right">{t('transactions.isIncome')}</Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="is_income"
                    checked={formData.is_income}
                    onCheckedChange={(checked) => setFormData({...formData, is_income: checked})}
                  />
                  <Label htmlFor="is_income" className="text-sm font-normal">{t('transactions.isIncome')}</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit}>
                {editingTransaction ? t('common.update') : t('common.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Duplicates Dialog */}
        <DuplicatesDialog
          isOpen={isDuplicatesDialogOpen}
          onClose={() => setIsDuplicatesDialogOpen(false)}
          duplicates={duplicates}
          onResolved={() => {
            setDuplicates([]);
            setIsDuplicatesDialogOpen(false);
            loadData();
          }}
        />
      </div>
    </div>
  );
}
