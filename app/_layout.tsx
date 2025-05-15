"use client"

import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect, useRef } from "react"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/providers/session-provider"
import { ToastProvider } from "@/providers/toast-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppState, type AppStateStatus } from "react-native"
import NetInfo from "@react-native-community/netinfo"
import { initBackgroundSync, syncPendingOperations } from "@/lib/offline-sync"
import { registerForPushNotifications, savePushToken, addNotificationListeners } from "@/lib/notifications"
import { supabase } from "@/lib/supabase"
import { StatusBar } from "expo-status-bar"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

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

export default function RootLayout() {
  const [loaded, error] = useFonts({
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

  return <RootLayoutNav />
}

function RootLayoutNav() {
  const colorScheme = useColorScheme()
  const appState = useRef(AppState.currentState)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange)

    // Initialize background sync
    cleanupRef.current = initBackgroundSync()

    // Setup push notifications
    setupPushNotifications()

    // Setup network change listener
    const unsubscribeNetInfo = NetInfo.addEventListener(handleNetworkChange)

    return () => {
      subscription.remove()
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      unsubscribeNetInfo()
    }
  }, [])

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current === "background" && nextAppState === "active") {
      // App has come to the foreground
      const netInfo = await NetInfo.fetch()
      if (netInfo.isConnected) {
        // Sync pending operations when coming back online
        await syncPendingOperations()
        // Refresh data
        queryClient.invalidateQueries()
      }
    }
    appState.current = nextAppState
  }

  const handleNetworkChange = async (state: any) => {
    if (state.isConnected && appState.current === "active") {
      // Device just connected to the internet
      await syncPendingOperations()
      queryClient.invalidateQueries()
    }
  }

  const setupPushNotifications = async () => {
    // Register for push notifications
    const token = await registerForPushNotifications()

    if (token) {
      // Get current user
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        // Save token to user profile
        await savePushToken(data.user.id, token)
      }

      // Add notification listeners
      const cleanup = addNotificationListeners(
        (notification) => {
          console.log("Notification received:", notification)
        },
        (response) => {
          const data = response.notification.request.content.data
          console.log("Notification response:", data)
          // Handle notification response (e.g., navigate to a specific screen)
        },
      )

      return cleanup
    }
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ToastProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false, animation: "slide_from_bottom" }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack>
          </ToastProvider>
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
