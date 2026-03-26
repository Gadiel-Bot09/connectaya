'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function redeemCode(code: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Clean code string
  const cleanCode = code.trim().toUpperCase()
  if (!cleanCode) return { error: 'Por favor, ingresa un código válido.' }

  try {
    // 1. Fetch code and its associated plan
    const { data: activationCode, error: fetchError } = await supabase
      .from('activation_codes')
      .select('*, plans(*)')
      .eq('code', cleanCode)
      .single()

    if (fetchError || !activationCode) {
      return { error: 'El código ingresado no existe o es inválido.' }
    }

    if (activationCode.is_used) {
      return { error: 'Este código ya ha sido utilizado.' }
    }

    // 2. Determine expiration math
    // If the user already has an active license that hasn't expired, we *could* add the days to their existing limit.
    // For simplicity and standard SaaS behavior, if they redeem a new code, we just set the new expiry from today.
    const durationMs = activationCode.duration_days * 24 * 60 * 60 * 1000
    const newExpiry = new Date(Date.now() + durationMs).toISOString()

    // 3. Mark code as used
    const { error: updateCodeError } = await supabase
      .from('activation_codes')
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date().toISOString()
      })
      .eq('id', activationCode.id)

    if (updateCodeError) throw updateCodeError

    // 4. Update user profile to grant the plan
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan_id: activationCode.plan_id,
        license_expires_at: newExpiry,
        account_status: 'active' // Ensure they are un-suspended if they were blocked
      })
      .eq('id', user.id)

    if (profileError) {
      // Rollback code (Optional if using Supabase RPC, but manual rollback is fine here)
      await supabase.from('activation_codes').update({ is_used: false, used_by: null, used_at: null }).eq('id', activationCode.id)
      throw profileError
    }

    revalidatePath('/settings/billing')
    return { 
      success: true, 
      message: `¡Felicidades! Se ha activado con éxito el Plan ${activationCode.plans.name} por ${activationCode.duration_days} días.` 
    }

  } catch (err: any) {
    console.error('Redeem Code Error', err)
    return { error: 'Ocurrió un error al canjear el código. Contacta al soporte.' }
  }
}
