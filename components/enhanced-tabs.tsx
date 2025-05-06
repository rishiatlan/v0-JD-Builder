"use client"

import { cn } from "@/lib/utils"

interface EnhancedTabsProps {
  tabs: {
    id: string
    label: string
    badge?: {
      value: string | number
      color?: "green" | "blue" | "amber" | "purple"
    }
  }[]
  activeTab: string
  onChange: (tabId: string) => void
  fullWidth?: boolean
  variant?: "pills" | "underline" | "contained"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function EnhancedTabs({
  tabs,
  activeTab,
  onChange,
  fullWidth = true,
  variant = "pills",
  size = "md",
  className,
}: EnhancedTabsProps) {
  const variantClasses = {
    pills: {
      container: "bg-slate-100 p-1 rounded-lg",
      tab: "rounded-md",
      active: "bg-white shadow-sm text-atlan-primary",
      inactive: "text-slate-600 hover:text-slate-900 hover:bg-white/50",
    },
    underline: {
      container: "border-b border-slate-200",
      tab: "border-b-2 border-transparent -mb-px",
      active: "border-atlan-primary text-atlan-primary",
      inactive: "text-slate-600 hover:text-slate-900 hover:border-slate-300",
    },
    contained: {
      container: "border border-slate-200 rounded-lg overflow-hidden",
      tab: "border-r border-slate-200 last:border-r-0",
      active: "bg-atlan-primary text-white",
      inactive: "bg-white text-slate-600 hover:bg-slate-50",
    },
  }

  const sizeClasses = {
    sm: "text-xs py-1.5 px-2.5",
    md: "text-sm py-2 px-3",
    lg: "text-base py-2.5 px-4",
  }

  const badgeColors = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    amber: "bg-amber-100 text-amber-800",
    purple: "bg-purple-100 text-purple-800",
  }

  return (
    <div className={cn("flex", fullWidth ? "w-full" : "w-fit", variantClasses[variant].container, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "font-medium transition-all duration-200 flex items-center justify-center",
            sizeClasses[size],
            variantClasses[variant].tab,
            fullWidth && "flex-1",
            activeTab === tab.id ? variantClasses[variant].active : variantClasses[variant].inactive,
          )}
        >
          {tab.label}
          {tab.badge && (
            <span className={cn("ml-2 text-xs px-1.5 py-0.5 rounded-full", badgeColors[tab.badge.color || "green"])}>
              {tab.badge.value}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
