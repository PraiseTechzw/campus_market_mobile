"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import React from "react"

type NotificationPreference = {
  id?: string
  user_id: string
  messages: boolean
  new_listings: boolean
  price_drops: boolean
  listing_activity: boolean
  special_offers: boolean
  marketing: boolean
}

export default function NotificationsScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [preferences, setPreferences] = useState<NotificationPreference>({
    user_id: session?.user?.id || "",
    messages: true,
    new_listings: true,
    price_drops: true,
    listing_activity: true,
    special_offers: false,
    marketing: false,
  })

  const { data: userPreferences, isLoading } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: getNotificationPreferences,
    enabled: !!session
  })
  
  // Update preferences when data is loaded
  useEffect(() => {
    if (userPreferences) {
      setPreferences(userPreferences)
    }
  }, [userPreferences])

  const updatePreferencesMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] })
    },
  })

  async function getNotificationPreferences(): Promise<NotificationPreference | null> {
    try {
      if (!session) return null
      
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", session.user.id)
        .single()
      
      if (error && error.code !== "PGRST116") { // PGRST116 is the error code for "no rows returned"
        throw error
      }
      
      if (!data) {
        // Return default preferences
        return {
          user_id: session.user.id,
          messages: true,
          new_listings: true,
          price_drops: true,
          listing_activity: true,
          special_offers: false,
          marketing: false,
        }
      }
      
      return data as NotificationPreference
    } catch (error) {
      console.error("Error fetching notification preferences:", error)
      return null
    }
  }

  async function updateNotificationPreferences(prefs: NotificationPreference): Promise<boolean> {
    try {
      if (!session) return false
      
      const { id, ...prefsWithoutId } = prefs
      
      if (id) {
        // Update existing preferences
        const { error } = await supabase
          .from("notification_preferences")
          .update(prefsWithoutId)
          .eq("id", id)
        
        if (error) throw error
      } else {
        // Insert new preferences
        const { error } = await supabase
          .from("notification_preferences")
          .insert([prefsWithoutId])
        
        if (error) throw error
      }
      
      return true
    } catch (error) {
      console.error("Error updating notification preferences:", error)
      return false
    }
  }

  const handleToggle = (key: keyof NotificationPreference) => {
    if (key === "user_id") return
    
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await updatePreferencesMutation.mutateAsync(preferences)
      Alert.alert("Success", "Your notification preferences have been updated successfully")
      router.back()
    } catch (error) {
      Alert.alert("Error", "Failed to update notification preferences. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication</Text>
          
          <View style={styles.settingItem}>
            <Ionicons name="chatbox" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Messages</Text>
            <Text style={styles.settingDescription}>Get notified when you receive new messages</Text>
            <Switch
              value={preferences.messages}
              onValueChange={() => handleToggle("messages")}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.messages ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              style={styles.switch}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketplace Updates</Text>
          
          <View style={styles.settingItem}>
            <Ionicons name="pricetag" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>New Listings</Text>
            <Text style={styles.settingDescription}>Get notified when new items matching your interests are listed</Text>
            <Switch
              value={preferences.new_listings}
              onValueChange={() => handleToggle("new_listings")}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.new_listings ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              style={styles.switch}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Ionicons name="trending-down" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Price Drops</Text>
            <Text style={styles.settingDescription}>Get notified when items in your favorites have price reductions</Text>
            <Switch
              value={preferences.price_drops}
              onValueChange={() => handleToggle("price_drops")}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.price_drops ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              style={styles.switch}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Ionicons name="notifications" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Listing Activity</Text>
            <Text style={styles.settingDescription}>Get notified about comments and interactions on your listings</Text>
            <Switch
              value={preferences.listing_activity}
              onValueChange={() => handleToggle("listing_activity")}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.listing_activity ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              style={styles.switch}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promotional</Text>
          
          <View style={styles.settingItem}>
            <Ionicons name="gift" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Special Offers</Text>
            <Text style={styles.settingDescription}>Get notified about special deals and limited-time offers</Text>
            <Switch
              value={preferences.special_offers}
              onValueChange={() => handleToggle("special_offers")}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.special_offers ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              style={styles.switch}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Ionicons name="megaphone" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Marketing</Text>
            <Text style={styles.settingDescription}>Receive updates about new features and promotional content</Text>
            <Switch
              value={preferences.marketing}
              onValueChange={() => handleToggle("marketing")}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={preferences.marketing ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              style={styles.switch}
            />
          </View>
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            )}
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    marginLeft: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  settingItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 16,
  },
  settingIcon: {
    marginBottom: 8,
  },
  settingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
    paddingRight: 40,
  },
  switch: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  footer: {
    marginVertical: 24,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
}) 