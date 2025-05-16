"use client"

import { useState } from "react"
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter, Stack } from "expo-router"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { useMutation } from "@tanstack/react-query"
import { createEvent } from "@/services/events"
import { useToast } from "@/providers/toast-provider"
import CampusSelector from "@/components/campus-selector"
import type { Campus } from "@/types"
import DateTimePicker from "@react-native-community/datetimepicker"
import * as ImagePicker from "expo-image-picker"
import { supabase } from "@/lib/supabase"

export default function CreateEventScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const toast = useToast()

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
  const [uploading, setUploading] = useState(false)

  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      toast.show({
        type: "success",
        title: "Success",
        message: "Event created successfully",
      })
      router.push("/events")
    },
    onError: (error) => {
      console.error("Error creating event:", error)
      toast.show({
        type: "error",
        title: "Error",
        message: "Failed to create event",
      })
    },
  })

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  const uploadImage = async () => {
    if (!image) return null

    try {
      setUploading(true)

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
      toast.show({
        type: "error",
        title: "Upload Error",
        message: "Failed to upload image",
      })
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    if (!title.trim()) {
      toast.show({
        type: "error",
        title: "Error",
        message: "Please enter a title",
      })
      return
    }

    if (!location.trim()) {
      toast.show({
        type: "error",
        title: "Error",
        message: "Please enter a location",
      })
      return
    }

    if (!selectedCampus) {
      toast.show({
        type: "error",
        title: "Error",
        message: "Please select a campus",
      })
      return
    }

    try {
      let imageUrl = null
      if (image) {
        imageUrl = await uploadImage()
      }

      createEventMutation.mutate({
        title,
        description,
        location,
        campus_id: selectedCampus.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        user_id: session.user.id,
        image_url: imageUrl,
      })
    } catch (error) {
      console.error("Error creating event:", error)
      toast.show({
        type: "error",
        title: "Error",
        message: "Failed to create event",
      })
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

      // Ensure end date is after start date
      if (newDate > endDate) {
        const newEndDate = new Date(newDate)
        newEndDate.setHours(newEndDate.getHours() + 2) // Default to 2 hours later
        setEndDate(newEndDate)
      }
    }
  }

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false)
    if (selectedDate) {
      const newDate = new Date(selectedDate)
      newDate.setHours(endDate.getHours(), endDate.getMinutes())

      // Ensure end date is after start date
      if (newDate < startDate) {
        toast.show({
          type: "error",
          title: "Invalid Date",
          message: "End date must be after start date",
        })
        return
      }

      setEndDate(newDate)
    }
  }

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false)
    if (selectedTime) {
      const newDate = new Date(endDate)
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes())

      // Ensure end time is after start time if same day
      if (
        startDate.getFullYear() === newDate.getFullYear() &&
        startDate.getMonth() === newDate.getMonth() &&
        startDate.getDate() === newDate.getDate() &&
        startDate >= newDate
      ) {
        toast.show({
          type: "error",
          title: "Invalid Time",
          message: "End time must be after start time",
        })
        return
      }

      setEndDate(newDate)
    }
  }

  if (!session) {
    router.replace("/login")
    return null
  }

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="add-photo-alternate" size={48} color="#ccc" />
                  <Text style={styles.imagePlaceholderText}>Add Event Cover Image</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event title"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter event description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event location"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Campus *</Text>
              <CampusSelector selectedCampus={selectedCampus} onSelectCampus={setSelectedCampus} />
            </View>

            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeColumn}>
                <Text style={styles.label}>Start Date & Time *</Text>
                <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowStartDatePicker(true)}>
                  <MaterialIcons name="calendar-today" size={20} color="#666" />
                  <Text style={styles.datePickerButtonText}>
                    {startDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowStartTimePicker(true)}>
                  <MaterialIcons name="access-time" size={20} color="#666" />
                  <Text style={styles.timePickerButtonText}>
                    {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateTimeColumn}>
                <Text style={styles.label}>End Date & Time *</Text>
                <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowEndDatePicker(true)}>
                  <MaterialIcons name="calendar-today" size={20} color="#666" />
                  <Text style={styles.datePickerButtonText}>
                    {endDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowEndTimePicker(true)}>
                  <MaterialIcons name="access-time" size={20} color="#666" />
                  <Text style={styles.timePickerButtonText}>
                    {endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateEvent}
              disabled={createEventMutation.isPending || uploading}
            >
              {createEventMutation.isPending || uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Create Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

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
          <DateTimePicker value={startDate} mode="time" display="default" onChange={onStartTimeChange} />
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
          <DateTimePicker value={endDate} mode="time" display="default" onChange={onEndTimeChange} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  imagePickerContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#f5f5f5",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: "#666",
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  dateTimeColumn: {
    width: "48%",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  datePickerButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timePickerButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
