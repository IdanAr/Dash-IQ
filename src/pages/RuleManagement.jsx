
import React, { useState, useEffect } from "react";
import { CategoryRule, Category } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label"; // Added Label import
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  FolderTree,
  Search,
  FileText,
  ArrowLeft, // Added ArrowLeft
  Info, // Added Info
  Filter, // Added Filter
  Settings // Added Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { t, isRTL } from '@/components/utils/i18n'; // Added i18n imports
import { useNavigate } from 'react-router-dom'; // Added useNavigate

export default function RuleManagement() {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); // Controls the single add/edit dialog
  const [editingRule, setEditingRule] = useState(null); // Null for add, rule object for edit

  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize useNavigate
  const isRTLLayout = isRTL(); // Get RTL status

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesData, categoriesData] = await Promise.all([
        CategoryRule.list(),
        Category.list()
      ]);

      // Enrich rules with category names and types
      const enrichedRules = rulesData.map(rule => {
        const category = categoriesData.find(c => c.id === rule.category_id);
        return {
          ...rule,
          categoryName: category ? category.name : t('categories.unknownCategory'),
          categoryType: category ? category.type : null
        };
      });

      setRules(enrichedRules);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: t('common.errorLoadingData'),
        description: t('categories.rules.errorLoadingRules'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (formData) => {
    // Basic validation
    if (!formData.business_name_pattern.trim()) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('categories.rules.patternRequired')
      });
      return;
    }
    if (!formData.category_id) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('categories.rules.categoryRequired')
      });
      return;
    }

    try {
      if (editingRule) {
        await CategoryRule.update(editingRule.id, formData);
        toast({
          title: t('common.success'),
          description: t('categories.rules.ruleUpdated'),
        });
      } else {
        await CategoryRule.create(formData);
        toast({
          title: t('common.success'),
          description: t('categories.rules.ruleCreated'),
        });
      }

      setShowForm(false);
      setEditingRule(null);
      loadData();
    } catch (error) {
      console.error("Error saving rule:", error);
      toast({
        title: t('common.error'),
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await CategoryRule.delete(ruleId);
      toast({
        title: t('common.success'),
        description: t('categories.rules.ruleDeleted'),
      });
      loadData();
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        title: t('common.error'),
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('categories.rules.title')}</h1>
          <p className="text-gray-600">{t('categories.rules.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/category-management')}>
            <ArrowLeft className={`w-4 h-4 ${isRTLLayout ? 'ml-2' : 'mr-2'}`} />
            {t('common.back')}
          </Button>
          <Button onClick={() => { setEditingRule(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className={`w-4 h-4 ${isRTLLayout ? 'ml-2' : 'mr-2'}`} />
            {t('categories.rules.createRule')}
          </Button>
        </div>
      </div>

      {/* How it works info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Info className="w-5 h-5" />
            {t('categories.rules.howItWorks')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800">{t('categories.rules.explanation')}</p>
        </CardContent>
      </Card>

      {/* Rules List */}
      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </CardContent>
        </Card>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Settings className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('categories.rules.noRules')}
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {t('categories.rules.noRulesDescription')}
            </p>
            <Button onClick={() => { setEditingRule(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className={`w-4 h-4 ${isRTLLayout ? 'ml-2' : 'mr-2'}`} />
              {t('categories.rules.createFirstRule')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('categories.rules.activeRules')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rules.map((rule) => {
                const category = categories.find(c => c.id === rule.category_id);
                return (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Filter className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">"{rule.business_name_pattern}"</div>
                        <div className="text-sm text-gray-600">
                          {t('categories.rules.assignsTo')}:
                          <Badge className={`${isRTLLayout ? 'mr-2' : 'ml-2'} `}>
                            {category?.name || t('categories.unknownCategory')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRule(rule);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('categories.rules.confirmDelete')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRule(rule.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rule Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[425px]" dir={isRTLLayout ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? t('categories.rules.editRule') : t('categories.rules.createRule')}
            </DialogTitle>
            <DialogDescription>
              {editingRule
                ? t('categories.rules.editRuleDescription')
                : t('categories.rules.createRuleDescription')
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleSaveRule({
              business_name_pattern: formData.get('business_name_pattern'),
              category_id: formData.get('category_id')
            });
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="business_name_pattern">
                  {t('categories.rules.businessPattern')} *
                </Label>
                <Input
                  id="business_name_pattern"
                  name="business_name_pattern"
                  placeholder={t('categories.rules.patternPlaceholder')}
                  defaultValue={editingRule?.business_name_pattern || ""}
                  required
                />
                <p className="text-xs text-gray-600">
                  {t('categories.rules.patternHelp')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">
                  {t('categories.rules.targetCategory')} *
                </Label>
                <Select name="category_id" defaultValue={editingRule?.category_id || ""} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('categories.rules.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent dir={isRTLLayout ? 'rtl' : 'ltr'}>
                    <SelectItem value={null} disabled>
                      {t('categories.rules.selectCategory')}
                    </SelectItem>
                    <SelectItem value={null} disabled className="font-medium text-gray-500">--- {t('common.expenses')} ---</SelectItem>
                    {categories
                      .filter(cat => cat.type === "expense")
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    }
                    <SelectItem value={null} disabled className="font-medium text-gray-500">--- {t('common.income')} ---</SelectItem>
                    {categories
                      .filter(cat => cat.type === "income")
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingRule(null);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingRule ? t('common.update') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
