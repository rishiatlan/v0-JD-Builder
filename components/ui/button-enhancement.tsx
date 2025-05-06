import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        atlan: "bg-atlan-primary text-white hover:bg-atlan-primary-dark active:bg-atlan-primary-dark/90",
        "atlan-outline": "border border-atlan-primary text-atlan-primary hover:bg-atlan-primary/10",
        "atlan-ghost": "text-atlan-primary hover:bg-atlan-primary/10",
        "atlan-link": "text-atlan-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-amber-500 text-white hover:bg-amber-600",
      },
      size: {
        xs: "h-7 px-2 rounded-md text-xs",
        sm: "h-8 px-3 rounded-md",
        md: "h-10 py-2 px-4",
        lg: "h-12 px-6 rounded-md text-base",
      },
    },
    defaultVariants: {
      variant: "atlan",
      size: "md",
    },
  },
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

export function EnhancedButton({
  className,
  variant,
  size,
  loading = false,
  icon,
  iconPosition = "left",
  children,
  ...props
}: EnhancedButtonProps) {
  return (
    <Button
      className={cn(buttonVariants({ variant, size, className }), loading && "opacity-80 cursor-wait")}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!loading && icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
      {children}
      {!loading && icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
    </Button>
  )
}
