"use client"

import { useState } from "react"
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Dimensions,
  Animated,
} from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getEventById, joinEvent, leaveEvent, updateEventStatus } from "@/services/events"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams, Stack } from "expo-router"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { LinearGradient } from "expo-linear-gradient"
import { useToast } from "@/providers/toast-provider"

const { width } = Dimensions.get("window")

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<"going" | "maybe" | "not_going" | null>(null)
  const fadeAnim = useState(new Animated.Value(0))[0]

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id as string),
    onSuccess: (data) => {
      // Check if user is already participating
      const userParticipation = data.event_participants?.find((p) => p.user_id === session?.user.id)
      if (userParticipation) {
        setSelectedStatus(userParticipation.status as "going" | "maybe" | "not_going")
      }

      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    },
  })

  const joinMutation = useMutation({
    mutationFn: () => joinEvent(id as string, session?.user.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] })
      toast.show({
        type: "success",
        title: "Success",
        message: "You're going to this event!",
      })
    },
    onError: (error) => {
      console.error("Error joining event:", error)
      toast.show({
        type: "error",
        title: "Error",
        message: "Failed to join event",
      })
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => leaveEvent(id as string, session?.user.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] })
      setSelectedStatus(null)
      toast.show({
        type: "success",
        title: "Success",
        message: "You've left this event",
      })
    },
    onError: (error) => {
      console.error("Error leaving event:", error)
      toast.show({
        type: "error",
        title: "Error",
        message: "Failed to leave event",
      })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: "going" | "maybe" | "not_going") =>
      updateEventStatus(id as string, session?.user.id as string, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] })
      toast.show({
        type: "success",
        title: "Success",
        message: "Your status has been updated",
      })
    },
    onError: (error) => {
      console.error("Error updating status:", error)
      toast.show({
        type: "error",
        title: "Error",
        message: "Failed to update status",
      })
    },
  })

  const handleJoin = () => {
    if (!session) {
      router.push("/login")
      return
    }

    joinMutation.mutate()
    setSelectedStatus("going")
  }

  const handleLeave = () => {
    leaveMutation.mutate()
  }

  const handleStatusChange = (status: "going" | "maybe" | "not_going") => {
    if (selectedStatus === status) return

    if (!selectedStatus) {
      joinMutation.mutate()
      setSelectedStatus(status)
    } else {
      updateStatusMutation.mutate(status)
      setSelectedStatus(status)
    }
  }

  const handleShare = async () => {
    if (!event) return

    try {
      await Share.share({
        message: `Check out this event: ${event.title} on ${new Date(event.start_date).toLocaleDateString()}`,
        url: `https://uniconnect.app/events/${id}`,
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaWrapper edges={["top", "left", "right"]}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].primary} />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </SafeAreaWrapper>
    )
  }

  if (error || !event) {
    return (
      <SafeAreaWrapper edges={["top", "left", "right"]}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#f43f5e" />
          <Text style={styles.errorTitle}>Error Loading Event</Text>
          <Text style={styles.errorText}>We couldn't load the event details. Please try again later.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    )
  }

  const startDate = new Date(event.start_date)
  const endDate = event.end_date ? new Date(event.end_date) : null
  const isUpcoming = startDate > new Date()

  const goingCount = event.event_participants?.filter((p) => p.status === "going").length || 0
  const maybeCount = event.event_participants?.filter((p) => p.status === "maybe").length || 0

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: event.image_url || "https://via.placeholder.com/800x400" }}
              style={styles.eventImage}
              resizeMode="cover"
            />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.imageGradient} />
            <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareIconButton} onPress={handleShare}>
              <MaterialIcons name="share" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateDay}>{startDate.getDate()}</Text>
                <Text style={styles.dateMonth}>{startDate.toLocaleDateString("en-US", { month: "short" })}</Text>
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{event.title}</Text>
                <View style={styles.organizerContainer}>
                  <Text style={styles.organizerLabel}>Organized by </Text>
                  <Text style={styles.organizerName}>
                    {event.profiles?.first_name} {event.profiles?.last_name}
                  </Text>
                </View>
              </View>
            </View>

            {isUpcoming && (
              <View style={styles.actionContainer}>
                {!selectedStatus ? (
                  <TouchableOpacity style={styles.joinButton} onPress={handleJoin} activeOpacity={0.8}>
                    <Text style={styles.joinButtonText}>Join Event</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.statusContainer}>
                    <TouchableOpacity
                      style={[styles.statusButton, selectedStatus === "going" && styles.statusButtonActive]}
                      onPress={() => handleStatusChange("going")}
                    >
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color={selectedStatus === "going" ? "#fff" : "#666"}
                      />
                      <Text
                        style={[styles.statusButtonText, selectedStatus === "going" && styles.statusButtonTextActive]}
                      >
                        Going
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusButton, selectedStatus === "maybe" && styles.statusButtonActive]}
                      onPress={() => handleStatusChange("maybe")}
                    >
                      <MaterialIcons name="help" size={20} color={selectedStatus === "maybe" ? "#fff" : "#666"} />
                      <Text
                        style={[styles.statusButtonText, selectedStatus === "maybe" && styles.statusButtonTextActive]}
                      >
                        Maybe
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusButton, selectedStatus === "not_going" && styles.statusButtonActive]}
                      onPress={() => handleStatusChange("not_going")}
                    >
                      <MaterialIcons name="cancel" size={20} color={selectedStatus === "not_going" ? "#fff" : "#666"} />
                      <Text
                        style={[
                          styles.statusButtonText,
                          selectedStatus === "not_going" && styles.statusButtonTextActive,
                        ]}
                      >
                        Can't Go
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <MaterialIcons name="access-time" size={24} color={Colors[colorScheme ?? "light"].primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Date & Time</Text>
                  <Text style={styles.infoText}>
                    {startDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <Text style={styles.infoText}>
                    {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    {endDate ? ` - ${endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons name="location-on" size={24} color={Colors[colorScheme ?? "light"].primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoText}>{event.location}</Text>
                </View>
              </View>

              {event.campuses && (
                <View style={styles.infoItem}>
                  <MaterialIcons name="school" size={24} color={Colors[colorScheme ?? "light"].primary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Campus</Text>
                    <Text style={styles.infoText}>{event.campuses.name}</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoItem}>
                <MaterialIcons name="people" size={24} color={Colors[colorScheme ?? "light"].primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Attendees</Text>
                  <View style={styles.attendeeStats}>
                    <View style={styles.attendeeStat}>
                      <Text style={styles.attendeeCount}>{goingCount}</Text>
                      <Text style={styles.attendeeLabel}>Going</Text>
                    </View>
                    <View style={styles.attendeeStat}>
                      <Text style={styles.attendeeCount}>{maybeCount}</Text>
                      <Text style={styles.attendeeLabel}>Maybe</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>About this event</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>

            {selectedStatus && (
              <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
                <Text style={styles.leaveButtonText}>Leave Event</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  backIconButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareIconButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dateContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#10b981",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  dateDay: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  dateMonth: {
    color: "#fff",
    fontSize: 14,
    textTransform: "uppercase",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  organizerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  organizerLabel: {
    fontSize: 14,
    color: "#666",
  },
  organizerName: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionContainer: {
    marginBottom: 24,
  },
  joinButton: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  statusButtonActive: {
    backgroundColor: "#10b981",
  },
  statusButtonText: {
    marginLeft: 4,
    fontWeight: "500",
    color: "#666",
  },
  statusButtonTextActive: {
    color: "#fff",
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  infoTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
  },
  attendeeStats: {
    flexDirection: "row",
    marginTop: 4,
  },
  attendeeStat: {
    marginRight: 24,
  },
  attendeeCount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  attendeeLabel: {
    fontSize: 14,
    color: "#666",
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  leaveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f43f5e",
    marginBottom: 16,
  },
  leaveButtonText: {
    color: "#f43f5e",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
})
