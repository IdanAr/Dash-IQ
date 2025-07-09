
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { t, formatDate, formatNumber } from "@/components/utils/i18n";
import {
  Database,
  Download,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  HardDrive,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  Info,
  Shield,
  Activity,
  X,
  AlertTriangle,
  Wrench,
  Plus,
  RotateCcw
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

export default function DataSnapshotsPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [dataSnapshotFunction, setDataSnapshotFunction] = useState(null);
  const [functionLoadError, setFunctionLoadError] = useState(null);
  const [newSnapshot, setNewSnapshot] = useState({
    title: '',
    description: '',
    retentionDays: 30
  });
  const { toast } = useToast();

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
      throw new Error(t('errors.dataSnapshotFunctionNotAvailable'));
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
        throw new Error(response.data?.error || t('errors.loadSnapshotsFailed'));
      }
    } catch (error) {
      console.error('Error loading snapshots:', error);
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: error.message || t('errors.loadSnapshotsFailed')
      });
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }, [callDataSnapshotFunction, toast]);

  const createSnapshot = useCallback(async () => {
    if (!newSnapshot.title.trim()) {
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: t('errors.snapshotNameRequired')
      });
      return;
    }

    setCreating(true);
    try {
      const response = await callDataSnapshotFunction('createSnapshot', {
        title: newSnapshot.title,
        description: newSnapshot.description,
        retentionDays: newSnapshot.retentionDays
      });

      if (response.data?.success) {
        toast({
          title: t('toast.success'),
          description: t('toast.snapshotCreated')
        });
        
        setNewSnapshot({ title: '', description: '', retentionDays: 30 });
        setShowCreateForm(false);
        await loadSnapshots();
      } else {
        throw new Error(response.data?.error || t('errors.createSnapshotFailed'));
      }
    } catch (error) {
      console.error('Error creating snapshot:', error);
      
      let errorMessage = t('errors.createSnapshotFailed');
      if (error.message?.includes('Rate limit')) {
        errorMessage = t('errors.rateLimitExceeded');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: errorMessage
      });
    } finally {
      setCreating(false);
    }
  }, [newSnapshot, callDataSnapshotFunction, toast, loadSnapshots]);

  const deleteSnapshot = useCallback(async (snapshotId) => {
    try {
      const response = await callDataSnapshotFunction('deleteSnapshot', { snapshotId });
      
      if (response.data?.success) {
        toast({
          title: t('toast.success'),
          description: t('toast.snapshotDeleted')
        });
        await loadSnapshots();
      } else {
        throw new Error(response.data?.error || t('errors.deleteSnapshotFailed'));
      }
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: error.message || t('errors.deleteSnapshotFailed')
      });
    }
  }, [callDataSnapshotFunction, toast, loadSnapshots]);

  const restoreSnapshot = useCallback(async (snapshotId) => {
    setIsRestoring(true);
    setRestoreProgress(0);
    
    try {
      const response = await callDataSnapshotFunction('restoreFromSnapshot', { snapshotId });
      
      if (response.data?.success) {
        toast({
          title: t('toast.success'),
          description: t('toast.snapshotRestored')
        });
        
        // Refresh the page after successful restore
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.data?.error || t('errors.restoreSnapshotFailed'));
      }
    } catch (error) {
      console.error('Error restoring snapshot:', error);
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: error.message || t('errors.restoreSnapshotFailed')
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
      setSelectedSnapshot(null);
    }
  }, [callDataSnapshotFunction, toast]);

  const cleanupSnapshots = useCallback(async () => {
    try {
      const response = await callDataSnapshotFunction('cleanupSnapshots');
      
      if (response.data?.success) {
        toast({
          title: t('toast.success'),
          description: t('toast.cleanupCompleted', { count: response.data.cleanup?.deleted || 0 })
        });
        await loadSnapshots();
      } else {
        throw new Error(response.data?.error || t('errors.cleanupSnapshotsFailed'));
      }
    } catch (error) {
      console.error('Error cleaning up snapshots:', error);
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: error.message || t('errors.cleanupSnapshotsFailed')
      });
    }
  }, [callDataSnapshotFunction, toast, loadSnapshots]);

  // Load snapshots when function is available
  useEffect(() => {
    if (dataSnapshotFunction) {
      loadSnapshots();
    }
  }, [dataSnapshotFunction, loadSnapshots]);

  // Show error if function failed to load
  if (functionLoadError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('errors.dataSnapshotServiceUnavailable')}
            <br />
            <strong>{t('common.error')}:</strong> {functionLoadError}
            <br />
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={() => window.location.reload()}
            >
              {t('common.refreshPage')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading while function is loading
  if (!dataSnapshotFunction) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('dataSnapshot.loadingService')}</p>
        </div>
      </div>
    );
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ready': { variant: 'default', icon: CheckCircle, text: 'מוכן' },
      'creating': { variant: 'secondary', icon: Clock, text: 'נוצר...' },
      'corrupted': { variant: 'destructive', icon: AlertCircle, text: 'פגום' },
      'expired': { variant: 'outline', icon: AlertTriangle, text: 'פג תוקף' }
    };

    const config = statusConfig[status] || statusConfig['ready'];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const handleDeleteClick = (snapshot) => {
    setSelectedSnapshot(snapshot);
    setShowDeleteDialog(true);
  };

  const handleRestoreClick = (snapshot) => {
    setSelectedSnapshot(snapshot);
  };

  const confirmDelete = async () => {
    if (selectedSnapshot) {
      await deleteSnapshot(selectedSnapshot.snapshot_id);
      setShowDeleteDialog(false);
      setSelectedSnapshot(null);
    }
  };

  const confirmRestore = async () => {
    if (selectedSnapshot) {
      await restoreSnapshot(selectedSnapshot.snapshot_id);
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            גיבוי ושחזור נתונים
          </h1>
          <p className="text-gray-600 mt-1">
            נהל גיבויים של הנתונים הפיננסיים שלך ושחזר אותם במידת הצורך
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={cleanupSnapshots}
            disabled={loading}
            title="נקה גיבויים ישנים ופגומים"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            ניקוי אוטומטי
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={creating || loading}
          >
            {creating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            יצירת גיבוי חדש
          </Button>
        </div>
      </div>

      {/* Create Snapshot Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>יצירת גיבוי חדש</CardTitle>
            <CardDescription>
              צור גיבוי של כל הנתונים הפיננסיים שלך
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם הגיבוי *</label>
              <Input
                value={newSnapshot.title}
                onChange={(e) => setNewSnapshot(prev => ({ ...prev, title: e.target.value }))}
                placeholder="לדוגמה: גיבוי חודשי ינואר 2025"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תיאור (אופציונלי)</label>
              <Textarea
                value={newSnapshot.description}
                onChange={(e) => setNewSnapshot(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור קצר של הגיבוי"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">זמן שמירה (ימים)</label>
              <Input
                type="number"
                min="1"
                max="365"
                value={newSnapshot.retentionDays}
                onChange={(e) => setNewSnapshot(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
              />
              <p className="text-sm text-gray-500 mt-1">
                הגיבוי יימחק אוטומטית לאחר {newSnapshot.retentionDays} ימים
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={createSnapshot}
                disabled={creating || !newSnapshot.title.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    יוצר גיבוי...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    צור גיבוי
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSnapshot({ title: '', description: '', retentionDays: 30 });
                }}
              >
                ביטול
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Snapshots List */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">גיבויים זמינים ({snapshots.length})</h2>
        <Button
          variant="outline"
          onClick={loadSnapshots}
          disabled={loading}
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          רענן
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">טוען גיבויים...</span>
        </div>
      ) : snapshots.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין גיבויים</h3>
            <p className="text-gray-600 mb-4">עדיין לא נוצרו גיבויים. צור את הגיבוי הראשון שלך.</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              צור גיבוי ראשון
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {snapshots.map((snapshot) => (
            <Card key={snapshot.snapshot_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{snapshot.title}</CardTitle>
                      {getStatusBadge(snapshot.status)}
                    </div>
                    {snapshot.description && (
                      <CardDescription className="text-sm text-gray-600 mb-3">
                        {snapshot.description}
                      </CardDescription>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(snapshot.created_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4" />
                        {formatFileSize(snapshot.size_bytes || 0)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        פג תוקף: {formatDate(snapshot.expires_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreClick(snapshot)}
                      disabled={loading || isRestoring || snapshot.status !== 'ready'}
                      title="שחזר גיבוי"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(snapshot)}
                      disabled={loading || isRestoring}
                      className="text-red-600 hover:text-red-700"
                      title="מחק גיבוי"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(snapshot.entity_counts?.transactions || 0)}
                    </div>
                    <div className="text-sm text-blue-600">עסקאות</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(snapshot.entity_counts?.categories || 0)}
                    </div>
                    <div className="text-sm text-green-600">קטגוריות</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatNumber(snapshot.entity_counts?.budgets || 0)}
                    </div>
                    <div className="text-sm text-purple-600">תקציבים</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatNumber(snapshot.entity_counts?.category_rules || 0)}
                    </div>
                    <div className="text-sm text-orange-600">חוקי סיווג</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              אישור מחיקת גיבוי
            </AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הגיבוי "{selectedSnapshot?.title}"?
              <br />
              <strong className="text-red-600">פעולה זו אינה ניתנת לביטול.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              מחק גיבוי
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      {selectedSnapshot && !showDeleteDialog && (
        <AlertDialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
          <AlertDialogContent className="max-w-2xl" dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                אישור שחזור גיבוי
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p className="text-base">
                  האם אתה בטוח שברצונך לשחזר את הגיבוי "{selectedSnapshot.title}"?
                </p>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium mb-2">
                    <strong>אזהרה:</strong> פעולה זו אינה ניתנת לביטול!
                  </p>
                  <p className="text-red-700 text-sm">
                    כל הנתונים הנוכחיים במערכת יימחקו ויוחלפו בנתונים מהגיבוי.
                    מומלץ ליצור גיבוי נוסף לפני ביצוע השחזור.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-gray-800">
                    נתונים שיושחזרו:
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div>• עסקאות: {formatNumber(selectedSnapshot.entity_counts?.transactions || 0)}</div>
                      <div>• קטגוריות: {formatNumber(selectedSnapshot.entity_counts?.categories || 0)}</div>
                    </div>
                    <div className="space-y-1">
                      <div>• תקציבים: {formatNumber(selectedSnapshot.entity_counts?.budgets || 0)}</div>
                      <div>• חוקי סיווג: {formatNumber(selectedSnapshot.entity_counts?.category_rules || 0)}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>זמן שחזור משוער:</strong> 1-10 דקות (תלוי בכמות הנתונים)
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRestoring}>
                ביטול
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRestore}
                disabled={isRestoring}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    מתחיל שחזור...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    שחזר גיבוי
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
