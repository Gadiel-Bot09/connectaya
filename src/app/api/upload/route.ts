import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createJsClient } from '@supabase/supabase-js'

// POST /api/upload
// Uploads a file to Supabase Storage (no Minio needed)
// Returns the public URL of the uploaded file
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Use service role to bypass storage RLS — needed for cron-triggered sends
    const supabase = serviceKey
      ? createJsClient(supabaseUrl, serviceKey)
      : createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    
    // If service role, skip auth check (background job)
    if (!serviceKey && !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    // Validate file type and size (max 10MB)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo: JPG, PNG, WEBP, GIF' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no puede superar 10MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeName = `campaign-attachments/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase Storage bucket 'attachments'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(safeName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError)
      throw new Error('Error subiendo a Supabase Storage: ' + uploadError.message)
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(safeName)

    return NextResponse.json({ url: publicUrl })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno subiendo la imagen' },
      { status: 500 }
    )
  }
}
