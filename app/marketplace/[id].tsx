"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Linking, Share } from "react-native"
import { Text, View } from "@/components/themed"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { getListingById } from "@/services/marketplace"
import { createConversation } from "@/services/messages"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { formatDistanceToNow } from "date-fns"
import { checkIfFavorite, addToFavorites, removeFromFavorites } from "@/services/favorites"
import ReviewsSection from "@/components/reviews/reviews-section"
import { Ionicons } from "@expo/vector-icons"
import React from "react"

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [favoriteStatus, setFavoriteStatus] = useState<{ isFavorite: boolean; favoriteId: string | null }>({
    isFavorite: false,
    favoriteId: null,
  })

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListingById(id),
    enabled: !!id,
  })

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (session && listing) {
        const status = await checkIfFavorite(session.user.id, listing.id)
        setFavoriteStatus(status)
      }
    }

    checkFavoriteStatus()
  }, [session, listing])

  const handleContact = async () => {
    console.log("[Marketplace] Contact seller button clicked");
    
    if (!session) {
      console.log("[Marketplace] Error: No active session");
      return;
    }
    
    if (!listing) {
      console.log("[Marketplace] Error: No listing data");
      return;
    }

    console.log("[Marketplace] Session user ID:", session.user.id);
    console.log("[Marketplace] Seller ID:", listing.user.id);
    console.log("[Marketplace] Listing ID:", listing.id);

    try {
      setLoading(true)
      console.log("[Marketplace] Creating conversation...");
      // Create or get existing conversation
      const conversationId = await createConversation(session.user.id, listing.user.id, listing.id)
      console.log("[Marketplace] Conversation created/found with ID:", conversationId);

      // Navigate to the conversation
      console.log("[Marketplace] Navigating to conversation screen");
      router.push({
        pathname: "/messages/[id]",
        params: { id: conversationId },
      })
    } catch (error) {
      console.error("[Marketplace] Error creating conversation:", error)
      Alert.alert("Error", "Failed to start conversation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = async () => {
    if (!listing || !listing.user) return

    // This is a placeholder - in a real app, you would get the phone from the user's profile
    const phone = listing.user.phone || ""
    if (!phone) {
      Alert.alert("Error", "Seller's phone number is not available.")
      return
    }

    const message = `Hi, I'm interested in your listing "${listing.title}" on UniConnect.`
    const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl)
      if (canOpen) {
        await Linking.openURL(whatsappUrl)
      } else {
        Alert.alert("Error", "WhatsApp is not installed on your device.")
      }
    } catch (error) {
      Alert.alert("Error", "Could not open WhatsApp.")
    }
  }

  const handleShare = async () => {
    if (!listing) return

    try {
      await Share.share({
        message: `Check out this listing on UniConnect: ${listing.title} - $${listing.price}`,
        // In a real app, you would include a deep link URL here
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!session || !listing) return

    try {
      if (favoriteStatus.isFavorite && favoriteStatus.favoriteId) {
        await removeFromFavorites(favoriteStatus.favoriteId)
        setFavoriteStatus({ isFavorite: false, favoriteId: null })
      } else {
        const favorite = await addToFavorites({
          user_id: session.user.id,
          listing_id: listing.id,
        })
        setFavoriteStatus({ isFavorite: true, favoriteId: favorite.id.toString() })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      Alert.alert("Error", "Failed to update favorite status. Please try again.")
    }
  }

  if (isLoading || !listing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  const isOwnListing = session?.user.id === listing.user_id

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Images */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={true} style={styles.imageContainer}>
          {listing.images && listing.images.length > 0 ? (
            listing.images.map((image, index) => <Image key={index} source={{ uri: image }} style={styles.image} />)
          ) : (
            <Image source={{ uri: "/placeholder.svg?height=300&width=400" }} style={styles.image} />
          )}
        </ScrollView>

        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.location}>{listing.location}</Text>
            <Text style={styles.time}>{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.sellerContainer}>
            <Image
              source={{
                uri: listing.user?.avatar_url || "/placeholder.svg?height=50&width=50",
              }}
              style={styles.sellerAvatar}
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>
                {listing.user?.first_name} {listing.user?.last_name}
              </Text>
              <Text style={styles.sellerStatus}>
                {isOwnListing ? "You" : "Seller"} • {listing.user?.is_verified ? "Verified Student" : "Student"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Condition</Text>
              <Text style={styles.detailValue}>
                {listing.condition
                  ? listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1).replace("_", " ")
                  : "Not specified"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>
                {(listing as any).category?.name || "Not specified"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />
          <ReviewsSection listingId={id} revieweeId={listing.user_id} />
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
          <Ionicons name="heart" size={20} color={favoriteStatus.isFavorite ? "#ef4444" : "#666"} />
        </TouchableOpacity>
        {!isOwnListing && (
          <TouchableOpacity style={styles.contactButton} onPress={handleContact} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" style={styles.contactIcon} />
                <Text style={styles.contactButtonText}>Contact Seller</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    height: 300,
  },
  image: {
    width: 400,
    height: 300,
    resizeMode: "cover",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  time: {
    fontSize: 14,
    color: "#999",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  sellerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sellerStatus: {
    fontSize: 14,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0891b2",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
