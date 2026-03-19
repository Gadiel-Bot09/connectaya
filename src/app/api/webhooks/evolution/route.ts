import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendInstanceDisconnectedEmail } from '@/utils/email'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    const payload = await request.json()
    const event = payload.event
    const instanceName = payload.instance

    await supabase.from('webhook_logs').insert({
      event_type: event,
      payload: payload,
      processed: true
    })

    if (event === 'CONNECTION_UPDATE') {
      const state = payload.data?.state
      if (state) {
        let statusToSave = 'disconnected'
        if (state === 'open') statusToSave = 'open'
        else if (state === 'connecting') statusToSave = 'connecting'
        else statusToSave = 'close'

        const { data: instance } = await supabase.from('whatsapp_instances').select('user_id, display_name').eq('instance_name', instanceName).single()
        await supabase.from('whatsapp_instances').update({ status: statusToSave }).eq('instance_name', instanceName)

        if (statusToSave === 'close' && instance?.user_id) {
           const { data: userAuth } = await supabase.auth.admin.getUserById(instance.user_id)
           if (userAuth?.user?.email) {
               await sendInstanceDisconnectedEmail(userAuth.user.email, instance.display_name || instanceName)
           }
        }
      }
    }

    if (event === 'MESSAGES_UPDATE') {
      const status = payload.data?.status
      const msgId = payload.data?.key?.id

      if (msgId && status) {
        const { data: q } = await supabase.from('message_queue').select('id').eq('evolution_message_id', msgId).single()
        
        if (q) {
           await supabase.from('message_logs').insert({
              message_queue_id: q.id,
              event_type: status.toLowerCase(),
              evolution_response: payload.data
           })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
