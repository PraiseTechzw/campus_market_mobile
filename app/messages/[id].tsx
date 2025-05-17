  "use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from "react-native"
import { Text, View } from "@/components/themed"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getConversation, getMessages, sendMessage, markMessagesAsRead } from "@/services/messages"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import type { Message } from "@/types"
import MessageBubble from "@/components/messages/message-bubble"
import { supabase } from "@/lib/supabase"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { format } from "date-fns"

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [newMessage, setNewMessage] = useState("")
  const [inputHeight, setInputHeight] = useState(48)
  const flatListRef = useRef<FlatList>(null)

  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id),
    enabled: !!id && !!session,
  })

  const {
    data: messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["messages", id],
    queryFn: () => getMessages(id),
    enabled: !!id && !!session,
  })

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] })
      setNewMessage("")
      setInputHeight(48) // Reset input height after sending
    },
  })

  useEffect(() => {
    // Subscribe to new messages in this conversation
    if (!id || !session) return

    // Immediate fetch of messages to avoid waiting for subscription
    refetchMessages()
    
    const subscription = supabase
      .channel(`conversation:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        () => {
          refetchMessages()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [id, session, refetchMessages])

  useEffect(() => {
    // Mark messages as read when viewing the conversation
    if (id && session && messages?.length) {
      markMessagesAsRead(id, session.user.id)
        .catch(error => console.error("Error marking messages as read:", error));
    }
  }, [id, session, messages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  const handleSend = () => {
    if (!newMessage.trim() || !id || !session) return

    sendMessageMutation.mutate({
      conversation_id: id,
      content: newMessage.trim(),
      sender_id: session.user.id,
      receiver_id: conversation?.other_user.id || "",
    })
  }

  const scrollToBottom = () => {
    if (messages?.length) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <MessageBubble message={item} isOwnMessage={item.sender_id === session?.user.id} />
  )
  
  // Create a message for the empty state based on listing/accommodation
  const getEmptyStateMessage = () => {
    if (!conversation) return "";
    
    if (conversation.listing) {
      return `You're now connected with ${conversation.other_user.first_name} about "${conversation.listing.title}". Say hello!`;
    } else if (conversation.accommodation) {
      return `You're now connected with ${conversation.other_user.first_name} about "${conversation.accommodation.title}". Say hello!`;
    } else {
      return `You're now connected with ${conversation.other_user.first_name}. Start the conversation by sending a message.`;
    }
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "EEEE, MMM d, yyyy");
  };
  
  // Group messages by date for date headers
  const renderMessageItem = ({ item, index }: { item: Message, index: number }) => {
    // Add date headers
    const currentMessageDate = formatDate(item.created_at);
    const previousMessage = index > 0 ? messages?.[index - 1] : null;
    const previousMessageDate = previousMessage ? formatDate(previousMessage.created_at) : null;
    
    const showDateHeader = currentMessageDate !== previousMessageDate;
    
    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <View style={styles.dateHeaderLine} />
            <Text style={styles.dateHeaderText}>{currentMessageDate}</Text>
            <View style={styles.dateHeaderLine} />
          </View>
        )}
        <MessageBubble message={item} isOwnMessage={item.sender_id === session?.user.id} />
      </>
    );
  };

  if (conversationLoading || !conversation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <BlurView 
        intensity={80} 
        tint={colorScheme === "dark" ? "dark" : "light"} 
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {conversation.other_user.first_name} {conversation.other_user.last_name}
          </Text>
          {conversation.listing && (
            <TouchableOpacity 
              onPress={() => router.push(`/marketplace/${conversation.listing.id}`)}
              style={styles.headerSubtitleContainer}
            >
              <Ionicons name="pricetag" size={14} color={Colors[colorScheme ?? "light"].tint} />
              <Text style={styles.headerSubtitle}>{conversation.listing.title}</Text>
            </TouchableOpacity>
          )}
          {conversation.accommodation && (
            <TouchableOpacity 
              onPress={() => router.push(`/accommodation/${conversation.accommodation.id}`)}
              style={styles.headerSubtitleContainer}
            >
              <Ionicons name="home" size={14} color={Colors[colorScheme ?? "light"].tint} />
              <Text style={styles.headerSubtitle}>{conversation.accommodation.title}</Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>

      {messagesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
          <Text style={styles.loadingText}>Retrieving your conversation...</Text>
          <Text style={styles.loadingSubtext}>
            {conversation.listing ? 
              `About "${conversation.listing.title}"` : 
              conversation.accommodation ? 
                `About "${conversation.accommodation.title}"` : 
                ""}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            inverted={false}
            onContentSizeChange={scrollToBottom}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {/* Don't show loader in empty state, show something more helpful */}
                <Ionicons 
                  name="chatbubble-ellipses-outline" 
                  size={50} 
                  color={Colors[colorScheme ?? "light"].tint} 
                  style={styles.emptyIcon} 
                />
                <Text style={styles.emptyText}>New Conversation</Text>
                <Text style={styles.emptySubtext}>
                  {getEmptyStateMessage()}
                </Text>
                <View style={styles.tipContainer}>
                  <Ionicons name="information-circle-outline" size={16} color="#999" />
                  <Text style={styles.tipText}>
                    {conversation.listing || conversation.accommodation ? 
                      "Information about this item will appear automatically." : 
                      "Send a message to start the conversation."}
                  </Text>
                </View>
              </View>
            }
          />
          
          {messages?.length > 8 && (
            <TouchableOpacity 
              style={styles.scrollToBottomButton}
              onPress={scrollToBottom}
            >
              <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </>
      )}

      <BlurView 
        intensity={80} 
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={[styles.inputContainer, { height: Math.max(60, inputHeight + 24) }]}
      >
        <TextInput
          style={[styles.input, { height: Math.max(36, inputHeight) }]}
          placeholder={`Message ${conversation.other_user.first_name}...`}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          onContentSizeChange={(e) => {
            setInputHeight(Math.min(120, e.nativeEvent.contentSize.height));
          }}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
        >
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </BlurView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: "#666",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 224, 224, 0.5)",
    paddingTop: 54,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    justifyContent: 'center',
  },
  dateHeaderLine: {
    height: 1,
    backgroundColor: '#e0e0e0',
    flex: 1,
    marginHorizontal: 8,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 40,
  },
  tipText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(224, 224, 224, 0.5)",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 48,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#0891b2",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 20,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  scrollToBottomButton: {
    position: "absolute",
    right: 16,
    bottom: 70,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
