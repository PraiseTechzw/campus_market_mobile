"use client"

import { StyleSheet, View, Text, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import { useOnboarding } from "@/providers/onboarding-provider"
import { useAuth } from "@/providers/auth-provider"
import Button from "@/components/button"
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated"

export default function FinalScreen() {
  const { colors } = useTheme()
  const { completeOnboarding } = useOnboarding()
  const { session } = useAuth()

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
          <Image source={{ uri: "/placeholder.svg?height=300&width=300" }} style={styles.image} resizeMode="contain" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(1000)} style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>You're All Set!</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>
            Start exploring the marketplace, connect with fellow students, and find great deals on campus
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(900).duration(1000)} style={styles.footer}>
        <View style={styles.paginationContainer}>
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, { backgroundColor: colors.border }]} />
          <View style={[styles.paginationDot, styles.activeDot, { backgroundColor: colors.tint }]} />
        </View>

        <Button title="Get Started" onPress={handleGetStarted} fullWidth />
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
  },
  image: {
    width: 200,
    height: 200,
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
