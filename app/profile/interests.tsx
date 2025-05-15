"use client"
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserInterests, addUserInterest, removeUserInterest } from "@/services/interests"
import { getListingCategories } from "@/services/marketplace"
import { getAccommodationTypes } from "@/services/accommodation"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { useRouter } from "expo-router"
import { ArrowLeft, Check } from "lucide-react"

export default function InterestsScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: userInterests, isLoading: interestsLoading } = useQuery({
    queryKey: ["userInterests"],
    queryFn: () => (session ? getUserInterests(session.user.id) : Promise.resolve([])),
    enabled: !!session,
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["listingCategories"],
    queryFn: getListingCategories,
  })

  const { data: accommodationTypes, isLoading: typesLoading } = useQuery({
    queryKey: ["accommodationTypes"],
    queryFn: getAccommodationTypes,
  })

  const addInterestMutation = useMutation({
    mutationFn: addUserInterest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userInterests"] })
    },
  })

  const removeInterestMutation = useMutation({
    mutationFn: removeUserInterest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userInterests"] })
    },
  })

  const isInterested = (id: string | number, type: "category" | "accommodationType") => {
    if (!userInterests) return false

    return userInterests.some((interest) => {
      if (type === "category") {
        return interest.category_id === id
      } else {
        return interest.accommodation_type_id === id
      }
    })
  }

  const getInterestId = (id: string | number, type: "category" | "accommodationType") => {
    if (!userInterests) return null

    const interest = userInterests.find((interest) => {
      if (type === "category") {
        return interest.category_id === id
      } else {
        return interest.accommodation_type_id === id
      }
    })

    return interest ? interest.id : null
  }

  const toggleInterest = (id: string | number, type: "category" | "accommodationType") => {
    if (!session) return

    const interested = isInterested(id, type)

    if (interested) {
      const interestId = getInterestId(id, type)
      if (interestId) {
        removeInterestMutation.mutate(interestId)
      }
    } else {
      const interest = {
        user_id: session.user.id,
        ...(type === "category" ? { category_id: id } : { accommodation_type_id: id }),
      }
      addInterestMutation.mutate(interest)
    }
  }

  const isLoading = interestsLoading || categoriesLoading || typesLoading

  if (!session) return null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Interests</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.description}>
            Select your interests to get personalized recommendations and notifications.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Marketplace Categories</Text>
            <View style={styles.interestsGrid}>
              {categories?.map((category) => {
                const interested = isInterested(category.id, "category")
                return (
                  <TouchableOpacity
                    key={category.id.toString()}
                    style={[styles.interestItem, interested && styles.selectedInterestItem]}
                    onPress={() => toggleInterest(category.id, "category")}
                  >
                    <Text style={[styles.interestText, interested && styles.selectedInterestText]}>
                      {category.name}
                    </Text>
                    {interested && <Check size={16} color="#fff" style={styles.checkIcon} />}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accommodation Types</Text>
            <View style={styles.interestsGrid}>
              {accommodationTypes?.map((type) => {
                const interested = isInterested(type.id, "accommodationType")
                return (
                  <TouchableOpacity
                    key={type.id.toString()}
                    style={[styles.interestItem, interested && styles.selectedInterestItem]}
                    onPress={() => toggleInterest(type.id, "accommodationType")}
                  >
                    <Text style={[styles.interestText, interested && styles.selectedInterestText]}>{type.name}</Text>
                    {interested && <Check size={16} color="#fff" style={styles.checkIcon} />}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    marginBottom: 12,
  },
  selectedInterestItem: {
    backgroundColor: "#0891b2",
  },
  interestText: {
    fontSize: 14,
    color: "#333",
  },
  selectedInterestText: {
    color: "#fff",
  },
  checkIcon: {
    marginLeft: 6,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})
