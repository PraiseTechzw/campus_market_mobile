"use client"

import { useState } from "react"
import { StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, View as RNView } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { Favorite } from "@/types"

type FavoriteTab = "listings" | "accommodations"

export default function FavoritesScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<FavoriteTab>("listings")

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites", activeTab],
    queryFn: () => getFavorites(activeTab),
    enabled: !!session,
  })

  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
    },
  })

  async function getFavorites(type: FavoriteTab): Promise<Favorite[]> {
    try {
      if (type === "listings") {
        const { data, error } = await supabase
          .from("product_favorites")
          .select(`
            id,
            user_id,
            product_id,
            created_at,
            listing:product_id(id, title, price, images)
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        return data as unknown as Favorite[]
      } else {
        const { data, error } = await supabase
          .from("accommodation_favorites")
          .select(`
            id,
            user_id,
            listing_id,
            created_at,
            accommodation:listing_id(id, title, rent, images)
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        return data as unknown as Favorite[]
      }
    } catch (error) {
      console.error(`Error fetching ${type} favorites:`, error)
      return []
    }
  }

  async function removeFavorite(item: { id: string | number, type: FavoriteTab }) {
    try {
      const table = item.type === "listings" ? "product_favorites" : "accommodation_favorites"
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", item.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error removing favorite:", error)
      return false
    }
  }

  function renderItem({ item }: { item: Favorite }) {
    const itemData = activeTab === "listings" ? item.listing : item.accommodation
    if (!itemData) return null

    const imageUrl = itemData.images && itemData.images.length > 0 
      ? itemData.images[0] 
      : "https://via.placeholder.com/100"
    
    const price = activeTab === "listings" 
      ? `$${itemData.price}` 
      : `$${itemData.rent}/mo`

    return (
      <RNView style={styles.itemContainer}>
        <TouchableOpacity 
          style={styles.item}
          onPress={() => {
            if (activeTab === "listings") {
              router.push(`/marketplace/listing/${itemData.id}`)
            } else {
              router.push(`/accommodation/${itemData.id}`)
            }
          }}
        >
          <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle} numberOfLines={2}>{itemData.title}</Text>
            <Text style={styles.itemPrice}>{price}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFavoriteMutation.mutate({ id: item.id, type: activeTab })}
        >
          <Ionicons name="heart-dislike" size={18} color="#ef4444" />
        </TouchableOpacity>
      </RNView>
    )
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart" size={60} color="#e0e0e0" />
      <Text style={styles.emptyText}>No saved {activeTab}</Text>
      <Text style={styles.emptySubtext}>
        Items you save will appear here. Tap the heart icon on any listing to save it for later.
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => {
          if (activeTab === "listings") {
            router.push("/marketplace")
          } else {
            router.push("/accommodation")
          }
        }}
      >
        <Text style={styles.browseButtonText}>Browse {activeTab === "listings" ? "Marketplace" : "Accommodations"}</Text>
      </TouchableOpacity>
    </View>
  )

  const Tab = ({ type, label }: { type: FavoriteTab; label: string }) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === type && styles.activeTab]}
      onPress={() => setActiveTab(type)}
    >
      <Text style={[styles.tabText, activeTab === type && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <>
      <Stack.Screen
        options={{
          title: "Saved Items",
          headerShown: true,
          headerShadowVisible: false,
          headerTitleStyle: styles.headerTitle,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <RNView style={styles.tabs}>
          <Tab type="listings" label="Marketplace" />
          <Tab type="accommodations" label="Housing" />
        </RNView>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderItem}
            keyExtractor={(item) => `${activeTab}-${item.id}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyList}
            style={styles.list}
          />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    marginLeft: 16,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#e0e0e0",
  },
  activeTab: {
    borderBottomColor: Colors.light.tint,
  },
  tabText: {
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: Colors.light.tint,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  list: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  item: {
    flexDirection: "row",
    flex: 1,
    padding: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.tint,
  },
  removeButton: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
