import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/labels — returns all labels with contact count
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Fetch all labels for this user
  const { data: labels, error } = await supabase
    .from('labels')
    .select('id, name, color')
    .eq('user_id', user.id)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get contact counts per label using the contacts table tags array
  const { data: contacts } = await supabase
    .from('contacts')
    .select('tags')
    .eq('user_id', user.id)
    .eq('is_active', true)

  // Build a map of tag name → count
  const countMap: Record<string, number> = {}
  contacts?.forEach(c => {
    (c.tags || []).forEach((t: string) => {
      countMap[t] = (countMap[t] || 0) + 1
    })
  })

  const result = (labels || []).map(l => ({
    ...l,
    count: countMap[l.name] || 0
  }))

  return NextResponse.json({ labels: result })
}

// POST /api/labels — creates a new label
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { name, color = '#3B82F6' } = body

  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

  const { data, error } = await supabase
    .from('labels')
    .insert({ user_id: user.id, name: name.trim(), color })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Esta etiqueta ya existe' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ label: { ...data, count: 0 } })
}
