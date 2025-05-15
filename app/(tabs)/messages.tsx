"use client"

import { useState, useEffect } from "react"
import { StyleSheet, FlatList, RefreshControl } from "react-native"
import { Text, View } from "@/components/themed"
import { useQuery } from "@tanstack/react-query"
import { getConversations } from "@/services/messages"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Conversation } from "@/types"
import { useRouter } from "expo-router"
import ConversationItem from "@/components/messages/conversation-item"
import { ActivityIndicator } from "react-native"
import { supabase } from "@/lib/supabase"

export default function MessagesScreen() {
  const { session } = useSession()
  const [refreshing, setRefreshing] = useState(false)
  const colorScheme = useColorScheme()
  const router = useRouter()

  const {
    data: conversations,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getConversations(),
    enabled: !!session,
  })

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
        () => {
          // Refetch conversations when a new message is received
          refetch()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [session, refetch])

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

  const renderItem = ({ item }: { item: Conversation }) => (
    <ConversationItem conversation={item} onPress={() => navigateToConversation(item)} />
  )

  if (!session) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} style={styles.loader} />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation by messaging a seller or landlord</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
})
