"use client"
import { StyleSheet, TouchableOpacity, Image, type ViewStyle } from "react-native"
import { Text, View } from "@/components/themed"
import type { Listing } from "@/types"
import { useRouter } from "expo-router"
import { formatDistanceToNow } from "date-fns"

type ListingCardProps = {
  listing: Listing
  style?: ViewStyle
}

export default function ListingCard({ listing, style }: ListingCardProps) {
  const router = useRouter()

  const handlePress = () => {
    router.push({
      pathname: "/marketplace/[id]",
      params: { id: listing.id },
    })
  }

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={handlePress} activeOpacity={0.7}>
      <Image source={{ uri: listing.images[0] || "/placeholder.svg?height=200&width=200" }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {listing.location}
        </Text>
        <Text style={styles.time}>{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</Text>
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
    height: 150,
    resizeMode: "cover",
  },
  content: {
    padding: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
})
