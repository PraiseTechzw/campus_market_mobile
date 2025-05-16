"use client"

import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native"
import { Text, View } from "@/components/themed"
import { useRouter } from "expo-router"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getListingCategories } from "@/services/marketplace"
import { getAccommodationTypes } from "@/services/accommodation"
import { getCampuses } from "@/services/campus"
import { updateUserProfile } from "@/services/profile"
import { addUserInterest } from "@/services/interests"
import {Ionicons} from "@expo/vector-icons"
import AuthGuard from "@/components/auth-guard"
import { StatusBar } from "expo-status-bar"

const { width } = Dimensions.get("window")

// Map category names to icons
const categoryIcons: Record<string, any> = {
  Books: (props: any) => <Ionicons name="book-outline" {...props} />,
  Electronics: (props: any) => <Ionicons name="hardware-chip-outline" {...props} />,
  Clothing: (props: any) => <Ionicons name="shirt-outline" {...props} />,
  Furniture: (props: any) => <Ionicons name="bed-outline" {...props} />,
  Food: (props: any) => <Ionicons name="restaurant-outline" {...props} />,
  Services: (props: any) => <Ionicons name="briefcase-outline" {...props} />,
  Other: (props: any) => <Ionicons name="cube-outline" {...props} />,
}

// Map accommodation types to icons
const accommodationIcons: Record<string, any> = {
  "Single Room": (props: any) => <Ionicons name="home-outline" {...props} />,
  "2-Share": (props: any) => <Ionicons name="people-outline" {...props} />,
  "3-Share": (props: any) => <Ionicons name="people-outline" {...props} />,
  "Self-Contained": (props: any) => <Ionicons name="water-outline" {...props} />,
  Apartment: (props: any) => <Ionicons name="business-outline" {...props} />,
  House: (props: any) => <Ionicons name="home-outline" {...props} />,
}

export default function OnboardingScreen() {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={true}>
      <OnboardingContent />
    </AuthGuard>
  )
}

function OnboardingContent() {
  const { session, setNeedsOnboarding } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const scrollViewRef = useRef<FlatList>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedAccommodationTypes, setSelectedAccommodationTypes] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    // Run entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [currentStep])

  const { data: categories } = useQuery({
    queryKey: ["listingCategories"],
    queryFn: getListingCategories,
  })

  const { data: accommodationTypes } = useQuery({
    queryKey: ["accommodationTypes"],
    queryFn: getAccommodationTypes,
  })

  const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: getCampuses,
  })

  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })

  const addInterestMutation = useMutation({
    mutationFn: addUserInterest,
  })

  const steps = [
    {
      title: "Welcome to UniConnect",
      description: "Let's set up your profile to get the most out of the app.",
      icon: (props: any) => <Ionicons name="sparkles-outline" {...props} />,
    },
    {
      title: "Tell us about yourself",
      description: "Please enter your name so other students can recognize you.",
      icon: (props: any) => <Ionicons name="person-outline" {...props} />,
    },
    {
      title: "Select your campus",
      description: "Choose your university to see relevant listings and accommodations.",
      icon: (props: any) => <Ionicons name="map-outline" {...props} />,
    },
    {
      title: "What are you interested in?",
      description: "Select categories you're interested in to get personalized recommendations.",
      icon: (props: any) => <Ionicons name="bag-outline" {...props} />,
    },
    {
      title: "What type of accommodation do you prefer?",
      description: "Select accommodation types you're interested in.",
      icon: (props: any) => <Ionicons name="business-outline" {...props} />,
    },
    {
      title: "You're all set!",
      description: "Your profile is now complete. Enjoy using UniConnect!",
      icon: (props: any) => <Ionicons name="sparkles-outline" {...props} />,
    },
  ]

  const animateToNextStep = () => {
    // Run exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After exit animation completes, move to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
        scrollViewRef.current?.scrollToIndex({ index: currentStep + 1, animated: false })

        // Reset animation values for entrance animation
        fadeAnim.setValue(0)
        slideAnim.setValue(50)
        scaleAnim.setValue(0.9)
      }
    })
  }

  const animateToPrevStep = () => {
    // Run exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After exit animation completes, move to previous step
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1)
        scrollViewRef.current?.scrollToIndex({ index: currentStep - 1, animated: false })

        // Reset animation values for entrance animation
        fadeAnim.setValue(0)
        slideAnim.setValue(-50)
        scaleAnim.setValue(0.9)
      }
    })
  }

  const nextStep = () => {
    if (currentStep === 1 && (!firstName.trim() || !lastName.trim())) {
      Alert.alert("Please enter your name", "Both first name and last name are required.")
      return
    }

    if (currentStep === 2 && !selectedCampusId) {
      Alert.alert("Please select a campus", "You need to select your campus to continue.")
      return
    }

    animateToNextStep()
  }

  const prevStep = () => {
    animateToPrevStep()
  }

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId))
    } else {
      setSelectedCategories([...selectedCategories, categoryId])
    }
  }

  const toggleAccommodationType = (typeId: string) => {
    if (selectedAccommodationTypes.includes(typeId)) {
      setSelectedAccommodationTypes(selectedAccommodationTypes.filter((id) => id !== typeId))
    } else {
      setSelectedAccommodationTypes([...selectedAccommodationTypes, typeId])
    }
  }

  const finishOnboarding = async () => {
    if (!session) return

    try {
      setIsSubmitting(true)

      // Update profile with name and campus
      await updateProfileMutation.mutateAsync({
        id: session.user.id,
        first_name: firstName,
        last_name: lastName,
        campus_id: selectedCampusId,
      })

      // Add interests for categories
      for (const categoryId of selectedCategories) {
        await addInterestMutation.mutateAsync({
          user_id: session.user.id,
          category_id: categoryId,
        })
      }

      // Add interests for accommodation types
      for (const typeId of selectedAccommodationTypes) {
        await addInterestMutation.mutateAsync({
          user_id: session.user.id,
          accommodation_type_id: typeId,
        })
      }

      // Mark onboarding as complete
      setNeedsOnboarding(false)

      // Navigate to home screen
      router.replace("/(tabs)")
    } catch (error) {
      console.error("Error saving onboarding data:", error)
      Alert.alert("Error", "Failed to save your preferences. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = ({ item, index }: { item: (typeof steps)[0]; index: number }) => {
    const StepIcon = item.icon

    return (
      <View style={[styles.stepContainer, { width }]}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <StepIcon size={32} color={Colors[colorScheme ?? "light"].tint} />
          </View>

          <Text style={styles.stepTitle}>{item.title}</Text>
          <Text style={styles.stepDescription}>{item.description}</Text>

          {index === 0 && (
            <Animated.View
              style={[
                styles.welcomeImageContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Image source={require("@/assets/images/logo.png")} style={styles.welcomeImage} />
            </Animated.View>
          )}

          {index === 1 && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter your first name"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter your last name"
                  />
                </View>
              </View>
            </View>
          )}

          {index === 2 && campuses && (
            <View style={styles.optionsContainer}>
              {campuses.map((campus) => (
                <TouchableOpacity
                  key={campus.id.toString()}
                  style={[styles.optionItem, selectedCampusId === campus.id && styles.selectedOptionItem]}
                  onPress={() => setSelectedCampusId(campus.id.toString())}
                >
                  <Ionicons name="map-pin-outline" size={20} color={selectedCampusId === campus.id ? "#fff" : "#666"} style={styles.optionIcon} />
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionText, selectedCampusId === campus.id && styles.selectedOptionText]}>
                      {campus.name}
                    </Text>
                    <Text
                      style={[styles.optionSubtext, selectedCampusId === campus.id && styles.selectedOptionSubtext]}
                    >
                      {campus.location}
                    </Text>
                  </View>
                      {selectedCampusId === campus.id && (
                    <Ionicons name="checkmark-outline" size={20} color="#fff" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {index === 3 && categories && (
            <View style={styles.interestsGrid}>
              {categories.map((category) => {
                const CategoryIcon = categoryIcons[category.name] || Package
                return (
                  <TouchableOpacity
                    key={category.id.toString()}
                    style={[
                      styles.interestItem,
                      selectedCategories.includes(category.id.toString()) && styles.selectedInterestItem,
                    ]}
                    onPress={() => toggleCategory(category.id.toString())}
                  >
                    <CategoryIcon
                      size={20}
                      color={selectedCategories.includes(category.id.toString()) ? "#fff" : "#666"}
                      style={styles.interestIcon}
                    />
                    <Text
                      style={[
                        styles.interestText,
                        selectedCategories.includes(category.id.toString()) && styles.selectedInterestText,
                      ]}
                    >
                      {category.name}
                    </Text>
                    {selectedCategories.includes(category.id.toString()) && (
                      <Ionicons name="checkmark-outline" size={16} color="#fff" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {index === 4 && accommodationTypes && (
            <View style={styles.interestsGrid}>
              {accommodationTypes.map((type) => {
                const AccommodationIcon = accommodationIcons[type.name] || ((props) => <Ionicons name="business-outline" {...props} />)
                return (
                  <TouchableOpacity
                    key={type.id.toString()}
                    style={[
                      styles.interestItem,
                      selectedAccommodationTypes.includes(type.id.toString()) && styles.selectedInterestItem,
                    ]}
                    onPress={() => toggleAccommodationType(type.id.toString())}
                  >
                    <AccommodationIcon
                      size={20}
                      color={selectedAccommodationTypes.includes(type.id.toString()) ? "#fff" : "#666"}
                      style={styles.interestIcon}
                    />
                    <Text
                      style={[
                        styles.interestText,
                        selectedAccommodationTypes.includes(type.id.toString()) && styles.selectedInterestText,
                      ]}
                    >
                      {type.name}
                    </Text>
                    {selectedAccommodationTypes.includes(type.id.toString()) && (
                      <Ionicons name="checkmark-outline" size={16} color="#fff" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {index === 5 && (
            <Animated.View
              style={[
                styles.completionContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Image source={require("@/assets/images/logo.png")} style={styles.completionImage} />
              <Text style={styles.completionText}>
                Thanks for completing your profile! You're now ready to explore UniConnect.
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    )
  }

  if (!session) return null

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ref={scrollViewRef}
        data={steps}
        renderItem={renderStep}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
      />

      <View style={styles.footer}>
        <View style={styles.indicators}>
          {steps.map((_, index) => (
            <View key={index} style={[styles.indicator, currentStep === index && styles.activeIndicator]} />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {currentStep < steps.length - 1 ? (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
              onPress={nextStep}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
              onPress={finishOnboarding}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.nextButtonText}>Get Started</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  stepContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  animatedContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    alignSelf: "center",
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  welcomeImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  welcomeImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  formContainer: {
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  optionsContainer: {
    marginTop: 20,
  },
  optionItem: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  selectedOptionItem: {
    backgroundColor: "#0891b2",
  },
  optionIcon: {
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedOptionText: {
    color: "#fff",
  },
  optionSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  selectedOptionSubtext: {
    color: "#e0f2fe",
  },
  checkIcon: {
    marginLeft: 8,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
  },
  interestItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    marginBottom: 12,
  },
  selectedInterestItem: {
    backgroundColor: "#0891b2",
  },
  interestIcon: {
    marginRight: 8,
  },
  interestText: {
    fontSize: 14,
    color: "#333",
  },
  selectedInterestText: {
    color: "#fff",
  },
  completionContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  completionImage: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  completionText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#0891b2",
    width: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: "#666",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0891b2",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
})
