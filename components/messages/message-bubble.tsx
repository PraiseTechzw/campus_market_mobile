import { StyleSheet, Platform } from "react-native"
import { Text, View } from "@/components/themed"
import type { Message } from "@/types"
import { format } from "date-fns"
import React from "react"
import { LinearGradient } from "expo-linear-gradient"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Ionicons } from "@expo/vector-icons"

// Special UUID for system messages
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

type MessageBubbleProps = {
  message: Message
  isOwnMessage: boolean
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const colorScheme = useColorScheme();
  // Identify system-style messages by their content more reliably
  const isMarketplaceInfoMessage = message.content.includes('*Marketplace Listing Details*');
  const isAccommodationInfoMessage = message.content.includes('*Accommodation Details*');
  const isSystemMessage = isMarketplaceInfoMessage || isAccommodationInfoMessage;
  
  // Format system message content with bold text and proper line breaks
  const formatSystemMessage = (content: string) => {
    // Replace *text* with styled Text components for bold text
    const segments = content.split(/(\*[^*]+\*)/).filter(Boolean);
    
    return segments.map((segment, index) => {
      if (segment.startsWith('*') && segment.endsWith('*')) {
        // Bold text
        const boldText = segment.slice(1, -1);
        return <Text key={index} style={styles.systemBoldText}>{boldText}</Text>;
      }
      
      // Handle line breaks
      const lines = segment.split('\n').map((line, lineIndex) => (
        <React.Fragment key={`line-${lineIndex}`}>
          {lineIndex > 0 && <Text>{'\n'}</Text>}
          <Text>{line}</Text>
        </React.Fragment>
      ));
      
      return <Text key={index}>{lines}</Text>;
    });
  };
  
  // For system messages, use a special style
  if (isSystemMessage) {
    // Determine the icon and gradient based on message type
    const icon = isMarketplaceInfoMessage ? "pricetag" : "home";
    const gradientColors = isMarketplaceInfoMessage 
      ? ['rgba(8, 145, 178, 0.1)', 'rgba(8, 145, 178, 0.06)']
      : ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.06)'];
    
    return (
      <View style={styles.systemContainer}>
        <LinearGradient
          colors={gradientColors}
          style={styles.systemBubble}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.systemIconContainer}>
            <Ionicons 
              name={icon} 
              size={18} 
              color={isMarketplaceInfoMessage ? "#0891b2" : "#10b981"} 
            />
          </View>
          <Text style={styles.systemText}>
            {formatSystemMessage(message.content)}
          </Text>
        </LinearGradient>
        <Text style={styles.systemTime}>
          {format(new Date(message.created_at), "h:mm a")}
        </Text>
      </View>
    );
  }

  // For regular messages
  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
      <View style={styles.messageContentContainer}>
        {isOwnMessage ? (
          <LinearGradient
            colors={['#0891b2', '#0e7490']} 
            style={[styles.bubble, styles.ownBubble]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.messageText, styles.ownMessageText]}>
              {message.content}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.otherBubble]}>
            <Text style={[styles.messageText, styles.otherMessageText]}>
          {message.content}
            </Text>
          </View>
        )}

        <Text style={[
          styles.time, 
          isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {format(new Date(message.created_at), "h:mm a")}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    maxWidth: "85%",
  },
  ownMessageContainer: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageContentContainer: {
    alignItems: "flex-end",
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#f0f0f0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#333",
  },
  time: {
    fontSize: 11,
    marginTop: 2,
  },
  ownMessageTime: {
    color: "#78909c",
  },
  otherMessageTime: {
    color: "#9e9e9e",
  },
  // System message styles
  systemContainer: {
    alignSelf: "center",
    alignItems: "center",
    marginVertical: 20,
    width: "92%",
  },
  systemBubble: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(8, 145, 178, 0.2)",
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  systemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  systemText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    flex: 1,
  },
  systemBoldText: {
    fontWeight: "bold",
    color: "#0891b2",
  },
  systemTime: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
})
