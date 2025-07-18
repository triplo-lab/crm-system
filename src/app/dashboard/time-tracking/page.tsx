"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Play, 
  Pause, 
  Square,
  Clock, 
  Calendar,
  User,
  FolderOpen,
  Loader2,
  Plus,
  Search,
  Filter
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface TimeEntry {
  id: string
  description: string
  project: {
    id: string
    name: string
    client: {
      name: string
    }
  }
  task?: {
    id: string
    title: string
  }
  user: {
    id: string
    name: string
  }
  startTime: string
  endTime?: string
  duration: number // in seconds
  isRunning: boolean
  createdAt: string
}

export default function TimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTimer, setActiveTimer] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchTimeEntries()
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchTimeEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/time-entries')
      if (response.ok) {
        const data = await response.json()
        setTimeEntries(data.entries || [])
        // Find active timer
        const active = data.entries?.find((entry: TimeEntry) => entry.isRunning)
        if (active) {
          setActiveTimer(active.id)
        }
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getRunningDuration = (startTime: string) => {
    const start = new Date(startTime)
    const now = currentTime
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
    return diff
  }

  const startTimer = async (projectId: string, description: string) => {
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, description })
      })
      if (response.ok) {
        fetchTimeEntries()
      }
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }

  const stopTimer = async (entryId: string) => {
    try {
      const response = await fetch(`/api/time-entries/${entryId}/stop`, {
        method: 'PATCH'
      })
      if (response.ok) {
        fetchTimeEntries()
        setActiveTimer(null)
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Controlo de Tempo">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Controlo de Tempo">
      <div className="space-y-6">
        {/* Active Timer */}
        {activeTimer && (
          <Card variant="elevated" className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Clock className="w-5 h-5" />
                Timer Ativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries
                .filter(entry => entry.id === activeTimer)
                .map(entry => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-100">{entry.description}</p>
                      <p className="text-sm text-slate-400">
                        {entry.project.name} - {entry.project.client.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-mono font-bold text-blue-400">
                        {formatDuration(getRunningDuration(entry.startTime))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => stopTimer(entry.id)}
                        className="gap-2"
                      >
                        <Square className="w-4 h-4" />
                        Parar
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Start Timer */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Iniciar Novo Timer</CardTitle>
            <CardDescription>
              Comece a cronometrar o tempo numa tarefa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Descrição da tarefa..."
                className="flex-1"
              />
              <select className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecionar projeto</option>
                {/* Projects would be loaded here */}
              </select>
              <Button className="gap-2" disabled={!!activeTimer}>
                <Play className="w-4 h-4" />
                Iniciar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Time Entries List */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Entradas de Tempo</CardTitle>
                <CardDescription>
                  Histórico de tempo trabalhado
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Pesquisar..."
                  className="w-64"
                />
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeEntries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-slate-100">{entry.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <FolderOpen className="w-4 h-4" />
                        {entry.project.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {entry.user.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(entry.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono font-semibold text-slate-100">
                      {entry.isRunning 
                        ? formatDuration(getRunningDuration(entry.startTime))
                        : formatDuration(entry.duration)
                      }
                    </div>
                    <div className="text-sm text-slate-400">
                      {entry.isRunning ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          Em execução
                        </span>
                      ) : (
                        `${new Date(entry.startTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} - ${entry.endTime ? new Date(entry.endTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''}`
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
