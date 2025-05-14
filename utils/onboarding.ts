import AsyncStorage from "@react-native-async-storage/async-storage"

const ONBOARDING_COMPLETE_KEY = "onboarding_complete"
const USER_PREFERENCES_KEY = "user_preferences"

export interface UserPreferences {
  categories?: string[]
  notificationsEnabled?: boolean
  darkModePreference?: "system" | "light" | "dark"
  locationEnabled?: boolean
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
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const value = await AsyncStorage.getItem(USER_PREFERENCES_KEY)
  return value ? JSON.parse(value) : {}
}
