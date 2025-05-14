"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useColorScheme } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useAuth } from "@/providers/auth-provider"
import { useNetwork } from "@/providers/network-provider"
import OfflineBanner from "@/components/offline-banner"

export default function AdminDashboardScreen() {
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 128,
    activeUsers: 87,
    totalProducts: 256,
    activeListings: 198,
    totalOrders: 43,
    pendingOrders: 12,
    totalReports: 8,
    pendingVerifications: 5,
  })

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const isAdmin = user?.role === "admin"

  if (!user || !isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <View style={styles.unauthorizedContainer}>
          <MaterialIcons name="admin-panel-settings" size={80} color={Colors[colorScheme ?? "light"].textDim} />
          <Text style={[styles.unauthorizedText, { color: Colors[colorScheme ?? "light"].text }]}>
            Admin Access Required
          </Text>
          <Text style={[styles.unauthorizedSubText, { color: Colors[colorScheme ?? "light"].textDim }]}>
            You don't have permission to access this area
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? "light"].text }]}>
          Loading dashboard data...
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {!isConnected && <OfflineBanner />}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>Admin Dashboard</Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "#4CAF50" }]}>
              <MaterialIcons name="people" size={24} color="white" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>{stats.totalUsers}</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Total Users</Text>
            <Text style={[styles.statSubValue, { color: Colors[colorScheme ?? "light"].tint }]}>
              {stats.activeUsers} active
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "#FF9800" }]}>
              <MaterialIcons name="storefront" size={24} color="white" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>
              {stats.totalProducts}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Total Products</Text>
            <Text style={[styles.statSubValue, { color: Colors[colorScheme ?? "light"].tint }]}>
              {stats.activeListings} active
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "#2196F3" }]}>
              <MaterialIcons name="shopping-bag" size={24} color="white" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>{stats.totalOrders}</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Total Orders</Text>
            <Text style={[styles.statSubValue, { color: Colors[colorScheme ?? "light"].tint }]}>
              {stats.pendingOrders} pending
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "#F44336" }]}>
              <MaterialIcons name="flag" size={24} color="white" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>{stats.totalReports}</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Reports</Text>
            <TouchableOpacity onPress={() => router.push("/admin/reports")}>
              <Text style={[styles.statSubValue, { color: Colors[colorScheme ?? "light"].tint }]}>View all</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? "light"].text }]}>
              Pending Verifications
            </Text>
            <TouchableOpacity onPress={() => router.push("/admin/verifications")}>
              <Text style={[styles.seeAllText, { color: Colors[colorScheme ?? "light"].tint }]}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.alertCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <MaterialIcons name="verified-user" size={24} color="#2196F3" />
            <Text style={[styles.alertText, { color: Colors[colorScheme ?? "light"].text }]}>
              {stats.pendingVerifications} users waiting for verification
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
              onPress={() => router.push("/admin/verifications")}
            >
              <Text style={styles.actionButtonText}>Review</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? "light"].text }]}>Quick Actions</Text>
          </View>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
              onPress={() => router.push("/admin/users")}
            >
              <MaterialIcons name="people" size={32} color={Colors[colorScheme ?? "light"].tint} />
              <Text style={[styles.actionCardText, { color: Colors[colorScheme ?? "light"].text }]}>Manage Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
              onPress={() => router.push("/admin/products")}
            >
              <MaterialIcons name="storefront" size={32} color={Colors[colorScheme ?? "light"].tint} />
              <Text style={[styles.actionCardText, { color: Colors[colorScheme ?? "light"].text }]}>
                Manage Products
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
              onPress={() => router.push("/admin/reports")}
            >
              <MaterialIcons name="flag" size={32} color={Colors[colorScheme ?? "light"].tint} />
              <Text style={[styles.actionCardText, { color: Colors[colorScheme ?? "light"].text }]}>View Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
              onPress={() => router.push("/admin/analytics")}
            >
              <MaterialIcons name="insights" size={32} color={Colors[colorScheme ?? "light"].tint} />
              <Text style={[styles.actionCardText, { color: Colors[colorScheme ?? "light"].text }]}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
  },
  statSubValue: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAllText: {
    fontSize: 14,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  unauthorizedText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  unauthorizedSubText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
})
