'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, MapPin, Phone, Globe, Store, CheckCircle, Database, CheckCircle2, MessageCircle } from 'lucide-react'
import { createContactsBulk } from '@/app/contacts/actions'
import { validateWhatsAppNumbers } from '../actions'

type Place = {
  place_id: string
  name: string
  address: string
  rating?: number
  types: string[]
  phone: string
  website?: string
  lat: number
  lng: number
}

export function MapsClient() {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(20)
  const [results, setResults] = useState<Place[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // WhatsApp Validation State
  const [whatsappStatus, setWhatsappStatus] = useState<Record<string, boolean>>({})
  const [isValidating, setIsValidating] = useState(false)
  const [showOnlyWhatsApp, setShowOnlyWhatsApp] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setValidationError(null)
    setResults([])
    setSelected(new Set())
    setWhatsappStatus({})
    setCurrentPage(1)

    try {
      const res = await fetch('/api/maps/search?query=' + encodeURIComponent(query) + '&limit=' + limit)
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)
      
      setResults(data.results || [])
    } catch(err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidateWhatsApp = async () => {
     if (results.length === 0) return
     setIsValidating(true)
     setValidationError(null)
     
     const phones = results.map(r => r.phone)
     const resAction = await validateWhatsAppNumbers(phones)
     
     if (resAction.error) {
        setValidationError(resAction.error)
     } else if (resAction.validationMap) {
        setWhatsappStatus(resAction.validationMap)
     }
     
     setIsValidating(false)
  }

  const toggleSelection = (placeId: string) => {
    const newSel = new Set(selected)
    if (newSel.has(placeId)) newSel.delete(placeId)
    else newSel.add(placeId)
    setSelected(newSel)
  }

  const handleImport = async () => {
    if (selected.size === 0) return
    setIsImporting(true)
    setError(null)
    
    const contactsToImport = results.filter(r => selected.has(r.place_id)).map(r => ({
      name: r.name,
      phone: r.phone,
      company: r.name,
      city: r.address ? r.address.split(',')[r.address.split(',').length - 2]?.trim() || r.address.split(',')[0] : '', 
      tags: 'maps_import,' + (r.types[0] || 'negocio')
    }))

    const res = await createContactsBulk(contactsToImport)
    if (res?.error) {
      setError(res.error)
    } else {
      alert(`¡${res?.count} contactos importados exitosamente!`)
      setSelected(new Set())
    }
    setIsImporting(false)
  }

  // Derived state for filtering
  const visibleResults = showOnlyWhatsApp 
     ? results.filter(r => {
         const cleanPhone = r.phone.replace(/\D/g, '')
         return whatsappStatus[cleanPhone] === true
       })
     : results

  const totalPages = Math.ceil(visibleResults.length / itemsPerPage)
  const currentItems = visibleResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-5">
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
              <div className="flex gap-3">
                 <div className="flex-1">
                    <label className="text-sm font-bold text-slate-800">Buscar negocios</label>
                    <Input 
                      placeholder='Ej: "Peluquerías en Medellín"' 
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      required
                      className="bg-slate-50 border-slate-200 mt-1"
                    />
                 </div>
                 <div className="w-24 shrink-0">
                    <label className="text-sm font-bold text-slate-800">Límite</label>
                    <select 
                      className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm bg-slate-50 mt-1" 
                      value={limit} 
                      onChange={e => setLimit(Number(e.target.value))}
                    >
                       <option value={10}>10</option>
                       <option value={20}>20</option>
                       <option value={50}>50</option>
                       <option value={100}>100</option>
                       <option value={200}>200</option>
                    </select>
                 </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full font-bold mt-1">
                {isLoading ? 'Buscando con Google...' : <><Search className="w-4 h-4 mr-2" /> Buscar</>}
              </Button>
            </form>
            {error && <p className="text-red-500 text-sm mt-3 font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="shadow-sm border-slate-200">
             <CardContent className="p-5 flex flex-col gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Paso 1: Auditoría WhatsApp</h4>
                   <Button 
                      variant="outline"
                      onClick={handleValidateWhatsApp} 
                      disabled={isValidating || Object.keys(whatsappStatus).length > 0} 
                      className="w-full font-bold border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                   >
                      {isValidating ? 'Comprobando en Evolution...' : <><MessageCircle className="w-4 h-4 mr-2 fill-emerald-500 text-emerald-100" /> Verificar Cuentas Activas</>}
                   </Button>
                   {validationError && <p className="text-red-500 text-[11px] mt-2 font-medium">{validationError}</p>}
                   
                   {Object.keys(whatsappStatus).length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                         <input 
                            type="checkbox" 
                            id="filterValid"
                            checked={showOnlyWhatsApp}
                            onChange={(e) => setShowOnlyWhatsApp(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                         />
                         <label htmlFor="filterValid" className="text-sm font-medium text-slate-700 cursor-pointer">
                            Mostrar sólo habilitados en WA
                         </label>
                      </div>
                   )}
                </div>

                <div className="h-px w-full bg-slate-100 my-1"></div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Paso 2: Importación</h4>
                   <div className="flex justify-between items-center text-sm font-medium text-slate-700 mb-3">
                      <span><strong className="text-blue-600">{selected.size}</strong> seleccionados</span>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(visibleResults.map(r => r.place_id)))} className="h-6 px-2 text-xs">Seleccionar filtrados</Button>
                   </div>
                   <Button 
                      onClick={handleImport} 
                      disabled={selected.size === 0 || isImporting} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                   >
                      {isImporting ? 'Importando...' : <><Database className="w-4 h-4 mr-2" /> Importar a Contactos</>}
                   </Button>
                </div>
             </CardContent>
          </Card>
        )}
      </div>

      <div className="w-full lg:w-2/3">
        {isLoading ? (
          <div className="flex justify-center py-20 text-slate-400">
             <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-medium animate-pulse">Consultando a Google Places API...</p>
             </div>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleResults.length === 0 ? (
               <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium">No hay negocios que cumplan con los filtros actuales.</p>
               </div>
            ) : (
                currentItems.map(place => {
                  const isSelected = selected.has(place.place_id)
                  const cleanPhone = place.phone.replace(/\D/g, '')
                  const hasWa = whatsappStatus[cleanPhone]
                  
                  return (
                    <Card 
                       key={place.place_id} 
                       className={`cursor-pointer transition-colors border-2 ${isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 shadow-sm'} group`}
                       onClick={() => toggleSelection(place.place_id)}
                    >
                      <CardContent className="p-5 relative">
                        {isSelected && <CheckCircle className="absolute top-4 right-4 text-blue-500 w-5 h-5 bg-white rounded-full" />}
                        
                        <h3 className="font-bold text-[15px] text-slate-900 pr-8 leading-tight">{place.name}</h3>
                        {place.rating && <p className="text-xs text-amber-500 font-bold mt-1">★ {place.rating} en Google</p>}
                        
                        <div className="space-y-2.5 mt-4">
                          <div className="flex items-center justify-between gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                            <div className="flex items-center gap-2">
                               <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                               <span className="font-mono font-medium">{place.phone}</span>
                            </div>
                            
                            {/* Indicador WhatsApp */}
                            {hasWa === true ? (
                               <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" /> WA Activo
                               </span>
                            ) : hasWa === false ? (
                               <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                                  Invalido
                               </span>
                            ) : null}
                          </div>
                          
                          <div className="flex items-start gap-2 text-xs text-slate-500 pl-1">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-300" />
                            <span className="line-clamp-2 leading-relaxed">{place.address}</span>
                          </div>

                          {place.website && (
                            <div className="flex items-center gap-2 text-xs text-blue-600 pl-1">
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              <a href={place.website} target="_blank" rel="noreferrer" className="truncate hover:underline font-medium" onClick={e => e.stopPropagation()}>
                                {new URL(place.website).hostname.replace('www.','')}
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
            )}
          </div>
          
          {totalPages > 1 && (
             <div className="mt-8 flex items-center justify-center gap-4">
                <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                   disabled={currentPage === 1}
                   className="hover:bg-slate-100"
                >
                   Anterior
                </Button>
                <div className="text-sm font-medium text-slate-600 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                   Página {currentPage} de {totalPages}
                </div>
                <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                   disabled={currentPage === totalPages}
                   className="hover:bg-slate-100"
                >
                   Siguiente
                </Button>
             </div>
          )}
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white h-full min-h-[400px]">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Store className="w-10 h-10 text-slate-300" />
             </div>
            <p className="text-lg font-bold text-slate-700">Explorador B2B</p>
            <p className="text-sm mt-1 max-w-sm text-center">Ingresa una búsqueda (ej. "Odontologos en Madrid") para rastrear la información de contacto pública en Google Places.</p>
          </div>
        )}
      </div>
    </div>
  )
}
