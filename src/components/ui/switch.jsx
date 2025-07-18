import * as React from "react"
import { cn } from "@/components/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className)}
      {...props}
      role="switch"
      ref={ref}
      data-state={props.checked ? "checked" : "unchecked"}
      aria-checked={props.checked}
      onClick={() => props.onCheckedChange?.(!props.checked)}
    >
      <div
        className={cn("pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0", props.checked ? "translate-x-5" : "translate-x-0")}
      />
    </div>
  )
})
Switch.displayName = "Switch"

export { Switch }

// Add default export
export default Switch;