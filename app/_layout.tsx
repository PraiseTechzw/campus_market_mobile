"use client"

import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import { StatusBar, View, Text, StyleSheet } from "react-native"
import { AuthProvider } from "@/providers/auth-provider"
import { CartProvider } from "@/providers/cart-provider"
import { NetworkProvider } from "@/providers/network-provider"
import { ThemeProvider, useTheme } from "@/providers/theme-provider"
import { OnboardingProvider } from "@/providers/onboarding-provider"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import React from "react"

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router"

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

interface ToastProps {
  text1?: string;
  text2?: string;
}

// Add toast configuration
const toastConfig = {
  success: (props: ToastProps) => (
    <View style={[styles.toastContainer, styles.successContainer]}>
      <Text style={[styles.toastText, { fontFamily: 'Poppins-Medium' }]}>{props.text1}</Text>
      {props.text2 && <Text style={[styles.toastSubText, { fontFamily: 'Poppins-Regular' }]}>{props.text2}</Text>}
    </View>
  ),
  error: (props: ToastProps) => (
    <View style={[styles.toastContainer, styles.errorContainer]}>
      <Text style={[styles.toastText, { fontFamily: 'Poppins-Medium' }]}>{props.text1}</Text>
      {props.text2 && <Text style={[styles.toastSubText, { fontFamily: 'Poppins-Regular' }]}>{props.text2}</Text>}
    </View>
  ),
  info: (props: ToastProps) => (
    <View style={[styles.toastContainer, styles.infoContainer]}>
      <Text style={[styles.toastText, { fontFamily: 'Poppins-Medium' }]}>{props.text1}</Text>
      {props.text2 && <Text style={[styles.toastSubText, { fontFamily: 'Poppins-Regular' }]}>{props.text2}</Text>}
    </View>
  ),
}

const styles = StyleSheet.create({
  toastContainer: {
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successContainer: {
    backgroundColor: '#4CAF50',
  },
  errorContainer: {
    backgroundColor: '#F44336',
  },
  infoContainer: {
    backgroundColor: '#2196F3',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 4,
  },
  toastSubText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
})

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Poppins-Regular': require("../assets/fonts/Poppins-Regular.ttf"),
    'Poppins-Medium': require("../assets/fonts/Poppins-Medium.ttf"),
    'Poppins-SemiBold': require("../assets/fonts/Poppins-SemiBold.ttf"),
    'Poppins-Bold': require("../assets/fonts/Poppins-Bold.ttf"),
    'Poppins-Light': require("../assets/fonts/Poppins-Light.ttf"),
    'Poppins-Thin': require("../assets/fonts/Poppins-Thin.ttf"),
    'Poppins-ExtraLight': require("../assets/fonts/Poppins-ExtraLight.ttf"),
    'Poppins-ExtraBold': require("../assets/fonts/Poppins-ExtraBold.ttf"),
    'Poppins-Black': require("../assets/fonts/Poppins-Black.ttf"),
    'Poppins-Italic': require("../assets/fonts/Poppins-Italic.ttf"),
    'Poppins-MediumItalic': require("../assets/fonts/Poppins-MediumItalic.ttf"),
    'Poppins-SemiBoldItalic': require("../assets/fonts/Poppins-SemiBoldItalic.ttf"),
    'Poppins-BoldItalic': require("../assets/fonts/Poppins-BoldItalic.ttf"),
    'Poppins-LightItalic': require("../assets/fonts/Poppins-LightItalic.ttf"),
    'Poppins-ThinItalic': require("../assets/fonts/Poppins-ThinItalic.ttf"),
    'Poppins-ExtraLightItalic': require("../assets/fonts/Poppins-ExtraLightItalic.ttf"),
    'Poppins-ExtraBoldItalic': require("../assets/fonts/Poppins-ExtraBoldItalic.ttf"),
    'Poppins-BlackItalic': require("../assets/fonts/Poppins-BlackItalic.ttf"),
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  })

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NetworkProvider>
            <AuthProvider>
              <OnboardingProvider>
                <CartProvider>
                  <AppWithProviders />
                </CartProvider>
              </OnboardingProvider>
            </AuthProvider>
          </NetworkProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

function AppWithProviders() {
  const { colors, isDark } = useTheme()

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="product/[id]" options={{ title: "Product Details" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
        <Stack.Screen name="profile/[id]" options={{ title: "Profile" }} />
        <Stack.Screen name="orders/[id]" options={{ title: "Order Details" }} />
        <Stack.Screen name="admin/dashboard" options={{ title: "Admin Dashboard" }} />
        <Stack.Screen name="admin/users" options={{ title: "Manage Users" }} />
        <Stack.Screen name="admin/products" options={{ title: "Manage Products" }} />
        <Stack.Screen name="admin/verifications" options={{ title: "Verifications" }} />
        <Stack.Screen name="admin/reports" options={{ title: "Reports" }} />
        <Stack.Screen name="admin/analytics" options={{ title: "Analytics" }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
      <Toast config={toastConfig} />
    </>
  )
}
