import React from 'react';
import { Navigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    // Wait a bit before redirect to allow the app to initialize
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    // Set up a timeout for error case
    const errorTimer = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 8000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(errorTimer);
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" dir="rtl">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h1 className="text-xl font-semibold mb-2">טוען את האפליקציה</h1>
        <p className="text-muted-foreground">אנא המתן...</p>
      </div>
    );
  }
  
  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">אירעה שגיאה בטעינת האפליקציה</h1>
          <p className="mb-6">לא הצלחנו לטעון את האפליקציה. אנא נסה לרענן את הדף, או לחזור מאוחר יותר.</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            onClick={() => window.location.reload()}
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }
  
  return <Navigate to={createPageUrl("Dashboard")} replace />;
}