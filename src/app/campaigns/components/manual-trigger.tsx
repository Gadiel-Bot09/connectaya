'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ManualTrigger({ active, campaignId }: { active: boolean; campaignId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!active) return null

  const handleTrigger = async () => {
    setLoading(true)
    try {
       // Step 1: Reset any failed messages back to 'pending' so the worker can process them
       const resetRes = await fetch(`/api/reset-campaign?id=${campaignId}`, { method: 'POST' })
       const resetData = await resetRes.json()
       
       if (resetData.error) {
         alert('Error reseteando cola: ' + resetData.error)
         setLoading(false)
         return
       }

       // Step 2: Trigger the worker to process the next message immediately
       const workerRes = await fetch('/api/worker')
       const workerData = await workerRes.json()

       const resetInfo = resetData.stats?.failedMessages > 0 
         ? `\n♻️ Se resetearon ${resetData.stats.failedMessages} mensajes fallidos para reintento.` 
         : ''
       
       alert(`Resultado: ${workerData.message}${resetInfo}\nEnviados en este ciclo: ${workerData.sent !== undefined ? workerData.sent : (workerData.done ? '✅ Campaña completada' : 1)}`)
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
       {loading 
         ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Procesando...</> 
         : <><Play className="w-3 h-3 mr-1 fill-green-600" /> Forzar Envío</>
       }
    </Button>
  )
}
