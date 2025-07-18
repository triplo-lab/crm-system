'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface KanbanColumn {
  id: string
  columnId: string
  title: string
  color: string
  order: number
  isVisible: boolean
  boardType: string
}

interface SimpleColumnEditorProps {
  column: KanbanColumn
  onUpdate: (updatedColumn: KanbanColumn) => void
}

const colorOptions = [
  { value: 'bg-blue-500', label: 'Azul', preview: '#3b82f6' },
  { value: 'bg-green-500', label: 'Verde', preview: '#10b981' },
  { value: 'bg-yellow-500', label: 'Amarelo', preview: '#f59e0b' },
  { value: 'bg-red-500', label: 'Vermelho', preview: '#ef4444' },
  { value: 'bg-purple-500', label: 'Roxo', preview: '#8b5cf6' },
  { value: 'bg-orange-500', label: 'Laranja', preview: '#f97316' },
  { value: 'bg-emerald-500', label: 'Esmeralda', preview: '#10b981' },
  { value: 'bg-pink-500', label: 'Rosa', preview: '#ec4899' },
  { value: 'bg-indigo-500', label: 'Índigo', preview: '#6366f1' },
  { value: 'bg-teal-500', label: 'Azul-esverdeado', preview: '#14b8a6' },
]

export function SimpleColumnEditor({ column, onUpdate }: SimpleColumnEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(column.title)
  const [color, setColor] = useState(column.color)

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('O título é obrigatório')
      return
    }

    const updatedColumn = {
      ...column,
      title: title.trim(),
      color
    }

    onUpdate(updatedColumn)
    setIsOpen(false)
    toast.success('Coluna atualizada com sucesso!')
  }

  const handleCancel = () => {
    setTitle(column.title)
    setColor(column.color)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button 
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-700"
        onClick={() => setIsOpen(true)}
        title="Editar coluna"
      >
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Coluna</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título da Coluna
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da coluna"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  className={`w-8 h-8 rounded border-2 ${
                    color === option.value ? 'border-gray-900' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: option.preview }}
                  onClick={() => setColor(option.value)}
                  title={option.label}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pré-visualização
            </label>
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="font-medium text-sm text-gray-900">
                  {title || 'Título da coluna'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
