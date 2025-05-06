import { cn } from "@/lib/utils"

interface RefinementProgressProps {
  progress: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function RefinementProgress({ progress, size = "md", showLabel = true, className }: RefinementProgressProps) {
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <div className="flex justify-between w-full">
            <span className="text-xs font-medium text-slate-600">Refinement Progress</span>
            <span className="text-xs font-medium text-slate-700">{progress}%</span>
          </div>
        )}
      </div>
      <div className={cn("w-full bg-slate-200 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className="bg-gradient-to-r from-atlan-primary to-cyan-400 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}
