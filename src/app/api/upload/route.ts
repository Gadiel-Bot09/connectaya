import { NextResponse } from 'next/server'
import { uploadFileToMinio } from '@/utils/s3'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Sanitize filename replacing spaces and weird characters
    const ext = file.name.split('.').pop() || 'tmp'
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    const url = await uploadFileToMinio(buffer, safeName, file.type)

    return NextResponse.json({ url })

  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
