import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Trash2, AlertCircle, EyeOff, CheckCircle } from "lucide-react";
import { t, isRTL, formatCurrency, formatDate } from '@/components/utils/i18n';

export default function DuplicatesDialog({ 
  isOpen, 
  onClose, 
  duplicateSets, 
  onResolve, 
  categories, 
  isLoading, 
  onIgnoreSet 
}) {
  const [selectedToDelete, setSelectedToDelete] = useState({});
  const isRTLLayout = isRTL();

  useEffect(() => {
    setSelectedToDelete({});
  }, [isOpen, duplicateSets]);

  const handleToggleSelection = (transactionId) => {
    setSelectedToDelete(prev => ({
      ...prev,
      [transactionId]: !prev[transactionId]
    }));
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : t('common.uncategorized');
  };

  const countSelected = Object.values(selectedToDelete).filter(Boolean).length;

  const handleResolveClick = () => {
    const idsToDelete = Object.keys(selectedToDelete).filter(id => selectedToDelete[id]);
    const setsToMarkReviewed = [];
    
    duplicateSets.forEach(set => {
      const setIds = set.map(t => t.id);
      const survivingIdsInSet = setIds.filter(id => !idsToDelete.includes(id));
      
      if (survivingIdsInSet.length > 0 && survivingIdsInSet.length < setIds.length) {
        setsToMarkReviewed.push(...survivingIdsInSet);
      }
    });
    
    onResolve(idsToDelete, setsToMarkReviewed);
  };

  const handleIgnoreSetClick = (set) => {
    const transactionIdsToIgnore = set.map(t => t.id);
    onIgnoreSet(transactionIdsToIgnore);
  };

  const allTransactionsInSetReviewed = (set) => {
    return set.every(t => t.is_reviewed_duplicate);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-800">
            {t('transactions.duplicates.manageTitle', { default: 'ניהול עסקאות כפולות' })}
          </DialogTitle>
          {duplicateSets.filter(set => !allTransactionsInSetReviewed(set)).length > 0 ? (
            <DialogDescription className="mt-1">
              זוהו {duplicateSets.filter(set => !allTransactionsInSetReviewed(set)).length} קבוצות חדשות של עסקאות שעשויות להיות כפולות. בדוק ובחר אילו עסקאות למחוק או סמן קבוצות להתעלמות.
            </DialogDescription>
          ) : (
            <DialogDescription className="mt-1">
              לא נמצאו עסקאות כפולות חדשות לבדיקה.
            </DialogDescription>
          )}
        </DialogHeader>

        {duplicateSets.filter(set => !allTransactionsInSetReviewed(set)).length > 0 ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 py-4">
              {duplicateSets.map((set, index) => {
                if (allTransactionsInSetReviewed(set)) return null;

                return (
                  <div key={index} className="p-4 border rounded-lg shadow-sm bg-white">
                    <div className="flex justify-between items-center mb-3 border-b pb-2">
                      <h3 className="text-sm font-semibold text-gray-700">
                        <span className="font-mono text-xs bg-gray-100 p-1 rounded">
                          קבוצה {index + 1}: {set[0]?.business_name} - {formatDate(new Date(set[0]?.date), 'dd/MM/yyyy')} - {formatCurrency(set[0]?.billing_amount)}
                        </span>
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleIgnoreSetClick(set)}
                        disabled={isLoading}
                        className="text-sm"
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        התעלם מקבוצה זו
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">מחק</TableHead>
                          <TableHead>תאריך מלא</TableHead>
                          <TableHead>שם עסק</TableHead>
                          <TableHead>קטגוריה</TableHead>
                          <TableHead className="text-right">סכום</TableHead>
                          <TableHead>סטטוס בדיקה</TableHead>
                          <TableHead>מזהה (ID)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {set.map(transaction => (
                          <TableRow 
                            key={transaction.id} 
                            className={`${selectedToDelete[transaction.id] ? "bg-red-50" : ""} ${transaction.is_reviewed_duplicate ? "opacity-70" : ""}`}
                          >
                            <TableCell>
                              <Checkbox
                                checked={!!selectedToDelete[transaction.id]}
                                onCheckedChange={() => handleToggleSelection(transaction.id)}
                                disabled={transaction.is_reviewed_duplicate}
                                aria-label={`בחר למחיקה את עסקה ${transaction.id}`}
                              />
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatDate(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell>{transaction.business_name}</TableCell>
                            <TableCell>
                              <Badge variant={transaction.category_id ? "secondary" : "outline"}>
                                {getCategoryName(transaction.category_id)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(transaction.billing_amount)}
                            </TableCell>
                            <TableCell>
                              {transaction.is_reviewed_duplicate ? (
                                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  נבדק
                                </Badge>
                              ) : (
                                <Badge variant="outline">טרם נבדק</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {transaction.id.substring(0, 8)}...
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-2 text-green-500" />
            <p className="text-lg">לא נמצאו עסקאות כפולות חדשות לבדיקה.</p>
          </div>
        )}

        <DialogFooter className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            סגור
          </Button>
          {duplicateSets.filter(set => !allTransactionsInSetReviewed(set)).length > 0 && (
            <Button
              onClick={handleResolveClick}
              disabled={isLoading || countSelected === 0}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isLoading ? "מעבד..." : `מחק ${countSelected} מסומנות וסמן ניצולות`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}