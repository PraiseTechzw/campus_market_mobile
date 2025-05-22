"use client"

import { useState, useMemo } from "react"
import { StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, View as RNView, Alert, TextInput } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { Stack, useRouter } from "expo-router"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import React from "react"

type ListingTab = "active" | "sold" | "drafts"
type ListingItem = {
  id: string | number
  title: string
  price: number
  images: string[]
  is_sold: boolean
  is_draft?: boolean
  created_at: string
}

export default function MyListingsScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<ListingTab>("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "price" | "title">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const { data: listings, isLoading } = useQuery({
    queryKey: ["myListings", activeTab],
    queryFn: () => getMyListings(activeTab),
    enabled: !!session,
  })

  const toggleListingStatusMutation = useMutation({
    mutationFn: toggleListingStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myListings"] })
    },
  })

  const deleteListingMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myListings"] })
    },
  })

  async function getMyListings(type: ListingTab): Promise<ListingItem[]> {
    try {
      if (!session) return []
      
      let query = supabase
        .from("listings")
        .select("id, title, price, images, is_sold, created_at")
        .eq("user_id", session.user.id)
      
      switch (type) {
        case "active":
          query = query.eq("is_sold", false).order("created_at", { ascending: false })
          break
        case "sold":
          query = query.eq("is_sold", true).order("created_at", { ascending: false })
          break
        case "drafts":
          // For now, show newest listings as drafts (placeholder until draft functionality is implemented)
          query = query.eq("is_sold", false).order("created_at", { ascending: false }).limit(0)
          break
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data as ListingItem[]
    } catch (error) {
      console.error(`Error fetching ${type} listings:`, error)
      return []
    }
  }

  async function toggleListingStatus(item: { id: string | number, isSold: boolean }) {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_sold: item.isSold })
        .eq("id", item.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error updating listing status:", error)
      return false
    }
  }

  async function deleteListing(id: string | number) {
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error deleting listing:", error)
      return false
    }
  }

  function handleDeleteListing(id: string | number) {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteListingMutation.mutate(id)
        }
      ]
    )
  }

  function handleToggleStatus(id: string | number, currentStatus: boolean) {
    Alert.alert(
      currentStatus ? "Mark as Available" : "Mark as Sold",
      currentStatus 
        ? "Are you sure you want to mark this item as available again?" 
        : "Are you sure you want to mark this item as sold?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => toggleListingStatusMutation.mutate({ id, isSold: !currentStatus })
        }
      ]
    )
  }

  function renderItem({ item }: { item: ListingItem }) {
    const imageUrl = item.images && item.images.length > 0 
      ? item.images[0] 
      : "https://via.placeholder.com/100"

    return (
      <RNView style={styles.itemContainer}>
        <TouchableOpacity 
          style={styles.item}
          onPress={() => router.push(`/listings/${item.id}`)}
        >
          <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.itemPrice}>${item.price}</Text>
            {item.is_sold && <Text style={styles.soldBadge}>Sold</Text>}
          </View>
        </TouchableOpacity>
        
        <RNView style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/listings/edit/${item.id}`)}
          >
            <Ionicons name="pencil" size={18} color="#0891b2" />
          </TouchableOpacity>
          
          {!item.is_draft && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleToggleStatus(item.id, item.is_sold)}
            >
              <Ionicons 
                name={item.is_sold ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={18} 
                color={item.is_sold ? "#10b981" : "#f59e0b"} 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteListing(item.id)}
          >
            <Ionicons name="trash" size={18} color="#ef4444" />
          </TouchableOpacity>
        </RNView>
      </RNView>
    )
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="basket" size={60} color="#e0e0e0" />
      <Text style={styles.emptyText}>No {activeTab} listings</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === "active" && "You don't have any active listings at the moment"}
        {activeTab === "sold" && "You haven't sold any items yet"}
        {activeTab === "drafts" && "Draft functionality is not yet available"}
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => router.push("/listings/create")}
      >
        <Text style={styles.createButtonText}>Create New Listing</Text>
      </TouchableOpacity>
    </View>
  )

  // Function to sort and filter listings based on current settings
  const sortAndFilterListings = useMemo(() => {
    return (items: ListingItem[]) => {
      // Filter by search query
      let filtered = items;
      if (searchQuery) {
        filtered = items.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply sorting
      return [...filtered].sort((a, b) => {
        if (sortBy === "date") {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        } 
        else if (sortBy === "price") {
          return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
        } 
        else { // title
          return sortOrder === "asc" 
            ? a.title.localeCompare(b.title) 
            : b.title.localeCompare(a.title);
        }
      });
    };
  }, [searchQuery, sortBy, sortOrder]);

  const Tab = ({ type, label }: { type: ListingTab; label: string }) => (
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
          title: "My Listings",
          headerShown: true,
          headerShadowVisible: false,
          headerTitleStyle: styles.headerTitle,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/listings/create")} style={styles.createListingButton}>
              <Ionicons name="add" size={24} color={Colors[colorScheme ?? "light"].tint} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <RNView style={styles.tabs}>
          <Tab type="active" label="Active" />
          <Tab type="sold" label="Sold" />
          <Tab type="drafts" label="Drafts" />
        </RNView>

        <View style={styles.searchContainer}>
          <RNView style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your listings..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </RNView>
          
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              Alert.alert(
                "Sort By",
                "Choose sorting option",
                [
                  { 
                    text: "Date - Newest First", 
                    onPress: () => { setSortBy("date"); setSortOrder("desc"); } 
                  },
                  { 
                    text: "Date - Oldest First", 
                    onPress: () => { setSortBy("date"); setSortOrder("asc"); } 
                  },
                  { 
                    text: "Price - High to Low", 
                    onPress: () => { setSortBy("price"); setSortOrder("desc"); } 
                  },
                  { 
                    text: "Price - Low to High", 
                    onPress: () => { setSortBy("price"); setSortOrder("asc"); } 
                  },
                  { 
                    text: "Title A-Z", 
                    onPress: () => { setSortBy("title"); setSortOrder("asc"); } 
                  },
                  { text: "Cancel", style: "cancel" }
                ]
              );
            }}
          >
            <Ionicons name="filter" size={20} color={Colors[colorScheme ?? "light"].tint} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
        ) : (
          <FlatList
            data={sortAndFilterListings(listings || [])}
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
  createListingButton: {
    marginRight: 16,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
  draftBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#f59e0b",
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
  createButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
  },
}) 