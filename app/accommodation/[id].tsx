"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Share, Dimensions } from "react-native"
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
import { LinearGradient } from "expo-linear-gradient"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { BlurView } from "expo-blur"

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
    <SafeAreaWrapper>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Images Carousel */}
          <View style={styles.imageCarouselContainer}>
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false} 
              style={styles.imageContainer}
            >
              {accommodation.images && accommodation.images.length > 0 ? (
                accommodation.images.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri: image }} style={styles.image} />
                  </View>
                ))
              ) : (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: "https://via.placeholder.com/400x300?text=No+Image" }} style={styles.image} />
                </View>
              )}
            </ScrollView>

            {/* Back button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Overlay gradient */}
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.5)', 'transparent', 'transparent', 'rgba(0, 0, 0, 0.6)']}
              locations={[0, 0.2, 0.8, 1]}
              style={styles.imageOverlay}
            />

            {/* Price tag */}
            <View style={styles.priceTagContainer}>
              <Text style={styles.price}>${accommodation.rent.toFixed(0)}</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Basic Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.title}>{accommodation.title}</Text>
              
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={Colors[colorScheme ?? "light"].text} />
                <Text style={styles.location}>{accommodation.address}</Text>
              </View>

              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name="bed-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureCount}>{accommodation.bedrooms}</Text>
                    <Text style={styles.featureLabel}>{accommodation.bedrooms === 1 ? "Bedroom" : "Bedrooms"}</Text>
                  </View>
                </View>

                <View style={styles.dividerVertical} />

                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name="water-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureCount}>{accommodation.bathrooms}</Text>
                    <Text style={styles.featureLabel}>{accommodation.bathrooms === 1 ? "Bathroom" : "Bathrooms"}</Text>
                  </View>
                </View>

                <View style={styles.dividerVertical} />

                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.timeSince}>{formatDistanceToNow(new Date(accommodation.created_at), { addSuffix: true })}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Landlord Card */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Property Owner</Text>
              <View style={styles.landlordContainer}>
                <Image
                  source={{
                    uri: accommodation.landlord?.avatar_url || "https://via.placeholder.com/100x100?text=Avatar",
                  }}
                  style={styles.landlordAvatar}
                />
                <View style={styles.landlordInfo}>
                  <Text style={styles.landlordName}>
                    {accommodation.landlord?.first_name} {accommodation.landlord?.last_name}
                  </Text>
                  <View style={styles.verificationContainer}>
                    <Text style={styles.landlordStatus}>
                      {isOwnAccommodation ? "You" : "Landlord"}
                    </Text>
                    {accommodation.landlord?.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
                {!isOwnAccommodation && (
                  <TouchableOpacity style={styles.messageButton} onPress={handleContact}>
                    <Ionicons name="chatbubble" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Description Card */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{accommodation.description}</Text>
            </View>

            {/* Amenities Card */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesContainer}>
                {accommodation.amenities && accommodation.amenities.length > 0 ? (
                  accommodation.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityItem}>
                      <View style={styles.amenityIconContainer}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No amenities listed</Text>
                )}
              </View>
            </View>

            {/* House Rules Card */}
            {accommodation.rules && accommodation.rules.length > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>House Rules</Text>
                <View style={styles.rulesContainer}>
                  {accommodation.rules.map((rule, index) => (
                    <View key={index} style={styles.ruleItem}>
                      <View style={styles.ruleNumberContainer}>
                        <Text style={styles.ruleNumber}>{index + 1}</Text>
                      </View>
                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Reviews Section */}
            <View style={styles.infoCard}>
              <ReviewsSection accommodationId={id} revieweeId={accommodation.landlord.id} />
            </View>
          </View>
        </ScrollView>

        {/* Action buttons */}
        <BlurView intensity={80} tint={colorScheme === "dark" ? "dark" : "light"} style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
            <Ionicons 
              name={favoriteStatus.isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={favoriteStatus.isFavorite ? "#ef4444" : "#666"}
            />
          </TouchableOpacity>
          {!isOwnAccommodation && (
            <>
              <TouchableOpacity style={styles.contactButton} onPress={handleContact} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                    <Text style={styles.contactButtonText}>Contact Landlord</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </TouchableOpacity>
            </>
          )}
        </BlurView>
      </View>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageCarouselContainer: {
    position: "relative",
    height: 300,
  },
  imageContainer: {
    height: 300,
  },
  imageWrapper: {
    width: Dimensions.get("window").width,
    height: 300,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  priceTagContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(8, 145, 178, 0.9)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  pricePeriod: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginLeft: 2,
  },
  content: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 22,
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
  featuresContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  featureItem: {
    alignItems: "center",
    marginRight: 16,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(8, 145, 178, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  featureTextContainer: {
    alignItems: "center",
  },
  featureCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  featureLabel: {
    fontSize: 12,
    color: "#666",
  },
  timeSince: {
    fontSize: 12,
    color: "#666",
  },
  dividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
  },
  landlordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  landlordAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },
  landlordInfo: {
    flex: 1,
  },
  landlordName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  verificationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  landlordStatus: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: "#10b981",
    marginLeft: 2,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: Colors.light.text,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#444",
  },
  amenitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 12,
  },
  amenityIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0891b2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  amenityText: {
    fontSize: 14,
    flex: 1,
  },
  noDataText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  rulesContainer: {
    marginTop: 8,
  },
  ruleItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  ruleNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(8, 145, 178, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ruleNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.light.tint,
  },
  ruleText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(224, 224, 224, 0.5)",
    overflow: "hidden",
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
  contactButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
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
    fontSize: 15,
    fontWeight: "600",
  },
})
