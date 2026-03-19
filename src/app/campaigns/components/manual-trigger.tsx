'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ManualTrigger({ active }: { active: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!active) return null

  const handleTrigger = async () => {
    setLoading(true)
    try {
       const res = await fetch('/api/worker')
       const data = await res.json()
       alert(`Resultado de la Cola: ${data.message} \nEnviados en este lote: ${data.sent || 0}`)
       router.refresh()
    } catch(e: any) {
       alert('Error de conexión con el Worker: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <Button 
       variant="outline" 
       size="sm" 
       onClick={handleTrigger} 
       disabled={loading}
       className="ml-2 border-green-200 text-green-700 bg-green-50 hover:bg-green-100 font-bold"
    >
       {loading ? 'Procesando...' : <><Play className="w-3 h-3 mr-1 fill-green-600" /> Forzar Envío</>}
    </Button>
  )
}
