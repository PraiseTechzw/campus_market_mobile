import { StyleSheet, TouchableOpacity, Image, View as RNView } from "react-native"
import { Text, View } from "@/components/themed"
import type { Conversation } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { Ionicons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { BlurView } from "expo-blur"

type ConversationItemProps = {
  conversation: Conversation
  onPress: () => void
}

export default function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const { other_user, last_message, unread_count, listing, accommodation } = conversation
  const colorScheme = useColorScheme()
  
  // Get the context of the conversation
  const getConversationContext = () => {
    if (listing) return { 
      type: 'listing',
      title: listing.title,
      icon: 'pricetag-outline'
    };
    
    if (accommodation) return {
      type: 'accommodation',
      title: accommodation.title,
      icon: 'home-outline'
    };
    
    return null;
  };
  
  const conversationContext = getConversationContext();

  // Format the message preview
  const getMessagePreview = () => {
    if (!last_message) return "No messages yet";
    
    // Check if it's a system message about listing or accommodation
    const isListingInfo = last_message.content.includes('*Marketplace Listing Details*');
    const isAccommodationInfo = last_message.content.includes('*Accommodation Details*');
    
    if (isListingInfo) {
      return "📦 Information about this listing";
    } else if (isAccommodationInfo) {
      return "🏠 Information about this accommodation";
    } 
    
    // Regular message - show the content
    return last_message.content;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        unread_count > 0 && styles.unreadContainer
      ]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <RNView style={styles.avatarContainer}>
      <Image
        source={{
            uri: other_user?.avatar_url || "https://via.placeholder.com/50x50?text=User",
        }}
        style={styles.avatar}
      />
        {unread_count > 0 && (
          <RNView style={styles.badgeDot} />
        )}
      </RNView>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[
            styles.name,
            unread_count > 0 && styles.unreadName
          ]}>
            {other_user?.first_name} {other_user?.last_name}
          </Text>
          <Text style={styles.time}>
            {last_message ? formatDistanceToNow(new Date(last_message.created_at), { addSuffix: true }) : ""}
          </Text>
        </View>

        {conversationContext && (
          <View style={styles.contextContainer}>
            <Ionicons 
              name={conversationContext.icon} 
              size={12} 
              color={Colors[colorScheme ?? "light"].tint} 
              style={styles.contextIcon}
            />
            <Text style={styles.context} numberOfLines={1}>
              {conversationContext.type === 'listing' ? 'Marketplace: ' : 'Accommodation: '}
              {conversationContext.title}
            </Text>
          </View>
        )}

        <View style={styles.messageRow}>
          <Text 
            style={[
              styles.message, 
              unread_count > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {getMessagePreview()}
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
    position: 'relative',
  },
  unreadContainer: {
    backgroundColor: "rgba(8, 145, 178, 0.06)",
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f0f0",
  },
  badgeDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0891b2",
    borderWidth: 2,
    borderColor: "#fff",
    bottom: 0,
    right: 0,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", 
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
  },
  unreadName: {
    fontWeight: "700",
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  contextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  contextIcon: {
    marginRight: 4,
  },
  context: {
    fontSize: 12,
    color: "#0891b2",
    fontWeight: '500',
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
    fontWeight: "600",
    color: "#333",
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
})
