'use server'

import { createClient } from '@/utils/supabase/server'

export async function validateWhatsAppNumbers(numbers: string[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // 1. Get an active instance
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('instance_name')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .limit(1)
    .single()

  if (!instance) {
    return { error: 'Debes tener al menos una instancia de WhatsApp conectada (Estado: Open) para validar números.' }
  }

  const EVOLUTION_URL = (process.env.NEXT_PUBLIC_EVOLUTION_URL || '').replace(/\/+$/, '')
  const GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY

  if (!EVOLUTION_URL || !GLOBAL_API_KEY) {
     return { error: 'Evolution API no está configurada.' }
  }

  // 2. Clean numbers for Evolution API format (only numbers)
  const cleanNumbers = numbers.map(n => n.replace(/\D/g, ''))
  
  try {
    const res = await fetch(`${EVOLUTION_URL}/chat/whatsappNumbers/${instance.instance_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': GLOBAL_API_KEY
      },
      body: JSON.stringify({
        numbers: cleanNumbers
      })
    })

    const data = await res.json()
    if (!res.ok) {
       return { error: data?.response?.message || 'Error al validar con Evolution API' }
    }

    // data format is roughly: [ { exists: true, jid: "...", number: "..." } ... ]
    // Create a dictionary mapping the original cleaned number to its exists status
    // Some endpoints return `format` or `jid` from which we can extract the number, or they return them in the same order
    
    // Evolution API v2 returns: [ { "exists": true, "jid": "...", "number": "..." }, ... ]
    // We map it to returning a dictionary where key is the raw original number.
    const validationMap: Record<string, boolean> = {}
    
    // Safety check just in case Evolution returns an array
    if (Array.isArray(data)) {
      data.forEach((item: any, index: number) => {
         // Some versions don't return "number" prop if it's invalid, so we rely on index corresponding to the input array
         const originalNumber = numbers[index]
         validationMap[originalNumber] = !!item?.exists
      })
    }

    return { success: true, validationMap }
  } catch(e: any) {
    return { error: e.message || 'Error de conexión con el Worker de WhatsApp.' }
  }
}
