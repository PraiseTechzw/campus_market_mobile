"use client"

import { useState } from "react"
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFavorites, removeFromFavorites } from "@/services/favorites"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
  import ListingCard from "@/components/marketplace/listing-card"
import AccommodationCard from "@/components/accommodation/accommodation-card"
import { Alert } from "react-native"

export default function FavoritesScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const {
    data: favorites,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => (session ? getFavorites(session.user.id) : Promise.resolve([])),
    enabled: !!session,
  })

  const removeFavoriteMutation = useMutation({
    mutationFn: removeFromFavorites,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
    },
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleRemoveFavorite = (id: string | number) => {
    Alert.alert("Remove Favorite", "Are you sure you want to remove this item from your favorites?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeFavoriteMutation.mutate(id),
      },
    ])
  }

  if (!session) return null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.favoriteItem}>
              {item.listing ? (
                <ListingCard listing={item.listing} style={styles.card} />
              ) : item.accommodation ? (
                <AccommodationCard accommodation={item.accommodation} style={styles.card} />
              ) : null}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFavorite(item.id)}
                disabled={removeFavoriteMutation.isPending}
              >
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No favorites yet</Text>
              <Text style={styles.emptySubtext}>Items you favorite will appear here for easy access</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  favoriteItem: {
    position: "relative",
    marginBottom: 16,
  },
  card: {
    width: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
})
