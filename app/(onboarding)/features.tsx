"use client"

import { StyleSheet, View, Text, FlatList, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import Button from "@/components/button"
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  SlideInRight, 
  ZoomIn,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  useSharedValue,
  withRepeat
} from "react-native-reanimated"
import { Feather } from "@expo/vector-icons"
import { useEffect } from "react"

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
  const pulseValue = useSharedValue(0)

  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    )
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 + pulseValue.value * 0.1) }],
  }))

  const handleNext = () => {
    router.push("/(onboarding)/personalize")
  }

  const handleSkip = () => {
    router.push("/(onboarding)/final")
  }

  const renderFeatureItem = ({ item, index }: { item: Feature; index: number }) => (
    <Animated.View
      entering={FadeIn.delay(300 + index * 200).springify()}
      style={[styles.featureItem, { backgroundColor: colors.cardBackground }]}
    >
      <Animated.View 
        style={[styles.iconContainer, { backgroundColor: colors.tint + "20" }, pulseStyle]}
      >
        <Animated.View entering={ZoomIn.delay(500 + index * 200).springify()}>
          <Feather name={item.icon as any} size={24} color={colors.tint} />
        </Animated.View>
      </Animated.View>
      <Animated.View 
        entering={SlideInRight.delay(600 + index * 200).springify()}
        style={styles.featureTextContainer}
      >
        <Animated.Text 
          entering={FadeInDown.delay(700 + index * 200).springify()}
          style={[styles.featureTitle, { color: colors.text }]}
        >
          {item.title}
        </Animated.Text>
        <Animated.Text 
          entering={FadeInDown.delay(800 + index * 200).springify()}
          style={[styles.featureDescription, { color: colors.textDim }]}
        >
          {item.description}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View 
        entering={SlideInRight.delay(200).springify()}
        style={styles.skipContainer}
      >
        <Button title="Skip" variant="ghost" onPress={handleSkip} />
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(400).springify()}
        style={styles.headerContainer}
      >
        <Animated.Text 
          entering={FadeInDown.delay(500).springify()}
          style={[styles.title, { color: colors.text }]}
        >
          Key Features
        </Animated.Text>
        <Animated.Text 
          entering={FadeInDown.delay(600).springify()}
          style={[styles.subtitle, { color: colors.textDim }]}
        >
          Discover what makes Campus Market the perfect platform for campus commerce
        </Animated.Text>
      </Animated.View>

      <FlatList
        data={features}
        renderItem={renderFeatureItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.featuresList}
      />

      <Animated.View 
        entering={FadeInUp.delay(900).springify()}
        style={styles.footer}
      >
        <Animated.View 
          entering={FadeInUp.delay(1000).springify()}
          style={styles.paginationContainer}
        >
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, styles.activeDot, { backgroundColor: colors.tint }]} />
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(1100).springify()}>
          <Button title="Next" onPress={handleNext} fullWidth />
        </Animated.View>
      </Animated.View>
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
