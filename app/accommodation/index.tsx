"use client"
import { useState } from "react"
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  FlatList,
  RefreshControl,
  Dimensions,
  TextInput,
  Platform
} from "react-native"
import { Text, View } from "@/components/themed"
import { useRouter } from "expo-router"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useQuery } from "@tanstack/react-query"
import { getAccommodations } from "@/services/accommodation"
import { LinearGradient } from "expo-linear-gradient"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import React from "react"
import { formatPrice } from "@/utils/format"

const { width } = Dimensions.get("window")

export default function AccommodationScreen() {
  const colorScheme = useColorScheme()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { 
    data: accommodations, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ["accommodations"],
    queryFn: getAccommodations
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleCreatePress = () => {
    router.push("/accommodation/create/")
  }

  const handleItemPress = (id: string) => {
    router.push(`/accommodation/${id}`)
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[Colors[colorScheme ?? "light"].primary, Colors[colorScheme ?? "light"].accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Campus Housing</Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreatePress}>
              <MaterialIcons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.headerSubtitle}>Find the perfect place to stay near your campus</Text>
          
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search accommodations..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="home" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No accommodations found</Text>
      <Text style={styles.emptyText}>Be the first to list your property for other students!</Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={handleCreatePress}
      >
        <Text style={styles.emptyButtonText}>Create a Listing</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
          </View>
        ) : (
          <>
            {accommodations && accommodations.length > 0 ? (
              <FlatList
                data={accommodations}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.listingCard}
                    onPress={() => handleItemPress(item.id)}
                  >
                    <Image 
                      source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/300x200?text=No+Image' }}
                      style={styles.listingImage}
                    />
                    <View style={styles.listingDetails}>
                      <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.listingLocation} numberOfLines={1}>{item.address}</Text>
                      <View style={styles.listingFeatures}>
                        <View style={styles.featureItem}>
                          <MaterialIcons name="king-bed" size={16} color="#666" />
                          <Text style={styles.featureText}>{item.bedrooms}</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <MaterialIcons name="bathtub" size={16} color="#666" />
                          <Text style={styles.featureText}>{item.bathrooms}</Text>
                        </View>
                      </View>
                      <Text style={styles.listingPrice}>${formatPrice(item.rent)}/month</Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[Colors[colorScheme ?? "light"].tint]}
                  />
                }
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
              />
            ) : (
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[Colors[colorScheme ?? "light"].tint]}
                  />
                }
              >
                {renderHeader()}
                {renderEmpty()}
              </ScrollView>
            )}
          </>
        )}
        
        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerContainer: {
    overflow: "hidden",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  listContainer: {
    paddingBottom: 80,
  },
  listingCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  listingImage: {
    width: 120,
    height: 120,
  },
  listingDetails: {
    flex: 1,
    padding: 12,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  listingFeatures: {
    flexDirection: "row",
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featureText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.tint,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
}) 