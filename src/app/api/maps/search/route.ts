import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  
  if (!query) return NextResponse.json({ error: 'Falta parámetro query' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let API_KEY = process.env.NEXT_PUBLIC_GMAPS_API || process.env.NEXT_PUBLIC_GMAPS_API_KEY || process.env.GMAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY
  if (!API_KEY) {
     const { data: settings } = await supabase.from('user_settings').select('gmaps_api_key_encrypted').eq('user_id', user.id).single()
     API_KEY = settings?.gmaps_api_key_encrypted
  }
  if (!API_KEY) return NextResponse.json({ error: 'API Key de Google Maps no configurada en las variables de entorno o en los Ajustes Base' }, { status: 500 })

  const limitParam = parseInt(searchParams.get('limit') || '20', 10)
  const maxLimit = Math.min(limitParam, 200) // Hard cap at 200 to protect quota
  
  let allValidPlaces: any[] = []
  let pageToken: string | undefined = undefined

  try {
    while (allValidPlaces.length < maxLimit) {
      const body: any = {
        textQuery: query,
        languageCode: 'es',
        pageSize: 20
      }
      if (pageToken) body.pageToken = pageToken

      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.types,places.location,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,nextPageToken'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
         return NextResponse.json({ error: data.error?.message || 'Error de Google Places API (New)' }, { status: 400 })
      }

      if (!data.places || data.places.length === 0) break

      const results = data.places.map((p: any) => ({
         place_id: p.id,
         name: p.displayName?.text,
         address: p.formattedAddress,
         rating: p.rating,
         types: p.types,
         lat: p.location?.latitude,
         lng: p.location?.longitude,
         phone: p.internationalPhoneNumber || p.nationalPhoneNumber || null,
         hasPhone: !!(p.internationalPhoneNumber || p.nationalPhoneNumber),
         website: p.websiteUri || null
      }))

      // Include ALL results (with and without phone), deduplicate by place_id
      for (const place of results) {
         if (!allValidPlaces.find((exist: any) => exist.place_id === place.place_id)) {
            allValidPlaces.push(place)
         }
      }

      pageToken = data.nextPageToken
      if (!pageToken) break // No more pages from Google
    }

    return NextResponse.json({ results: allValidPlaces.slice(0, maxLimit) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
