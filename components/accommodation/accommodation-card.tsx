"use client"
import { StyleSheet, TouchableOpacity, Image, type ViewStyle } from "react-native"
import { Text, View } from "@/components/themed"
import type { Accommodation } from "@/types"
import { useRouter } from "expo-router"
import { formatDistanceToNow } from "date-fns"
import { Bed, Bath, MapPin } from "lucide-react"

type AccommodationCardProps = {
  accommodation: Accommodation
  style?: ViewStyle
}

export default function AccommodationCard({ accommodation, style }: AccommodationCardProps) {
  const router = useRouter()

  const handlePress = () => {
    router.push({
      pathname: "/accommodation/[id]",
      params: { id: accommodation.id },
    })
  }

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={handlePress} activeOpacity={0.7}>
      <Image
        source={{ uri: accommodation.images[0] || "/placeholder.svg?height=200&width=200" }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.price}>${accommodation.rent.toFixed(2)}/month</Text>
        <Text style={styles.title} numberOfLines={1}>
          {accommodation.title}
        </Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Bed size={16} color="#666" />
            <Text style={styles.detailText}>
              {accommodation.bedrooms} {accommodation.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Bath size={16} color="#666" />
            <Text style={styles.detailText}>
              {accommodation.bathrooms} {accommodation.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
            </Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={16} color="#666" />
          <Text style={styles.location} numberOfLines={1}>
            {accommodation.address}
          </Text>
        </View>

        <Text style={styles.time}>{formatDistanceToNow(new Date(accommodation.created_at), { addSuffix: true })}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  content: {
    padding: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#0891b2",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
})
