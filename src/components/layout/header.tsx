"use client"

import { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { Bell, Search, User, LogOut, Settings, Command, Plus, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const notifications = [
    {
      id: 1,
      title: "Nova tarefa atribuída",
      message: "Desenvolvimento da API REST",
      time: "2 min atrás",
      unread: true
    },
    {
      id: 2,
      title: "Fatura aprovada",
      message: "Fatura #INV-001 foi aprovada",
      time: "1 hora atrás",
      unread: true
    },
    {
      id: 3,
      title: "Reunião agendada",
      message: "Reunião com cliente ABC às 14:00",
      time: "3 horas atrás",
      unread: false
    }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 lg:px-6 py-4 sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex items-center justify-between min-w-0">
        {/* Title and Breadcrumb */}
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          {title && (
            <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-100 truncate">{title}</h1>
              <p className="text-sm text-slate-400 hidden sm:block">
                Bem-vindo de volta, {session?.user?.name?.split(' ')[0]}
              </p>
            </div>
          )}
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
          {/* Quick Actions */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>

          {/* Search */}
          <div className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              placeholder="Pesquisar... (Ctrl+K)"
              className="pl-10 w-64 xl:w-80 h-10 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden xl:block">
              <kbd className="inline-flex items-center rounded border border-slate-700 px-2 py-1 text-xs text-slate-400">
                <Command className="w-3 h-3 mr-1" />
                K
              </kbd>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-strong z-50 animate-scale-in">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notificações</h3>
                  <p className="text-sm text-muted-foreground">{unreadCount} não lidas</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border last:border-b-0 hover:bg-background-secondary transition-colors cursor-pointer ${
                        notification.unread ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full text-sm">
                    Ver todas as notificações
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-background-secondary transition-all duration-200"
            >
              <Avatar className="w-9 h-9">
                {session?.user?.avatar ? (
                  <AvatarImage
                    src={session.user.avatar}
                    alt={session.user.name || "User"}
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground text-sm font-semibold">
                    {getInitials(session?.user?.name || "User")}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-left hidden md:block">
                <div className="text-sm font-semibold text-foreground">{session?.user?.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{session?.user?.role?.toLowerCase()}</div>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-strong z-50 animate-scale-in">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-primary-foreground text-sm font-semibold">
                      {getInitials(session?.user?.name || "User")}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{session?.user?.name}</p>
                      <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm hover:bg-background-secondary transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Perfil</span>
                  </button>
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm hover:bg-background-secondary transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Definições</span>
                  </button>
                  <hr className="my-2 border-border" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-destructive hover:bg-background-secondary transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Terminar Sessão</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
