"use client"

import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/providers/theme-provider"
import { useAuth } from "@/providers/auth-provider"
import Button from "@/components/button"
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { useState, useEffect } from "react"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { globalStyles } from "@/constants/Styles"
import Toast from "react-native-toast-message"

const { width } = Dimensions.get("window")

export default function VerificationPendingScreen() {
  const { colors } = useTheme()
  const { sendVerificationEmail, user, signOut } = useAuth()
  const [isResending, setIsResending] = useState(false)
  
  // Animation values
  const scale = useSharedValue(1)
  const envelopeScale = useSharedValue(1)
  const envelopeRotation = useSharedValue(0)
  const checkmarkOpacity = useSharedValue(0)
  const checkmarkScale = useSharedValue(0)

  useEffect(() => {
    // Check if user is verified and redirect if true
    if (user?.email_confirmed_at) {
      router.replace("/(auth)/preferences")
    }
  }, [user?.email_confirmed_at])

  useEffect(() => {
    // Start continuous animation for the envelope
    envelopeScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.ease }),
        withTiming(1, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      true
    )

    // Subtle rotation animation
    envelopeRotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000, easing: Easing.ease }),
        withTiming(5, { duration: 2000, easing: Easing.ease })
      ),
      -1,
      true
    )
  }, [])

  const handleResendEmail = async () => {
    try {
      setIsResending(true)
      scale.value = withSequence(
        withSpring(0.95),
        withSpring(1)
      )
      await sendVerificationEmail()
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Verification Email Sent',
        text2: 'Please check your inbox for the verification link.',
        position: 'bottom',
      })
      
      // Animate checkmark
      checkmarkOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1000, withTiming(0, { duration: 300 }))
      )
      checkmarkScale.value = withSequence(
        withSpring(1),
        withDelay(1000, withSpring(0))
      )
    } catch (error) {
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Failed to Send Email',
        text2: 'Please try again later.',
        position: 'bottom',
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace("/(auth)/login")
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const envelopeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: envelopeScale.value },
      { rotate: `${envelopeRotation.value}deg` }
    ],
  }))

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkmarkOpacity.value,
    transform: [{ scale: checkmarkScale.value }],
  }))

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
        <Animated.View 
          entering={FadeInDown.delay(200).duration(1000)} 
          style={[styles.illustrationContainer, envelopeAnimatedStyle]}
        >
          <BlurView intensity={20} style={styles.illustrationBlur}>
            <MaterialCommunityIcons 
              name="email-check-outline" 
              size={80} 
              color={colors.tint} 
            />
          </BlurView>
          <Animated.View style={[styles.checkmarkContainer, checkmarkAnimatedStyle]}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={32} 
              color={colors.success} 
            />
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(1000)}>
          <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>
            We've sent a verification email to:
          </Text>
          <Text style={[styles.email, { color: colors.tint }]}>{user?.email}</Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(600).duration(1000)} 
          style={[styles.messageContainer, animatedStyle]}
        >
          <BlurView intensity={20} style={styles.messageBlur}>
            <Text style={[styles.message, { color: colors.textDim }]}>
              Please check your email and click the verification link to activate your account. If you don't see the email,
              check your spam folder.
            </Text>

            <Text style={[styles.message, { color: colors.textDim, marginTop: 10 }]}>
              After verification, you'll be able to set up your preferences and get personalized recommendations for products and accommodations.
            </Text>

            <Text style={[styles.note, { color: colors.textDim }]}>
              Note: The verification link will expire in 24 hours.
            </Text>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800).duration(1000)} style={styles.buttonContainer}>
          <Button
            title="Resend Verification Email"
            onPress={handleResendEmail}
            loading={isResending}
            disabled={isResending}
            fullWidth
            style={styles.resendButton}
          />

          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleSignOut}
            fullWidth
            style={styles.signOutButton}
          />
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  illustrationBlur: {
    padding: 32,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 4,
  },
  title: {
    ...globalStyles.h1,
    fontFamily: 'Poppins-Bold',
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    ...globalStyles.bodyLarge,
    fontFamily: 'Poppins-Regular',
    textAlign: "center",
    marginBottom: 8,
  },
  email: {
    ...globalStyles.h3,
    fontFamily: 'Poppins-SemiBold',
    textAlign: "center",
    marginBottom: 32,
  },
  messageContainer: {
    width: "100%",
    marginBottom: 32,
  },
  messageBlur: {
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  message: {
    ...globalStyles.bodyLarge,
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 16,
  },
  note: {
    ...globalStyles.bodyMedium,
    fontFamily: 'Poppins-Italic',
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  resendButton: {
    marginBottom: 16,
  },
  signOutButton: {
    marginBottom: 8,
  },
})