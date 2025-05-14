"use client"
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useColorScheme } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useAuth } from "@/providers/auth-provider"
import { useNetwork } from "@/providers/network-provider"
import OfflineBanner from "@/components/offline-banner"

export default function AdminScreen() {
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { profile } = useAuth()

  const isAdmin = profile?.role === "admin"

  if (!profile || !isAdmin) {
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {!isConnected && <OfflineBanner />}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>Admin Dashboard</Text>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "#4CAF50" }]}>
              <MaterialIcons name="people" size={24} color="white" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>128</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Active Users</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "#2196F3" }]}>
              <MaterialIcons name="shopping-bag" size={24} color="white" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>43</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Today's Orders</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "#FF9800" }]}>
              <MaterialIcons name="storefront" size={24} color="white" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>256</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Active Listings</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "#F44336" }]}>
              <MaterialIcons name="flag" size={24} color="white" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? "light"].text }]}>12</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Reported Items</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? "light"].text }]}>Quick Actions</Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
            onPress={() => router.push("/admin/dashboard")}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: "#673AB7" }]}>
              <MaterialIcons name="dashboard" size={24} color="white" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? "light"].text }]}>Dashboard</Text>
              <Text style={[styles.menuDescription, { color: Colors[colorScheme ?? "light"].textDim }]}>
                View detailed analytics
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors[colorScheme ?? "light"].textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
            onPress={() => router.push("/admin/users")}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: "#4CAF50" }]}>
              <MaterialIcons name="people" size={24} color="white" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? "light"].text }]}>Manage Users</Text>
              <Text style={[styles.menuDescription, { color: Colors[colorScheme ?? "light"].textDim }]}>
                View and manage user accounts
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors[colorScheme ?? "light"].textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
            onPress={() => router.push("/admin/products")}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: "#FF9800" }]}>
              <MaterialIcons name="storefront" size={24} color="white" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? "light"].text }]}>Manage Products</Text>
              <Text style={[styles.menuDescription, { color: Colors[colorScheme ?? "light"].textDim }]}>
                Review and moderate listings
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors[colorScheme ?? "light"].textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
            onPress={() => router.push("/admin/verifications")}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: "#2196F3" }]}>
              <MaterialIcons name="verified-user" size={24} color="white" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? "light"].text }]}>Verifications</Text>
              <Text style={[styles.menuDescription, { color: Colors[colorScheme ?? "light"].textDim }]}>
                Approve student verifications
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors[colorScheme ?? "light"].textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
            onPress={() => router.push("/admin/reports")}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: "#F44336" }]}>
              <MaterialIcons name="flag" size={24} color="white" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? "light"].text }]}>Reports</Text>
              <Text style={[styles.menuDescription, { color: Colors[colorScheme ?? "light"].textDim }]}>
                Handle reported content
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors[colorScheme ?? "light"].textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
            onPress={() => router.push("/admin/analytics")}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: "#9C27B0" }]}>
              <MaterialIcons name="insights" size={24} color="white" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? "light"].text }]}>Analytics</Text>
              <Text style={[styles.menuDescription, { color: Colors[colorScheme ?? "light"].textDim }]}>
                View detailed platform statistics
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors[colorScheme ?? "light"].textDim} />
          </TouchableOpacity>
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
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    marginBottom: 24,
  },
  statCard: {
    width: "50%",
    padding: 8,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    margin: 8,
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuDescription: {
    fontSize: 14,
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
})
