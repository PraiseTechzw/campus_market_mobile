"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useColorScheme } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useNetwork } from "@/providers/network-provider"
import { useAuth } from "@/providers/auth-provider"
import { getConversationById, getMessages, sendMessage } from "@/services/api"
import { getLocalMessages, saveLocalMessages } from "@/utils/storage"
import { queueMessageSend } from "@/utils/sync-queue"
import type { Conversation, Message } from "@/types"
import OfflineBanner from "@/components/offline-banner"

export default function ChatScreen() {
  const { id } = useLocalSearchParams()
  const colorScheme = useColorScheme()
  const { isConnected } = useNetwork()
  const { user } = useAuth()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (!user) {
      Alert.alert("Sign In Required", "You need to sign in to view messages", [
        { text: "Sign In", onPress: () => router.replace("/(auth)/login") },
      ])
      return
    }

    loadConversation()
  }, [id, user, isConnected])

  const loadConversation = async () => {
    if (!id || !user) return

    setLoading(true)
    try {
      // Load conversation
      const conversationData = await getConversationById(id as string)
      if (!conversationData) {
        Alert.alert("Error", "Conversation not found")
        router.back()
        return
      }
      setConversation(conversationData)

      // Load messages
      let messageData: Message[] = []
      if (isConnected) {
        // Online mode - fetch from API
        messageData = await getMessages(id as string)
        // Save to local storage for offline access
        await saveLocalMessages(id as string, messageData)
      } else {
        // Offline mode - load from local storage
        messageData = await getLocalMessages(id as string)
      }
      setMessages(messageData)
    } catch (error) {
      console.error("Error loading conversation:", error)
      Alert.alert("Error", "Failed to load conversation")
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !conversation) return

    const tempId = Math.random().toString()
    const tempMessage: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: user.id,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    }

    // Add message to UI immediately
    setMessages((prev) => [...prev, tempMessage])
    setNewMessage("")

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)

    setSending(true)
    try {
      if (isConnected) {
        // Online mode - send message directly
        const sentMessage = await sendMessage(conversation.id, user.id, tempMessage.text)

        // Replace temp message with actual message
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? sentMessage : msg)))

        // Save updated messages to local storage
        const updatedMessages = messages.filter((msg) => msg.id !== tempId).concat(sentMessage)
        await saveLocalMessages(conversation.id, updatedMessages)
      } else {
        // Offline mode - queue for later sync
        await queueMessageSend(conversation.id, user.id, tempMessage.text)

        // Save temp message to local storage
        await saveLocalMessages(conversation.id, [...messages, tempMessage])
      }
    } catch (error) {
      console.error("Error sending message:", error)
      Alert.alert("Error", "Failed to send message. Please try again.")

      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isFromMe = item.senderId === user?.id

    return (
      <View style={[styles.messageContainer, isFromMe ? styles.myMessageContainer : styles.theirMessageContainer]}>
        <View
          style={[
            styles.messageBubble,
            isFromMe
              ? [styles.myMessageBubble, { backgroundColor: Colors[colorScheme ?? "light"].tint }]
              : [styles.theirMessageBubble, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }],
          ]}
        >
          <Text style={[styles.messageText, { color: isFromMe ? "white" : Colors[colorScheme ?? "light"].text }]}>
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isFromMe ? "rgba(255, 255, 255, 0.7)" : Colors[colorScheme ?? "light"].textDim },
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    )
  }

  if (!user) {
    return null // Handled in useEffect
  }

  if (loading) {
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

      {conversation?.productId && (
        <TouchableOpacity
          style={[styles.productBanner, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}
          onPress={() => router.push(`/product/${conversation.productId}`)}
        >
          <Image
            source={{ uri: conversation.productImage || "/placeholder.svg?height=40&width=40" }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={[styles.productLabel, { color: Colors[colorScheme ?? "light"].textDim }]}>Discussing:</Text>
            <Text style={[styles.productName, { color: Colors[colorScheme ?? "light"].text }]} numberOfLines={1}>
              {conversation.productName}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={Colors[colorScheme ?? "light"].textDim} />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={[styles.inputContainer, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
          <TextInput
            style={[styles.input, { color: Colors[colorScheme ?? "light"].text }]}
            placeholder="Type a message..."
            placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: Colors[colorScheme ?? "light"].tint },
              (!newMessage.trim() || sending) && styles.disabledButton,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  productBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productLabel: {
    fontSize: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
  },
  theirMessageContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
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
})
