"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

function CreateLeadForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <DashboardLayout title="Criar Lead">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Criar Novo Lead</h1>
            <p className="text-slate-400">
              Adicionar um novo lead ao sistema
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 rounded-lg p-6">
          <p className="text-slate-400">
            Formulário de criação de lead será implementado aqui.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function CreateLeadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateLeadForm />
    </Suspense>
  )
}
