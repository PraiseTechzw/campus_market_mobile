"use client"

import { useState } from "react"
import { StyleSheet, View, Text, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import { useOnboarding } from "@/providers/onboarding-provider"
import Button from "@/components/button"
import Animated, { FadeIn } from "react-native-reanimated"

interface Category {
  id: string
  name: string
  icon: string
}

const categories: Category[] = [
  { id: "1", name: "Textbooks", icon: "book" },
  { id: "2", name: "Electronics", icon: "laptop" },
  { id: "3", name: "Furniture", icon: "bed" },
  { id: "4", name: "Clothing", icon: "shirt" },
  { id: "5", name: "Sports", icon: "football" },
  { id: "6", name: "Tickets", icon: "ticket" },
  { id: "7", name: "Services", icon: "construct" },
  { id: "8", name: "Other", icon: "ellipsis-horizontal" },
]

export default function PersonalizeScreen() {
  const { colors } = useTheme()
  const { savePreferences } = useOnboarding()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  const handleNext = async () => {
    // Save user preferences
    await savePreferences({
      categories: selectedCategories,
      notificationsEnabled,
    })
    router.push("/(onboarding)/final")
  }

  const handleSkip = () => {
    router.push("/(onboarding)/final")
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.skipContainer}>
        <Button title="Skip" variant="text" onPress={handleSkip} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Personalize Your Experience</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>
            Select categories you're interested in to get personalized recommendations
          </Text>
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>I'm interested in:</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <Animated.View key={category.id} entering={FadeIn.delay(200 + index * 100).duration(500)}>
                <Button
                  title={category.name}
                  icon={category.icon}
                  variant={selectedCategories.includes(category.id) ? "filled" : "outline"}
                  onPress={() => handleCategoryToggle(category.id)}
                  style={styles.categoryButton}
                  iconPosition="top"
                />
              </Animated.View>
            ))}
          </View>
        </View>

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
              variant={notificationsEnabled ? "filled" : "outline"}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              style={styles.toggleButton}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
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
    marginHorizontal: -8,
  },
  categoryButton: {
    margin: 8,
    minWidth: 100,
  },
  notificationsContainer: {
    paddingHorizontal: 24,
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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
    width: 20,
  },
})
