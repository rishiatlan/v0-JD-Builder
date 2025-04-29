interface AtlanLogoProps {
  variant?: "default" | "white"
  className?: string
}

export function AtlanLogo({ variant = "default", className = "" }: AtlanLogoProps) {
  const fillColor = variant === "white" ? "#FFFFFF" : "#00A2B8"

  return (
    <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 10L30 30H10L20 10Z" fill={fillColor} />
      <path d="M40 15H80V25H40V15Z" fill={fillColor} />
      <path
        d="M90 10C95.523 10 100 14.477 100 20C100 25.523 95.523 30 90 30C84.477 30 80 25.523 80 20C80 14.477 84.477 10 90 10Z"
        fill={fillColor}
      />
    </svg>
  )
}
