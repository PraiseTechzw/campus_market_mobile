"use client"

import { useEffect } from "react"
import { View, ActivityIndicator } from "react-native"
import { router } from "expo-router"
import { useAuth } from "@/providers/auth-provider"
import { useOnboarding } from "@/providers/onboarding-provider"
import { useTheme } from "@/providers/theme-provider"

export default function Index() {
  const { session, loading: authLoading } = useAuth()
  const { isComplete, loading: onboardingLoading } = useOnboarding()
  const { colors } = useTheme()

  useEffect(() => {
    if (!authLoading && !onboardingLoading) {
      if (!isComplete) {
        // User hasn't completed onboarding
        router.replace("/(onboarding)/welcome")
      } else if (session) {
        // User is authenticated and has completed onboarding
        router.replace("/(tabs)")
      } else {
        // User is not authenticated but has completed onboarding
        router.replace("/(auth)/login")
      }
    }
  }, [session, isComplete, authLoading, onboardingLoading])

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.tint} />
    </View>
  )
}
