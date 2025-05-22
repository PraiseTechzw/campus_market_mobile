"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native"
import { useRouter } from "expo-router"
import Colors from "../../constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useQuery } from "@tanstack/react-query"
import { getUserProfile } from "@/services/profile"

const ProfileScreen = () => {
  const router = useRouter()
  const { session } = useSession()
  const colorScheme = useColorScheme()

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getUserProfile(),
    enabled: !!session,
  })

  const defaultAvatar = "https://via.placeholder.com/100?text=User"

  if (!session) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.message}>Please log in to view your profile</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  const fullName = profile ? 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
    'User'

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? "light"].text }]}>Profile</Text>
        <TouchableOpacity onPress={() => router.push("/profile/settings")}>
          <Ionicons name="settings-outline" size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.profileSection}
        onPress={() => router.push("/profile/edit")}
      >
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: profile?.avatar_url || defaultAvatar }} 
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.userName, { color: Colors[colorScheme ?? "light"].text }]}>{fullName}</Text>
        <Text style={[styles.userEmail, { color: Colors[colorScheme ?? "light"].secondary }]}>
          {session.user.email}
        </Text>
        {profile?.bio && (
          <Text style={styles.userBio}>{profile.bio}</Text>
        )}
        {profile?.is_verified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="white" />
            <Text style={styles.verifiedText}>Verified Student</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.verifyButton}
            onPress={() => router.push("/profile/verify")}
          >
            <Ionicons name="school-outline" size={16} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.verifyText}>Verify Student Status</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <View style={styles.menuSection}>
        <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? "light"].text }]}>Marketplace</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/listings")}>
          <Ionicons name="pricetag" size={22} color={Colors[colorScheme ?? "light"].tint} />
          <Text style={styles.menuItemText}>My Listings</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/favorites")}>
          <Ionicons name="heart" size={22} color={Colors[colorScheme ?? "light"].tint} />
          <Text style={styles.menuItemText}>Favorites</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/interests")}>
          <Ionicons name="star" size={22} color={Colors[colorScheme ?? "light"].tint} />
          <Text style={styles.menuItemText}>My Interests</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? "light"].text }]}>Preferences</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/notifications")}>
          <Ionicons name="notifications" size={22} color={Colors[colorScheme ?? "light"].tint} />
          <Text style={styles.menuItemText}>Notification Preferences</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/settings")}>
          <Ionicons name="settings" size={22} color={Colors[colorScheme ?? "light"].tint} />
          <Text style={styles.menuItemText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => {
          // Implement logout functionality
          Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Log Out", 
                style: "destructive",
                onPress: async () => {
                  // Call your logout function here
                  // e.g. await supabase.auth.signOut()
                  router.replace("/auth/login")
                }
              }
            ]
          )
        }}
      >
        <Ionicons name="log-out" size={20} color="white" />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0e0e0",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  userBio: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.tint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifyText: {
    color: Colors.light.tint,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  menuItemIcon: {
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: "#ef4444",
    borderRadius: 12,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
})

export default ProfileScreen
