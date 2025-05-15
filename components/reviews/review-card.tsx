import { StyleSheet, View, Image } from "react-native"
import { Text } from "@/components/themed"
import type { Review } from "@/types"
import RatingStars from "./rating-stars"
import { formatDistanceToNow } from "date-fns"

type ReviewCardProps = {
  review: Review & { reviewer?: any }
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: review.reviewer?.avatar_url || "/placeholder.svg?height=40&width=40" }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>
            {review.reviewer?.first_name} {review.reviewer?.last_name}
          </Text>
          <Text style={styles.date}>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</Text>
        </View>
      </View>

      <View style={styles.ratingContainer}>
        <RatingStars rating={review.rating} size={16} />
      </View>

      {review.comment && <Text style={styles.comment}>{review.comment}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontWeight: "bold",
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: "#666",
  },
  ratingContainer: {
    marginBottom: 8,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
  },
})
