"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@/components/theme-provider"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export default function SettingsScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true)
  const [marketingEnabled, setMarketingEnabled] = useState(false)

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handlePrivacySettings = () => {
    router.push("/profile/privacy")
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "Please confirm that you want to permanently delete your account and all associated data.",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Confirm Delete", 
                  style: "destructive",
                  onPress: () => {
                    // Implementation of account deletion would go here
                    Alert.alert("Account Deletion", "Your account deletion request has been submitted. It may take up to 30 days to process.")
                  }
                }
              ]
            )
          }
        }
      ]
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Settings",
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
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.settingItem}>
            <Ionicons 
              name={theme === "dark" ? "moon" : "sunny"} 
              size={22} 
              color={theme === "dark" ? "#f59e0b" : "#fbbf24"}
              style={styles.settingIcon} 
            />
            <Text style={styles.settingText}>Dark Mode</Text>
            <Switch
              value={theme === "dark"}
              onValueChange={toggleTheme}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={theme === "dark" ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              style={styles.switch}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <Ionicons name="notifications" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>All Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={notificationsEnabled ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              style={styles.switch}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Ionicons name="mail" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Email Notifications</Text>
            <Switch
              value={emailNotificationsEnabled}
              onValueChange={setEmailNotificationsEnabled}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={emailNotificationsEnabled ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              disabled={!notificationsEnabled}
              style={styles.switch}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Ionicons name="phone-portrait" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Push Notifications</Text>
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={setPushNotificationsEnabled}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={pushNotificationsEnabled ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              disabled={!notificationsEnabled}
              style={styles.switch}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Ionicons name="megaphone" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Marketing Communications</Text>
            <Switch
              value={marketingEnabled}
              onValueChange={setMarketingEnabled}
              trackColor={{ false: "#e4e4e7", true: Colors[colorScheme ?? "light"].tint + "80" }}
              thumbColor={marketingEnabled ? Colors[colorScheme ?? "light"].tint : "#f4f4f5"}
              disabled={!notificationsEnabled}
              style={styles.switch}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacySettings}>
            <Ionicons name="shield" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push("/profile/terms")}>
            <Ionicons name="document-text" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push("/profile/privacy-policy")}>
            <Ionicons name="lock-closed" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push("/profile/change-password")}>
            <Ionicons name="key" size={22} color="#0891b2" style={styles.settingIcon} />
            <Text style={styles.settingText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
            <Ionicons name="trash" size={22} color="#ef4444" style={styles.settingIcon} />
            <Text style={[styles.settingText, { color: "#ef4444" }]}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.version}>App Version 1.0.0</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    flex: 1,
    color: "#444",
  },
  switch: {
    marginLeft: "auto",
  },
  footer: {
    marginTop: 8,
    marginBottom: 40,
    alignItems: "center",
  },
  version: {
    fontSize: 12,
    color: "#999",
  },
}) 