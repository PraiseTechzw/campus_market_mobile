"use client"

import type React from "react"

import { useEffect } from "react"
import { useSession } from "@/providers/session-provider"
import { useRouter } from "expo-router"
import { View, ActivityIndicator } from "react-native"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/use-color-scheme"

type AuthGuardProps = {
  children: React.ReactNode
  requireAuth?: boolean
  requireOnboarding?: boolean
}

export default function AuthGuard({ children, requireAuth = true, requireOnboarding = false }: AuthGuardProps) {
  const { session, isLoading, needsOnboarding } = useSession()
  const router = useRouter()
  const colorScheme = useColorScheme()

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !session) {
        // User is not authenticated but the route requires authentication
        router.replace("/(auth)/login")
      } else if (!requireAuth && session) {
        // User is authenticated but the route is for non-authenticated users (like login)
        if (needsOnboarding) {
          router.replace("/onboarding")
        } else {
          router.replace("/(tabs)")
        }
      } else if (requireOnboarding && session && !needsOnboarding) {
        // User has completed onboarding but is trying to access onboarding screen
        router.replace("/(tabs)")
      } else if (!requireOnboarding && session && needsOnboarding) {
        // User needs onboarding but is trying to access a protected route
        router.replace("/onboarding")
      }
    }
  }, [isLoading, session, router, needsOnboarding, requireAuth, requireOnboarding])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  // Only render children if conditions are met
  if (
    (requireAuth && !session) ||
    (!requireAuth && session) ||
    (requireOnboarding && session && !needsOnboarding) ||
    (!requireOnboarding && session && needsOnboarding)
  ) {
    return null
  }

  return <>{children}</>
}
