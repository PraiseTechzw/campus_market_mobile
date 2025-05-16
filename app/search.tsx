"use client"

import { useState, useEffect } from "react"
import { StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Keyboard } from "react-native"
import { Text, View } from "@/components/themed"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Stack } from "expo-router"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { supabase } from "@/lib/supabase"
import type { Listing, Accommodation, Event } from "@/types"
import ListingCard from "@/components/marketplace/listing-card"
import AccommodationCard from "@/components/accommodation/accommodation-card"
import { LinearGradient } from "expo-linear-gradient"
import { Animated } from "react-native"
import { useToast } from "@/providers/toast-provider"

type SearchResult = {
  id: string
  title: string
  type: "listing" | "accommodation" | "event"
  data: Listing | Accommodation | Event
}

export default function SearchScreen() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const colorScheme = useColorScheme()
  const router = useRouter()
  const toast = useToast()
  const fadeAnim = useState(new Animated.Value(0))[0]

  useEffect(() => {
    // Load recent searches from storage
    const loadRecentSearches = async () => {
      try {
        const { data } = await supabase.from("user_preferences").select("recent_searches").single()
        if (data && data.recent_searches) {
          setRecentSearches(data.recent_searches)
        }
      } catch (error) {
        console.error("Error loading recent searches:", error)
      }
    }

    loadRecentSearches()

    // Animate the component in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [])

  const saveRecentSearch = async (query: string) => {
    if (!query.trim()) return

    try {
      // Add to local state
      const updatedSearches = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 10)
      setRecentSearches(updatedSearches)

      // Save to database
      await supabase.from("user_preferences").upsert({
        recent_searches: updatedSearches,
      })
    } catch (error) {
      console.error("Error saving recent search:", error)
    }
  }

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([])
      await supabase.from("user_preferences").upsert({
        recent_searches: [],
      })
      toast.show({
        type: "success",
        title: "Cleared",
        message: "Recent searches cleared",
      })
    } catch (error) {
      console.error("Error clearing recent searches:", error)
    }
  }

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    Keyboard.dismiss()

    try {
      // Search listings
      const { data: listings } = await supabase
        .from("listings")
        .select("*")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5)

      // Search accommodations
      const { data: accommodations } = await supabase
        .from("accommodations")
        .select("*")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5)

      // Search events
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5)

      // Combine results
      const combinedResults: SearchResult[] = [
        ...(listings || []).map((item) => ({
          id: `listing-${item.id}`,
          title: item.title,
          type: "listing" as const,
          data: item,
        })),
        ...(accommodations || []).map((item) => ({
          id: `accommodation-${item.id}`,
          title: item.title,
          type: "accommodation" as const,
          data: item,
        })),
        ...(events || []).map((item) => ({
          id: `event-${item.id}`,
          title: item.title,
          type: "event" as const,
          data: item,
        })),
      ]

      setResults(combinedResults)
      saveRecentSearch(searchQuery)
    } catch (error) {
      console.error("Error searching:", error)
      toast.show({
        type: "error",
        title: "Search Error",
        message: "Failed to perform search",
      })
    } finally {
      setLoading(false)
    }
  }

  const navigateToResult = (result: SearchResult) => {
    switch (result.type) {
      case "listing":
        router.push(`/marketplace/${result.data.id}`)
        break
      case "accommodation":
        router.push(`/accommodation/${result.data.id}`)
        break
      case "event":
        router.push(`/events/${result.data.id}`)
        break
    }
  }

  const renderResultItem = ({ item }: { item: SearchResult }) => {
    switch (item.type) {
      case "listing":
        return (
          <TouchableOpacity onPress={() => navigateToResult(item)} style={styles.resultItem}>
            <ListingCard listing={item.data as Listing} style={styles.card} />
          </TouchableOpacity>
        )
      case "accommodation":
        return (
          <TouchableOpacity onPress={() => navigateToResult(item)} style={styles.resultItem}>
            <AccommodationCard accommodation={item.data as Accommodation} style={styles.card} />
          </TouchableOpacity>
        )
      case "event":
        const event = item.data as Event
        return (
          <TouchableOpacity onPress={() => navigateToResult(item)} style={styles.resultItem}>
            <View style={styles.eventCard}>
              <LinearGradient
                colors={[Colors[colorScheme ?? "light"].primary, Colors[colorScheme ?? "light"].accent]}
                style={styles.eventGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="event" size={24} color="#fff" style={styles.eventIcon} />
              </LinearGradient>
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>
                  {new Date(event.start_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )
      default:
        return null
    }
  }

  const renderRecentSearch = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.recentSearchItem} onPress={() => handleSearch(item)}>
      <MaterialIcons name="history" size={20} color="#666" />
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for listings, accommodations, events..."
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setQuery("")}>
                <MaterialIcons name="clear" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch()}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.recentSearchesContainer}>
            <View style={styles.recentSearchesHeader}>
              <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
              {recentSearches.length > 0 && (
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearRecentText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            {recentSearches.length > 0 ? (
              <FlatList
                data={recentSearches}
                renderItem={renderRecentSearch}
                keyExtractor={(item, index) => `recent-${index}`}
                contentContainerStyle={styles.recentSearchesList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="search" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No recent searches</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  resultsContainer: {
    paddingBottom: 16,
  },
  resultItem: {
    marginBottom: 16,
  },
  card: {
    width: "100%",
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventGradient: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  eventIcon: {
    marginBottom: 4,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
  },
  recentSearchesContainer: {
    flex: 1,
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  clearRecentText: {
    color: "#10b981",
    fontSize: 14,
  },
  recentSearchesList: {
    paddingBottom: 16,
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recentSearchText: {
    marginLeft: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    marginTop: 8,
    color: "#666",
    fontSize: 16,
  },
})
