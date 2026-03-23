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
   const tagsRaw = formData.get('tags') as string

   if (!name || !phone) return { error: 'Nombre y teléfono son obligatorios' }

   // Basic E.164 sanitization (keep only digits)
   const cleanPhone = phone.replace(/[^0-9]/g, '')
   // Parse comma-separated tags into array, filter empty strings
   const tags = tagsRaw
     ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
     : []
   
   try {
     const { error } = await supabase.from('contacts').insert({
       user_id: user.id,
       name,
       phone: cleanPhone,
       company: company || null,
       city: city || null,
       email: email || null,
       tags,
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

/**
 * Checks which of the given normalized phones already exist in the user's contacts.
 * Returns an array of existing phone strings.
 */
export async function checkDuplicatePhones(phones: string[]): Promise<{ existing: string[], error?: string }> {
   const supabase = createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return { existing: [], error: 'No autorizado' }

   if (!phones.length) return { existing: [] }

   const { data, error } = await supabase
     .from('contacts')
     .select('phone')
     .eq('user_id', user.id)
     .eq('is_active', true)
     .in('phone', phones)

   if (error) return { existing: [], error: error.message }

   return { existing: (data || []).map(c => c.phone) }
}

/**
 * Updates the label assigned to a contact (replaces any previous label with a new one).
 * Only replaces the "label" portion of tags (i.e., tags that exist in the labels table).
 * Auto-generated tags like 'maps_import' are no longer stored, so this is a full reset.
 */
export async function updateContactLabels(contactId: string, labelName: string) {
   const supabase = createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return { error: 'No autorizado' }

   // The new tags array: just the label (or empty if cleared)
   const newTags = labelName ? [labelName] : []

   const { error } = await supabase
     .from('contacts')
     .update({ tags: newTags })
     .eq('id', contactId)
     .eq('user_id', user.id)

   if (error) return { error: error.message }

   revalidatePath('/contacts')
   return { success: true }
}

export async function updateContact(id: string, formData: FormData) {
   const supabase = createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return { error: 'No autorizado' }

   const name    = formData.get('name')    as string
   const phone   = formData.get('phone')   as string
   const company = formData.get('company') as string
   const city    = formData.get('city')    as string
   const email   = formData.get('email')   as string

   if (!name || !phone) return { error: 'Nombre y telefono son obligatorios' }

   const cleanPhone = phone.replace(/[^0-9]/g, '')

   try {
     const { error } = await supabase
       .from('contacts')
       .update({
         name,
         phone: cleanPhone,
         company: company || null,
         city:    city    || null,
         email:   email   || null,
       })
       .eq('id', id)
       .eq('user_id', user.id)

     if (error) {
       if (error.code === '23505') return { error: 'Ese numero ya existe en otro contacto' }
       throw error
     }

     revalidatePath('/contacts')
     return { success: true }
   } catch(e: any) {
     return { error: e.message }
   }
}
