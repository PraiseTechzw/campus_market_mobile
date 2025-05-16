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
  Modal,
  FlatList,
  Dimensions,
  View as RNView
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
import { getAccommodationTypes, createAccommodation } from "@/services/accommodation"
import { getCampuses } from "@/services/campus"
import { LinearGradient } from "expo-linear-gradient"
import { MotiView } from "moti"
import React from "react"

const { width } = Dimensions.get("window")
const ANIMATION_DELAY = 100

export default function BasicCreateAccommodationScreen() {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={false}>
      <BasicCreateAccommodationContent />
    </AuthGuard>
  )
}

function BasicCreateAccommodationContent() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [step, setStep] = useState(1)
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
  const [typeId, setTypeId] = useState("")
  const [campusId, setCampusId] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  // Modals state
  const [typeModalVisible, setTypeModalVisible] = useState(false)
  const [campusModalVisible, setCampusModalVisible] = useState(false)
  const [imageOptionsVisible, setImageOptionsVisible] = useState(false)
  
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
      setLoading(false)
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
    setImageOptionsVisible(false)
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - images.length,
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
  
  const goToNextStep = () => {
    if (step === 1) {
      if (!title.trim()) {
        Alert.alert("Error", "Please enter a title")
        return
      }
      if (!typeId) {
        Alert.alert("Error", "Please select an accommodation type")
        return
      }
    }
    
    if (step === 2) {
      if (!description.trim()) {
        Alert.alert("Error", "Please enter a description")
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
    }
    
    if (step === 3) {
      if (!rent.trim() || isNaN(Number.parseFloat(rent))) {
        Alert.alert("Error", "Please enter a valid rent amount")
        return
      }
    }
    
    if (step === 4 && images.length === 0) {
      Alert.alert("Error", "Please add at least one image")
      return
    }
    
    if (step === 5) {
      if (!address.trim()) {
        Alert.alert("Error", "Please enter an address")
        return
      }
      if (!campusId) {
        Alert.alert("Error", "Please select a campus")
        return
      }
      
      handleSubmit()
      return
    }
    
    setStep(step + 1)
  }
  
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.back()
    }
  }
  
  const handleSubmit = () => {
    if (!session) return
    
    if (!title.trim()) {
      setStep(1)
      Alert.alert("Error", "Please enter a title")
      return
    }
    
    if (!typeId) {
      setStep(1)
      Alert.alert("Error", "Please select an accommodation type")
      return
    }
    
    if (!description.trim()) {
      setStep(2)
      Alert.alert("Error", "Please enter a description")
      return
    }
    
    if (!rent.trim() || isNaN(Number.parseFloat(rent))) {
      setStep(3)
      Alert.alert("Error", "Please enter a valid rent amount")
      return
    }
    
    if (images.length === 0) {
      setStep(4)
      Alert.alert("Error", "Please add at least one image")
      return
    }
    
    if (!address.trim()) {
      Alert.alert("Error", "Please enter an address")
      return
    }
    
    setLoading(true)
    
    setTimeout(() => {
      createAccommodationMutation.mutate({
        user_id: session.user.id,
        title: title.trim(),
        description: description.trim(),
        rent: Number.parseFloat(rent),
        bedrooms: Number.parseInt(bedrooms),
        bathrooms: Number.parseInt(bathrooms),
        address: address.trim(),
        images,
        is_available: true,
        type_id: typeId,
        campus_id: campusId,
        amenities,
        rules,
      })
    }, 1000)
  }
  
  // Get type or campus name by ID
  const getTypeName = (id: string) => {
    return types?.find(t => t.id === id)?.name || "Select type"
  }
  
  const getCampusName = (id: string) => {
    return campuses?.find(c => c.id === id)?.name || "Select campus"
  }
  
  const renderStepIndicator = () => {
    return (
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.stepsContainer}
      >
        <View style={styles.stepsRow}>
          {[1, 2, 3, 4, 5].map((stepNumber) => (
            <TouchableOpacity 
              key={stepNumber} 
              style={[
                styles.stepIndicator, 
                step === stepNumber && styles.stepIndicatorActive,
                step > stepNumber && styles.stepIndicatorCompleted
              ]}
              onPress={() => {
                if (stepNumber < step) {
                  setStep(stepNumber);
                }
              }}
            >
              {step > stepNumber ? (
                <MaterialIcons name="check" size={16} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepIndicatorText,
                  step === stepNumber && styles.stepIndicatorTextActive
                ]}>
                  {stepNumber}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.stepLabelsContainer}>
          <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Basics</Text>
          <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Details</Text>
          <Text style={[styles.stepLabel, step === 3 && styles.stepLabelActive]}>Price</Text>
          <Text style={[styles.stepLabel, step === 4 && styles.stepLabelActive]}>Photos</Text>
          <Text style={[styles.stepLabel, step === 5 && styles.stepLabelActive]}>Location</Text>
        </View>
      </MotiView>
    );
  };
  
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
        <View>
          <Text style={styles.headerTitle}>Create Listing</Text>
          <Text style={styles.headerSubtitle}>Step {step} of 5</Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>
      
      {renderStepIndicator()}
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.stepContainer}
          >
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSubtitle}>Tell us about your accommodation</Text>
            
            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Title <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Cozy 2BR Apartment near Campus"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Type <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity 
                  style={styles.selectInput}
                  onPress={() => setTypeModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="home" size={20} color="#999" style={styles.selectIcon} />
                  <Text style={typeId ? styles.selectInputText : styles.selectInputPlaceholder}>
                    {typeId ? getTypeName(typeId) : "Select accommodation type"}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color="#999" />
                </TouchableOpacity>
              </View>
            </View>
          </MotiView>
        )}
        
        {step === 2 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.stepContainer}
          >
            <Text style={styles.stepTitle}>Describe your accommodation</Text>
            <Text style={styles.stepSubtitle}>Add details about your property</Text>
            
            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Description <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your accommodation in detail..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={6}
                  maxLength={1000}
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>
                    Bedrooms <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Number of bedrooms"
                    value={bedrooms}
                    onChangeText={setBedrooms}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>
                    Bathrooms <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Number of bathrooms"
                    value={bathrooms}
                    onChangeText={setBathrooms}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Amenities</Text>
                <View style={styles.inputWithButton}>
                  <TextInput
                    style={[styles.input, styles.inputWithButtonText]}
                    placeholder="e.g. WiFi, Parking, Laundry"
                    value={newAmenity}
                    onChangeText={setNewAmenity}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={addAmenity}>
                    <MaterialIcons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.chipContainer}>
                  {amenities.map((amenity, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{amenity}</Text>
                      <TouchableOpacity onPress={() => removeAmenity(index)}>
                        <MaterialIcons name="close" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </MotiView>
        )}
        
        {step === 3 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.stepContainer}
          >
            <Text style={styles.stepTitle}>Price and Rules</Text>
            <Text style={styles.stepSubtitle}>Set your rent and house rules</Text>
            
            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Monthly Rent ($) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={rent}
                  onChangeText={setRent}
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>House Rules</Text>
                <View style={styles.inputWithButton}>
                  <TextInput
                    style={[styles.input, styles.inputWithButtonText]}
                    placeholder="e.g. No smoking, No pets"
                    value={newRule}
                    onChangeText={setNewRule}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={addRule}>
                    <MaterialIcons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.chipContainer}>
                  {rules.map((rule, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{rule}</Text>
                      <TouchableOpacity onPress={() => removeRule(index)}>
                        <MaterialIcons name="close" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.tipContainer}>
                <Ionicons name="information-circle-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.tipText}>
                  Setting a competitive price and clear rules will help attract quality tenants.
                </Text>
              </View>
            </View>
          </MotiView>
        )}
        
        {step === 4 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.stepContainer}
          >
            <Text style={styles.stepTitle}>Add photos</Text>
            <Text style={styles.stepSubtitle}>Upload clear images of your accommodation (max 5)</Text>
            
            <View style={styles.formCard}>
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
                  <TouchableOpacity style={styles.addImageButton} onPress={() => setImageOptionsVisible(true)}>
                    <MaterialIcons name="add-photo-alternate" size={32} color="#999" />
                    <Text style={styles.addImageText}>Add Photos</Text>
                    <Text style={styles.addImageSubtext}>{images.length}/5</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.tipContainer}>
                <Ionicons name="bulb-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.tipText}>
                  Quality photos increase interest by 70%. Include images of all rooms, amenities, and exterior.
                </Text>
              </View>
            </View>
          </MotiView>
        )}
        
        {step === 5 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.stepContainer}
          >
            <Text style={styles.stepTitle}>Location</Text>
            <Text style={styles.stepSubtitle}>Where is your accommodation located?</Text>
            
            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Address <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full address"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Campus <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity 
                  style={styles.selectInput}
                  onPress={() => setCampusModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="location-on" size={20} color="#999" style={styles.selectIcon} />
                  <Text style={campusId ? styles.selectInputText : styles.selectInputPlaceholder}>
                    {campusId ? getCampusName(campusId) : "Select nearest campus"}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color="#999" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.reviewContainer}>
              <LinearGradient
                colors={[Colors[colorScheme ?? "light"].background, Colors[colorScheme ?? "light"].primary + '10']}
                style={styles.reviewGradient}
              >
                <Text style={styles.reviewTitle}>Review your listing</Text>
                
                {images.length > 0 && (
                  <Image source={{ uri: images[0] }} style={styles.previewImage} />
                )}
                
                <View style={styles.reviewDetail}>
                  <Text style={styles.reviewLabel}>Title:</Text>
                  <Text style={styles.reviewValue}>{title || "Not specified"}</Text>
                </View>
                
                <View style={styles.reviewDetail}>
                  <Text style={styles.reviewLabel}>Type:</Text>
                  <Text style={styles.reviewValue}>{typeId ? getTypeName(typeId) : "Not specified"}</Text>
                </View>
                
                <View style={styles.reviewDetail}>
                  <Text style={styles.reviewLabel}>Rent:</Text>
                  <Text style={styles.reviewValue}>${rent || "0.00"}/month</Text>
                </View>
                
                <View style={styles.reviewDetail}>
                  <Text style={styles.reviewLabel}>Bedrooms:</Text>
                  <Text style={styles.reviewValue}>{bedrooms || "Not specified"}</Text>
                </View>
                
                <View style={styles.reviewDetail}>
                  <Text style={styles.reviewLabel}>Bathrooms:</Text>
                  <Text style={styles.reviewValue}>{bathrooms || "Not specified"}</Text>
                </View>
                
                <View style={styles.reviewDetail}>
                  <Text style={styles.reviewLabel}>Address:</Text>
                  <Text style={styles.reviewValue}>{address || "Not specified"}</Text>
                </View>
              </LinearGradient>
            </View>
          </MotiView>
        )}
      </ScrollView>
      
      <LinearGradient
        colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.95)']}
        style={styles.footer}
      >
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={goToPreviousStep}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>
              {step === 1 ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={goToNextStep}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>{step === 5 ? "Publish Listing" : "Next"}</Text>
                <MaterialIcons 
                  name={step === 5 ? "check" : "arrow-forward"} 
                  size={20} 
                  color="#fff" 
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Type Selection Modal */}
      <Modal
        visible={typeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTypeModalVisible(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => setTypeModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Accommodation Type</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setTypeModalVisible(false)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={types}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, typeId === item.id && styles.modalItemSelected]}
                  onPress={() => {
                    setTypeId(item.id.toString())
                    setTypeModalVisible(false)
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {typeId === item.id && (
                    <MaterialIcons name="check" size={20} color={Colors[colorScheme ?? "light"].tint} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Campus Selection Modal */}
      <Modal
        visible={campusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCampusModalVisible(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => setCampusModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Campus</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setCampusModalVisible(false)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
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
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {campusId === item.id && (
                    <MaterialIcons name="check" size={20} color={Colors[colorScheme ?? "light"].tint} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Image Options Modal */}
      <Modal
        visible={imageOptionsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImageOptionsVisible(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1} 
          onPress={() => setImageOptionsVisible(false)}
        >
          <View style={styles.imageOptionsContainer} onStartShouldSetResponder={() => true}>
            <TouchableOpacity style={styles.imageOption} onPress={pickImage}>
              <MaterialIcons name="photo-library" size={24} color={Colors[colorScheme ?? "light"].tint} />
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setImageOptionsVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  // Step Indicators
  stepsContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  stepIndicatorActive: {
    backgroundColor: Colors.light.tint,
  },
  stepIndicatorCompleted: {
    backgroundColor: Colors.light.success,
  },
  stepIndicatorText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#999",
  },
  stepIndicatorTextActive: {
    color: "#fff",
  },
  stepLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 12,
  },
  stepLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    width: 50,
  },
  stepLabelActive: {
    color: Colors.light.tint,
    fontWeight: "500",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.light.text,
  },
  stepSubtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
  },
  formCard: {
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
    marginBottom: 8,
    color: "#555",
  },
  required: {
    color: "#f43f5e",
    fontWeight: "normal",
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
    minHeight: 120,
    textAlignVertical: "top",
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  selectInputText: {
    fontSize: 16,
    color: "#333",
  },
  selectInputPlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  inputWithButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWithButtonText: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  addButton: {
    backgroundColor: Colors.light.tint,
    height: 48,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    marginRight: 4,
  },
  tipContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f7ff",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    marginLeft: 8,
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
  reviewContainer: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  reviewGradient: {
    padding: 16,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: Colors.light.text,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  reviewDetail: {
    flexDirection: "row",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    paddingBottom: 8,
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  primaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  secondaryButton: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    marginRight: 8,
    width: 100,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: "#666",
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
    marginTop: 'auto',
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
    backgroundColor: "#f0f7ff",
  },
  modalItemText: {
    fontSize: 16,
  },
  imageOptionsContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 30 : 20,
    marginTop: 'auto',
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
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "red",
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  selectIcon: {
    marginRight: 8,
  },
}) 