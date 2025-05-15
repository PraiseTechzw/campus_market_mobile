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
} from "react-native"
import { Text, View } from "@/components/themed"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAccommodationTypes, createAccommodation } from "@/services/accommodation"
import { getCampuses } from "@/services/campus"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import * as ImagePicker from "expo-image-picker"
import { supabase } from "@/lib/supabase"
import type { AccommodationType, Campus } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import React from "react"

export default function CreateAccommodationScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [rent, setRent] = useState("")
  const [bedrooms, setBedrooms] = useState("")
  const [bathrooms, setBathrooms] = useState("")
  const [address, setAddress] = useState("")
  const [amenities, setAmenities] = useState<string[]>([])
  const [newAmenity, setNewAmenity] = useState("")
  const [rules, setRules] = useState<string[]>([])
  const [newRule, setNewRule] = useState("")
  const [selectedType, setSelectedType] = useState<AccommodationType | null>(null)
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showCampusModal, setShowCampusModal] = useState(false)

  const { data: types } = useQuery({
    queryKey: ["accommodationTypes"],
    queryFn: getAccommodationTypes,
  })

  const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: getCampuses,
  })

  const createAccommodationMutation = useMutation({
    mutationFn: createAccommodation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accommodations"] })
      queryClient.invalidateQueries({ queryKey: ["recentAccommodations"] })
      Alert.alert("Success", "Your accommodation listing has been created successfully.", [
        { text: "OK", onPress: () => router.back() },
      ])
    },
    onError: (error) => {
      console.error("Error creating accommodation:", error)
      Alert.alert("Error", "Failed to create accommodation listing. Please try again.")
    },
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
        const uri = result.assets[0].uri
        await uploadImage(uri)
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
        const uri = result.assets[0].uri
        await uploadImage(uri)
      }
    } catch (error) {
      console.error("Error taking photo:", error)
      Alert.alert("Error", "Failed to take photo. Please try again.")
    }
  }

  const uploadImage = async (uri: string) => {
    if (!session) return

    try {
      setUploading(true)

      // Convert image to blob
      const response = await fetch(uri)
      const blob = await response.blob()

      // Upload to Supabase Storage
      const fileExt = uri.split(".").pop()
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
      const filePath = `accommodations/${fileName}`

      const { error: uploadError } = await supabase.storage.from("accommodations").upload(filePath, blob)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage.from("accommodations").getPublicUrl(filePath)

      if (data) {
        setImages([...images, data.publicUrl])
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      Alert.alert("Error", "Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setAmenities([...amenities, newAmenity.trim()])
      setNewAmenity("")
    }
  }

  const removeAmenity = (index: number) => {
    const newAmenities = [...amenities]
    newAmenities.splice(index, 1)
    setAmenities(newAmenities)
  }

  const addRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()])
      setNewRule("")
    }
  }

  const removeRule = (index: number) => {
    const newRules = [...rules]
    newRules.splice(index, 1)
    setRules(newRules)
  }

  const handleSubmit = () => {
    if (!session) return

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for your listing.")
      return
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description for your listing.")
      return
    }

    if (!rent.trim() || isNaN(Number.parseFloat(rent))) {
      Alert.alert("Error", "Please enter a valid rent amount.")
      return
    }

    if (!bedrooms.trim() || isNaN(Number.parseInt(bedrooms))) {
      Alert.alert("Error", "Please enter a valid number of bedrooms.")
      return
    }

    if (!bathrooms.trim() || isNaN(Number.parseInt(bathrooms))) {
      Alert.alert("Error", "Please enter a valid number of bathrooms.")
      return
    }

    if (!address.trim()) {
      Alert.alert("Error", "Please enter an address.")
      return
    }

    if (images.length === 0) {
      Alert.alert("Error", "Please add at least one image.")
      return
    }

    createAccommodationMutation.mutate({
      user_id: session.user.id,
      title: title.trim(),
      description: description.trim(),
      rent: Number.parseFloat(rent),
      bedrooms: Number.parseInt(bedrooms),
      bathrooms: Number.parseInt(bathrooms),
      address: address.trim(),
      type_id: selectedType?.id || null,
      campus_id: selectedCampus?.id || null,
      amenities,
      rules,
      images,
    })
  }

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Please log in to create a listing.</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name = 'arrow-back' size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Accommodation</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Title of your accommodation"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your accommodation (features, location, etc.)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Monthly Rent ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={rent}
            onChangeText={setRent}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Type</Text>
          <TouchableOpacity style={styles.selectInput} onPress={() => setShowTypeModal(true)}>
            <Text style={selectedType ? styles.selectText : styles.selectPlaceholder}>
              {selectedType ? selectedType.name : "Select accommodation type"}
            </Text>
            <Ionicons name = 'chevron-down' size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Bedrooms</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={bedrooms}
              onChangeText={setBedrooms}
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Bathrooms</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={bathrooms}
              onChangeText={setBathrooms}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Full address of the accommodation"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Campus</Text>
          <TouchableOpacity style={styles.selectInput} onPress={() => setShowCampusModal(true)}>
            <Text style={selectedCampus ? styles.selectText : styles.selectPlaceholder}>
              {selectedCampus ? selectedCampus.name : "Select a campus (optional)"}
            </Text>
            <Ionicons name = 'chevron-down' size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Amenities</Text>
          <View style={styles.listContainer}>
            {amenities.map((amenity, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{amenity}</Text>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeAmenity(index)}>
                  <Ionicons name = 'close' size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.input, styles.addItemInput]}
              placeholder="Add an amenity (e.g., WiFi, Parking)"
              value={newAmenity}
              onChangeText={setNewAmenity}
            />
            <TouchableOpacity style={styles.addButton} onPress={addAmenity}>
              <Ionicons name = 'add' size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>House Rules</Text>
          <View style={styles.listContainer}>
            {rules.map((rule, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{rule}</Text>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeRule(index)}>
                    <Ionicons name = 'close' size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.input, styles.addItemInput]}
              placeholder="Add a house rule"
              value={newRule}
              onChangeText={setNewRule}
            />
            <TouchableOpacity style={styles.addButton} onPress={addRule}>
              <Ionicons name = 'add' size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Images</Text>
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                  <Ionicons name = 'close' size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 5 && (
              <View style={styles.imageActions}>
                <TouchableOpacity style={styles.imageActionButton} onPress={pickImage} disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name = 'camera' size={20} color="#fff" />
                      <Text style={styles.imageActionText}>Gallery</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageActionButton} onPress={takePhoto} disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name = 'camera' size={20} color="#fff" />
                      <Text style={styles.imageActionText}>Camera</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.helperText}>Add up to 5 images</Text>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={createAccommodationMutation.isPending}
        >
          {createAccommodationMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Type Modal */}
      {showTypeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Accommodation Type</Text>
            <ScrollView>
              {types?.map((type) => (
                <TouchableOpacity
                  key={type.id.toString()}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedType(type)
                    setShowTypeModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{type.name}</Text>
                  {type.description && <Text style={styles.modalItemDescription}>{type.description}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowTypeModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Campus Modal */}
      {showCampusModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Campus</Text>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCampus(null)
                  setShowCampusModal(false)
                }}
              >
                <Text style={styles.modalItemText}>None (All Campuses)</Text>
              </TouchableOpacity>
              {campuses?.map((campus) => (
                <TouchableOpacity
                  key={campus.id.toString()}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCampus(campus)
                    setShowCampusModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{campus.name}</Text>
                  <Text style={styles.modalItemDescription}>{campus.location}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCampusModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  selectInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: {
    fontSize: 16,
  },
  selectPlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  listContainer: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  listItemText: {
    fontSize: 16,
    flex: 1,
  },
  removeButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addItemContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addItemInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: "#0891b2",
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    position: "relative",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  imageActions: {
    flexDirection: "row",
  },
  imageActionButton: {
    width: 100,
    height: 100,
    backgroundColor: "#0891b2",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  imageActionText: {
    color: "#fff",
    marginTop: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#0891b2",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalItemDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
})
