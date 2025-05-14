"use client"

import { useState, useEffect } from "react"
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js"
import { useNetwork } from "@/providers/network-provider"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface QueryOptions<T> {
  key: string
  query: () => PostgrestFilterBuilder<any, any, T[], unknown>
  enabled?: boolean
  onSuccess?: (data: T[]) => void
  onError?: (error: Error) => void
  dependencies?: any[]
  cacheTime?: number // in milliseconds
}

export function useSupabaseQuery<T>({
  key,
  query,
  enabled = true,
  onSuccess,
  onError,
  dependencies = [],
  cacheTime = 5 * 60 * 1000, // 5 minutes default
}: QueryOptions<T>) {
  const [data, setData] = useState<T[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const { isConnected } = useNetwork()

  useEffect(() => {
    const fetchData = async () => {
      if (!enabled || !isConnected) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Try to get from cache first
        const cachedData = await getCachedData(key)
        if (cachedData) {
          setData(cachedData)
          setLoading(false)

          // If cache is fresh enough, don't fetch again
          const cacheTimestamp = await getCacheTimestamp(key)
          if (cacheTimestamp && Date.now() - cacheTimestamp < cacheTime) {
            return
          }
        }

        // Fetch fresh data
        const { data: freshData, error } = await query()

        if (error) {
          throw error
        }

        if (freshData) {
          setData(freshData)
          setCachedData(key, freshData)
          onSuccess?.(freshData)
        }
      } catch (err: any) {
        console.error(`Query error for ${key}:`, err)
        setError(err)
        onError?.(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [key, isConnected, enabled, ...dependencies])

  const refetch = async () => {
    if (!isConnected) return

    try {
      setLoading(true)
      const { data: freshData, error } = await query()

      if (error) {
        throw error
      }

      if (freshData) {
        setData(freshData)
        setCachedData(key, freshData)
        onSuccess?.(freshData)
      }
    } catch (err: any) {
      console.error(`Refetch error for ${key}:`, err)
      setError(err)
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }

  return { data, error, loading, refetch }
}

// Cache helpers
async function getCachedData<T>(key: string): Promise<T[] | null> {
  try {
    const cachedData = await AsyncStorage.getItem(`query_cache_${key}`)
    return cachedData ? JSON.parse(cachedData) : null
  } catch (error) {
    console.error("Error retrieving cached data:", error)
    return null
  }
}

async function setCachedData<T>(key: string, data: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(`query_cache_${key}`, JSON.stringify(data))
    await AsyncStorage.setItem(`query_cache_timestamp_${key}`, Date.now().toString())
  } catch (error) {
    console.error("Error caching data:", error)
  }
}

async function getCacheTimestamp(key: string): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(`query_cache_timestamp_${key}`)
    return timestamp ? Number.parseInt(timestamp, 10) : null
  } catch (error) {
    console.error("Error retrieving cache timestamp:", error)
    return null
  }
}
