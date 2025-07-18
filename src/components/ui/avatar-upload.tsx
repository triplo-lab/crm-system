"use client"

import { useState, useRef } from "react"
import { UserAvatar } from "./avatar"
import { Button } from "./button"
import { toast } from "sonner"
import { Upload, X, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  user?: {
    id?: string
    name?: string
    email?: string
    avatar?: string | null
  }
  onAvatarUpdate?: (avatarUrl: string | null) => void
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
  showUploadButton?: boolean
}

export function AvatarUpload({
  user,
  onAvatarUpdate,
  size = "xl",
  className,
  showUploadButton = true
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState(user?.avatar)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado. Use JPEG, PNG ou WebP")
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 5MB")
      return
    }

    await uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      setCurrentAvatar(data.avatarUrl)
      onAvatarUpdate?.(data.avatarUrl)
      toast.success("Avatar atualizado com sucesso!")

    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error(error instanceof Error ? error.message : "Erro ao fazer upload do avatar")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAvatar = async () => {
    setIsUploading(true)
    
    try {
      const response = await fetch('/api/users/avatar', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover avatar')
      }

      setCurrentAvatar(null)
      onAvatarUpdate?.(null)
      toast.success("Avatar removido com sucesso!")

    } catch (error) {
      console.error('Erro ao remover avatar:', error)
      toast.error(error instanceof Error ? error.message : "Erro ao remover avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Avatar Display */}
      <div className="relative group">
        <UserAvatar
          user={{
            ...user,
            avatar: currentAvatar
          }}
          size={size}
          className="transition-all duration-200 group-hover:opacity-80"
        />
        
        {/* Hover Overlay */}
        <div 
          className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
          onClick={triggerFileInput}
        >
          <Camera className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Upload Controls */}
      {showUploadButton && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? "Enviando..." : "Alterar Avatar"}
          </Button>
          
          {currentAvatar && (
            <Button
              variant="outline"
              size="sm"
              onClick={removeAvatar}
              disabled={isUploading}
              className="flex items-center gap-2 text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
              Remover
            </Button>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

// Compact version for inline use
interface CompactAvatarUploadProps {
  user?: {
    id?: string
    name?: string
    email?: string
    avatar?: string | null
  }
  onAvatarUpdate?: (avatarUrl: string | null) => void
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
}

export function CompactAvatarUpload({
  user,
  onAvatarUpdate,
  size = "md"
}: CompactAvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState(user?.avatar)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      setCurrentAvatar(data.avatarUrl)
      onAvatarUpdate?.(data.avatarUrl)
      toast.success("Avatar atualizado!")

    } catch (error) {
      toast.error("Erro ao atualizar avatar")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="relative group">
      <UserAvatar
        user={{
          ...user,
          avatar: currentAvatar
        }}
        size={size}
        className="transition-all duration-200 group-hover:opacity-80 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      />
      
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
