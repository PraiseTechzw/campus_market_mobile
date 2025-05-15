"use client"

import { StyleSheet, TouchableOpacity, Image, View as RNView } from "react-native"
import { Text } from "@/components/themed"
import type { ActivityFeedItem } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "expo-router"
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/use-color-scheme"

type ActivityFeedItemProps = {
  item: ActivityFeedItem
}

export default function ActivityFeedItemCard({ item }: ActivityFeedItemProps) {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const tintColor = Colors[colorScheme ?? "light"].tint

  const handlePress = () => {
    if (item.listing_id) {
      router.push({
        pathname: "/marketplace/[id]",
        params: { id: item.listing_id },
      })
    } else if (item.accommodation_id) {
      router.push({
        pathname: "/accommodation/[id]",
        params: { id: item.accommodation_id },
      })
    }
  }

  const getIcon = () => {
    switch (item.activity_type) {
      case "new_listing":
        return <FontAwesome5 name="shopping-bag" size={24} color={tintColor} />
      case "price_drop":
        return <MaterialIcons name="trending-down" size={24} color="#10b981" />
      case "new_accommodation":
        return <FontAwesome5 name="building" size={24} color={tintColor} />
      case "rent_drop":
        return <MaterialIcons name="trending-down" size={24} color="#10b981" />
      case "event":
        return <MaterialIcons name="event" size={24} color="#f59e0b" />
      case "announcement":
        return <MaterialIcons name="campaign" size={24} color="#ef4444" />
      default:
        return <MaterialIcons name="notifications" size={24} color={tintColor} />
    }
  }

  const getImage = () => {
    if (item.listing && item.listing.images && item.listing.images.length > 0) {
      return item.listing.images[0]
    } else if (item.accommodation && item.accommodation.images && item.accommodation.images.length > 0) {
      return item.accommodation.images[0]
    }
    return "/placeholder.svg?height=60&width=60"
  }

  const isClickable = !!item.listing_id || !!item.accommodation_id

  const CardComponent = isClickable ? TouchableOpacity : RNView

  return (
    <CardComponent
      style={styles.container}
      onPress={isClickable ? handlePress : undefined}
      activeOpacity={isClickable ? 0.7 : 1}
    >
      <RNView style={styles.iconContainer}>{getIcon()}</RNView>

      <RNView style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        {item.description && <Text style={styles.description}>{item.description}</Text>}
        <Text style={styles.time}>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</Text>
      </RNView>

      {isClickable && <Image source={{ uri: getImage() }} style={styles.image} />}
    </CardComponent>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginLeft: 12,
  },
})
