"use client"
import { StyleSheet, TouchableOpacity, Image, type ViewStyle, Dimensions } from "react-native"
import { Text, View } from "@/components/themed"
import type { Accommodation } from "@/types"
import { useRouter } from "expo-router"
import { formatDistanceToNow } from "date-fns"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")

type AccommodationCardProps = {
  accommodation: Accommodation
  style?: ViewStyle
}

export default function AccommodationCard({ accommodation, style }: AccommodationCardProps) {
  const router = useRouter()
  const colorScheme = useColorScheme()

  const handlePress = () => {
    router.push({
      pathname: "/accommodation/[id]",
      params: { id: accommodation.id },
    })
  }

  // Format address to show only city or area
  const shortAddress = accommodation.address?.split(',').slice(-2)[0]?.trim() || accommodation.address

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handlePress} 
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: accommodation.images?.[0] || "https://via.placeholder.com/400x300?text=No+Image" }}
          style={styles.image}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />
        <View style={styles.priceTag}>
          <Text style={styles.price}>${accommodation.rent.toFixed(0)}</Text>
          <Text style={styles.pricePeriod}>/month</Text>
        </View>
        <View style={styles.timeContainer}>
          <MaterialIcons name="access-time" size={12} color="#fff" />
          <Text style={styles.time}>{formatDistanceToNow(new Date(accommodation.created_at), { addSuffix: true })}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{accommodation.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors[colorScheme ?? "light"].text} />
          <Text style={styles.location} numberOfLines={1}>{shortAddress}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="bed-outline" size={16} color={Colors[colorScheme ?? "light"].text} />
            <Text style={styles.detailText}>
              {accommodation.bedrooms}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={16} color={Colors[colorScheme ?? "light"].text} />
            <Text style={styles.detailText}>
              {accommodation.bathrooms}
            </Text>
          </View>

          <View style={styles.detailBadge}>
            <Text style={styles.detailBadgeText}>
              {accommodation.type?.name || "Room"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    margin: 4,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    width: "100%",
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(8, 145, 178, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pricePeriod: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginLeft: 2,
  },
  timeContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  time: {
    fontSize: 11,
    color: '#fff',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  location: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  detailBadge: {
    marginLeft: 'auto',
    backgroundColor: "#f0f7ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detailBadgeText: {
    fontSize: 11,
    color: "#3b82f6",
    fontWeight: "500",
  },
})
