"use client"

import { useState, useRef } from "react"
import { StyleSheet, RefreshControl, TouchableOpacity, TextInput, Animated, Image, Dimensions } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getAccommodations } from "@/services/accommodation"
import AccommodationCard from "@/components/accommodation/accommodation-card"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Accommodation, AccommodationType } from "@/types"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import AccommodationTypeFilter from "@/components/accommodation/accommodation-type-filter"
import { ActivityIndicator } from "react-native"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { useToast } from "@/providers/toast-provider"
import { MotiView } from "moti"

const { width } = Dimensions.get("window")
const ANIMATION_DELAY = 100

export default function AccommodationScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<AccommodationType | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const colorScheme = useColorScheme()
  const router = useRouter()
  const toast = useToast()
  const scrollY = useRef(new Animated.Value(0)).current
  const [searchFocused, setSearchFocused] = useState(false)

  const {
    data: accommodations,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["accommodations", selectedType?.id, searchQuery],
    queryFn: () =>
      getAccommodations({
        typeId: selectedType?.id,
        searchQuery,
      }),
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
    toast.show({
      type: "success",
      title: "Refreshed",
      message: "Latest accommodations loaded",
    })
  }

  const navigateToCreateAccommodation = () => {
    router.push("/accommodation/create")
  }

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: "clamp",
  })

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 50],
    extrapolate: "clamp",
  })

  const renderItem = ({ item, index }: { item: Accommodation; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * ANIMATION_DELAY, type: "timing" }}
    >
      <AccommodationCard accommodation={item} style={styles.accommodationCard} />
    </MotiView>
  )

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <Text style={styles.headerTitle}>Accommodation</Text>
          <TouchableOpacity onPress={() => router.push("/accommodation/saved")}>
            <MaterialIcons name="bookmark" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.searchContainer,
            {
              transform: [{ translateY: searchBarTranslateY }],
              zIndex: searchFocused ? 10 : 1,
            },
          ]}
        >
          <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
            <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search accommodations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialIcons
              name="filter-list"
              size={20}
              color={showFilters ? "#fff" : Colors[colorScheme ?? "light"].text}
            />
            <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>
              Filters
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {showFilters && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 100 }}
            transition={{ type: "spring", damping: 15 }}
            style={styles.filtersContainer}
          >
            <View style={styles.filterHeader}>
              <View style={styles.filterTitleContainer}>
                <MaterialIcons name="apartment" size={16} color="#666" style={styles.filterTitleIcon} />
                <Text style={styles.filterTitle}>Room Types</Text>
              </View>
              {selectedType && (
                <TouchableOpacity 
                  style={styles.clearFilterButton} 
                  onPress={() => setSelectedType(null)}
                >
                  <MaterialIcons name="close" size={12} color="#666" style={styles.clearFilterIcon} />
                  <Text style={styles.clearFilterText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <AccommodationTypeFilter selectedType={selectedType} onSelectType={setSelectedType} />
          </MotiView>
        )}

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.loaderText}>Loading accommodations...</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={accommodations}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              styles.listContent,
              { paddingTop: showFilters ? 220 : 120 }, // Adjusted for the new filter height
            ]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {/* <Image
                  source={require("@/assets/images/empty-accommodation.png")}
                  style={styles.emptyImage}
                  resizeMode="contain"
                /> */}
                <Text style={styles.emptyTitle}>No accommodations found</Text>
                <Text style={styles.emptyText}>Try adjusting your filters or search query</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => setSelectedType(null)}>
                  <Text style={styles.emptyButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            }
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
            scrollEventThrottle={16}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={navigateToCreateAccommodation} activeOpacity={0.8}>
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.fabText}>List Room</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchBarFocused: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
  },
  filterButton: {
    marginLeft: 12,
    width: 96,
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  filtersContainer: {
    position: "absolute",
    top: 112,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    zIndex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filterTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterTitleIcon: {
    marginRight: 6,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  clearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
  },
  clearFilterIcon: {
    marginRight: 3,
  },
  clearFilterText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
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
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})
