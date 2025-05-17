"use client"

import { useState, useEffect, useRef } from "react"
import { StyleSheet, RefreshControl, TouchableOpacity, Animated, TextInput, Alert } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getConversations, cleanupDuplicateConversations } from "@/services/messages"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Conversation } from "@/types"
import { useRouter } from "expo-router"
import ConversationItem from "@/components/messages/conversation-item"
import { ActivityIndicator, Image } from "react-native"
import { supabase } from "@/lib/supabase"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { MaterialIcons } from "@expo/vector-icons"
import { useToast } from "@/providers/toast-provider"
import { MotiView } from "moti"
import { Ionicons } from "@expo/vector-icons"

export default function MessagesScreen() {
  const { session } = useSession()
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [cleaning, setCleaning] = useState(false)
  const colorScheme = useColorScheme()
  const router = useRouter()
  const toast = useToast()
  const scrollY = useRef(new Animated.Value(0)).current

  const {
    data: conversations,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["conversations", searchQuery],
    queryFn: () => getConversations(searchQuery),
    enabled: !!session,
  })

  // Handle cleanup of duplicate conversations
  const handleCleanup = async () => {
    if (!session) return;
    
    try {
      setCleaning(true);
      const { cleaned, error } = await cleanupDuplicateConversations(session.user.id);
      
      if (error) {
        toast.show({
          type: "error",
          title: "Cleanup Failed",
          message: "Could not clean up conversations. Please try again.",
        });
        console.error("Cleanup error:", error);
      } else {
        if (cleaned > 0) {
          toast.show({
            type: "success",
            title: "Cleanup Complete",
            message: `Successfully cleaned up ${cleaned} duplicate conversations`,
          });
          // Refresh the conversation list
          await refetch();
        } else {
          toast.show({
            type: "info",
            title: "No Duplicates Found",
            message: "Your messages are already optimized.",
          });
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
      toast.show({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred",
      });
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    // Force refresh conversations data when component mounts
    if (session) {
      console.log("Forcefully refetching conversations on mount");
      refetch();
    }
  }, [session, refetch]);

  useEffect(() => {
    // Subscribe to new messages
    if (!session) return

    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${session.user.id}`,
        },
        (payload) => {
          // Refetch conversations when a new message is received
          refetch()
          toast.show({
            type: "info",
            title: "New Message",
            message: "You have received a new message",
          })
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [session, refetch, toast])

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const navigateToConversation = (conversation: Conversation) => {
    router.push({
      pathname: "/messages/[id]",
      params: { id: conversation.id },
    })
  }

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: "clamp",
  })

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 50],
    extrapolate: "clamp",
  })

  const filteredConversations = conversations?.filter((conversation) => {
    if (!searchQuery) return true
    const name = `${conversation.other_user.first_name} ${conversation.other_user.last_name}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  const renderItem = ({ item, index }: { item: Conversation; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay: index * 100, type: "timing" }}
    >
      <ConversationItem conversation={item} onPress={() => navigateToConversation(item)} />
    </MotiView>
  )

  if (!session) return null

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerButtons}>
            {cleaning && <ActivityIndicator size="small" color={Colors[colorScheme ?? "light"].tint} style={styles.cleanupLoader} />}
            <TouchableOpacity onPress={handleCleanup} disabled={cleaning || isLoading} style={styles.headerButton}>
              <Ionicons name="cleaning-services" size={20} color={Colors[colorScheme ?? "light"].text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/messages/new")} style={styles.headerButton}>
              <Ionicons name="add" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.searchContainer,
            {
              transform: [{ translateY: searchBarTranslateY }],
            },
          ]}
        >
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.loaderText}>Loading conversations...</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={filteredConversations}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[styles.listContent, { paddingTop: 120 }]}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[Colors[colorScheme ?? "light"].tint]}
                tintColor={Colors[colorScheme ?? "light"].tint}
              />
            }
            ListEmptyComponent={
              <MotiView 
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
                style={styles.emptyContainer}
              >
                <MaterialIcons 
                  name="forum" 
                  size={70} 
                  color={Colors[colorScheme ?? "light"].tint} 
                  style={{ opacity: 0.8 }}
                />
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptyText}>
                  Start a conversation by messaging a seller or landlord from a listing
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push("/marketplace")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyButtonText}>Browse Marketplace</Text>
                </TouchableOpacity>
              </MotiView>
            }
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
            scrollEventThrottle={16}
          />
        )}

        {!isLoading && filteredConversations?.length === 0 && searchQuery && (
          <MotiView 
            from={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            style={styles.noResultsContainer}
          >
            <MaterialIcons name="search-off" size={40} color="#999" />
            <Text style={styles.noResultsText}>No results found</Text>
            <Text style={styles.noResultsSubtext}>Try a different search term</Text>
          </MotiView>
        )}
      </View>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  cleanupLoader: {
    marginRight: 4,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noResultsText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: "#666",
  },
})
