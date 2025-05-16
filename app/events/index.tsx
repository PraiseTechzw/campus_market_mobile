"use client"

import { useState, useRef } from "react"
import {
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getEvents } from "@/services/events"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Stack } from "expo-router"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { LinearGradient } from "expo-linear-gradient"
import CampusSelector from "@/components/campus-selector"
import type { Campus, Event } from "@/types"
import { useToast } from "@/providers/toast-provider"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 48

export default function EventsScreen() {
  const { session } = useSession()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const [showPast, setShowPast] = useState(false)
  const colorScheme = useColorScheme()
  const scrollY = useRef(new Animated.Value(0)).current
  const router = useRouter()
  const toast = useToast()

  const {
    data: events,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["events", selectedCampus?.id, showPast],
    queryFn: () => getEvents({ campusId: selectedCampus?.id, upcoming: !showPast }),
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
    toast.show({
      type: "success",
      title: "Refreshed",
      message: "Latest events loaded",
    })
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

  const renderEventCard = (event: Event) => {
    const startDate = new Date(event.start_date)
    const endDate = event.end_date ? new Date(event.end_date) : null

    return (
      <TouchableOpacity
        key={event.id}
        style={styles.eventCard}
        onPress={() => router.push(`/events/${event.id}`)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: event.image_url || "https://via.placeholder.com/300x200" }}
          style={styles.eventImage}
          resizeMode="cover"
        />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.eventGradient}>
          <View style={styles.eventDateBadge}>
            <Text style={styles.eventDateDay}>{startDate.getDate()}</Text>
            <Text style={styles.eventDateMonth}>{startDate.toLocaleDateString("en-US", { month: "short" })}</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.eventDetails}>
              <View style={styles.eventDetailItem}>
                <MaterialIcons name="access-time" size={16} color="#fff" />
                <Text style={styles.eventDetailText}>
                  {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  {endDate ? ` - ${endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}
                </Text>
              </View>
              <View style={styles.eventDetailItem}>
                <MaterialIcons name="location-on" size={16} color="#fff" />
                <Text style={styles.eventDetailText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
        {event.is_featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
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
              <Animated.Text style={[styles.headerTitle, { opacity: headerTextOpacity }]}>Campus Events</Animated.Text>
              <CampusSelector selectedCampus={selectedCampus} onSelectCampus={setSelectedCampus} />
            </Animated.View>
          </LinearGradient>

          {/* Compact Header that appears on scroll */}
          <Animated.View style={[styles.compactHeader, { opacity: compactHeaderOpacity }]}>
            <Text style={styles.compactTitle}>Campus Events</Text>
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
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, !showPast && styles.filterButtonActive]}
              onPress={() => setShowPast(false)}
            >
              <Text style={[styles.filterButtonText, !showPast && styles.filterButtonTextActive]}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, showPast && styles.filterButtonActive]}
              onPress={() => setShowPast(true)}
            >
              <Text style={[styles.filterButtonText, showPast && styles.filterButtonTextActive]}>Past</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push("/events/create")}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].primary} />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : events && events.length > 0 ? (
            <View style={styles.eventsContainer}>{events.map((event) => renderEventCard(event))}</View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptyText}>
                {showPast
                  ? "There are no past events to display."
                  : "There are no upcoming events. Why not create one?"}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/events/create")}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          )}
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
  headerTitle: {
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
  filterContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: "#10b981",
  },
  filterButtonText: {
    fontWeight: "500",
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
  },
  eventsContainer: {
    paddingHorizontal: 16,
  },
  eventCard: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-end",
  },
  eventDateBadge: {
    width: 60,
    height: 60,
    backgroundColor: "#10b981",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  eventDateDay: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  eventDateMonth: {
    color: "#fff",
    fontSize: 14,
    textTransform: "uppercase",
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventDetailText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  featuredBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
})
