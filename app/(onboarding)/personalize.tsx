"use client"

import { useState } from "react"
import { StyleSheet, View, Text, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import { useOnboarding } from "@/providers/onboarding-provider"
import Button from "@/components/button"
import Animated, { FadeIn } from "react-native-reanimated"

// Define the Button variant type to match the component
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"

interface Category {
  id: string
  name: string
  icon: string
}

const categories: Category[] = [
  { id: "textbooks", name: "Textbooks", icon: "book" },
  { id: "electronics", name: "Electronics", icon: "laptop" },
  { id: "furniture", name: "Furniture", icon: "bed" },
  { id: "clothing", name: "Clothing", icon: "checkroom" },
  { id: "sports", name: "Sports Equipment", icon: "sports-basketball" },
  { id: "tickets", name: "Event Tickets", icon: "confirmation-number" },
  { id: "services", name: "Campus Services", icon: "miscellaneous-services" },
  { id: "booster", name: "Booster Packages", icon: "archive" },
  { id: "groceries", name: "Bulk Groceries", icon: "shopping-cart" },
  { id: "tuckshop", name: "Tuck Shop Items", icon: "store" },
  { id: "combi", name: "Combi Services", icon: "directions-bus" },
]

const accommodationTypesList: Category[] = [
  { id: "single", name: "Single Room", icon: "person" },
  { id: "sharing2", name: "2-Sharing Room", icon: "groups" },
  { id: "sharing3", name: "3-Sharing Room", icon: "groups" },
  { id: "sharing4", name: "4-Sharing Room", icon: "groups" },
  { id: "cottage", name: "Cottage", icon: "home" },
  { id: "bedsitter", name: "Bedsitter", icon: "bed" },
  { id: "boarding", name: "Boarding House", icon: "business" },
  { id: "hostel", name: "Campus Hostel", icon: "apartment" },
]

// Comprehensive list of Zimbabwe institutions
const institutions = [
  // Universities (alphabetically sorted)
  "Africa University",
  "Bindura University of Science Education",
  "Catholic University in Zimbabwe",
  "Chinhoyi University of Technology",
  "Great Zimbabwe University",
  "Gwanda State University",
  "Harare Institute of Technology",
  "Lupane State University",
  "Manicaland State University of Applied Sciences",
  "Marondera University of Agricultural Sciences",
  "Midlands State University",
  "National University of Science and Technology",
  "Reformed Church University",
  "Solusi University",
  "University of Zimbabwe",
  "Women's University in Africa",
  "Zimbabwe Ezekiel Guti University",
  "Zimbabwe Open University",
  
  // Polytechnic Colleges (alphabetically sorted)
  "Bulawayo Polytechnic",
  "Gweru Polytechnic",
  "Harare Polytechnic",
  "Kwekwe Polytechnic",
  "Masvingo Polytechnic",
  "Mutare Polytechnic",
  
  // Teachers' Colleges (alphabetically sorted)
  "Belvedere Teachers College",
  "Hillside Teachers College",
  "Marymount Teachers College",
  "Mkoba Teachers College",
  "Morgan ZINTEC College",
  "Mutare Teachers College",
  "Seke Teachers College",
  "United College of Education",
  
  // Other Colleges (alphabetically sorted)
  "Air Force of Zimbabwe School of Academic Training",
  "School of Mines",
  "ZESA National Training Centre",
  "Zimbabwe Military Academy",
  "ZIPAM",
  
  "Other"
]

export default function PersonalizeScreen() {
  const { colors } = useTheme()
  const { savePreferences } = useOnboarding()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showAccommodation, setShowAccommodation] = useState(false)
  const [showAcademic, setShowAcademic] = useState(false)
  const [selectedAccommodationTypes, setSelectedAccommodationTypes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState({ min: 50, max: 300 })
  const [selectedInstitution, setSelectedInstitution] = useState("")
  const [studyYear, setStudyYear] = useState("")
  const [showAllInstitutions, setShowAllInstitutions] = useState(false)

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  const handleAccommodationToggle = (typeId: string) => {
    setSelectedAccommodationTypes((prev) => {
      if (prev.includes(typeId)) {
        return prev.filter((id) => id !== typeId)
      } else {
        return [...prev, typeId]
      }
    })
  }

  const handleNext = async () => {
    // Save user preferences
    await savePreferences({
      categories: selectedCategories,
      notificationsEnabled,
      accommodationPreferences: showAccommodation ? {
        type: selectedAccommodationTypes,
        priceRange: priceRange,
      } : undefined,
      academicInfo: showAcademic ? {
        institution: selectedInstitution,
        year: studyYear
      } : undefined
    })
    router.push("/(onboarding)/final")
  }

  const handleSkip = () => {
    router.push("/(onboarding)/final")
  }

  // Display 5 institutions by default, or all if showAllInstitutions is true
  const displayedInstitutions = showAllInstitutions 
    ? institutions 
    : institutions.slice(0, 5);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.skipContainer}>
        <Button title="Skip" variant="secondary" onPress={handleSkip} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Personalize Your Experience</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>
            Select your preferences to get tailored recommendations
          </Text>
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>I'm interested in buying:</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <Animated.View key={category.id} entering={FadeIn.delay(200 + index * 50).duration(400)}>
                <Button
                  title={category.name}
                  icon={category.icon} 
                  variant={selectedCategories.includes(category.id) ? "primary" : "outline"}
                  onPress={() => handleCategoryToggle(category.id)}
                  style={styles.categoryButton}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        <Animated.View entering={FadeIn.delay(800).duration(500)} style={styles.accommodationContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Accommodation Preferences</Text>
            <Button
              title={showAccommodation ? "Hide Options" : "Show Options"}
              variant="secondary"
              onPress={() => setShowAccommodation(!showAccommodation)}
              size="small"
            />
          </View>
          
          {showAccommodation && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.accommodationOptions}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>Accommodation types I'm looking for:</Text>
              <View style={styles.categoriesGrid}>
                {accommodationTypesList.map((type, index) => (
                  <Animated.View key={type.id} entering={FadeIn.delay(100 + index * 50).duration(400)}>
                    <Button
                      title={type.name}
                      icon={type.icon}
                      variant={selectedAccommodationTypes.includes(type.id) ? "primary" : "outline"}
                      onPress={() => handleAccommodationToggle(type.id)}
                      style={styles.accommodationButton}
                    />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View entering={FadeIn.delay(900).duration(500)} style={styles.academicContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Academic Information</Text>
            <Button
              title={showAcademic ? "Hide Options" : "Show Options"}
              variant="secondary"
              onPress={() => setShowAcademic(!showAcademic)}
              size="small"
            />
          </View>
          
          {showAcademic && (
            <Animated.View entering={FadeIn.duration(400)}>
              <Text style={[styles.label, { color: colors.textDim }]}>Institution</Text>
              <View style={styles.institutionsWrapper}>
                {displayedInstitutions.map((institution, index) => (
                  <Animated.View key={institution} entering={FadeIn.delay(50 * index).duration(300)}>
                    <Button
                      key={institution}
                      title={institution}
                      variant={selectedInstitution === institution ? "primary" : "outline"}
                      onPress={() => setSelectedInstitution(institution)}
                      style={styles.institutionButton}
                    />
                  </Animated.View>
                ))}
              </View>
              
              {institutions.length > 5 && (
                <Button
                  title={showAllInstitutions ? "Show Less" : "Show More Institutions"}
                  variant="ghost"
                  onPress={() => setShowAllInstitutions(!showAllInstitutions)}
                  style={styles.showMoreButton}
                />
              )}
              
              <Text style={[styles.label, { marginTop: 16, color: colors.textDim }]}>Year of Study</Text>
              <View style={styles.yearsWrapper}>
                {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th+ Year"].map((year) => (
                  <Button
                    key={year}
                    title={year}
                    variant={studyYear === year ? "primary" : "outline"}
                    onPress={() => setStudyYear(year)}
                    style={styles.yearButton}
                  />
                ))}
              </View>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1000).duration(500)} style={styles.notificationsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <View
            style={[styles.notificationToggle, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          >
            <View style={styles.notificationTextContainer}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>Enable Notifications</Text>
              <Text style={[styles.notificationDescription, { color: colors.textDim }]}>
                Get alerts for new listings, messages, and offers
              </Text>
            </View>
            <Button
              icon={notificationsEnabled ? "notifications" : "notifications-off"}
              variant={notificationsEnabled ? "primary" : "outline"}
              title={notificationsEnabled ? "On" : "Off"}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              style={styles.toggleButton}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <View style={styles.paginationContainer}>
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, styles.activeDot, { backgroundColor: colors.tint }]} />
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
        </View>

        <Button title="Next" onPress={handleNext} fullWidth />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    alignItems: "flex-end",
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  headerContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  categoryButton: {
    margin: 4,
    minWidth: 95,
  },
  accommodationContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  accommodationOptions: {
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  accommodationButton: {
    margin: 4,
    minWidth: 95,
  },
  academicContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
  },
  institutionsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  institutionButton: {
    margin: 4,
    minWidth: 150,
  },
  showMoreButton: {
    marginTop: 8,
    alignSelf: "center",
  },
  yearsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  yearButton: {
    margin: 4,
    minWidth: 95,
  },
  notificationsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  notificationToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  toggleButton: {
    marginLeft: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 16,
  },
})
