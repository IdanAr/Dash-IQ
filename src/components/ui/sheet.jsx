import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/components/utils';

const Sheet = ({ children, open, onOpenChange, ...props }) => {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => onOpenChange?.(false)}
        />
      )}
      {children}
    </>
  );
};

const SheetTrigger = ({ children, asChild, ...props }) => {
  if (asChild) {
    return React.cloneElement(children, props);
  }
  return <button {...props}>{children}</button>;
};

const SheetContent = ({ 
  children, 
  side = 'right', 
  className,
  onOpenChange,
  ...props 
}) => {
  // Determine classes based on side
  const sideClasses = {
    top: 'top-0 left-0 right-0',
    right: 'right-0 top-0 bottom-0',
    bottom: 'bottom-0 left-0 right-0',
    left: 'left-0 top-0 bottom-0'
  };

  // Determine width/height based on side
  const sizeClasses = {
    top: 'h-auto',
    right: 'w-auto h-full',
    bottom: 'h-auto',
    left: 'w-auto h-full'
  };

  return (
    <div 
      className={cn(
        'fixed z-50 bg-background shadow-lg overflow-auto p-6',
        sideClasses[side],
        sizeClasses[side],
        className
      )}
      {...props}
    >
      <div className="absolute top-4 right-4">
        <button 
          className="rounded-md p-1 hover:bg-muted" 
          onClick={() => onOpenChange?.(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  );
};

Sheet.displayName = 'Sheet';
SheetTrigger.displayName = 'SheetTrigger';
SheetContent.displayName = 'SheetContent';

export { Sheet, SheetTrigger, SheetContent };
export default { Sheet, SheetTrigger, SheetContent };