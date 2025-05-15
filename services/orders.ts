import { supabase } from "@/lib/supabase"
import type { Order, OrderTransaction } from "@/types"

export async function getOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      listing:listing_id(*),
      accommodation:accommodation_id(*)
      `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    throw error
  }

  return data || []
}

export async function getOrderById(orderId: string | number): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      listing:listing_id(*),
      accommodation:accommodation_id(*)
      `,
    )
    .eq("id", orderId)
    .single()

  if (error) {
    console.error("Error fetching order:", error)
    throw error
  }

  return data
}

export async function createOrder(order: Partial<Order>): Promise<Order> {
  const { data, error } = await supabase.from("orders").insert(order).select().single()

  if (error) {
    console.error("Error creating order:", error)
    throw error
  }

  return data
}

export async function updateOrderStatus(
  orderId: string | number,
  status: Order["status"],
  paymentStatus?: Order["payment_status"],
): Promise<Order> {
  const updates: Partial<Order> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (paymentStatus) {
    updates.payment_status = paymentStatus
  }

  const { data, error } = await supabase.from("orders").update(updates).eq("id", orderId).select().single()

  if (error) {
    console.error("Error updating order status:", error)
    throw error
  }

  return data
}

export async function getOrderTransactions(orderId: string | number): Promise<OrderTransaction[]> {
  const { data, error } = await supabase
    .from("order_transactions")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching order transactions:", error)
    throw error
  }

  return data || []
}

export async function createOrderTransaction(transaction: Partial<OrderTransaction>): Promise<OrderTransaction> {
  const { data, error } = await supabase.from("order_transactions").insert(transaction).select().single()

  if (error) {
    console.error("Error creating order transaction:", error)
    throw error
  }

  return data
}
