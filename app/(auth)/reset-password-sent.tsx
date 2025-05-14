"use client"

import { StyleSheet, View, Text, Image } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/providers/theme-provider"
import Button from "@/components/button"
import Animated, { FadeIn } from "react-native-reanimated"

export default function ResetPasswordSentScreen() {
  const { colors } = useTheme()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
        <Image source={{ uri: "/placeholder.svg?height=120&width=120" }} style={styles.image} />

        <Text style={[styles.title, { color: colors.text }]}>Check Your Email</Text>

        <Text style={[styles.message, { color: colors.textDim }]}>
          We've sent a password reset link to your email address. Please check your inbox and follow the instructions to
          reset your password.
        </Text>

        <Text style={[styles.note, { color: colors.textDim }]}>
          If you don't see the email, check your spam folder or try again.
        </Text>

        <View style={styles.buttonContainer}>
          <Button title="Back to Login" onPress={() => router.replace("/(auth)/login")} fullWidth />

          <Button
            title="Resend Email"
            variant="outline"
            onPress={() => router.replace("/(auth)/forgot-password")}
            fullWidth
            style={styles.resendButton}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  note: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    fontStyle: "italic",
  },
  buttonContainer: {
    width: "100%",
  },
  resendButton: {
    marginTop: 16,
  },
})
