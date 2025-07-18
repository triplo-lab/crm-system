import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, icon, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2 rounded-lg btn-text font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed",

          // Variant styles
          {
            "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl": variant === "primary",
            "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700": variant === "secondary",
            "border-2 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100": variant === "outline",
            "bg-transparent hover:bg-slate-800 text-slate-100": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
          },

          // Size styles
          {
            "h-9 px-3 btn-text-sm": size === "sm",
            "h-12 px-6 btn-text": size === "md",
            "h-14 px-8 btn-text-lg": size === "lg",
          },

          className
        )}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {!loading && icon && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        {children && (
          <span className={cn(loading && "opacity-70")}>{children}</span>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
