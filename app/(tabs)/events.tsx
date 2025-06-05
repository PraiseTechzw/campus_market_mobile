"use client"

import React, { useState } from "react"
import { StyleSheet, ActivityIndicator, FlatList, RefreshControl, Image, TouchableOpacity, View as RNView } from "react-native"
import { Text, View } from "@/components/Themed"
import { useRouter, Stack } from "expo-router"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useSession } from "@/providers/session-provider"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getEvents } from "@/services/events"
import type { Event } from "@/types"
import EmptyState from "@/components/empty-state"
import FilterBar from "@/components/filter-bar"
import { MotiView } from "moti"

export default function EventsScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming")
  const [refreshing, setRefreshing] = useState(false)
  
  // Query events
  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ["events", filter],
    queryFn: () => getEvents({ 
      upcoming: filter === "upcoming",
      limit: 50
    }),
  })
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }
  
  const renderEvent = ({ item }: { item: Event }) => {
    // Format date for display
    const dateString = new Date(item.start_date).toLocaleDateString(undefined, {
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
    
    const timeString = new Date(item.start_date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 100 }}
      >
        <TouchableOpacity
          style={styles.eventCard}
          activeOpacity={0.8}
          onPress={() => router.push(`/events/${item.id}`)}
        >
          {item.image_url ? (
            <RNView style={styles.eventImageContainer}>
              <Image source={{ uri: item.image_url }} style={styles.eventImage} />
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
                style={styles.imageGradient}
              />
            </RNView>
          ) : (
            <RNView style={[styles.eventImageContainer, styles.noImageContainer]}>
              <MaterialIcons name="event" size={40} color="#aaa" />
            </RNView>
          )}
          
          <View style={styles.eventContent}>
            <View style={styles.dateContainer}>
              <Text style={styles.eventDate}>{dateString}</Text>
              <Text style={styles.eventTime}>{timeString}</Text>
            </View>
            
            <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
            
            <View style={styles.eventMeta}>
              <RNView style={styles.metaItem}>
                <MaterialIcons name="location-on" size={16} color="#666" />
                <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
              </RNView>
              
              {item.campus_id && item.campuses && (
                <RNView style={styles.metaItem}>
                  <MaterialIcons name="school" size={16} color="#666" />
                  <Text style={styles.metaText} numberOfLines={1}>{item.campuses.name}</Text>
                </RNView>
              )}
              
              {/* Show organizer if available */}
              {item.organizer_id && item.profiles && (
                <RNView style={styles.metaItem}>
                  <MaterialIcons name="person" size={16} color="#666" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    By {item.profiles.first_name} {item.profiles.last_name}
                  </Text>
                </RNView>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    )
  }
  
  const renderHeader = () => {
    const filters = [
      { key: "upcoming", label: "Upcoming" },
      { key: "past", label: "Past" },
      { key: "all", label: "All" },
    ]
    
    return (
      <View>
        <LinearGradient
          colors={[Colors[colorScheme ?? "light"].primary, Colors[colorScheme ?? "light"].accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Text style={styles.screenTitle}>Campus Events</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push("/events/create")}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        
        <FilterBar
          filters={filters}
          activeFilter={filter}
          onFilterChange={(key: string) => setFilter(key as "all" | "upcoming" | "past")}
        />
      </View>
    )
  }
  
  const renderEmpty = () => {
    return (
      <EmptyState
        icon="event"
        title="No events found"
        message={filter === "upcoming" ? 
          "There are no upcoming events scheduled yet." :
          filter === "past" ? 
          "No past events are available." :
          "No events have been added yet."
        }
        action={
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => router.push("/events/create")}
          >
            <Text style={styles.emptyActionText}>Create Event</Text>
          </TouchableOpacity>
        }
      />
    )
  }
  
  return (
    <SafeAreaWrapper edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={50} color="#f43f5e" />
          <Text style={styles.errorText}>Failed to load events</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors[colorScheme ?? "light"].tint]}
              tintColor={Colors[colorScheme ?? "light"].tint}
            />
          }
        />
      )}
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  createButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: "#666",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  eventImageContainer: {
    height: 150,
    width: "100%",
  },
  eventImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  noImageContainer: {
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  eventContent: {
    padding: 16,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventDate: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: "600",
  },
  eventTime: {
    color: "#666",
    fontSize: 14,
    marginLeft: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  eventMeta: {
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaText: {
    color: "#666",
    fontSize: 14,
    marginLeft: 4,
  },
  emptyAction: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyActionText: {
    color: "#fff",
    fontWeight: "bold",
  },
}); 