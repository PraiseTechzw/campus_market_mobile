"use client"

import { useState } from "react"
import { StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, View as RNView, Alert } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import React from "react"

type FavoriteItem = {
  id: string
  listing: {
    id: string | number
    title: string
    price: number
    images: string[]
    is_sold: boolean
    created_at: string
  }
}

export default function FavoritesScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: getFavorites,
    enabled: !!session,
  })

  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
    },
  })

  async function getFavorites(): Promise<FavoriteItem[]> {
    try {
      if (!session) return []
      
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          listing:listing_id (
            id,
            title,
            price,
            images,
            is_sold,
            created_at
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      // Transform data to match the FavoriteItem type
      return data
        .filter((item: any) => item && item.id) // Filter out null/undefined items
        .map((item: any) => ({
          id: item.id,
          // Handle array listings and null cases
          listing: Array.isArray(item.listing) && item.listing.length > 0 
            ? item.listing[0] 
            : (item.listing || null)
        })) as FavoriteItem[]
    } catch (error) {
      console.error("Error fetching favorites:", error)
      return []
    }
  }

  async function removeFavorite(favoriteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error removing favorite:", error)
      return false
    }
  }

  function handleRemoveFavorite(id: string) {
    Alert.alert(
      "Remove from Favorites",
      "Are you sure you want to remove this item from your favorites?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => removeFavoriteMutation.mutate(id)
        }
      ]
    )
  }

  function renderItem({ item }: { item: FavoriteItem }) {
    const listing = item.listing
    // Handle null listings and provide default values
    if (!listing) {
      return (
        <RNView style={styles.itemContainer}>
          <View style={[styles.item, {justifyContent: "center", alignItems: "center"}]}>
            <Text>Item no longer available</Text>
          </View>
        </RNView>
      )
    }
    
    const imageUrl = listing.images && listing.images.length > 0 
      ? listing.images[0] 
      : "https://via.placeholder.com/100"

    return (
      <RNView style={styles.itemContainer}>
        <TouchableOpacity 
          style={styles.item}
          onPress={() => router.push(`/listings/${listing.id}`)}
        >
          <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle} numberOfLines={2}>{listing.title}</Text>
            <Text style={styles.itemPrice}>${listing.price}</Text>
            {listing.is_sold && <Text style={styles.soldBadge}>Sold</Text>}
          </View>
        </TouchableOpacity>
        
        <RNView style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/listings/${listing.id}`)}
          >
            <Ionicons name="eye" size={18} color="#0891b2" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleRemoveFavorite(item.id)}
          >
            <Ionicons name="heart-dislike" size={18} color="#ef4444" />
          </TouchableOpacity>
        </RNView>
      </RNView>
    )
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart" size={60} color="#e0e0e0" />
      <Text style={styles.emptyText}>No favorites yet</Text>
      <Text style={styles.emptySubtext}>
        Items you save will appear here
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => router.push("/listings")}
      >
        <Text style={styles.browseButtonText}>Browse Listings</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <>
      <Stack.Screen
        options={{
          title: "My Favorites",
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
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.id}`}
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
  soldBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: "#f0f0f0",
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
