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
      // Step 1: Reset any failed messages back to pending
      const resetRes = await fetch(`/api/reset-campaign?id=${campaignId}`, { method: 'POST' })
      const resetData = await resetRes.json()

      if (resetData.error) {
        alert('Error reseteando cola: ' + resetData.error)
        setLoading(false)
        return
      }

      // Step 2: Trigger worker with force=true to bypass hour restrictions
      // force=true allows sending at any hour during manual override
      const workerRes = await fetch('/api/worker?force=true')
      const workerData = await workerRes.json()

      // Build user-friendly result message
      let resultMsg = ''
      if (resetData.stats?.failedMessages > 0) {
        resultMsg += `♻️ ${resetData.stats.failedMessages} mensajes fallidos reseteados para reintento.\n`
      }
      
      if (workerData.blocked === 'hours') {
        // This should not happen with force=true, but handle gracefully
        resultMsg += `⏰ ${workerData.message}`
      } else if (workerData.done) {
        resultMsg += `✅ ¡Campaña completada! Se procesó el último mensaje.`
      } else if (workerData.message === 'No active campaigns') {
        resultMsg += `⚠️ No se encontraron campañas activas. Recarga la página e intenta de nuevo.`
      } else if (workerData.message === 'Instance is not connected') {
        resultMsg += `❌ La instancia de WhatsApp no está conectada. Verifica en Configuración → WhatsApp.`
      } else if (workerData.message === 'Message sent') {
        resultMsg += `✅ Mensaje enviado correctamente a ${workerData.phone || 'destinatario'}.\n`
        resultMsg += `📊 Restantes: ${workerData.remaining ?? 'N/A'} mensajes en la cola.\n`
        resultMsg += `⏱️ GitHub Actions enviará el siguiente en 50-80 segundos automáticamente.`
      } else {
        resultMsg += `ℹ️ ${workerData.message || JSON.stringify(workerData)}`
      }

      alert(resultMsg)
      router.refresh()
    } catch (e: any) {
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
      {loading ? (
        <>
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Procesando...
        </>
      ) : (
        <>
          <Play className="w-3 h-3 mr-1 fill-green-600" /> Forzar Envío
        </>
      )}
    </Button>
  )
}
