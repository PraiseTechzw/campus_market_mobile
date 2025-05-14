"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import {
  isOnboardingComplete,
  markOnboardingComplete,
  type UserPreferences,
  saveUserPreferences,
} from "@/utils/onboarding"

interface OnboardingContextType {
  isComplete: boolean
  loading: boolean
  completeOnboarding: () => Promise<void>
  savePreferences: (preferences: UserPreferences) => Promise<void>
  preferences: UserPreferences
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isComplete, setIsComplete] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [preferences, setPreferences] = useState<UserPreferences>({})

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await isOnboardingComplete()
        setIsComplete(completed)
      } catch (error) {
        console.error("Error checking onboarding status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkOnboarding()
  }, [])

  const completeOnboarding = async () => {
    try {
      await markOnboardingComplete()
      setIsComplete(true)
    } catch (error) {
      console.error("Error completing onboarding:", error)
    }
  }

  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      await saveUserPreferences(newPreferences)
      setPreferences((prev) => ({ ...prev, ...newPreferences }))
    } catch (error) {
      console.error("Error saving preferences:", error)
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        isComplete,
        loading,
        completeOnboarding,
        savePreferences,
        preferences,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
