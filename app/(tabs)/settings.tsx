"use client"

import type React from "react"

import { useState } from "react"
import { StyleSheet, View, Text, Switch, ScrollView, Alert, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import { useAuth } from "@/providers/auth-provider"
import { resetOnboarding } from "@/utils/onboarding"
import ScreenContainer from "@/components/screen-container"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"

interface SettingItemProps {
  icon: string
  iconType?: "Ionicons" | "MaterialIcons"
  title: string
  description?: string
  onPress?: () => void
  rightElement?: React.ReactNode
}

function SettingItem({ icon, iconType = "Ionicons", title, description, onPress, rightElement }: SettingItemProps) {
  const { colors } = useTheme()

  const IconComponent = iconType === "Ionicons" ? Ionicons : MaterialIcons

  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.tint + "20" }]}>
        <IconComponent name={icon as any} size={22} color={colors.tint} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {description && <Text style={[styles.settingDescription, { color: colors.textDim }]}>{description}</Text>}
      </View>
      {rightElement ||
        (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textDim} style={styles.chevron} />)}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { colors } = useTheme()
  const { signOut, profile } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(true)

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut()
            router.replace("/(auth)/login")
          },
        },
      ],
      { cancelable: true },
    )
  }

  const handleResetOnboarding = async () => {
    Alert.alert(
      "Reset Onboarding",
      "Are you sure you want to reset the onboarding experience?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          onPress: async () => {
            await resetOnboarding()
            Alert.alert("Success", "Onboarding has been reset. It will appear on your next login.")
          },
        },
      ],
      { cancelable: true },
    )
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Account</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
              <SettingItem
                icon="person"
                title="Edit Profile"
                description="Update your personal information"
                onPress={() => router.push("/profile/edit")}
              />
              <SettingItem
                icon="shield-checkmark"
                title="Verification"
                description={profile?.isVerified ? "Verified Account" : "Verify your student status"}
                onPress={() => router.push("/profile/verify")}
              />
              <SettingItem
                icon="key"
                title="Change Password"
                description="Update your account password"
                onPress={() => router.push("/profile/change-password")}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Preferences</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
              <SettingItem
                icon="notifications"
                title="Notifications"
                description="Receive alerts and updates"
                rightElement={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: colors.border, true: colors.tint }}
                    thumbColor="white"
                  />
                }
              />
              <SettingItem
                icon="moon"
                title="Dark Mode"
                description="Toggle dark theme"
                rightElement={
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: colors.border, true: colors.tint }}
                    thumbColor="white"
                  />
                }
              />
              <SettingItem
                icon="location"
                title="Location Services"
                description="Enable location-based features"
                rightElement={
                  <Switch
                    value={locationEnabled}
                    onValueChange={setLocationEnabled}
                    trackColor={{ false: colors.border, true: colors.tint }}
                    thumbColor="white"
                  />
                }
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Support</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
              <SettingItem
                icon="help-circle"
                title="Help Center"
                description="FAQs and support resources"
                onPress={() => router.push("/help")}
              />
              <SettingItem
                icon="mail"
                title="Contact Us"
                description="Get in touch with our team"
                onPress={() => router.push("/contact")}
              />
              <SettingItem icon="document-text" title="Terms of Service" onPress={() => router.push("/terms")} />
              <SettingItem icon="shield" title="Privacy Policy" onPress={() => router.push("/privacy")} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>App</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
              <SettingItem
                icon="information-circle"
                title="About"
                description="App version and information"
                onPress={() => router.push("/about")}
              />
              <SettingItem
                icon="refresh-circle"
                title="Reset Onboarding"
                description="View the welcome screens again"
                onPress={handleResetOnboarding}
              />
              <SettingItem
                icon="log-out"
                title="Sign Out"
                description="Log out of your account"
                onPress={handleSignOut}
              />
            </View>
          </View>

          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: colors.textDim }]}>Campus Market v1.0.0</Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  sectionContent: {
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  chevron: {
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  versionText: {
    fontSize: 14,
  },
})
