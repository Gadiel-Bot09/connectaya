'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, Search, Upload } from 'lucide-react'
import { createContact, deleteContact } from '../actions'
import { ImportCsvModal } from './import-csv-modal'

type Contact = {
  id: string
  name: string
  phone: string
  company: string
  city: string
  email: string
}

export function ContactsClient({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState(initialContacts)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  )

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await createContact(formData)
    
    if (res?.error) {
      alert(res.error)
      setIsLoading(false)
    } else {
      setIsOpen(false)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
           <Input 
             placeholder="Buscar contacto..." 
             className="pl-9"
             value={search}
             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
           />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
           <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsImportOpen(true)}>
             <Upload className="w-4 h-4 mr-2"/> Importar CSV
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
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Contacto'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
         <table className="w-full text-sm text-left">
           <thead className="bg-slate-50/80 text-slate-600 font-medium border-b">
             <tr>
               <th className="px-4 border-r py-3 text-nowrap">Nombre</th>
               <th className="px-4 border-r py-3 text-nowrap">Teléfono</th>
               <th className="px-4 border-r py-3 text-nowrap">Empresa</th>
               <th className="px-4 border-r py-3 text-nowrap">Ciudad</th>
               <th className="px-4 py-3 text-center">Acciones</th>
             </tr>
           </thead>
           <tbody>
             {filtered.length === 0 ? (
               <tr><td colSpan={5} className="text-center py-12 text-slate-500">No se encontraron contactos.</td></tr>
             ) : (
               filtered.map(c => (
                 <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                   <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                   <td className="px-4 py-3 font-mono text-slate-600">{c.phone}</td>
                   <td className="px-4 py-3 text-slate-500">{c.company || '-'}</td>
                   <td className="px-4 py-3 text-slate-500">{c.city || '-'}</td>
                   <td className="px-4 py-3 text-center">
                     <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(c.id)}>
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </td>
                 </tr>
               ))
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
