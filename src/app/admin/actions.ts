'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Admin-only: requires service role key for all operations
function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Solo administradores')
  return user
}

export async function getAllUsers() {
  await requireAdmin()
  const admin = getAdminSupabase()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, role, is_active, account_status, license_plan, license_expires_at, license_notes, created_at')
    .order('created_at', { ascending: false })

  // Get auth emails (service role only)
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  authUsers?.forEach(u => { emailMap[u.id] = u.email || '' })

  return (profiles || []).map(p => ({
    ...p,
    email: emailMap[p.id] || '(sin email)',
  }))
}

export async function suspendUser(userId: string) {
  await requireAdmin()
  const admin = getAdminSupabase()
  const { error } = await admin.from('profiles').update({ account_status: 'suspended' }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function activateUser(userId: string) {
  await requireAdmin()
  const admin = getAdminSupabase()
  const { error } = await admin.from('profiles').update({ account_status: 'active' }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function extendLicense(userId: string, days: number, plan: string) {
  await requireAdmin()
  const admin = getAdminSupabase()

  // Get current expiry or use now as base
  const { data: profile } = await admin.from('profiles').select('license_expires_at').eq('id', userId).single()
  const base = profile?.license_expires_at && new Date(profile.license_expires_at) > new Date()
    ? new Date(profile.license_expires_at)
    : new Date()

  base.setDate(base.getDate() + days)

  const { error } = await admin.from('profiles').update({
    license_expires_at: base.toISOString(),
    license_plan: plan,
    account_status: 'active',
  }).eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteUser(userId: string) {
  await requireAdmin()
  const admin = getAdminSupabase()
  // Deleting from auth.users cascades to profiles
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function saveNote(userId: string, note: string) {
  await requireAdmin()
  const admin = getAdminSupabase()
  const { error } = await admin.from('profiles').update({ license_notes: note }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}
