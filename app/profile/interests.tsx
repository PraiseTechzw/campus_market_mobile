"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, View as RNView } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

type Interest = {
  id: string
  name: string
  icon: string
  selected: boolean
}

export default function InterestsScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [allInterests, setAllInterests] = useState<Interest[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: userInterests, isLoading } = useQuery({
    queryKey: ["userInterests"],
    queryFn: getUserInterests,
    enabled: !!session,
  })

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  })

  useEffect(() => {
    if (categories && userInterests) {
      const mergedInterests = categories.map(category => ({
        ...category,
        selected: userInterests.some(interest => interest.category_id === category.id)
      }))
      setAllInterests(mergedInterests)
    }
  }, [categories, userInterests])

  const updateInterestsMutation = useMutation({
    mutationFn: updateUserInterests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userInterests"] })
    },
  })

  async function getUserInterests() {
    try {
      if (!session) return []
      
      const { data, error } = await supabase
        .from("user_interests")
        .select("id, category_id")
        .eq("user_id", session.user.id)
      
      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching user interests:", error)
      return []
    }
  }

  async function getCategories() {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name")
      
      if (error) throw error
      return data as Interest[]
    } catch (error) {
      console.error("Error fetching categories:", error)
      return []
    }
  }

  async function updateUserInterests(selectedInterests: Interest[]) {
    try {
      if (!session) return false
      
      // First, delete all existing user interests
      const { error: deleteError } = await supabase
        .from("user_interests")
        .delete()
        .eq("user_id", session.user.id)
      
      if (deleteError) throw deleteError
      
      // Then insert the new selections
      const selectedIds = selectedInterests
        .filter(interest => interest.selected)
        .map(interest => ({
          user_id: session.user.id,
          category_id: interest.id
        }))
      
      if (selectedIds.length > 0) {
        const { error: insertError } = await supabase
          .from("user_interests")
          .insert(selectedIds)
        
        if (insertError) throw insertError
      }
      
      return true
    } catch (error) {
      console.error("Error updating user interests:", error)
      return false
    }
  }

  const toggleInterest = (id: string) => {
    setAllInterests(prevInterests => 
      prevInterests.map(interest => 
        interest.id === id 
          ? { ...interest, selected: !interest.selected } 
          : interest
      )
    )
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await updateInterestsMutation.mutateAsync(allInterests)
      router.back()
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderInterestItem = (interest: Interest) => (
    <TouchableOpacity 
      key={interest.id}
      style={[
        styles.interestItem, 
        interest.selected && styles.selectedInterest
      ]} 
      onPress={() => toggleInterest(interest.id)}
    >
      <Ionicons 
        name={(interest.icon as any) || "pricetag"} 
        size={20} 
        color={interest.selected ? "#fff" : Colors[colorScheme ?? "light"].text} 
      />
      <Text 
        style={[
          styles.interestText, 
          interest.selected && styles.selectedInterestText
        ]}
      >
        {interest.name}
      </Text>
      <RNView style={styles.checkmarkContainer}>
        {interest.selected && (
          <Ionicons name="checkmark" size={18} color="#fff" />
        )}
      </RNView>
    </TouchableOpacity>
  )

  if (isLoading || isCategoriesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "My Interests",
          headerShown: true,
          headerShadowVisible: false,
          headerTitleStyle: styles.headerTitle,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={22} color="#0891b2" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Select categories you're interested in to improve your recommendations and notifications
          </Text>
        </View>

        <View style={styles.interestsContainer}>
          {allInterests.map(renderInterestItem)}
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Interests</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    marginLeft: 16,
  },
  infoCard: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    color: "#075985",
    lineHeight: 20,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  interestItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedInterest: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  interestText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  selectedInterestText: {
    color: "#fff",
  },
  checkmarkContainer: {
    marginLeft: 8,
    width: 18,
  },
  footer: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
})
