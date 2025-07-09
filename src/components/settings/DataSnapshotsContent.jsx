
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { t, formatDate, formatNumber, isRTL } from "@/components/utils/i18n";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import {
  Database,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  Info,
  AlertTriangle,
  Plus,
  RotateCcw,
  Archive
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DataSnapshotsContent() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null); // Used for delete
  const [selectedSnapshotToRestore, setSelectedSnapshotToRestore] = useState(null); // Used for restore
  const [restoreProgress, setRestoreProgress] = useState(0); // Not used in current outline, but kept from original
  const [dataSnapshotFunction, setDataSnapshotFunction] = useState(null);
  const [functionLoadError, setFunctionLoadError] = useState(null);
  const [newSnapshotTitle, setNewSnapshotTitle] = useState('');
  const [newSnapshotDescription, setNewSnapshotDescription] = useState('');
  const [retentionDays, setRetentionDays] = useState(30);

  const { toast } = useToast();
  const isRTLLayout = isRTL();

  // Load the function on component mount
  useEffect(() => {
    const loadFunction = async () => {
      try {
        const { dataSnapshot } = await import("@/api/functions");
        setDataSnapshotFunction(() => dataSnapshot);
      } catch (error) {
        console.error("Failed to import dataSnapshot function:", error);
        setFunctionLoadError(error.message);
      }
    };
    
    loadFunction();
  }, []);

  // Safe function call wrapper
  const callDataSnapshotFunction = useCallback(async (action, data = {}) => {
    if (!dataSnapshotFunction) {
      throw new Error(t('dataSnapshots.loadError'));
    }

    try {
      const response = await dataSnapshotFunction({ action, ...data });
      return response;
    } catch (error) {
      console.error(`Error calling dataSnapshot function with action ${action}:`, error);
      throw error;
    }
  }, [dataSnapshotFunction]);

  const loadSnapshots = useCallback(async () => {
    if (!dataSnapshotFunction) return;
    
    setLoading(true);
    try {
      const response = await callDataSnapshotFunction('listSnapshots');
      
      if (response.data?.success) {
        setSnapshots(response.data.snapshots || []);
      } else {
        throw new Error(response.data?.error || t('dataSnapshots.loadError'));
      }
    } catch (error) {
      console.error('Error loading snapshots:', error);
      toast({
        variant: "destructive",
        title: t('dataSnapshots.loadError'),
        description: error.message || t('dataSnapshots.loadError')
      });
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }, [callDataSnapshotFunction, toast]);

  const handleCreateSnapshot = useCallback(() => {
    setShowCreateDialog(true);
    setNewSnapshotTitle('');
    setNewSnapshotDescription('');
    setRetentionDays(30);
  }, []);

  const confirmCreateSnapshot = useCallback(async () => {
    if (!newSnapshotTitle.trim()) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('dataSnapshots.titleRequired')
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await callDataSnapshotFunction('createSnapshot', {
        title: newSnapshotTitle,
        description: newSnapshotDescription,
        retentionDays: retentionDays
      });

      if (response.data?.success) {
        toast({
          title: t('dataSnapshots.snapshotCreated'),
          description: t('dataSnapshots.snapshotCreated')
        });
        
        setShowCreateDialog(false);
        await loadSnapshots();
      } else {
        throw new Error(response.data?.error || t('dataSnapshots.createError'));
      }
    } catch (error) {
      console.error('Error creating snapshot:', error);
      
      let errorMessage = t('dataSnapshots.createError');
      if (error.message?.includes('Rate limit')) {
        errorMessage = t('upload.errors.timeout');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: t('dataSnapshots.createError'),
        description: errorMessage
      });
    } finally {
      setIsCreating(false);
    }
  }, [newSnapshotTitle, newSnapshotDescription, retentionDays, callDataSnapshotFunction, toast, loadSnapshots]);

  const handleDeleteSnapshot = useCallback((snapshotId) => {
    setSelectedSnapshot(snapshotId);
    setShowDeleteDialog(true);
  }, []);

  const confirmDeleteSnapshot = useCallback(async () => {
    if (!selectedSnapshot) return;

    setIsDeleting(true);
    try {
      const response = await callDataSnapshotFunction('deleteSnapshot', { snapshotId: selectedSnapshot });
      
      if (response.data?.success) {
        toast({
          title: t('dataSnapshots.snapshotDeleted'),
          description: t('dataSnapshots.snapshotDeleted')
        });
        await loadSnapshots();
      } else {
        throw new Error(response.data?.error || t('dataSnapshots.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      toast({
        variant: "destructive",
        title: t('dataSnapshots.deleteError'),
        description: error.message || t('dataSnapshots.deleteError')
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedSnapshot(null);
    }
  }, [selectedSnapshot, callDataSnapshotFunction, toast, loadSnapshots]);

  const handleRestoreSnapshot = useCallback((snapshotId) => {
    setSelectedSnapshotToRestore(snapshotId);
    setShowRestoreDialog(true);
  }, []);

  const confirmRestoreSnapshot = useCallback(async () => {
    if (!selectedSnapshotToRestore) return;

    setIsRestoring(true);
    setRestoreProgress(0); // Reset progress
    
    try {
      const response = await callDataSnapshotFunction('restoreSnapshot', { snapshotId: selectedSnapshotToRestore });
      
      if (response.data?.success) {
        toast({
          title: t('dataSnapshots.restoreSuccess'),
          description: t('dataSnapshots.restoreSuccess')
        });
        
        // Refresh the page after successful restore
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.data?.error || t('dataSnapshots.restoreError'));
      }
    } catch (error) {
      console.error('Error restoring snapshot:', error);
      toast({
        variant: "destructive",
        title: t('dataSnapshots.restoreError'),
        description: error.message || t('dataSnapshots.restoreError')
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
      setShowRestoreDialog(false);
      setSelectedSnapshotToRestore(null);
    }
  }, [selectedSnapshotToRestore, callDataSnapshotFunction, toast]);

  const handleCleanStateSuccess = (data) => {
    console.log('Clean state operation completed:', data);
    
    if (data && data.totalDeleted > 0) {
      toast({
        title: t('toast.cleanState.successTitle'),
        description: t('toast.cleanState.successDescription', { 
          totalDeleted: data.totalDeleted, 
          transactions: data.deletedCounts?.transactions || 0, 
          budgets: data.deletedCounts?.budgets || 0, 
          categories: data.deletedCounts?.categories || 0,
          defaultCategoriesCreated: data.defaultCategoriesCreated || 0
        }),
        duration: 10000,
      });
    } else if (data && data.totalDeleted === 0) {
      toast({
        title: t('toast.cleanState.noDataDeletedTitle'),
        description: t('toast.cleanState.noDataDeletedDescription'),
        duration: 5000,
      });
    } else {
      toast({
        title: t('toast.cleanState.partialSuccessTitle'),
        description: t('toast.cleanState.partialSuccessDescription'),
        duration: 5000,
      });
    }

    // Show additional message about default categories
    if (data && data.defaultCategoriesCreated > 0) {
      setTimeout(() => {
        toast({
          title: t('toast.cleanState.categoriesRestoredTitle'),
          description: t('toast.cleanState.categoriesRestoredDescription', { 
            count: data.defaultCategoriesCreated 
          }),
          duration: 8000,
        });
      }, 2000);
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear();
        console.log('localStorage cleared successfully');
      }
    } catch (error) {
      console.warn('Could not clear localStorage:', error);
    }

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 3000);
  };

  // Load snapshots when function is ready
  useEffect(() => {
    if (dataSnapshotFunction) {
      loadSnapshots();
    }
  }, [dataSnapshotFunction, loadSnapshots]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'creating':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'corrupted':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusText = t(`dataSnapshots.status.${status}`) || status;
    switch (status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800">{statusText}</Badge>;
      case 'creating':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{statusText}</Badge>;
      case 'corrupted':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">{statusText}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{statusText}</Badge>;
    }
  };

  if (functionLoadError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {t('dataSnapshots.loadError')}: {functionLoadError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6" dir={isRTLLayout ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Database className="w-7 h-7 text-blue-600" />
            {t('dataSnapshots.title')}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('dataSnapshots.subtitle')}
          </p>
        </div>
        <Button 
          onClick={handleCreateSnapshot}
          disabled={isCreating || !dataSnapshotFunction}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('dataSnapshots.creating')}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              {t('dataSnapshots.createSnapshot')}
            </>
          )}
        </Button>
      </div>

      {/* How It Works Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
                <Info className="w-5 h-5" />
                {t('dataSnapshots.howItWorks')}
            </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                1
              </div>
              <h4 className="font-medium text-blue-900">{t('dataSnapshots.step1')}</h4>
              <p className="text-sm text-blue-700 mt-1">
                {t('dataSnapshots.step1Description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                2
              </div>
              <h4 className="font-medium text-blue-900">{t('dataSnapshots.step2')}</h4>
              <p className="text-sm text-blue-700 mt-1">
                {t('dataSnapshots.step2Description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                3
              </div>
              <h4 className="font-medium text-blue-900">{t('dataSnapshots.step3')}</h4>
              <p className="text-sm text-blue-700 mt-1">
                {t('dataSnapshots.step3Description')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Snapshots List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : snapshots.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('dataSnapshots.noSnapshots')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('dataSnapshots.noSnapshotsDescription')}
            </p>
            <Button
              onClick={handleCreateSnapshot}
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('dataSnapshots.createFirstSnapshot')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              {t('dataSnapshots.availableSnapshots')} ({snapshots.length})
            </CardTitle>
            <Button 
                variant="outline" 
                onClick={loadSnapshots}
                disabled={loading}
                size="sm"
            >
                {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                <RefreshCw className="w-4 h-4" />
                )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(snapshot.status)}
                      <h4 className="font-medium text-gray-900">
                        {snapshot.title}
                      </h4>
                      {getStatusBadge(snapshot.status)}
                    </div>
                    
                    {snapshot.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {snapshot.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(snapshot.created_date)}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatNumber(snapshot.size_bytes || 0)} {t('common.bytes')}
                      </span>

                      {snapshot.entity_counts && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {t('dataSnapshots.entities.transactions')}: {snapshot.entity_counts.transactions || 0},&nbsp;
                          {t('dataSnapshots.entities.categories')}: {snapshot.entity_counts.categories || 0},&nbsp;
                          {t('dataSnapshots.entities.budgets')}: {snapshot.entity_counts.budgets || 0}
                          {snapshot.entity_counts.categoryRules ? `, ${t('dataSnapshots.entities.categoryRules')}: ${snapshot.entity_counts.categoryRules}` : ''}
                        </span>
                      )}
                      
                      {snapshot.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t('dataSnapshots.expires')}: {formatDate(snapshot.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {snapshot.status === 'ready' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreSnapshot(snapshot.snapshot_id)}
                        disabled={isRestoring}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        {isRestoring ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        {t('dataSnapshots.restore')}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSnapshot(snapshot.snapshot_id)}
                      disabled={isDeleting}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Snapshot Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dataSnapshots.createSnapshot')}</DialogTitle>
            <DialogDescription>
              {t('dataSnapshots.createSnapshotDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="snapshot-title">{t('dataSnapshots.snapshotTitle')} *</Label>
              <Input
                id="snapshot-title"
                value={newSnapshotTitle}
                onChange={(e) => setNewSnapshotTitle(e.target.value)}
                placeholder={t('dataSnapshots.titlePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="snapshot-description">{t('dataSnapshots.snapshotDescription')}</Label>
              <Textarea
                id="snapshot-description"
                value={newSnapshotDescription}
                onChange={(e) => setNewSnapshotDescription(e.target.value)}
                placeholder={t('dataSnapshots.descriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="retention-days">{t('dataSnapshots.retentionDays')}</Label>
              <Input
                id="retention-days"
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)}
                min="1"
                max="365"
                className="w-32"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('dataSnapshots.retentionNote').replace('{days}', retentionDays.toString())}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={confirmCreateSnapshot}
              disabled={!newSnapshotTitle.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('dataSnapshots.creating')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('dataSnapshots.createSnapshot')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              {t('dataSnapshots.confirmRestore')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t('dataSnapshots.restoreWarning')}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-medium text-amber-800 mb-2">
                  {t('dataSnapshots.cannotUndo')}
                </p>
                <p className="text-amber-700 text-sm">
                  {t('dataSnapshots.dataToReplace')}
                </p>
                <ul className="list-disc list-inside text-sm text-amber-700 mt-2 space-y-1">
                  <li>{t('dataSnapshots.entities.transactions')}</li>
                  <li>{t('dataSnapshots.entities.categories')}</li>
                  <li>{t('dataSnapshots.entities.budgets')}</li>
                  <li>{t('dataSnapshots.entities.categoryRules')}</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestoreSnapshot}
              disabled={isRestoring}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isRestoring ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('dataSnapshots.restoring')}
                </>
              ) : (
                t('dataSnapshots.restore')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-5 h-5" />
              {t('dataSnapshots.confirmDelete')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('dataSnapshots.deleteWarning')}
              {selectedSnapshot ? ` "${snapshots.find(s => s.snapshot_id === selectedSnapshot)?.title}"?` : ''}
              {t('dataSnapshots.cannotUndo')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSnapshot}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('dataSnapshots.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
