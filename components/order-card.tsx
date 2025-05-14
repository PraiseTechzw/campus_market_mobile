import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native"
import { useColorScheme } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import type { Order } from "@/types"
import { formatDistanceToNow } from "date-fns"

interface OrderCardProps {
  order: Order
  onPress: () => void
}

export default function OrderCard({ order, onPress }: OrderCardProps) {
  const colorScheme = useColorScheme()

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

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={[styles.orderId, { color: Colors[colorScheme ?? "light"].textDim }]}>Order #{order.id}</Text>
          <Text style={[styles.date, { color: Colors[colorScheme ?? "light"].textDim }]}>
            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.productContainer}>
        <Image
          source={{ uri: order.product?.images[0] || "/placeholder.svg?height=80&width=80" }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: Colors[colorScheme ?? "light"].text }]} numberOfLines={2}>
            {order.product?.name || "Product"}
          </Text>
          <Text style={[styles.price, { color: Colors[colorScheme ?? "light"].tint }]}>${order.price.toFixed(2)}</Text>
          <View style={styles.paymentMethod}>
            <MaterialIcons name="payments" size={16} color={Colors[colorScheme ?? "light"].textDim} />
            <Text style={[styles.paymentMethodText, { color: Colors[colorScheme ?? "light"].textDim }]}>
              {order.paymentMethod === "cash" ? "Cash on Delivery" : order.paymentMethod}
            </Text>
          </View>
        </View>
      </View>

      {order.deliveryAddress && (
        <View style={styles.deliveryContainer}>
          <MaterialIcons name="location-on" size={16} color={Colors[colorScheme ?? "light"].textDim} />
          <Text style={[styles.deliveryText, { color: Colors[colorScheme ?? "light"].textDim }]} numberOfLines={1}>
            {order.deliveryAddress}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <Text style={[styles.userLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>
            {order.buyer?.id === order.sellerId ? "Buyer" : "Seller"}:
          </Text>
          <Text style={[styles.userName, { color: Colors[colorScheme ?? "light"].text }]}>
            {order.buyer?.id === order.sellerId
              ? `${order.buyer?.firstName} ${order.buyer?.lastName}`
              : `${order.seller?.firstName} ${order.seller?.lastName}`}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={Colors[colorScheme ?? "light"].textDim} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "hidden",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  productContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodText: {
    fontSize: 12,
    marginLeft: 4,
  },
  deliveryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  deliveryText: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
  },
})
