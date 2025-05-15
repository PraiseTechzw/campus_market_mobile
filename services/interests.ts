import { supabase } from "@/lib/supabase"
import type { UserInterest } from "@/types"

export async function getUserInterests(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_interests")
      .select(`
        *,
        category:category_id(*),
        accommodation_type:accommodation_type_id(*)
      `)
      .eq("user_id", userId)

    if (error) throw error

    return data as UserInterest[]
  } catch (error) {
    console.error("Error fetching user interests:", error)
    return []
  }
}

export async function addUserInterest(interest: Partial<UserInterest>) {
  try {
    // Check if interest already exists
    const { data: existingInterest, error: checkError } = await supabase
      .from("user_interests")
      .select("id")
      .eq("user_id", interest.user_id)
      .eq(
        interest.category_id ? "category_id" : "accommodation_type_id",
        interest.category_id || interest.accommodation_type_id,
      )
      .maybeSingle()

    if (checkError) throw checkError

    if (existingInterest) {
      return existingInterest as UserInterest
    }

    const { data, error } = await supabase.from("user_interests").insert(interest).select().single()

    if (error) throw error

    return data as UserInterest
  } catch (error) {
    console.error("Error adding user interest:", error)
    throw error
  }
}

export async function removeUserInterest(id: string | number) {
  try {
    const { error } = await supabase.from("user_interests").delete().eq("id", id)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error removing user interest:", error)
    throw error
  }
}
