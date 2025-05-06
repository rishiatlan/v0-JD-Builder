import { cn } from "@/lib/utils"
import type React from "react"

interface CardEnhancementProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean
  bordered?: boolean
  hoverable?: boolean
  children: React.ReactNode
}

export function CardEnhancement({
  className,
  gradient = false,
  bordered = false,
  hoverable = false,
  children,
  ...props
}: CardEnhancementProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-white shadow-sm transition-all duration-200",
        gradient && "bg-gradient-to-br from-white to-slate-50",
        bordered && "border border-slate-200",
        hoverable && "hover:shadow-md hover:translate-y-[-2px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
