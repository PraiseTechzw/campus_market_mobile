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

    console.log(`Found ${conversations.length} total conversations`);

    // Get all the other participant IDs
    const otherParticipantIds = conversations.map(conv => 
      conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id
    );

    // Log the unique participants for debugging
    const uniqueParticipants = [...new Set(otherParticipantIds)];
    console.log(`Found ${uniqueParticipants.length} unique participants`);
    console.log("Unique participant IDs:", uniqueParticipants);

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
    const userMap: Record<string, any> = otherUsers.reduce((map: Record<string, any>, user) => {
      map[user.id] = user;
      return map;
    }, {});

    // Log user information for debugging
    console.log("Other users data:");
    otherUsers.forEach(u => {
      console.log(`User ${u.id}: ${u.first_name} ${u.last_name}`);
    });

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
    const messagesByConversation: Record<string, any[]> = messages.reduce((map: Record<string, any[]>, message) => {
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
    let listingsMap: Record<string, any> = {};
    if (listingIds.length > 0) {
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds);

      if (!listingsError && listings) {
        listingsMap = listings.reduce((map: Record<string, any>, listing) => {
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
    let accommodationsMap: Record<string, any> = {};
    if (accommodationIds.length > 0) {
      const { data: accommodations, error: accommodationsError } = await supabase
        .from("accommodations")
        .select("id, title")
        .in("id", accommodationIds);

      if (!accommodationsError && accommodations) {
        accommodationsMap = accommodations.reduce((map: Record<string, any>, acc) => {
          map[acc.id] = acc;
          return map;
        }, {});
      }
    }

    // Format the conversations with all the related data
    const allFormattedConversations = conversations.map(conv => {
      const otherParticipantId = conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id;
      const otherUser = userMap[otherParticipantId];
      const conversationMessages = messagesByConversation[conv.id] || [];
      const lastMessage = conversationMessages.length > 0 ? conversationMessages[0] : null;
      const unreadCount = conversationMessages.filter((msg: any) => msg.sender_id !== user.id && !msg.read).length;

      // Ensure other_user has valid data
      if (!otherUser) {
        console.warn(`Missing user data for participant ID: ${otherParticipantId}`);
      }

      return {
        id: conv.id,
        other_user: otherUser || { id: otherParticipantId, first_name: "Unknown", last_name: "User" },
        other_user_id: otherParticipantId,
        last_message: lastMessage,
        unread_count: unreadCount,
        total_unread: unreadCount, // Will be used for accumulating unread counts
        listing: conv.listing_id ? listingsMap[conv.listing_id] : null,
        accommodation: conv.accommodation_id ? accommodationsMap[conv.accommodation_id] : null,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      };
    });

    // Group conversations by other user ID to consolidate them
    const userConversationsMap: Record<string, any> = {};
    
    // Sort conversations by updated_at timestamp (newest first) before grouping
    allFormattedConversations
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .forEach(conv => {
        const otherUserId = conv.other_user_id;
        
        // Log for debugging
        console.log(`Processing conversation ${conv.id} with user ${otherUserId} (${conv.other_user.first_name} ${conv.other_user.last_name}), updated: ${conv.updated_at}`);
        
        // If we haven't seen this user yet, use this conversation
        if (!userConversationsMap[otherUserId]) {
          userConversationsMap[otherUserId] = conv;
        } 
        // If we've seen this user before, accumulate unread count but keep the most recent conversation
        else {
          // Keep the most recent conversation but add up the unread counts
          userConversationsMap[otherUserId].total_unread += conv.unread_count;
          
          // Log for debugging
          console.log(`Found duplicate for user ${otherUserId}. Using conversation ${userConversationsMap[otherUserId].id}, accumulating unread count to ${userConversationsMap[otherUserId].total_unread}`);
        }
      });

    // Convert map back to array and ensure it's sorted by updated_at
    let formattedConversations = Object.values(userConversationsMap)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    // Use the accumulated total_unread as the unread_count
    formattedConversations = formattedConversations.map(conv => ({
      ...conv,
      unread_count: conv.total_unread
    }));

    // Log the results
    console.log(`Consolidated to ${formattedConversations.length} unique conversations (by user)`);
    formattedConversations.forEach(conv => {
      console.log(`Consolidated conversation: ${conv.id} with ${conv.other_user.first_name} ${conv.other_user.last_name}, unread: ${conv.unread_count}`);
    });

    // Filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      formattedConversations = formattedConversations.filter(conv => {
        if (!conv.other_user) return false;
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

    // Run cleanup to consolidate any existing duplicate conversations
    try {
      console.log("Running cleanup for existing conversations");
      const { cleaned } = await cleanupDuplicateConversations(participant1Id);
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} duplicate conversations before creating new one`);
      }
    } catch (cleanupError) {
      console.error("Error during conversation cleanup:", cleanupError);
      // Continue despite cleanup error
    }

    // Flag to track if we need to send context information
    let shouldSendContextMessage = false;
    let isNewConversation = false;
    let conversationId;
    
    // STEP 1: First check if there's already a conversation for this exact listing/accommodation
    if (listingId || accommodationId) {
      console.log("Checking for existing specific conversation...");
      
      let specificQuery = supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant1_id.eq.${participant1Id},participant2_id.eq.${participant2Id}),` +
          `and(participant1_id.eq.${participant2Id},participant2_id.eq.${participant1Id})`
        );
      
      if (listingId) {
        specificQuery = specificQuery.eq("listing_id", listingId);
      }
      
      if (accommodationId) {
        specificQuery = specificQuery.eq("accommodation_id", accommodationId);
      }
      
      const { data: specificConvs, error: specificError } = await specificQuery.limit(1);
      
      if (specificError) {
        console.error("Error checking for specific conversation:", specificError);
      } else if (specificConvs && specificConvs.length > 0) {
        // We found an existing conversation for this specific listing/accommodation
        conversationId = specificConvs[0].id;
        console.log("Found existing conversation for this specific item:", conversationId);
        
        // Check if we need to send context message
        const { data: contextMessages, error: contextError } = await supabase
          .from("messages")
          .select("id")
          .eq("conversation_id", conversationId)
          .eq("sender_id", participant2Id)
          .ilike("content", "%details%")
          .limit(1);
          
        if (contextError) {
          console.error("Error checking for context messages:", contextError);
          shouldSendContextMessage = true;
        } else {
          shouldSendContextMessage = !contextMessages || contextMessages.length === 0;
          console.log("Should send context message:", shouldSendContextMessage);
        }
      }
    }
    
    // STEP 2: If no specific conversation found, check if there's any conversation between these users
    if (!conversationId) {
      console.log("Checking for any existing conversation between these users...");
      
      const { data: generalConvs, error: generalError } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant1_id.eq.${participant1Id},participant2_id.eq.${participant2Id}),` +
          `and(participant1_id.eq.${participant2Id},participant2_id.eq.${participant1Id})`
        )
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (generalError) {
        console.error("Error checking for general conversation:", generalError);
      } else if (generalConvs && generalConvs.length > 0) {
        // We found an existing conversation between these users
        conversationId = generalConvs[0].id;
        console.log("Found existing conversation between these users:", conversationId);
        
        // If we're trying to discuss a specific listing/accommodation,
        // update the existing conversation to reference it
        if (listingId || accommodationId) {
          console.log("Updating existing conversation to reference new item...");
          
          const { error: updateError } = await supabase
            .from("conversations")
            .update({
              listing_id: listingId || null,
              accommodation_id: accommodationId || null,
              updated_at: new Date().toISOString()
            })
            .eq("id", conversationId);
            
          if (updateError) {
            console.error("Error updating conversation:", updateError);
          } else {
            console.log("Successfully updated conversation to reference new item");
            shouldSendContextMessage = true;
          }
        }
      }
    }
    
    // STEP 3: Create a new conversation if none exists
    if (!conversationId) {
      console.log("Creating new conversation between users");
      
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        participant1_id: participant1Id,
        participant2_id: participant2Id,
          listing_id: listingId || null,
          accommodation_id: accommodationId || null,
      })
      .select("id")
        .single();

      if (error) {
        console.error("Error creating new conversation:", error);
        throw error;
      }

      console.log("New conversation created with ID:", data.id);
      conversationId = data.id;
      shouldSendContextMessage = true;
      isNewConversation = true;
    }

    // STEP 4: Send context message if needed
    if (shouldSendContextMessage && (listingId || accommodationId)) {
      console.log("Preparing to send context message...");
      
      try {
        // Get user information for context
        const { data: participant1, error: p1Error } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", participant1Id)
          .single();

        if (p1Error) {
          console.error("Error fetching participant1:", p1Error);
        }

        const { data: participant2, error: p2Error } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", participant2Id)
          .single();

        if (p2Error) {
          console.error("Error fetching participant2:", p2Error);
        }

        let contextMessage = "";

        // Get listing or accommodation title
        if (listingId) {
          const { data: listingData, error: listingError } = await supabase
            .from("listings")
            .select("title, price, description, condition, category_id, location, created_at")
            .eq("id", listingId)
            .single();
            
          if (listingError) {
            console.error("Error fetching listing info:", listingError);
          } else if (listingData) {
            const sellerName = participant2 ? `${participant2.first_name} ${participant2.last_name}` : "Seller";
            const buyerName = participant1 ? `${participant1.first_name}` : "Buyer";
            
            contextMessage = 
              `🛍️ *Marketplace Listing Details*
              
📦 *${listingData.title}*
💰 Price: $${listingData.price.toFixed(2)}
📍 Location: ${listingData.location}
🏷️ Condition: ${listingData.condition ? listingData.condition.charAt(0).toUpperCase() + listingData.condition.slice(1).replace("_", " ") : "Not specified"}
              
${sellerName} is selling this item to ${buyerName}.
              
Use this chat to discuss details, arrange pickup/delivery, or negotiate the price.`;
          }
        } else if (accommodationId) {
          const { data: accomData, error: accomError } = await supabase
            .from("accommodations")
            .select("title, rent, address, bedrooms, bathrooms, description")
            .eq("id", accommodationId)
            .single();
            
          if (accomError) {
            console.error("Error fetching accommodation info:", accomError);
          } else if (accomData) {
            const landlordName = participant2 ? `${participant2.first_name} ${participant2.last_name}` : "Landlord";
            const tenantName = participant1 ? `${participant1.first_name}` : "Tenant";
            
            contextMessage = 
              `🏘️ *Accommodation Details*
              
🏠 *${accomData.title}*
💰 Rent: $${accomData.rent.toFixed(2)}/month
📍 Address: ${accomData.address}
🛏️ Bedrooms: ${accomData.bedrooms}
🚿 Bathrooms: ${accomData.bathrooms}
              
${landlordName} is offering this accommodation to ${tenantName}.
              
Use this chat to discuss viewing arrangements, ask questions about the property, or negotiate terms.`;
          }
        }

        // If we have context information, send a system message
        if (contextMessage) {
          console.log("Sending context message...");
          
          try {
            // Send system message using the seller/landlord ID (participant2Id) as the sender
            await sendSystemMessage({
              conversation_id: conversationId,
              content: contextMessage,
              sender_id: participant2Id,  // Using owner/landlord as sender instead of system
              receiver_id: participant1Id,
            });
            console.log("Sent context message for the conversation");
          } catch (error) {
            console.error("Error sending context message:", error);
            // Continue despite error - we don't want to fail the conversation creation
          }
        } else {
          console.log("No context message to send - missing data");
        }
      } catch (error) {
        console.error("Error preparing context message:", error);
        // Continue despite error
      }
    }

    return conversationId;
  } catch (error) {
    console.error("Error in createConversation:", error);
    throw error;
  }
}

// Helper function to send system messages
export async function sendSystemMessage(message: Partial<Message>) {
  try {
    console.log("Sending system message:", message);
    const { data, error } = await supabase.from("messages").insert({
      ...message,
      read: true,  // System messages are always marked as read
    }).select().single();

    if (error) {
      console.error("Error sending system message:", error);
      throw error;
    }
    
    // Update conversation's updated_at timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", message.conversation_id);

    console.log("System message sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending system message:", error);
    throw error;
  }
}

// Add this function to help clean up duplicate conversations
export async function cleanupDuplicateConversations(userId: string) {
  try {
    console.log("Starting cleanup of duplicate conversations for user:", userId);
    
    // First, get all conversations involving this user
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
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (convError) {
      console.error("Error fetching conversations for cleanup:", convError);
      throw convError;
    }

    if (!conversations || conversations.length === 0) {
      console.log("No conversations found for cleanup");
      return { cleaned: 0 };
    }

    console.log(`Found ${conversations.length} conversations to analyze for duplicates`);
    
    // Group conversations by the other participant
    const conversationsByParticipant: Record<string, any[]> = {};
    
    conversations.forEach(conv => {
      const otherParticipantId = conv.participant1_id === userId ? conv.participant2_id : conv.participant1_id;
      
      if (!conversationsByParticipant[otherParticipantId]) {
        conversationsByParticipant[otherParticipantId] = [];
      }
      
      conversationsByParticipant[otherParticipantId].push({
        id: conv.id,
        updated_at: conv.updated_at,
        has_listing: !!conv.listing_id,
        has_accommodation: !!conv.accommodation_id,
      });
    });
    
    // Find participants with multiple conversations
    const duplicateParticipants = Object.keys(conversationsByParticipant).filter(
      participantId => conversationsByParticipant[participantId].length > 1
    );
    
    console.log(`Found ${duplicateParticipants.length} participants with duplicate conversations`);
    
    if (duplicateParticipants.length === 0) {
      return { cleaned: 0 };
    }
    
    // For each participant with duplicates, keep the newest conversation and clean up the rest
    let totalCleanedConversations = 0;
    
    for (const participantId of duplicateParticipants) {
      const participantConvs = conversationsByParticipant[participantId];
      
      // Sort by updated_at (newest first)
      participantConvs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      // Keep the newest conversation
      const conversationToKeep = participantConvs[0];
      
      // Get IDs of conversations to delete
      const conversationsToDelete = participantConvs.slice(1).map(conv => conv.id);
      
      console.log(`For participant ${participantId}: keeping conversation ${conversationToKeep.id}, deleting ${conversationsToDelete.length} conversations`);
      
      // Before deleting, check if we need to move messages to the kept conversation
      for (const convId of conversationsToDelete) {
        // Get messages from the conversation we'll delete
        const { data: messages } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", convId);
          
        if (messages && messages.length > 0) {
          console.log(`Moving ${messages.length} messages from conversation ${convId} to ${conversationToKeep.id}`);
          
          // Update these messages to point to the kept conversation
          for (const message of messages) {
            await supabase
              .from("messages")
              .update({ conversation_id: conversationToKeep.id })
              .eq("id", message.id);
          }
        }
      }
      
      // Delete the duplicate conversations
      if (conversationsToDelete.length > 0) {
        const { error } = await supabase
          .from("conversations")
          .delete()
          .in("id", conversationsToDelete);
          
        if (error) {
          console.error("Error deleting duplicate conversations:", error);
        } else {
          totalCleanedConversations += conversationsToDelete.length;
          console.log(`Successfully deleted ${conversationsToDelete.length} duplicate conversations`);
        }
      }
    }
    
    return { cleaned: totalCleanedConversations };
  } catch (error) {
    console.error("Error in cleanupDuplicateConversations:", error);
    return { cleaned: 0, error };
  }
}
