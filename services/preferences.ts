import { supabase } from "@/lib/supabase"
import type { UserPreferences } from "@/types"

const DEFAULT_PREFERENCES: Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at"> = {
  theme_preference: "system",
  notification_preferences: {
    messages: true,
    listings: true,
    accommodations: true,
    events: true,
  },
  language_preference: "en",
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

  if (error) {
    if (error.code === "PGRST116") {
      // No preferences found, create default preferences
      return createUserPreferences(userId)
    }
    console.error("Error fetching user preferences:", error)
    throw error
  }

  return data
}

export async function createUserPreferences(userId: string): Promise<UserPreferences> {
  const newPreferences = {
    user_id: userId,
    ...DEFAULT_PREFERENCES,
  }

  const { data, error } = await supabase.from("user_preferences").insert(newPreferences).select().single()

  if (error) {
    console.error("Error creating user preferences:", error)
    throw error
  }

  return data
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const updates = {
    ...preferences,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating user preferences:", error)
    throw error
  }

  return data
}
