import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"
import { supabase } from "./supabase"

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// Register for push notifications
export async function registerForPushNotifications() {
  let token

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0891B2",
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!")
      return null
    }

    token = (await Notifications.getExpoPushTokenAsync()).data
  } else {
    console.log("Must use physical device for Push Notifications")
  }

  return token
}

// Save push token to user profile
export async function savePushToken(userId: string, token: string) {
  try {
    const { error } = await supabase.from("profiles").update({ push_token: token }).eq("id", userId)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error saving push token:", error)
    return false
  }
}

// Send local notification
export async function sendLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null, // null means send immediately
  })
}

// Add notification listeners
export function addNotificationListeners(
  onNotification: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void,
) {
  const notificationListener = Notifications.addNotificationReceivedListener(onNotification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse)

  return () => {
    Notifications.removeNotificationSubscription(notificationListener)
    Notifications.removeNotificationSubscription(responseListener)
  }
}
