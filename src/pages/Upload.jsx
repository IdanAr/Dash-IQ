
import React, { useState, useEffect } from "react";
import { Transaction, Category, CategoryRule, UploadLog } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, FileUp, CheckCircle2, Loader2, BrainCircuit, PlusCircle, Clock, FileDown } from "lucide-react";
import { ExtractDataFromUploadedFile, UploadFile, InvokeLLM } from "@/api/integrations";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { subMonths, addMonths, parseISO, differenceInDays } from 'date-fns';
import { t, isRTL } from '@/components/utils/i18n';

// Define a limit for fetching existing transactions for duplicate checks
// This acts as a "batch size" for this read operation.
const EXISTING_TRANSACTIONS_FETCH_LIMIT = 1000; // Fetch up to 1000 records at a time

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [categorizing, setCategorizing] = useState(false);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [newRules, setNewRules] = useState([]);
  const [savingData, setSavingData] = useState(false);
  const [uploadLogs, setUploadLogs] = useState([]);
  const [viewMode, setViewMode] = useState("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseError, setParseError] = useState(null);
  const [duplicateSets, setDuplicateSets] = useState([]);
  const [showDuplicateResolutionDialog, setShowDuplicateResolutionDialog] = useState(false);
  const [transactionsToReview, setTransactionsToReview] = useState([]);
  const [resolvedDuplicates, setResolvedDuplicates] = useState({});
  const [uploadLog, setUploadLog] = useState(null); // For UploadLog entity
  const [userHasTransactions, setUserHasTransactions] = useState(false); // To check if user has any transactions at all
  const [isLoadingExisting, setIsLoadingExisting] = useState(true); // For initial check

  const { toast } = useToast();

  // Update all toast messages in upload operations
  const handleFileProcessed = (data) => {
    if (data.transactions && data.transactions.length > 0) {
      toast({
        title: t('toast.success'),
        description: t('toast.fileProcessed') + ` (${data.transactions.length} ${t('transactions.title')})`,
      });
    } else {
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: t('toast.uploadError'),
      });
    }
  };

  const handleUploadError = () => {
    toast({
      variant: "destructive",
      title: t('toast.error'),
      description: t('toast.uploadError'),
    });
  };

  const handleTemplateDownload = () => {
    toast({
      title: t('toast.success'),
      description: t('toast.templateDownloaded'),
    });
  };

  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        const fetchedCategories = await Category.list('sort_order'); // Sort categories
        setCategories(fetchedCategories);
        loadRules();
        loadUploadHistory();
      } catch (error) {
        console.error("Error loading initial data for upload page:", error);
        toast({ title: t('common.error'), description: t('upload.toast.initialDataLoadFailed'), variant: "destructive" });
      }
    };
    loadInitialData();
    checkInitialTransactions();
  }, []);

  React.useEffect(() => {
    if (extractedTransactions.length > 0) {
      const count = extractedTransactions.filter(t => !t.category_id).length;
      setUncategorizedCount(count);
    }
  }, [extractedTransactions]);

  const loadCategories = async () => {
    const cats = await Category.list('sort_order');
    setCategories(cats);
  };

  const loadRules = async () => {
    const rulesList = await CategoryRule.list();
    setRules(rulesList);
  };

  const loadUploadHistory = async () => {
    try {
      const logs = await UploadLog.list('-upload_date');
      setUploadLogs(logs);
    } catch (error) {
      console.error("Error loading upload history:", error);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === "text/csv" || selectedFile.type === "application/vnd.ms-excel" || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError(t('upload.errors.csvOnly'));
      setFile(null);
    }
  };

  const processFile = async () => {
    if (!file || !(file instanceof File) || file.size === 0) {
      handleUploadError(); // Replaced specific invalid file toast with generic upload error
      setUploading(false);
      return;
    }

    setUploading(true);
    setProgress(0);
    let retryCount = 3;

    while (retryCount > 0) {
      try {
        setProgress(10);

        const uploadResult = await Promise.race([
          UploadFile({ file }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Upload timeout')), 30000)
          )
        ]);

        if (!uploadResult || !uploadResult.file_url) {
          throw new Error(t('upload.errors.fileUploadFailed'));
        }

        setProgress(40);

        // Use a more flexible schema that can handle various CSV formats
        const extractionSchema = {
          type: "array", // Changed from "object" to "array"
          description: "Array of financial transactions from CSV file",
          items: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "Transaction date in any format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY, etc.)"
              },
              business_name: {
                type: "string",
                description: "Name of the business, merchant, store, or payee. May be in columns like: business, merchant, store, company, payee, description, details"
              },
              amount: {
                type: "number",
                description: "Transaction amount as a positive number. May be in columns like: amount, sum, total, price, cost, value"
              },
              description: {
                type: "string",
                description: "Additional details or notes about the transaction"
              }
            },
            required: ["date", "business_name", "amount"]
          }
        };

        console.log('Starting file extraction with flexible schema');

        const result = await Promise.race([
          ExtractDataFromUploadedFile({
            file_url: uploadResult.file_url,
            json_schema: extractionSchema
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('ExtractData timeout')), 60000)
          )
        ]);

        setProgress(70);

        // Enhanced debugging and result processing
        console.log("ExtractDataFromUploadedFile result:", {
          status: result?.status,
          outputType: typeof result?.output,
          outputLength: Array.isArray(result?.output) ? result.output.length : 'not array',
          hasOutput: !!result?.output,
          details: result?.details,
          error: result?.error
        });

        let transactions = [];

        if (result && result.status === "success") {
          console.log("Extraction successful, processing output...");

          // Handle different response formats more robustly
          if (Array.isArray(result.output)) {
            transactions = result.output;
            console.log("Found transactions as direct array:", transactions.length);
          } else if (result.output && typeof result.output === 'object') {
            // Look for arrays in the object
            const possibleArrays = Object.values(result.output).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              transactions = possibleArrays[0];
              console.log("Found transactions in nested array:", transactions.length);
            } else if (result.output.transactions && Array.isArray(result.output.transactions)) {
              transactions = result.output.transactions;
              console.log("Found transactions in output.transactions:", transactions.length);
            } else {
              // Try to convert single object to array
              if (result.output.date || result.output.business_name || result.output.amount) {
                transactions = [result.output];
                console.log("Converted single transaction to array");
              }
            }
          }
        } else {
          console.error("Extraction failed or returned no data");
          console.log("Full result:", JSON.stringify(result, null, 2));
        }

        console.log("Transactions found:", transactions.length);
        console.log("Sample transactions:", JSON.stringify(transactions.slice(0, 3), null, 2));


        if (transactions && transactions.length > 0) {
          console.log("Processing", transactions.length, "transactions");

          // Enhanced normalization with better error handling
          const normalizedAndValidatedTransactions = transactions.map((transaction, index) => {
            console.log(`Processing transaction ${index + 1}:`, transaction);

            const normTrans = { ...transaction };

            // Normalize Date with more flexible parsing - FIXED VERSION
            if (normTrans.date) {
              try {
                let parsedDate = null;
                const dateStr = String(normTrans.date).trim();

                console.log(`Attempting to parse date: "${dateStr}"`);

                // Try DD/MM/YYYY or DD-MM-YYYY first (Israeli standard preference)
                const ddmmMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                if (ddmmMatch) {
                  const day = parseInt(ddmmMatch[1]);
                  const month = parseInt(ddmmMatch[2]);
                  const year = parseInt(ddmmMatch[3]);

                  // Heuristic: if day > 12, it must be DD/MM. If month > 12, it's ambiguous, assume DD/MM (Israeli preference)
                  if (day > 12 || (day <= 12 && month > 12)) { // Day greater than 12 makes it unambiguous DD/MM/YYYY
                    // Create date as YYYY-MM-DD string directly to avoid timezone issues
                    parsedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    console.log(`Parsed as DD/MM/YYYY: ${day}/${month}/${year} -> ${parsedDate}`);
                  } else if (month <= 12 && day <= 12) {
                    // Ambiguous case (e.g., 01/02/2023). Prioritize DD/MM/YYYY for Israeli context
                    parsedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    console.log(`Ambiguous date, prioritized as DD/MM/YYYY: ${day}/${month}/${year} -> ${parsedDate}`);
                  }
                }

                // Try YYYY-MM-DD or YYYY/MM/DD format
                if (!parsedDate) {
                  const isoMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
                  if (isoMatch) {
                    const year = parseInt(isoMatch[1]);
                    const month = parseInt(isoMatch[2]);
                    const day = parseInt(isoMatch[3]);
                    parsedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    console.log(`Parsed as YYYY-MM-DD: ${parsedDate}`);
                  }
                }

                // Validate the parsed date string
                if (parsedDate && parsedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  // Additional validation: check if it's a valid date
                  const testDate = new Date(parsedDate + 'T00:00:00');
                  if (!isNaN(testDate.getTime())) {
                    normTrans.date = parsedDate;
                    console.log(`Date normalized to: ${normTrans.date}`);
                  } else {
                    console.warn("Invalid date after parsing:", parsedDate);
                    normTrans.date = null;
                  }
                } else {
                  console.warn("Could not parse date value:", dateStr);
                  normTrans.date = null;
                }
              } catch (e) {
                console.warn("Error during date parsing:", normTrans.date, e);
                normTrans.date = null;
              }
            } else {
              normTrans.date = null;
            }

            // Normalize Business Name with flexible field mapping
            let businessName = null;

            // Try different possible field names from schema description
            const businessFields = ['business_name', 'business', 'merchant', 'store', 'company', 'payee', 'description', 'details', 'name'];
            for (const field of businessFields) {
              if (transaction[field] && typeof transaction[field] === 'string' && transaction[field].trim()) {
                businessName = transaction[field].trim();
                console.log(`Found business name from field "${field}": "${businessName}"`);
                break;
              }
            }
            normTrans.business_name = businessName;
            if (!normTrans.business_name) {
              console.warn("Business name could not be extracted from common fields.");
              normTrans.business_name = null;
            }


            // Normalize Amount with flexible field mapping
            let amount = 0;

            // Try different possible field names from schema description
            const amountFields = ['amount', 'sum', 'total', 'price', 'cost', 'value', 'billing_amount'];
            for (const field of amountFields) {
              if (transaction[field] !== null && transaction[field] !== undefined) {
                let currentAmountCandidate = transaction[field];
                if (typeof currentAmountCandidate === 'string') {
                  const cleanAmount = currentAmountCandidate.replace(/[₪$€£,.\s]/g, '').trim(); // Also replace '.' for cases where it's used as thousands separator
                  const parsedAmount = parseFloat(cleanAmount);
                  if (!isNaN(parsedAmount) && parsedAmount > 0) {
                    amount = parsedAmount;
                    console.log(`Found amount from string field "${field}": "${currentAmountCandidate}" -> ${amount}`);
                    break;
                  }
                } else if (typeof currentAmountCandidate === 'number' && currentAmountCandidate > 0) {
                  amount = currentAmountCandidate;
                  console.log(`Found amount from number field "${field}": ${amount}`);
                  break;
                }
              }
            }

            if (isNaN(amount) || amount <= 0) {
              console.warn("Invalid or non-positive amount after checking all fields:", JSON.stringify(transaction), "-> setting to 0");
              amount = 0;
            }

            normTrans.billing_amount = Math.abs(amount);
            normTrans.transaction_amount = Math.abs(amount); // Keep transaction_amount consistent with billing_amount for now

            // Ensure details is string or null (from 'description' or 'details' in raw transaction)
            normTrans.details = typeof transaction.description === 'string' && transaction.description.trim()
                ? transaction.description.trim()
                : (typeof transaction.details === 'string' && transaction.details.trim()
                    ? transaction.details.trim()
                    : null);

            console.log(`Transaction ${index + 1} after normalization:`, {
              date: normTrans.date,
              business_name: normTrans.business_name,
              billing_amount: normTrans.billing_amount,
              details: normTrans.details,
              valid: !!(normTrans.date && normTrans.business_name && normTrans.billing_amount > 0)
            });

            return normTrans;
          });

          // Filter out transactions missing critical fields AFTER normalization
          const validTransactions = normalizedAndValidatedTransactions.filter((t, index) => {
            const hasDate = !!t.date;
            const hasBusinessName = !!t.business_name;
            const hasValidAmount = t.billing_amount > 0;
            const isValid = hasDate && hasBusinessName && hasValidAmount;
            if (!isValid) {
              console.warn(`Skipping transaction ${index + 1} due to missing critical fields after normalization:`, {
                hasDate: hasDate,
                hasBusinessName: hasBusinessName,
                hasValidAmount: hasValidAmount,
                originalTransaction: transactions[index], // Original raw transaction for context
                normalizedTransaction: t // Normalized transaction with current state of fields
              });
            }
            return isValid;
          });

          console.log(`Valid transactions after filtering: ${validTransactions.length} out of ${normalizedAndValidatedTransactions.length}`);

          if (validTransactions.length !== normalizedAndValidatedTransactions.length) {
            const skippedCount = normalizedAndValidatedTransactions.length - validTransactions.length;
            toast({
              title: t('upload.toast.invalidRecordsSkippedTitle'),
              description: t('upload.toast.invalidRecordsSkippedDescription', { count: skippedCount }),
              variant: "warning",
              duration: 10000,
            });
          }

          if (validTransactions.length === 0) {
            // Provide detailed error information for the user
            let detailedError = 'לא נמצאו עסקאות תקינות בקובץ.';
            if (normalizedAndValidatedTransactions.length > 0) {
                const firstInvalid = normalizedAndValidatedTransactions.find(t => !(t.date && t.business_name && t.billing_amount > 0));
                if (firstInvalid) {
                    detailedError += ` בדוק את העמודות הבאות: `;
                    if (!firstInvalid.date) detailedError += `תאריך (התקבל: "${firstInvalid.date}"), `;
                    if (!firstInvalid.business_name) detailedError += `שם עסק (התקבל: "${firstInvalid.business_name}"), `;
                    if (!(firstInvalid.billing_amount > 0)) detailedError += `סכום (התקבל: "${firstInvalid.billing_amount}").`;
                    detailedError = detailedError.replace(/, $/, '.'); // Clean up trailing comma
                    detailedError = detailedError.replace(/,$/, '.'); // Clean up trailing comma
                }
            } else {
                 detailedError += ' ייתכן שהקובץ ריק או לא מכיל נתונים תקינים.';
            }

            throw new Error(detailedError);
          }

          // Auto-categorize transactions
          const categorizedTransactions = validTransactions.map(transaction => {
            const matchingRule = rules.find(rule =>
              transaction.business_name && rule.business_name_pattern &&
              transaction.business_name.toLowerCase().includes(rule.business_name_pattern.toLowerCase())
            );

            return {
              ...transaction,
              category_id: matchingRule?.category_id || null,
              is_income: matchingRule
                ? categories.find(c => c.id === matchingRule.category_id)?.type === "income"
                : false
            };
          });

          console.log("Final categorized transactions:", categorizedTransactions.length);
          setExtractedTransactions(categorizedTransactions);
          setProgress(90);

          if (categorizedTransactions.length > 0) {
            await categorizeUnknownTransactions(categorizedTransactions);
          }
          setProgress(100);
          handleFileProcessed({ transactions: categorizedTransactions }); // Using the new handler
          break;
        } else {
          // Enhanced error reporting for initial extraction
          const errorDetails = result?.details || result?.error || 'לא זוהו נתונים בקובץ';
          console.error("No transactions found. Full result:", result);

          let userErrorMessage = 'לא נמצאו עסקאות בקובץ. ';

          if (result?.status === 'success' && (!result.output || (Array.isArray(result.output) && result.output.length === 0))) {
            userErrorMessage = 'הקובץ עובד בהצלחה אך לא נמצאו נתונים. ודא שהקובץ מכיל שורות עם נתונים (לא רק כותרות).';
          } else if (result?.details) {
            if (result.details.includes('empty') || result.details.includes('no data')) {
              userErrorMessage = 'הקובץ ריק או לא מכיל נתונים.';
            } else if (result.details.includes('format') || result.details.includes('parse') || result.details.includes('CSV')) {
              userErrorMessage = 'פורמט הקובץ לא נתמך. נסה לשמור את הקובץ כ-CSV UTF-8.';
            } else if (result.details.includes('column') || result.details.includes('header') || result.details.includes('field')) {
              userErrorMessage = 'המערכת לא זיהתה את העמודות הנדרשות. ודא שיש עמודות לתאריך, שם עסק וסכום.';
            }
          }

          throw new Error(`${userErrorMessage} פרטים נוספים: ${errorDetails}`);
        }
      } catch (error) {
        console.error(`Error processing file (attempt ${4 - retryCount}):`, error);
        retryCount--;

        let userErrorMessage = t('upload.errors.genericProcessingFailed');

        if (error.message) {
          if (error.message.includes('timeout')) {
            userErrorMessage = 'הזמן הקצוב עבר. הקובץ גדול מדי או החיבור איטי.';
          } else if (error.message.includes('לא נמצאו עסקאות')) {
            userErrorMessage = error.message; // Use the detailed error message
          } else if (error.message.includes('SQL') || error.message.includes('Used the following SQL query') || error.message.includes('פורמט הקובץ לא תקין')) {
            userErrorMessage = 'בעיה בפורמט הקובץ. נסה להשתמש בתבנית CSV פשוטה יותר.';
          } else {
            userErrorMessage = error.message.includes('שגיאה בעיבוד') ? error.message : `שגיאה בעיבוד הקובץ: ${error.message}`;
          }
        }

        if (retryCount === 0) {
          handleUploadError(); // Replaced specific processing failed toast with generic upload error
          setProgress(0);
        } else {
          toast({
            variant: "default",
            title: t('common.retryingTitle', { count: retryCount }), // Standardized title
            description: userErrorMessage, // Kept specific error message
            duration: 8000,
          });
          await new Promise(resolve => setTimeout(resolve, 2000 * (3 - retryCount + 1)));
          setProgress(prev => Math.max(0, prev - 10));
        }
      }
    }
    setUploading(false);
  };

  const categorizeUnknownTransactions = async (transactions) => {
    setCategorizing(true);
    try {
      const uncategorized = transactions.filter(t => !t.category_id && t.business_name); // Ensure business_name exists

      if (uncategorized.length === 0) {
        setCategorizing(false);
        return;
      }

      const batchSize = 2;
      const updatedTransactions = [...transactions];
      const createdRules = [];

      for (let i = 0; i < uncategorized.length; i += batchSize) {
        const batch = uncategorized.slice(i, i + batchSize);
        const businessNames = batch.map(t => t.business_name).filter(name => name); // Filter out undefined/null names

        if (businessNames.length === 0) continue; // Skip batch if no valid business names

        try {
          const result = await retryOperation(
            async () => {
              return await Promise.race([
                InvokeLLM({
                  prompt: `
                  בתור מומחה פיננסי, סווג את העסקים הבאים לקטגוריות הקיימות.
                  הקפד לבחור את הקטגוריה המתאימה ביותר.

                  עסקים לסיווג: ${JSON.stringify(businessNames)}

                  קטגוריות זמינות: ${JSON.stringify(categories.map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    description: `${c.name} - ${c.type === 'income' ? 'הכנסה' : 'הוצאה'}`
                  })))}
                  `,
                  response_json_schema: {
                    type: "object",
                    properties: {
                      categorizations: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            business_name: { type: "string" },
                            category_id: { type: "string" },
                            is_income: { type: "boolean" }
                          }
                        }
                      }
                    }
                  }
                }),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('LLM timeout')), 45000)
                )
              ]);
            },
            3,
            5000
          );

          if (result?.categorizations) {
            result.categorizations.forEach(cat => {
              const transactionIndex = updatedTransactions.findIndex(
                t => t.business_name === cat.business_name && !t.category_id
              );

              if (transactionIndex !== -1) {
                updatedTransactions[transactionIndex].category_id = cat.category_id;
                updatedTransactions[transactionIndex].is_income = cat.is_income;

                createdRules.push({
                  business_name_pattern: cat.business_name,
                  category_id: cat.category_id
                });
              }
            });
          }

        } catch (error) {
          console.error("Error in batch categorization:", error);
          toast({
            variant: "warning",
            title: t('upload.toast.autoCategorizationErrorTitle'),
            description: t('upload.toast.autoCategorizationErrorDescription'),
          });
        }

        if (i + batchSize < uncategorized.length) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      setExtractedTransactions(updatedTransactions);
      setNewRules(createdRules);
    } catch (error) {
      console.error("Error categorizing transactions:", error);
      toast({
        variant: "destructive",
        title: t('toast.error'), // Standardized title
        description: t('upload.toast.categorizationErrorDescription'), // Kept specific message
      });
    }
    setCategorizing(false);
  };

  const retryOperation = async (operation, maxRetries = 3, delayMs = 3000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  };

  const handleCategoryChange = (transactionIndex, categoryId) => {
    setExtractedTransactions(prev => {
      const updated = [...prev];
      const category = categories.find(c => c.id === categoryId);

      updated[transactionIndex] = {
        ...updated[transactionIndex],
        category_id: categoryId,
        is_income: category?.type === "income"
      };

      return updated;
    });

    const transaction = extractedTransactions[transactionIndex];
    if (transaction && transaction.business_name) {
      const existingRuleIndex = newRules.findIndex(
        r => r.business_name_pattern === transaction.business_name
      );

      if (existingRuleIndex !== -1) {
        setNewRules(prev => {
          const updated = [...prev];
          updated[existingRuleIndex].category_id = categoryId;
          return updated;
        });
      } else {
        setNewRules(prev => [
          ...prev,
          {
            business_name_pattern: transaction.business_name,
            category_id: categoryId
          }
        ]);
      }
    }
  };

  const saveTransactions = async () => {
    setSavingData(true);
    try {
      const validTransactionsToSave = extractedTransactions.filter(t =>
        t.category_id &&
        t.date && // Ensure date exists
        t.business_name && // Ensure business_name exists
        typeof t.billing_amount === 'number' && // Ensure billing_amount is a number
        t.billing_amount > 0 // Ensure amount is positive
      );

      if (validTransactionsToSave.length === 0) {
        toast({
            variant: "warning",
            title: t('upload.toast.noTransactionsSavedTitle'),
            description: t('upload.toast.noTransactionsSavedDescription'),
        });
        setSavingData(false);
        return;
      }

      // Log any transactions that were extracted but not saved due to missing data
      const notSavedCount = extractedTransactions.length - validTransactionsToSave.length;
      if (notSavedCount > 0) {
          toast({
              variant: "info",
              title: t('upload.toast.transactionsNotSavedTitle'),
              description: t('upload.toast.transactionsNotSavedDescription', { count: notSavedCount }),
              duration: 7000,
          });
      }


      const batchSize = 3;
      let processedCount = 0;

      for (let i = 0; i < validTransactionsToSave.length; i += batchSize) {
        const batch = validTransactionsToSave.slice(i, i + batchSize);

        await Promise.all(batch.map(async (transaction) => {
          try {
            // Final check before create (redundant with filter above but good for safety)
            if (!transaction.date || !transaction.business_name || typeof transaction.billing_amount !== 'number' || !transaction.category_id || transaction.billing_amount <= 0) {
                console.warn("Skipping creation of invalid transaction object:", transaction);
                return; // Skip this specific transaction
            }
            await Transaction.create(transaction);
          } catch (error) {
            console.error("Error creating transaction:", error, transaction);
          }
        }));

        processedCount += batch.length;

        if (i + batchSize < validTransactionsToSave.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (newRules.length > 0) {
        for (let i = 0; i < newRules.length; i += batchSize) {
          const batch = newRules.slice(i, i + batchSize);

          await Promise.all(batch.map(async (rule) => {
            try {
              await CategoryRule.create(rule);
            } catch (error) {
              console.error("Error creating rule:", error);
            }
          }));

          if (i + batchSize < newRules.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      await UploadLog.create({
        filename: file.name,
        upload_date: new Date().toISOString(),
        record_count: validTransactionsToSave.length,
        status: validTransactionsToSave.length === extractedTransactions.length ? "success" : "partial",
        notes: t('upload.log.notes', { savedCount: validTransactionsToSave.length, totalExtracted: extractedTransactions.length, notSavedCount: notSavedCount })
      });

      loadUploadHistory();

      setFile(null);
      setExtractedTransactions([]);
      setProgress(0);
      setNewRules([]);
      setActiveTab("all");

      loadRules();
      loadCategories();

      toast({
        title: t('toast.success'), // Standardized title
        description: t('upload.toast.transactionsSavedSuccessDescription', { count: validTransactionsToSave.length }), // Kept specific message
      });
    } catch (error) {
      console.error("Error saving transactions:", error);

      if (error.message && error.message.includes('429')) {
        toast({
          variant: "destructive",
          title: t('toast.error'), // Standardized title
          description: t('upload.toast.rateLimitDescription'), // Kept specific message
        });
      } else {
        toast({
          variant: "destructive",
          title: t('toast.error'), // Standardized title
          description: error.message || t('upload.toast.savingErrorGeneric'), // Kept specific message
        });
      }
    }
    setSavingData(false);
  };

  const getFilteredTransactions = () => {
    if (activeTab === "all") return extractedTransactions;
    if (activeTab === "uncategorized") return extractedTransactions.filter(t => !t.category_id);
    return extractedTransactions.filter(t => t.category_id);
  };

  const setAllUncategorizedToCategory = (categoryId) => {
    setExtractedTransactions(prev => {
      const updated = [...prev];
      const category = categories.find(c => c.id === categoryId);

      updated.forEach((transaction, index) => {
        if (!transaction.category_id) {
          updated[index].category_id = categoryId;
          updated[index].is_income = category?.type === "income";

          if (transaction.business_name) {
            const existingRuleIndex = newRules.findIndex(
              r => r.business_name_pattern === transaction.business_name
            );

            if (existingRuleIndex === -1) {
              setNewRules(prevRules => [ // Use functional update for setNewRules
                ...prevRules,
                {
                  business_name_pattern: transaction.business_name,
                  category_id: categoryId
                }
              ]);
            }
          }
        }
      });

      return updated;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.unknownDate');
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm");
    } catch (e) {
      return t('common.invalidDate');
    }
  };

  const renderUploadForm = () => {
    const isRTLLayout = isRTL();

    return (
      <>
        {!extractedTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('upload.guide.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-4">{t('upload.guide.title')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-700 font-medium">{t('upload.guide.step1.number')}</span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">{t('upload.guide.step1.title')}</p>
                        <p className="text-sm text-blue-800 mt-1">{t('upload.guide.step1.description')}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            // Create a simple CSV template with English headers
                            const headers = "date,business_name,amount,description\n";
                            const today = new Date();
                            const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
                            const yesterdayStr = new Date(today.getTime() - 24*60*60*1000).toISOString().split('T')[0];

                            const examples = [
                              `${todayStr},"Super Yochananof",150.50,"Weekly groceries"`,
                              `${todayStr},"Aroma Tel Aviv",35.90,"Coffee and cake"`,
                              `${yesterdayStr},"Paz Gas Station",280.00,"Car fuel"`,
                              `${yesterdayStr},"Pizza Hut",89.90,"Dinner"`,
                              `${yesterdayStr},"Bank Leumi",50.00,"Transfer fee"`
                            ].join('\n') + '\n';

                            const csvContent = headers + examples;

                            const blob = new Blob([csvContent], {
                              type: 'text/csv;charset=utf-8'
                            });

                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = "transactions_template.csv";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            handleTemplateDownload(); // Using the new handler
                          }}
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          {t('upload.guide.step1.button')}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-700 font-medium">{t('upload.guide.step2.number')}</span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">{t('upload.guide.step2.title')}</p>
                        <p className="text-sm text-blue-800 mt-1">{t('upload.guide.step2.description')}</p>
                        <ul className="mt-2 space-y-1 text-sm text-blue-800">
                          <li>• {t('upload.guide.step2.fields.date')}</li>
                          <li>• {t('upload.guide.step2.fields.businessName')}</li>
                          <li>• {t('upload.guide.step2.fields.amount')}</li>
                          <li>• {t('upload.guide.step2.fields.description')}</li>
                        </ul>
                        <p className="text-sm text-blue-800 mt-2 italic">
                          {t('upload.guide.step2.note')}
                        </p>
                        <p className="text-sm text-blue-800 mt-2 italic">
                          {t('upload.guide.step2.autoDetect')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-700 font-medium">{t('upload.guide.step3.number')}</span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">{t('upload.guide.step3.title')}</p>
                        <p className="text-sm text-blue-800 mt-1">{t('upload.guide.step3.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <FileUp className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('upload.dropZone.title')}
                    </p>
                  </label>
                </div>

                {file && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileUp className="w-4 h-4 mr-2" />
                      <span>{t('upload.dropZone.fileSelected')} {file.name}</span>
                      <Badge variant="secondary">
                        {(file.size / 1024).toFixed(2)} KB
                      </Badge>
                    </div>

                    {uploading ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t('upload.dropZone.processing')}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    ) : (
                      <Button onClick={processFile} className="w-full">
                        {t('upload.dropZone.processFile')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {extractedTransactions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('upload.categorization.title', { count: extractedTransactions.length })}</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">{t('upload.categorization.tabs.all')}</TabsTrigger>
                  <TabsTrigger value="categorized">{t('upload.categorization.tabs.categorized')}</TabsTrigger>
                  <TabsTrigger value="uncategorized" className="relative">
                    {t('upload.categorization.tabs.uncategorized')}
                    {uncategorizedCount > 0 && (
                      <Badge className="ml-2 bg-red-500 hover:bg-red-600">{uncategorizedCount}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorizing && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <div className="flex items-center">
                      <BrainCircuit className="h-4 w-4 text-blue-500 mr-2 animate-pulse" />
                      <span>{t('upload.categorization.autoCategorizingProgress')}</span>
                    </div>
                  </Alert>
                )}

                {activeTab === "uncategorized" && uncategorizedCount > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-medium">{t('upload.categorization.bulkCategorize.title')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Badge
                          key={category.id}
                          className="cursor-pointer bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 py-1.5 px-3"
                          onClick={() => setAllUncategorizedToCategory(category.id)}
                        >
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-md border">
                  <table className="min-w-full divide-y">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('upload.categorization.table.date')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('upload.categorization.table.business')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('upload.categorization.table.amount')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('upload.categorization.table.type')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('upload.categorization.table.category')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                      {getFilteredTransactions().map((transaction, index) => (
                        <tr key={index} className={!transaction.category_id ? "bg-red-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {transaction.business_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            ₪{(typeof transaction.billing_amount === 'number' ? transaction.billing_amount : 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <RadioGroup
                              value={transaction.is_income ? "income" : "expense"}
                              onValueChange={(value) => {
                                setExtractedTransactions(prev => {
                                  const updated = [...prev];
                                  updated[index].is_income = value === "income";
                                  return updated;
                                });
                              }}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="expense" id={`expense-${index}`} />
                                <Label htmlFor={`expense-${index}`} className="mr-2">{t('upload.categorization.table.typeExpense')}</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="income" id={`income-${index}`} />
                                <Label htmlFor={`income-${index}`} className="mr-2">{t('upload.categorization.table.typeIncome')}</Label>
                              </div>
                            </RadioGroup>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Select
                              value={transaction.category_id || ""}
                              onValueChange={(value) => handleCategoryChange(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('upload.categorization.table.selectCategory')} />
                              </SelectTrigger>
                              <SelectContent>
                                {categories
                                  .filter(c => c.type === (transaction.is_income ? "income" : "expense"))
                                  .map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setExtractedTransactions([]);
                      setNewRules([]);
                      setFile(null);
                    }}
                  >
                    {t('upload.categorization.actions.cancel')}
                  </Button>
                  <Button
                    onClick={saveTransactions}
                    disabled={savingData || extractedTransactions.filter(t=>t.category_id && t.billing_amount > 0).length === 0}
                  >
                    {savingData ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('upload.categorization.actions.saving')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t('upload.categorization.actions.save', { count: extractedTransactions.filter(t=>t.category_id && t.billing_amount > 0).length })}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  const renderUploadHistory = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('upload.history.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadLogs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('upload.history.empty.title')}</h3>
              <p className="text-gray-500">{t('upload.history.empty.description')}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="min-w-full divide-y">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('upload.history.table.uploadDate')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('upload.history.table.filename')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('upload.history.table.recordCount')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('upload.history.table.status')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('upload.history.table.details')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {uploadLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(log.upload_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <FileUp className="w-4 h-4 text-gray-400 mr-2" />
                          {log.filename}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.record_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge
                          className={
                            log.status === "success" ? "bg-green-100 text-green-800" :
                            log.status === "partial" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }
                        >
                          {log.status === "success" ? t('upload.history.status.success') :
                           log.status === "partial" ? t('upload.history.status.partial') :
                           t('upload.history.status.failed')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const checkInitialTransactions = async () => {
    setIsLoadingExisting(true);
    try {
      const T_firstCheck = await Transaction.list(undefined, 1); // Check if any transaction exists
      setUserHasTransactions(T_firstCheck.length > 0);
    } catch (error) {
      console.error("Error checking initial transactions:", error);
      toast({ title: t('common.error'), description: t('upload.toast.initialDataLoadFailed'), variant: "destructive" });
    } finally {
      setIsLoadingExisting(false);
    }
  };


  const loadExistingTransactionsForDuplicateCheck = async (newTransactions) => {
    if (newTransactions.length === 0) return [];

    const dates = newTransactions.map(t => {
      try {
        // Ensure date is valid before parsing
        return t.date ? parseISO(t.date) : null;
      } catch (e) {
        const d = new Date(t.date);
        return isNaN(d.getTime()) ? null : d;
      }
    }).filter(d => d !== null);

    if (dates.length === 0) {
      // toast({ title: "שגיאת תאריכים", description: "לא ניתן היה לעבד תאריכים בעסקאות החדשות.", variant: "destructive" });
      // No need for toast here if the main processing handles this
      return [];
    }

    const minDate = new Date(Math.min.apply(null, dates));
    const maxDate = new Date(Math.max.apply(null, dates));

    const startDate = subMonths(minDate, 1);
    const endDate = addMonths(maxDate, 1);

    try {
      const filter = {
        date: {
          $gte: format(startDate, 'yyyy-MM-dd'),
          $lte: format(endDate, 'yyyy-MM-dd')
        }
      };
      const existing = await Transaction.list(undefined, EXISTING_TRANSACTIONS_FETCH_LIMIT, filter);

      if (existing.length >= EXISTING_TRANSACTIONS_FETCH_LIMIT) {
          toast({
              title: t('upload.toast.dataWarningTitle'),
              description: t('upload.toast.dataWarningDescription', { limit: EXISTING_TRANSACTIONS_FETCH_LIMIT }),
              variant: "warning",
              duration: 7000,
          });
      }
      return existing;
    } catch (error) {
      console.error("Error loading existing transactions for duplicate check:", error);
      toast({
        title: t('toast.error'), // Standardized title
        description: t('upload.toast.existingTransactionsLoadErrorDescription'), // Kept specific message
        variant: "destructive",
      });
      return [];
    }
  };

  const autoCategorizeTransaction = (transaction, rules, categories) => {
    // Added null checks for transaction.business_name and rule.business_name_pattern
    const matchingRule = rules.find(rule =>
      transaction.business_name && rule.business_name_pattern &&
      transaction.business_name.toLowerCase().includes(rule.business_name_pattern.toLowerCase())
    );

    const category_id = matchingRule?.category_id || null;
    const is_income = matchingRule
      ? categories.find(c => c.id === matchingRule.category_id)?.type === "income"
      : (typeof transaction.billing_amount === 'number' && transaction.billing_amount > 0); // Heuristic: positive amount is income if no rule

    return { category_id, is_income };
  };

  const findDuplicateTransactions = (newTransactions, existingTransactions) => {
    const duplicateSets = [];

    newTransactions.forEach(newTransaction => {
      // Ensure newTransaction has the required fields before comparing
      if (!newTransaction.date || !newTransaction.business_name || typeof newTransaction.billing_amount !== 'number') {
        return; // Skip if essential data is missing
      }

      existingTransactions.forEach(existingTransaction => {
        // Ensure existingTransaction has the required fields
        if (!existingTransaction.date || !existingTransaction.business_name || typeof existingTransaction.billing_amount !== 'number') {
          return; // Skip if essential data is missing
        }

        // Compare based on date, business name, and billing amount
        // Dates should be compared consistently, e.g., by converting to yyyy-MM-dd strings or Date objects
        const newDateStr = format(new Date(newTransaction.date), 'yyyy-MM-dd');
        const existingDateStr = format(new Date(existingTransaction.date), 'yyyy-MM-dd');

        if (
          newDateStr === existingDateStr &&
          newTransaction.business_name.trim().toLowerCase() === existingTransaction.business_name.trim().toLowerCase() &&
          newTransaction.billing_amount === existingTransaction.billing_amount
        ) {
          duplicateSets.push({
            newTransaction: newTransaction,
            existingTransaction: existingTransaction
          });
        }
      });
    });

    return duplicateSets;
  };

  const parseDateString = (dateStr) => {
    console.log(`Parsing date string: "${dateStr}"`);
    
    // Try DD/MM/YYYY or DD-MM-YYYY first (Israeli standard preference)
    const ddmmMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmMatch) {
      const day = parseInt(ddmmMatch[1]);
      const month = parseInt(ddmmMatch[2]);
      const year = parseInt(ddmmMatch[3]);

      // Validate ranges
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        // Heuristic: if day > 12, it must be DD/MM
        if (day > 12 || (day <= 12 && month > 12)) {
          const result = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          console.log(`Parsed as DD/MM/YYYY: ${day}/${month}/${year} -> ${result}`);
          return result;
        } else if (month <= 12 && day <= 12) {
          // Ambiguous case - prioritize DD/MM/YYYY for Israeli context
          const result = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          console.log(`Ambiguous date, prioritized as DD/MM/YYYY: ${day}/${month}/${year} -> ${result}`);
          return result;
        }
      }
    }

    // Try YYYY-MM-DD or YYYY/MM/DD format
    const isoMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1]);
      const month = parseInt(isoMatch[2]);
      const day = parseInt(isoMatch[3]);
      
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const result = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        console.log(`Parsed as YYYY-MM-DD: ${result}`);
        return result;
      }
    }

    console.warn("Could not parse date string:", dateStr);
    return null;
  };

  const handleFileUpload = async () => {
    if (!file) {
        toast({ variant: "destructive", title: t('toast.error'), description: t('upload.toast.noFileSelectedDescription') }); // Standardized title
        return;
    }
    setIsProcessing(true);
    setParseError(null);
    setDuplicateSets([]);
    setTransactionsToReview([]);
    setResolvedDuplicates({});
    setUploadProgress(10);

    let parsedTransactions;
    try {
      // Use simplified schema for file upload as well
      const extractionSchemaForDialog = {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Transaction date in YYYY-MM-DD format"
            },
            business_name: {
              type: "string",
              description: "Name of the business"
            },
            transaction_amount: {
              type: "number",
              description: "Total transaction amount"
            },
            billing_amount: {
              type: "number",
              description: "Amount billed this period"
            },
            details: {
              type: "string",
              description: "Additional transaction details"
            }
          },
          required: ["date", "business_name", "billing_amount"]
        }
      };

      const { output, error: extractErrorDetails, status: extractStatus } = await ExtractDataFromUploadedFile({
        file: file,
        json_schema: extractionSchemaForDialog
      });

      if (extractStatus !== "success" || !output ) {
        const errorDetail = extractErrorDetails?.message || extractErrorDetails?.details || t('upload.errors.invalidOutputFormat');
        console.error("Error parsing file with integration or invalid output:", errorDetail, output);
        setParseError(t('upload.errors.fileProcessingError', { error: errorDetail }));
        setIsProcessing(false);
        setUploadProgress(0);
        toast({ variant: "destructive", title: t('toast.error'), description: t('upload.toast.fileProcessingErrorDetails', { details: errorDetail })}); // Standardized title
        return;
      }
      parsedTransactions = Array.isArray(output) ? output : [];

      if (parsedTransactions.length === 0 && extractStatus === "success") {
        // It's possible the file was empty or had no parsable rows by the integration
        setParseError(t('upload.errors.noTransactionsOrUnprocessable'));
        setIsProcessing(false);
        setUploadProgress(0);
        return;
      }
      setUploadProgress(30);

    } catch (e) {
      console.error("Error during file parsing process in handleFileUpload:", e);
      setParseError(t('upload.errors.fileReadError', { error: e.message }));
      setIsProcessing(false);
      setUploadProgress(0);
      return;
    }

    // Robust client-side validation and normalization for parsedTransactions in handleFileUpload
    const normalizedAndValidatedTransactions = parsedTransactions.map(t => {
        const normTrans = { ...t };
        
        // Date - FIXED VERSION to avoid timezone issues
        if (normTrans.date) {
          try {
            let parsedDateString = null;
            
            if (typeof normTrans.date === 'object') {
              if (normTrans.date.year && normTrans.date.month && normTrans.date.day) {
                // Direct string construction to avoid timezone issues
                const year = parseInt(normTrans.date.year);
                const month = parseInt(normTrans.date.month);
                const day = parseInt(normTrans.date.day);
                parsedDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              } else if (normTrans.date instanceof Date) {
                // Extract date components without timezone conversion
                const year = normTrans.date.getFullYear();
                const month = normTrans.date.getMonth() + 1; // getMonth() is 0-based
                const day = normTrans.date.getDate();
                parsedDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              } else {
                // Try to parse as string
                const dateStr = String(normTrans.date).trim();
                parsedDateString = parseDateString(dateStr);
              }
            } else {
              // Parse as string
              const dateStr = String(normTrans.date).trim();
              parsedDateString = parseDateString(dateStr);
            }
            
            normTrans.date = parsedDateString;
          } catch (e) { 
            console.warn("Error parsing date in handleFileUpload:", normTrans.date, e);
            normTrans.date = null; 
          }
        } else { 
          normTrans.date = null; 
        }

        // Business Name
        normTrans.business_name = typeof normTrans.business_name === 'string' ? normTrans.business_name.trim() : null;
        if (!normTrans.business_name) normTrans.business_name = null;

        // Billing Amount
        if (typeof normTrans.billing_amount === 'string') {
          const pAmount = parseFloat(normTrans.billing_amount.replace(/,/g, ''));
          normTrans.billing_amount = isNaN(pAmount) ? 0 : pAmount;
        } else if (typeof normTrans.billing_amount !== 'number') {
          normTrans.billing_amount = 0;
        }
         if (normTrans.billing_amount === null || typeof normTrans.billing_amount === 'undefined') normTrans.billing_amount = 0;


        // Transaction Amount
        if (typeof normTrans.transaction_amount === 'string') {
          const pAmount = parseFloat(normTrans.transaction_amount.replace(/,/g, ''));
          normTrans.transaction_amount = isNaN(pAmount) ? normTrans.billing_amount : pAmount;
        } else if (typeof normTrans.transaction_amount !== 'number') {
          normTrans.transaction_amount = normTrans.billing_amount;
        }
        if (normTrans.transaction_amount === null || typeof normTrans.transaction_amount === 'undefined') normTrans.transaction_amount = normTrans.billing_amount;

        normTrans.details = typeof normTrans.details === 'string' ? normTrans.details : null;

        return normTrans;
    });

    const validParsedTransactions = normalizedAndValidatedTransactions.filter(t => {
        if (!t.date || !t.business_name || t.billing_amount === null || typeof t.billing_amount === 'undefined') {
            console.warn("handleFileUpload: Skipping parsed transaction due to missing required fields after normalization:", t);
            return false;
        }
        return true;
    });

    if (validParsedTransactions.length !== normalizedAndValidatedTransactions.length) {
        const skippedCount = normalizedAndValidatedTransactions.length - validParsedTransactions.length;
        toast({
            title: t('upload.toast.recordsMissingDataSkippedTitle'),
            description: t('upload.toast.recordsMissingDataSkippedDescription', { count: skippedCount }),
            variant: "warning",
            duration: 8000
        });
    }

    if (validParsedTransactions.length === 0) {
        setParseError(t('upload.errors.noValidTransactionsAfterNormalization'));
        setIsProcessing(false);
        setUploadProgress(0);
        return;
    }

    const rulesList = await CategoryRule.list();
    const categoriesList = await Category.list(); // Ensure categories are loaded for autoCategorizeTransaction
    const newTransactions = validParsedTransactions.map(t => {
      const { category_id, is_income } = autoCategorizeTransaction(t, rulesList, categoriesList); // Pass categoriesList
      return {
        ...t,
        // date is already YYYY-MM-DD
        category_id: category_id,
        is_income: is_income,
        import_batch: new Date().toISOString() + "_" + (file?.name || 'unknown_file')
      };
    });
    setUploadProgress(40);

    const existingTransactions = await loadExistingTransactionsForDuplicateCheck(newTransactions);
    setUploadProgress(60);

    const duplicates = findDuplicateTransactions(newTransactions, existingTransactions);

    if (duplicates.length > 0) {
      setDuplicateSets(duplicates);
      const duplicateNewTransactionKeys = new Set(
        duplicates.map(ds => `${ds.newTransaction.date}-${ds.newTransaction.business_name}-${ds.newTransaction.billing_amount}`)
      );
      setTransactionsToReview(
        newTransactions.filter(nt =>
            duplicateNewTransactionKeys.has(`${nt.date}-${nt.business_name}-${nt.billing_amount}`)
        )
      );
      setShowDuplicateResolutionDialog(true);
      setIsProcessing(false); // Stop processing here to allow user interaction
    } else {
      // No duplicates found, proceed to save all new transactions
      try {
        if (newTransactions.length > 0) {
          await Transaction.bulkCreate(newTransactions);
          setUploadProgress(100);
          toast({
            title: t('toast.success'), // Standardized title
            description: t('upload.toast.uploadProcessingCompleteDescription', { count: newTransactions.length }), // Kept specific message
          });
          await UploadLog.create({
            filename: file?.name || 'unknown_file',
            upload_date: new Date().toISOString(),
            record_count: newTransactions.length,
            status: "success",
            notes: t('upload.log.noDuplicates')
          });
          loadUploadHistory();
        } else {
          toast({
            title: t('upload.toast.noNewTransactionsToAddTitle'),
            description: t('upload.toast.noNewTransactionsToAddDescription'),
            variant: "info"
          });
        }
      } catch (error) {
        console.error("Error bulk creating transactions in handleFileUpload (no duplicates):", error);
        toast({
          variant: "destructive",
          title: t('toast.error'), // Standardized title
          description: t('upload.toast.addTransactionsErrorDescription'), // Kept specific message
        });
         await UploadLog.create({
            filename: file?.name || 'unknown_file',
            upload_date: new Date().toISOString(),
            record_count: newTransactions.length, // Log attempted count
            status: "failed",
            notes: t('upload.log.bulkAddError', { error: error.message })
          });
      } finally {
        setIsProcessing(false);
        setUploadProgress(0);
        setFile(null); // Reset file input
      }
    }
  };

  const handleResolveDuplicates = async (actions) => {
    setResolvedDuplicates(actions);
    setShowDuplicateResolutionDialog(false);
    await processResolvedTransactions(actions);
  };


  const handleSkipAll = () => {
    const actions = {};
    transactionsToReview.forEach(trans => {
        // Ensure key matches the one used in processResolvedTransactions
        const key = `${format(new Date(trans.date), 'yyyy-MM-dd')}-${trans.business_name}-${trans.billing_amount}`;
        actions[key] = 'skip';
    });
    handleResolveDuplicates(actions);
  };

  const handleAddAll = () => {
    const actions = {};
    transactionsToReview.forEach(trans => {
        const key = `${format(new Date(trans.date), 'yyyy-MM-dd')}-${trans.business_name}-${trans.billing_amount}`;
        actions[key] = 'add';
    });
    handleResolveDuplicates(actions);
  };


  const handleIndividualResolution = (transaction, action) => {
    const key = `${format(new Date(transaction.date), 'yyyy-MM-dd')}-${transaction.business_name}-${transaction.billing_amount}`;
    setResolvedDuplicates(prev => ({ ...prev, [key]: action }));
  };

  const processResolvedTransactions = async (resolvedActions) => {
    setIsProcessing(true);
    setUploadProgress(70);

    let newTransactionsCreatedCount = 0;
    let transactionsUpdatedCount = 0; // Not used in current logic, but kept for potential future use
    let transactionsSkippedCount = 0;

    const transactionsToCreate = [];

    // Iterate over original `transactionsToReview` to decide action for each
    transactionsToReview.forEach(originalNewTrans => {
        // Key must match the one used in handleSkipAll/handleAddAll
        const key = `${format(new Date(originalNewTrans.date), 'yyyy-MM-dd')}-${originalNewTrans.business_name}-${originalNewTrans.billing_amount}`;
        const action = resolvedActions[key] || 'skip'; // Default to skip

        if (action === 'add') {
            transactionsToCreate.push(originalNewTrans);
        } else { // 'skip' or 'merge-id' (currently merge implies skip new)
            transactionsSkippedCount++;
        }
    });

    try {
        if (transactionsToCreate.length > 0) {
            await Transaction.bulkCreate(transactionsToCreate);
            newTransactionsCreatedCount = transactionsToCreate.length;
        }
        setUploadProgress(100);
        toast({
            title: t('toast.success'), // Standardized title
            description: t('upload.toast.duplicateProcessingCompleteDescription', { added: newTransactionsCreatedCount, skipped: transactionsSkippedCount }), // Kept specific message
        });
         await UploadLog.create({
            filename: file.name,
            upload_date: new Date().toISOString(),
            record_count: transactionsToReview.length,
            status: newTransactionsCreatedCount > 0 ? "partial" : "success",
            notes: t('upload.log.duplicatesProcessed', { added: newTransactionsCreatedCount, skipped: transactionsSkippedCount })
          });
        loadUploadHistory(); // Refresh history
    } catch (error) {
        console.error("Error processing resolved transactions:", error);
        toast({
            variant: "destructive",
            title: t('toast.error'), // Standardized title
            description: t('upload.toast.processingTransactionsErrorDescription'), // Kept specific message
        });
        await UploadLog.create({
            filename: file.name,
            upload_date: new Date().toISOString(),
            record_count: transactionsToReview.length,
            status: "failed",
            notes: t('upload.log.duplicatesProcessingError', { error: error.message })
          });
    } finally {
        setIsProcessing(false);
        setUploadProgress(0);
        setShowDuplicateResolutionDialog(false);
        setDuplicateSets([]);
        setTransactionsToReview([]);
        setFile(null);
        // loadTransactions(); // If needed to refresh a list on the page
    }
};


  const loadTransactions = async () => {
    // This function is a placeholder. If this page needs to display a list
    // of all transactions (e.g., for a different view mode not shown),
    // implement the logic to fetch and set transactions here.
    // Example:
    // try {
    //   const allTransactions = await Transaction.list('-date');
    //   // setSomeStateVariable(allTransactions);
    // } catch (error) {
    //   console.error("Error loading all transactions:", error);
    //   toast({ title: "שגיאה בטעינת עסקאות", description: "לא ניתן היה לטעון את רשימת העסקאות המלאה.", variant: "destructive" });
    // }
  };

  const arrayBufferToWorkbook = (arrayBuffer) => {
    // This function is also a placeholder from the original code.
    // If direct XLSX parsing on the client-side is needed (e.g., with a library like SheetJS),
    // implement that here. Otherwise, if server-side extraction is used, this might not be necessary.
  };

  return (
    <div className="space-y-6" dir={isRTL() ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('upload.title')}</h1>
        <Tabs value={viewMode} onValueChange={setViewMode} className="mr-auto">
          <TabsList>
            <TabsTrigger value="upload">{t('navigation.upload')}</TabsTrigger>
            <TabsTrigger value="history">{t('upload.history.title')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {parseError && viewMode === "upload" && (
         <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {viewMode === "upload" ? renderUploadForm() : renderUploadHistory()}

      {showDuplicateResolutionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" dir={isRTL() ? 'rtl' : 'ltr'}>
            <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
                <CardHeader>
                    <CardTitle>{t('upload.duplicates.title')}</CardTitle>
                    <CardDescription>
                        {t('upload.duplicates.description')}
                        {duplicateSets.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                                {t('upload.duplicates.example')} {format(new Date(duplicateSets[0].newTransaction.date), 'dd/MM/yyyy')}, {duplicateSets[0].newTransaction.business_name}, ₪{duplicateSets[0].newTransaction.billing_amount}
                                <br/>
                                {t('upload.duplicates.similarTo')} {format(new Date(duplicateSets[0].existingTransaction.date), 'dd/MM/yyyy')}, {duplicateSets[0].existingTransaction.business_name}, ₪{duplicateSets[0].existingTransaction.billing_amount}
                            </div>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto flex-grow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">{t('upload.duplicates.table.date')}</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">{t('upload.duplicates.table.business')}</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">{t('upload.duplicates.table.amount')}</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">{t('upload.duplicates.table.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactionsToReview.map((transaction, index) => {
                                const key = `${format(new Date(transaction.date), 'yyyy-MM-dd')}-${transaction.business_name}-${transaction.billing_amount}`;
                                const currentResolution = resolvedDuplicates[key] || 'skip'; // Default to skip
                                return (
                                    <tr key={key}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{format(new Date(transaction.date), 'dd/MM/yyyy')}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{transaction.business_name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">₪{transaction.billing_amount.toLocaleString()}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            <Select
                                                value={currentResolution}
                                                onValueChange={(value) => handleIndividualResolution(transaction, value)}
                                            >
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="add">{t('upload.duplicates.actions.add')}</SelectItem>
                                                    <SelectItem value="skip">{t('upload.duplicates.actions.skip')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
                <CardFooter className="flex justify-between gap-2 border-t pt-4">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSkipAll}>{t('upload.duplicates.actions.skipAll')}</Button>
                        <Button variant="outline" onClick={handleAddAll}>{t('upload.duplicates.actions.addAll')}</Button>
                    </div>
                    <Button
                        onClick={() => handleResolveDuplicates(resolvedDuplicates)}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t('upload.duplicates.actions.continue')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
      )}

    </div>
  );
}
