'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, Search, Upload, Tag } from 'lucide-react'
import { createContact, deleteContact, updateContactLabels } from '../actions'
import { ImportCsvModal } from './import-csv-modal'
import { TagSelector } from '@/components/tag-selector'

type Contact = {
  id: string
  name: string
  phone: string
  company: string
  city: string
  email: string
  tags?: string[]
}

interface Props {
  initialContacts: Contact[]
  /** Map of label name → color from the labels table (server-side, source of truth) */
  knownLabels: Record<string, string>
}

export function ContactsClient({ initialContacts, knownLabels }: Props) {
  const [contacts, setContacts] = useState(initialContacts)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Tag filter and new contact tag
  const [tagFilter, setTagFilter] = useState('')
  const [newContactTag, setNewContactTag] = useState('')

  // Per-row label editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [isSavingLabel, setIsSavingLabel] = useState(false)

  // For a contact, only return tags that are known labels (ignore auto-tags)
  const getKnownTags = (c: Contact) =>
    (c.tags || []).filter(t => knownLabels[t] !== undefined)

  const filtered = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    const matchesTag = !tagFilter || getKnownTags(c).includes(tagFilter)
    return matchesSearch && matchesTag
  })

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    if (newContactTag) formData.set('tags', newContactTag)
    const res = await createContact(formData)
    
    if (res?.error) {
      alert(res.error)
      setIsLoading(false)
    } else {
      setIsOpen(false)
      setNewContactTag('')
      window.location.reload()
    }
  }

  const handleDelete = async (id: string) => {
    if(confirm('¿Seguro que deseas eliminar este contacto?')) {
      const res = await deleteContact(id)
      if (res?.error) {
         alert('Error eliminando contacto: ' + res.error)
      } else {
         setContacts(prev => prev.filter(c => c.id !== id))
      }
    }
  }

  const handleStartEditLabel = (contact: Contact) => {
    const known = getKnownTags(contact)
    setEditLabel(known[0] || '')
    setEditingId(contact.id)
  }

  const handleSaveLabel = async (contactId: string) => {
    setIsSavingLabel(true)
    const res = await updateContactLabels(contactId, editLabel)
    if (res?.error) {
      alert('Error asignando etiqueta: ' + res.error)
    } else {
      // Update local state immediately
      setContacts(prev => prev.map(c => {
        if (c.id !== contactId) return c
        const otherTags = (c.tags || []).filter(t => !knownLabels[t])
        return { ...c, tags: editLabel ? [editLabel, ...otherTags] : otherTags }
      }))
      setEditingId(null)
    }
    setIsSavingLabel(false)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar — wraps to 2 rows on mobile */}
      <div className="flex flex-col gap-3">
        {/* Row 1: search + tag filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar contacto..."
              className="pl-9"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-[180px] sm:w-[220px] shrink-0">
            <TagSelector
              value={tagFilter}
              onChange={setTagFilter}
              placeholder="Filtrar etiqueta..."
              showCount
            />
          </div>
          {tagFilter && (
            <button
              type="button"
              onClick={() => setTagFilter('')}
              className="text-xs text-blue-600 hover:underline whitespace-nowrap self-center"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Row 2: import + new */}
        <div className="flex gap-2">
           <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsImportOpen(true)}>
             <Upload className="w-4 h-4 mr-2"/>Importar CSV
           </Button>
           <ImportCsvModal open={isImportOpen} onOpenChange={setIsImportOpen} />
           <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none">+ Nuevo Contacto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir contacto manualmente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input name="name" placeholder="Nombre completo" required />
                  <Input name="phone" placeholder="Teléfono E.164 (ej: 573001234567)" required />
                  <Input name="company" placeholder="Empresa (opcional)" />
                  <Input name="city" placeholder="Ciudad (opcional)" />
                  <Input name="email" type="email" placeholder="Email (opcional)" />
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Etiqueta</label>
                    <TagSelector
                      value={newContactTag}
                      onChange={setNewContactTag}
                      placeholder="Seleccionar o crear etiqueta..."
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Contacto'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table with horizontal scroll on mobile */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
         <table className="w-full text-sm text-left">
           <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b text-xs uppercase tracking-wide">
             <tr>
               <th className="px-4 py-3 whitespace-nowrap">Nombre</th>
               <th className="px-4 py-3 whitespace-nowrap">Teléfono</th>
               <th className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">Empresa</th>
               <th className="px-4 py-3 whitespace-nowrap hidden md:table-cell">Ciudad</th>
               <th className="px-4 py-3 whitespace-nowrap">Etiqueta</th>
               <th className="px-4 py-3 text-center whitespace-nowrap">Acciones</th>
             </tr>
           </thead>
           <tbody>
             {filtered.length === 0 ? (
               <tr><td colSpan={6} className="text-center py-12 text-slate-500">No se encontraron contactos.</td></tr>
             ) : (
               filtered.map(c => {
                 const knownTags = getKnownTags(c)
                 const currentLabel = knownTags[0] || ''
                 const isEditing = editingId === c.id

                 return (
                   <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                     <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                     <td className="px-4 py-3 font-mono text-slate-600">{c.phone}</td>
                     <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{c.company || '-'}</td>
                     <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{c.city || '-'}</td>
                     <td className="px-4 py-3">
                       {isEditing ? (
                         <div className="flex items-center gap-2 min-w-[220px]">
                           <div className="flex-1">
                             <TagSelector
                               value={editLabel}
                               onChange={setEditLabel}
                               placeholder="Asignar etiqueta..."
                             />
                           </div>
                           <Button
                             size="sm"
                             disabled={isSavingLabel}
                             onClick={() => handleSaveLabel(c.id)}
                             className="h-7 px-2 text-xs"
                           >
                             {isSavingLabel ? '...' : 'OK'}
                           </Button>
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => setEditingId(null)}
                             className="h-7 px-2 text-xs"
                           >
                             ✕
                           </Button>
                         </div>
                       ) : (
                         <div
                           className="flex items-center gap-1.5 cursor-pointer group"
                           onClick={() => handleStartEditLabel(c)}
                           title="Clic para editar etiqueta"
                         >
                           {currentLabel ? (
                             <span
                               className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                               style={{
                                 backgroundColor: (knownLabels[currentLabel] || '#3B82F6') + '20',
                                 borderColor: (knownLabels[currentLabel] || '#3B82F6') + '60',
                                 color: knownLabels[currentLabel] || '#3B82F6'
                               }}
                             >
                               {currentLabel}
                             </span>
                           ) : (
                             <span className="text-slate-300 text-xs group-hover:text-blue-400 flex items-center gap-1">
                               <Tag className="w-3 h-3" /> Asignar
                             </span>
                           )}
                         </div>
                       )}
                     </td>
                     <td className="px-4 py-3 text-center">
                       <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(c.id)}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </td>
                   </tr>
                 )
               })
             )}
           </tbody>
         </table>
      </div>
      
      <div className="text-xs text-slate-400 text-right">
        Total: {filtered.length} contactos
      </div>
    </div>
  )
}

