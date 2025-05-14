"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useColorScheme } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useNetwork } from "@/providers/network-provider"
import { useAuth } from "@/providers/auth-provider"
import { getUserProducts, getUserOrders } from "@/services/api"
import { getLocalUserProducts, getLocalUserOrders } from "@/utils/storage"
import type { Product, Order } from "@/types"
import OfflineBanner from "@/components/offline-banner"
import ProductCard from "@/components/product-card"
import OrderCard from "@/components/order-card"
import { compressImage } from "@/utils/image-utils"
import React from "react"

export default function ProfileScreen() {
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { user, signOut, profile, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<"listings" | "orders">("listings")
  const [userProducts, setUserProducts] = useState<Product[]>([])
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingProfile, setUpdatingProfile] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserData()
    } else {
      setLoading(false)
    }
  }, [user, isConnected, activeTab])

  const loadUserData = async () => {
    if (!user) return

    setLoading(true)
    try {
      if (activeTab === "listings") {
        if (isConnected) {
          // Online mode - fetch from API
          const products = await getUserProducts(user.id)
          setUserProducts(products)
        } else {
          // Offline mode - load from local storage
          const localProducts = await getLocalUserProducts(user.id)
          setUserProducts(localProducts)
        }
      } else {
        if (isConnected) {
          // Online mode - fetch from API
          const orders = await getUserOrders(user.id)
          setUserOrders(orders)
        } else {
          // Offline mode - load from local storage
          const localOrders = await getLocalUserOrders(user.id)
          setUserOrders(localOrders)
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadUserData()
    setRefreshing(false)
  }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          signOut()
          router.replace("/")
        },
      },
    ])
  }

  const pickProfileImage = async () => {
    if (!profile) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUpdatingProfile(true)
      try {
        const compressed = await compressImage(result.assets[0].uri)
        await updateProfile({ ...profile, profilePicture: compressed })
        Alert.alert("Success", "Profile picture updated successfully")
      } catch (error) {
        console.error("Error updating profile picture:", error)
        Alert.alert("Error", "Failed to update profile picture")
      } finally {
        setUpdatingProfile(false)
      }
    }
  }

  const handleVerifyAccount = () => {
    if (!profile) return

    if (profile.isVerified) {
      Alert.alert("Already Verified", "Your account is already verified")
    } else {
      router.push("/profile/verify")
    }
  }

  const renderNotLoggedIn = () => (
    <View style={styles.notLoggedInContainer}>
      <MaterialIcons name="account-circle" size={80} color={Colors[colorScheme ?? "light"].textDim} />
      <Text style={[styles.notLoggedInText, { color: Colors[colorScheme ?? "light"].text }]}>
        You need to be logged in to view your profile
      </Text>
      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.signupButton, { borderColor: Colors[colorScheme ?? "light"].tint }]}
        onPress={() => router.push("/(auth)/signup")}
      >
        <Text style={[styles.signupButtonText, { color: Colors[colorScheme ?? "light"].tint }]}>Create Account</Text>
      </TouchableOpacity>
    </View>
  )

  const renderEmptyListings = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="storefront" size={64} color={Colors[colorScheme ?? "light"].textDim} />
      <Text style={[styles.emptyText, { color: Colors[colorScheme ?? "light"].text }]}>No listings yet</Text>
      <Text style={[styles.emptySubText, { color: Colors[colorScheme ?? "light"].textDim }]}>
        Start selling by creating your first listing
      </Text>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
        onPress={() => router.push("/sell")}
      >
        <Text style={styles.actionButtonText}>Create Listing</Text>
      </TouchableOpacity>
    </View>
  )

  const renderEmptyOrders = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="shopping-bag" size={64} color={Colors[colorScheme ?? "light"].textDim} />
      <Text style={[styles.emptyText, { color: Colors[colorScheme ?? "light"].text }]}>No orders yet</Text>
      <Text style={[styles.emptySubText, { color: Colors[colorScheme ?? "light"].textDim }]}>
        Browse the marketplace to find items to buy
      </Text>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
        onPress={() => router.push("/marketplace")}
      >
        <Text style={styles.actionButtonText}>Browse Marketplace</Text>
      </TouchableOpacity>
    </View>
  )

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        {renderNotLoggedIn()}
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {!isConnected && <OfflineBanner />}
      <ScrollView contentContainerStyle={styles.scrollContent} refreshing={refreshing} onRefresh={onRefresh}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {updatingProfile ? (
              <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
            ) : (
              <>
              <Image
                  source={{ uri: user.profilePicture || "/placeholder.svg?height=100&width=100" }}
                  style={styles.profileImage}
                />
                <TouchableOpacity style={styles.editProfileImageButton} onPress={pickProfileImage}>
                  <MaterialIcons name="edit" size={20} color="white" />
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text style={[styles.userName, { color: Colors[colorScheme ?? "light"].text }]}>
                {profile.firstName} {profile.lastName}
              </Text>
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                </View>
              )}
            </View>
            <Text style={[styles.userEmail, { color: Colors[colorScheme ?? "light"].textDim }]}>{profile.email}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>
                  {userProducts.length}
                </Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Listings</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>
                  {userOrders.length}
                </Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Orders</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>
                  {user.rating || "0.0"}
                </Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Rating</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButtonSmall, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
            onPress={() => router.push("/profile/edit")}
          >
            <MaterialIcons name="edit" size={20} color={Colors[colorScheme ?? "light"].text} />
            <Text style={[styles.actionButtonSmallText, { color: Colors[colorScheme ?? "light"].text }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButtonSmall, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
            onPress={handleVerifyAccount}
          >
            <MaterialIcons
              name={user.isVerified ? "verified-user" : "verified"}
              size={20}
              color={user.isVerified ? "#4CAF50" : Colors[colorScheme ?? "light"].text}
            />
            <Text style={[styles.actionButtonSmallText, { color: Colors[colorScheme ?? "light"].text }]}>
              {user.isVerified ? "Verified" : "Verify Account"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButtonSmall, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color={Colors[colorScheme ?? "light"].text} />
            <Text style={[styles.actionButtonSmallText, { color: Colors[colorScheme ?? "light"].text }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "listings" && [
                styles.activeTabButton,
                { borderBottomColor: Colors[colorScheme ?? "light"].tint },
              ],
            ]}
            onPress={() => setActiveTab("listings")}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: Colors[colorScheme ?? "light"].text },
                activeTab === "listings" && {
                  color: Colors[colorScheme ?? "light"].tint,
                  fontWeight: "bold",
                },
              ]}
            >
              My Listings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "orders" && [
                styles.activeTabButton,
                { borderBottomColor: Colors[colorScheme ?? "light"].tint },
              ],
            ]}
            onPress={() => setActiveTab("orders")}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: Colors[colorScheme ?? "light"].text },
                activeTab === "orders" && {
                  color: Colors[colorScheme ?? "light"].tint,
                  fontWeight: "bold",
                },
              ]}
            >
              My Orders
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
            <Text style={[styles.loadingText, { color: Colors[colorScheme ?? "light"].text }]}>Loading...</Text>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {activeTab === "listings" ? (
              userProducts.length > 0 ? (
                <View style={styles.productsGrid}>
                  {userProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onPress={() => router.push(`/product/${product.id}`)}
                      style={styles.productCard}
                    />
                  ))}
                </View>
              ) : (
                renderEmptyListings()
              )
            ) : userOrders.length > 0 ? (
              <View style={styles.ordersList}>
                {userOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onPress={() => router.push(`/orders/${order.id}`)} />
                ))}
              </View>
            ) : (
              renderEmptyOrders()
            )}
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
    flexGrow: 1,
  },
  profileHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  profileImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editProfileImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  verifiedBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 12,
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#ccc",
    marginHorizontal: 12,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonSmallText: {
    fontSize: 14,
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 16,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: -8,
  },
  productCard: {
    width: "50%",
    padding: 8,
  },
  ordersList: {
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 300,
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
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notLoggedInText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: "80%",
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: "80%",
    alignItems: "center",
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
})
