"use client"

import { StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getRecentListings } from "@/services/marketplace"
import { getRecentAccommodations } from "@/services/accommodation"
import { useSession } from "@/providers/session-provider"
import { useState } from "react"
import ListingCard from "@/components/marketplace/listing-card"
import AccommodationCard from "@/components/accommodation/accommodation-card"
import { ActivityIndicator } from "react-native"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Campus } from "@/types"
import CampusSelector from "@/components/campus-selector"

export default function HomeScreen() {
  const { session } = useSession()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const colorScheme = useColorScheme()

  const {
    data: recentListings,
    isLoading: listingsLoading,
    refetch: refetchListings,
  } = useQuery({
    queryKey: ["recentListings", selectedCampus?.id],
    queryFn: () => getRecentListings(selectedCampus?.id),
  })

  const {
    data: recentAccommodations,
    isLoading: accommodationsLoading,
    refetch: refetchAccommodations,
  } = useQuery({
    queryKey: ["recentAccommodations", selectedCampus?.id],
    queryFn: () => getRecentAccommodations(selectedCampus?.id),
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchListings(), refetchAccommodations()])
    setRefreshing(false)
  }

  if (!session) return null

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {session.user.user_metadata.first_name || "Student"}</Text>
        <CampusSelector selectedCampus={selectedCampus} onSelectCampus={setSelectedCampus} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Marketplace Items</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>

        {listingsLoading ? (
          <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
        ) : recentListings && recentListings.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} style={styles.card} />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>No recent listings found</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Accommodations</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>

        {accommodationsLoading ? (
          <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
        ) : recentAccommodations && recentAccommodations.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            {recentAccommodations.map((accommodation) => (
              <AccommodationCard key={accommodation.id} accommodation={accommodation} style={styles.card} />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>No recent accommodations found</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAll: {
    fontSize: 14,
    color: "#0891b2",
  },
  horizontalList: {
    flexDirection: "row",
    paddingBottom: 8,
  },
  card: {
    marginRight: 12,
    width: 200,
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 20,
    color: "#666",
  },
})
