import { supabase } from "@/lib/supabase"
import type { Conversation, Message } from "@/types"

export async function getConversations(searchQuery?: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    console.log("Getting conversations for user:", user.id);

    // First, get all the conversations for the user
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select(`
        id,
        participant1_id,
        participant2_id,
        listing_id,
        accommodation_id, 
        created_at,
        updated_at
      `)
      .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (convError) {
      console.error("Error fetching conversations:", convError);
      throw convError;
    }

    if (!conversations || conversations.length === 0) {
      return [];
    }

    console.log(`Found ${conversations.length} conversations`);

    // Get all the other participant IDs
    const otherParticipantIds = conversations.map(conv => 
      conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id
    );

    // Fetch all other participants' data in a single query
    const { data: otherUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", otherParticipantIds);

    if (usersError) {
      console.error("Error fetching other users:", usersError);
      throw usersError;
    }

    // Create a map of user IDs to user data for quick lookup
    const userMap = otherUsers.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});

    // Get all conversation IDs
    const conversationIds = conversations.map(conv => conv.id);

    // Fetch last messages for all conversations
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, conversation_id, content, sender_id, created_at, read")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      throw messagesError;
    }

    // Group messages by conversation ID
    const messagesByConversation = messages.reduce((map, message) => {
      if (!map[message.conversation_id]) {
        map[message.conversation_id] = [];
      }
      map[message.conversation_id].push(message);
      return map;
    }, {});

    // Get all listing IDs that are not null
    const listingIds = conversations
      .filter(conv => conv.listing_id)
      .map(conv => conv.listing_id);

    // Fetch listings data if any listings exist
    let listingsMap = {};
    if (listingIds.length > 0) {
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds);

      if (!listingsError && listings) {
        listingsMap = listings.reduce((map, listing) => {
          map[listing.id] = listing;
          return map;
        }, {});
      }
    }

    // Get all accommodation IDs that are not null
    const accommodationIds = conversations
      .filter(conv => conv.accommodation_id)
      .map(conv => conv.accommodation_id);

    // Fetch accommodations data if any accommodations exist
    let accommodationsMap = {};
    if (accommodationIds.length > 0) {
      const { data: accommodations, error: accommodationsError } = await supabase
        .from("accommodations")
        .select("id, title")
        .in("id", accommodationIds);

      if (!accommodationsError && accommodations) {
        accommodationsMap = accommodations.reduce((map, acc) => {
          map[acc.id] = acc;
          return map;
        }, {});
      }
    }

    // Format the conversations with all the related data
    const formattedConversations = conversations.map(conv => {
      const otherParticipantId = conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id;
      const otherUser = userMap[otherParticipantId];
      const conversationMessages = messagesByConversation[conv.id] || [];
      const lastMessage = conversationMessages.length > 0 ? conversationMessages[0] : null;
      const unreadCount = conversationMessages.filter(msg => msg.sender_id !== user.id && !msg.read).length;

      return {
        id: conv.id,
        other_user: otherUser,
        last_message: lastMessage,
        unread_count: unreadCount,
        listing: conv.listing_id ? listingsMap[conv.listing_id] : null,
        accommodation: conv.accommodation_id ? accommodationsMap[conv.accommodation_id] : null,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      };
    });

    // Filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return formattedConversations.filter(conv => {
        const name = `${conv.other_user.first_name} ${conv.other_user.last_name}`.toLowerCase();
        return name.includes(query);
      });
    }

    return formattedConversations as Conversation[];
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

export async function getConversation(id: string | number) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    console.log("Getting conversation with ID:", id, "for user:", user.id);

    // First, get the basic conversation data
    const { data: convData, error: convError } = await supabase
      .from("conversations")
      .select(`
        id,
        participant1_id,
        participant2_id,
        listing_id,
        accommodation_id,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .single();

    if (convError) {
      console.error("Error fetching basic conversation data:", convError);
      throw convError;
    }

    console.log("Basic conversation data:", convData);

    // Get other participant's info
    const otherParticipantId = convData.participant1_id === user.id ? convData.participant2_id : convData.participant1_id;
    
    const { data: otherUserData, error: userError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .eq("id", otherParticipantId)
      .single();

    if (userError) {
      console.error("Error fetching other user data:", userError);
      throw userError;
    }

    console.log("Other user data:", otherUserData);

    // Get listing data if exists
    let listing = null;
    if (convData.listing_id) {
      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("id, title")
        .eq("id", convData.listing_id)
        .single();
      
      if (!listingError && listingData) {
        listing = listingData;
      }
    }

    // Get accommodation data if exists
    let accommodation = null;
    if (convData.accommodation_id) {
      const { data: accommodationData, error: accommodationError } = await supabase
        .from("accommodations")
        .select("id, title")
        .eq("id", convData.accommodation_id)
        .single();
      
      if (!accommodationError && accommodationData) {
        accommodation = accommodationData;
      }
    }

    return {
      id: convData.id,
      other_user: otherUserData,
      listing: listing,
      accommodation: accommodation,
      created_at: convData.created_at,
      updated_at: convData.updated_at,
    } as Conversation;
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

export async function createConversation(
  participant1Id: string, 
  participant2Id: string, 
  listingId?: string | number,
  accommodationId?: string | number
) {
  try {
    console.log("createConversation called with:", { 
      participant1Id, 
      participant2Id, 
      listingId, 
      accommodationId 
    });

    // Check if conversation already exists
    console.log("Checking for existing conversation...");
    const { data: existingConv, error: existingConvError } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant1_id.eq.${participant1Id},participant2_id.eq.${participant2Id}),` +
          `and(participant1_id.eq.${participant2Id},participant2_id.eq.${participant1Id})`,
      )
      // If we're looking for a specific listing or accommodation conversation
      .is("listing_id", listingId ? null : "is.null")
      .is("accommodation_id", accommodationId ? null : "is.null")
      .eq(listingId ? "listing_id" : "id", listingId || "id")
      .eq(accommodationId ? "accommodation_id" : "id", accommodationId || "id")
      .maybeSingle()
    
    console.log("Existing conversation check result:", existingConv);
    if (existingConvError) {
      console.error("Error checking for existing conversation:", existingConvError);
    }

    if (existingConv) {
      console.log("Found existing conversation with ID:", existingConv.id);
      return existingConv.id
    }

    // There's an issue with the query above. Let's fix it by using a simpler approach:
    if (listingId || accommodationId) {
      console.log("Using alternative approach to find conversation with listing/accommodation");
      let query = supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant1_id.eq.${participant1Id},participant2_id.eq.${participant2Id}),` +
            `and(participant1_id.eq.${participant2Id},participant2_id.eq.${participant1Id})`,
        );
      
      if (listingId) {
        query = query.eq("listing_id", listingId);
      }
      
      if (accommodationId) {
        query = query.eq("accommodation_id", accommodationId);
      }
      
      const { data: alternativeResult, error: altError } = await query.maybeSingle();
      
      console.log("Alternative query result:", alternativeResult);
      if (altError) {
        console.error("Error in alternative query:", altError);
      }
      
      if (alternativeResult) {
        console.log("Found existing conversation with alternative query, ID:", alternativeResult.id);
        return alternativeResult.id;
      }
    }

    // Create new conversation
    console.log("Creating new conversation");
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        participant1_id: participant1Id,
        participant2_id: participant2Id,
        listing_id: listingId,
        accommodation_id: accommodationId,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating new conversation:", error);
      throw error;
    }

    console.log("New conversation created with ID:", data.id);
    return data.id
  } catch (error) {
    console.error("Error in createConversation:", error)
    throw error
  }
}
