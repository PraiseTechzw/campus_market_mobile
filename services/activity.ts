import { supabase } from "@/lib/supabase"
import type { ActivityFeedItem } from "@/types"

export async function getActivityFeed(campusId?: string | number) {
  try {
    let query = supabase
      .from("activity_feed")
      .select(`
        *,
        listing:listing_id(*),
        accommodation:accommodation_id(*)
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    if (campusId) {
      query = query.eq("campus_id", campusId)
    }

    const { data, error } = await query

    if (error) throw error

    return data as ActivityFeedItem[]
  } catch (error) {
    console.error("Error fetching activity feed:", error)
    return []
  }
}

export async function createActivityFeedItem(item: Partial<ActivityFeedItem>) {
  try {
    const { data, error } = await supabase.from("activity_feed").insert(item).select().single()

    if (error) throw error

    return data as ActivityFeedItem
  } catch (error) {
    console.error("Error creating activity feed item:", error)
    throw error
  }
}
