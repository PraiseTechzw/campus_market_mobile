"use client"

import { useState, useEffect } from "react"
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, View as RNView } from "react-native"
import { Text, View } from "@/components/Themed"
import { useQuery } from "@tanstack/react-query"
import { getActivityFeed } from "@/services/activity"
import { getUserNotifications, markAllNotificationsAsRead } from "@/services/notifications"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Campus, Notification } from "@/types"
import CampusSelector from "@/components/campus-selector"
import ActivityFeedItemCard from "@/components/activity/activity-feed-item"
import NotificationItem from "@/components/activity/notification-item"
import { ActivityIndicator } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"

type TabType = "activity" | "notifications"

export default function ActivityScreen() {
  const { session } = useSession()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("activity")
  const colorScheme = useColorScheme()

  const {
    data: activityItems,
    isLoading: isLoadingActivity,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["activityFeed", selectedCampus?.id],
    queryFn: () => getActivityFeed(selectedCampus?.id),
  })

  const {
    data: notificationItems,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications", session?.user.id],
    queryFn: () => (session?.user.id ? getUserNotifications(session.user.id) : Promise.resolve([])),
    enabled: !!session?.user.id,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    if (activeTab === "activity") {
      await refetchActivity()
    } else {
      await refetchNotifications()
    }
    setRefreshing(false)
  }

  const handleMarkAllAsRead = async () => {
    if (session?.user.id) {
      await markAllNotificationsAsRead(session.user.id)
      refetchNotifications()
    }
  }

  // When switching to notifications tab, mark all as read
  useEffect(() => {
    if (activeTab === "notifications" && session?.user.id && notificationItems?.some(n => !n.is_read)) {
      handleMarkAllAsRead()
    }
  }, [activeTab])

  if (!session) return null

  const renderContent = () => {
    const isLoading = activeTab === "activity" ? isLoadingActivity : isLoadingNotifications
    const data = activeTab === "activity" ? activityItems : notificationItems

    if (isLoading) {
      return <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
    }

    if (activeTab === "activity") {
      return (
        <FlatList
          data={data}
          renderItem={({ item }) => <ActivityFeedItemCard item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No activity yet</Text>
              <Text style={styles.emptySubtext}>Recent listings, price drops, and announcements will appear here</Text>
            </View>
          }
        />
      )
    } else {
      return (
        <FlatList
          data={data}
          renderItem={({ item }) => <NotificationItem notification={item as Notification} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications</Text>
              <Text style={styles.emptySubtext}>You don't have any notifications at this time</Text>
            </View>
          }
        />
      )
    }
  }

  const Tab = ({ type, label }: { type: TabType; label: string }) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === type && styles.activeTab]}
      onPress={() => setActiveTab(type)}
    >
      <Text style={[styles.tabText, activeTab === type && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity</Text>

      <RNView style={styles.tabs}>
        <Tab type="activity" label="Activity Feed" />
        <Tab type="notifications" label="Notifications" />
      </RNView>

      {activeTab === "activity" && (
        <CampusSelector selectedCampus={selectedCampus} onSelectCampus={setSelectedCampus} />
      )}

      {activeTab === "notifications" && notificationItems && notificationItems.length > 0 && (
        <TouchableOpacity style={styles.markAllReadButton} onPress={handleMarkAllAsRead}>
          <MaterialIcons name="done-all" size={16} color={Colors[colorScheme ?? "light"].tint} />
          <Text style={[styles.markAllReadText, { color: Colors[colorScheme ?? "light"].tint }]}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {renderContent()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#0891B2",
  },
  tabText: {
    fontWeight: "500",
  },
  activeTabText: {
    color: "white",
  },
  listContent: {
    paddingBottom: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  markAllReadButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: 8,
  },
  markAllReadText: {
    marginLeft: 4,
    fontWeight: "500",
  },
})