import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import { supabase } from "./supabase"

// Keys for storing pending operations
const PENDING_OPERATIONS_KEY = "pendingOperations"

// Types for pending operations
type OperationType = "insert" | "update" | "delete"

interface PendingOperation {
  id: string
  table: string
  type: OperationType
  data: any
  timestamp: number
}

// Function to add a pending operation
export async function addPendingOperation(table: string, type: OperationType, data: any): Promise<string> {
  try {
    const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const operation: PendingOperation = {
      id: operationId,
      table,
      type,
      data,
      timestamp: Date.now(),
    }

    // Get existing pending operations
    const existingOperationsJson = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY)
    const existingOperations: PendingOperation[] = existingOperationsJson ? JSON.parse(existingOperationsJson) : []

    // Add new operation
    const updatedOperations = [...existingOperations, operation]
    await AsyncStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(updatedOperations))

    return operationId
  } catch (error) {
    console.error("Error adding pending operation:", error)
    throw error
  }
}

// Function to remove a pending operation
export async function removePendingOperation(operationId: string): Promise<void> {
  try {
    const existingOperationsJson = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY)
    if (!existingOperationsJson) return

    const existingOperations: PendingOperation[] = JSON.parse(existingOperationsJson)
    const updatedOperations = existingOperations.filter((operation) => operation.id !== operationId)

    await AsyncStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(updatedOperations))
  } catch (error) {
    console.error("Error removing pending operation:", error)
    throw error
  }
}

// Function to get all pending operations
export async function getPendingOperations(): Promise<PendingOperation[]> {
  try {
    const operationsJson = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY)
    return operationsJson ? JSON.parse(operationsJson) : []
  } catch (error) {
    console.error("Error getting pending operations:", error)
    return []
  }
}

// Function to process a single operation
async function processOperation(operation: PendingOperation): Promise<boolean> {
  try {
    const { table, type, data } = operation

    switch (type) {
      case "insert":
        const { error: insertError } = await supabase.from(table).insert(data)
        if (insertError) throw insertError
        break

      case "update":
        const { id, ...updateData } = data
        const { error: updateError } = await supabase.from(table).update(updateData).eq("id", id)
        if (updateError) throw updateError
        break

      case "delete":
        const { error: deleteError } = await supabase.from(table).delete().eq("id", data.id)
        if (deleteError) throw deleteError
        break

      default:
        throw new Error(`Unknown operation type: ${type}`)
    }

    return true
  } catch (error) {
    console.error(`Error processing operation ${operation.id}:`, error)
    return false
  }
}

// Function to sync all pending operations
export async function syncPendingOperations(): Promise<{
  success: boolean
  synced: number
  failed: number
}> {
  try {
    // Check if we're online
    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) {
      return { success: false, synced: 0, failed: 0 }
    }

    const operations = await getPendingOperations()
    if (operations.length === 0) {
      return { success: true, synced: 0, failed: 0 }
    }

    let synced = 0
    let failed = 0

    // Process operations in order (oldest first)
    const sortedOperations = operations.sort((a, b) => a.timestamp - b.timestamp)

    for (const operation of sortedOperations) {
      const success = await processOperation(operation)
      if (success) {
        await removePendingOperation(operation.id)
        synced++
      } else {
        failed++
      }
    }

    return {
      success: failed === 0,
      synced,
      failed,
    }
  } catch (error) {
    console.error("Error syncing pending operations:", error)
    return { success: false, synced: 0, failed: 0 }
  }
}

// Function to initialize background sync
export function initBackgroundSync(intervalMs = 60000): () => void {
  const interval = setInterval(async () => {
    try {
      const netInfo = await NetInfo.fetch()
      if (netInfo.isConnected) {
        await syncPendingOperations()
      }
    } catch (error) {
      console.error("Error in background sync:", error)
    }
  }, intervalMs)

  // Return a cleanup function
  return () => clearInterval(interval)
}
