"use client"

import { useState, useEffect, useRef } from "react"
import { StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Keyboard, Animated as RNAnimated, Dimensions, Platform } from "react-native"
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
import { BlurView } from "expo-blur"

// Define a consistent theme
const THEME = {
  green: {
    primary: "#10b981",
    light: "#34d399",
    dark: "#059669",
    ultraLight: "#d1fae5"
  },
  background: {
    light: "#f8fafc",
    dark: "#0f172a"
  },
  container: {
    light: "rgba(255, 255, 255, 0.9)",
    dark: "rgba(30, 41, 59, 0.9)"
  },
  input: {
    light: "rgba(0, 0, 0, 0.04)",
    dark: "rgba(255, 255, 255, 0.08)"
  }
}

const { width } = Dimensions.get('window')

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
  const [isFocused, setIsFocused] = useState(false)
  const colorScheme = useColorScheme()
  const router = useRouter()
  const toast = useToast()
  const inputRef = useRef<TextInput>(null)
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const searchBarWidth = useRef(new Animated.Value(width - 32)).current
  const searchBarHeight = useRef(new Animated.Value(56)).current
  const searchBarOpacity = useRef(new Animated.Value(0)).current
  const resultsOpacity = useRef(new Animated.Value(0)).current
  const loadingScale = useRef(new Animated.Value(0.9)).current
  const inputScale = useRef(new Animated.Value(1)).current
  const backgroundY = useRef(new Animated.Value(0)).current

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
      duration: 400,
      useNativeDriver: true,
    }).start()

    Animated.timing(searchBarOpacity, {
      toValue: 1,
      duration: 500,
      delay: 200,
      useNativeDriver: true,
    }).start()

    // Height can't use native driver
    Animated.spring(searchBarHeight, {
      toValue: 56,
      friction: 7,
      tension: 40,
      useNativeDriver: false, // Must be false for height animations
    }).start()
    
    // Subtle background parallax effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundY, {
          toValue: -10,
          duration: 20000,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundY, {
          toValue: 0,
          duration: 20000,
          useNativeDriver: true,
        })
      ])
    ).start()
  }, [])

  useEffect(() => {
    // Animate results when they change
    if (results.length > 0 || loading) {
      Animated.timing(resultsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      resultsOpacity.setValue(0)
    }
  }, [results, loading])
  
  // Handle input focus animations
  const handleFocus = () => {
    setIsFocused(true)
    Animated.spring(inputScale, {
      toValue: 1.02,
      friction: 8,
      tension: 40,
      useNativeDriver: true
    }).start()
  }
  
  const handleBlur = () => {
    setIsFocused(false)
    Animated.spring(inputScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true
    }).start()
  }

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
      toast.showToast(
        "Recent searches cleared",
        "success"
      )
    } catch (error) {
      console.error("Error clearing recent searches:", error)
    }
  }

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    Keyboard.dismiss()

    try {
      Animated.parallel([
        Animated.spring(loadingScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(resultsOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start()

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
      
      Animated.timing(resultsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
      
    } catch (error) {
      console.error("Error searching:", error)
      toast.showToast(
        "Failed to perform search",
        "error"
      )
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

  const renderResultItem = ({ item, index }: { item: SearchResult, index: number }) => {
    // Add staggered animation for each item
    const itemAnimation = useRef(new Animated.Value(0)).current
    
    useEffect(() => {
      Animated.timing(itemAnimation, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }).start()
    }, [])
    
    const animatedStyle = {
      opacity: itemAnimation,
      transform: [
        { 
          translateY: itemAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }
      ]
    }
    
    switch (item.type) {
      case "listing":
        return (
          <Animated.View style={animatedStyle}>
            <TouchableOpacity 
              onPress={() => navigateToResult(item)} 
              style={styles.resultItem}
              activeOpacity={0.9}
            >
              <ListingCard listing={item.data as Listing} style={styles.card} />
            </TouchableOpacity>
          </Animated.View>
        )
      case "accommodation":
        return (
          <Animated.View style={animatedStyle}>
            <TouchableOpacity 
              onPress={() => navigateToResult(item)} 
              style={styles.resultItem}
              activeOpacity={0.9}
            >
              <AccommodationCard accommodation={item.data as Accommodation} style={styles.card} />
            </TouchableOpacity>
          </Animated.View>
        )
      case "event":
        const event = item.data as Event
        return (
          <Animated.View style={animatedStyle}>
            <TouchableOpacity 
              onPress={() => navigateToResult(item)} 
              style={styles.resultItem}
              activeOpacity={0.9}
            >
              <BlurView intensity={40} tint={colorScheme === "dark" ? "dark" : "light"} style={styles.eventCard}>
                <LinearGradient
                  colors={[THEME.green.light, THEME.green.dark]}
                  style={styles.eventGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="event" size={24} color="#fff" style={styles.eventIcon} />
                </LinearGradient>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.eventDate}>
                    {new Date(event.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <View style={styles.eventTagContainer}>
                    <View style={styles.eventTag}>
                      <Text style={styles.eventTagText}>Event</Text>
                    </View>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        )
      default:
        return null
    }
  }

  const renderRecentSearch = ({ item, index }: { item: string, index: number }) => {
    // Add staggered animation for each item
    const itemAnimation = useRef(new Animated.Value(0)).current
    
    useEffect(() => {
      Animated.timing(itemAnimation, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start()
    }, [])
    
    const animatedStyle = {
      opacity: itemAnimation,
      transform: [
        { 
          translateX: itemAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 0]
          })
        }
      ]
    }
    
    return (
      <Animated.View style={animatedStyle}>
        <BlurView 
          intensity={40} 
          tint={colorScheme === "dark" ? "dark" : "light"} 
          style={styles.recentSearchItemBlur}
        >
          <TouchableOpacity 
            style={styles.recentSearchItem} 
            onPress={() => handleSearch(item)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="history" size={20} color={colorScheme === "dark" ? "#aaa" : "#888"} />
            <Text style={styles.recentSearchText} numberOfLines={1}>{item}</Text>
            <View style={styles.flexSpacer} />
            <TouchableOpacity 
              style={styles.searchAgainButton} 
              onPress={() => handleSearch(item)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="search" size={18} color={THEME.green.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    )
  }

  const backgroundStyle = {
    backgroundColor: colorScheme === "dark" ? THEME.background.dark : THEME.background.light,
  }

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.pageContainer, backgroundStyle]}>
        <Animated.View 
          style={[
            styles.backgroundGradient, 
            {
              transform: [{ translateY: backgroundY }],
              opacity: 0.7
            }
          ]}
        >
          <LinearGradient
            colors={colorScheme === "dark" 
              ? ["rgba(10, 24, 61, 0.4)", "rgba(0, 10, 23, 0.4)"] 
              : ["rgba(210, 250, 230, 0.3)", "rgba(230, 250, 250, 0.3)"]}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={[
                styles.backButton,
                colorScheme === "dark" ? { backgroundColor: "rgba(255, 255, 255, 0.08)" } : {}
              ]} 
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Search</Text>
          </View>

          <Animated.View 
            style={[
              styles.searchContainer, 
              { 
                opacity: searchBarOpacity,
              },
              // Separate the transform (which can use native driver) from height (which can't)
              { height: searchBarHeight },
              { transform: [{ scale: inputScale }] }
            ]}
          >
            <View style={[
              styles.searchInputContainer,
              isFocused && styles.searchInputFocused,
              colorScheme === "dark" ? { backgroundColor: THEME.input.dark } : {}
            ]}>
              <MaterialIcons 
                name="search" 
                size={24} 
                color={isFocused ? THEME.green.primary : (colorScheme === "dark" ? "#aaa" : "#888")} 
                style={styles.searchIcon} 
              />
              <TextInput
                ref={inputRef}
                style={[
                  styles.searchInput,
                  colorScheme === "dark" && { color: "#fff" }
                ]}
                placeholder="Search listings, accommodations, events..."
                placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#999"}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => handleSearch()}
                returnKeyType="search"
                autoFocus
                onFocus={handleFocus}
                onBlur={handleBlur}
                selectionColor={THEME.green.primary}
              />
              {query.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={() => {
                    setQuery("")
                    inputRef.current?.focus()
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.clearButtonInner}>
                    <MaterialIcons name="clear" size={18} color={colorScheme === "dark" ? "#fff" : "#666"} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={() => handleSearch()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[THEME.green.primary, THEME.green.dark]}
                style={styles.searchButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {loading ? (
            <Animated.View 
              style={[
                styles.loadingContainer,
                {
                  opacity: resultsOpacity,
                  transform: [{ scale: loadingScale }]
                }
              ]}
            >
              <ActivityIndicator size="large" color={THEME.green.primary} />
              <Text style={styles.loadingText}>Searching...</Text>
            </Animated.View>
          ) : results.length > 0 ? (
            <Animated.View style={{ flex: 1, opacity: resultsOpacity }}>
              <FlatList
                data={results}
                renderItem={renderResultItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.resultsContainer}
                showsVerticalScrollIndicator={false}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
              />
            </Animated.View>
          ) : (
            <View style={styles.recentSearchesContainer}>
              <View style={styles.recentSearchesHeader}>
                <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
                {recentSearches.length > 0 && (
                  <TouchableOpacity 
                    onPress={clearRecentSearches}
                    activeOpacity={0.7}
                    style={styles.clearAllButton}
                  >
                    <MaterialIcons name="delete-outline" size={16} color={THEME.green.primary} />
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
                <BlurView 
                  intensity={40} 
                  tint={colorScheme === "dark" ? "dark" : "light"} 
                  style={styles.emptyContainerBlur}
                >
                  <View style={styles.emptyContainer}>
                    <MaterialIcons 
                      name="search" 
                      size={64} 
                      color={colorScheme === "dark" ? "#555" : "#ddd"} 
                    />
                    <Text style={styles.emptyText}>No recent searches</Text>
                    <Text style={[
                      styles.emptySubText,
                      colorScheme === "dark" && { color: "#aaa" }
                    ]}>
                      Try searching for listings, accommodations, or events
                    </Text>
                    <TouchableOpacity 
                      style={styles.searchNowButton} 
                      onPress={() => inputRef.current?.focus()}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[THEME.green.primary, THEME.green.dark]}
                        style={styles.searchNowGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.searchNowText}>Search Now</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.input.light,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
    height: 56,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInputFocused: {
    borderColor: THEME.green.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: THEME.green.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    borderRadius: 12,
    justifyContent: "center",
    overflow: 'hidden',
    height: 56,
    shadowColor: THEME.green.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  searchButtonGradient: {
    height: '100%',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#888",
    fontWeight: '500',
  },
  resultsContainer: {
    paddingBottom: 20,
  },
  resultItem: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    width: "100%",
    borderRadius: 16,
  },
  eventCard: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    height: 100,
  },
  eventGradient: {
    width: 100,
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
  },
  eventIcon: {
    marginBottom: 4,
  },
  eventContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  eventTagContainer: {
    flexDirection: 'row',
  },
  eventTag: {
    backgroundColor: THEME.green.ultraLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTagText: {
    color: THEME.green.dark,
    fontSize: 12,
    fontWeight: '600',
  },
  recentSearchesContainer: {
    flex: 1,
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  recentSearchesTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  clearRecentText: {
    color: THEME.green.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  recentSearchesList: {
    paddingBottom: 20,
  },
  recentSearchItemBlur: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  recentSearchText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  flexSpacer: {
    flex: 1,
  },
  searchAgainButton: {
    padding: 8,
  },
  emptyContainerBlur: {
    flex: 1,
    marginTop: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
    color: "#666",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubText: {
    color: "#999",
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
    marginBottom: 24
  },
  searchNowButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: THEME.green.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  searchNowGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  searchNowText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  }
})
