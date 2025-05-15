"use client"
import { useState } from "react"
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native"
import { Text, View } from "@/components/themed"
import { useRouter } from "expo-router"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import AuthGuard from "@/components/auth-guard"
import * as ImagePicker from "expo-image-picker"
import { useQuery } from "@tanstack/react-query"
import { getListingCategories } from "@/services/marketplace"
import { getCampuses } from "@/services/campus"

export default function BasicCreateListingScreen() {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={true}>
      <BasicCreateListingContent />
    </AuthGuard>
  )
}

function BasicCreateListingContent() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [condition, setCondition] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [campusId, setCampusId] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
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
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0].uri])
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }
  
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }
  
  const goToNextStep = () => {
    if (step === 1 && !title) {
      Alert.alert("Error", "Please enter a title")
      return
    }
    
    if (step === 2 && !description) {
      Alert.alert("Error", "Please enter a description")
      return
    }
    
    if (step === 3 && !price) {
      Alert.alert("Error", "Please enter a price")
      return
    }
    
    if (step === 4 && images.length === 0) {
      Alert.alert("Error", "Please add at least one image")
      return
    }
    
    if (step < 5) {
      setStep(step + 1)
    } else {
      // Submit listing
      Alert.alert("Success", "Your listing has been created", [
        { text: "OK", onPress: () => router.push("/marketplace") }
      ])
    }
  }
  
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.back()
    }
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goToPreviousStep}>
          <MaterialIcons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing: Step {step}/5</Text>
        <View style={styles.backButton} />
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What are you selling?</Text>
            <Text style={styles.stepSubtitle}>Give your item a clear, descriptive title</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. iPhone 13 Pro Max 128GB"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity style={styles.selectInput}>
                <Text style={categoryId ? styles.selectInputText : styles.selectInputPlaceholder}>
                  {categoryId ? categories?.find(c => c.id === categoryId)?.name : "Select a category"}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Describe your item</Text>
            <Text style={styles.stepSubtitle}>Add details about your item's features and condition</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your item in detail..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                maxLength={1000}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Condition</Text>
              <TouchableOpacity style={styles.selectInput}>
                <Text style={condition ? styles.selectInputText : styles.selectInputPlaceholder}>
                  {condition ? conditions.find(c => c.value === condition)?.label : "Select condition"}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Set your price</Text>
            <Text style={styles.stepSubtitle}>How much do you want to sell it for?</Text>
            
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
            
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Pricing tips:</Text>
              <View style={styles.tipItem}>
                <MaterialIcons name="lightbulb" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.tipText}>Research similar items to set a competitive price</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialIcons name="lightbulb" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.tipText}>Consider the item's condition and age</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialIcons name="lightbulb" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.tipText}>Leave room for negotiation if appropriate</Text>
              </View>
            </View>
          </View>
        )}
        
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Add photos</Text>
            <Text style={styles.stepSubtitle}>Upload clear images of your item (max 5)</Text>
            
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <MaterialIcons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {images.length < 5 && (
                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                  <MaterialIcons name="add-photo-alternate" size={32} color="#999" />
                  <Text style={styles.addImageText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Photo tips:</Text>
              <View style={styles.tipItem}>
                <MaterialIcons name="photo-camera" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.tipText}>Use good lighting to show true colors</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialIcons name="photo-camera" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.tipText}>Take photos from multiple angles</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialIcons name="photo-camera" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.tipText}>Include photos of any defects or damage</Text>
              </View>
            </View>
          </View>
        )}
        
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Location</Text>
            <Text style={styles.stepSubtitle}>Where is this item available?</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Campus</Text>
              <TouchableOpacity style={styles.selectInput}>
                <Text style={campusId ? styles.selectInputText : styles.selectInputPlaceholder}>
                  {campusId ? campuses?.find(c => c.id === campusId)?.name : "Select campus"}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Meeting spot</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Student Center, Library"
              />
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={goToNextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>{step === 5 ? "Submit Listing" : "Next"}</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#666",
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
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  selectInputText: {
    fontSize: 16,
  },
  selectInputPlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  tipsContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
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
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  imageContainer: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: 100,
    height: 100,
    margin: 5,
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    padding: 16,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
}) 