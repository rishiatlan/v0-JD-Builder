import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface SharpnessScoreProps {
  score: number
  showValue?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function SharpnessScore({ score, showValue = true, size = "md", className }: SharpnessScoreProps) {
  const fullStars = Math.floor(score)
  const halfStar = score % 1 >= 0.5
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={cn("fill-yellow-400 text-yellow-400", sizeClasses[size])} />
        ))}

        {halfStar && (
          <div className="relative">
            <Star className={cn("text-slate-300", sizeClasses[size])} />
            <div className="absolute inset-0 overflow-hidden w-[50%]">
              <Star className={cn("fill-yellow-400 text-yellow-400", sizeClasses[size])} />
            </div>
          </div>
        )}

        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={cn("text-slate-300", sizeClasses[size])} />
        ))}
      </div>

      {showValue && (
        <span className={cn("ml-2 font-medium", size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base")}>
          {score.toFixed(1)}
        </span>
      )}
    </div>
  )
}
