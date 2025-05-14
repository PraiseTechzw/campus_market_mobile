"use client"

import { useState } from "react"
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
import { Picker } from "@react-native-picker/picker"
import Colors from "@/constants/Colors"
import { useNetwork } from "@/providers/network-provider"
import { useAuth } from "@/providers/auth-provider"
import { compressImage } from "@/utils/image-utils"
import OfflineBanner from "@/components/offline-banner"

export default function VerifyAccountScreen() {
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { user, updateUserProfile } = useAuth()
  const [studentId, setStudentId] = useState("")
  const [university, setUniversity] = useState("")
  const [idCardImage, setIdCardImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Mock universities for demo
  const universities = [
    "Select University",
    "University of Example",
    "State University",
    "Tech Institute",
    "Liberal Arts College",
    "Community College",
  ]

  const pickIdCardImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const compressed = await compressImage(result.assets[0].uri)
      setIdCardImage(compressed)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to verify your account")
      router.push("/(auth)/login")
      return
    }

    if (!studentId.trim()) {
      Alert.alert("Error", "Please enter your student ID")
      return
    }

    if (!university || university === "Select University") {
      Alert.alert("Error", "Please select your university")
      return
    }

    if (!idCardImage) {
      Alert.alert("Error", "Please upload a photo of your student ID card")
      return
    }

    if (!isConnected) {
      Alert.alert("Error", "Cannot submit verification while offline")
      return
    }

    setLoading(true)
    try {
      // In a real app, this would send the verification request to the server
      // For demo purposes, we'll simulate a successful verification after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update user profile with verification status
      // In a real app, this would be pending until approved by an admin
      await updateUserProfile({
        ...user,
        isVerified: true,
      })

      Alert.alert(
        "Verification Submitted",
        "Your verification request has been submitted and is pending review by our team.",
        [{ text: "OK", onPress: () => router.back() }],
      )
    } catch (error) {
      console.error("Error submitting verification:", error)
      Alert.alert("Error", "Failed to submit verification request")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <View style={styles.notLoggedInContainer}>
          <MaterialIcons name="verified-user" size={80} color={Colors[colorScheme ?? "light"].textDim} />
          <Text style={[styles.notLoggedInText, { color: Colors[colorScheme ?? "light"].text }]}>
            You need to be logged in to verify your account
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (user.isVerified) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <View style={styles.verifiedContainer}>
          <MaterialIcons name="verified-user" size={80} color="#4CAF50" />
          <Text style={[styles.verifiedText, { color: Colors[colorScheme ?? "light"].text }]}>
            Your account is already verified
          </Text>
          <Text style={[styles.verifiedSubText, { color: Colors[colorScheme ?? "light"].textDim }]}>
            You have full access to all features of Campus Market
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {!isConnected && <OfflineBanner />}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>Verify Your Account</Text>
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? "light"].textDim }]}>
            Verification gives you access to all features and builds trust with other users
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Student ID</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                  color: Colors[colorScheme ?? "light"].text,
                  borderColor: Colors[colorScheme ?? "light"].border,
                },
              ]}
              placeholder="Enter your student ID number"
              placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
              value={studentId}
              onChangeText={setStudentId}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>University</Text>
            <View
              style={[
                styles.pickerContainer,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                  borderColor: Colors[colorScheme ?? "light"].border,
                },
              ]}
            >
              <Picker
                selectedValue={university}
                onValueChange={(itemValue) => setUniversity(itemValue)}
                style={{ color: Colors[colorScheme ?? "light"].text }}
              >
                {universities.map((uni) => (
                  <Picker.Item key={uni} label={uni} value={uni} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Student ID Card Photo</Text>
            <Text style={[styles.helperText, { color: Colors[colorScheme ?? "light"].textDim }]}>
              Please upload a clear photo of your student ID card
            </Text>

            {idCardImage ? (
              <View style={styles.idCardPreviewContainer}>
                <Image source={{ uri: idCardImage }} style={styles.idCardPreview} />
                <TouchableOpacity style={styles.changePhotoButton} onPress={pickIdCardImage}>
                  <Text style={[styles.changePhotoText, { color: Colors[colorScheme ?? "light"].tint }]}>
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  {
                    backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                    borderColor: Colors[colorScheme ?? "light"].border,
                  },
                ]}
                onPress={pickIdCardImage}
              >
                <MaterialIcons name="add-a-photo" size={32} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={[styles.uploadButtonText, { color: Colors[colorScheme ?? "light"].text }]}>
                  Upload ID Card Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.privacyContainer}>
            <MaterialIcons name="security" size={24} color={Colors[colorScheme ?? "light"].textDim} />
            <Text style={[styles.privacyText, { color: Colors[colorScheme ?? "light"].textDim }]}>
              Your ID card information is securely stored and only used for verification purposes. It will not be shared
              with other users.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: Colors[colorScheme ?? "light"].tint },
              loading && styles.disabledButton,
              (!studentId || !university || university === "Select University" || !idCardImage) &&
                styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={
              loading || !studentId || !university || university === "Select University" || !idCardImage || !isConnected
            }
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="verified-user" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit for Verification</Text>
              </>
            )}
          </TouchableOpacity>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
  },
  uploadButton: {
    height: 160,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButtonText: {
    fontSize: 16,
    marginTop: 8,
  },
  idCardPreviewContainer: {
    alignItems: "center",
  },
  idCardPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    resizeMode: "contain",
  },
  changePhotoButton: {
    marginTop: 8,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "500",
  },
  privacyContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  privacyText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    height: 56,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notLoggedInText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  verifiedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  verifiedText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  verifiedSubText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
