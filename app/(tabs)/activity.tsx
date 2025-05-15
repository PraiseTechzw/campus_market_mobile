"use client"

import { useState } from "react"
import { StyleSheet, FlatList, RefreshControl } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getActivityFeed } from "@/services/activity"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Campus } from "@/types"
import CampusSelector from "@/components/campus-selector"
import ActivityFeedItemCard from "@/components/activity/activity-feed-item"
import { ActivityIndicator } from "react-native"

export default function ActivityScreen() {
  const { session } = useSession()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const colorScheme = useColorScheme()

  const {
    data: activityItems,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["activityFeed", selectedCampus?.id],
    queryFn: () => getActivityFeed(selectedCampus?.id),
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (!session) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Feed</Text>

      <CampusSelector selectedCampus={selectedCampus} onSelectCampus={setSelectedCampus} />

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
      ) : (
        <FlatList
          data={activityItems}
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
      )}
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
})
