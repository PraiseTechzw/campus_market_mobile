"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

type SessionContextType = {
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  needsOnboarding: boolean
  setNeedsOnboarding: (value: boolean) => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (session) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("first_name, last_name, campus_id")
            .eq("id", session.user.id)
            .single()

          if (error) throw error

          // If any of these fields are missing, user needs onboarding
          setNeedsOnboarding(!data.first_name || !data.last_name || !data.campus_id)
        } catch (error) {
          console.error("Error checking onboarding status:", error)
          setNeedsOnboarding(true)
        }
      }
    }

    if (session) {
      checkOnboardingStatus()
    }
  }, [session])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  const refreshSession = async () => {
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
  }

  return (
    <SessionContext.Provider
      value={{ session, isLoading, signOut, refreshSession, needsOnboarding, setNeedsOnboarding }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
