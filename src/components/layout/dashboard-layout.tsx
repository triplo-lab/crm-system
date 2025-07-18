"use client"

import { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { useActivityLogger } from "@/hooks/useActivityLogger"

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  // Initialize activity logging
  useActivityLogger()

  return (
    <div className="min-h-screen bg-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header title={title} />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  )
}
