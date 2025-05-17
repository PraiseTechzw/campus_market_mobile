import { supabase } from "@/lib/supabase"
import type { Notification } from "@/types"

export async function getUserNotifications(userId: string, { limit = 50, offset = 0 } = {}) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data as Notification[]
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

export async function getUnreadNotificationsCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    return 0
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return false
  }
} 