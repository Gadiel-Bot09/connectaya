import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  
  if (!query) return NextResponse.json({ error: 'Falta parámetro query' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let API_KEY = process.env.NEXT_PUBLIC_GMAPS_API_KEY || process.env.GMAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY
  if (!API_KEY) {
     const { data: settings } = await supabase.from('user_settings').select('gmaps_api_key_encrypted').eq('user_id', user.id).single()
     API_KEY = settings?.gmaps_api_key_encrypted
  }
  if (!API_KEY) return NextResponse.json({ error: 'API Key de Google Maps no configurada en las variables de entorno o en los Ajustes Base' }, { status: 500 })

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.types,places.location,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri'
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'es'
      })
    })

    const data = await response.json()

    if (!response.ok) {
       return NextResponse.json({ error: data.error?.message || 'Error de Google Places API (New)' }, { status: 400 })
    }

    if (!data.places || data.places.length === 0) {
       return NextResponse.json({ results: [] })
    }

    const results = data.places.map((p: any) => ({
       place_id: p.id,
       name: p.displayName?.text,
       address: p.formattedAddress,
       rating: p.rating,
       types: p.types,
       lat: p.location?.latitude,
       lng: p.location?.longitude,
       phone: p.internationalPhoneNumber || p.nationalPhoneNumber || null,
       website: p.websiteUri || null
    }))

    // Retorna sólo los lugares que tienen un teléfono válido (vital para WhatsApp)
    const validPlaces = results.filter((p: any) => p.phone)

    return NextResponse.json({ results: validPlaces })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
