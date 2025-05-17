"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export default function NotificationPreferencesScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [preferences, setPreferences] = useState({
    messages: true,
    listings: true,
    accommodations: true,
    events: true,
    system: true,
    promotions: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      loadPreferences()
    }
  }, [session])

  const loadPreferences = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("user_preferences")
        .select("notification_preferences")
        .eq("user_id", session.user.id)
        .single()

      if (error) throw error

      if (data && data.notification_preferences) {
        setPreferences({
          ...preferences,
          ...data.notification_preferences
        })
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!session?.user?.id) return
    
    try {
      setIsSaving(true)
      
      const { data, error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: session.user.id,
          notification_preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) throw error

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] })
      
    } catch (error) {
      console.error("Error saving notification preferences:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      return updated
    })
  }

  const handleSave = () => {
    savePreferences()
  }

  useEffect(() => {
    // Save preferences when they change, with debounce
    const timeoutId = setTimeout(() => {
      if (!isLoading) savePreferences()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [preferences])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notification Preferences",
          headerShown: true,
          headerShadowVisible: false,
          headerTitleStyle: styles.headerTitle,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <Text style={styles.description}>
          Select which notifications you'd like to receive. You can change these settings at any time.
        </Text>
        
        <View style={styles.section}>
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceName}>Messages</Text>
              <Text style={styles.preferenceDescription}>Notifications for new messages and chat updates</Text>
            </View>
            <Switch
              value={preferences.messages}
              onValueChange={() => handleToggle('messages')}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.messages ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceName}>Marketplace Listings</Text>
              <Text style={styles.preferenceDescription}>Updates on items you're interested in and saved listings</Text>
            </View>
            <Switch
              value={preferences.listings}
              onValueChange={() => handleToggle('listings')}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.listings ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceName}>Accommodation Updates</Text>
              <Text style={styles.preferenceDescription}>Notifications for new listings and saved accommodations</Text>
            </View>
            <Switch
              value={preferences.accommodations}
              onValueChange={() => handleToggle('accommodations')}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.accommodations ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceName}>Events</Text>
              <Text style={styles.preferenceDescription}>Upcoming events, reminders, and updates</Text>
            </View>
            <Switch
              value={preferences.events}
              onValueChange={() => handleToggle('events')}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.events ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceName}>System Updates</Text>
              <Text style={styles.preferenceDescription}>Notifications about your account and app updates</Text>
            </View>
            <Switch
              value={preferences.system}
              onValueChange={() => handleToggle('system')}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.system ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceName}>Promotions & Offers</Text>
              <Text style={styles.preferenceDescription}>Special offers and promotional information</Text>
            </View>
            <Switch
              value={preferences.promotions}
              onValueChange={() => handleToggle('promotions')}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.promotions ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          Note: Some important system notifications may still be sent regardless of your preferences.
        </Text>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  preferenceInfo: {
    flex: 1,
    paddingRight: 12,
  },
  preferenceName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    color: "#666",
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  note: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 40,
  },
}) 