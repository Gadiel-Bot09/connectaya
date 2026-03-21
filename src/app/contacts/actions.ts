'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createContact(formData: FormData) {
   const supabase = createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return { error: 'No autorizado' }

   const name = formData.get('name') as string
   const phone = formData.get('phone') as string
   const company = formData.get('company') as string
   const city = formData.get('city') as string
   const email = formData.get('email') as string

   if (!name || !phone) return { error: 'Nombre y teléfono son obligatorios' }

   // Basic E.164 sanitization (keep only digits)
   const cleanPhone = phone.replace(/[^0-9]/g, '')
   
   try {
     const { error } = await supabase.from('contacts').insert({
       user_id: user.id,
       name,
       phone: cleanPhone,
       company: company || null,
       city: city || null,
       email: email || null
     })

     if (error) {
        if (error.code === '23505') return { error: 'Este número de teléfono ya existe en tus contactos' }
        throw error
     }

     revalidatePath('/contacts')
     return { success: true }
   } catch(e: any) {
     return { error: e.message }
   }
}

export async function deleteContact(id: string) {
   const supabase = createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return { error: 'No autorizado' }

   try {
     // Soft-delete to preserve Campaign historical logs and referential integrity
     const { error } = await supabase.from('contacts').update({ is_active: false }).eq('id', id).eq('user_id', user.id)
     if (error) throw error
     
     revalidatePath('/contacts')
     return { success: true }
   } catch(e: any) {
     return { error: e.message }
   }
}

export async function createContactsBulk(contactsData: any[]) {
   const supabase = createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return { error: 'No autorizado' }

   const formatted = contactsData.filter(c => c.name && c.phone).map(c => {
      let customFields = {}
      if (c.custom_fields) {
         try { customFields = JSON.parse(c.custom_fields) } catch(e){}
      }
      return {
        user_id: user.id,
        name: c.name,
        phone: String(c.phone).replace(/[^0-9]/g, ''),
        company: c.company || null,
        city: c.city || null,
        email: c.email || null,
        tags: c.tags ? String(c.tags).split(',').map(t => t.trim()) : [],
        custom_fields: customFields
      }
   })

   if (formatted.length === 0) return { error: 'El archivo CSV no contiene datos válidos o faltan columnas obligatorias (name, phone)' }

   try {
     const { error } = await supabase.from('contacts').upsert(formatted, {
        onConflict: 'user_id,phone',
        ignoreDuplicates: true 
     })
     if (error) throw error
     
     revalidatePath('/contacts')
     return { success: true, count: formatted.length }
   } catch(e: any) {
     return { error: e.message }
   }
}
