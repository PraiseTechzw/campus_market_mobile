"use client"

import { useState } from "react"
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getListings } from "@/services/marketplace"
import ListingCard from "@/components/marketplace/listing-card"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Listing, ListingCategory } from "@/types"
import { Filter, Plus, Search } from "lucide-react"
import { useRouter } from "expo-router"
import CategoryFilter from "@/components/marketplace/category-filter"
import { ActivityIndicator } from "react-native"

export default function MarketplaceScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const colorScheme = useColorScheme()
  const router = useRouter()

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
  }

  const navigateToCreateListing = () => {
    router.push("/marketplace/create")
  }

  const renderItem = ({ item }: { item: Listing }) => <ListingCard listing={item} style={styles.listingCard} />

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search marketplace..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
          <Filter size={20} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
      </View>

      {showFilters && <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />}

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No listings found. Try adjusting your filters.</Text>}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={navigateToCreateListing}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
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
    borderRadius: 8,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  listContent: {
    paddingBottom: 80,
  },
  listingCard: {
    width: "48%",
    marginBottom: 16,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0891b2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
})
