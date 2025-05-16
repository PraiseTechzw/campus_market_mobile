import { StyleSheet, TouchableOpacity, Image } from "react-native"
import { Text, View } from "@/components/themed"
import type { Conversation } from "@/types"
import { formatDistanceToNow } from "date-fns"

type ConversationItemProps = {
  conversation: Conversation
  onPress: () => void
}

export default function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const { other_user, last_message, unread_count, listing, accommodation } = conversation
  
  // Get the context of the conversation
  const getConversationContext = () => {
    if (listing) return `Re: ${listing.title}`;
    if (accommodation) return `Re: ${accommodation.title}`;
    return null;
  };
  
  const conversationContext = getConversationContext();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{
          uri: other_user.avatar_url || "/placeholder.svg?height=50&width=50",
        }}
        style={styles.avatar}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {other_user.first_name} {other_user.last_name}
          </Text>
          <Text style={styles.time}>
            {last_message ? formatDistanceToNow(new Date(last_message.created_at), { addSuffix: true }) : ""}
          </Text>
        </View>

        {conversationContext && <Text style={styles.context} numberOfLines={1}>{conversationContext}</Text>}

        <View style={styles.messageRow}>
          <Text style={[styles.message, unread_count > 0 && styles.unreadMessage]} numberOfLines={1}>
            {last_message ? last_message.content : "No messages yet"}
          </Text>

          {unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unread_count > 99 ? "99+" : unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  unreadMessage: {
    fontWeight: "bold",
    color: "#000",
  },
  unreadBadge: {
    backgroundColor: "#0891b2",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 4,
  },
  context: {
    fontSize: 12,
    color: "#0891b2",
    marginBottom: 4,
  },
})
