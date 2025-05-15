"use client"

import { useState, useRef } from "react"
import { StyleSheet, RefreshControl, TouchableOpacity, TextInput, Animated, Dimensions, Image } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getListings } from "@/services/marketplace"
import ListingCard from "@/components/marketplace/listing-card"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Listing, ListingCategory } from "@/types"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import CategoryFilter from "@/components/marketplace/category-filter"
import { ActivityIndicator } from "react-native"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { useToast } from "@/providers/toast-provider"
import { MotiView } from "moti"

const { width } = Dimensions.get("window")
const ANIMATION_DELAY = 100

export default function MarketplaceScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const colorScheme = useColorScheme()
  const router = useRouter()
  const toast = useToast()
  const scrollY = useRef(new Animated.Value(0)).current
  const [searchFocused, setSearchFocused] = useState(false)

  const {
    data: listings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["listings", selectedCategory?.id, searchQuery],
    queryFn: () =>
      getListings({
        categoryId: selectedCategory?.id,
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
      message: "Latest listings loaded",
    })
  }

  const navigateToCreateListing = () => {
    router.push("/marketplace/create")
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

  const renderItem = ({ item, index }: { item: Listing; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * ANIMATION_DELAY, type: "timing" }}
      style={styles.listingCardWrapper}
    >
      <ListingCard listing={item} style={styles.listingCard} />
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
          <Text style={styles.headerTitle}>Marketplace</Text>
          <TouchableOpacity onPress={() => router.push("/marketplace/saved")}>
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
              placeholder="Search marketplace..."
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
          </TouchableOpacity>
        </Animated.View>

        {showFilters && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 80 }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.filtersContainer}
          >
            <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          </MotiView>
        )}

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.loaderText}>Loading listings...</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={listings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={[
              styles.listContent,
              { paddingTop: showFilters ? 180 : 120 }, // Adjust based on filters visibility
            ]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {/* <Image
                  source={require("@/assets/images/empty-state.png")}
                  style={styles.emptyImage}
                  resizeMode="contain"
                /> */}
                <Text style={styles.emptyTitle}>No listings found</Text>
                <Text style={styles.emptyText}>Try adjusting your filters or search query</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => setSelectedCategory(null)}>
                  <Text style={styles.emptyButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            }
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
            scrollEventThrottle={16}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={navigateToCreateListing} activeOpacity={0.8}>
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.fabText}>Sell</Text>
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
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  filtersContainer: {
    position: "absolute",
    top: 112,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    overflow: "hidden",
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  listingCardWrapper: {
    width: "48%",
    marginBottom: 16,
  },
  listingCard: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
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
