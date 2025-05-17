import { supabase } from "@/lib/supabase"
import type { Review } from "@/types"

export async function getReviewsForUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        reviewer:reviewer_id(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data as (Review & { reviewer: any })[]
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return []
  }
}

export async function getReviewsForListing(listingId: string | number) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        reviewer:reviewer_id(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data as (Review & { reviewer: any })[]
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return []
  }
}

export async function getReviewsForAccommodation(accommodationId: string | number) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        reviewer:reviewer_id(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("accommodation_id", accommodationId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data as (Review & { reviewer: any })[]
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return []
  }
}

export async function createReview(review: Partial<Review>) {
  try {
    const { data, error } = await supabase.from("reviews").insert(review).select().single()

    if (error) throw error

    return data as Review
  } catch (error) {
    console.error("Error creating review:", error)
    throw error
  }
}

export async function updateReview(id: string | number, updates: Partial<Review>) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return data as Review
  } catch (error) {
    console.error("Error updating review:", error)
    throw error
  }
}

export async function deleteReview(id: string | number) {
  try {
    const { error } = await supabase.from("reviews").delete().eq("id", id)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error deleting review:", error)
    throw error
  }
}

export async function getUserRating(userId: string) {
  try {
    const { data, error, count } = await supabase
      .from("reviews")
      .select("rating", { count: "exact" })
      .eq("reviewee_id", userId)

    if (error) throw error

    if (!data || data.length === 0) {
      return { rating: 0, count: 0 }
    }

    const totalRating = data.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / data.length

    return { rating: averageRating, count: count || 0 }
  } catch (error) {
    console.error("Error fetching user rating:", error)
    return { rating: 0, count: 0 }
  }
}

export async function getListingRating(listingId: string | number) {
  try {
    const { data, error, count } = await supabase
      .from("reviews")
      .select("rating", { count: "exact" })
      .eq("listing_id", listingId)

    if (error) throw error

    if (!data || data.length === 0) {
      return { rating: 0, count: 0 }
    }

    const totalRating = data.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / data.length

    return { rating: averageRating, count: count || 0 }
  } catch (error) {
    console.error("Error fetching listing rating:", error)
    return { rating: 0, count: 0 }
  }
}

export async function getAccommodationRating(accommodationId: string | number) {
  try {
    const { data, error, count } = await supabase
      .from("reviews")
      .select("rating", { count: "exact" })
      .eq("accommodation_id", accommodationId)

    if (error) throw error

    if (!data || data.length === 0) {
      return { rating: 0, count: 0 }
    }

    const totalRating = data.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / data.length

    return { rating: averageRating, count: count || 0 }
  } catch (error) {
    console.error("Error fetching accommodation rating:", error)
    return { rating: 0, count: 0 }
  }
}
