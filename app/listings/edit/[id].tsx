"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, View as RNView, Alert } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { Stack, useRouter, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import * as ImagePicker from "expo-image-picker"
import { Picker } from "@react-native-picker/picker"

type Category = {
  id: string | number
  name: string
}

type Listing = {
  id: string | number
  title: string
  description: string
  price: number
  images: string[]
  category_id: string | number
  user_id: string
  is_sold: boolean
  condition?: string
  location?: string
}

export default function EditListingScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useLocalSearchParams()
  const listingId = params.id as string
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [categoryId, setCategoryId] = useState<string | number>("")
  const [condition, setCondition] = useState("")
  const [location, setLocation] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const { data: listing, isLoading } = useQuery({
    queryKey: ["editListing", listingId],
    queryFn: () => getListing(listingId),
    enabled: !!listingId && !!session,
    onSuccess: (data) => {
      if (data) {
        setTitle(data.title)
        setDescription(data.description || "")
        setPrice(data.price ? data.price.toString() : "")
        setCategoryId(data.category_id || "")
        setCondition(data.condition || "")
        setLocation(data.location || "")
        setImages(data.images || [])
      }
    }
  })
  
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories
  })
  
  // Check if user owns the listing
  useEffect(() => {
    if (listing && session && listing.user_id !== session.user.id) {
      Alert.alert(
        "Unauthorized",
        "You can only edit your own listings",
        [{ text: "OK", onPress: () => router.back() }]
      )
    }
  }, [listing, session])
  
  const updateListingMutation = useMutation({
    mutationFn: updateListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editListing", listingId] })
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] })
      queryClient.invalidateQueries({ queryKey: ["myListings"] })
      Alert.alert("Success", "Listing updated successfully")
      router.push(`/listings/${listingId}`)
    },
    onError: (error) => {
      console.error("Error updating listing:", error)
      Alert.alert("Error", "Failed to update listing. Please try again.")
    }
  })
  
  async function getListing(id: string): Promise<Listing | null> {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single()
      
      if (error) throw error
      return data as Listing
    } catch (error) {
      console.error("Error fetching listing:", error)
      return null
    }
  }
  
  async function getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name")
      
      if (error) throw error
      return data as Category[]
    } catch (error) {
      console.error("Error fetching categories:", error)
      return []
    }
  }
  
  async function updateListing(listing: Partial<Listing>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("listings")
        .update(listing)
        .eq("id", listingId)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error("Error updating listing:", error)
      return false
    }
  }
  
  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }
  
  async function uploadImage(uri: string) {
    if (!session) return
    
    setUploadingImage(true)
    try {
      // Generate unique file name
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const fileExt = uri.split('.').pop()
      const filePath = `listings/${session.user.id}/${fileName}.${fileExt}`

      // Fetch the image from uri and convert to blob
      const response = await fetch(uri)
      const blob = await response.blob()
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, blob)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data } = supabase.storage.from("images").getPublicUrl(filePath)
      
      if (!data?.publicUrl) {
        throw new Error("Failed to get public URL")
      }
      
      // Add to images array
      setImages([...images, data.publicUrl])
      
    } catch (error) {
      console.error("Error uploading image:", error)
      Alert.alert("Error", "Failed to upload image. Please try again.")
    } finally {
      setUploadingImage(false)
    }
  }
  
  function removeImage(index: number) {
    // Create copy of images array and remove image at index
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }
  
  async function handleSubmit() {
    // Validation
    if (!title.trim()) {
      Alert.alert("Error", "Title is required")
      return
    }
    
    if (!price || isNaN(Number(price))) {
      Alert.alert("Error", "Valid price is required")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await updateListingMutation.mutateAsync({
        title,
        description,
        price: Number(price),
        category_id: categoryId || null,
        condition,
        location,
        images
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Edit Listing",
            headerShown: true,
            headerShadowVisible: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
        </View>
      </>
    )
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Listing",
          headerShown: true,
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.imageList}
          >
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.addImageButton} 
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={Colors[colorScheme ?? "light"].tint} />
              ) : (
                <>
                  <Ionicons name="add" size={30} color={Colors[colorScheme ?? "light"].tint} />
                  <Text style={styles.addImageText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter listing title"
          />
          
          <Text style={styles.label}>Price</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            {isCategoriesLoading ? (
              <ActivityIndicator size="small" color={Colors[colorScheme ?? "light"].tint} />
            ) : (
              <Picker
                selectedValue={categoryId}
                onValueChange={(itemValue) => setCategoryId(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select a category" value="" />
                {categories?.map((category) => (
                  <Picker.Item 
                    key={category.id.toString()} 
                    label={category.name} 
                    value={category.id} 
                  />
                ))}
              </Picker>
            )}
          </View>
          
          <Text style={styles.label}>Condition</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={condition}
              onValueChange={(itemValue) => setCondition(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a condition" value="" />
              <Picker.Item label="New" value="New" />
              <Picker.Item label="Like New" value="Like New" />
              <Picker.Item label="Good" value="Good" />
              <Picker.Item label="Fair" value="Fair" />
              <Picker.Item label="Poor" value="Poor" />
            </Picker>
          </View>
          
          <Text style={styles.label}>Location (optional)</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. North Campus"
          />
        </View>
        
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your item..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.updateButtonText}>Update Listing</Text>
          )}
        </TouchableOpacity>
        
        {/* Delete Listing */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              "Delete Listing",
              "Are you sure you want to delete this listing? This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Delete", 
                  style: "destructive",
                  onPress: async () => {
                    try {
                      setIsSubmitting(true)
                      const { error } = await supabase
                        .from("listings")
                        .delete()
                        .eq("id", listingId)
                      
                      if (error) throw error
                      
                      queryClient.invalidateQueries({ queryKey: ["myListings"] })
                      Alert.alert("Success", "Listing deleted successfully")
                      router.replace("/profile/listings")
                    } catch (error) {
                      console.error("Error deleting listing:", error)
                      Alert.alert("Error", "Failed to delete listing. Please try again.")
                    } finally {
                      setIsSubmitting(false)
                    }
                  }
                }
              ]
            )
          }}
          disabled={isSubmitting}
        >
          <Ionicons name="trash" size={18} color="white" style={styles.buttonIcon} />
          <Text style={styles.deleteButtonText}>Delete Listing</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerButton: {
    marginLeft: 16,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  imageList: {
    flexDirection: "row",
    marginBottom: 8,
  },
  imageContainer: {
    position: "relative",
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  addImageText: {
    color: Colors.light.tint,
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 16,
  },
  currencySymbol: {
    paddingHorizontal: 12,
    fontSize: 18,
    color: "#333",
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 50,
  },
  updateButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
}); 