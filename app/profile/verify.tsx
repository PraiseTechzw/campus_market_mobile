"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, View as RNView } from "react-native"
import { Text, View } from "@/components/themed"
import { useRouter } from "expo-router"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { uploadStudentId } from "@/services/profile"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getUserProfile } from "@/services/profile"

export default function VerifyStudentScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getUserProfile,
    enabled: !!session,
  })

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }

  const takePhoto = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync()

      if (cameraPermission.status !== "granted") {
        Alert.alert("Permission required", "Camera permission is required to take photos.")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error taking photo:", error)
      Alert.alert("Error", "Failed to take photo. Please try again.")
    }
  }

  const handleUpload = async () => {
    if (!selectedImage || !session) return

    try {
      setUploading(true)
      await uploadStudentId(selectedImage)
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      Alert.alert("Success", "Your student ID has been uploaded for verification. We will review it shortly.", [
        { text: "OK", onPress: () => router.back() },
      ])
    } catch (error) {
      console.error("Error uploading student ID:", error)
      Alert.alert("Error", "Failed to upload student ID. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  if (profile?.verification_status === "verified" || profile?.is_verified) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Verification</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.verificationStatus}>
          <Ionicons name="checkmark-circle" size={60} color="#10b981" />
          <Text style={styles.verificationTitle}>Verified Student</Text>
          <Text style={styles.verificationText}>
            Your student ID has been verified. You now have full access to all features.
          </Text>
          <TouchableOpacity style={styles.backToProfileButton} onPress={() => router.back()}>
            <Text style={styles.backToProfileText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (profile?.verification_status === "pending") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Verification</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.verificationStatus}>
          <Ionicons name="time" size={60} color="#f59e0b" />
          <Text style={styles.verificationTitle}>Verification Pending</Text>
          <Text style={styles.verificationText}>
            Your student ID is currently being reviewed. This process usually takes 1-2 business days.
          </Text>
          <TouchableOpacity style={styles.backToProfileButton} onPress={() => router.back()}>
            <Text style={styles.backToProfileText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (profile?.verification_status === "rejected") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Verification</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.verificationStatus}>
          <Ionicons name="alert-circle" size={60} color="#ef4444" />
          <Text style={styles.verificationTitle}>Verification Rejected</Text>
          <Text style={styles.verificationText}>
            Your student ID verification was rejected. Please upload a clearer image of your valid student ID.
          </Text>
          <TouchableOpacity style={styles.tryAgainButton} onPress={() => setSelectedImage(null)}>
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Verification</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Verify Your Student ID</Text>
        <Text style={styles.description}>
          To access all features and get verified status, please upload a clear photo of your student ID card.
        </Text>

        <View style={styles.imageContainer}>
          {selectedImage ? (
            <RNView style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.changeImageButton} onPress={() => setSelectedImage(null)}>
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>
            </RNView>
          ) : (
            <RNView style={styles.imageActions}>
              <TouchableOpacity style={styles.imageActionButton} onPress={pickImage}>
                <Ionicons name="image" size={32} color="#fff" />
                <Text style={styles.imageActionText}>Upload from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageActionButton} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color="#fff" />
                <Text style={styles.imageActionText}>Take a Photo</Text>
              </TouchableOpacity>
            </RNView>
          )}
        </View>

        <View style={styles.guidelinesContainer}>
          <Text style={styles.guidelinesTitle}>Guidelines:</Text>
          <Text style={styles.guidelineItem}>• Ensure all four corners of your ID are visible</Text>
          <Text style={styles.guidelineItem}>• Make sure the text on your ID is readable</Text>
          <Text style={styles.guidelineItem}>• Your ID must be valid and not expired</Text>
          <Text style={styles.guidelineItem}>• Avoid glare or shadows on the ID</Text>
        </View>

        {selectedImage && (
          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>Submit for Verification</Text>
            )}
          </TouchableOpacity>
        )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  imageContainer: {
    marginBottom: 24,
  },
  selectedImageContainer: {
    alignItems: "center",
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeImageButton: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeImageText: {
    color: "#0891b2",
    fontWeight: "bold",
  },
  imageActions: {
    flexDirection: "column",
    gap: 16,
  },
  imageActionButton: {
    backgroundColor: "#0891b2",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  imageActionText: {
    color: "#fff",
    marginTop: 8,
    fontWeight: "bold",
  },
  guidelinesContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  guidelineItem: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: "#0891b2",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  verificationStatus: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  backToProfileButton: {
    backgroundColor: "#0891b2",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    width: "100%",
  },
  backToProfileText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tryAgainButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    width: "100%",
  },
  tryAgainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
