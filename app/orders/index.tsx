"use client"

import { useState, useEffect } from "react"
import { StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useToast } from "@/providers/toast-provider"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { getOrders } from "@/services/orders"
import type { Order } from "@/types"
import Colors from "@/constants/Colors"
import { formatDistanceToNow } from "date-fns"

export default function OrdersScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const toast = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (session) {
      loadOrders()
    }
  }, [session])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await getOrders(session!.user.id)
      setOrders(data)
    } catch (error) {
      console.error("Error loading orders:", error)
      toast.show({
        type: "error",
        title: "Error",
        message: "Failed to load orders. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "#10b981"
      case "processing":
        return "#f59e0b"
      case "cancelled":
        return "#ef4444"
      case "refunded":
        return "#6366f1"
      default:
        return "#9ca3af"
    }
  }

  const getPaymentStatusColor = (status: Order["payment_status"]) => {
    switch (status) {
      case "paid":
        return "#10b981"
      case "failed":
        return "#ef4444"
      case "refunded":
        return "#6366f1"
      default:
        return "#9ca3af"
    }
  }

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isListing = !!item.listing
    const title = isListing ? item.listing?.title : item.accommodation?.title
    const image = isListing ? item.listing?.images[0] : item.accommodation?.images[0]

    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => router.push(`/orders/${item.id}`)}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>Order #{item.id}</Text>
            <Text style={styles.orderDate}>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          {image && (
            <View style={styles.imageContainer}>
              <MaterialIcons
                name={isListing ? "shopping-bag" : "apartment"}
                size={24}
                color="#fff"
                style={styles.itemTypeIcon}
              />
              <img src={image || "/placeholder.svg"} style={styles.itemImage} />
            </View>
          )}
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.itemType}>{isListing ? "Marketplace Item" : "Accommodation"}</Text>
            <Text style={styles.itemPrice}>${item.amount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(item.payment_status) }]}>
            <Text style={styles.paymentText}>
              {item.payment_status.charAt(0).toUpperCase() + item.payment_status.slice(1)}
            </Text>
          </View>
          <View style={styles.viewDetails}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors[colorScheme ?? "light"].tint} />
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.backButton} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={64} color="#ccc" />
          <Text style={styles.emptyText}>You don't have any orders yet</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push("/(tabs)/marketplace")}>
            <Text style={styles.browseButtonText}>Browse Marketplace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    fontSize: 20,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  browseButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  orderContent: {
    flexDirection: "row",
    padding: 16,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  itemTypeIcon: {
    position: "absolute",
    top: 4,
    left: 4,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    resizeMode: "cover",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.tint,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paymentText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  viewDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: "bold",
    marginRight: 4,
  },
})
