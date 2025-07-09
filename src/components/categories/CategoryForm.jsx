import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconRenderer, getIconOptions } from "@/components/utils/icons";
import { t, isRTL } from '@/components/utils/i18n';

export default function CategoryForm({ 
  category, 
  onSave, 
  onError, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    icon: "HelpCircle",
    sort_order: 0
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        type: category.type || "expense",
        icon: category.icon || "HelpCircle",
        sort_order: category.sort_order || 0
      });
    } else {
      setFormData({
        name: "",
        type: "expense",
        icon: "HelpCircle",
        sort_order: 0
      });
    }
    setErrors({});
  }, [category]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('categories.rules.patternRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('categories.categoryNameTooShort');
    }

    if (!formData.type) {
      newErrors.type = t('categories.rules.categoryRequired');
    }

    if (!formData.icon) {
      newErrors.icon = t('categories.iconRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = {
        name: formData.name.trim(),
        type: formData.type,
        icon: formData.icon,
        sort_order: formData.sort_order
      };

      // Pass the data back to the parent component instead of making API call here
      const isEditing = !!category;
      if (onSave) {
        await onSave(dataToSave, isEditing);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableIcons = getIconOptions();

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL() ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <Label htmlFor="categoryName" className="text-sm font-medium">
          {t('categories.categoryName')} *
        </Label>
        <Input
          id="categoryName"
          type="text"
          placeholder={t('categories.categoryNamePlaceholder')}
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className={`${errors.name ? "border-red-500 focus:border-red-500" : ""}`}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryType" className="text-sm font-medium">
          {t('categories.categoryType')} *
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleInputChange("type", value)}
          disabled={isSubmitting}
        >
          <SelectTrigger className={`${errors.type ? "border-red-500" : ""}`}>
            <SelectValue placeholder={t('categories.selectType')} />
          </SelectTrigger>
          <SelectContent dir={isRTL() ? 'rtl' : 'ltr'}>
            <SelectItem value="expense">{t('categories.expense')}</SelectItem>
            <SelectItem value="income">{t('categories.income')}</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-600">{errors.type}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryIcon" className="text-sm font-medium">
          {t('categories.categoryIcon')} *
        </Label>
        <Select
          value={formData.icon}
          onValueChange={(value) => handleInputChange("icon", value)}
          disabled={isSubmitting}
        >
          <SelectTrigger className={`${errors.icon ? "border-red-500" : ""}`}>
            <SelectValue placeholder={t('categories.selectIcon')}>
              {formData.icon && (
                <div className="flex items-center">
                  <IconRenderer iconName={formData.icon} size={16} className="ml-2" />
                  <span>{formData.icon}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60" dir={isRTL() ? 'rtl' : 'ltr'}>
            {availableIcons.map((iconOption) => (
              <SelectItem key={iconOption.value} value={iconOption.value}>
                <div className="flex items-center">
                  <IconRenderer iconName={iconOption.value} size={16} className="ml-2" />
                  <span>{iconOption.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.icon && (
          <p className="text-sm text-red-600">{errors.icon}</p>
        )}
      </div>

      {formData.name && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <Label className="text-sm font-medium text-gray-700">{t('categories.preview')}:</Label>
          <div className="flex items-center mt-2">
            <IconRenderer iconName={formData.icon} size={20} className="ml-2" />
            <span className="font-medium">{formData.name}</span>
            <span className="text-sm text-gray-500 mr-2">
              ({formData.type === "expense" ? t('categories.expense') : t('categories.income')})
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          type="submit" 
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('common.loading') : (category ? t('categories.updateCategory') : t('categories.createCategory'))}
        </Button>
      </div>
    </form>
  );
}