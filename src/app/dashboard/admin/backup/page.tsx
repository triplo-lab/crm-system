"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  HardDrive,
  FileText,
  Trash2,
  ArrowLeft,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface BackupFile {
  name: string
  size: number
  created: string
  type?: 'manual' | 'automatic'
}

interface BackupStats {
  totalBackups: number
  totalSize: number
  lastBackup: string
  databaseSize: number
}

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([])
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  useEffect(() => {
    fetchBackupData()
  }, [])

  const fetchBackupData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/backup')

      if (response.ok) {
        const data = await response.json()
        setBackupFiles(data.backups || [])

        // Calculate stats from backup files
        const stats = {
          totalBackups: data.backups?.length || 0,
          totalSize: data.backups?.reduce((sum: number, backup: any) => sum + backup.size, 0) || 0,
          lastBackup: data.backups?.[0]?.created || null
        }
        setBackupStats(stats)
      }
    } catch (error) {
      console.error('Error fetching backup data:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar dados de backup' })
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    try {
      setIsCreatingBackup(true)
      setMessage(null)

      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({ type: 'success', text: `Backup criado com sucesso: ${result.backup.name}` })
        fetchBackupData() // Refresh the list
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao criar backup' })
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      setMessage({ type: 'error', text: 'Erro ao criar backup' })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const downloadBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/admin/backup/download?file=${encodeURIComponent(filename)}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage({ type: 'success', text: 'Download iniciado' })
      } else {
        setMessage({ type: 'error', text: 'Erro ao fazer download do backup' })
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
      setMessage({ type: 'error', text: 'Erro ao fazer download do backup' })
    }
  }

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Tem certeza que deseja eliminar o backup "${filename}"?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/backup/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Backup eliminado com sucesso' })
        fetchBackupData() // Refresh the list
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao eliminar backup' })
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      setMessage({ type: 'error', text: 'Erro ao eliminar backup' })
    }
  }

  const restoreBackup = async (filename: string) => {
    if (!confirm(`ATENÇÃO: Restaurar o backup "${filename}" irá substituir todos os dados atuais. Esta ação não pode ser desfeita. Tem certeza?`)) {
      return
    }

    try {
      setIsRestoring(true)
      setMessage({ type: 'info', text: 'Iniciando restauro... Isto pode demorar alguns minutos.' })

      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Backup restaurado com sucesso! A página será recarregada.' })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao restaurar backup' })
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      setMessage({ type: 'error', text: 'Erro ao restaurar backup' })
    } finally {
      setIsRestoring(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getBackupTypeColor = (type: string) => {
    return type === 'manual' 
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-green-500/10 text-green-400 border-green-500/20'
  }

  const getBackupTypeText = (type: string) => {
    return type === 'manual' ? 'Manual' : 'Automático'
  }

  if (loading) {
    return (
      <DashboardLayout title="Backup e Restauro">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Backup e Restauro">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Backup e Restauro</h1>
            <p className="text-slate-400">
              Gerir backups da base de dados e restaurar dados
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
            message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {message.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {message.type === 'info' && <Clock className="w-5 h-5" />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        {backupStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Total de Backups</p>
                    <p className="text-2xl font-bold text-slate-100">{backupStats.totalBackups}</p>
                  </div>
                  <Database className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Tamanho Total</p>
                    <p className="text-2xl font-bold text-slate-100">{formatFileSize(backupStats.totalSize)}</p>
                  </div>
                  <HardDrive className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Último Backup</p>
                    <p className="text-lg font-bold text-slate-100">
                      {backupStats.lastBackup ? formatDate(backupStats.lastBackup) : 'Nunca'}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Base de Dados</p>
                    <p className="text-lg font-bold text-slate-100">{formatFileSize(backupStats.databaseSize)}</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Ações de Backup
            </CardTitle>
            <CardDescription>
              Criar novos backups ou restaurar dados existentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={createBackup}
                disabled={isCreatingBackup || isRestoring}
                className="h-auto flex-col gap-3 p-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isCreatingBackup ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Download className="w-6 h-6" />
                )}
                <span className="text-sm font-semibold">
                  {isCreatingBackup ? 'Criando...' : 'Criar Backup Manual'}
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={fetchBackupData}
                disabled={isCreatingBackup || isRestoring}
                className="h-auto flex-col gap-3 p-6 hover:scale-105 transition-all duration-200"
              >
                <RefreshCw className="w-6 h-6 text-green-400" />
                <span className="text-sm font-semibold">Atualizar Lista</span>
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".db,.sqlite,.sql"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Handle file upload for restore
                      console.log('File selected for restore:', file.name)
                      setMessage({ type: 'info', text: 'Funcionalidade de upload em desenvolvimento' })
                    }
                  }}
                />
                <Button
                  variant="outline"
                  disabled={isCreatingBackup || isRestoring}
                  className="w-full h-auto flex-col gap-3 p-6 hover:scale-105 transition-all duration-200"
                >
                  <Upload className="w-6 h-6 text-orange-400" />
                  <span className="text-sm font-semibold">Upload Backup</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Files List */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-400" />
              Backups Disponíveis
            </CardTitle>
            <CardDescription>
              Lista de todos os backups criados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backupFiles.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum backup encontrado</p>
                <p className="text-sm text-slate-500 mt-2">
                  Crie o seu primeiro backup usando o botão acima
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {backupFiles.map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-100">{backup.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{formatDate(backup.created)}</span>
                          <span>{formatFileSize(backup.size)}</span>
                          <span className={`px-2 py-1 rounded-full border text-xs ${getBackupTypeColor(backup.type || 'manual')}`}>
                            {getBackupTypeText(backup.type || 'manual')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadBackup(backup.name)}
                        disabled={isCreatingBackup || isRestoring}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreBackup(backup.name)}
                        disabled={isCreatingBackup || isRestoring}
                        className="gap-2 text-orange-400 hover:text-orange-300"
                      >
                        {isRestoring ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Restaurar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBackup(backup.name)}
                        disabled={isCreatingBackup || isRestoring}
                        className="gap-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warning */}
        <Card variant="elevated" className="border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-yellow-400 mb-2">Aviso Importante</h4>
                <div className="text-sm text-slate-300 space-y-2">
                  <p>• <strong>Backups manuais:</strong> Criados sob demanda e contêm todos os dados atuais</p>
                  <p>• <strong>Restaurar backup:</strong> Substitui TODOS os dados atuais - esta ação não pode ser desfeita</p>
                  <p>• <strong>Recomendação:</strong> Crie sempre um backup antes de restaurar outro</p>
                  <p>• <strong>Armazenamento:</strong> Backups são guardados localmente no servidor</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
