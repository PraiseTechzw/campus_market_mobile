import { supabase } from "@/lib/supabase"
import type { Favorite } from "@/types"

export async function getFavorites(userId: string) {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select(`
        *,
        listing:listing_id(*),
        accommodation:accommodation_id(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data as Favorite[]
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return []
  }
}

export async function addToFavorites(favorite: Partial<Favorite>) {
  try {
    // Check if already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", favorite.user_id)
      .eq(favorite.listing_id ? "listing_id" : "accommodation_id", favorite.listing_id || favorite.accommodation_id)
      .maybeSingle()

    if (checkError) throw checkError

    if (existingFavorite) {
      return existingFavorite as Favorite
    }

    const { data, error } = await supabase.from("favorites").insert(favorite).select().single()

    if (error) throw error

    return data as Favorite
  } catch (error) {
    console.error("Error adding to favorites:", error)
    throw error
  }
}

export async function removeFromFavorites(id: string | number) {
  try {
    const { error } = await supabase.from("favorites").delete().eq("id", id)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error removing from favorites:", error)
    throw error
  }
}

export async function checkIfFavorite(userId: string, listingId?: string | number, accommodationId?: string | number) {
  try {
    let query = supabase.from("favorites").select("id").eq("user_id", userId)

    if (listingId) {
      query = query.eq("listing_id", listingId)
    } else if (accommodationId) {
      query = query.eq("accommodation_id", accommodationId)
    } else {
      throw new Error("Either listingId or accommodationId must be provided")
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw error

    return data ? { isFavorite: true, favoriteId: data.id } : { isFavorite: false, favoriteId: null }
  } catch (error) {
    console.error("Error checking favorite status:", error)
    return { isFavorite: false, favoriteId: null }
  }
}
