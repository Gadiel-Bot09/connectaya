'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateGeneralSettings(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const business_name = formData.get('business_name') as string
  const timezone = formData.get('timezone') as string
  const openai_key = formData.get('openai_key') as string
  const gmaps_key = formData.get('gmaps_key') as string
  const ai_default_context = formData.get('ai_default_context') as string

  const { error } = await supabase.from('user_settings').update({
     business_name,
     timezone,
     openai_api_key_encrypted: openai_key || null,
     gmaps_api_key_encrypted: gmaps_key || null,
     ai_default_context
  }).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Acceso denegado: solo administradores' }

  const { error } = await supabase.from('profiles').update({ is_active: !currentStatus }).eq('id', userId)
  if (error) return { error: error.message }
  
  revalidatePath('/settings/users')
  return { success: true }
}
