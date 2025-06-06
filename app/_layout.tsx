"use client"

import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useFonts } from "expo-font"
import { Stack, useRouter } from "expo-router"
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
import { registerForPushNotifications, savePushToken, addNotificationListeners, sendLocalNotification } from "@/lib/notifications"
import { supabase } from "@/lib/supabase"
import { StatusBar } from "expo-status-bar"
import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import {
  SpaceMono_400Regular,
} from '@expo-google-fonts/space-mono'
import { useFrameworkReady } from '@/hooks/useFrameworkReady'

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
  useFrameworkReady();
  const [loaded, error] = useFonts({
    'SpaceMono': SpaceMono_400Regular,
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
  const router = useRouter()

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange)

    // Initialize background sync
    cleanupRef.current = initBackgroundSync()

    // Setup push notifications
    const pushNotificationCleanup = setupPushNotifications()

    // Setup notification subscription for real-time notifications
    const notificationSubscription = setupNotificationSubscription()

    // Setup network change listener
    const unsubscribeNetInfo = NetInfo.addEventListener(handleNetworkChange)

    return () => {
      subscription.remove()
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      if (pushNotificationCleanup) {
        pushNotificationCleanup.then(cleanup => {
          if (cleanup) cleanup()
        })
      }
      if (notificationSubscription) {
        notificationSubscription()
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

  // Set up real-time notifications using Supabase
  const setupNotificationSubscription = () => {
    const { data: authData } = supabase.auth.getSession()
    if (!authData) return null
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authData?.session?.user.id}`,
        },
        (payload) => {
          // New notification received
          const notification = payload.new as any
          
          // Refresh unread notification count
          queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] })
          
          // Show local notification if app is in background
          if (appState.current !== 'active' && Device.isDevice) {
            sendLocalNotification(notification.title, notification.body, notification.data)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const setupPushNotifications = async () => {
    // Register for push notifications
    const token = await registerForPushNotifications()

    if (token) {
      // Get current user
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        // Save token to user profile
        await savePushToken(data.user.id, token)
      }

      // Add notification listeners
      const cleanup = addNotificationListeners(
        (notification) => {
          // Notification received while app is in foreground
          console.log("Notification received:", notification)
          // Refresh unread count
          queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] })
        },
        (response) => {
          // User tapped on a notification
          const data = response.notification.request.content.data as any
          console.log("Notification response:", data)
          
          // Navigate based on notification type
          if (data) {
            const { type, id } = data
            
            switch (type) {
              case "listing":
                router.push(`/marketplace/listing/${id}`)
                break
              case "accommodation":
                router.push(`/accommodation/${id}`)
                break
              case "message":
                router.push(`/messages/${id}`)
                break
              case "event":
                router.push(`/events/${id}`)
                break
              default:
                router.push('/activity')
                break
            }
          } else {
            // Default to activity screen
            router.push('/activity')
          }
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