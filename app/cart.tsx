"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useColorScheme } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useNetwork } from "@/providers/network-provider"
import { useAuth } from "@/providers/auth-provider"
import { useCart } from "@/providers/cart-provider"
import { createOrder } from "@/services/api"
import { queueOrderCreation } from "@/utils/sync-queue"
import OfflineBanner from "@/components/offline-banner"

export default function CartScreen() {
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { user } = useAuth()
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "You need to sign in to checkout", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)/login") },
      ])
      return
    }

    if (items.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty")
      return
    }

    setCheckingOut(true)
    try {
      // Create an order for each item in the cart
      for (const item of items) {
        const orderData = {
          productId: item.product.id,
          buyerId: user.id,
          sellerId: item.product.sellerId,
          price: item.product.price * item.quantity,
          paymentMethod: "cash",
        }

        if (isConnected) {
          // Online mode - create order directly
          await createOrder(orderData)
        } else {
          // Offline mode - queue for later sync
          await queueOrderCreation(orderData)
        }
      }

      // Clear the cart after successful checkout
      clearCart()

      Alert.alert(
        "Success",
        isConnected
          ? "Your orders have been placed successfully!"
          : "Your orders will be processed when you are back online",
        [{ text: "OK", onPress: () => router.push("/profile") }],
      )
    } catch (error) {
      console.error("Error during checkout:", error)
      Alert.alert("Error", "Failed to complete checkout. Please try again.")
    } finally {
      setCheckingOut(false)
    }
  }

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="shopping-cart" size={64} color={Colors[colorScheme ?? "light"].textDim} />
      <Text style={[styles.emptyText, { color: Colors[colorScheme ?? "light"].text }]}>Your cart is empty</Text>
      <Text style={[styles.emptySubText, { color: Colors[colorScheme ?? "light"].textDim }]}>
        Browse the marketplace to find items to buy
      </Text>
      <TouchableOpacity
        style={[styles.browseButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
        onPress={() => router.push("/marketplace")}
      >
        <Text style={styles.browseButtonText}>Browse Marketplace</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {!isConnected && <OfflineBanner />}

      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>Shopping Cart</Text>
        {items.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Clear Cart", "Are you sure you want to clear your cart?", [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: () => clearCart() },
              ])
            }}
          >
            <Text style={[styles.clearText, { color: Colors[colorScheme ?? "light"].tint }]}>Clear Cart</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {items.map((item) => (
              <View
                key={item.product.id}
                style={[styles.cartItem, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
              >
                <TouchableOpacity onPress={() => router.push(`/product/${item.product.id}`)}>
                  <Image
                    source={{ uri: item.product.images[0] || "/placeholder.svg?height=80&width=80" }}
                    style={styles.productImage}
                  />
                </TouchableOpacity>

                <View style={styles.productInfo}>
                  <TouchableOpacity onPress={() => router.push(`/product/${item.product.id}`)}>
                    <Text style={[styles.productName, { color: Colors[colorScheme ?? "light"].text }]}>
                      {item.product.name}
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.productPrice, { color: Colors[colorScheme ?? "light"].tint }]}>
                    ${item.product.price.toFixed(2)}
                  </Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={[styles.quantityButton, { backgroundColor: Colors[colorScheme ?? "light"].background }]}
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color={Colors[colorScheme ?? "light"].text} />
                    </TouchableOpacity>

                    <Text style={[styles.quantityText, { color: Colors[colorScheme ?? "light"].text }]}>
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      style={[styles.quantityButton, { backgroundColor: Colors[colorScheme ?? "light"].background }]}
                      onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color={Colors[colorScheme ?? "light"].text} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.itemActions}>
                  <Text style={[styles.itemTotal, { color: Colors[colorScheme ?? "light"].text }]}>
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      Alert.alert("Remove Item", "Are you sure you want to remove this item?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Remove", style: "destructive", onPress: () => removeItem(item.product.id) },
                      ])
                    }}
                  >
                    <MaterialIcons name="delete" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.summaryContainer, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: Colors[colorScheme ?? "light"].text }]}>
                ${getTotal().toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Delivery Fee</Text>
              <Text style={[styles.summaryValue, { color: Colors[colorScheme ?? "light"].text }]}>$0.00</Text>
            </View>

            <View style={[styles.totalRow, { borderTopColor: Colors[colorScheme ?? "light"].border }]}>
              <Text style={[styles.totalLabel, { color: Colors[colorScheme ?? "light"].text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: Colors[colorScheme ?? "light"].tint }]}>
                ${getTotal().toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.checkoutButton,
                { backgroundColor: Colors[colorScheme ?? "light"].tint },
                checkingOut && styles.disabledButton,
              ]}
              onPress={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="shopping-cart-checkout" size={20} color="white" />
                  <Text style={styles.checkoutButtonText}>Checkout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  clearText: {
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  cartItem: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 12,
  },
  itemActions: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "bold",
  },
  removeButton: {
    padding: 4,
  },
  summaryContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 16,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  checkoutButton: {
    height: 56,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  browseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  browseButtonText: {
    color: "white",
    fontWeight: "bold",
  },
})
