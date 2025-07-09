import * as React from "react"
import { cn } from "@/components/utils"

const TabsContext = React.createContext({})

const Tabs = React.forwardRef(({ 
  defaultValue, 
  value, 
  onValueChange, 
  orientation = "horizontal",
  className,
  children,
  ...props 
}, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const isControlled = value !== undefined
  const tabValue = isControlled ? value : internalValue

  const handleValueChange = React.useCallback((newValue) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }, [isControlled, onValueChange])

  const contextValue = React.useMemo(() => ({
    value: tabValue,
    onValueChange: handleValueChange,
    orientation
  }), [tabValue, handleValueChange, orientation])

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={cn("w-full", className)}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef(({ className, ...props }, ref) => {
  const { orientation } = React.useContext(TabsContext)
  
  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500",
        orientation === "vertical" && "flex-col h-auto w-10",
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ 
  className, 
  value: triggerValue, 
  disabled,
  children,
  ...props 
}, ref) => {
  const { value, onValueChange } = React.useContext(TabsContext)
  const isSelected = value === triggerValue

  const handleClick = () => {
    if (!disabled && triggerValue) {
      onValueChange(triggerValue)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }

  return (
    <button
      ref={ref}
      role="tab"
      type="button"
      aria-selected={isSelected}
      aria-controls={`panel-${triggerValue}`}
      data-state={isSelected ? "active" : "inactive"}
      data-disabled={disabled ? "" : undefined}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected 
          ? "bg-white text-gray-950 shadow-sm" 
          : "text-gray-500 hover:text-gray-900",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ 
  className, 
  value: contentValue,
  forceMount,
  children,
  ...props 
}, ref) => {
  const { value } = React.useContext(TabsContext)
  const isSelected = value === contentValue

  if (!forceMount && !isSelected) {
    return null
  }

  return (
    <div
      ref={ref}
      role="tabpanel"
      data-state={isSelected ? "active" : "inactive"}
      data-orientation="horizontal"
      id={`panel-${contentValue}`}
      aria-labelledby={`trigger-${contentValue}`}
      hidden={!isSelected}
      className={cn(
        "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2",
        className
      )}
      tabIndex={0}
      {...props}
    >
      {isSelected && children}
    </div>
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }