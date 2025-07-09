import * as React from "react"
import { cn } from "@/components/utils"

const DropdownMenu = React.forwardRef(({ children, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <div ref={ref} {...props}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { open, setOpen })
      )}
    </div>
  );
});
DropdownMenu.displayName = "DropdownMenu";

const DropdownMenuTrigger = React.forwardRef(({ children, className, asChild = false, open, setOpen, ...props }, ref) => {
  const Comp = asChild ? React.cloneElement(children, props) : <button {...props}>{children}</button>;
  
  return React.cloneElement(Comp, {
    ref,
    onClick: () => setOpen(!open),
    className: cn("focus:outline-none", className),
  });
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef(({ children, className, align = "center", open, setOpen, ...props }, ref) => {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={() => setOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          "absolute z-50 min-w-[8rem] rounded-md border bg-popover p-1 shadow-md",
          "animate-in fade-in-0 zoom-in-95",
          align === "end" ? "left-0" : align === "start" ? "right-0" : "left-1/2 -translate-x-1/2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      className
    )}
    {...props}
  >
    {children}
  </button>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, onCheckedChange, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      className
    )}
    onClick={() => onCheckedChange?.(!checked)}
    {...props}
  >
    <div className="flex items-center space-x-2">
      <div className={cn(
        "h-4 w-4 border rounded-sm flex items-center justify-center",
        checked ? "bg-primary border-primary" : "border-gray-300"
      )}>
        {checked && (
          <svg className="h-3 w-3 text-white fill-current" viewBox="0 0 20 20">
            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
          </svg>
        )}
      </div>
      <span>{children}</span>
    </div>
  </button>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-px my-1 bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuLabel = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-gray-700", className)}
    {...props}
  >
    {children}
  </div>
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuGroup = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  >
    {children}
  </div>
));
DropdownMenuGroup.displayName = "DropdownMenuGroup";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
};

export default DropdownMenu;