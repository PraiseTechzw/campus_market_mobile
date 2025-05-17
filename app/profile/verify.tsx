"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Linking } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserProfile, uploadStudentId } from "@/services/profile"
import * as ImagePicker from "expo-image-picker"

export default function VerifyStudentScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getUserProfile(),
    enabled: !!session,
  })

  const uploadStudentIdMutation = useMutation({
    mutationFn: uploadStudentId,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      Alert.alert(
        "ID Submitted",
        "Your student ID has been submitted for verification. This process may take 1-2 business days."
      )
      router.back()
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to upload student ID. Please try again.")
      console.error(error)
    },
  })

  const pickImage = async () => {
    try {
      setUploading(true)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadStudentIdMutation.mutateAsync(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "An error occurred while selecting image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      
      if (status !== "granted") {
        Alert.alert(
          "Camera Permission Required",
          "We need camera permissions to take a photo of your student ID.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() }
          ]
        )
        return
      }

      setUploading(true)
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadStudentIdMutation.mutateAsync(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error taking photo:", error)
      Alert.alert("Error", "An error occurred while taking photo. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const renderVerificationStatus = () => {
    if (profile?.verification_status === "pending") {
      return (
        <View style={styles.statusBanner}>
          <Ionicons name="time" size={24} color="white" style={styles.statusIcon} />
          <View>
            <Text style={styles.statusTitle}>Verification Pending</Text>
            <Text style={styles.statusMessage}>
              Your student ID is being reviewed. This usually takes 1-2 business days.
            </Text>
          </View>
        </View>
      )
    }

    if (profile?.verification_status === "rejected") {
      return (
        <View style={[styles.statusBanner, { backgroundColor: "#ef4444" }]}>
          <Ionicons name="close-circle" size={24} color="white" style={styles.statusIcon} />
          <View>
            <Text style={styles.statusTitle}>Verification Rejected</Text>
            <Text style={styles.statusMessage}>
              Your student ID verification was rejected. Please try again with a clearer image.
            </Text>
          </View>
        </View>
      )
    }

    return null
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  if (profile?.is_verified) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Student Verification",
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
        <View style={styles.container}>
          <View style={styles.verifiedContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            <Text style={styles.verifiedTitle}>Verified Student</Text>
            <Text style={styles.verifiedMessage}>
              Your account has been verified as a student. Enjoy access to all features of Campus Market!
            </Text>
            <TouchableOpacity
              style={styles.backToProfileButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backToProfileText}>Back to Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Student Verification",
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
        {renderVerificationStatus()}
        
        <View style={styles.content}>
          <View style={styles.introSection}>
            <Text style={styles.title}>Verify Student Status</Text>
            <Text style={styles.description}>
              Upload a photo of your student ID to verify your status as a student. This helps build trust in the marketplace and may unlock student-specific features.
            </Text>
          </View>

          <View style={styles.uploadSection}>
            <View style={styles.idCard}>
              <Ionicons name="school" size={40} color="#666" />
              <Text style={styles.idCardText}>Student ID</Text>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={uploading || profile?.verification_status === "pending"}
              >
                <Ionicons name="image" size={24} color="white" style={styles.buttonIcon} />
                <Text style={styles.uploadButtonText}>Upload ID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={takePhoto}
                disabled={uploading || profile?.verification_status === "pending"}
              >
                <Ionicons name="camera" size={24} color="white" style={styles.buttonIcon} />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </View>

          <View style={styles.guidelinesSection}>
            <Text style={styles.sectionTitle}>Guidelines</Text>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" style={styles.guidelineIcon} />
              <Text style={styles.guidelineText}>Make sure your name and photo are clearly visible</Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" style={styles.guidelineIcon} />
              <Text style={styles.guidelineText}>Ensure the university/school name is visible</Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" style={styles.guidelineIcon} />
              <Text style={styles.guidelineText}>Valid dates should be visible if applicable</Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="alert-circle" size={20} color="#f59e0b" style={styles.guidelineIcon} />
              <Text style={styles.guidelineText}>Cover any sensitive information like ID numbers</Text>
            </View>
          </View>

          <View style={styles.privacySection}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <Text style={styles.privacyText}>
              Your ID information will only be used for verification purposes and will be stored securely. We'll never share this information with other users or third parties.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  content: {
    padding: 16,
  },
  statusBanner: {
    backgroundColor: "#f59e0b",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginRight: 12,
  },
  statusTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  statusMessage: {
    color: "white",
    fontSize: 14,
  },
  introSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  uploadSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  idCard: {
    width: 200,
    height: 130,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 8,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#f9f9f9",
  },
  idCardText: {
    marginTop: 8,
    color: "#666",
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  uploadButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 0.48,
  },
  buttonIcon: {
    marginRight: 8,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadingContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  uploadingText: {
    marginTop: 8,
    color: Colors.light.tint,
    fontWeight: "500",
  },
  guidelinesSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  guideline: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  guidelineIcon: {
    marginRight: 8,
  },
  guidelineText: {
    fontSize: 14,
    color: "#444",
    flex: 1,
  },
  privacySection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  privacyText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  verifiedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  verifiedMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  backToProfileButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backToProfileText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
})
