"use client"

import { useState } from "react"
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator } from "react-native"
import { Text } from "@/components/themed"
import RatingStars from "./rating-stars"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"

type ReviewFormProps = {
  onSubmit: (rating: number, comment: string) => Promise<void>
  isSubmitting: boolean
}

export default function ReviewForm({ onSubmit, isSubmitting }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const colorScheme = useColorScheme()

  const handleSubmit = async () => {
    if (rating === 0) return
    await onSubmit(rating, comment)
    setRating(0)
    setComment("")
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Write a Review</Text>

      <View style={styles.ratingContainer}>
        <Text style={styles.label}>Rating</Text>
        <RatingStars rating={rating} size={30} interactive onRatingChange={setRating} />
      </View>

      <View style={styles.commentContainer}>
        <Text style={styles.label}>Comment (Optional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: Colors[colorScheme ?? "light"].tint },
          rating === 0 && styles.disabledButton,
        ]}
        onPress={handleSubmit}
        disabled={rating === 0 || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  ratingContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  commentContainer: {
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
})
