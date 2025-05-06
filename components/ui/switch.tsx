"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  // Use a local ref to prevent excessive re-renders
  const innerRef = React.useRef<React.ElementRef<typeof SwitchPrimitives.Root>>(null)
  const combinedRef = React.useMemo(
    () => (node: React.ElementRef<typeof SwitchPrimitives.Root>) => {
      innerRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  // Memoize the onCheckedChange handler to prevent infinite loops
  const onCheckedChange = React.useCallback(
    (checked: boolean) => {
      if (props.onCheckedChange) {
        props.onCheckedChange(checked)
      }
    },
    [props.onCheckedChange],
  )

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-atlan-primary data-[state=unchecked]:bg-input",
        className,
      )}
      {...props}
      ref={combinedRef}
      onCheckedChange={onCheckedChange}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
