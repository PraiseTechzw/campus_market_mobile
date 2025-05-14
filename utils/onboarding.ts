import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "@/lib/supabase"

const ONBOARDING_COMPLETE_KEY = "onboarding_complete"
const USER_PREFERENCES_KEY = "user_preferences"

export interface UserPreferences {
  categories?: string[]
  notificationsEnabled?: boolean
  darkModePreference?: "system" | "light" | "dark"
  locationEnabled?: boolean
  accommodationPreferences?: {
    type?: string[]
    priceRange?: {
      min: number
      max: number
    }
    amenities?: string[]
    location?: string[]
  }
  academicInfo?: {
    institution?: string
    course?: string
    year?: string
  }
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true")
}

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)
  return value === "true"
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY)
}

export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  const currentPrefs = await getUserPreferences()
  const updatedPrefs = { ...currentPrefs, ...preferences }
  await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(updatedPrefs))
  
  // Save to database if user is authenticated
  const { data: session } = await supabase.auth.getSession()
  if (session?.session?.user?.id) {
    try {
      // Update user_settings table with preferences
      await supabase
        .from("user_settings")
        .update({
          notification_preferences: {
            email: preferences.notificationsEnabled ?? true,
            push: preferences.notificationsEnabled ?? true,
            messages: true,
            orders: true,
            marketing: false
          },
          theme: preferences.darkModePreference || "system",
          preferences: updatedPrefs
        })
        .eq("id", session.session.user.id)
    } catch (error) {
      console.error("Error saving preferences to database:", error)
    }
  }
}

export async function getUserPreferences(): Promise<UserPreferences> {
  // First check local storage
  const value = await AsyncStorage.getItem(USER_PREFERENCES_KEY)
  const localPrefs = value ? JSON.parse(value) : {}
  
  // Then check if there are database preferences (if authenticated)
  const { data: session } = await supabase.auth.getSession()
  if (session?.session?.user?.id) {
    try {
      const { data } = await supabase
        .from("user_settings")
        .select("preferences")
        .eq("id", session.session.user.id)
        .single()
      
      if (data?.preferences) {
        // Merge local and database preferences, with database taking priority
        return { ...localPrefs, ...data.preferences }
      }
    } catch (error) {
      console.error("Error fetching preferences from database:", error)
    }
  }
  
  return localPrefs
}
