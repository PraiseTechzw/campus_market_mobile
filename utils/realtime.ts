"use client"

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

/**
 * Hook to subscribe to realtime changes on a Supabase table
 * @param table Table name
 * @param column Column to filter on (optional)
 * @param value Value to filter on (optional)
 * @returns Array of records and loading state
 */
export function useRealtimeSubscription<T>(table: string, column?: string, value?: string) {
  const [records, setRecords] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        setLoading(true)
        let query = supabase.from(table).select("*")

        if (column && value) {
          query = query.eq(column, value)
        }

        const { data, error } = await query

        if (error) {
          console.error(`Error fetching ${table}:`, error)
          return
        }

        setRecords(data as T[])
      } catch (error) {
        console.error(`Error in useRealtimeSubscription for ${table}:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up realtime subscription
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(column && value ? { filter: `${column}=eq.${value}` } : {}),
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRecords((current) => [...current, payload.new as T])
          } else if (payload.eventType === "UPDATE") {
            setRecords((current) => current.map((record: any) => (record.id === payload.new.id ? payload.new : record)))
          } else if (payload.eventType === "DELETE") {
            setRecords((current) => current.filter((record: any) => record.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [table, column, value])

  return { records, loading }
}

/**
 * Hook to subscribe to realtime changes on a specific record
 * @param table Table name
 * @param id Record ID
 * @returns Record and loading state
 */
export function useRealtimeRecord<T>(table: string, id: string) {
  const [record, setRecord] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    // Initial fetch
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from(table).select("*").eq("id", id).single()

        if (error) {
          console.error(`Error fetching ${table} record:`, error)
          return
        }

        setRecord(data as T)
      } catch (error) {
        console.error(`Error in useRealtimeRecord for ${table}:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up realtime subscription
    const subscription = supabase
      .channel(`${table}_${id}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setRecord(payload.new as T)
          } else if (payload.eventType === "DELETE") {
            setRecord(null)
          }
        },
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [table, id])

  return { record, loading }
}

/**
 * Hook to subscribe to realtime changes on messages in a conversation
 * @param conversationId Conversation ID
 * @returns Messages array and loading state
 */
export function useRealtimeMessages(conversationId: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!conversationId) return

    // Initial fetch
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("timestamp", { ascending: true })

        if (error) {
          console.error("Error fetching messages:", error)
          return
        }

        setMessages(data)
      } catch (error) {
        console.error("Error in useRealtimeMessages:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up realtime subscription
    const subscription = supabase
      .channel(`messages_${conversationId}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((current) => [...current, payload.new])
          } else if (payload.eventType === "UPDATE") {
            setMessages((current) => current.map((message) => (message.id === payload.new.id ? payload.new : message)))
          } else if (payload.eventType === "DELETE") {
            setMessages((current) => current.filter((message) => message.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [conversationId])

  return { messages, loading }
}
