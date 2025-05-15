import { supabase } from "@/lib/supabase"

export interface Event {
  id: string
  title: string
  description: string
  location: string
  start_date: string
  end_date: string
  image_url: string | null
  campus_id: string | null
  organizer_id: string
  created_at: string
}

export interface GetEventsParams {
  campusId?: string | null
  upcoming?: boolean
  limit?: number
}

export async function getEvents({ campusId, upcoming = false, limit = 10 }: GetEventsParams): Promise<Event[]> {
  try {
    let query = supabase.from("events").select("*")
    
    if (campusId) {
      query = query.eq("campus_id", campusId)
    }
    
    if (upcoming) {
      const today = new Date().toISOString()
      query = query.gte("start_date", today)
    }
    
    const { data, error } = await query
      .order("start_date", { ascending: true })
      .limit(limit)
    
    if (error) throw error
    
    return data as Event[]
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

// Make sure there's a default export as well
export default {
  getEvents
} 