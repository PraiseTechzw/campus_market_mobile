"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, RefreshControl } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import * as ImagePicker from "expo-image-picker"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserProfile, updateUserProfile } from "@/services/profile"
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

export default function ProfileScreen() {
  const { session, signOut } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [uploadingHeader, setUploadingHeader] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { data: profile, isLoading, refetch } = useQuery({
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

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
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

  const pickHeaderImage = async () => {
    try {
      setUploadingHeader(true)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri
        const fileExt = uri.split(".").pop()
        const fileName = `header-${session?.user.id}-${Date.now()}.${fileExt}`
        const filePath = `headers/${fileName}`

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

        // Update profile with new header image URL
        if (data) {
          updateProfileMutation.mutate({
            header_url: data.publicUrl,
          })
        }
      }
    } catch (error) {
      console.error("Error uploading header image:", error)
      Alert.alert("Error", "An error occurred while uploading your header image.")
    } finally {
      setUploadingHeader(false)
    }
  }

  if (!session) return null

  const renderVerificationStatus = () => {
    if (profile?.is_verified) {
      return (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" style={styles.verifiedIcon} />
          <Text style={styles.verifiedText}>Verified Student</Text>
        </View>
      )
    } else if (profile?.verification_status === "pending") {
      return (
        <View style={[styles.verifiedBadge, { backgroundColor: "#f59e0b" }]}>
          <Ionicons name="time" size={16} color="#fff" style={styles.verifiedIcon} />
          <Text style={styles.verifiedText}>Verification Pending</Text>
        </View>
      )
    } else {
      return (
        <TouchableOpacity style={[styles.verifiedBadge, { backgroundColor: "#ef4444" }]} onPress={() => router.push("/profile/verify")}>
          <Ionicons name="alert-circle" size={16} color="#fff" style={styles.verifiedIcon} />
          <Text style={styles.verifiedText}>Not Verified</Text>
        </TouchableOpacity>
      )
    }
  }

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerBackground}>
        <TouchableOpacity 
          style={styles.headerImageContainer}
          onPress={pickHeaderImage}
          disabled={uploadingHeader}
        >
          {uploadingHeader ? (
            <View style={styles.headerLoadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : profile?.header_url ? (
            <Image 
              source={{ uri: profile.header_url }}
              style={styles.headerImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#0891b2', '#0e7490', '#155e75']}
              style={styles.headerGradient}
            >
              <Ionicons name="image-outline" size={32} color="#ffffff80" />
              <Text style={styles.addHeaderText}>Add Cover Photo</Text>
            </LinearGradient>
          )}
          <View style={styles.headerEditButton}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileContainer}>
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={uploading}>
            {uploading ? (
              <View style={styles.avatar}>
                <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
              </View>
            ) : profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {profile?.first_name} {profile?.last_name}
            </Text>
            <Text style={styles.email}>{session.user.email}</Text>
            {renderVerificationStatus()}
          </View>
        </View>

        {profile?.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.rating || 0}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Sales</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/edit")}>
            <Ionicons name="person" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/listings")}>
            <Ionicons name="list" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>My Listings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/orders")}>
            <Ionicons name="bag-handle" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>Orders</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/favorites")}>
            <Ionicons name="heart" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>Saved Items</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/notifications")}>
            <Ionicons name="notifications" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/interests")}>
            <MaterialIcons name="interests" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>Interests</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/payment")}>
            <Ionicons name="card" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>Payment Methods</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/addresses")}>
            <Ionicons name="location" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>Addresses</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/help")}>
            <Ionicons name="help-circle" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/about")}>
            <Ionicons name="information-circle" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>About Us</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/settings")}>
            <Ionicons name="settings" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.menuItemText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    height: 150,
    width: '100%',
  },
  headerImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHeaderText: {
    color: '#ffffffcc',
    marginTop: 8,
    fontWeight: '500',
  },
  headerLoadingContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0891b290',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEditButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#0891b2',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -50,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    backgroundColor: "#0891b2",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
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
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  verifiedIcon: {
    marginRight: 4,
  },
  verifiedText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  bioSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  bioText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0891b2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#eaeaea',
    marginHorizontal: 10,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: '#333',
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
    color: '#444',
  },
  signOutButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signOutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
})
