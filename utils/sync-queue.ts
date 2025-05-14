import { addToSyncQueue, getSyncQueue, clearSyncQueue } from "./storage"
import { createProduct, createOrder, sendMessage } from "@/services/api"

// Queue operations for when offline
export const queueProductCreation = async (productData: any): Promise<void> => {
  await addToSyncQueue({
    type: "CREATE_PRODUCT",
    data: productData,
  })
}

export const queueOrderCreation = async (orderData: any): Promise<void> => {
  await addToSyncQueue({
    type: "CREATE_ORDER",
    data: orderData,
  })
}

export const queueMessageSend = async (conversationId: string, senderId: string, text: string): Promise<void> => {
  await addToSyncQueue({
    type: "SEND_MESSAGE",
    data: { conversationId, senderId, text },
  })
}

// Process the queue when back online
export const processSyncQueue = async (): Promise<void> => {
  const queue = await getSyncQueue()

  if (queue.length === 0) return

  const errors: any[] = []

  for (const item of queue) {
    try {
      switch (item.type) {
        case "CREATE_PRODUCT":
          await createProduct(item.data)
          break
        case "CREATE_ORDER":
          await createOrder(item.data)
          break
        case "SEND_MESSAGE":
          const { conversationId, senderId, text } = item.data
          await sendMessage(conversationId, senderId, text)
          break
        default:
          console.warn("Unknown operation type:", item.type)
      }
    } catch (error) {
      console.error(`Error processing queue item ${item.type}:`, error)
      errors.push({ item, error })
    }
  }

  if (errors.length === 0) {
    // If all operations succeeded, clear the queue
    await clearSyncQueue()
  } else {
    // If some operations failed, keep them in the queue
    const failedItems = errors.map((e) => e.item)
    await clearSyncQueue()
    for (const item of failedItems) {
      await addToSyncQueue(item)
    }
  }
}
