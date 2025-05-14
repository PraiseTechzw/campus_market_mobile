"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import NetInfo from "@react-native-community/netinfo"

interface NetworkContextType {
  isConnected: boolean
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

export function useNetwork() {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider")
  }
  return context
}

interface NetworkProviderProps {
  children: ReactNode
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true)
    })

    // Initial check
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? true)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  return <NetworkContext.Provider value={{ isConnected }}>{children}</NetworkContext.Provider>
}
