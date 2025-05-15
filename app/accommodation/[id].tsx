"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Share } from "react-native"
import { Text, View } from "@/components/themed"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { getAccommodationById } from "@/services/accommodation"
import { createConversation } from "@/services/messages"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { formatDistanceToNow } from "date-fns"
import { checkIfFavorite, addToFavorites, removeFromFavorites } from "@/services/favorites"
import ReviewsSection from "@/components/reviews/reviews-section"
import { Ionicons } from "@expo/vector-icons"

export default function AccommodationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [favoriteStatus, setFavoriteStatus] = useState<{ isFavorite: boolean; favoriteId: string | null }>({
    isFavorite: false,
    favoriteId: null,
  })

  const { data: accommodation, isLoading } = useQuery({
    queryKey: ["accommodation", id],
    queryFn: () => getAccommodationById(id),
    enabled: !!id,
  })

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (session && accommodation) {
        const status = await checkIfFavorite(session.user.id, undefined, accommodation.id)
        setFavoriteStatus(status)
      }
    }

    checkFavoriteStatus()
  }, [session, accommodation])

  const handleContact = async () => {
    if (!session || !accommodation) return

    try {
      setLoading(true)
      // Create or get existing conversation
      const conversationId = await createConversation(
        session.user.id,
        accommodation.landlord.id,
        undefined,
        accommodation.id,
      )

      // Navigate to the conversation
      router.push({
        pathname: "/messages/[id]",
        params: { id: conversationId },
      })
    } catch (error) {
      console.error("Error creating conversation:", error)
      Alert.alert("Error", "Failed to start conversation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!session || !accommodation) return

    // In a real app, this would navigate to a booking form
    Alert.alert(
      "Apply for Accommodation",
      "This feature is coming soon. For now, you can contact the landlord directly.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Contact Landlord", onPress: handleContact },
      ],
    )
  }

  const handleShare = async () => {
    if (!accommodation) return

    try {
      await Share.share({
        message: `Check out this accommodation on UniConnect: ${accommodation.title} - $${accommodation.rent}/month`,
        // In a real app, you would include a deep link URL here
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!session || !accommodation) return

    try {
      if (favoriteStatus.isFavorite && favoriteStatus.favoriteId) {
        await removeFromFavorites(favoriteStatus.favoriteId)
        setFavoriteStatus({ isFavorite: false, favoriteId: null })
      } else {
        const favorite = await addToFavorites({
          user_id: session.user.id,
          accommodation_id: accommodation.id,
        })
        setFavoriteStatus({ isFavorite: true, favoriteId: favorite.id.toString() })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      Alert.alert("Error", "Failed to update favorite status. Please try again.")
    }
  }

  if (isLoading || !accommodation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  const isOwnAccommodation = session?.user.id === accommodation.user_id

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Images */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={true} style={styles.imageContainer}>
          {accommodation.images && accommodation.images.length > 0 ? (
            accommodation.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.image} />
            ))
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
          <Text style={styles.price}>${accommodation.rent.toFixed(2)}/month</Text>
          <Text style={styles.title}>{accommodation.title}</Text>

          <View style={styles.locationRow}>
              <Ionicons name = 'MapPin' size={16} color="#666" />
            <Text style={styles.location}>{accommodation.address}</Text>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name='bed' size={16} color="#666" />
              <Text style={styles.detailText}>
                {accommodation.bedrooms} {accommodation.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Bath size={16} color="#666" />
              <Text style={styles.detailText}>
                {accommodation.bathrooms} {accommodation.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
              </Text>
            </View>

            <Text style={styles.time}>
              {formatDistanceToNow(new Date(accommodation.created_at), { addSuffix: true })}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.landlordContainer}>
            <Image
              source={{
                uri: accommodation.landlord?.avatar_url || "/placeholder.svg?height=50&width=50",
              }}
              style={styles.landlordAvatar}
            />
            <View style={styles.landlordInfo}>
              <Text style={styles.landlordName}>
                {accommodation.landlord?.first_name} {accommodation.landlord?.last_name}
              </Text>
              <Text style={styles.landlordStatus}>
                {isOwnAccommodation ? "You" : "Landlord"} •
                {accommodation.landlord?.is_verified ? " Verified" : " Unverified"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{accommodation.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {accommodation.amenities && accommodation.amenities.length > 0 ? (
              accommodation.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Check size={16} color="#0891b2" />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No amenities listed</Text>
            )}
          </View>

          {accommodation.rules && accommodation.rules.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>House Rules</Text>
              <View style={styles.rulesContainer}>
                {accommodation.rules.map((rule, index) => (
                  <View key={index} style={styles.ruleItem}>
                    <Text style={styles.ruleNumber}>{index + 1}.</Text>
                    <Text style={styles.ruleText}>{rule}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          <View style={styles.divider} />
          <ReviewsSection accommodationId={id} revieweeId={accommodation.landlord.id} />
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
          <Heart
            size={20}
            color={favoriteStatus.isFavorite ? "#ef4444" : "#666"}
            fill={favoriteStatus.isFavorite ? "#ef4444" : "transparent"}
          />
        </TouchableOpacity>
        {!isOwnAccommodation && (
          <>
            <TouchableOpacity style={styles.contactButton} onPress={handleContact} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MessageCircle size={20} color="#fff" style={styles.contactIcon} />
                  <Text style={styles.contactButtonText}>Contact Landlord</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Now</Text>
            </TouchableOpacity>
          </>
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
    color: "#0891b2",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  time: {
    fontSize: 14,
    color: "#999",
    marginLeft: "auto",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  landlordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  landlordAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  landlordInfo: {
    flex: 1,
  },
  landlordName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  landlordStatus: {
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
  amenitiesContainer: {
    marginTop: 8,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 16,
    marginLeft: 8,
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  rulesContainer: {
    marginTop: 8,
  },
  ruleItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  ruleNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
    width: 20,
  },
  ruleText: {
    fontSize: 16,
    flex: 1,
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
    marginRight: 8,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#10b981",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
