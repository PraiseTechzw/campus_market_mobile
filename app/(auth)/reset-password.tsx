"use client"

import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/providers/theme-provider"
import { useAuth } from "@/providers/auth-provider"
import { useAuthForm } from "@/hooks/use-auth-form"
import TextInput from "@/components/text-input"
import Button from "@/components/button"
import Toast from "react-native-toast-message"

interface ResetPasswordFormValues extends Record<string, string> {
  password: string
  confirmPassword: string
}

export default function ResetPasswordScreen() {
  const { colors } = useTheme()
  const { updatePassword } = useAuth()

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } =
    useAuthForm<ResetPasswordFormValues>({
      initialValues: {
        password: "",
        confirmPassword: "",
      },
      validation: {
        password: [
          {
            validate: (value) => !!value.trim(),
            message: "Password is required",
          },
          {
            validate: (value) => value.length >= 8,
            message: "Password must be at least 8 characters",
          },
          {
            validate: (value) => /[A-Z]/.test(value),
            message: "Password must contain at least one uppercase letter",
          },
          {
            validate: (value) => /[0-9]/.test(value),
            message: "Password must contain at least one number",
          },
        ],
        confirmPassword: [
          {
            validate: (value) => !!value.trim(),
            message: "Please confirm your password",
          },
          {
            validate: (value, formValues) => value === formValues.password,
            message: "Passwords do not match",
          },
        ],
      },
      onSubmit: async (values) => {
        try {
          await updatePassword(values.password)

          Toast.show({
            type: "success",
            text1: "Password Updated",
            text2: "Your password has been successfully reset",
          })

          router.replace("/(auth)/login")
        } catch (error) {
          // Error is handled in the auth provider
        }
      },
    })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>Create a new password for your account</Text>

          <View style={styles.formContainer}>
            <TextInput
              label="New Password"
              placeholder="Create a new password"
              value={values.password}
              onChangeText={handleChange("password")}
              onBlur={handleBlur("password")}
              error={touched.password ? errors.password : undefined}
              isPassword
              leftIcon="lock"
              autoComplete="password-new"
              textContentType="newPassword"
            />

            <TextInput
              label="Confirm Password"
              placeholder="Confirm your new password"
              value={values.confirmPassword}
              onChangeText={handleChange("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              isPassword
              leftIcon="lock"
              autoComplete="password-new"
              textContentType="newPassword"
            />

            <Button
              title="Reset Password"
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
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  formContainer: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 16,
  },
})
