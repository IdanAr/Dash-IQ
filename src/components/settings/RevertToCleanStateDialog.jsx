
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
import { Loader2, RotateCcw, AlertTriangle, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { t, isRTL } from "@/components/utils/i18n";
import { revertToCleanState } from "@/api/functions";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RevertToCleanStateDialog({ onSuccess, trigger }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const isRTLLayout = isRTL();

  const requiredConfirmationText = t('settings.advanced.cleanState.confirmationText');

  const handleRevert = async () => {
    setError(null);
    if (confirmationText !== requiredConfirmationText) {
      toast({
        title: t('settings.advanced.cleanState.error'),
        description: t('settings.advanced.cleanState.wrongConfirmation'),
        variant: "destructive",
      });
      setError(t('settings.advanced.cleanState.wrongConfirmation'));
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting revert to clean state...');
      
      const response = await revertToCleanState();
      
      console.log('Revert response:', response);

      if (response && response.data && response.data.success) {
        toast({
          title: t('settings.advanced.cleanState.successTitle'),
          description: t('settings.advanced.cleanState.successDescription'),
          duration: 5000,
        });

        // Clear all local storage
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.clear();
        }
        
        // Close dialog
        setIsOpen(false);
        setConfirmationText('');
        setError(null);
        
        // Call success callback
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Refresh the page after a short delay
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 2000);

      } else {
        const errorMessage = response?.data?.message || response?.error || t('settings.advanced.cleanState.genericError');
        throw new Error(errorMessage);
      }

    } catch (err) {
      console.error('Error reverting to clean state:', err);
      
      toast({
        title: t('settings.advanced.cleanState.error'),
        description: err.message,
        variant: "destructive",
      });
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (open) => {
    if (!isProcessing) {
      setIsOpen(open);
      if (!open) {
        setConfirmationText('');
        setError(null);
      }
    }
  };

  const isConfirmationValid = confirmationText === requiredConfirmationText;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      
      <AlertDialogContent className="max-w-lg" dir={isRTLLayout ? 'rtl' : 'ltr'}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-6 h-6" />
            {t('settings.dialogs.cleanState.title')}
          </AlertDialogTitle>
          
          <AlertDialogDescription className="space-y-4 text-left">
            <p className="text-red-600 font-medium">
              {t('settings.advanced.cleanState.description')}
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">
                {t('settings.dialogs.cleanState.warningHeader')}
              </h4>
              <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                <li>{t('settings.dialogs.cleanState.warning1')}</li>
                <li>{t('settings.dialogs.cleanState.warning2')}</li>
                <li>{t('settings.dialogs.cleanState.warning3')}</li>
                <li>{t('settings.dialogs.cleanState.warning4')}</li>
                <li>{t('settings.dialogs.cleanState.warning5')}</li>
                <li>{t('settings.dialogs.cleanState.warning6')}</li>
              </ul>
              <p className="text-sm text-red-700 mt-2 font-medium">
                {t('settings.dialogs.cleanState.irreversibleWarning')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation-text" className="text-red-800 font-medium">
                {t('settings.dialogs.cleanState.confirmationLabel', { requiredText: requiredConfirmationText })}
              </Label>
              <Input
                id="confirmation-text"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={requiredConfirmationText}
                disabled={isProcessing}
                className={`w-full ${isConfirmationValid ? 'border-green-500' : 'border-red-300'}`}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel 
            disabled={isProcessing}
            className="flex-1"
          >
            {t('settings.dialogs.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevert}
            disabled={!isConfirmationValid || isProcessing}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('settings.dialogs.cleanState.loadingButton')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                {t('settings.dialogs.cleanState.confirmButton')}
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
