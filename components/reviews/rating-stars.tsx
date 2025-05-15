import { StyleSheet, View, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"

type RatingStarsProps = {
  rating: number
  size?: number
  color?: string
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

export default function RatingStars({
  rating,
  size = 20,
  color,
  interactive = false,
  onRatingChange,
}: RatingStarsProps) {
  const colorScheme = useColorScheme()
  const starColor = color || Colors[colorScheme ?? "light"].tint

  const handlePress = (selectedRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(selectedRating)
    }
  }

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handlePress(star)}
          disabled={!interactive}
          style={styles.starContainer}
        >
          <MaterialIcons name={star <= Math.round(rating) ? "star" : "star-border"} size={size} color={starColor} />
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  starContainer: {
    marginRight: 2,
  },
})
