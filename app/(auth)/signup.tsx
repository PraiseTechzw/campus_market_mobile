"use client";

import {
  StyleSheet,
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { router, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/providers/auth-provider";
import { useAuthForm } from "@/hooks/use-auth-form";
import TextInput from "@/components/text-input";
import Button from "@/components/button";
import Toast from "react-native-toast-message";
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
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { globalStyles } from "@/constants/Styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface SignupFormValues extends Record<string, string> {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const scale = useSharedValue(1);
  const scrollY = useSharedValue(0);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useAuthForm<SignupFormValues>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validation: {
      firstName: [
        {
          validate: (value) => !!value.trim(),
          message: "First name is required",
        },
      ],
      lastName: [
        {
          validate: (value) => !!value.trim(),
          message: "Last name is required",
        },
      ],
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
        scale.value = withSequence(withSpring(0.95), withSpring(1));
        await signUp(values.email, values.password, {
          firstName: values.firstName,
          lastName: values.lastName,
        });

        Toast.show({
          type: "success",
          text1: "Account Created",
          text2: "Please check your email to verify your account",
        });

        router.replace("/(auth)/verification-pending");
      } catch (error) {
        // Error is handled in the auth provider
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

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
      <LinearGradient
        colors={[colors.background, colors.cardBackground]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <Animated.View 
            entering={FadeInDown.delay(400).duration(1000)}
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
              <Text style={[styles.appName, { color: colors.tint }]}>
                Campus Market
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textDim }]}>
              Join the campus marketplace community
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(600).duration(1000)}
            style={[styles.formContainer, animatedStyle]}
          >
            <BlurView intensity={20} style={styles.formBlur}>
              <View style={styles.nameRow}>
                <Animated.View
                  entering={FadeInUp.delay(700).duration(1000)}
                  style={styles.nameField}
                >
                  <TextInput
                    label="First Name"
                    placeholder="Enter first name"
                    value={values.firstName}
                    onChangeText={handleChange("firstName")}
                    onBlur={handleBlur("firstName")}
                    error={touched.firstName ? errors.firstName : undefined}
                    leftIcon="person"
                    autoComplete="name-given"
                    textContentType="givenName"
                  />
                </Animated.View>

                <Animated.View
                  entering={FadeInUp.delay(800).duration(1000)}
                  style={styles.nameField}
                >
                  <TextInput
                    label="Last Name"
                    placeholder="Enter last name"
                    value={values.lastName}
                    onChangeText={handleChange("lastName")}
                    onBlur={handleBlur("lastName")}
                    error={touched.lastName ? errors.lastName : undefined}
                    leftIcon="person"
                    autoComplete="name-family"
                    textContentType="familyName"
                  />
                </Animated.View>
              </View>

              <Animated.View entering={FadeInUp.delay(900).duration(1000)}>
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

              <Animated.View entering={FadeInUp.delay(1000).duration(1000)}>
                <TextInput
                  label="Password"
                  placeholder="Create a password"
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  error={touched.password ? errors.password : undefined}
                  isPassword
                  leftIcon="lock"
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(1100).duration(1000)}>
                <TextInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={values.confirmPassword}
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  error={touched.confirmPassword ? errors.confirmPassword : undefined}
                  isPassword
                  leftIcon="lock"
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(1200).duration(1000)}>
                <Button
                  title="Create Account"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  fullWidth
                  size="large"
                  style={styles.signupButton}
                />

                <Text style={[styles.termsText, { color: colors.textDim }]}>
                  By signing up, you agree to our{" "}
                  <Text style={{ color: colors.tint, fontFamily: 'Poppins-SemiBold' }}>Terms of Service</Text>{" "}
                  and <Text style={{ color: colors.tint, fontFamily: 'Poppins-SemiBold' }}>Privacy Policy</Text>
                </Text>
              </Animated.View>
            </BlurView>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(1300).duration(1000)}
            style={styles.loginContainer}
          >
            <Text style={[styles.loginText, { color: colors.textDim }]}>
              Already have an account?
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.loginLink, { color: colors.tint }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    overflow: "hidden",
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
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  nameField: {
    width: "48%",
  },
  signupButton: {
    marginTop: 8,
  },
  termsText: {
    ...globalStyles.bodySmall,
    fontFamily: 'Poppins-Regular',
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  loginText: {
    ...globalStyles.bodyMedium,
    fontFamily: 'Poppins-Regular',
  },
  loginLink: {
    ...globalStyles.bodyMedium,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 4,
  },
});
