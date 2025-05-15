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
import { getListingCategories, createListing } from "@/services/marketplace"
import { getCampuses } from "@/services/campus"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { ArrowLeft, Camera, X, ChevronDown } from "lucide-react"
import * as ImagePicker from "expo-image-picker"
import { supabase } from "@/lib/supabase"
import type { ListingCategory, Campus } from "@/types"

export default function CreateListingScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [location, setLocation] = useState("")
  const [condition, setCondition] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | null>(null)
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showCampusModal, setShowCampusModal] = useState(false)
  const [showConditionModal, setShowConditionModal] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ["listingCategories"],
    queryFn: getListingCategories,
  })

  const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: getCampuses,
  })

  const conditions = [
    { value: "new", label: "New" },
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" },
  ]

  const createListingMutation = useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] })
      queryClient.invalidateQueries({ queryKey: ["recentListings"] })
      Alert.alert("Success", "Your listing has been created successfully.", [
        { text: "OK", onPress: () => router.back() },
      ])
    },
    onError: (error) => {
      console.error("Error creating listing:", error)
      Alert.alert("Error", "Failed to create listing. Please try again.")
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
      const filePath = `listings/${fileName}`

      const { error: uploadError } = await supabase.storage.from("listings").upload(filePath, blob)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage.from("listings").getPublicUrl(filePath)

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

    if (!price.trim() || isNaN(Number.parseFloat(price))) {
      Alert.alert("Error", "Please enter a valid price.")
      return
    }

    if (!location.trim()) {
      Alert.alert("Error", "Please enter a location.")
      return
    }

    if (images.length === 0) {
      Alert.alert("Error", "Please add at least one image.")
      return
    }

    createListingMutation.mutate({
      user_id: session.user.id,
      title: title.trim(),
      description: description.trim(),
      price: Number.parseFloat(price),
      category_id: selectedCategory?.id || null,
      condition,
      location: location.trim(),
      campus_id: selectedCampus?.id || null,
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
          <ArrowLeft size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="What are you selling?"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item (condition, features, etc.)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Price ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity style={styles.selectInput} onPress={() => setShowCategoryModal(true)}>
            <Text style={selectedCategory ? styles.selectText : styles.selectPlaceholder}>
              {selectedCategory ? selectedCategory.name : "Select a category"}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Condition</Text>
          <TouchableOpacity style={styles.selectInput} onPress={() => setShowConditionModal(true)}>
            <Text style={condition ? styles.selectText : styles.selectPlaceholder}>
              {condition ? conditions.find((c) => c.value === condition)?.label : "Select condition"}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Where is the item located?"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Campus</Text>
          <TouchableOpacity style={styles.selectInput} onPress={() => setShowCampusModal(true)}>
            <Text style={selectedCampus ? styles.selectText : styles.selectPlaceholder}>
              {selectedCampus ? selectedCampus.name : "Select a campus (optional)"}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Images</Text>
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                  <X size={16} color="#fff" />
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
                      <Camera size={20} color="#fff" />
                      <Text style={styles.imageActionText}>Gallery</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageActionButton} onPress={takePhoto} disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Camera size={20} color="#fff" />
                      <Text style={styles.imageActionText}>Camera</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.helperText}>Add up to 5 images</Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={createListingMutation.isPending}>
          {createListingMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView>
              {categories?.map((category) => (
                <TouchableOpacity
                  key={category.id.toString()}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCategory(category)
                    setShowCategoryModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCategoryModal(false)}>
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
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCampusModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Condition Modal */}
      {showConditionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Condition</Text>
            <ScrollView>
              {conditions.map((conditionOption) => (
                <TouchableOpacity
                  key={conditionOption.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setCondition(conditionOption.value)
                    setShowConditionModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{conditionOption.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowConditionModal(false)}>
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
