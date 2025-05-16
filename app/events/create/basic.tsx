"use client"

import { useState } from "react"
import { 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  View as RNView,
  Dimensions,
} from "react-native"
import { Text, View } from "@/components/themed"
import { useRouter } from "expo-router"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import AuthGuard from "@/components/auth-guard"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createEvent } from "@/services/events"
import { MotiView } from "moti"
import CampusSelector from "@/components/campus-selector"
import type { Campus } from "@/types"
import DateTimePicker from "@react-native-community/datetimepicker" 
import { supabase } from "@/lib/supabase"
import React from "react"

const { width } = Dimensions.get("window")

export default function QuickCreateEventScreen() {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={false}>
      <QuickCreateEventContent />
    </AuthGuard>
  )
}

function QuickCreateEventContent() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000)) // Default to 2 hours later
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      Alert.alert("Success", "Your event has been created", [
        { text: "View Events", onPress: () => router.push("/events") }
      ])
    },
    onError: (error) => {
      console.error("Error creating event:", error)
      Alert.alert("Error", "Failed to create event. Please try again.")
      setLoading(false)
    },
  })
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }

  const uploadImage = async () => {
    if (!image) return null

    try {
      // Convert image to blob
      const response = await fetch(image)
      const blob = await response.blob()

      // Upload to Supabase Storage
      const fileExt = image.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `events/${fileName}`

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, blob)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage.from("images").getPublicUrl(filePath)
      return data.publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      return null
    }
  }

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false)
    if (selectedDate) {
      const newDate = new Date(selectedDate)
      newDate.setHours(startDate.getHours(), startDate.getMinutes())
      setStartDate(newDate)

      // Ensure end date is after start date
      if (newDate > endDate) {
        const newEndDate = new Date(newDate)
        newEndDate.setHours(newEndDate.getHours() + 2) // Default to 2 hours later
        setEndDate(newEndDate)
      }
    }
  }

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false)
    if (selectedTime) {
      const newDate = new Date(startDate)
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes())
      setStartDate(newDate)

      // Ensure end time is after start time on same day
      if (
        endDate.getFullYear() === newDate.getFullYear() &&
        endDate.getMonth() === newDate.getMonth() &&
        endDate.getDate() === newDate.getDate() &&
        endDate <= newDate
      ) {
        const newEndDate = new Date(newDate)
        newEndDate.setHours(newDate.getHours() + 2) // Default to 2 hours later
        setEndDate(newEndDate)
      }
    }
  }

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false)
    if (selectedDate) {
      const newDate = new Date(selectedDate)
      newDate.setHours(endDate.getHours(), endDate.getMinutes())
      setEndDate(newDate)
    }
  }

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false)
    if (selectedTime) {
      const newDate = new Date(endDate)
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes())
      setEndDate(newDate)
    }
  }

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTimeForDisplay = (date: Date) => {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const handleSubmit = async () => {
    if (!session) return
    
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title")
      return
    }
    
    if (!location.trim()) {
      Alert.alert("Error", "Please enter a location")
      return
    }
    
    if (!selectedCampus) {
      Alert.alert("Error", "Please select a campus")
      return
    }
    
    setLoading(true)
    
    try {
      let imageUrl = null
      if (image) {
        imageUrl = await uploadImage()
      }

      createEventMutation.mutate({
        title: title.trim(),
        description: description.trim() || "No description provided",
        location: location.trim(),
        campus_id: selectedCampus.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        user_id: session.user.id,
        image_url: imageUrl,
        is_featured: false
      })
    } catch (error) {
      console.error("Error creating event:", error)
      Alert.alert("Error", "Failed to create event. Please try again.")
      setLoading(false)
    }
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Event Creation</Text>
        <View style={styles.backButton} />
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <Text style={styles.title}>Create your event</Text>
          <Text style={styles.subtitle}>Fill in the essential details to create an event quickly</Text>
        </MotiView>
        
        {/* Event Image */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 100 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>
            Event Image <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <RNView style={styles.imageContainer}>
            {image ? (
              <RNView style={styles.selectedImageContainer}>
                <Image source={{ uri: image }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImage(null)}
                >
                  <MaterialIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </RNView>
            ) : (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <MaterialIcons name="add-photo-alternate" size={32} color="#999" />
                <Text style={styles.addImageText}>Add Event Banner</Text>
              </TouchableOpacity>
            )}
          </RNView>
        </MotiView>
        
        {/* Basic Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>
            Event Details <Text style={styles.required}>*</Text>
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Campus Music Festival"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Student Union Building"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Campus</Text>
            <CampusSelector
              selectedCampus={selectedCampus}
              onSelectCampus={setSelectedCampus}
              containerStyle={styles.campusSelectorContainer}
            />
          </View>
        </MotiView>
        
        {/* Date and Time */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>
            Date & Time <Text style={styles.required}>*</Text>
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowStartDatePicker(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{formatDateForDisplay(startDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowStartTimePicker(true)}
              >
                <MaterialIcons name="access-time" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{formatTimeForDisplay(startDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowEndDatePicker(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{formatDateForDisplay(endDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowEndTimePicker(true)}
              >
                <MaterialIcons name="access-time" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{formatTimeForDisplay(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </MotiView>
        
        {/* Description */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 400 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Description <Text style={styles.optional}>(Optional)</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your event (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </MotiView>
        
        {/* Tips */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 500 }}
          style={styles.tipsContainer}
        >
          <Text style={styles.tipsTitle}>Tips for successful events:</Text>
          <View style={styles.tipItem}>
            <Ionicons name="image-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.tipText}>Add an eye-catching banner image</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="location-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.tipText}>Be specific about the location</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="time-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.tipText}>Set accurate start and end times</Text>
          </View>
        </MotiView>
      </ScrollView>
      
      <LinearGradient
        colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.95)']}
        style={styles.footer}
      >
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Create Event</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startDate}
          mode="time"
          display="default"
          onChange={onStartTimeChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
          minimumDate={startDate}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endDate}
          mode="time"
          display="default"
          onChange={onEndTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
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
    color: Colors.light.text,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: Colors.light.text,
  },
  required: {
    color: "#f43f5e",
    fontWeight: "normal",
  },
  optional: {
    color: "#9ca3af",
    fontWeight: "normal",
    fontSize: 14,
  },
  imageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImageContainer: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: "100%",
    height: 160,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  addImageText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fafafa",
    flex: 0.48,
  },
  dateTimeText: {
    fontSize: 14,
    marginLeft: 8,
    color: "#333",
  },
  campusSelectorContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  tipsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: Colors.light.text,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  submitButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  }
}) 