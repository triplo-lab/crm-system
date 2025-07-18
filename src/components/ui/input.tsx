import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string
  label?: string
  icon?: React.ReactNode
  size?: "sm" | "md" | "lg"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, icon, size = "md", id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="form-label block"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              // Base styles
              "flex w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 form-input",

              // Size variants
              {
                "h-10 px-3 py-2 text-sm": size === "sm",
                "h-12 px-4 py-3": size === "md",
                "h-14 px-5 py-4 text-lg": size === "lg",
              },

              // Icon padding
              icon && {
                "pl-10": size === "sm",
                "pl-12": size === "md",
                "pl-14": size === "lg",
              },

              // Error state
              error && "border-red-500 focus:ring-red-500",

              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
