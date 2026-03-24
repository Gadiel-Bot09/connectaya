import { NextResponse } from 'next/server'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import OpenAI from 'openai'
import { sendCampaignCompletedEmail } from '@/utils/email'

// STATELESS SINGLE-MESSAGE WORKER
// ----------------------------------------------------------------------
// Each HTTP call processes EXACTLY ONE message and returns immediately.
// This keeps Vercel execution under their 10-second free plan limit.
// Anti-spam delays (45-90s) are managed EXTERNALLY by GitHub Actions,
// which calls this endpoint repeatedly with sleep() between each call.
// ----------------------------------------------------------------------
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
// maxDuration reduced to 30s — plenty for one AI call + one Evolution POST
export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // force=true bypasses the hour restriction — used by manual 'Forzar Envío' button
  const forceMode = searchParams.get('force') === 'true'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  let supabase: any
  if (serviceKey) {
    supabase = createJsClient(supabaseUrl, serviceKey)
  } else {
    supabase = createServerClient()
  }

  const EVOLUTION_URL = (process.env.NEXT_PUBLIC_EVOLUTION_URL || '').trim().replace(/\/+$/, '')
  const GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY

  if (!EVOLUTION_URL || !GLOBAL_API_KEY) {
    return NextResponse.json({ error: 'Evolution API not configured' }, { status: 500 })
  }

  // TELEMETRY: Log that the worker was invoked
  await supabase.from('webhook_logs').insert({
    event_type: 'worker_tick',
    processed: true,
    payload: { forceMode, time: new Date().toISOString() }
  })

  // 1. Activate any scheduled campaigns that are now due
  await supabase
    .from('campaigns')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  // 2. Fetch active campaigns (up to 20) and filter in JS — PostgREST cannot compare
  //    two columns in the same row (sent_count < total_contacts), so we do it here.
  const { data: activeCampaigns } = await supabase
    .from('campaigns')
    .select('*, whatsapp_instances(instance_name, status)')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(20)

  if (!activeCampaigns || activeCampaigns.length === 0) {
    return NextResponse.json({ message: 'No active campaigns' })
  }

  // Auto-complete any campaigns that already sent all messages (stuck in ACTIVE)
  const stale = activeCampaigns.filter(
    (c: any) => c.total_contacts > 0 && c.sent_count >= c.total_contacts
  )
  for (const s of stale) {
    await supabase
      .from('campaigns')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', s.id)
  }

  // Pick the first campaign that still has messages to send
  const campaign = activeCampaigns.find(
    (c: any) => c.total_contacts === 0 || c.sent_count < c.total_contacts
  )

  if (!campaign) {
    return NextResponse.json({ message: 'No active campaigns' })
  }

  if (campaign.whatsapp_instances?.status !== 'open') {
    return NextResponse.json({ message: 'Instance is not connected', id: campaign.id })
  }

  // 4. Check allowed sending hours (Colombia timezone) — SKIP if force mode
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    hour12: false,
  })
  const currentHour = parseInt(formatter.format(new Date()), 10)
  if (!forceMode && (currentHour < campaign.allowed_start_hour || currentHour > campaign.allowed_end_hour)) {
    return NextResponse.json({ 
      message: `Outside of allowed hours — campaign allows ${campaign.allowed_start_hour}:00-${campaign.allowed_end_hour}:00, now: ${currentHour}:00 Colombia time. Use Forzar Envío to override.`,
      blocked: 'hours',
      currentHour 
    })
  }

  // 5. Recover any stuck 'sending' messages from dead/timed-out workers (older than 5 min)
  const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString()
  await supabase
    .from('message_queue')
    .update({ status: 'failed', error_message: 'Worker timeout recovery' })
    .eq('campaign_id', campaign.id)
    .eq('status', 'sending')
    .lt('updated_at', fiveMinsAgo)

  // 6. Fetch exactly ONE pending message (stateless — GitHub Actions loops the rest)
  const { data: queue } = await supabase
    .from('message_queue')
    .select('*, contacts(*)')
    .eq('campaign_id', campaign.id)
    .in('status', ['pending', 'failed'])
    .lt('attempts', 2)
    .order('attempts', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)

  // 7. If no messages left → campaign is complete
  if (!queue || queue.length === 0) {
    await supabase
      .from('campaigns')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', campaign.id)

    // Notify user by email
    try {
      const { data: userAuth } = await supabase.auth.admin.getUserById(campaign.user_id)
      if (userAuth?.user?.email) {
        const { count: sentCount } = await supabase
          .from('message_queue')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('status', 'sent')
        const { count: failedCount } = await supabase
          .from('message_queue')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('status', 'failed')
        await sendCampaignCompletedEmail(
          userAuth.user.email,
          campaign.name || 'Sin Nombre',
          sentCount || 0,
          failedCount || 0
        )
      }
    } catch (e) {
      console.error('Silent error sending completion email', e)
    }

    return NextResponse.json({ message: 'Campaign completed', id: campaign.id, done: true })
  }

  const item = queue[0]

  // 8. Lock this single message to prevent race conditions (Optimistic Locking)
  const { data: lockedRow, error: lockError } = await supabase
    .from('message_queue')
    .update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', item.id)
    .eq('status', item.status) // Must exactly match the status we just read
    .select()

  if (lockError) {
    console.error('Optimistic lock error:', lockError)
  }

  // If we couldn't lock it, another parallel worker already took it. Abort this run smoothly.
  if (!lockedRow || lockedRow.length === 0) {
    console.warn(`Worker yielded on item.id=${item.id}: already locked or missing. lockError=`, lockError)
    return NextResponse.json({ 
      message: 'Collision: Message already being processed by another worker. Yielding.', 
      next_delay_sec: 2 // Short delay to retry another message
    })
  }

  // 9. Personalize message (use cached version if already generated)
  let finalMessage = item.personalized_message
  if (!finalMessage) {
    let msg = campaign.template_message
      .replace(/{{name}}/gi, item.contacts?.name || '')
      .replace(/{{company}}/gi, item.contacts?.company || '')

    if (campaign.ai_enabled) {
      const apiKey = process.env.OPENAI_API_KEY
      if (apiKey) {
        try {
          const aiClient = new OpenAI({ apiKey })
          const prompt = `Tono: ${campaign.ai_tone}. Contexto: ${campaign.ai_context}. Reescribe: "${msg}". Devuelve solo el resultado final directo.`
          const comp = await aiClient.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
          })
          msg = comp.choices[0].message.content || msg
        } catch (e) {
          console.error('AI personalization error', e)
        }
      }
    }

    finalMessage = msg
    await supabase
      .from('message_queue')
      .update({ personalized_message: finalMessage })
      .eq('id', item.id)
  }

  // 10. Send via Evolution API
  try {
    let cleanPhone = (item.contacts?.phone || '').replace(/\D/g, '')
    if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) cleanPhone = '57' + cleanPhone

    const hasMedia = !!campaign.attachment_url
    const safeInstanceName = campaign.whatsapp_instances.instance_name.toLowerCase()
    const endpoint = hasMedia
      ? `/message/sendMedia/${safeInstanceName}`
      : `/message/sendText/${safeInstanceName}`

    const payload = hasMedia
      ? {
          number: cleanPhone,
          mediatype: 'image',
          mimetype: 'image/jpeg',
          caption: finalMessage,
          media: campaign.attachment_url,
        }
      : { number: cleanPhone, text: finalMessage }

    const res = await fetch(`${EVOLUTION_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: GLOBAL_API_KEY },
      body: JSON.stringify(payload),
    })

    const evData = await res.json()
    if (!res.ok) throw new Error(evData.response?.message || 'Evolution API Error')

    // Mark sent
    await supabase
      .from('message_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attempts: item.attempts + 1,
        evolution_message_id: evData.key?.id,
      })
      .eq('id', item.id)

    await supabase.from('message_logs').insert({
      message_queue_id: item.id,
      event_type: 'sent',
      evolution_response: evData,
    })

    // Update campaign sent counter
    const newSentCount = campaign.sent_count + 1
    const remaining = campaign.total_contacts - newSentCount

    await supabase
      .from('campaigns')
      .update({ sent_count: newSentCount })
      .eq('id', campaign.id)

    // Calculate exact delay for the NEXT message (in seconds)
    let nextDelaySec = 0;
    if (remaining > 0) {
      const isLongPause = campaign.pause_every > 0 && newSentCount % campaign.pause_every === 0;
      if (isLongPause) {
        const pmin = campaign.pause_min || 180;
        const pmax = campaign.pause_max || 480;
        nextDelaySec = Math.floor(Math.random() * (pmax - pmin + 1) + pmin);
      } else {
        const dmin = campaign.delay_min || 45;
        const dmax = campaign.delay_max || 90;
        nextDelaySec = Math.floor(Math.random() * (dmax - dmin + 1) + dmin);
      }
    }

    // If this was the last message, complete the campaign IMMEDIATELY
    // Don't wait for next worker call — prevents ACTIVE hijacking of future campaigns
    if (remaining <= 0) {
      await supabase
        .from('campaigns')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', campaign.id)

      return NextResponse.json({
        message: 'Message sent',
        phone: cleanPhone,
        campaign: campaign.name,
        remaining: 0,
        done: true,
        note: 'Campaign completed — all messages sent',
        next_delay_sec: 0,
      })
    }

    return NextResponse.json({
      message: 'Message sent',
      phone: cleanPhone,
      campaign: campaign.name,
      remaining,
      next_delay_sec: nextDelaySec,
    })
  } catch (err: any) {
    // Mark failed — first attempt returns to 'pending' for one retry, second attempt is permanent failure
    const newAttempts = item.attempts + 1
    await supabase
      .from('message_queue')
      .update({
        status: newAttempts >= 2 ? 'failed' : 'pending',
        error_message: err.message,
        updated_at: new Date().toISOString(),
        attempts: newAttempts,
      })
      .eq('id', item.id)

    await supabase.from('message_logs').insert({
      message_queue_id: item.id,
      event_type: 'failed',
      evolution_response: { error: err.message },
    })

    return NextResponse.json({ message: 'Send failed', error: err.message }, { status: 200 })
  }
}
