"use client"

import { useEffect } from "react"
import { View, Text, ActivityIndicator, StyleSheet } from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import { SafeAreaView } from "react-native-safe-area-context"

export default function AuthCallbackScreen() {
  const { colors } = useTheme()
  const params = useLocalSearchParams()
  const type = params.type as string

  useEffect(() => {
    // The actual auth handling is done in the AuthProvider
    // This screen is just a landing page for deep links

    // Redirect based on the type of callback
    setTimeout(() => {
      if (type === "recovery") {
        router.replace("/(auth)/reset-password")
      } else if (type === "signup") {
        router.replace("/")
      } else if (type === "email_change") {
        router.replace("/profile/edit")
      } else {
        router.replace("/")
      }
    }, 2000)
  }, [type])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.text, { color: colors.text }]}>
          {type === "recovery"
            ? "Processing password reset..."
            : type === "signup"
              ? "Verifying your email..."
              : type === "email_change"
                ? "Updating your email..."
                : "Processing authentication..."}
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  text: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
})
