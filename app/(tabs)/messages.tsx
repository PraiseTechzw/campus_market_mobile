"use client"

import { useState, useEffect } from "react"
import { StyleSheet, FlatList, View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useColorScheme } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useNetwork } from "@/providers/network-provider"
import { useAuth } from "@/providers/auth-provider"
import { getConversations } from "@/services/api"
import { getLocalConversations } from "@/utils/storage"
import type { Conversation } from "@/types"
import SearchBar from "@/components/search-bar"
import OfflineBanner from "@/components/offline-banner"
import { formatDistanceToNow } from "date-fns"

export default function MessagesScreen() {
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadConversations()
    } else {
      setLoading(false)
    }
  }, [user, isConnected])

  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter(
        (conv) =>
          conv.otherUser.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.otherUser.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredConversations(filtered)
    } else {
      setFilteredConversations(conversations)
    }
  }, [searchQuery, conversations])

  const loadConversations = async () => {
    if (!user) return

    setLoading(true)
    try {
      if (isConnected) {
        // Online mode - fetch from API
        const conversationsData = await getConversations(user.id)
        setConversations(conversationsData)
      } else {
        // Offline mode - load from local storage
        const localConversations = await getLocalConversations()
        setConversations(localConversations)
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadConversations()
    setRefreshing(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="chat-bubble-outline" size={64} color={Colors[colorScheme ?? "light"].textDim} />
      <Text style={[styles.emptyText, { color: Colors[colorScheme ?? "light"].text }]}>No messages yet</Text>
      <Text style={[styles.emptySubText, { color: Colors[colorScheme ?? "light"].textDim }]}>
        Start a conversation by messaging a seller
      </Text>
      <TouchableOpacity
        style={[styles.browseButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
        onPress={() => router.push("/marketplace")}
      >
        <Text style={styles.browseButtonText}>Browse Marketplace</Text>
      </TouchableOpacity>
    </View>
  )

  const renderNotLoggedIn = () => (
    <View style={styles.notLoggedInContainer}>
      <MaterialIcons name="lock" size={64} color={Colors[colorScheme ?? "light"].textDim} />
      <Text style={[styles.notLoggedInText, { color: Colors[colorScheme ?? "light"].text }]}>
        You need to be logged in to view messages
      </Text>
      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  )

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        {renderNotLoggedIn()}
      </SafeAreaView>
    )
  }

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? "light"].text }]}>Loading messages...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {!isConnected && <OfflineBanner />}

      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>Messages</Text>
        <SearchBar placeholder="Search messages..." value={searchQuery} onChangeText={handleSearch} />
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.conversationItem,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: Colors[colorScheme ?? "light"].border,
              },
            ]}
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: item.otherUser.profilePicture || "/placeholder.svg?height=50&width=50" }}
                style={styles.avatar}
              />
              {item.otherUser.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                </View>
              )}
              {item.otherUser.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={[styles.userName, { color: Colors[colorScheme ?? "light"].text }]}>
                  {item.otherUser.firstName} {item.otherUser.lastName}
                </Text>
                <Text style={[styles.timeText, { color: Colors[colorScheme ?? "light"].textDim }]}>
                  {formatDistanceToNow(new Date(item.lastMessage.timestamp), { addSuffix: true })}
                </Text>
              </View>

              <View style={styles.messagePreviewContainer}>
                <Text
                  style={[
                    styles.messagePreview,
                    { color: Colors[colorScheme ?? "light"].textDim },
                    item.unreadCount > 0 && { color: Colors[colorScheme ?? "light"].text, fontWeight: "500" },
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage.text}
                </Text>

                {item.unreadCount > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}>
                    <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>

              {item.productId && (
                <View style={[styles.productPreview, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                  <Image
                    source={{ uri: item.productImage || "/placeholder.svg?height=30&width=30" }}
                    style={styles.productImage}
                  />
                  <Text style={[styles.productName, { color: Colors[colorScheme ?? "light"].text }]} numberOfLines={1}>
                    {item.productName}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, filteredConversations.length === 0 && styles.emptyList]}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "white",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 12,
  },
  messagePreviewContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messagePreview: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  productPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  productImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginRight: 8,
  },
  productName: {
    fontSize: 12,
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  browseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  browseButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notLoggedInText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
