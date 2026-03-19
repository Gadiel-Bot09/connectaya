'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, MapPin, Phone, Globe, Store, CheckCircle, Database } from 'lucide-react'
import { createContactsBulk } from '@/app/contacts/actions'

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
  const [results, setResults] = useState<Place[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setResults([])
    setSelected(new Set())

    try {
      const res = await fetch('/api/maps/search?query=' + encodeURIComponent(query))
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)
      
      setResults(data.results || [])
    } catch(err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-slate-700">Buscar negocios</label>
              <Input 
                placeholder='Ej: "Peluquerías en Medellín"' 
                value={query}
                onChange={e => setQuery(e.target.value)}
                required
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Buscando con Google...' : <><Search className="w-4 h-4 mr-2" /> Buscar</>}
              </Button>
            </form>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="shadow-sm bg-slate-50 border-slate-200">
             <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                   <span>{selected.size} seleccionados</span>
                   <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(results.map(r => r.place_id)))}>Seleccionar todos</Button>
                </div>
                <Button 
                   onClick={handleImport} 
                   disabled={selected.size === 0 || isImporting} 
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                   {isImporting ? 'Importando...' : <><Database className="w-4 h-4 mr-2" /> Importar a Contactos</>}
                </Button>
             </CardContent>
          </Card>
        )}
      </div>

      <div className="w-full lg:w-2/3">
        {isLoading ? (
          <div className="flex justify-center py-20 text-slate-400">
             <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Consultando a Google Places API...</p>
             </div>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(place => {
              const isSelected = selected.has(place.place_id)
              return (
                <Card 
                   key={place.place_id} 
                   className={`cursor-pointer transition-colors border-2 ${isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-transparent hover:border-slate-300 shadow-sm'}`}
                   onClick={() => toggleSelection(place.place_id)}
                >
                  <CardContent className="p-5 relative">
                    {isSelected && <CheckCircle className="absolute top-4 right-4 text-blue-500 w-5 h-5" />}
                    
                    <h3 className="font-semibold text-lg text-slate-800 pr-8">{place.name}</h3>
                    {place.rating && <p className="text-sm text-amber-500 font-medium mb-3">★ {place.rating}</p>}
                    
                    <div className="space-y-2 mt-3">
                      <div className="flex items-start gap-2 text-sm text-slate-700">
                        <Phone className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        <span className="font-mono">{place.phone}</span>
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        <span className="line-clamp-2">{place.address}</span>
                      </div>

                      {place.website && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Globe className="w-4 h-4 shrink-0" />
                          <a href={place.website} target="_blank" rel="noreferrer" className="truncate hover:underline" onClick={e => e.stopPropagation()}>
                            {new URL(place.website).hostname.replace('www.','')}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed rounded-xl h-full min-h-[400px]">
            <Store className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg">Ingresa una búsqueda para ver los resultados.</p>
            <p className="text-sm mt-1">Solo se mostrarán negocios que tengan teléfono público publicado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
