"use client"

import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Animated, Image, Dimensions } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getRecentListings } from "@/services/marketplace"
import { getRecentAccommodations } from "@/services/accommodation"
import { getEvents } from "@/services/events"
import { useSession } from "@/providers/session-provider"
import { useState, useRef } from "react"
import ListingCard from "@/components/marketplace/listing-card"
import AccommodationCard from "@/components/accommodation/accommodation-card"
import { ActivityIndicator } from "react-native"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Campus } from "@/types"
import CampusSelector from "@/components/campus-selector"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { useToast } from "@/providers/toast-provider"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.7

export default function HomeScreen() {
  const { session } = useSession()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const colorScheme = useColorScheme()
  const scrollY = useRef(new Animated.Value(0)).current
  const router = useRouter()
  const toast = useToast()

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

  const {
    data: upcomingEvents,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["upcomingEvents", selectedCampus?.id],
    queryFn: () => getEvents({ campusId: selectedCampus?.id ?? null, upcoming: true, limit: 5 }),
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchListings(), refetchAccommodations(), refetchEvents()])
    setRefreshing(false)
    toast.showToast(
      "Latest content loaded",
      "success"
    )
  }

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 120],
    extrapolate: "clamp",
  })

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  })

  const headerTextOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0, 0],
    extrapolate: "clamp",
  })

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [0, 0.7, 1],
    extrapolate: "clamp",
  })

  if (!session) return null

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Animated Header */}
        <Animated.View style={[styles.header, { height: headerHeight }]}>
          <LinearGradient
            colors={[Colors[colorScheme ?? "light"].primary, Colors[colorScheme ?? "light"].accent]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
              <Animated.Text style={[styles.welcomeText, { opacity: headerTextOpacity }]}>
                Welcome, {session.user.user_metadata.first_name || "Student"}
              </Animated.Text>
              <CampusSelector selectedCampus={selectedCampus} onSelectCampus={setSelectedCampus} />
            </Animated.View>
          </LinearGradient>

          {/* Compact Header that appears on scroll */}
          <Animated.View style={[styles.compactHeader, { opacity: compactHeaderOpacity }]}>
            <Text style={styles.compactTitle}>UniConnect</Text>
            <TouchableOpacity onPress={() => router.push("/search")}>
              <MaterialIcons name="search" size={24} color={Colors[colorScheme ?? "light"].text} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/marketplace/create/")}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#10b981" }]}>
                <MaterialIcons name="add-shopping-cart" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Sell Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/accommodation/create/quick")}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#3b82f6" }]}>
                <MaterialIcons name="apartment" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>List Room</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/events/create")}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#f59e0b" }]}>
                <MaterialIcons name="event" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Add Event</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push("/search")} activeOpacity={0.7}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#8b5cf6" }]}>
                <MaterialIcons name="search" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Search</Text>
            </TouchableOpacity>
          </View>

          {/* Upcoming Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => router.push("/events")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {eventsLoading ? (
              <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsContainer}>
                {upcomingEvents.map((event: any) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => router.push(`/events/${event.id}`)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: event.image_url || "https://via.placeholder.com/300x200" }}
                      style={styles.eventImage}
                    />
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.eventGradient}>
                      <Text style={styles.eventDate}>
                        {new Date(event.start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventLocation}>
                        <MaterialIcons name="location-on" size={14} color="#fff" />
                        <Text style={styles.eventLocationText}>{event.location}</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="event-busy" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No upcoming events</Text>
              </View>
            )}
          </View>

          {/* Recent Marketplace Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Marketplace Items</Text>
              <TouchableOpacity onPress={() => router.push("/marketplace")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {listingsLoading ? (
              <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
            ) : recentListings && recentListings.length > 0 ? (
              <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listingsContainer}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 20}
                snapToAlignment="start"
              >
                {recentListings.map((listing) => (
                  <Animated.View key={listing.id} style={styles.listingCardContainer}>
                    <ListingCard listing={listing} style={styles.listingCard} />
                  </Animated.View>
                ))}
              </Animated.ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="shopping-bag" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No recent listings found</Text>
              </View>
            )}
          </View>

          {/* Recent Accommodations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Accommodations</Text>
              <TouchableOpacity onPress={() => router.push("/accommodation")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {accommodationsLoading ? (
              <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
            ) : recentAccommodations && recentAccommodations.length > 0 ? (
              <View style={styles.accommodationsGrid}>
                {recentAccommodations.map((accommodation) => (
                  <AccommodationCard
                    key={accommodation.id}
                    accommodation={accommodation}
                    style={styles.accommodationCard}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="apartment" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No recent accommodations found</Text>
              </View>
            )}
          </View>
        </Animated.ScrollView>
      </View>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
  },
  headerGradient: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    marginTop: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 200, // Match initial header height
    paddingBottom: 40,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickActionItem: {
    alignItems: "center",
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  seeAll: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  eventsContainer: {
    paddingLeft: 16,
  },
  eventCard: {
    width: width - 48,
    height: 180,
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    padding: 16,
    justifyContent: "flex-end",
  },
  eventDate: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  eventTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  eventLocation: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventLocationText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  listingsContainer: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  listingCardContainer: {
    width: CARD_WIDTH,
    marginRight: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listingCard: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  accommodationsGrid: {
    paddingHorizontal: 16,
  },
  accommodationCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loader: {
    marginVertical: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    color: "#666",
    fontSize: 16,
  },
})
