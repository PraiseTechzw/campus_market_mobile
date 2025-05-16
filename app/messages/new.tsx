"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native"
import { Text, View } from "@/components/themed"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { createConversation } from "@/services/messages"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import SafeAreaWrapper from "@/components/safe-area-wrapper"

type UserProfile = {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string
}

export default function NewConversationScreen() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  // Fetch users matching the search query
  const {
    data: users,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["search-users", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return []

      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .or(`first_name.ilike.%${searchQuery}%, last_name.ilike.%${searchQuery}%`)
        .neq("id", session?.user.id)
        .limit(20)

      if (error) throw error
      return data as UserProfile[]
    },
    enabled: !!session && searchQuery.length >= 2,
  })

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user)
  }

  const handleStartConversation = async () => {
    if (!session || !selectedUser) return

    try {
      setLoading(true)
      // Create a new conversation
      const conversationId = await createConversation(session.user.id, selectedUser.id)

      // Navigate to the conversation
      router.push({
        pathname: "/messages/[id]",
        params: { id: conversationId },
      })
    } catch (error) {
      console.error("Error creating conversation:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity 
      style={[
        styles.userItem, 
        selectedUser?.id === item.id && styles.selectedUserItem
      ]} 
      onPress={() => handleSelectUser(item)}
    >
      <Image
        source={{ uri: item.avatar_url || "https://via.placeholder.com/50x50?text=User" }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.first_name} {item.last_name}
        </Text>
      </View>
      {selectedUser?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={Colors[colorScheme ?? "light"].tint} />
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Message</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a user..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoFocus
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery.length < 2
                    ? "Type at least 2 characters to search"
                    : "No users found matching your search"}
                </Text>
              </View>
            }
          />
        )}

        {selectedUser && (
          <View style={styles.selectedUserFooter}>
            <Text style={styles.selectedUserText}>
              Start conversation with {selectedUser.first_name} {selectedUser.last_name}
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartConversation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.startButtonText}>Start</Text>
              )}
            </TouchableOpacity>
          </View>
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
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedUserItem: {
    backgroundColor: Colors.light.tint + "20",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  selectedUserFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  selectedUserText: {
    flex: 1,
    fontSize: 16,
  },
  startButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
}) 