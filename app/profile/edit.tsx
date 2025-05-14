"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useColorScheme } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useNetwork } from "@/providers/network-provider"
import { useAuth } from "@/providers/auth-provider"
import { compressImage } from "@/utils/image-utils"
import OfflineBanner from "@/components/offline-banner"

export default function ProfileEditScreen() {
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { user, updateUserProfile } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      Alert.alert("Sign In Required", "You need to be logged in to edit your profile", [
        { text: "Sign In", onPress: () => router.replace("/(auth)/login") },
      ])
      return
    }

    // Initialize form with user data
    setFirstName(user.firstName || "")
    setLastName(user.lastName || "")
    setEmail(user.email || "")
    setBio(user.bio || "")
    setProfilePicture(user.profilePicture)
  }, [user])

  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const compressed = await compressImage(result.assets[0].uri)
      setProfilePicture(compressed)
    }
  }

  const handleSave = async () => {
    if (!user) return

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert("Error", "First name, last name, and email are required")
      return
    }

    if (!isConnected) {
      Alert.alert("Error", "Cannot update profile while offline")
      return
    }

    setLoading(true)
    try {
      await updateUserProfile({
        ...user,
        firstName,
        lastName,
        email,
        bio,
        profilePicture,
      })
      Alert.alert("Success", "Profile updated successfully", [{ text: "OK", onPress: () => router.back() }])
    } catch (error) {
      console.error("Error updating profile:", error)
      Alert.alert("Error", "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null // Handled in useEffect
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {!isConnected && <OfflineBanner />}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>Edit Profile</Text>

          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profilePicture || "/placeholder.svg?height=120&width=120" }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editProfileImageButton} onPress={pickProfileImage}>
              <MaterialIcons name="edit" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>First Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                  color: Colors[colorScheme ?? "light"].text,
                  borderColor: Colors[colorScheme ?? "light"].border,
                },
              ]}
              placeholder="Enter first name"
              placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Last Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                  color: Colors[colorScheme ?? "light"].text,
                  borderColor: Colors[colorScheme ?? "light"].border,
                },
              ]}
              placeholder="Enter last name"
              placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                  color: Colors[colorScheme ?? "light"].text,
                  borderColor: Colors[colorScheme ?? "light"].border,
                },
              ]}
              placeholder="Enter email"
              placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Bio</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                  color: Colors[colorScheme ?? "light"].text,
                  borderColor: Colors[colorScheme ?? "light"].border,
                },
              ]}
              placeholder="Tell others about yourself..."
              placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: Colors[colorScheme ?? "light"].border }]}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: Colors[colorScheme ?? "light"].text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: Colors[colorScheme ?? "light"].tint },
                loading && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editProfileImageButton: {
    position: "absolute",
    bottom: 0,
    right: "30%",
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    minHeight: 120,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
})
