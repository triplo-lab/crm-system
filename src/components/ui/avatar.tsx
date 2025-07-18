import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = "Avatar"

interface AvatarImageProps {
  src?: string | null
  alt: string
  className?: string
  fallback?: string
}

const AvatarImage = React.forwardRef<
  HTMLDivElement,
  AvatarImageProps
>(({ className, src, alt, fallback }, ref) => {
  // Don't render if src is empty, null, or undefined
  if (!src || src.trim() === '') {
    return null
  }

  return (
    <div ref={ref} className="relative w-full h-full">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 40px, 40px"
        className={cn("aspect-square object-cover rounded-full", className)}
        onError={(e) => {
          if (fallback) {
            (e.target as HTMLImageElement).src = fallback
          }
        }}
      />
    </div>
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }

// Enhanced Avatar component with user data
interface UserAvatarProps {
  user?: {
    id?: string
    name?: string
    email?: string
    avatar?: string | null
  }
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  showName?: boolean
  showEmail?: boolean
  className?: string
  fallbackClassName?: string
  onClick?: () => void
}

const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-20 w-20 text-xl"
}

const textSizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
  "2xl": "text-xl"
}

export function UserAvatar({
  user,
  size = "md",
  showName = false,
  showEmail = false,
  className,
  fallbackClassName,
  onClick
}: UserAvatarProps) {
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const names = name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  const getAvatarColor = (name?: string, email?: string) => {
    const str = name || email || "user"
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-sky-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-violet-500",
      "bg-purple-500",
      "bg-fuchsia-500",
      "bg-pink-500",
      "bg-rose-500"
    ]

    return colors[Math.abs(hash) % colors.length]
  }

  const initials = getInitials(user?.name, user?.email)
  const colorClass = getAvatarColor(user?.name, user?.email)

  if (showName || showEmail) {
    return (
      <div
        className={cn("flex items-center gap-3", onClick && "cursor-pointer")}
        onClick={onClick}
      >
        <Avatar className={cn(sizeClasses[size], className)}>
          {user?.avatar ? (
            <AvatarImage
              src={user.avatar}
              alt={user.name || user.email || "User"}
            />
          ) : (
            <AvatarFallback
              className={cn(
                colorClass,
                "text-white font-medium",
                textSizeClasses[size],
                fallbackClassName
              )}
            >
              {initials}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex flex-col min-w-0">
          {showName && user?.name && (
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user.name}
            </span>
          )}
          {showEmail && user?.email && (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <Avatar
      className={cn(sizeClasses[size], onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      {user?.avatar ? (
        <AvatarImage
          src={user.avatar}
          alt={user?.name || user?.email || "User"}
        />
      ) : (
        <AvatarFallback
          className={cn(
            colorClass,
            "text-white font-medium",
            textSizeClasses[size],
            fallbackClassName
          )}
        >
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  )
}

// Simple Avatar with just initials (for when no user data available)
interface SimpleAvatarProps {
  name?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
}

export function SimpleAvatar({ name = "User", size = "md", className }: SimpleAvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const getAvatarColor = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-sky-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-violet-500",
      "bg-purple-500",
      "bg-fuchsia-500",
      "bg-pink-500",
      "bg-rose-500"
    ]

    return colors[Math.abs(hash) % colors.length]
  }

  const colorClass = getAvatarColor(name)

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback
        className={cn(
          colorClass,
          "text-white font-medium",
          textSizeClasses[size]
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
