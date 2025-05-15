import { StyleSheet } from "react-native"
import { Text, View } from "@/components/themed"
import type { Message } from "@/types"
import { format } from "date-fns"

type MessageBubbleProps = {
  message: Message
  isOwnMessage: boolean
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
      <View style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
          {message.content}
        </Text>
      </View>
      <Text style={styles.time}>{format(new Date(message.created_at), "h:mm a")}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  ownMessageContainer: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  ownBubble: {
    backgroundColor: "#0891b2",
  },
  otherBubble: {
    backgroundColor: "#f0f0f0",
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#000",
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
})
