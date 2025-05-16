"use client"

import React, { useState, useRef } from "react"
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
  Animated,
  Easing,
} from "react-native"
import { Text, View } from "@/components/themed"
import { useRouter, Stack } from "expo-router" 
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import AuthGuard from "@/components/auth-guard"
import * as ImagePicker from "expo-image-picker"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createEvent } from "@/services/events"
import CampusSelector from "@/components/campus-selector"
import type { Campus } from "@/types"
import DateTimePicker from "@react-native-community/datetimepicker" 
import { supabase } from "@/lib/supabase"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { LinearGradient } from "expo-linear-gradient"
import { MotiView } from "moti"

const { width } = Dimensions.get("window")

export default function QuickCreateEventScreen() {
  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <AuthGuard requireAuth={true} requireOnboarding={false}>
        <QuickCreateEventContent />
      </AuthGuard>
    </SafeAreaWrapper>
  )
}

function QuickCreateEventContent() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000)) // Default to 2 hours later
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Animation values
  const headerAnimation = useRef(new Animated.Value(0)).current
  const progressAnimation = useRef(new Animated.Value(0)).current
  
  // Date pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  
  // Update progress animation when step changes
  React.useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: (currentStep - 1) / (totalSteps - 1),
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start()
    
    // Header animation
    Animated.sequence([
      Animated.timing(headerAnimation, {
        toValue: 0.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start()
  }, [currentStep])
  
  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      Alert.alert("Success", "Your event has been created", [
        { text: "View Events", onPress: () => router.push("/events") }
      ])
    },
    onError: (error) => {
      // More detailed error logging
      console.error("Error creating event:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      
      // Show more specific error messages to user
      if (error instanceof Error) {
        Alert.alert("Error", `Failed to create event: ${error.message}`)
      } else {
        Alert.alert("Error", "Failed to create event. Please check console for details.")
      }
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
    if (!image || !session) return undefined;

    try {
      // Create a unique filename
      const fileExtMatch = image.match(/\.([^.]+)$/);
      const fileExt = (fileExtMatch && fileExtMatch[1]?.toLowerCase()) || 'jpg';
      const fileName = `event_image_${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      
      console.log(`Attempting upload to bucket events with path: ${filePath}`);
      
      // Try using FormData approach which works better on React Native
      const formData = new FormData();
      formData.append('file', {
        uri: image,
        type: fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' : 
              fileExt === 'png' ? 'image/png' : 
              fileExt === 'gif' ? 'image/gif' : 'image/jpeg',
        name: fileName,
      } as any);
      
      try {
        // Try upload to storage API with the user's ID path (helps with RLS policies)
        const { data, error } = await supabase.storage
          .from('events')
          .upload(filePath, formData as any);
        
        if (error) {
          console.error('Storage upload error:', error);
          
          // For RLS policy violations, just use a placeholder
          if (error.message?.includes('security') || error.message?.includes('policy')) {
            Alert.alert(
              'Storage Permission Error',
              'This app needs permission to store images. Please check your Supabase RLS policies for the storage bucket.',
              [{ text: 'OK' }]
            );
            return 'https://placehold.co/600x400?text=Event+Image';
          }
          throw error;
        }
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('events')
          .getPublicUrl(filePath);
        
        console.log('Successfully uploaded image:', urlData.publicUrl);
        return urlData.publicUrl;
      } catch (error) {
        console.error('Upload failed:', error);
        
        // Return a placeholder image to allow event creation to proceed
        return 'https://placehold.co/600x400?text=Event+Image';
      }
    } catch (error) {
      console.error('Error in image processing:', error);
      return 'https://placehold.co/600x400?text=Event+Image';
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
  
  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
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
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
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
      let imageUrl: string | undefined = undefined;
      
      if (image) {
        try {
          imageUrl = await uploadImage();
        } catch (uploadError: any) {
          console.error("Image upload failed:", uploadError);
          
          // If there's a message about bucket not found, we already showed an alert in uploadImage
          if (!uploadError.message?.includes('Bucket not found')) {
            // Ask the user if they want to continue without the image
            const continueWithoutImage = await new Promise<boolean>(resolve => {
              Alert.alert(
                "Image Upload Failed",
                "Would you like to create the event without an image?",
                [
                  { text: "Cancel", onPress: () => resolve(false) },
                  { text: "Continue Without Image", onPress: () => resolve(true) }
                ]
              );
            });
            
            if (!continueWithoutImage) {
              setLoading(false);
              return;
            }
          } else {
            setLoading(false);
            return; // Don't continue if bucket not found - they need to create it first
          }
        }
      }

      createEventMutation.mutate({
        title: title.trim(),
        description: description.trim() || "No description provided",
        location: location.trim(),
        campus_id: selectedCampus.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        organizer_id: session.user.id,
        image_url: imageUrl,
        is_featured: false
      })
    } catch (error) {
      console.error("Error creating event:", error)
      Alert.alert("Error", "Failed to create event. Please try again.")
      setLoading(false)
    }
  }
  
  const renderStepIndicator = () => {
    // Progress bar style
    const progressWidth = progressAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    })
    
    return (
      <View style={styles.stepIndicatorContainer}>
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              { width: progressWidth },
              { backgroundColor: Colors[colorScheme ?? "light"].tint }
            ]} 
          />
        </View>
        
        <View style={styles.dotsContainer}>
          {[...Array(totalSteps)].map((_, index) => {
            const stepNumber = index + 1
            const isActive = currentStep >= stepNumber
            const isCurrentStep = currentStep === stepNumber
            
            return (
              <View key={index} style={styles.stepDotWrapper}>
                <View 
                  style={[
                    styles.stepDot,
                    isActive ? { 
                      backgroundColor: Colors[colorScheme ?? "light"].tint,
                      transform: [{ scale: isCurrentStep ? 1.2 : 1 }] 
                    } : {}
                  ]}
                />
                <Text style={[
                  styles.stepLabel, 
                  isActive ? { color: Colors[colorScheme ?? "light"].tint, fontWeight: '600' } : {}
                ]}>
                  {stepNumber === 1 ? "Details" : 
                   stepNumber === 2 ? "Schedule" : 
                   "Media"}
                </Text>
              </View>
            )
          })}
        </View>
      </View>
    )
  }
  
  const renderStep1 = () => {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="information-circle" size={22} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>
              Event Details <Text style={styles.required}>*</Text>
            </Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Campus Music Festival"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              placeholderTextColor="#aaa"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Student Union Building"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#aaa"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Campus</Text>
            <View style={styles.campusSelectorContainer}>
              <CampusSelector
                selectedCampus={selectedCampus}
                onSelectCampus={setSelectedCampus}
              />
            </View>
          </View>
        </View>
      </MotiView>
    )
  }
  
  const renderStep2 = () => {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="calendar" size={22} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>
              Date & Time <Text style={styles.required}>*</Text>
            </Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowStartDatePicker(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="calendar-today" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.dateTimeText}>{formatDateForDisplay(startDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowStartTimePicker(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="access-time" size={20} color={Colors[colorScheme ?? "light"].tint} />
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
                activeOpacity={0.7}
              >
                <MaterialIcons name="calendar-today" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.dateTimeText}>{formatDateForDisplay(endDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowEndTimePicker(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="access-time" size={20} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.dateTimeText}>{formatTimeForDisplay(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#FFAB00" />
            <Text style={styles.infoCardText}>
              Events typically last 1-3 hours. You can always update the timing later.
            </Text>
          </View>
        </View>
      </MotiView>
    )
  }
  
  const renderStep3 = () => {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="image" size={22} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>
              Event Banner <Text style={styles.optional}>(Optional)</Text>
            </Text>
          </View>
          
          <RNView style={styles.imageContainer}>
            {image ? (
              <RNView style={styles.selectedImageContainer}>
                <Image source={{ uri: image }} style={styles.selectedImage} />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
                  style={styles.imageGradient}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImage(null)}
                >
                  <MaterialIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </RNView>
            ) : (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage} activeOpacity={0.7}>
                <MaterialIcons name="add-photo-alternate" size={32} color={Colors[colorScheme ?? "light"].tint} />
                <Text style={styles.addImageText}>Add Event Banner</Text>
                <Text style={styles.addImageSubtext}>Recommended size: 1200 × 675</Text>
              </TouchableOpacity>
            )}
          </RNView>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="document-text" size={22} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Description <Text style={styles.optional}>(Optional)</Text></Text>
          </View>
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your event (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#aaa"
          />
          
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#FFAB00" />
            <Text style={styles.infoCardText}>
              A good description includes details about activities, speakers, and what attendees can expect.
            </Text>
          </View>
        </View>
      </MotiView>
    )
  }
  
  // Header title animation
  const headerOpacity = headerAnimation
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <LinearGradient
        colors={[Colors[colorScheme ?? "light"].primary, Colors[colorScheme ?? "light"].accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Animated.Text style={[styles.headerTitle, { opacity: headerOpacity }]}>
          {currentStep === 1 ? "Event Details" : 
           currentStep === 2 ? "Event Schedule" : 
           "Additional Info"}
        </Animated.Text>
        <View style={styles.backButton} />
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
        >
          <Text style={styles.title}>Create your event</Text>
          <Text style={styles.subtitle}>Step {currentStep} of {totalSteps}</Text>
        </MotiView>
        
        {renderStepIndicator()}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>
      
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#ffffff']}
        style={styles.footerContainer}
      >
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={prevStep}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={Colors[colorScheme ?? "light"].tint} style={{ marginRight: 8 }} />
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < totalSteps ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, currentStep > 1 && { flex: 1, marginLeft: 12 }]}
              onPress={nextStep}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { flex: 1, marginLeft: currentStep > 1 ? 12 : 0 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Create Event</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
    elevation: 3,
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
    color: "#fff",
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
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  stepIndicatorContainer: {
    marginBottom: 24,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  stepDotWrapper: {
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ddd",
    marginBottom: 6,
  },
  stepLabel: {
    fontSize: 12,
    color: "#999",
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
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
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: "100%",
    height: 180,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(67, 97, 238, 0.05)",
  },
  addImageText: {
    fontSize: 16,
    color: "#10b981",
    marginTop: 8,
    fontWeight: '500',
  },
  addImageSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4, 
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  textArea: {
    minHeight: 120,
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
    borderRadius: 12,
    padding: 14,
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
    borderRadius: 12,
    backgroundColor: "#fafafa",
    overflow: 'hidden',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(255, 171, 0, 0.1)',
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  infoCardText: {
    color: '#664500',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 30,
    paddingBottom: 0,
    height: 120,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    flexDirection: "row",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: "#10b981",
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flex: 0.8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: "#4361ee",
    fontSize: 16,
    fontWeight: "bold",
  },
}) 