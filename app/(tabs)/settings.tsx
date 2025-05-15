"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useToast } from "@/providers/toast-provider"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { getUserPreferences, updateUserPreferences } from "@/services/preferences"
import type { UserPreferences } from "@/types"
import Colors from "@/constants/Colors"

export default function SettingsScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const toast = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  useEffect(() => {
    if (session) {
      loadPreferences()
    }
  }, [session])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const prefs = await getUserPreferences(session!.user.id)
      setPreferences(prefs)
    } catch (error) {
      console.error("Error loading preferences:", error)
      toast.show({
        type: "error",
        title: "Error",
        message: "Failed to load preferences. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = (value: UserPreferences["theme_preference"]) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      theme_preference: value,
    })
  }

  const handleNotificationToggle = (key: keyof UserPreferences["notification_preferences"]) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      notification_preferences: {
        ...preferences.notification_preferences,
        [key]: !preferences.notification_preferences[key],
      },
    })
  }

  const savePreferences = async () => {
    if (!preferences || !session) return

    try {
      setSaving(true)
      await updateUserPreferences(session.user.id, preferences)
      toast.show({
        type: "success",
        title: "Success",
        message: "Your preferences have been saved.",
      })
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast.show({
        type: "error",
        title: "Error",
        message: "Failed to save preferences. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.optionContainer}>
            <TouchableOpacity
              style={[styles.themeOption, preferences?.theme_preference === "light" && styles.selectedThemeOption]}
              onPress={() => handleThemeChange("light")}
            >
              <Ionicons
                name="sunny"
                size={24}
                color={
                  preferences?.theme_preference === "light"
                    ? Colors[colorScheme ?? "light"].background
                    : Colors[colorScheme ?? "light"].text
                }
              />
              <Text style={[styles.themeText, preferences?.theme_preference === "light" && styles.selectedThemeText]}>
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, preferences?.theme_preference === "dark" && styles.selectedThemeOption]}
              onPress={() => handleThemeChange("dark")}
            >
              <Ionicons
                name="moon"
                size={24}
                color={
                  preferences?.theme_preference === "dark"
                    ? Colors[colorScheme ?? "light"].background
                    : Colors[colorScheme ?? "light"].text
                }
              />
              <Text style={[styles.themeText, preferences?.theme_preference === "dark" && styles.selectedThemeText]}>
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, preferences?.theme_preference === "system" && styles.selectedThemeOption]}
              onPress={() => handleThemeChange("system")}
            >
              <Ionicons
                name="phone-portrait"
                size={24}
                color={
                  preferences?.theme_preference === "system"
                    ? Colors[colorScheme ?? "light"].background
                    : Colors[colorScheme ?? "light"].text
                }
              />
              <Text style={[styles.themeText, preferences?.theme_preference === "system" && styles.selectedThemeText]}>
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="message" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.settingText}>Messages</Text>
            </View>
            <Switch
              value={preferences?.notification_preferences.messages}
              onValueChange={() => handleNotificationToggle("messages")}
              trackColor={{ false: "#767577", true: Colors.light.tint }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="shopping-bag" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.settingText}>Marketplace Listings</Text>
            </View>
            <Switch
              value={preferences?.notification_preferences.listings}
              onValueChange={() => handleNotificationToggle("listings")}
              trackColor={{ false: "#767577", true: Colors.light.tint }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="apartment" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.settingText}>Accommodation Updates</Text>
            </View>
            <Switch
              value={preferences?.notification_preferences.accommodations}
              onValueChange={() => handleNotificationToggle("accommodations")}
              trackColor={{ false: "#767577", true: Colors.light.tint }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="event" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.settingText}>Events</Text>
            </View>
            <Switch
              value={preferences?.notification_preferences.events}
              onValueChange={() => handleNotificationToggle("events")}
              trackColor={{ false: "#767577", true: Colors.light.tint }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/edit")}>
            <View style={styles.menuItemContent}>
              <MaterialIcons name="person" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/verify")}>
            <View style={styles.menuItemContent}>
              <MaterialIcons name="verified-user" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.menuItemText}>Verification Status</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/settings/change-password")}>
            <View style={styles.menuItemContent}>
              <MaterialIcons name="lock" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.menuItemText}>Change Password</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders & Payments</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/orders")}>
            <View style={styles.menuItemContent}>
              <MaterialIcons name="shopping-cart" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.menuItemText}>My Orders</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/settings/payment-methods")}>
            <View style={styles.menuItemContent}>
              <MaterialIcons name="credit-card" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.menuItemText}>Payment Methods</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/settings/help")}>
            <View style={styles.menuItemContent}>
              <MaterialIcons name="help" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.menuItemText}>Help Center</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/settings/report")}>
            <View style={styles.menuItemContent}>
              <MaterialIcons name="report-problem" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.menuItemText}>Report a Problem</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/settings/about")}>
            <View style={styles.menuItemContent}>
              <MaterialIcons name="info" size={24} color={Colors[colorScheme ?? "light"].text} />
              <Text style={styles.menuItemText}>About UniConnect</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={savePreferences} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  optionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedThemeOption: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  themeText: {
    marginTop: 8,
    fontSize: 14,
  },
  selectedThemeText: {
    color: "#fff",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
