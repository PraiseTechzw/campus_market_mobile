"use client"

import { useState } from "react"
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from "react-native"
import { Text } from "@/components/themed"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getReviewsForUser, getReviewsForListing, getReviewsForAccommodation, createReview } from "@/services/reviews"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import ReviewCard from "./review-card"
import ReviewForm from "./review-form"
import RatingStars from "./rating-stars"
import { Alert } from "react-native"
import React from "react"
import {Ionicons} from ""
type ReviewsSectionProps = {
  userId?: string
  listingId?: string | number
  accommodationId?: string | number
  revieweeId?: string
}

export default function ReviewsSection({ userId, listingId, accommodationId, revieweeId }: ReviewsSectionProps) {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const queryFn = () => {
    if (userId) {
      return getReviewsForUser(userId)
    } else if (listingId) {
      return getReviewsForListing(listingId)
    } else if (accommodationId) {
      return getReviewsForAccommodation(accommodationId)
    }
    return Promise.resolve([])
  }

  const queryKey = userId
    ? ["userReviews", userId]
    : listingId
      ? ["listingReviews", listingId]
      : ["accommodationReviews", accommodationId]

  const { data: reviews, isLoading } = useQuery({
    queryKey,
    queryFn,
  })

  const createReviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowForm(false)
      Alert.alert("Success", "Your review has been submitted.")
    },
    onError: (error) => {
      console.error("Error creating review:", error)
      Alert.alert("Error", "Failed to submit review. Please try again.")
    },
  })

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!session || !revieweeId) return

    const review = {
      reviewer_id: session.user.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment || null,
      ...(listingId ? { listing_id: listingId } : {}),
      ...(accommodationId ? { accommodation_id: accommodationId } : {}),
    }

    createReviewMutation.mutate(review)
  }

  const canReview = session && revieweeId && session.user.id !== revieweeId

  const averageRating =
    reviews && reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  const displayedReviews = showAllReviews ? reviews : reviews?.slice(0, 3)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reviews</Text>
        {reviews && reviews.length > 0 && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
            <RatingStars rating={averageRating} size={16} />
            <Text style={styles.reviewCount}>({reviews.length})</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
      ) : reviews && reviews.length > 0 ? (
        <>
          {displayedReviews?.map((review) => (
            <ReviewCard key={review.id.toString()} review={review} />
          ))}

          {reviews.length > 3 && (
            <TouchableOpacity style={styles.showMoreButton} onPress={() => setShowAllReviews(!showAllReviews)}>
              <Text style={styles.showMoreText}>{showAllReviews ? "Show Less" : `Show All (${reviews.length})`}</Text>
              {showAllReviews ? (
                <ChevronUp size={16} color={Colors[colorScheme ?? "light"].tint} />
              ) : (
                <ChevronDown size={16} color={Colors[colorScheme ?? "light"].tint} />
              )}
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text style={styles.noReviewsText}>No reviews yet.</Text>
      )}

      {canReview && !showForm && (
        <TouchableOpacity
          style={[styles.writeReviewButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.writeReviewButtonText}>Write a Review</Text>
        </TouchableOpacity>
      )}

      {canReview && showForm && (
        <ReviewForm onSubmit={handleSubmitReview} isSubmitting={createReviewMutation.isPending} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  loader: {
    marginVertical: 20,
  },
  noReviewsText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 16,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: "#0891b2",
    marginRight: 4,
  },
  writeReviewButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  writeReviewButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
})
