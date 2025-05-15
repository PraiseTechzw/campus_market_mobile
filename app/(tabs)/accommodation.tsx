"use client"

import { useState } from "react"
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getAccommodations } from "@/services/accommodation"
import AccommodationCard from "@/components/accommodation/accommodation-card"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Accommodation, AccommodationType } from "@/types"
import { Filter, Plus, Search } from "lucide-react"
import { useRouter } from "expo-router"
import AccommodationTypeFilter from "@/components/accommodation/accommodation-type-filter"
import { ActivityIndicator } from "react-native"

export default function AccommodationScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<AccommodationType | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const colorScheme = useColorScheme()
  const router = useRouter()

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
  }

  const navigateToCreateAccommodation = () => {
    router.push("/accommodation/create")
  }

  const renderItem = ({ item }: { item: Accommodation }) => (
    <AccommodationCard accommodation={item} style={styles.accommodationCard} />
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search accommodations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
          <Filter size={20} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
      </View>

      {showFilters && <AccommodationTypeFilter selectedType={selectedType} onSelectType={setSelectedType} />}

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
      ) : (
        <FlatList
          data={accommodations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No accommodations found. Try adjusting your filters.</Text>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={navigateToCreateAccommodation}>
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
  listContent: {
    paddingBottom: 80,
  },
  accommodationCard: {
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
