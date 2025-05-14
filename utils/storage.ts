import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Product, Order, Conversation } from "@/types"
import type { Banner } from "@/services/banner-service"

// Products
export const saveLocalProducts = async (products: Product[]): Promise<void> => {
  try {
    await AsyncStorage.setItem("local_products", JSON.stringify(products))
  } catch (error) {
    console.error("Error saving products to storage:", error)
  }
}

export const getLocalProducts = async (): Promise<Product[]> => {
  try {
    const productsJson = await AsyncStorage.getItem("local_products")
    return productsJson ? JSON.parse(productsJson) : []
  } catch (error) {
    console.error("Error getting products from storage:", error)
    return []
  }
}

export const getLocalUserProducts = async (userId: string): Promise<Product[]> => {
  try {
    const products = await getLocalProducts()
    return products.filter((product) => product.sellerId === userId)
  } catch (error) {
    console.error("Error getting user products from storage:", error)
    return []
  }
}

export const saveLocalProduct = async (product: Product): Promise<void> => {
  try {
    const products = await getLocalProducts()
    const existingIndex = products.findIndex((p) => p.id === product.id)

    if (existingIndex >= 0) {
      products[existingIndex] = product
    } else {
      products.push(product)
    }

    await saveLocalProducts(products)
  } catch (error) {
    console.error("Error saving product to storage:", error)
  }
}

// Orders
export const saveLocalOrders = async (orders: Order[]): Promise<void> => {
  try {
    await AsyncStorage.setItem("local_orders", JSON.stringify(orders))
  } catch (error) {
    console.error("Error saving orders to storage:", error)
  }
}

export const getLocalOrders = async (): Promise<Order[]> => {
  try {
    const ordersJson = await AsyncStorage.getItem("local_orders")
    return ordersJson ? JSON.parse(ordersJson) : []
  } catch (error) {
    console.error("Error getting orders from storage:", error)
    return []
  }
}

export const getLocalUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const orders = await getLocalOrders()
    return orders.filter((order) => order.buyerId === userId || order.sellerId === userId)
  } catch (error) {
    console.error("Error getting user orders from storage:", error)
    return []
  }
}

export const saveLocalOrder = async (order: Order): Promise<void> => {
  try {
    const orders = await getLocalOrders()
    const existingIndex = orders.findIndex((o) => o.id === order.id)

    if (existingIndex >= 0) {
      orders[existingIndex] = order
    } else {
      orders.push(order)
    }

    await saveLocalOrders(orders)
  } catch (error) {
    console.error("Error saving order to storage:", error)
  }
}

// Conversations
export const saveLocalConversations = async (conversations: Conversation[]): Promise<void> => {
  try {
    await AsyncStorage.setItem("local_conversations", JSON.stringify(conversations))
  } catch (error) {
    console.error("Error saving conversations to storage:", error)
  }
}

export const getLocalConversations = async (): Promise<Conversation[]> => {
  try {
    const conversationsJson = await AsyncStorage.getItem("local_conversations")
    return conversationsJson ? JSON.parse(conversationsJson) : []
  } catch (error) {
    console.error("Error getting conversations from storage:", error)
    return []
  }
}

export const saveLocalConversation = async (conversation: Conversation): Promise<void> => {
  try {
    const conversations = await getLocalConversations()
    const existingIndex = conversations.findIndex((c) => c.id === conversation.id)

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation
    } else {
      conversations.push(conversation)
    }

    await saveLocalConversations(conversations)
  } catch (error) {
    console.error("Error saving conversation to storage:", error)
  }
}

// Messages
export const saveLocalMessages = async (conversationId: string, messages: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(`local_messages_${conversationId}`, JSON.stringify(messages))
  } catch (error) {
    console.error("Error saving messages to storage:", error)
  }
}

export const getLocalMessages = async (conversationId: string): Promise<any[]> => {
  try {
    const messagesJson = await AsyncStorage.getItem(`local_messages_${conversationId}`)
    return messagesJson ? JSON.parse(messagesJson) : []
  } catch (error) {
    console.error("Error getting messages from storage:", error)
    return []
  }
}

// Banners
export const saveLocalBanners = async (banners: Banner[]): Promise<void> => {
  try {
    await AsyncStorage.setItem("local_banners", JSON.stringify(banners))
  } catch (error) {
    console.error("Error saving banners to storage:", error)
  }
}

export const getLocalBanners = async (): Promise<Banner[]> => {
  try {
    const bannersJson = await AsyncStorage.getItem("local_banners")
    return bannersJson ? JSON.parse(bannersJson) : []
  } catch (error) {
    console.error("Error getting banners from storage:", error)
    return []
  }
}

// Sync queue
export const getSyncQueue = async (): Promise<any[]> => {
  try {
    const queueJson = await AsyncStorage.getItem("sync_queue")
    return queueJson ? JSON.parse(queueJson) : []
  } catch (error) {
    console.error("Error getting sync queue from storage:", error)
    return []
  }
}

export const saveSyncQueue = async (queue: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem("sync_queue", JSON.stringify(queue))
  } catch (error) {
    console.error("Error saving sync queue to storage:", error)
  }
}

export const addToSyncQueue = async (operation: any): Promise<void> => {
  try {
    const queue = await getSyncQueue()
    queue.push({ ...operation, timestamp: new Date().toISOString() })
    await saveSyncQueue(queue)
  } catch (error) {
    console.error("Error adding to sync queue:", error)
  }
}

export const clearSyncQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("sync_queue")
  } catch (error) {
    console.error("Error clearing sync queue:", error)
  }
}
