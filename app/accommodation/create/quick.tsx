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
import { createAccommodation } from "@/services/accommodation"
import { MotiView } from "moti"

const { width } = Dimensions.get("window")

export default function QuickCreateAccommodationScreen() {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={false}>
      <QuickCreateAccommodationContent />
    </AuthGuard>
  )
}

function QuickCreateAccommodationContent() {
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
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  const createAccommodationMutation = useMutation({
    mutationFn: createAccommodation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accommodations"] })
      queryClient.invalidateQueries({ queryKey: ["recentAccommodations"] })
      Alert.alert("Success", "Your accommodation listing has been created", [
        { text: "View Listings", onPress: () => router.push("/accommodation") }
      ])
    },
    onError: (error) => {
      console.error("Error creating accommodation:", error)
      Alert.alert("Error", "Failed to create listing. Please try again.")
      setLoading(false)
    },
  })
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri)
        setImages([...images, ...newImages].slice(0, 5))
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }
  
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!session) return
    
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title")
      return
    }
    
    if (!rent.trim() || isNaN(Number.parseFloat(rent))) {
      Alert.alert("Error", "Please enter a valid rent amount")
      return
    }
    
    if (!bedrooms.trim() || isNaN(Number.parseInt(bedrooms))) {
      Alert.alert("Error", "Please enter a valid number of bedrooms")
      return
    }
    
    if (!bathrooms.trim() || isNaN(Number.parseInt(bathrooms))) {
      Alert.alert("Error", "Please enter a valid number of bathrooms")
      return
    }
    
    if (!address.trim()) {
      Alert.alert("Error", "Please enter an address")
      return
    }
    
    if (images.length === 0) {
      Alert.alert("Error", "Please add at least one image")
      return
    }
    
    setLoading(true)
    
    // In a real app, you would upload images to storage here
    // For this example, we'll just prepare the data
    setTimeout(() => {
      createAccommodationMutation.mutate({
        user_id: session.user.id,
        title: title.trim(),
        description: description.trim() || "No description provided",
        rent: Number.parseFloat(rent),
        bedrooms: Number.parseInt(bedrooms),
        bathrooms: Number.parseInt(bathrooms),
        address: address.trim(),
        images,
        is_available: true,
        amenities: [],
        rules: [],
      })
    }, 1000)
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
        <Text style={styles.headerTitle}>Quick Housing Listing</Text>
        <View style={styles.backButton} />
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <Text style={styles.title}>List your accommodation</Text>
          <Text style={styles.subtitle}>Fill in the essential details to list your property fast</Text>
        </MotiView>
        
        {/* Photos */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 100 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>
            Photos <Text style={styles.required}>*</Text>
          </Text>
          <RNView style={styles.imagesContainer}>
            {images.map((image, index) => (
              <RNView key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <MaterialIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </RNView>
            ))}
            
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <MaterialIcons name="add-photo-alternate" size={32} color="#999" />
                <Text style={styles.addImageText}>Add Photos</Text>
                <Text style={styles.addImageSubtext}>{images.length}/5</Text>
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
            Basic Information <Text style={styles.required}>*</Text>
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cozy 2BR Apartment near Campus"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
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
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Bedrooms</Text>
              <TextInput
                style={styles.input}
                placeholder="Number"
                value={bedrooms}
                onChangeText={setBedrooms}
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Bathrooms</Text>
              <TextInput
                style={styles.input}
                placeholder="Number"
                value={bathrooms}
                onChangeText={setBathrooms}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Full address"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </MotiView>
        
        {/* Description */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your accommodation (optional)"
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
          transition={{ type: 'timing', duration: 600, delay: 400 }}
          style={styles.tipsContainer}
        >
          <Text style={styles.tipsTitle}>Tips for successful listings:</Text>
          <View style={styles.tipItem}>
            <Ionicons name="camera-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.tipText}>Add clear photos of all rooms and exterior</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="document-text-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.tipText}>Be specific about amenities and features</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="location-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.tipText}>Mention proximity to campus and transit</Text>
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
              <Text style={styles.submitButtonText}>Publish Listing</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>
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
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  imageContainer: {
    width: width / 3 - 16,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: width / 3 - 16,
    aspectRatio: 1,
    margin: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  addImageText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  addImageSubtext: {
    fontSize: 10,
    color: "#bbb",
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
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