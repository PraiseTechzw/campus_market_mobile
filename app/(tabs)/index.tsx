"use client"

import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Animated, Image, Dimensions, ColorValue } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getRecentListings } from "@/services/marketplace"
import { getRecentAccommodations } from "@/services/accommodation"
import { getEvents } from "@/services/events"
import { useSession } from "@/providers/session-provider"
import { useState, useRef, useEffect } from "react"
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
import { BlurView } from "expo-blur"

// Define a consistent green theme with multiple shades
const THEME = {
  green: {
    primary: "#10b981",
    light: "#34d399",
    dark: "#059669",
    ultraLight: "#d1fae5"
  }
}

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.75

export default function HomeScreen() {
  const { session } = useSession()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const colorScheme = useColorScheme()
  const scrollY = useRef(new Animated.Value(0)).current
  const router = useRouter()
  const toast = useToast()
  const animatedScale = useRef(new Animated.Value(0.9)).current

  // Animation on component mount
  useEffect(() => {
    Animated.spring(animatedScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start()
  }, [])

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
    queryFn: () => getEvents({ 
      campusId: selectedCampus?.id ? String(selectedCampus.id) : undefined, 
      upcoming: true, 
      limit: 5 
    }),
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
    outputRange: [220, 100],
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

  const quickActionScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  })

  if (!session) return null

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Animated Header */}
        <Animated.View style={[styles.header, { height: headerHeight }]}>
          <LinearGradient
            colors={colorScheme === "dark" 
              ? [Colors[colorScheme].primary, Colors[colorScheme].accent]
              : [Colors[colorScheme ?? "light"].primary, THEME.green.primary, THEME.green.dark]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
              <Animated.Text style={[styles.welcomeText, { opacity: headerTextOpacity }]}>
                Hey, {session.user.user_metadata.first_name || "Student"}! 👋
              </Animated.Text>
              <Animated.View style={{ opacity: headerTextOpacity }}>
                <CampusSelector selectedCampus={selectedCampus} onSelectCampus={setSelectedCampus} />
              </Animated.View>
            </Animated.View>
          </LinearGradient>

          {/* Compact Header with blur effect */}
          <Animated.View style={[styles.compactHeaderContainer, { opacity: compactHeaderOpacity }]}>
            <BlurView intensity={90} style={styles.blurView} tint={colorScheme === "dark" ? "dark" : "light"}>
              <View style={styles.compactHeader}>
                <Text style={styles.compactTitle}>Campus Connect</Text>
                <TouchableOpacity 
                  style={styles.searchButton} 
                  onPress={() => router.push("/search")}
                >
                  <MaterialIcons name="search" size={22} color={Colors[colorScheme ?? "light"].text} />
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        </Animated.View>

        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[THEME.green.primary]}
              tintColor={THEME.green.primary}
            />
          }
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {/* Quick Actions */}
          <Animated.View style={[styles.quickActions, { transform: [{ scale: quickActionScale }] }]}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/marketplace/create/")}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[THEME.green.light, THEME.green.dark]}
                style={styles.quickActionIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="add-shopping-cart" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Sell Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/accommodation/create/")}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#3b82f6" }]}>
                <MaterialIcons name="apartment" size={22} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>List Room</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push('/events/create/')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#f59e0b" }]}>
                <MaterialIcons name="event" size={22} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Add Event</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push("/search")} activeOpacity={0.7}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#8b5cf6" }]}>
                <MaterialIcons name="search" size={22} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Search</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Upcoming Events */}
          <Animated.View style={[styles.section, { transform: [{ scale: animatedScale }] }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push("/events")}
              >
                <Text style={styles.seeAll}>See All</Text>
                <MaterialIcons name="chevron-right" size={16} color={THEME.green.primary} />
              </TouchableOpacity>
            </View>

            {eventsLoading ? (
              <ActivityIndicator size="large" color={THEME.green.primary} style={styles.loader} />
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.eventsContainer}
                decelerationRate="fast"
                snapToInterval={width - 32}
                snapToAlignment="center"
              >
                {upcomingEvents.map((event: any) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => router.push(`/events/${event.id}`)}
                    activeOpacity={0.95}
                  >
                    <Image
                      source={{ uri: event.image_url || "https://via.placeholder.com/300x200" }}
                      style={styles.eventImage}
                    />
                    <LinearGradient 
                      colors={["transparent", "rgba(0,0,0,0.9)"]} 
                      style={styles.eventGradient}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                    >
                      <View style={styles.eventDateBadge}>
                        <Text style={styles.eventDate}>
                          {new Date(event.start_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      </View>
                      <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                      <View style={styles.eventLocation}>
                        <MaterialIcons name="location-on" size={14} color="#fff" />
                        <Text style={styles.eventLocationText} numberOfLines={1}>{event.location}</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="event-busy" size={52} color="#ddd" />
                <Text style={styles.emptyText}>No upcoming events</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => router.push('/events/create/')}
                >
                  <LinearGradient
                    colors={[THEME.green.primary, THEME.green.dark]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.addButtonText}>Create Event</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Recent Marketplace Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Marketplace</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push("/marketplace")}
              >
                <Text style={styles.seeAll}>See All</Text>
                <MaterialIcons name="chevron-right" size={16} color={THEME.green.primary} />
              </TouchableOpacity>
            </View>

            {listingsLoading ? (
              <ActivityIndicator size="large" color={THEME.green.primary} style={styles.loader} />
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
                <MaterialIcons name="shopping-bag" size={52} color="#ddd" />
                <Text style={styles.emptyText}>No recent listings found</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => router.push("/marketplace/create/")}
                >
                  <LinearGradient
                    colors={[THEME.green.primary, THEME.green.dark]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.addButtonText}>Add Listing</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Recent Accommodations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Accommodations</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push("/accommodation")}
              >
                <Text style={styles.seeAll}>See All</Text>
                <MaterialIcons name="chevron-right" size={16} color={THEME.green.primary} />
              </TouchableOpacity>
            </View>

            {accommodationsLoading ? (
              <ActivityIndicator size="large" color={THEME.green.primary} style={styles.loader} />
            ) : recentAccommodations && recentAccommodations.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.accommodationsContainer}
                decelerationRate="fast"
                snapToInterval={width - 48}
                snapToAlignment="center"
              >
                {recentAccommodations.map((accommodation) => (
                  <AccommodationCard
                    key={accommodation.id}
                    accommodation={accommodation}
                    style={styles.accommodationCard}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="apartment" size={52} color="#ddd" />
                <Text style={styles.emptyText}>No recent accommodations found</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => router.push("/accommodation/create/")}
                >
                  <LinearGradient
                    colors={[THEME.green.primary, THEME.green.dark]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.addButtonText}>List Accommodation</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    marginTop: 40,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  compactHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  blurView: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  compactHeader: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  compactTitle: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 220, // Match initial header height
    paddingBottom: 40,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
    marginTop: 10,
  },
  quickActionItem: {
    alignItems: "center",
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAll: {
    fontSize: 14,
    color: THEME.green.primary,
    fontWeight: "600",
    marginRight: 2,
  },
  eventsContainer: {
    paddingLeft: 20,
  },
  eventCard: {
    width: width - 48,
    height: 200,
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
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
    height: "70%",
    padding: 16,
    justifyContent: "flex-end",
  },
  eventDateBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
  },
  eventDate: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  eventTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  eventLocation: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventLocationText: {
    color: "#fff",
    fontSize: 13,
    marginLeft: 4,
    opacity: 0.9,
  },
  listingsContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  listingCardContainer: {
    width: CARD_WIDTH,
    marginRight: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  listingCard: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  accommodationsContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  accommodationCard: {
    width: width - 48,
    marginRight: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  loader: {
    marginVertical: 30,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 16,
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: THEME.green.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})
