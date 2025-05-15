import { supabase } from "@/lib/supabase"
import type { Accommodation, AccommodationType } from "@/types"

export async function getRecentAccommodations(campusId?: string | number) {
  try {
    let query = supabase
      .from("accommodations")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(10)

    if (campusId) {
      query = query.eq("campus_id", campusId)
    }

    const { data, error } = await query

    if (error) throw error

    return data as Accommodation[]
  } catch (error) {
    console.error("Error fetching recent accommodations:", error)
    return []
  }
}

export async function getAccommodations({
  typeId,
  searchQuery,
  campusId,
}: {
  typeId?: string | number
  searchQuery?: string
  campusId?: string | number
}) {
  try {
    let query = supabase
      .from("accommodations")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false })

    if (typeId) {
      query = query.eq("type_id", typeId)
    }

    if (campusId) {
      query = query.eq("campus_id", campusId)
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return data as Accommodation[]
  } catch (error) {
    console.error("Error fetching accommodations:", error)
    return []
  }
}

export async function getAccommodationById(id: string | number) {
  try {
    const { data, error } = await supabase
      .from("accommodations")
      .select(`
        *,
        landlord:user_id (
          id,
          first_name,
          last_name,
          avatar_url,
          is_verified
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return data as Accommodation & { landlord: any }
  } catch (error) {
    console.error("Error fetching accommodation:", error)
    return null
  }
}

export async function getAccommodationTypes() {
  try {
    const { data, error } = await supabase.from("accommodation_types").select("*").order("name")

    if (error) throw error

    return data as AccommodationType[]
  } catch (error) {
    console.error("Error fetching accommodation types:", error)
    return []
  }
}

export async function createAccommodation(accommodation: Partial<Accommodation>) {
  try {
    const { data, error } = await supabase.from("accommodations").insert(accommodation).select().single()

    if (error) throw error

    return data as Accommodation
  } catch (error) {
    console.error("Error creating accommodation:", error)
    throw error
  }
}

export async function updateAccommodation(id: string | number, updates: Partial<Accommodation>) {
  try {
    const { data, error } = await supabase.from("accommodations").update(updates).eq("id", id).select().single()

    if (error) throw error

    return data as Accommodation
  } catch (error) {
    console.error("Error updating accommodation:", error)
    throw error
  }
}

export async function deleteAccommodation(id: string | number) {
  try {
    const { error } = await supabase.from("accommodations").delete().eq("id", id)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error deleting accommodation:", error)
    throw error
  }
}
