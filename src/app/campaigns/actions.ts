'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

export async function getCampaignFormData() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const [instancesRes, contactsRes, labelsRes] = await Promise.all([
    supabase.from('whatsapp_instances').select('id, instance_name, display_name').eq('user_id', user.id).eq('status', 'open'),
    supabase.from('contacts').select('tags').eq('user_id', user.id).eq('is_active', true),
    supabase.from('labels').select('id, name, color').eq('user_id', user.id).order('name')
  ])

  // Build contact count per tag
  const countMap: Record<string, number> = {}
  contactsRes.data?.forEach(c => {
    (c.tags || []).forEach((t: string) => {
      countMap[t] = (countMap[t] || 0) + 1
    })
  })

  const labels = labelsRes.data || []
  // Merge labels with counts, also add any tags that exist in contacts but not as labels yet
  const tagSet = new Set(labels.map((l: any) => l.name))
  Object.keys(countMap).forEach(tag => {
    if (!tagSet.has(tag)) {
      labels.push({ id: tag, name: tag, color: '#94A3B8' })
    }
  })

  const tagsWithCount = labels
    .filter((l: any) => countMap[l.name])
    .map((l: any) => ({ name: l.name, color: l.color, count: countMap[l.name] || 0 }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name))

  return {
     instances: instancesRes.data || [],
     tags: tagsWithCount.map((t: any) => t.name),   // keep backward compat
     tagsWithCount,
  }
}

export async function createCampaign(data: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  try {
     let formattedScheduledAt = data.scheduled_at || null
     if (formattedScheduledAt && formattedScheduledAt.length === 16) {
        // Typical datetime-local input without offset (e.g., 2026-03-20T14:00)
        formattedScheduledAt = formattedScheduledAt + ':00-05:00'
     }

     const { data: campaign, error } = await supabase.from('campaigns').insert({
        user_id: user.id,
        name: data.name,
        description: data.description,
        instance_id: data.instance_id,
        schedule_type: data.schedule_type,
        scheduled_at: formattedScheduledAt,
        template_message: data.template_message,
        attachment_type: data.attachment_type || null,
        attachment_url: data.attachment_url || null,
        ai_enabled: data.ai_enabled,
        ai_tone: data.ai_tone || null,
        ai_context: data.ai_context || null,
        delay_min: data.delay_min,
         delay_max: data.delay_max || 90,
         pause_every_n: data.pause_every_n || 0,
         pause_duration_min: data.pause_duration_min || 0,
         pause_duration_max: data.pause_duration_max || 0,
         daily_limit: data.daily_limit ?? 150,
         allowed_start_hour: data.allowed_start_hour || 8,
         allowed_end_hour: data.allowed_end_hour || 19,
        status: data.schedule_type === 'immediate' ? 'active' : 'scheduled'
     }).select().single()

     if (error) throw error

     let contactsQuery = supabase.from('contacts').select('id').eq('user_id', user.id).eq('is_active', true)
     if (data.target_type === 'tags' && data.selected_tags?.length > 0) {
        contactsQuery = contactsQuery.contains('tags', data.selected_tags)
     }
     
     const { data: targetContacts } = await contactsQuery
     if (targetContacts && targetContacts.length > 0) {
        const queueItems = targetContacts.map(tc => ({
           campaign_id: campaign.id,
           contact_id: tc.id,
           status: 'pending'
        }))
        await supabase.from('message_queue').insert(queueItems)
        await supabase.from('campaigns').update({ total_contacts: targetContacts.length }).eq('id', campaign.id)
     }

     return { success: true, campaignId: campaign.id }
  } catch (err: any) {
     return { error: err.message }
  }
}

export async function generatePreview(data: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  let query = supabase.from('contacts').select('*').eq('user_id', user.id).limit(4)
  if (data.target_type === 'tags' && data.selected_tags?.length > 0) {
     query = query.contains('tags', data.selected_tags)
  }

  const { data: contacts, error } = await query
  if (error) return { error: error.message }
  if (!contacts || contacts.length === 0) return { error: 'No tienes contactos o ninguno coincide con las etiquetas.' }

  const results = await Promise.all(contacts.map(async (c) => {
     let msg = data.template_message.replace(/{{name}}/gi, c.name).replace(/{{company}}/gi, c.company || '')
     
     if (data.ai_enabled) {
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
        if (!apiKey) return { contact: c, message: msg + '\n[Error: Falta API Key de OpenAI]' }
        
        try {
           const openai = new OpenAI({ apiKey })
           const prompt = `Eres un asistente de envíos de WhatsApp. Tono: ${data.ai_tone}. Contexto del negocio: ${data.ai_context || 'Ninguno'}. 
Reescribe y personaliza este mensaje base: "${msg}". 
El mensaje resultante debe ser natural, directo, sin emojis excesivos y listo para enviar. Solo devuelve el texto del mensaje.`
           
           const comp = await openai.chat.completions.create({
              model: 'gpt-4o-mini', // using mini for speed in preview
              messages: [{ role: 'user', content: prompt }]
           })
           msg = comp.choices[0].message.content || msg
        } catch(e: any) {
           msg += '\n[Error AI: ' + e.message + ']'
        }
     }
     
     return { contact: c, message: msg }
  }))

  return { previews: results }
}

export async function pauseCampaign(id: string, formData?: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('campaigns').update({ status: 'paused' }).eq('id', id).eq('user_id', user.id)
  revalidatePath('/campaigns/history')
}
