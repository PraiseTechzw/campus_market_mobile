import React from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { Text } from "@/components/themed"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { formatDistanceToNow } from "date-fns"
import type { Notification } from "@/types"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { markNotificationAsRead } from "@/services/notifications"

interface NotificationItemProps {
  notification: Notification
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const tintColor = Colors[colorScheme ?? "light"].tint

  const handlePress = () => {
    // Mark as read if not already
    if (!notification.is_read) {
      markNotificationAsRead(notification.id.toString())
    }

    // Navigate based on notification type and data
    if (notification.data) {
      const { type, id } = notification.data
      
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
          // No navigation
          break
      }
    }
  }

  // Choose icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case "message":
        return <MaterialIcons name="message" size={24} color={tintColor} />
      case "listing":
        return <MaterialIcons name="shopping-bag" size={24} color={tintColor} />
      case "accommodation":
        return <MaterialIcons name="apartment" size={24} color={tintColor} />
      case "event":
        return <MaterialIcons name="event" size={24} color={tintColor} />
      case "system":
      default:
        return <MaterialIcons name="notifications" size={24} color={tintColor} />
    }
  }

  // Format the timestamp
  const formatTimestamp = () => {
    try {
      return formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
    } catch (error) {
      return "recently"
    }
  }

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        !notification.is_read && styles.unread
      ]} 
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.timestamp}>
          {formatTimestamp()}
        </Text>
      </View>
      {!notification.is_read && <View style={[styles.unreadIndicator, { backgroundColor: tintColor }]} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unread: {
    backgroundColor: "#f0f9ff",
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: "center",
  }
}) 