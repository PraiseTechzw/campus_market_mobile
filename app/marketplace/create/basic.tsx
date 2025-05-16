"use client"
import { useState, useEffect } from "react"
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
  Modal,
  FlatList,
  Dimensions
} from "react-native"
import { Text, View } from "@/components/themed"
import { useRouter } from "expo-router"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import AuthGuard from "@/components/auth-guard"
import * as ImagePicker from "expo-image-picker"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getListingCategories, createListing } from "@/services/marketplace"
import { getCampuses } from "@/services/campus"
import React from "react"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { MotiView } from "moti"

const { width } = Dimensions.get("window")

export default function BasicCreateListingScreen() {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={false}>
      <BasicCreateListingContent />
    </AuthGuard>
  )
}

function BasicCreateListingContent() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [meetingSpot, setMeetingSpot] = useState("")
  const [condition, setCondition] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [campusId, setCampusId] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  // Modals state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [conditionModalVisible, setConditionModalVisible] = useState(false)
  const [campusModalVisible, setCampusModalVisible] = useState(false)
  const [imageOptionsVisible, setImageOptionsVisible] = useState(false)
  
  const { data: categories } = useQuery({
    queryKey: ["listingCategories"],
    queryFn: getListingCategories,
  })

  const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: getCampuses,
  })
  
  const createListingMutation = useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] })
      queryClient.invalidateQueries({ queryKey: ["recentListings"] })
      Alert.alert("Success", "Your listing has been created successfully!", [
        { text: "View Listings", onPress: () => router.push("/marketplace") }
      ])
    },
    onError: (error) => {
      console.error("Error creating listing:", error)
      Alert.alert("Error", "Failed to create listing. Please try again.")
      setLoading(false)
    },
  })
  
  const conditions = [
    { value: "new", label: "New", description: "Brand new, unused item with original packaging" },
    { value: "like_new", label: "Like New", description: "Used once or twice, in perfect condition" },
    { value: "good", label: "Good", description: "Gently used with minor signs of wear" },
    { value: "fair", label: "Fair", description: "Shows signs of use but functions properly" },
    { value: "poor", label: "Poor", description: "Heavily used with obvious signs of wear" }
  ]
  
  const pickImage = async () => {
    setImageOptionsVisible(false)
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
  
  const takePhoto = async () => {
    setImageOptionsVisible(false)
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync()
      
      if (cameraPermission.status !== "granted") {
        Alert.alert("Permission required", "Camera permission is required to take photos")
        return
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0].uri])
      }
    } catch (error) {
      console.error("Error taking photo:", error)
      Alert.alert("Error", "Failed to take photo. Please try again.")
    }
  }
  
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }
  
  const validateTitle = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title")
      return false
    }
    return true
  }
  
  const validateDescription = () => {
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description")
      return false
    }
    return true
  }
  
  const validatePrice = () => {
    if (!price.trim()) {
      Alert.alert("Error", "Please enter a price")
      return false
    }
    
    const priceValue = parseFloat(price)
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert("Error", "Please enter a valid price")
      return false
    }
    
    return true
  }
  
  const validateImages = () => {
    if (images.length === 0) {
      Alert.alert("Error", "Please add at least one image")
      return false
    }
    return true
  }
  
  const goToNextStep = () => {
    let isValid = false
    
    switch (step) {
      case 1:
        isValid = validateTitle()
        break
      case 2:
        isValid = validateDescription()
        break
      case 3:
        isValid = validatePrice()
        break
      case 4:
        isValid = validateImages()
        break
      case 5:
        submitListing()
        return
      default:
        isValid = true
    }
    
    if (isValid && step < 5) {
      setStep(step + 1)
    }
  }
  
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.back()
    }
  }
  
  const submitListing = () => {
    if (!session) return
    
    setLoading(true)
    
    createListingMutation.mutate({
      user_id: session.user.id,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category_id: categoryId ? categoryId : undefined,
      condition: (condition || "good") as "new" | "like_new" | "good" | "fair" | "poor",
      location: meetingSpot || "On campus",
      campus_id: campusId ? campusId : undefined,
      images,
    })
  }
  
  // Get category or campus name by ID
  const getCategoryName = (id: string) => {
    return categories?.find(c => c.id === id)?.name || "Select a category"
  }
  
  const getCampusName = (id: string) => {
    return campuses?.find(c => c.id === id)?.name || "Select campus"
  }
  
  const getConditionLabel = (value: string) => {
    return conditions.find(c => c.value === value)?.label || "Select condition"
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <LinearGradient
        colors={[Colors[colorScheme ?? "light"].background, "#f5f5f7"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goToPreviousStep}>
          <MaterialIcons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <View style={styles.backButton} />
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <TouchableOpacity 
              style={[
                styles.progressCircle, 
                stepNumber <= step ? styles.progressCircleActive : {}
              ]}
              onPress={() => {
                // Allow going back to previous steps but not skipping ahead
                if (stepNumber < step) {
                  setStep(stepNumber)
                }
              }}
            >
              {stepNumber < step ? (
                <MaterialIcons name="check" size={16} color="#fff" />
              ) : (
                <Text style={stepNumber === step ? styles.progressTextActive : styles.progressText}>
                  {stepNumber}
                </Text>
              )}
            </TouchableOpacity>
            
            {stepNumber < 5 && (
              <View 
                style={[
                  styles.progressLine,
                  stepNumber < step ? styles.progressLineActive : {}
                ]} 
              />
            )}
          </React.Fragment>
        ))}
      </View>
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
          style={styles.card}
        >
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>What are you selling?</Text>
              <Text style={styles.stepSubtitle}>Give your item a clear, descriptive title</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. iPhone 13 Pro Max 128GB"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  placeholderTextColor="#AAA"
                />
                <Text style={styles.characterCount}>{title.length}/100</Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity 
                  style={[styles.selectInput, categoryId ? styles.selectInputActive : {}]}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  <Text style={categoryId ? styles.selectInputText : styles.selectInputPlaceholder}>
                    {categoryId ? getCategoryName(categoryId) : "Select a category"}
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
                <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your item in detail..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={6}
                  maxLength={1000}
                  placeholderTextColor="#AAA"
                />
                <Text style={styles.characterCount}>{description.length}/1000</Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Condition</Text>
                <TouchableOpacity 
                  style={[styles.selectInput, condition ? styles.selectInputActive : {}]}
                  onPress={() => setConditionModalVisible(true)}
                >
                  <Text style={condition ? styles.selectInputText : styles.selectInputPlaceholder}>
                    {condition ? getConditionLabel(condition) : "Select condition"}
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
                <Text style={styles.label}>Price <Text style={styles.required}>*</Text></Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#AAA"
                  />
                </View>
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
                  <TouchableOpacity 
                    style={styles.addImageButton} 
                    onPress={() => setImageOptionsVisible(true)}
                  >
                    <MaterialIcons name="add-photo-alternate" size={32} color="#999" />
                    <Text style={styles.addImageText}>Add Photo</Text>
                    <Text style={styles.photoCount}>{images.length}/5</Text>
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
                <TouchableOpacity 
                  style={[styles.selectInput, campusId ? styles.selectInputActive : {}]} 
                  onPress={() => setCampusModalVisible(true)}
                >
                  <Text style={campusId ? styles.selectInputText : styles.selectInputPlaceholder}>
                    {campusId ? getCampusName(campusId) : "Select campus"}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color="#999" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Meeting spot</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Student Center, Library"
                  value={meetingSpot}
                  onChangeText={setMeetingSpot}
                  placeholderTextColor="#AAA"
                />
              </View>
              
              <View style={styles.reviewContainer}>
                <Text style={styles.reviewTitle}>Review your listing</Text>
                
                {images.length > 0 && (
                  <View style={styles.previewImageContainer}>
                    <Image source={{ uri: images[0] }} style={styles.previewImage} />
                  </View>
                )}
                
                <View style={styles.reviewDetail}>
                  <Text style={styles.reviewLabel}>Title:</Text>
                  <Text style={styles.reviewValue}>{title || "Not specified"}</Text>
                </View>
                
                <View style={styles.reviewDetail}>
                  <Text style={styles.reviewLabel}>Price:</Text>
                  <Text style={styles.reviewValue}>${price || "0.00"}</Text>
                </View>
                
                <View style={styles.reviewDetail}>
                  <Text style={styles.reviewLabel}>Category:</Text>
                  <Text style={styles.reviewValue}>{categoryId ? getCategoryName(categoryId) : "Not specified"}</Text>
                </View>
                
                <View style={styles.reviewDetail}>
                  <Text style={styles.reviewLabel}>Condition:</Text>
                  <Text style={styles.reviewValue}>{condition ? getConditionLabel(condition) : "Not specified"}</Text>
                </View>
              </View>
            </View>
          )}
        </MotiView>
      </ScrollView>
      
      <BlurView intensity={20} style={styles.footer} tint={colorScheme === "dark" ? "dark" : "light"}>
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
      </BlurView>
      
      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, categoryId === item.id && styles.modalItemSelected]}
                  onPress={() => {
                    setCategoryId(item.id.toString())
                    setCategoryModalVisible(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {categoryId === item.id && (
                    <MaterialIcons name="check" size={20} color={Colors[colorScheme ?? "light"].tint} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      
      {/* Condition Selection Modal */}
      <Modal
        visible={conditionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setConditionModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Condition</Text>
              <TouchableOpacity onPress={() => setConditionModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={conditions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, condition === item.value && styles.modalItemSelected]}
                  onPress={() => {
                    setCondition(item.value)
                    setConditionModalVisible(false)
                  }}
                >
                  <View>
                    <Text style={styles.modalItemText}>{item.label}</Text>
                    <Text style={styles.modalItemDescription}>{item.description}</Text>
                  </View>
                  {condition === item.value && (
                    <MaterialIcons name="check" size={20} color={Colors[colorScheme ?? "light"].tint} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      
      {/* Campus Selection Modal */}
      <Modal
        visible={campusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCampusModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Campus</Text>
              <TouchableOpacity onPress={() => setCampusModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={campuses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, campusId === item.id && styles.modalItemSelected]}
                  onPress={() => {
                    setCampusId(item.id.toString())
                    setCampusModalVisible(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {campusId === item.id && (
                    <MaterialIcons name="check" size={20} color={Colors[colorScheme ?? "light"].tint} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      
      {/* Image Options Modal */}
      <Modal
        visible={imageOptionsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImageOptionsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={styles.imageOptionsContainer}>
            <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
              <Ionicons name="camera" size={30} color={Colors[colorScheme ?? "light"].tint} />
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imageOption} onPress={pickImage}>
              <Ionicons name="images" size={30} color={Colors[colorScheme ?? "light"].tint} />
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setImageOptionsVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressCircleActive: {
    backgroundColor: Colors.light.tint,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: "#777",
  },
  progressTextActive: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: "#ddd",
  },
  progressLineActive: {
    backgroundColor: Colors.light.tint,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
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
    fontWeight: "600",
    marginBottom: 8,
    color: "#444",
  },
  required: {
    color: "#E53935",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fafafa",
  },
  selectInputActive: {
    borderColor: Colors.light.tint,
    backgroundColor: `${Colors.light.tint}10`,
  },
  selectInputText: {
    fontSize: 16,
    color: "#333",
  },
  selectInputPlaceholder: {
    fontSize: 16,
    color: "#AAA",
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: "#fafafa",
  },
  currencySymbol: {
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: 'bold',
    color: "#555",
  },
  priceInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  tipsContainer: {
    backgroundColor: `${Colors.light.tint}10`,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.tint,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#444",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
    flex: 1,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  imageContainer: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    margin: 5,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    margin: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  addImageText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  photoCount: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  reviewContainer: {
    backgroundColor: `${Colors.light.tint}08`,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#444",
  },
  previewImageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  reviewDetail: {
    flexDirection: "row",
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  reviewLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  reviewValue: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  footer: {
    padding: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalItemSelected: {
    backgroundColor: `${Colors.light.tint}10`,
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
  modalItemDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    maxWidth: width * 0.7,
  },
  imageOptionsContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  imageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  imageOptionText: {
    fontSize: 16,
    marginLeft: 16,
    color: "#333",
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#E53935",
    fontWeight: "600",
  },
}) 