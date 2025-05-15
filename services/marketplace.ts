import { supabase } from "@/lib/supabase"
import type { Listing, ListingCategory } from "@/types"

export async function getRecentListings(campusId?: string | number) {
  try {
    let query = supabase
      .from("listings")
      .select("*")
      .eq("is_sold", false)
      .order("created_at", { ascending: false })
      .limit(10)

    if (campusId) {
      query = query.eq("campus_id", campusId)
    }

    const { data, error } = await query

    if (error) throw error

    return data as Listing[]
  } catch (error) {
    console.error("Error fetching recent listings:", error)
    return []
  }
}

export async function getListings({
  categoryId,
  searchQuery,
  campusId,
}: {
  categoryId?: string | number
  searchQuery?: string
  campusId?: string | number
}) {
  try {
    let query = supabase.from("listings").select("*").eq("is_sold", false).order("created_at", { ascending: false })

    if (categoryId) {
      query = query.eq("category_id", categoryId)
    }

    if (campusId) {
      query = query.eq("campus_id", campusId)
    }

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return data as Listing[]
  } catch (error) {
    console.error("Error fetching listings:", error)
    return []
  }
}

export async function getListingById(id: string | number) {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return data as Listing & { user: any }
  } catch (error) {
    console.error("Error fetching listing:", error)
    return null
  }
}

export async function getListingCategories() {
  try {
    const { data, error } = await supabase.from("listing_categories").select("*").order("name")

    if (error) throw error

    return data as ListingCategory[]
  } catch (error) {
    console.error("Error fetching listing categories:", error)
    return []
  }
}

export async function createListing(listing: Partial<Listing>) {
  try {
    const { data, error } = await supabase.from("listings").insert(listing).select().single()

    if (error) throw error

    return data as Listing
  } catch (error) {
    console.error("Error creating listing:", error)
    throw error
  }
}

export async function updateListing(id: string | number, updates: Partial<Listing>) {
  try {
    const { data, error } = await supabase.from("listings").update(updates).eq("id", id).select().single()

    if (error) throw error

    return data as Listing
  } catch (error) {
    console.error("Error updating listing:", error)
    throw error
  }
}

export async function deleteListing(id: string | number) {
  try {
    const { error } = await supabase.from("listings").delete().eq("id", id)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error deleting listing:", error)
    throw error
  }
}
