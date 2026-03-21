'use client'

import { useState, useEffect, useRef } from 'react'
import { Tag, Plus, Check, X } from 'lucide-react'

interface Label {
  id: string
  name: string
  color: string
  count?: number
}

interface TagSelectorProps {
  value: string
  onChange: (tag: string) => void
  placeholder?: string
  showCount?: boolean
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#EC4899', // pink
]

export function TagSelector({ value, onChange, placeholder = 'Seleccionar etiqueta...', showCount = false }: TagSelectorProps) {
  const [labels, setLabels] = useState<Label[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const fetchLabels = async () => {
    const res = await fetch('/api/labels')
    const data = await res.json()
    if (data.labels) setLabels(data.labels)
  }

  useEffect(() => {
    fetchLabels()
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
        setIsCreating(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (name: string) => {
    onChange(name)
    setIsOpen(false)
    setIsCreating(false)
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setIsSaving(true)
    setError(null)
    const res = await fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor })
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
    } else {
      setLabels(prev => [...prev, data.label].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(data.label.name)
      setNewName('')
      setIsCreating(false)
      setIsOpen(false)
    }
    setIsSaving(false)
  }

  const selected = labels.find(l => l.name === value)

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setIsOpen(o => !o); setIsCreating(false) }}
        className="w-full flex items-center gap-2 h-10 border border-slate-200 rounded-md px-3 text-sm bg-white text-left hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        {selected ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />
            <span className="flex-1 font-medium text-slate-800">{selected.name}</span>
            {showCount && selected.count !== undefined && (
              <span className="text-xs text-slate-400">{selected.count} contactos</span>
            )}
            <X
              className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 shrink-0"
              onClick={e => { e.stopPropagation(); onChange('') }}
            />
          </>
        ) : (
          <>
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 flex-1">{placeholder}</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {labels.length === 0 && !isCreating && (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">
                No hay etiquetas. Crea la primera.
              </div>
            )}
            {labels.map(label => (
              <button
                key={label.id}
                type="button"
                onClick={() => handleSelect(label.name)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                <span className="flex-1 font-medium text-slate-800">{label.name}</span>
                {showCount && label.count !== undefined && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{label.count}</span>
                )}
                {value === label.name && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100">
            {isCreating ? (
              <div className="p-3 space-y-2">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Nombre de la etiqueta"
                  className="w-full h-8 border border-slate-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-1.5">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isSaving || !newName.trim()}
                    className="flex-1 h-8 bg-blue-600 text-white text-sm rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsCreating(false); setError(null) }}
                    className="h-8 px-3 text-sm border border-slate-200 rounded-md hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Crear nueva etiqueta
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
