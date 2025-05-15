"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'
import * as ImagePicker from "expo-image-picker"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserProfile, updateUserProfile } from "@/services/profile"
import { Switch } from "react-native"
import { useTheme } from "@/components/theme-provider"

export default function ProfileScreen() {
  const { session, signOut } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const [uploading, setUploading] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getUserProfile(),
    enabled: !!session,
  })

  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut()
          router.replace("/(auth)/login")
        },
      },
    ])
  }

  const pickImage = async () => {
    try {
      setUploading(true)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri
        const fileExt = uri.split(".").pop()
        const fileName = `${session?.user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        // Convert image to blob
        const response = await fetch(uri)
        const blob = await response.blob()

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, blob)

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const { data } = supabase.storage.from("profiles").getPublicUrl(filePath)

        // Update profile with new avatar URL
        if (data) {
          updateProfileMutation.mutate({
            avatar_url: data.publicUrl,
          })
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      Alert.alert("Error", "An error occurred while uploading your image.")
    } finally {
      setUploading(false)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!session) return null

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.avatar} />
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <FontAwesome5 name="user" size={40} color="#fff" />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={styles.email}>{session.user.email}</Text>

        {profile?.is_verified ? (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verified Student</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.verifyButton} onPress={() => router.push("/profile/verify")}>
            <Text style={styles.verifyButtonText}>Verify Student ID</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/edit")}>
          <FontAwesome5 name="user" size={20} color={Colors[colorScheme ?? "light"].text} />
          <Text style={styles.menuItemText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/listings")}>
          <FontAwesome5 name="shopping-bag" size={20} color={Colors[colorScheme ?? "light"].text} />
          <Text style={styles.menuItemText}>My Listings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/settings")}>
          <Ionicons name="settings" size={20} color={Colors[colorScheme ?? "light"].text} />
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.menuItem}>
          {theme === "dark" ? (
            <Ionicons name="moon" size={20} color={Colors[colorScheme ?? "light"].text} />
          ) : (
            <Ionicons name="sunny" size={20} color={Colors[colorScheme ?? "light"].text} />
          )}
          <Text style={styles.menuItemText}>Dark Mode</Text>
          <Switch value={theme === "dark"} onValueChange={toggleTheme} style={styles.switch} />
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out" size={20} color="#fff" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: "#0891b2",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0891b2",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  verifiedBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedText: {
    color: "#fff",
    fontWeight: "bold",
  },
  verifyButton: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  switch: {
    marginLeft: "auto",
  },
  signOutButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 40,
  },
  signOutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
})
