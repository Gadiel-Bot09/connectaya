'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

function generateKey() {
  // Generates a key like CNX-A8F2-99XZ
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomStr = (len: number) => Array.from({ length: len }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
  return `CNX-${randomStr(4)}-${randomStr(4)}`
}

export async function generateCodes(planId: string, durationDays: number, count: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Acceso denegado' }

  try {
    const codesToInsert = Array.from({ length: count }).map(() => ({
      code: generateKey(),
      plan_id: planId,
      duration_days: durationDays,
      created_by: user.id
    }))

    const { error } = await supabase.from('activation_codes').insert(codesToInsert)
    if (error) throw error

    revalidatePath('/admin/codes')
    return { success: true }
  } catch (err: any) {
    console.error('Error generating codes:', err)
    return { error: 'Ocurrió un error al generar los códigos.' }
  }
}
