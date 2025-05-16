import { supabase } from "@/lib/supabase"
import type { Event } from "@/types"

export async function getEvents({
  campusId,
  upcoming = true,
  limit = 10,
  offset = 0,
}: {
  campusId?: string
  upcoming?: boolean
  limit?: number
  offset?: number
}): Promise<Event[]> {
  let query = supabase
    .from("events")
    .select(
      `
      *,
      profiles:organizer_id(id, first_name, last_name, avatar_url),
      campuses:campus_id(id, name)
    `,
    )
    .order("start_date", { ascending: upcoming })

  if (campusId) {
    query = query.eq("campus_id", campusId)
  }

  if (upcoming) {
    query = query.gte("start_date", new Date().toISOString())
  }

  const { data, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching events:", error)
    throw error
  }

  return data as unknown as Event[]
}

export async function getEventById(id: string): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      profiles:organizer_id(id, first_name, last_name, avatar_url),
      campuses:campus_id(id, name),
      event_participants(*)
    `,
    )
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching event:", error)
    throw error
  }

  return data as unknown as Event
}

export async function createEvent(event: Partial<Event>): Promise<Event> {
  try {
    // Log what we're trying to create
    console.log('Attempting to create event with data:', JSON.stringify(event, null, 2))
    
    // Make sure required fields are present
    if (!event.title) throw new Error('Event title is required')
    if (!event.location) throw new Error('Event location is required') 
    if (!event.campus_id) throw new Error('Campus ID is required')
    if (!event.organizer_id) throw new Error('Organizer ID is required')
    if (!event.start_date) throw new Error('Start date is required')
    if (!event.end_date) throw new Error('End date is required')
    
    // Check date formats
    try {
      new Date(event.start_date)
      new Date(event.end_date)
    } catch (e) {
      throw new Error('Invalid date format')
    }
    
    const { data, error } = await supabase.from("events").insert(event).select().single()

    if (error) {
      console.error("Supabase error creating event:", error)
      // Provide more specific error messages based on error type
      if (error.code === '23503') {
        throw new Error('Foreign key constraint failed - check that campus_id and organizer_id exist')
      } else if (error.code === '23505') {
        throw new Error('An event with this information already exists')
      } else if (error.code === '42501') {
        throw new Error('Permission denied - check RLS policies')
      } else {
        throw new Error(`Database error: ${error.message}`)
      }
    }

    return data as Event
  } catch (err) {
    // Ensure all errors are properly propagated
    console.error("Error in createEvent service:", err)
    throw err
  }
}

export async function updateEvent(id: string, event: Partial<Event>): Promise<Event> {
  const { data, error } = await supabase.from("events").update(event).eq("id", id).select().single()

  if (error) {
    console.error("Error updating event:", error)
    throw error
  }

  return data as Event
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id)

  if (error) {
    console.error("Error deleting event:", error)
    throw error
  }
}

export async function joinEvent(eventId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("event_participants").insert({
    event_id: eventId,
    user_id: userId,
    status: "going",
  })

  if (error) {
    console.error("Error joining event:", error)
    throw error
  }
}

export async function leaveEvent(eventId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("event_participants").delete().eq("event_id", eventId).eq("user_id", userId)

  if (error) {
    console.error("Error leaving event:", error)
    throw error
  }
}

export async function updateEventStatus(
  eventId: string,
  userId: string,
  status: "going" | "maybe" | "not_going",
): Promise<void> {
  const { error } = await supabase
    .from("event_participants")
    .update({ status })
    .eq("event_id", eventId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error updating event status:", error)
    throw error
  }
}

export async function getEventParticipants(eventId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("event_participants")
    .select(
      `
      *,
      profiles:user_id(id, first_name, last_name, avatar_url)
    `,
    )
    .eq("event_id", eventId)

  if (error) {
    console.error("Error fetching event participants:", error)
    throw error
  }

  return data
}
