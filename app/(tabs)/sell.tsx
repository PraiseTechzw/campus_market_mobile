"use client"

import { useState, useRef } from "react"
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useColorScheme } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { Picker } from "@react-native-picker/picker"
import Colors from "@/constants/Colors"
import { useNetwork } from "@/providers/network-provider"
import { useAuth } from "@/providers/auth-provider"
import { createProduct } from "@/services/api"
import { queueProductCreation } from "@/utils/sync-queue"
import { compressImage } from "@/utils/image-utils"
import type { Category, ProductCondition } from "@/types"
import OfflineBanner from "@/components/offline-banner"

export default function SellScreen() {
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { user } = useAuth()
  const scrollViewRef = useRef<ScrollView>(null)

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [condition, setCondition] = useState<ProductCondition>("used")
  const [images, setImages] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [isNegotiable, setIsNegotiable] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Mock categories for demo
  const categories: Category[] = [
    { id: "books", name: "Books", icon: "book" },
    { id: "tech", name: "Tech", icon: "devices" },
    { id: "fashion", name: "Fashion", icon: "checkroom" },
    { id: "food", name: "Food", icon: "fastfood" },
    { id: "room", name: "Room Essentials", icon: "bed" },
    { id: "handmade", name: "Handmade Items", icon: "handyman" },
  ]

  const conditions = [
    { value: "new", label: "Brand New" },
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "used", label: "Used" },
    { value: "worn", label: "Worn" },
  ]

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can only upload up to 5 images.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const compressed = await compressImage(result.assets[0].uri)
      setImages([...images, compressed])
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const removeTag = (index: number) => {
    const newTags = [...tags]
    newTags.splice(index, 1)
    setTags(newTags)
  }

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a product name")
      return false
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert("Error", "Please enter a valid price")
      return false
    }
    if (!category) {
      Alert.alert("Error", "Please select a category")
      return false
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a product description")
      return false
    }
    if (images.length === 0) {
      Alert.alert("Error", "Please add at least one image")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to sell items")
      router.push("/(auth)/login")
      return
    }

    if (!validateForm()) return

    setLoading(true)

    try {
      const productData = {
        name,
        price: Number(price),
        description,
        categoryId: category,
        condition,
        images,
        tags,
        isNegotiable,
        isUrgent,
        sellerId: user.id,
      }

      if (isConnected) {
        // Online mode - create product directly
        const newProduct = await createProduct(productData)
        Alert.alert("Success", "Your product has been listed!", [
          { text: "OK", onPress: () => router.push(`/product/${newProduct.id}`) },
        ])
      } else {
        // Offline mode - queue for later sync
        await queueProductCreation(productData)
        Alert.alert("Success", "Your product will be listed when you are back online.", [
          { text: "OK", onPress: () => router.back() },
        ])
      }
    } catch (error) {
      console.error("Error creating product:", error)
      Alert.alert("Error", "Failed to create product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <View style={styles.notLoggedInContainer}>
          <MaterialIcons name="lock" size={64} color={Colors[colorScheme ?? "light"].textDim} />
          <Text style={[styles.notLoggedInText, { color: Colors[colorScheme ?? "light"].text }]}>
            You need to be logged in to sell items
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {!isConnected && <OfflineBanner />}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>List Your Item</Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Product Name*</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                  color: Colors[colorScheme ?? "light"].text,
                  borderColor: Colors[colorScheme ?? "light"].border,
                },
              ]}
              placeholder="Enter product name"
              placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Price (USD)*</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                  color: Colors[colorScheme ?? "light"].text,
                  borderColor: Colors[colorScheme ?? "light"].border,
                },
              ]}
              placeholder="Enter price"
              placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Category*</Text>
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
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={{ color: Colors[colorScheme ?? "light"].text }}
              >
                <Picker.Item label="Select a category" value="" />
                {categories.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Condition*</Text>
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
                selectedValue={condition}
                onValueChange={(itemValue) => setCondition(itemValue as ProductCondition)}
                style={{ color: Colors[colorScheme ?? "light"].text }}
              >
                {conditions.map((cond) => (
                  <Picker.Item key={cond.value} label={cond.label} value={cond.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Description*</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                  color: Colors[colorScheme ?? "light"].text,
                  borderColor: Colors[colorScheme ?? "light"].border,
                },
              ]}
              placeholder="Describe your product..."
              placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>
              Images* ({images.length}/5)
            </Text>
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                    <Ionicons name="close-circle" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity
                  style={[
                    styles.addImageButton,
                    {
                      backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                      borderColor: Colors[colorScheme ?? "light"].border,
                    },
                  ]}
                  onPress={pickImage}
                >
                  <Ionicons name="add" size={32} color={Colors[colorScheme ?? "light"].tint} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Tags (Optional)</Text>
            <View style={styles.tagsInputContainer}>
              <TextInput
                style={[
                  styles.tagInput,
                  {
                    backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                    color: Colors[colorScheme ?? "light"].text,
                    borderColor: Colors[colorScheme ?? "light"].border,
                  },
                ]}
                placeholder="Add tags (e.g., textbook, laptop)"
                placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
                value={currentTag}
                onChangeText={setCurrentTag}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity
                style={[styles.addTagButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
                onPress={addTag}
                disabled={!currentTag.trim() || tags.length >= 5}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(index)}>
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? "light"].text }]}>Options</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity style={styles.optionButton} onPress={() => setIsNegotiable(!isNegotiable)}>
                <View
                  style={[styles.checkbox, isNegotiable && { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
                >
                  {isNegotiable && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={[styles.optionText, { color: Colors[colorScheme ?? "light"].text }]}>
                  Price is negotiable
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={() => setIsUrgent(!isUrgent)}>
                <View style={[styles.checkbox, isUrgent && { backgroundColor: Colors[colorScheme ?? "light"].tint }]}>
                  {isUrgent && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={[styles.optionText, { color: Colors[colorScheme ?? "light"].text }]}>Mark as urgent</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: Colors[colorScheme ?? "light"].tint },
              loading && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="add-shopping-cart" size={20} color="white" />
                <Text style={styles.submitButtonText}>List Item</Text>
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
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    minHeight: 120,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageWrapper: {
    position: "relative",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  tagsInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    height: 48,
    width: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    color: "white",
    fontSize: 14,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
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
})
