"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useColorScheme } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useNetwork } from "@/providers/network-provider"
import { useAuth } from "@/providers/auth-provider"
import { getOrderById, updateOrderStatus } from "@/services/api"
import type { Order } from "@/types"
import OfflineBanner from "@/components/offline-banner"

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams()
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!user) {
      Alert.alert("Sign In Required", "You need to sign in to view orders", [
        { text: "Sign In", onPress: () => router.replace("/(auth)/login") },
      ])
      return
    }

    loadOrder()
  }, [id, user, isConnected])

  const loadOrder = async () => {
    if (!id) return

    setLoading(true)
    try {
      const orderData = await getOrderById(id as string)
      setOrder(orderData)
    } catch (error) {
      console.error("Error loading order:", error)
      Alert.alert("Error", "Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (status: Order["status"]) => {
    if (!order || !isConnected) {
      Alert.alert("Error", "Cannot update order status while offline")
      return
    }

    setUpdating(true)
    try {
      const updatedOrder = await updateOrderStatus(order.id, status)
      setOrder(updatedOrder)
      Alert.alert("Success", `Order status updated to ${status}`)
    } catch (error) {
      console.error("Error updating order status:", error)
      Alert.alert("Error", "Failed to update order status")
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "#FF9800"
      case "confirmed":
        return "#2196F3"
      case "delivered":
        return "#4CAF50"
      case "cancelled":
        return "#F44336"
      default:
        return Colors[colorScheme ?? "light"].textDim
    }
  }

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "confirmed":
        return "Confirmed"
      case "delivered":
        return "Delivered"
      case "cancelled":
        return "Cancelled"
      default:
        return "Unknown"
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? "light"].text }]}>Loading order...</Text>
      </View>
    )
  }

  if (!order) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <MaterialIcons name="error" size={64} color={Colors[colorScheme ?? "light"].textDim} />
        <Text style={[styles.errorText, { color: Colors[colorScheme ?? "light"].text }]}>
          Order not found or has been removed
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

  const isBuyer = user?.id === order.buyerId
  const isSeller = user?.id === order.sellerId

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {!isConnected && <OfflineBanner />}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>Order Details</Text>
          <View style={[styles.orderIdContainer, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <Text style={[styles.orderIdLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Order ID:</Text>
            <Text style={[styles.orderId, { color: Colors[colorScheme ?? "light"].text }]}>{order.id}</Text>
          </View>
        </View>

        <View style={[styles.statusContainer, { backgroundColor: getStatusColor(order.status) }]}>
          <MaterialIcons
            name={
              order.status === "pending"
                ? "pending"
                : order.status === "confirmed"
                  ? "check-circle"
                  : order.status === "delivered"
                    ? "done-all"
                    : "cancel"
            }
            size={24}
            color="white"
          />
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          <Text style={styles.statusDate}>
            {new Date(order.updatedAt).toLocaleDateString()} at {new Date(order.updatedAt).toLocaleTimeString()}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? "light"].text }]}>Product</Text>
          <View style={styles.productContainer}>
            <Image
              source={{ uri: order.product?.images[0] || "/placeholder.svg?height=100&width=100" }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: Colors[colorScheme ?? "light"].text }]}>
                {order.product?.name || "Product"}
              </Text>
              <Text style={[styles.productCondition, { color: Colors[colorScheme ?? "light"].textDim }]}>
                Condition:{" "}
                {order.product?.condition === "new"
                  ? "Brand New"
                  : order.product?.condition === "like_new"
                    ? "Like New"
                    : order.product?.condition === "good"
                      ? "Good"
                      : order.product?.condition === "used"
                        ? "Used"
                        : "Worn"}
              </Text>
              <TouchableOpacity
                style={[styles.viewProductButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
                onPress={() => router.push(`/product/${order.productId}`)}
              >
                <Text style={styles.viewProductButtonText}>View Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? "light"].text }]}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Price</Text>
            <Text style={[styles.summaryValue, { color: Colors[colorScheme ?? "light"].text }]}>
              ${order.price.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Payment Method</Text>
            <Text style={[styles.summaryValue, { color: Colors[colorScheme ?? "light"].text }]}>
              {order.paymentMethod === "cash" ? "Cash on Delivery" : order.paymentMethod}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Order Date</Text>
            <Text style={[styles.summaryValue, { color: Colors[colorScheme ?? "light"].text }]}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {order.deliveryAddress && (
          <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? "light"].text }]}>Delivery Details</Text>
            <View style={styles.deliveryRow}>
              <MaterialIcons name="location-on" size={20} color={Colors[colorScheme ?? "light"].textDim} />
              <Text style={[styles.deliveryAddress, { color: Colors[colorScheme ?? "light"].text }]}>
                {order.deliveryAddress}
              </Text>
            </View>
            {order.deliveryNotes && (
              <View style={styles.deliveryRow}>
                <MaterialIcons name="note" size={20} color={Colors[colorScheme ?? "light"].textDim} />
                <Text style={[styles.deliveryNotes, { color: Colors[colorScheme ?? "light"].text }]}>
                  {order.deliveryNotes}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? "light"].text }]}>Contact</Text>
          {isBuyer && (
            <View style={styles.contactRow}>
              <View style={styles.userInfo}>
                <Text style={[styles.userRole, { color: Colors[colorScheme ?? "light"].textDim }]}>Seller:</Text>
                <Text style={[styles.userName, { color: Colors[colorScheme ?? "light"].text }]}>
                  {order.seller?.firstName} {order.seller?.lastName}
                </Text>
              </View>
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
                  onPress={() => router.push(`/chat/${order.sellerId}`)}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: "#25D366" }]}
                  onPress={() => {
                    // In a real app, you would use the seller's phone number
                    Alert.alert("WhatsApp", "This would open WhatsApp with the seller's contact")
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          {isSeller && (
            <View style={styles.contactRow}>
              <View style={styles.userInfo}>
                <Text style={[styles.userRole, { color: Colors[colorScheme ?? "light"].textDim }]}>Buyer:</Text>
                <Text style={[styles.userName, { color: Colors[colorScheme ?? "light"].text }]}>
                  {order.buyer?.firstName} {order.buyer?.lastName}
                </Text>
              </View>
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
                  onPress={() => router.push(`/chat/${order.buyerId}`)}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: "#25D366" }]}
                  onPress={() => {
                    // In a real app, you would use the buyer's phone number
                    Alert.alert("WhatsApp", "This would open WhatsApp with the buyer's contact")
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {isSeller && order.status === "pending" && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#2196F3" }, updating && styles.disabledButton]}
              onPress={() => handleUpdateStatus("confirmed")}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Confirm Order</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#F44336" }, updating && styles.disabledButton]}
              onPress={() => handleUpdateStatus("cancelled")}
              disabled={updating}
            >
              <MaterialIcons name="cancel" size={20} color="white" />
              <Text style={styles.actionButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {isSeller && order.status === "confirmed" && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#4CAF50" }, updating && styles.disabledButton]}
              onPress={() => handleUpdateStatus("delivered")}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialIcons name="done-all" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isBuyer && order.status === "pending" && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#F44336" }, updating && styles.disabledButton]}
              onPress={() => handleUpdateStatus("cancelled")}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialIcons name="cancel" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Cancel Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
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
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  orderIdLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  statusDate: {
    color: "white",
    fontSize: 12,
    marginLeft: "auto",
  },
  section: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  productContainer: {
    flexDirection: "row",
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  productCondition: {
    fontSize: 14,
    marginBottom: 8,
  },
  viewProductButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  viewProductButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  deliveryAddress: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  deliveryNotes: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontStyle: "italic",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flex: 1,
  },
  userRole: {
    fontSize: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  contactButtons: {
    flexDirection: "row",
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
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
