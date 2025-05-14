"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
} from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useColorScheme } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useNetwork } from "@/providers/network-provider"
import { useAuth } from "@/providers/auth-provider"
import { useCart } from "@/providers/cart-provider"
import { getProductById, createOrder, createConversation } from "@/services/api"
import { queueOrderCreation } from "@/utils/sync-queue"
import type { Product } from "@/types"
import OfflineBanner from "@/components/offline-banner"
import React from "react"

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams()
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [creatingOrder, setCreatingOrder] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [id, isConnected])

  const loadProduct = async () => {
    if (!id) return

    setLoading(true)
    try {
      const productData = await getProductById(id as string)
      setProduct(productData)
    } catch (error) {
      console.error("Error loading product:", error)
      Alert.alert("Error", "Failed to load product details")
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "You need to sign in to purchase items", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)/login") },
      ])
      return
    }

    if (!product) return

    if (user.id === product.sellerId) {
      Alert.alert("Error", "You cannot buy your own product")
      return
    }

    setCreatingOrder(true)
    try {
      const orderData = {
        productId: product.id,
        buyerId: user.id,
        sellerId: product.sellerId,
        price: product.price,
        paymentMethod: "cash",
      }

      if (isConnected) {
        // Online mode - create order directly
        const order = await createOrder(orderData)
        Alert.alert("Success", "Your order has been placed!", [
          { text: "View Order", onPress: () => router.push(`/orders/${order.id}`) },
          { text: "OK", style: "cancel" },
        ])
      } else {
        // Offline mode - queue for later sync
        await queueOrderCreation(orderData)
        Alert.alert("Success", "Your order will be processed when you are back online")
      }
    } catch (error) {
      console.error("Error creating order:", error)
      Alert.alert("Error", "Failed to place order. Please try again.")
    } finally {
      setCreatingOrder(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    addItem(product)
    Alert.alert("Success", "Product added to cart")
  }

  const handleContactSeller = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "You need to sign in to contact sellers", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)/login") },
      ])
      return
    }

    if (!product) return

    if (user.id === product.sellerId) {
      Alert.alert("Error", "This is your own product")
      return
    }

    try {
      // Create or get existing conversation
      const conversation = await createConversation(user.id, product.sellerId, product.id)
      router.push(`/chat/${conversation.id}`)
    } catch (error) {
      console.error("Error starting conversation:", error)
      Alert.alert("Error", "Failed to start conversation. Please try again.")
    }
  }

  const handleWhatsAppContact = () => {
    if (!product || !product.seller) return

    // In a real app, you would use the seller's phone number
    const phoneNumber = "+1234567890" // Placeholder
    const message = `Hi, I'm interested in your product "${product.name}" on Campus Market.`

    Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on your device")
    })
  }

  const handleShare = async () => {
    if (!product) return

    try {
      await Share.share({
        message: `Check out this item on Campus Market: ${product.name} - $${product.price}`,
        // In a real app, you would include a deep link URL
      })
    } catch (error) {
      console.error("Error sharing product:", error)
    }
  }

  const handleReport = () => {
    if (!user) {
      Alert.alert("Sign In Required", "You need to sign in to report items", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)/login") },
      ])
      return
    }

    Alert.alert("Report Item", "Why are you reporting this item?", [
      { text: "Inappropriate Content", onPress: () => reportItem("inappropriate") },
      { text: "Fake or Scam", onPress: () => reportItem("scam") },
      { text: "Prohibited Item", onPress: () => reportItem("prohibited") },
      { text: "Other", onPress: () => reportItem("other") },
      { text: "Cancel", style: "cancel" },
    ])
  }

  const reportItem = (reason: string) => {
    // In a real app, you would send this to your API
    Alert.alert("Thank You", "Your report has been submitted and will be reviewed by our team.")
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? "light"].text }]}>Loading product...</Text>
      </View>
    )
  }

  if (!product) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <MaterialIcons name="error" size={64} color={Colors[colorScheme ?? "light"].textDim} />
        <Text style={[styles.errorText, { color: Colors[colorScheme ?? "light"].text }]}>
          Product not found or has been removed
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {!isConnected && <OfflineBanner />}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image
            source={{ 
              uri: product.images && product.images.length > 0 
                ? product.images[activeImageIndex] 
                : "/placeholder.svg?height=400&width=400" 
            }}
            style={styles.mainImage}
          />

          {product.images && product.images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailsContainer}
            >
              {product.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnailWrapper,
                    activeImageIndex === index && { borderColor: Colors[colorScheme ?? "light"].tint },
                  ]}
                  onPress={() => setActiveImageIndex(index)}
                >
                  <Image source={{ uri: image }} style={styles.thumbnail} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {product.isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>{product.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: Colors[colorScheme ?? "light"].tint }]}>
                ${product.price.toFixed(2)}
              </Text>
              {product.isNegotiable && (
                <Text style={[styles.negotiable, { color: Colors[colorScheme ?? "light"].textDim }]}>(Negotiable)</Text>
              )}
            </View>
          </View>

          <View style={styles.sellerContainer}>
            <View style={styles.sellerInfo}>
              {product.seller?.profilePicture ? (
                <Image source={{ uri: product.seller.profilePicture }} style={styles.sellerImage} />
              ) : (
                <View style={[styles.sellerInitial, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}>
                  <Text style={styles.sellerInitialText}>{product.seller?.firstName?.charAt(0) || "U"}</Text>
                </View>
              )}
              <View>
                <View style={styles.sellerNameContainer}>
                  <Text style={[styles.sellerName, { color: Colors[colorScheme ?? "light"].text }]}>
                    {product.seller?.firstName} {product.seller?.lastName}
                  </Text>
                  {product.seller?.isVerified && (
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.verifiedIcon} />
                  )}
                </View>
                <Text style={[styles.sellerJoined, { color: Colors[colorScheme ?? "light"].textDim }]}>
                  Campus Market Seller
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.viewProfileButton, { borderColor: Colors[colorScheme ?? "light"].border }]}
              onPress={() => router.push(`/profile/${product.sellerId}`)}
            >
              <Text style={[styles.viewProfileText, { color: Colors[colorScheme ?? "light"].text }]}>View Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.detailsContainer, { borderColor: Colors[colorScheme ?? "light"].border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Condition</Text>
              <Text style={[styles.detailValue, { color: Colors[colorScheme ?? "light"].text }]}>
                {product.condition === "new"
                  ? "Brand New"
                  : product.condition === "like_new"
                    ? "Like New"
                    : product.condition === "good"
                      ? "Good"
                      : product.condition === "used"
                        ? "Used"
                        : "Worn"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Category</Text>
              <Text style={[styles.detailValue, { color: Colors[colorScheme ?? "light"].text }]}>
                {product.categoryId?.charAt(0).toUpperCase() + product.categoryId?.slice(1)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Listed</Text>
              <Text style={[styles.detailValue, { color: Colors[colorScheme ?? "light"].text }]}>
                {new Date(product.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionTitle, { color: Colors[colorScheme ?? "light"].text }]}>Description</Text>
            <Text style={[styles.description, { color: Colors[colorScheme ?? "light"].text }]}>
              {product.description}
            </Text>
          </View>

          {product.tags && product.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={[styles.tagsTitle, { color: Colors[colorScheme ?? "light"].text }]}>Tags</Text>
              <View style={styles.tagsList}>
                {product.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
                  >
                    <Text style={[styles.tagText, { color: Colors[colorScheme ?? "light"].text }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <MaterialIcons name="share" size={20} color={Colors[colorScheme ?? "light"].text} />
              <Text style={[styles.actionText, { color: Colors[colorScheme ?? "light"].text }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleReport}>
              <MaterialIcons name="flag" size={20} color={Colors[colorScheme ?? "light"].text} />
              <Text style={[styles.actionText, { color: Colors[colorScheme ?? "light"].text }]}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
        <TouchableOpacity
          style={[styles.contactButton, { borderColor: Colors[colorScheme ?? "light"].border }]}
          onPress={handleContactSeller}
        >
          <Ionicons name="chatbubble-outline" size={20} color={Colors[colorScheme ?? "light"].text} />
          <Text style={[styles.contactButtonText, { color: Colors[colorScheme ?? "light"].text }]}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.whatsappButton, { backgroundColor: "#25D366" }]}
          onPress={handleWhatsAppContact}
        >
          <Ionicons name="logo-whatsapp" size={20} color="white" />
          <Text style={styles.whatsappButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buyButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
          onPress={handleBuyNow}
          disabled={creatingOrder}
        >
          {creatingOrder ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialIcons name="shopping-cart" size={20} color="white" />
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: 400,
    resizeMode: "cover",
  },
  thumbnailsContainer: {
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  urgentBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#F44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  urgentText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
  },
  negotiable: {
    fontSize: 14,
    marginLeft: 8,
  },
  sellerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  sellerInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sellerInitialText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  sellerNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "500",
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  sellerJoined: {
    fontSize: 12,
    marginTop: 2,
  },
  viewProfileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailsContainer: {
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  contactButtonText: {
    marginLeft: 8,
    fontWeight: "500",
  },
  whatsappButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 8,
    marginRight: 8,
  },
  whatsappButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "500",
  },
  buyButton: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 8,
  },
  buyButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
