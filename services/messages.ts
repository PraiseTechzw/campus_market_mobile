import { supabase } from "@/lib/supabase"
import type { Conversation, Message } from "@/types"

export async function getConversations() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        other_user:participants!inner(
          user:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        ),
        last_message:messages(
          id,
          content,
          created_at,
          sender_id
        ),
        listing:listing_id(
          id,
          title
        )
      `)
      .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })

    if (error) throw error

    // Process the data to extract the other user and format the conversation
    const conversations = data.map((conv) => {
      const otherUserData = conv.other_user.find((p) => p.user.id !== user.id)?.user

      const lastMessage =
        conv.last_message.length > 0
          ? conv.last_message.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null

      // Count unread messages
      const unreadCount = conv.last_message.filter((msg) => msg.sender_id !== user.id && !msg.read).length

      return {
        id: conv.id,
        other_user: otherUserData,
        last_message: lastMessage,
        unread_count: unreadCount,
        listing: conv.listing,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      }
    })

    return conversations as Conversation[]
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return []
  }
}

export async function getConversation(id: string | number) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        other_user:participants!inner(
          user:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        ),
        listing:listing_id(
          id,
          title
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // Extract the other user
    const otherUserData = data.other_user.find((p) => p.user.id !== user.id)?.user

    return {
      id: data.id,
      other_user: otherUserData,
      listing: data.listing,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as Conversation
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return null
  }
}

export async function getMessages(conversationId: string | number) {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) throw error

    return data as Message[]
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

export async function sendMessage(message: Partial<Message>) {
  try {
    const { data, error } = await supabase.from("messages").insert(message).select().single()

    if (error) throw error

    // Update the conversation's updated_at timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", message.conversation_id)

    return data as Message
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

export async function markMessagesAsRead(conversationId: string | number, userId: string) {
  try {
    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("read", false)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return false
  }
}

export async function createConversation(participant1Id: string, participant2Id: string, listingId?: string | number) {
  try {
    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant1_id.eq.${participant1Id},participant2_id.eq.${participant2Id}),` +
          `and(participant1_id.eq.${participant2Id},participant2_id.eq.${participant1Id})`,
      )
      .maybeSingle()

    if (existingConv) {
      return existingConv.id
    }

    // Create new conversation
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        participant1_id: participant1Id,
        participant2_id: participant2Id,
        listing_id: listingId,
      })
      .select("id")
      .single()

    if (error) throw error

    return data.id
  } catch (error) {
    console.error("Error creating conversation:", error)
    throw error
  }
}
