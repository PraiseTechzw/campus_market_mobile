"use client"

import { StyleSheet, View, Text, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/providers/theme-provider"
import { useAuth } from "@/providers/auth-provider"
import { useAuthForm } from "@/hooks/use-auth-form"
import TextInput from "@/components/text-input"
import Button from "@/components/button"

interface ForgotPasswordFormValues {
  email: string
}

export default function ForgotPasswordScreen() {
  const { colors } = useTheme()
  const { resetPassword } = useAuth()

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } =
    useAuthForm<ForgotPasswordFormValues>({
      initialValues: {
        email: "",
      },
      validation: {
        email: [
          {
            validate: (value) => !!value.trim(),
            message: "Email is required",
          },
          {
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: "Please enter a valid email address",
          },
        ],
      },
      onSubmit: async (values) => {
        try {
          await resetPassword(values.email)
          router.push("/(auth)/reset-password-sent")
        } catch (error) {
          // Error is handled in the auth provider
        }
      },
    })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.backButton}>
            <Button title="Back" variant="text" icon="arrow-back" onPress={() => router.back()} iconPosition="left" />
          </View>

          <View style={styles.logoContainer}>
            <Image source={{ uri: "/placeholder.svg?height=80&width=80" }} style={styles.logo} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Forgot Password</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>
            Enter your email address and we'll send you a link to reset your password
          </Text>

          <View style={styles.formContainer}>
            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={values.email}
              onChangeText={handleChange("email")}
              onBlur={handleBlur("email")}
              error={touched.email ? errors.email : undefined}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="email"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <Button
              title="Send Reset Link"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              size="large"
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 16,
  },
})
