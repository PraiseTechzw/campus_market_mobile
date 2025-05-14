"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Session, User, AuthError } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Linking from "expo-linking"
import { router } from "expo-router"
import Toast from "react-native-toast-message"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
  is_seller: boolean
  role: "student" | "admin"
  created_at: string
  updated_at: string
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateEmail: (email: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshSession: () => Promise<void>
  sendVerificationEmail: () => Promise<void>
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// URL for deep linking
const DEEP_LINK_PREFIX = Linking.createURL("/")

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    initialized: false,
  })

  // Handle deep links for auth flows
  useEffect(() => {
    const handleDeepLink = async (event: Linking.EventType) => {
      if (event.url.includes("type=recovery") || event.url.includes("type=signup")) {
        // Extract the token from the URL
        const params = new URLSearchParams(event.url.split("#")[1])
        const accessToken = params.get("access_token")
        const refreshToken = params.get("refresh_token")
        const type = params.get("type")

        if (accessToken && refreshToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (error) throw error

            if (type === "recovery") {
              // Navigate to password reset screen
              router.push("/reset-password")
            } else if (type === "signup") {
              // Handle email verification
              Toast.show({
                type: "success",
                text1: "Email Verified",
                text2: "Your email has been successfully verified.",
              })
            }
          } catch (error) {
            console.error("Error handling deep link:", error)
          }
        }
      }
    }

    // Add event listener for deep links
    const subscription = Linking.addEventListener("url", handleDeepLink)

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ type: "url", url })
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (sessionData?.session) {
          setState((prev) => ({
            ...prev,
            session: sessionData.session,
            user: sessionData.session.user,
          }))

          // Fetch user profile
          await fetchUserProfile(sessionData.session.user.id)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setState((prev) => ({ ...prev, loading: false, initialized: true }))
      }
    }

    initializeAuth()

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      setState((prev) => ({
        ...prev,
        session,
        user: session?.user || null,
      }))

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setState((prev) => ({ ...prev, profile: null }))
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        throw error
      }

      if (data) {
        setState((prev) => ({ ...prev, profile: data as UserProfile }))

        // Store profile in AsyncStorage for offline access
        await AsyncStorage.setItem("userProfile", JSON.stringify(data))
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)

      // Try to load from AsyncStorage if network request fails
      try {
        const storedProfile = await AsyncStorage.getItem("userProfile")
        if (storedProfile) {
          const profile = JSON.parse(storedProfile)
          if (profile.id === userId) {
            setState((prev) => ({ ...prev, profile: profile as UserProfile }))
          }
        }
      } catch (storageError) {
        console.error("Error loading profile from storage:", storageError)
      }
    }
  }

  const handleAuthError = (error: AuthError) => {
    console.error("Auth error:", error)

    let message = "An error occurred during authentication"

    // Map common Supabase error codes to user-friendly messages
    if (error.message.includes("Email not confirmed")) {
      message = "Please verify your email address before signing in"
    } else if (error.message.includes("Invalid login credentials")) {
      message = "Invalid email or password"
    } else if (error.message.includes("Email already registered")) {
      message = "This email is already registered"
    } else if (error.message.includes("Password should be")) {
      message = error.message
    } else {
      message = error.message
    }

    Toast.show({
      type: "error",
      text1: "Authentication Error",
      text2: message,
    })

    throw error
  }

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      // Create auth user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${DEEP_LINK_PREFIX}auth/callback?type=signup`,
          data: {
            full_name: `${userData.firstName} ${userData.lastName}`.trim(),
          },
        },
      })

      if (error) {
        handleAuthError(error)
      }

      if (data.user) {
        // Create user profile in the database
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            email,
            full_name: `${userData.firstName} ${userData.lastName}`.trim(),
            phone: null,
            avatar_url: null,
            bio: null,
            is_verified: false,
            is_seller: false,
            role: "student",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (profileError) {
          console.error("Error creating profile:", profileError)
          // If profile creation fails, we should delete the auth user
          // But Supabase doesn't expose this API directly to clients
        }

        Toast.show({
          type: "success",
          text1: "Account Created",
          text2: "Please check your email to verify your account",
        })
      }
    } catch (error) {
      console.error("Signup error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        handleAuthError(error)
      }

      if (data.user) {
        Toast.show({
          type: "success",
          text1: "Welcome Back",
          text2: `${data.user.user_metadata.first_name || "User"}`,
        })
      }
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const signOut = async () => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // Clear local storage
      await AsyncStorage.removeItem("userProfile")

      // Reset auth state
      setState((prev) => ({
        ...prev,
        session: null,
        user: null,
        profile: null,
      }))

      Toast.show({
        type: "success",
        text1: "Signed Out",
        text2: "You have been successfully signed out",
      })
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "An error occurred during sign out",
      })
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const resetPassword = async (email: string) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${DEEP_LINK_PREFIX}auth/callback?type=recovery`,
      })

      if (error) {
        handleAuthError(error)
      }

      Toast.show({
        type: "success",
        text1: "Password Reset Email Sent",
        text2: "Check your email for a password reset link",
      })
    } catch (error) {
      console.error("Password reset error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const updatePassword = async (password: string) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        handleAuthError(error)
      }

      Toast.show({
        type: "success",
        text1: "Password Updated",
        text2: "Your password has been successfully updated",
      })
    } catch (error) {
      console.error("Update password error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const updateEmail = async (email: string) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.updateUser({
        email,
        options: {
          emailRedirectTo: `${DEEP_LINK_PREFIX}auth/callback?type=email_change`,
        },
      })

      if (error) {
        handleAuthError(error)
      }

      Toast.show({
        type: "success",
        text1: "Verification Email Sent",
        text2: "Check your new email to verify the change",
      })
    } catch (error) {
      console.error("Update email error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      if (!state.user?.id) {
        throw new Error("User not authenticated")
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", state.user.id)

      if (error) {
        throw error
      }

      // Update local state
      if (state.profile) {
        const updatedProfile = { ...state.profile, ...updates }
        setState((prev) => ({ ...prev, profile: updatedProfile }))

        // Update AsyncStorage
        await AsyncStorage.setItem("userProfile", JSON.stringify(updatedProfile))
      }

      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your profile has been successfully updated",
      })
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "An error occurred while updating profile",
      })
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const refreshSession = async () => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        handleAuthError(error)
      }

      if (data.session) {
        setState((prev) => ({
          ...prev,
          session: data.session,
          user: data.session.user,
        }))
      }
    } catch (error) {
      console.error("Refresh session error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const sendVerificationEmail = async () => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      if (!state.user?.email) {
        throw new Error("User email not found")
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: state.user.email,
        options: {
          emailRedirectTo: `${DEEP_LINK_PREFIX}auth/callback?type=signup`,
        },
      })

      if (error) {
        handleAuthError(error)
      }

      Toast.show({
        type: "success",
        text1: "Verification Email Sent",
        text2: "Please check your email to verify your account",
      })
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "An error occurred while sending verification email",
      })
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const isAdmin = () => {
    return state.profile?.role === "admin"
  }

  const value = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    updateProfile,
    refreshSession,
    sendVerificationEmail,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
