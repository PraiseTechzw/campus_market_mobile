"use client"

import { StyleSheet, View, Text, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import { useOnboarding } from "@/providers/onboarding-provider"
import { useAuth } from "@/providers/auth-provider"
import Button from "@/components/button"
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  SlideInRight, 
  ZoomIn,
  BounceIn,
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

export default function FinalScreen() {
  const { colors } = useTheme()
  const { completeOnboarding } = useOnboarding()
  const { session } = useAuth()
  const bounceValue = useSharedValue(0)
  const rotateValue = useSharedValue(0)

  useEffect(() => {
    bounceValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    )

    rotateValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    )
  }, [])

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withSpring(bounceValue.value * 10) },
      { rotate: withSpring(rotateValue.value * 5 + "deg") }
    ],
  }))

  const handleGetStarted = async () => {
    await completeOnboarding()

    if (session) {
      // User is already logged in
      router.replace("/(tabs)")
    } else {
      // User needs to log in
      router.replace("/(auth)/login")
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        <Animated.View entering={FadeInUp.delay(300).duration(1000)} style={styles.imageContainer}>
          <Animated.View 
            style={[styles.iconBackground, { backgroundColor: colors.tint + "15" }, bounceStyle]}
          >
            <Animated.View entering={ZoomIn.delay(500).springify()}>
              <Feather name="check-circle" size={width * 0.2} color={colors.tint} />
            </Animated.View>
          </Animated.View>
          <Animated.View 
            entering={BounceIn.delay(800).springify()} 
            style={[styles.decorativeIcon1, { backgroundColor: colors.tint + "10" }]}
          >
            <Feather name="star" size={24} color={colors.tint} />
          </Animated.View>
          <Animated.View 
            entering={BounceIn.delay(1000).springify()} 
            style={[styles.decorativeIcon2, { backgroundColor: colors.tint + "10" }]}
          >
            <Feather name="award" size={24} color={colors.tint} />
          </Animated.View>
          <Animated.View 
            entering={BounceIn.delay(1200).springify()} 
            style={[styles.decorativeIcon3, { backgroundColor: colors.tint + "10" }]}
          >
            <Feather name="smile" size={24} color={colors.tint} />
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(1000)} style={styles.textContainer}>
          <Animated.Text 
            entering={FadeInDown.delay(800).springify()}
            style={[styles.title, { color: colors.text }]}
          >
            You're All Set!
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(1000).springify()}
            style={[styles.subtitle, { color: colors.textDim }]}
          >
            Start exploring the marketplace, connect with fellow students, and find great deals on campus
          </Animated.Text>
          <Animated.View 
            entering={FadeInDown.delay(1200).springify()}
            style={styles.featureIcons}
          >
            <Animated.View 
              entering={SlideInRight.delay(1400).springify()}
              style={[styles.featureIcon, { backgroundColor: colors.tint + "15" }]}
            >
              <Feather name="compass" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.textDim }]}>Explore</Text>
            </Animated.View>
            <Animated.View 
              entering={SlideInRight.delay(1600).springify()}
              style={[styles.featureIcon, { backgroundColor: colors.tint + "15" }]}
            >
              <Feather name="heart" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.textDim }]}>Connect</Text>
            </Animated.View>
            <Animated.View 
              entering={SlideInRight.delay(1800).springify()}
              style={[styles.featureIcon, { backgroundColor: colors.tint + "15" }]}
            >
              <Feather name="trending-up" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.textDim }]}>Trade</Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(900).duration(1000)} style={styles.footer}>
        <Animated.View 
          entering={FadeInUp.delay(1000).springify()}
          style={styles.paginationContainer}
        >
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, styles.activeDot, { backgroundColor: colors.tint }]} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(1100).springify()}>
          <Button title="Get Started" onPress={handleGetStarted} fullWidth />
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  imageContainer: {
    marginBottom: 40,
    position: "relative",
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBackground: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeIcon1: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeIcon2: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeIcon3: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  featureIcons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  featureIcon: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: "500",
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
