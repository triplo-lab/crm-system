"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Clock,
  HeadphonesIcon,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  DollarSign,
  Zap,
  TrendingUp,
  FileText,
  Activity,
  User
} from "lucide-react"
import { UserAvatar } from "@/components/ui/avatar"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-blue-400",
  },
  {
    name: "Projetos",
    href: "/dashboard/projects",
    icon: FolderOpen,
    color: "text-purple-400",
  },
  {
    name: "Clientes",
    href: "/dashboard/clients",
    icon: Users,
    color: "text-green-400",
  },
  {
    name: "Leads",
    href: "/dashboard/leads",
    icon: UserPlus,
    color: "text-orange-400",
  },
  {
    name: "Propostas",
    href: "/dashboard/proposals",
    icon: FileText,
    color: "text-cyan-400",
  },
  {
    name: "Faturação",
    href: "/dashboard/invoices",
    icon: DollarSign,
    color: "text-yellow-400",
  },
  {
    name: "Tempo",
    href: "/dashboard/time-tracking",
    icon: Clock,
    color: "text-pink-400",
  },
  {
    name: "Suporte",
    href: "/dashboard/tickets",
    icon: HeadphonesIcon,
    color: "text-red-400",
  },
  {
    name: "Base Conhecimento",
    href: "/dashboard/knowledge-base",
    icon: BookOpen,
    color: "text-indigo-400",
  },
  {
    name: "Monitorização",
    href: "/dashboard/monitoring",
    icon: Activity,
    color: "text-green-400",
  },
  {
    name: "Administração",
    href: "/dashboard/admin",
    icon: Settings,
    color: "text-gray-400",
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div
      className={cn(
        "flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-300 relative",
        collapsed ? "w-20" : "w-72",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-100">CRM System</h1>
              <p className="text-xs text-slate-400">Professional Edition</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg mx-auto">
            <Zap className="w-6 h-6 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-slate-700 transition-all duration-200 text-slate-400 hover:text-slate-100"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl nav-link transition-all duration-200 relative overflow-hidden",
                isActive
                  ? "bg-blue-600 text-white shadow-lg nav-link-active"
                  : "text-slate-300 hover:bg-slate-700 hover:text-slate-100",
                collapsed && "justify-center px-3"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-all duration-200",
                  isActive ? "text-white" : item.color,
                  "group-hover:scale-110"
                )}
              />
              {!collapsed && (
                <span className="transition-all duration-200">{item.name}</span>
              )}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent rounded-xl" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Stats Section */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-900 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-overline">Performance</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-caption">Projetos Ativos</span>
                <span className="text-caption font-semibold text-slate-100">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-caption">Tarefas Pendentes</span>
                <span className="text-caption font-semibold text-slate-100">8</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Section */}
      {session?.user && (
        <div className="p-4 border-t border-slate-700">
          <Link
            href="/dashboard/profile"
            className={cn(
              "group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-slate-700",
              pathname === "/dashboard/profile" && "bg-slate-700"
            )}
          >
            <UserAvatar
              user={{
                id: session.user.id,
                name: session.user.name || "",
                email: session.user.email || "",
                avatar: session.user.image
              }}
              size="sm"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-100 truncate">
                  {session.user.name || "Utilizador"}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {session.user.email}
                </div>
              </div>
            )}
            {!collapsed && (
              <User className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
            )}
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        {!collapsed ? (
          <div className="text-xs text-slate-400 text-center">
            © 2024 CRM System v2.0
          </div>
        ) : (
          <div className="w-2 h-2 bg-green-400 rounded-full mx-auto" title="Sistema Online" />
        )}
      </div>
    </div>
  )
}
