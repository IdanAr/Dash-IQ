
import React, { useState, useEffect } from "react";
import { Category, CategoryRule, Transaction } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  Tag,
  Settings,
  HelpCircle,
  Info
} from "lucide-react";
import { IconRenderer, getIconOptions } from "@/components/utils/icons";
import CategoryForm from "../components/categories/CategoryForm";
import { t, isRTL } from "@/components/utils/i18n";

export default function CategoryManagementPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deletingRule, setDeletingRule] = useState(null);
  const [activeTab, setActiveTab] = useState("categories");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const isRTLLayout = isRTL();

  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    business_name_pattern: "",
    category_id: ""
  });
  const [ruleFormErrors, setRuleFormErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, categoryFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [categoriesData, rulesData, transactionsData] = await Promise.all([
        Category.list('sort_order'),
        CategoryRule.list(),
        Transaction.list('-date', 100) // Just for counting
      ]);
      setCategories(categoriesData);
      setRules(rulesData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: t('toast.loadingData'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = categories;
    if (categoryFilter === "expense") {
      filtered = categories.filter(c => c.type === "expense");
    } else if (categoryFilter === "income") {
      filtered = categories.filter(c => c.type === "income");
    }
    setFilteredCategories(filtered);
  };

  const getCategoryTransactionCount = (categoryId) => {
    return transactions.filter(t => t.category_id === categoryId).length;
  };

  const handleCategoryFormSubmit = async (categoryData, isEditing) => {
    try {
      if (isEditing) {
        // Update existing category
        await Category.update(editingCategory.id, categoryData);
        toast({
          title: t('toast.success'),
          description: t('toast.categoryUpdated'),
        });
      } else {
        // Create new category
        await Category.create(categoryData);
        toast({
          title: t('toast.success'),
          description: t('toast.categoryAdded'),
        });
      }
      
      // Close dialog and reset state
      setIsCategoryFormOpen(false);
      setEditingCategory(null);
      
      // Reload data to show changes
      loadData();
    } catch (error) {
      console.error("Error saving category:", error);
      
      // Check if it's a duplicate error
      if (error.message && (error.message.includes('duplicate') || error.message.includes('unique'))) {
        toast({
          variant: "destructive",
          title: t('toast.error'),
          description: t('toast.categoryExists'),
        });
      } else {
        toast({
          variant: "destructive",
          title: t('toast.error'),
          description: t('toast.serverError'),
        });
      }
    }
  };

  const handleCategoryFormError = (error) => {
    console.error("Category form error:", error);
    toast({
      variant: "destructive",
      title: t('toast.error'),
      description: t('toast.serverError'),
    });
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (category) => {
    try {
      const transactionCount = getCategoryTransactionCount(category.id);
      if (transactionCount > 0) {
        toast({
          variant: "destructive",
          title: t('toast.warning'),
          description: t('toast.categoryInUse'),
        });
        return;
      }

      await Category.delete(category.id);
      toast({
        title: t('toast.success'),
        description: t('toast.categoryDeleted'),
      });
      setDeletingCategory(null);
      loadData();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: t('toast.serverError'),
      });
    }
  };

  const validateRuleForm = () => {
    const errors = {};
    
    if (!ruleForm.business_name_pattern.trim()) {
      errors.business_name_pattern = t('categories.rules.patternRequired');
    }
    if (!ruleForm.category_id) {
      errors.category_id = t('categories.rules.categoryRequired');
    }

    setRuleFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRuleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateRuleForm()) {
      return;
    }

    try {
      const ruleData = {
        business_name_pattern: ruleForm.business_name_pattern.trim(),
        category_id: ruleForm.category_id
      };

      if (editingRule) {
        await CategoryRule.update(editingRule.id, ruleData);
        toast({
          title: t('toast.success'),
          description: t('toast.ruleUpdated'),
        });
      } else {
        await CategoryRule.create(ruleData);
        toast({
          title: t('toast.success'),
          description: t('toast.ruleAdded'),
        });
      }

      setIsRuleFormOpen(false);
      setEditingRule(null);
      setRuleForm({ business_name_pattern: "", category_id: "" });
      setRuleFormErrors({});
      loadData();
    } catch (error) {
      console.error("Error saving rule:", error);
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: t('toast.serverError'),
      });
    }
  };

  const openEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      business_name_pattern: rule.business_name_pattern,
      category_id: rule.category_id
    });
    setIsRuleFormOpen(true);
  };

  const handleDeleteRule = async (rule) => {
    try {
      await CategoryRule.delete(rule.id);
      toast({
        title: t('toast.success'),
        description: t('toast.ruleDeleted'),
      });
      setDeletingRule(null);
      loadData();
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: t('toast.serverError'),
      });
    }
  };

  const getRuleCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : t('common.uncategorized');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
          <p className="text-gray-600">{t('categories.subtitle')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <TabsList className="grid w-full grid-cols-2" dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <TabsTrigger value="categories" className="flex items-center gap-2" dir={isRTLLayout ? 'rtl' : 'ltr'}>
            <FolderOpen className="w-4 h-4" />
            {t('categories.allCategories')}
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2" dir={isRTLLayout ? 'rtl' : 'ltr'}>
            <Settings className="w-4 h-4" />
            {t('categories.rules.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                  <SelectItem value="all">{t('categories.allCategories')}</SelectItem>
                  <SelectItem value="expense">{t('categories.expenseCategories')}</SelectItem>
                  <SelectItem value="income">{t('categories.incomeCategories')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryFormOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('categories.addCategory')}
            </Button>
          </div>

          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('categories.empty.title')}
                </h3>
                <p className="text-gray-500 text-center mb-6">
                  {t('categories.empty.description')}
                </p>
                <Button 
                  onClick={() => setIsCategoryFormOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('categories.empty.addFirst')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('categories.allCategories')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTLLayout ? "text-right" : "text-left"}>{t('categories.table.name')}</TableHead>
                      <TableHead className={isRTLLayout ? "text-right" : "text-left"}>{t('categories.table.type')}</TableHead>
                      <TableHead className={isRTLLayout ? "text-right" : "text-left"}>{t('categories.table.icon')}</TableHead>
                      <TableHead className={isRTLLayout ? "text-right" : "text-left"}>{t('categories.table.transactionCount')}</TableHead>
                      <TableHead className={isRTLLayout ? "text-right" : "text-left"}>{t('categories.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className={`font-medium ${isRTLLayout ? "text-right" : "text-left"}`}>{category.name}</TableCell>
                        <TableCell className={isRTLLayout ? "text-right" : "text-left"}>
                          <Badge variant={category.type === 'expense' ? 'destructive' : 'default'}>
                            {category.type === 'expense' ? t('categories.expense') : t('categories.income')}
                          </Badge>
                        </TableCell>
                        <TableCell className={isRTLLayout ? "text-right" : "text-left"}>
                          <IconRenderer iconName={category.icon || 'HelpCircle'} size={20} />
                        </TableCell>
                        <TableCell className={isRTLLayout ? "text-right" : "text-left"}>
                          <Badge variant="outline">
                            {getCategoryTransactionCount(category.id)}
                          </Badge>
                        </TableCell>
                        <TableCell className={isRTLLayout ? "text-right" : "text-left"}>
                          <div className={`flex items-center gap-2 ${isRTLLayout ? "justify-start" : "justify-start"}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditCategory(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingCategory(category)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{t('categories.rules.title')}</h2>
              <p className="text-gray-600 text-sm">{t('categories.rules.subtitle')}</p>
            </div>
            <Button
              onClick={() => {
                setEditingRule(null);
                setRuleForm({ business_name_pattern: "", category_id: "" });
                setRuleFormErrors({});
                setIsRuleFormOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('categories.rules.addRule')}
            </Button>
          </div>

          {rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Settings className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('categories.rules.empty.title')}
                </h3>
                <p className="text-gray-500 text-center mb-6">
                  {t('categories.rules.empty.description')}
                </p>
                <Button 
                  onClick={() => setIsRuleFormOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('categories.rules.addRule')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('categories.rules.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTLLayout ? "text-right" : "text-left"}>{t('categories.rules.table.pattern')}</TableHead>
                      <TableHead className={isRTLLayout ? "text-right" : "text-left"}>{t('categories.rules.table.category')}</TableHead>
                      <TableHead className={isRTLLayout ? "text-right" : "text-left"}>{t('categories.rules.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className={`font-mono text-sm bg-gray-50 rounded px-2 py-1 ${isRTLLayout ? "text-right" : "text-left"}`}>
                          {rule.business_name_pattern}
                        </TableCell>
                        <TableCell className={isRTLLayout ? "text-right" : "text-left"}>
                          <div className={`flex items-center gap-2 ${isRTLLayout ? "justify-start" : "justify-start"}`}>
                            <IconRenderer 
                              iconName={categories.find(c => c.id === rule.category_id)?.icon || 'HelpCircle'} 
                              size={16} 
                            />
                            {getRuleCategoryName(rule.category_id)}
                          </div>
                        </TableCell>
                        <TableCell className={isRTLLayout ? "text-right" : "text-left"}>
                          <div className={`flex items-center gap-2 ${isRTLLayout ? "justify-start" : "justify-start"}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditRule(rule)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingRule(rule)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Form Dialog */}
      {isCategoryFormOpen && (
        <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
          <DialogContent className="sm:max-w-[500px]" dir={isRTLLayout ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t('categories.form.editTitle') : t('categories.form.addTitle')}
              </DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={editingCategory}
              onSave={handleCategoryFormSubmit}
              onError={handleCategoryFormError}
              onCancel={() => {
                setIsCategoryFormOpen(false);
                setEditingCategory(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Rule Form Dialog */}
      <Dialog open={isRuleFormOpen} onOpenChange={setIsRuleFormOpen}>
        <DialogContent className="sm:max-w-[500px]" dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? t('categories.rules.form.editTitle') : t('categories.rules.form.title')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRuleFormSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                {t('categories.rules.form.description')}
              </p>
              <p className="text-xs text-blue-600">
                {t('categories.rules.form.patternHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern">{t('categories.rules.businessPattern')} *</Label>
              <Input
                id="pattern"
                type="text"
                placeholder={t('categories.rules.patternPlaceholder')}
                value={ruleForm.business_name_pattern}
                onChange={(e) => setRuleForm(prev => ({
                  ...prev,
                  business_name_pattern: e.target.value
                }))}
                className={ruleFormErrors.business_name_pattern ? "border-red-500" : ""}
              />
              {ruleFormErrors.business_name_pattern && (
                <p className="text-sm text-red-600">{ruleFormErrors.business_name_pattern}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('categories.rules.category')} *</Label>
              <Select
                value={ruleForm.category_id}
                onValueChange={(value) => setRuleForm(prev => ({
                  ...prev,
                  category_id: value
                }))}
              >
                <SelectTrigger className={ruleFormErrors.category_id ? "border-red-500" : ""}>
                  <SelectValue placeholder={t('categories.selectCategory')} />
                </SelectTrigger>
                <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <IconRenderer iconName={category.icon || 'HelpCircle'} size={16} />
                        {category.name}
                        <Badge variant={category.type === 'expense' ? 'destructive' : 'default'} className="ml-auto">
                          {category.type === 'expense' ? t('categories.expense') : t('categories.income')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {ruleFormErrors.category_id && (
                <p className="text-sm text-red-600">{ruleFormErrors.category_id}</p>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                {t('categories.rules.form.examples.title')}
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {t('categories.rules.form.examples.supermarket')}</li>
                <li>• {t('categories.rules.form.examples.gas')}</li>
                <li>• {t('categories.rules.form.examples.pharmacy')}</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRuleFormOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingRule ? t('common.save') : t('common.add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('categories.dialogs.deleteCategory')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('categories.dialogs.deleteCategoryDescription', { name: deletingCategory?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('categories.dialogs.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteCategory(deletingCategory)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('categories.dialogs.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Rule Dialog */}
      <AlertDialog open={!!deletingRule} onOpenChange={() => setDeletingRule(null)}>
        <AlertDialogContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('categories.rules.deleteRule')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('categories.rules.deleteRuleDescription', { pattern: deletingRule?.business_name_pattern })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteRule(deletingRule)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
