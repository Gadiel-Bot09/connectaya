'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInstance(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const instanceName = formData.get('instanceName') as string
  if (!instanceName) return { error: 'El nombre es obligatorio' }
  
  // Limpiar espacios para el nombre en Evolution
  const cleanName = instanceName.replace(/\s+/g, '-').toLowerCase()
  const token = Math.random().toString(36).substring(2, 15)
  
  const EVOLUTION_URL = (process.env.NEXT_PUBLIC_EVOLUTION_URL || '').replace(/\/+$/, '')
  const GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY
  
  if (!EVOLUTION_URL || !GLOBAL_API_KEY) {
     return { error: 'Faltan variables de entorno de Evolution API.' }
  }

  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': GLOBAL_API_KEY
      },
      body: JSON.stringify({
        instanceName: cleanName,
        token,
        qrcode: true
      })
    })

    if (!res.ok) {
       const text = await res.text()
       return { error: `Error creando instancia en Evolution: ${text}` }
    }

    const { error: dbError } = await supabase.from('whatsapp_instances').insert({
      user_id: user.id,
      instance_name: cleanName,
      display_name: instanceName,
      status: 'connecting',
      evolution_url: EVOLUTION_URL
    })

    if (dbError) throw dbError

    revalidatePath('/settings/whatsapp')
    return { success: true }

  } catch (err: any) {
    return { error: err.message || 'Error del servidor' }
  }
}

export async function getInstanceConnection(instanceName: string) {
  const EVOLUTION_URL = (process.env.NEXT_PUBLIC_EVOLUTION_URL || '').replace(/\/+$/, '')
  const GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY

  if (!EVOLUTION_URL || !GLOBAL_API_KEY) throw new Error('Variables missing')

  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
       headers: { 'apikey': GLOBAL_API_KEY },
       cache: 'no-store'
    })
    if (!res.ok) throw new Error('No se pudo conectar')
    return await res.json()
  } catch (err) {
    console.error(err)
    return null
  }
}

export async function checkInstanceState(instanceName: string) {
  const supabase = createClient()
  const EVOLUTION_URL = (process.env.NEXT_PUBLIC_EVOLUTION_URL || '').replace(/\/+$/, '')
  const GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY

  if (!EVOLUTION_URL || !GLOBAL_API_KEY) return null

  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': GLOBAL_API_KEY },
      cache: 'no-store'
    })
    
    if (res.ok) {
      const data = await res.json()
      const stateProp = data?.instance?.state
      
      let statusToSave = 'disconnected'
      if (stateProp === 'open') statusToSave = 'open'
      else if (stateProp === 'connecting') statusToSave = 'connecting'
      else statusToSave = 'close'

      await supabase.from('whatsapp_instances')
          .update({ status: statusToSave })
          .eq('instance_name', instanceName)
          
      return statusToSave
    }
    return null
  } catch (err) {
    return null
  }
}

export async function deleteInstance(instanceName: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const EVOLUTION_URL = (process.env.NEXT_PUBLIC_EVOLUTION_URL || '').replace(/\/+$/, '')
  const GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY
  
  await supabase.from('whatsapp_instances').delete().eq('instance_name', instanceName).eq('user_id', user.id)

  try {
     await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': GLOBAL_API_KEY! }
     })
  } catch(e) {}

  revalidatePath('/settings/whatsapp')
}

export async function logoutInstance(instanceName: string) {
  const supabase = createClient()
  const EVOLUTION_URL = (process.env.NEXT_PUBLIC_EVOLUTION_URL || '').replace(/\/+$/, '')
  const GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY
  
  try {
     await fetch(`${EVOLUTION_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': GLOBAL_API_KEY! }
     })
     await supabase.from('whatsapp_instances').update({ status: 'close' }).eq('instance_name', instanceName)
  } catch(e) {}

  revalidatePath('/settings/whatsapp')
}
