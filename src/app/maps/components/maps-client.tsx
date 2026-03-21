'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Phone, Globe, Store, CheckCircle, Database, MessageCircle, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { createContactsBulk, checkDuplicatePhones } from '@/app/contacts/actions'
import { validateWhatsAppNumbers } from '../actions'
import { TagSelector } from '@/components/tag-selector'

type Place = {
  place_id: string
  name: string
  address: string
  rating?: number
  types: string[]
  phone: string | null
  hasPhone: boolean
  website?: string
  lat: number
  lng: number
}

type ImportPreview = {
  toImport: Place[]
  duplicates: Place[]
  noPhone: Place[]
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

  // Import label (TagSelector)
  const [importLabel, setImportLabel] = useState('')

  // Import preview modal
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

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
    setPreview(null)
    setImportSuccess(null)

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
     
     const phones = results.filter(r => r.hasPhone).map(r => r.phone as string)
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

  // Step 1: build preview (check duplicates) before actually importing
  const handlePreviewImport = async () => {
    if (selected.size === 0) return
    setIsCheckingDuplicates(true)
    setError(null)

    const selectedPlaces = results.filter(r => selected.has(r.place_id))

    // Separate: has phone vs no phone
    const withPhone = selectedPlaces.filter(r => r.hasPhone)
    const noPhone = selectedPlaces.filter(r => !r.hasPhone)

    // Check duplicates for those with phone
    const normalizedPhones = withPhone.map(r => (r.phone as string).replace(/[^0-9]/g, ''))
    const { existing } = await checkDuplicatePhones(normalizedPhones)
    const existingSet = new Set(existing)

    const duplicates = withPhone.filter(r => existingSet.has((r.phone as string).replace(/[^0-9]/g, '')))
    const toImport = withPhone.filter(r => !existingSet.has((r.phone as string).replace(/[^0-9]/g, '')))

    setPreview({ toImport, duplicates, noPhone })
    setIsCheckingDuplicates(false)
  }

  // Step 2: confirm and import
  const handleConfirmImport = async () => {
    if (!preview || preview.toImport.length === 0) return
    setIsImporting(true)
    setError(null)

    const buildTags = (place: Place): string => {
      const baseTags = ['maps_import', place.types?.[0] || 'negocio']
      if (importLabel.trim()) baseTags.unshift(importLabel.trim())
      return baseTags.join(',')
    }

    const contactsToImport = preview.toImport.map(r => ({
      name: r.name,
      phone: r.phone,
      company: r.name,
      city: r.address ? r.address.split(',')[r.address.split(',').length - 2]?.trim() || r.address.split(',')[0] : '',
      tags: buildTags(r)
    }))

    const res = await createContactsBulk(contactsToImport)
    if (res?.error) {
      setError(res.error)
    } else {
      setImportSuccess(`✅ ${res?.count ?? preview.toImport.length} contactos importados correctamente`)
      setSelected(new Set())
      setPreview(null)
    }
    setIsImporting(false)
  }

  // Derived state for filtering
  const visibleResults = showOnlyWhatsApp 
     ? results.filter(r => {
         if (!r.hasPhone) return false
         const cleanPhone = (r.phone as string).replace(/\D/g, '')
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
                   
                   {/* Label selector */}
                   <div className="mb-3">
                     <label className="text-xs font-semibold text-slate-600 block mb-1">Etiqueta personalizada</label>
                     <TagSelector
                       value={importLabel}
                       onChange={setImportLabel}
                       placeholder="Seleccionar o crear etiqueta..."
                     />
                     <p className="text-xs text-slate-400 mt-1">Se asignará a todos los contactos importados</p>
                   </div>

                   {importSuccess && (
                     <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
                       {importSuccess}
                     </div>
                   )}

                   <Button 
                      onClick={handlePreviewImport} 
                      disabled={selected.size === 0 || isCheckingDuplicates || isImporting} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                   >
                      {isCheckingDuplicates ? 'Verificando duplicados...' : <><Database className="w-4 h-4 mr-2" /> Revisar e Importar</>}
                   </Button>
                </div>
             </CardContent>
          </Card>
        )}
      </div>

      {/* Import Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Resumen de importación</h2>
              <p className="text-sm text-slate-500 mb-5">Revisa los contactos antes de confirmar</p>

              {/* To Import */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-800">
                    {preview.toImport.length} contactos nuevos a importar
                  </span>
                </div>
                {preview.toImport.length > 0 && (
                  <div className="pl-7 flex flex-col gap-1 max-h-36 overflow-y-auto">
                    {preview.toImport.map(p => (
                      <div key={p.place_id} className="text-sm text-slate-700 flex justify-between">
                        <span className="truncate">{p.name}</span>
                        <span className="text-slate-400 text-xs ml-2 shrink-0">{p.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Duplicates */}
              {preview.duplicates.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <span className="font-semibold text-slate-800">
                      {preview.duplicates.length} ya existen en tu base (se saltarán)
                    </span>
                  </div>
                  <div className="pl-7 flex flex-col gap-1 max-h-28 overflow-y-auto">
                    {preview.duplicates.map(p => (
                      <div key={p.place_id} className="text-sm text-slate-500 flex justify-between">
                        <span className="truncate">{p.name}</span>
                        <span className="text-slate-400 text-xs ml-2 shrink-0">{p.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No phone */}
              {preview.noPhone.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span className="font-semibold text-slate-800">
                      {preview.noPhone.length} sin número de teléfono (se saltarán)
                    </span>
                  </div>
                  <div className="pl-7 flex flex-col gap-1 max-h-28 overflow-y-auto">
                    {preview.noPhone.map(p => (
                      <div key={p.place_id} className="text-sm text-slate-400 truncate">{p.name}</div>
                    ))}
                  </div>
                </div>
              )}

              {importLabel && (
                <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                  Etiqueta asignada: <strong>{importLabel}</strong>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPreview(null)}
                  disabled={isImporting}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={handleConfirmImport}
                  disabled={preview.toImport.length === 0 || isImporting}
                >
                  {isImporting 
                    ? 'Importando...' 
                    : `Importar ${preview.toImport.length} contactos`
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full lg:w-2/3">
        {isLoading ? (
          <div className="flex justify-center py-20 text-slate-400">
             <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-medium animate-pulse">Consultando a Google Places API...</p>
             </div>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleResults.length === 0 ? (
               <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium">No hay negocios que cumplan con los filtros actuales.</p>
               </div>
            ) : (
                currentItems.map(place => {
                  const isSelected = selected.has(place.place_id)
                  const cleanPhone = place.phone ? place.phone.replace(/\D/g, '') : ''
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
                        
                        <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5 leading-relaxed">
                          <Store className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          {place.address}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          {place.hasPhone ? (
                            <p className={`text-xs font-mono flex items-center gap-1 ${hasWa === true ? 'text-emerald-600' : hasWa === false ? 'text-slate-400' : 'text-slate-600'}`}>
                              {hasWa === true ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Phone className="w-3 h-3" />}
                              {place.phone}
                            </p>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> Sin teléfono
                            </span>
                          )}
                        </div>
                        
                        {place.website && (
                          <a href={place.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 mt-1.5">
                            <Globe className="w-3 h-3" /> {new URL(place.website).hostname}
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
            )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                <span className="text-sm text-slate-600 px-2">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Busca negocios en Google Maps</h3>
            <p className="text-sm text-slate-400 text-center max-w-xs">Escribe el tipo de negocio y la ciudad. Ej: "Restaurantes en Bogotá"</p>
          </div>
        )}
      </div>
    </div>
  )
}
