"use client"

import { StyleSheet, View, Text, FlatList, Image, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import Button from "@/components/button"
import Animated, { FadeIn } from "react-native-reanimated"

const { width } = Dimensions.get("window")

interface Feature {
  id: string
  title: string
  description: string
  icon: string
}

const features: Feature[] = [
  {
    id: "1",
    title: "Buy & Sell Easily",
    description: "List items for sale or find what you need with just a few taps",
    icon: "shopping-bag",
  },
  {
    id: "2",
    title: "Secure Messaging",
    description: "Chat directly with buyers and sellers to negotiate or ask questions",
    icon: "message-circle",
  },
  {
    id: "3",
    title: "Campus Community",
    description: "Connect with students from your campus in a trusted marketplace",
    icon: "users",
  },
  {
    id: "4",
    title: "Verified Profiles",
    description: "Know who you're dealing with through our verification system",
    icon: "shield",
  },
]

export default function FeaturesScreen() {
  const { colors } = useTheme()

  const handleNext = () => {
    router.push("/(onboarding)/personalize")
  }

  const handleSkip = () => {
    router.push("/(onboarding)/final")
  }

  const renderFeatureItem = ({ item, index }: { item: Feature; index: number }) => (
    <Animated.View
      entering={FadeIn.delay(300 + index * 200).duration(800)}
      style={[styles.featureItem, { backgroundColor: colors.cardBackground }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.tint + "20" }]}>
        <Image
          source={{ uri: `/placeholder.svg?height=32&width=32&text=${item.icon}` }}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.featureDescription, { color: colors.textDim }]}>{item.description}</Text>
      </View>
    </Animated.View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.skipContainer}>
        <Button title="Skip" variant="text" onPress={handleSkip} />
      </View>

      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Key Features</Text>
        <Text style={[styles.subtitle, { color: colors.textDim }]}>
          Discover what makes Campus Market the perfect platform for campus commerce
        </Text>
      </View>

      <FlatList
        data={features}
        renderItem={renderFeatureItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.featuresList}
      />

      <View style={styles.footer}>
        <View style={styles.paginationContainer}>
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, styles.activeDot, { backgroundColor: colors.tint }]} />
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
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
  featuresList: {
    paddingHorizontal: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  icon: {
    width: 32,
    height: 32,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
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
