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
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`
    
    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
       return NextResponse.json({ error: data.error_message || data.status }, { status: 400 })
    }

    if (data.status === 'ZERO_RESULTS') {
       return NextResponse.json({ results: [] })
    }

    const results = data.results.map((r: any) => ({
       place_id: r.place_id,
       name: r.name,
       address: r.formatted_address,
       rating: r.rating,
       types: r.types,
       lat: r.geometry?.location?.lat,
       lng: r.geometry?.location?.lng
    }))

    // Fetch details for top 15 results to get phone numbers
    const placesWithDetails = await Promise.all(results.slice(0, 15).map(async (place: any) => {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website&key=${API_KEY}`
        const detailsRes = await fetch(detailsUrl)
        const detailsData = await detailsRes.json()
        
        return {
           ...place,
           phone: detailsData.result?.formatted_phone_number || null,
           website: detailsData.result?.website || null
        }
    }))

    // Return only places with phone numbers, since this is for WhatsApp marketing
    const validPlaces = placesWithDetails.filter(p => p.phone)

    return NextResponse.json({ results: validPlaces })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
