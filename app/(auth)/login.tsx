"use client"

import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native"
import { router, Link } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/providers/theme-provider"
import { useAuth } from "@/providers/auth-provider"
import { useAuthForm } from "@/hooks/use-auth-form"
import TextInput from "@/components/text-input"
import Button from "@/components/button"
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { globalStyles } from "@/constants/Styles"

const { width } = Dimensions.get("window")

interface LoginFormValues extends Record<string, string> {
  email: string
  password: string
}

export default function LoginScreen() {
  const { colors } = useTheme()
  const { signIn } = useAuth()
  const scale = useSharedValue(1)
  const scrollY = useSharedValue(0)

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } =
    useAuthForm<LoginFormValues>({
      initialValues: {
        email: "",
        password: "",
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
        password: [
          {
            validate: (value) => !!value.trim(),
            message: "Password is required",
          },
        ],
      },
      onSubmit: async (values) => {
        try {
          scale.value = withSequence(
            withSpring(0.95),
            withSpring(1)
          )
          await signIn(values.email, values.password)
          router.replace("/(tabs)")
        } catch (error) {
          // Error is handled in the auth provider
        }
      },
    })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.8],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -20],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <Animated.View 
            entering={FadeInDown.delay(200).duration(1000)} 
            style={[styles.headerContainer, headerAnimatedStyle]}
          >
            <View style={styles.logoContainer}>
              <BlurView intensity={20} style={styles.logoBlur}>
                <MaterialCommunityIcons 
                  name="storefront-outline" 
                  size={48} 
                  color={colors.tint} 
                />
              </BlurView>
              <Text style={[styles.appName, { color: colors.tint }]}>Campus Market</Text>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.textDim }]}>Sign in to continue to Campus Market</Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(600).duration(1000)} 
            style={[styles.formContainer, animatedStyle]}
          >
            <BlurView intensity={20} style={styles.formBlur}>
              <Animated.View entering={FadeInUp.delay(700).duration(1000)}>
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
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(800).duration(1000)}>
                <TextInput
                  label="Password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  error={touched.password ? errors.password : undefined}
                  isPassword
                  leftIcon="lock"
                  autoComplete="password"
                  textContentType="password"
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(900).duration(1000)}>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity style={styles.forgotPasswordContainer}>
                    <Text style={[styles.forgotPasswordText, { color: colors.tint }]}>Forgot Password?</Text>
                  </TouchableOpacity>
                </Link>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(1000).duration(1000)}>
                <Button
                  title="Sign In"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  fullWidth
                  size="large"
                  style={styles.loginButton}
                />
              </Animated.View>
            </BlurView>
          </Animated.View>

          <Animated.View 
            entering={FadeIn.delay(1100).duration(1000)} 
            style={styles.signupContainer}
          >
            <Text style={[styles.signupText, { color: colors.textDim }]}>Don't have an account?</Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={[styles.signupLink, { color: colors.tint }]}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>
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
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBlur: {
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  appName: {
    ...globalStyles.h2,
    fontFamily: 'Poppins-Bold',
  },
  title: {
    ...globalStyles.h1,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    ...globalStyles.bodyLarge,
    fontFamily: 'Poppins-Regular',
    marginBottom: 32,
    textAlign: "center",
    opacity: 0.8,
  },
  formContainer: {
    marginBottom: 24,
  },
  formBlur: {
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    ...globalStyles.bodyMedium,
    fontFamily: 'Poppins-SemiBold',
  },
  loginButton: {
    marginTop: 8,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  signupText: {
    ...globalStyles.bodyMedium,
    fontFamily: 'Poppins-Regular',
  },
  signupLink: {
    ...globalStyles.bodyMedium,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 4,
  },
})
