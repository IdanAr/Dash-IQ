import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  return (
    <div 
      ref={ref}
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border cursor-pointer select-none",
        checked ? "bg-primary border-primary" : "border-gray-300",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      {checked && (
        <div className="flex items-center justify-center h-full">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
export default Checkbox;