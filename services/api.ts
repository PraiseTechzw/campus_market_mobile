import { supabase } from "@/lib/supabase"
import type { User, Product, Category, Order, Conversation, Message } from "@/types"

// Categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase.from("categories").select("*")

    if (error) {
      console.error("Error fetching categories:", error)
      // Fallback to mock data
      return mockCategories
    }

    return data.map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
    }))
  } catch (error) {
    console.error("Error in getCategories:", error)
    // Fallback to mock data
    return mockCategories
  }
}

// Products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        seller:seller_id (
          id, email, first_name, last_name, role, is_verified, profile_picture, created_at, rating
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products:", error)
      // Fallback to mock data
      return productsWithSellers
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      categoryId: item.category_id,
      condition: item.condition,
      images: item.images,
      tags: item.tags,
      isNegotiable: item.is_negotiable,
      isUrgent: item.is_urgent,
      sellerId: item.seller_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      featured: item.featured,
      seller: item.seller
        ? {
            id: item.seller.id,
            email: item.seller.email,
            firstName: item.seller.first_name,
            lastName: item.seller.last_name,
            role: item.seller.role,
            isVerified: item.seller.is_verified,
            profilePicture: item.seller.profile_picture,
            createdAt: item.seller.created_at,
            rating: item.seller.rating,
          }
        : undefined,
    }))
  } catch (error) {
    console.error("Error in getProducts:", error)
    // Fallback to mock data
    return productsWithSellers
  }
}

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        seller:seller_id (
          id, email, first_name, last_name, role, is_verified, profile_picture, created_at, rating
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching product:", error)
      // Fallback to mock data
      return productsWithSellers.find((p) => p.id === id) || null
    }

    return {
      id: data.id,
      name: data.name,
      price: data.price,
      description: data.description,
      categoryId: data.category_id,
      condition: data.condition,
      images: data.images,
      tags: data.tags,
      isNegotiable: data.is_negotiable,
      isUrgent: data.is_urgent,
      sellerId: data.seller_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      featured: data.featured,
      seller: data.seller
        ? {
            id: data.seller.id,
            email: data.seller.email,
            firstName: data.seller.first_name,
            lastName: data.seller.last_name,
            role: data.seller.role,
            isVerified: data.seller.is_verified,
            profilePicture: data.seller.profile_picture,
            createdAt: data.seller.created_at,
            rating: data.seller.rating,
          }
        : undefined,
    }
  } catch (error) {
    console.error("Error in getProductById:", error)
    // Fallback to mock data
    return productsWithSellers.find((p) => p.id === id) || null
  }
}

export const getUserProducts = async (userId: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        seller:seller_id (
          id, email, first_name, last_name, role, is_verified, profile_picture, created_at, rating
        )
      `)
      .eq("seller_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user products:", error)
      // Fallback to mock data
      return productsWithSellers.filter((p) => p.sellerId === userId)
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      categoryId: item.category_id,
      condition: item.condition,
      images: item.images,
      tags: item.tags,
      isNegotiable: item.is_negotiable,
      isUrgent: item.is_urgent,
      sellerId: item.seller_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      featured: item.featured,
      seller: item.seller
        ? {
            id: item.seller.id,
            email: item.seller.email,
            firstName: item.seller.first_name,
            lastName: item.seller.last_name,
            role: item.seller.role,
            isVerified: item.seller.is_verified,
            profilePicture: item.seller.profile_picture,
            createdAt: item.seller.created_at,
            rating: item.seller.rating,
          }
        : undefined,
    }))
  } catch (error) {
    console.error("Error in getUserProducts:", error)
    // Fallback to mock data
    return productsWithSellers.filter((p) => p.sellerId === userId)
  }
}

export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: productData.name || "",
        price: productData.price || 0,
        description: productData.description || "",
        category_id: productData.categoryId || "",
        condition: productData.condition || "used",
        images: productData.images || [],
        tags: productData.tags || [],
        is_negotiable: productData.isNegotiable || false,
        is_urgent: productData.isUrgent || false,
        seller_id: productData.sellerId || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      throw error
    }

    // Fetch seller details
    const { data: seller, error: sellerError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.seller_id)
      .single()

    if (sellerError) {
      console.error("Error fetching seller:", sellerError)
    }

    return {
      id: data.id,
      name: data.name,
      price: data.price,
      description: data.description,
      categoryId: data.category_id,
      condition: data.condition,
      images: data.images,
      tags: data.tags,
      isNegotiable: data.is_negotiable,
      isUrgent: data.is_urgent,
      sellerId: data.seller_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      featured: data.featured || false,
      seller: seller
        ? {
            id: seller.id,
            email: seller.email,
            firstName: seller.first_name,
            lastName: seller.last_name,
            role: seller.role,
            isVerified: seller.is_verified,
            profilePicture: seller.profile_picture,
            createdAt: seller.created_at,
            rating: seller.rating,
          }
        : undefined,
    }
  } catch (error) {
    console.error("Error in createProduct:", error)
    throw error
  }
}

// Orders
export const getOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        product:product_id (
          id, name, price, description, category_id, condition, images, tags, 
          is_negotiable, is_urgent, seller_id, created_at, updated_at, featured
        ),
        buyer:buyer_id (
          id, email, first_name, last_name, role, is_verified, profile_picture, created_at, rating
        ),
        seller:seller_id (
          id, email, first_name, last_name, role, is_verified, profile_picture, created_at, rating
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      // Fallback to mock data
      return ordersWithDetails
    }

    return data.map((item) => ({
      id: item.id,
      productId: item.product_id,
      buyerId: item.buyer_id,
      sellerId: item.seller_id,
      status: item.status,
      price: item.price,
      paymentMethod: item.payment_method,
      deliveryAddress: item.delivery_address,
      deliveryNotes: item.delivery_notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            description: item.product.description,
            categoryId: item.product.category_id,
            condition: item.product.condition,
            images: item.product.images,
            tags: item.product.tags,
            isNegotiable: item.product.is_negotiable,
            isUrgent: item.product.is_urgent,
            sellerId: item.product.seller_id,
            createdAt: item.product.created_at,
            updatedAt: item.product.updated_at,
            featured: item.product.featured,
          }
        : undefined,
      buyer: item.buyer
        ? {
            id: item.buyer.id,
            email: item.buyer.email,
            firstName: item.buyer.first_name,
            lastName: item.buyer.last_name,
            role: item.buyer.role,
            isVerified: item.buyer.is_verified,
            profilePicture: item.buyer.profile_picture,
            createdAt: item.buyer.created_at,
            rating: item.buyer.rating,
          }
        : undefined,
      seller: item.seller
        ? {
            id: item.seller.id,
            email: item.seller.email,
            firstName: item.seller.first_name,
            lastName: item.seller.last_name,
            role: item.seller.role,
            isVerified: item.seller.is_verified,
            profilePicture: item.seller.profile_picture,
            createdAt: item.seller.created_at,
            rating: item.seller.rating,
          }
        : undefined,
    }))
  } catch (error) {
    console.error("Error in getOrders:", error)
    // Fallback to mock data
    return ordersWithDetails
  }
}

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        product:product_id (
          id, name, price, description, category_id, condition, images, tags, 
          is_negotiable, is_urgent, seller_id, created_at, updated_at, featured
        ),
        buyer:buyer_id (
          id, email, first_name, last_name, role, is_verified, profile_picture, created_at, rating
        ),
        seller:seller_id (
          id, email, first_name, last_name, role, is_verified, profile_picture, created_at, rating
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching order:", error)
      // Fallback to mock data
      return ordersWithDetails.find((o) => o.id === id) || null
    }

    return {
      id: data.id,
      productId: data.product_id,
      buyerId: data.buyer_id,
      sellerId: data.seller_id,
      status: data.status,
      price: data.price,
      paymentMethod: data.payment_method,
      deliveryAddress: data.delivery_address,
      deliveryNotes: data.delivery_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      product: data.product
        ? {
            id: data.product.id,
            name: data.product.name,
            price: data.product.price,
            description: data.product.description,
            categoryId: data.product.category_id,
            condition: data.product.condition,
            images: data.product.images,
            tags: data.product.tags,
            isNegotiable: data.product.is_negotiable,
            isUrgent: data.product.is_urgent,
            sellerId: data.product.seller_id,
            createdAt: data.product.created_at,
            updatedAt: data.product.updated_at,
            featured: data.product.featured,
          }
        : undefined,
      buyer: data.buyer
        ? {
            id: data.buyer.id,
            email: data.buyer.email,
            firstName: data.buyer.first_name,
            lastName: data.buyer.last_name,
            role: data.buyer.role,
            isVerified: data.buyer.is_verified,
            profilePicture: data.buyer.profile_picture,
            createdAt: data.buyer.created_at,
            rating: data.buyer.rating,
          }
        : undefined,
      seller: data.seller
        ? {
            id: data.seller.id,
            email: data.seller.email,
            firstName: data.seller.first_name,
            lastName: data.seller.last_name,
            role: data.seller.role,
            isVerified: data.seller.is_verified,
            profilePicture: data.seller.profile_picture,
            createdAt: data.seller.created_at,
            rating: data.seller.rating,
          }
        : undefined,
    }
  } catch (error) {
    console.error("Error in getOrderById:", error)
    // Fallback to mock data
    return ordersWithDetails.find((o) => o.id === id) || null
  }
}

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        product:product_id (
          id, name, price, description, category_id, condition, images, tags, 
          is_negotiable, is_urgent, seller_id, created_at, updated_at, featured
        ),
        buyer:buyer_id (
          id, email, first_name, last_name, role, is_verified, profile_picture, created_at, rating
        ),
        seller:seller_id (
          id, email, first_name, last_name, role, is_verified, profile_picture, created_at, rating
        )
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user orders:", error)
      // Fallback to mock data
      return ordersWithDetails.filter((o) => o.buyerId === userId || o.sellerId === userId)
    }

    return data.map((item) => ({
      id: item.id,
      productId: item.product_id,
      buyerId: item.buyer_id,
      sellerId: item.seller_id,
      status: item.status,
      price: item.price,
      paymentMethod: item.payment_method,
      deliveryAddress: item.delivery_address,
      deliveryNotes: item.delivery_notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            description: item.product.description,
            categoryId: item.product.category_id,
            condition: item.product.condition,
            images: item.product.images,
            tags: item.product.tags,
            isNegotiable: item.product.is_negotiable,
            isUrgent: item.product.is_urgent,
            sellerId: item.product.seller_id,
            createdAt: item.product.created_at,
            updatedAt: item.product.updated_at,
            featured: item.product.featured,
          }
        : undefined,
      buyer: item.buyer
        ? {
            id: item.buyer.id,
            email: item.buyer.email,
            firstName: item.buyer.first_name,
            lastName: item.buyer.last_name,
            role: item.buyer.role,
            isVerified: item.buyer.is_verified,
            profilePicture: item.buyer.profile_picture,
            createdAt: item.buyer.created_at,
            rating: item.buyer.rating,
          }
        : undefined,
      seller: item.seller
        ? {
            id: item.seller.id,
            email: item.seller.email,
            firstName: item.seller.first_name,
            lastName: item.seller.last_name,
            role: item.seller.role,
            isVerified: item.seller.is_verified,
            profilePicture: item.seller.profile_picture,
            createdAt: item.seller.created_at,
            rating: item.seller.rating,
          }
        : undefined,
    }))
  } catch (error) {
    console.error("Error in getUserOrders:", error)
    // Fallback to mock data
    return ordersWithDetails.filter((o) => o.buyerId === userId || o.sellerId === userId)
  }
}

export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        product_id: orderData.productId || "",
        buyer_id: orderData.buyerId || "",
        seller_id: orderData.sellerId || "",
        status: "pending",
        price: orderData.price || 0,
        payment_method: orderData.paymentMethod || "cash",
        delivery_address: orderData.deliveryAddress,
        delivery_notes: orderData.deliveryNotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating order:", error)
      throw error
    }

    // Fetch related data
    const { data: product } = await supabase.from("products").select("*").eq("id", data.product_id).single()
    const { data: buyer } = await supabase.from("users").select("*").eq("id", data.buyer_id).single()
    const { data: seller } = await supabase.from("users").select("*").eq("id", data.seller_id).single()

    return {
      id: data.id,
      productId: data.product_id,
      buyerId: data.buyer_id,
      sellerId: data.seller_id,
      status: data.status,
      price: data.price,
      paymentMethod: data.payment_method,
      deliveryAddress: data.delivery_address,
      deliveryNotes: data.delivery_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      product: product
        ? {
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            categoryId: product.category_id,
            condition: product.condition,
            images: product.images,
            tags: product.tags,
            isNegotiable: product.is_negotiable,
            isUrgent: product.is_urgent,
            sellerId: product.seller_id,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
            featured: product.featured,
          }
        : undefined,
      buyer: buyer
        ? {
            id: buyer.id,
            email: buyer.email,
            firstName: buyer.first_name,
            lastName: buyer.last_name,
            role: buyer.role,
            isVerified: buyer.is_verified,
            profilePicture: buyer.profile_picture,
            createdAt: buyer.created_at,
            rating: buyer.rating,
          }
        : undefined,
      seller: seller
        ? {
            id: seller.id,
            email: seller.email,
            firstName: seller.first_name,
            lastName: seller.last_name,
            role: seller.role,
            isVerified: seller.is_verified,
            profilePicture: seller.profile_picture,
            createdAt: seller.created_at,
            rating: seller.rating,
          }
        : undefined,
    }
  } catch (error) {
    console.error("Error in createOrder:", error)
    throw error
  }
}

export const updateOrderStatus = async (orderId: string, status: Order["status"]): Promise<Order> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single()

    if (error) {
      console.error("Error updating order status:", error)
      throw error
    }

    // Fetch related data
    const { data: product } = await supabase.from("products").select("*").eq("id", data.product_id).single()
    const { data: buyer } = await supabase.from("users").select("*").eq("id", data.buyer_id).single()
    const { data: seller } = await supabase.from("users").select("*").eq("id", data.seller_id).single()

    return {
      id: data.id,
      productId: data.product_id,
      buyerId: data.buyer_id,
      sellerId: data.seller_id,
      status: data.status,
      price: data.price,
      paymentMethod: data.payment_method,
      deliveryAddress: data.delivery_address,
      deliveryNotes: data.delivery_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      product: product
        ? {
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            categoryId: product.category_id,
            condition: product.condition,
            images: product.images,
            tags: product.tags,
            isNegotiable: product.is_negotiable,
            isUrgent: product.is_urgent,
            sellerId: product.seller_id,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
            featured: product.featured,
          }
        : undefined,
      buyer: buyer
        ? {
            id: buyer.id,
            email: buyer.email,
            firstName: buyer.first_name,
            lastName: buyer.last_name,
            role: buyer.role,
            isVerified: buyer.is_verified,
            profilePicture: buyer.profile_picture,
            createdAt: buyer.created_at,
            rating: buyer.rating,
          }
        : undefined,
      seller: seller
        ? {
            id: seller.id,
            email: seller.email,
            firstName: seller.first_name,
            lastName: seller.last_name,
            role: seller.role,
            isVerified: seller.is_verified,
            profilePicture: seller.profile_picture,
            createdAt: seller.created_at,
            rating: seller.rating,
          }
        : undefined,
    }
  } catch (error) {
    console.error("Error in updateOrderStatus:", error)
    throw error
  }
}

// Conversations
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    // First, get all conversations where the user is a participant
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        messages:messages (
          id, conversation_id, sender_id, text, timestamp, read
        )
      `)
      .contains("participants", [userId])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching conversations:", error)
      // Fallback to mock data
      return mockConversations.filter((c) => c.participants.includes(userId))
    }

    // Process each conversation to get the other user and last message
    const conversationsWithDetails = await Promise.all(
      data.map(async (conversation) => {
        // Find the other user in the conversation
        const otherUserId = conversation.participants.find((id: string) => id !== userId)
        let otherUser = null

        if (otherUserId) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", otherUserId)
            .single()

          if (userError) {
            console.error("Error fetching other user:", userError)
          } else {
            otherUser = {
              id: userData.id,
              email: userData.email,
              firstName: userData.first_name,
              lastName: userData.last_name,
              role: userData.role,
              isVerified: userData.is_verified,
              profilePicture: userData.profile_picture,
              createdAt: userData.created_at,
              rating: userData.rating,
            }
          }
        }

        // Get product details if available
        let productName = null
        let productImage = null

        if (conversation.product_id) {
          const { data: productData, error: productError } = await supabase
            .from("products")
            .select("name, images")
            .eq("id", conversation.product_id)
            .single()

          if (productError) {
            console.error("Error fetching product details:", productError)
          } else {
            productName = productData.name
            productImage = productData.images && productData.images.length > 0 ? productData.images[0] : null
          }
        }

        // Get the last message
        let lastMessage = { text: "", timestamp: conversation.created_at }
        let unreadCount = 0

        if (conversation.messages && conversation.messages.length > 0) {
          // Sort messages by timestamp
          const sortedMessages = [...conversation.messages].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )

          // Get the last message
          lastMessage = {
            text: sortedMessages[0].text,
            timestamp: sortedMessages[0].timestamp,
          }

          // Count unread messages
          unreadCount = sortedMessages.filter((msg) => msg.sender_id !== userId && !msg.read).length
        }

        return {
          id: conversation.id,
          participants: conversation.participants,
          otherUser: otherUser,
          lastMessage,
          unreadCount,
          productId: conversation.product_id,
          productName,
          productImage,
        }
      }),
    )

    return conversationsWithDetails
  } catch (error) {
    console.error("Error in getConversations:", error)
    // Fallback to mock data
    return mockConversations.filter((c) => c.participants.includes(userId))
  }
}

export const getConversationById = async (id: string): Promise<Conversation | null> => {
  try {
    const { data, error } = await supabase.from("conversations").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching conversation:", error)
      // Fallback to mock data
      return mockConversations.find((c) => c.id === id) || null
    }

    // Get the other user details
    const otherUserId = data.participants[0] // This is simplified, you'd need to know the current user
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", otherUserId).single()

    if (userError) {
      console.error("Error fetching other user:", userError)
    }

    // Get product details if available
    let productName = null
    let productImage = null

    if (data.product_id) {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("name, images")
        .eq("id", data.product_id)
        .single()

      if (productError) {
        console.error("Error fetching product details:", productError)
      } else {
        productName = productData.name
        productImage = productData.images && productData.images.length > 0 ? productData.images[0] : null
      }
    }

    // Get the last message
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("timestamp", { ascending: false })
      .limit(1)

    if (messagesError) {
      console.error("Error fetching last message:", messagesError)
    }

    const lastMessage =
      messagesData && messagesData.length > 0
        ? {
            text: messagesData[0].text,
            timestamp: messagesData[0].timestamp,
          }
        : {
            text: "",
            timestamp: data.created_at,
          }

    // Count unread messages
    const { count, error: countError } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", id)
      .eq("read", false)
      .neq("sender_id", otherUserId) // Assuming we're counting messages not from the other user

    if (countError) {
      console.error("Error counting unread messages:", countError)
    }

    return {
      id: data.id,
      participants: data.participants,
      otherUser: userData
        ? {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            role: userData.role,
            isVerified: userData.is_verified,
            profilePicture: userData.profile_picture,
            createdAt: userData.created_at,
            rating: userData.rating,
          }
        : null,
      lastMessage,
      unreadCount: count || 0,
      productId: data.product_id,
      productName,
      productImage,
    }
  } catch (error) {
    console.error("Error in getConversationById:", error)
    // Fallback to mock data
    return mockConversations.find((c) => c.id === id) || null
  }
}

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      // Fallback to mock data
      return mockMessages[conversationId] || []
    }

    return data.map((message) => ({
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      text: message.text,
      timestamp: message.timestamp,
      read: message.read,
    }))
  } catch (error) {
    console.error("Error in getMessages:", error)
    // Fallback to mock data
    return mockMessages[conversationId] || []
  }
}

export const sendMessage = async (conversationId: string, senderId: string, text: string): Promise<Message> => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        text,
        timestamp: new Date().toISOString(),
        read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error sending message:", error)
      throw error
    }

    // Update the conversation's last activity
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId)

    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      text: data.text,
      timestamp: data.timestamp,
      read: data.read,
    }
  } catch (error) {
    console.error("Error in sendMessage:", error)
    throw error
  }
}

export const createConversation = async (
  userId: string,
  otherUserId: string,
  productId?: string,
): Promise<Conversation> => {
  try {
    // Check if a conversation already exists between these users
    const { data: existingConversations, error: checkError } = await supabase
      .from("conversations")
      .select("*")
      .contains("participants", [userId, otherUserId])

    if (checkError) {
      console.error("Error checking existing conversations:", checkError)
    } else if (existingConversations && existingConversations.length > 0) {
      // If a conversation exists with the same product, return it
      const existingConversation = existingConversations.find((c) => c.product_id === productId)
      if (existingConversation) {
        // Return the existing conversation
        return (await getConversationById(existingConversation.id)) as Conversation
      }
    }

    // Create a new conversation
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        participants: [userId, otherUserId],
        product_id: productId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating conversation:", error)
      throw error
    }

    // Get the other user details
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", otherUserId).single()

    if (userError) {
      console.error("Error fetching other user:", userError)
    }

    // Get product details if available
    let productName = null
    let productImage = null

    if (productId) {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("name, images")
        .eq("id", productId)
        .single()

      if (productError) {
        console.error("Error fetching product details:", productError)
      } else {
        productName = productData.name
        productImage = productData.images && productData.images.length > 0 ? productData.images[0] : null
      }
    }

    return {
      id: data.id,
      participants: data.participants,
      otherUser: userData
        ? {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            role: userData.role,
            isVerified: userData.is_verified,
            profilePicture: userData.profile_picture,
            createdAt: userData.created_at,
            rating: userData.rating,
          }
        : null,
      lastMessage: {
        text: "",
        timestamp: data.created_at,
      },
      unreadCount: 0,
      productId: data.product_id,
      productName,
      productImage,
    }
  } catch (error) {
    console.error("Error in createConversation:", error)
    throw error
  }
}

// Mock data for fallback
const mockUsers: User[] = [
  {
    id: "1",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "student",
    isVerified: true,
    profilePicture: null,
    createdAt: "2023-01-01T00:00:00Z",
    rating: 4.5,
  },
  {
    id: "2",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "student",
    isVerified: false,
    profilePicture: null,
    createdAt: "2023-01-02T00:00:00Z",
    rating: 4.8,
  },
  {
    id: "3",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    isVerified: true,
    profilePicture: null,
    createdAt: "2023-01-03T00:00:00Z",
  },
]

const mockCategories: Category[] = [
  { id: "books", name: "Books", icon: "book" },
  { id: "tech", name: "Tech", icon: "devices" },
  { id: "fashion", name: "Fashion", icon: "checkroom" },
  { id: "food", name: "Food", icon: "fastfood" },
  { id: "room", name: "Room Essentials", icon: "bed" },
  { id: "handmade", name: "Handmade Items", icon: "handyman" },
]

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Calculus Textbook",
    price: 45.99,
    description: "Calculus: Early Transcendentals, 8th Edition. In excellent condition with minimal highlighting.",
    categoryId: "books",
    condition: "good",
    images: ["/placeholder.svg?height=300&width=300"],
    tags: ["textbook", "math", "calculus"],
    isNegotiable: true,
    isUrgent: false,
    sellerId: "1",
    createdAt: "2023-05-15T10:30:00Z",
    updatedAt: "2023-05-15T10:30:00Z",
    featured: true,
  },
  {
    id: "2",
    name: "MacBook Pro 2019",
    price: 899.99,
    description: "13-inch MacBook Pro (2019) with 256GB SSD, 8GB RAM. Includes charger and protective case.",
    categoryId: "tech",
    condition: "used",
    images: ["/placeholder.svg?height=300&width=300"],
    tags: ["laptop", "apple", "macbook"],
    isNegotiable: false,
    isUrgent: true,
    sellerId: "2",
    createdAt: "2023-05-16T14:20:00Z",
    updatedAt: "2023-05-16T14:20:00Z",
    featured: true,
  },
  {
    id: "3",
    name: "Nike Running Shoes",
    price: 65.0,
    description: "Nike Air Zoom Pegasus 38, size 10. Used for one semester only, still in great condition.",
    categoryId: "fashion",
    condition: "good",
    images: ["/placeholder.svg?height=300&width=300"],
    tags: ["shoes", "nike", "running"],
    isNegotiable: true,
    isUrgent: false,
    sellerId: "1",
    createdAt: "2023-05-17T09:15:00Z",
    updatedAt: "2023-05-17T09:15:00Z",
  },
  {
    id: "4",
    name: "Desk Lamp",
    price: 15.5,
    description: "Adjustable LED desk lamp with multiple brightness settings and USB charging port.",
    categoryId: "room",
    condition: "like_new",
    images: ["/placeholder.svg?height=300&width=300"],
    tags: ["lamp", "led", "desk"],
    isNegotiable: true,
    isUrgent: false,
    sellerId: "2",
    createdAt: "2023-05-18T16:45:00Z",
    updatedAt: "2023-05-18T16:45:00Z",
  },
  {
    id: "5",
    name: "Homemade Cookies",
    price: 8.0,
    description: "Freshly baked chocolate chip cookies. Pack of 12. Can deliver on campus.",
    categoryId: "food",
    condition: "new",
    images: ["/placeholder.svg?height=300&width=300"],
    tags: ["food", "cookies", "homemade"],
    isNegotiable: false,
    isUrgent: true,
    sellerId: "1",
    createdAt: "2023-05-19T11:30:00Z",
    updatedAt: "2023-05-19T11:30:00Z",
    featured: true,
  },
  {
    id: "6",
    name: "Hand-knitted Scarf",
    price: 25.0,
    description: "Handmade wool scarf, 6ft long. Perfect for winter. Multiple colors available.",
    categoryId: "handmade",
    condition: "new",
    images: ["/placeholder.svg?height=300&width=300"],
    tags: ["scarf", "handmade", "winter"],
    isNegotiable: true,
    isUrgent: false,
    sellerId: "2",
    createdAt: "2023-05-20T13:20:00Z",
    updatedAt: "2023-05-20T13:20:00Z",
  },
]

// Add seller information to products
const productsWithSellers = mockProducts.map((product) => {
  const seller = mockUsers.find((user) => user.id === product.sellerId)
  return { ...product, seller }
})

const mockOrders: Order[] = [
  {
    id: "1",
    productId: "1",
    buyerId: "2",
    sellerId: "1",
    status: "delivered",
    price: 45.99,
    paymentMethod: "cash",
    deliveryAddress: "Campus Dorm B, Room 203",
    createdAt: "2023-05-16T15:30:00Z",
    updatedAt: "2023-05-17T14:20:00Z",
  },
  {
    id: "2",
    productId: "3",
    buyerId: "1",
    sellerId: "2",
    status: "confirmed",
    price: 65.0,
    paymentMethod: "cash",
    deliveryAddress: "Student Center",
    deliveryNotes: "Meet at the main entrance",
    createdAt: "2023-05-18T10:15:00Z",
    updatedAt: "2023-05-18T11:30:00Z",
  },
  {
    id: "3",
    productId: "5",
    buyerId: "2",
    sellerId: "1",
    status: "pending",
    price: 8.0,
    paymentMethod: "cash",
    deliveryAddress: "Library, Study Room 4",
    createdAt: "2023-05-19T16:45:00Z",
    updatedAt: "2023-05-19T16:45:00Z",
  },
]

// Add product and user information to orders
const ordersWithDetails = mockOrders.map((order) => {
  const product = productsWithSellers.find((p) => p.id === order.productId)
  const buyer = mockUsers.find((user) => user.id === order.buyerId)
  const seller = mockUsers.find((user) => user.id === order.sellerId)
  return { ...order, product, buyer, seller }
})

const mockConversations: Conversation[] = [
  {
    id: "1",
    participants: ["1", "2"],
    otherUser: mockUsers[1], // Jane for John
    lastMessage: {
      text: "Is the textbook still available?",
      timestamp: "2023-05-16T14:30:00Z",
    },
    unreadCount: 1,
    productId: "1",
    productName: "Calculus Textbook",
    productImage: "/placeholder.svg?height=300&width=300",
  },
  {
    id: "2",
    participants: ["2", "1"],
    otherUser: mockUsers[0], // John for Jane
    lastMessage: {
      text: "Yes, it is! When would you like to meet?",
      timestamp: "2023-05-16T14:35:00Z",
    },
    unreadCount: 0,
    productId: "1",
    productName: "Calculus Textbook",
    productImage: "/placeholder.svg?height=300&width=300",
  },
  {
    id: "3",
    participants: ["1", "2"],
    otherUser: mockUsers[1], // Jane for John
    lastMessage: {
      text: "Do you deliver the cookies to North Campus?",
      timestamp: "2023-05-19T12:15:00Z",
    },
    unreadCount: 2,
    productId: "5",
    productName: "Homemade Cookies",
    productImage: "/placeholder.svg?height=300&width=300",
  },
]

const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "1",
      conversationId: "1",
      senderId: "2",
      text: "Hi, I saw your listing for the Calculus textbook.",
      timestamp: "2023-05-16T14:25:00Z",
      read: true,
    },
    {
      id: "2",
      conversationId: "1",
      senderId: "2",
      text: "Is the textbook still available?",
      timestamp: "2023-05-16T14:30:00Z",
      read: false,
    },
  ],
  "2": [
    {
      id: "3",
      conversationId: "2",
      senderId: "2",
      text: "Hi, I saw your listing for the Calculus textbook.",
      timestamp: "2023-05-16T14:25:00Z",
      read: true,
    },
    {
      id: "4",
      conversationId: "2",
      senderId: "2",
      text: "Is the textbook still available?",
      timestamp: "2023-05-16T14:30:00Z",
      read: true,
    },
    {
      id: "5",
      conversationId: "2",
      senderId: "1",
      text: "Yes, it is! When would you like to meet?",
      timestamp: "2023-05-16T14:35:00Z",
      read: true,
    },
  ],
  "3": [
    {
      id: "6",
      conversationId: "3",
      senderId: "2",
      text: "Hello, I'm interested in your homemade cookies.",
      timestamp: "2023-05-19T12:10:00Z",
      read: true,
    },
    {
      id: "7",
      conversationId: "3",
      senderId: "2",
      text: "Do you deliver the cookies to North Campus?",
      timestamp: "2023-05-19T12:15:00Z",
      read: false,
    },
    {
      id: "8",
      conversationId: "3",
      senderId: "2",
      text: "Also, are they nut-free?",
      timestamp: "2023-05-19T12:16:00Z",
      read: false,
    },
  ],
}
