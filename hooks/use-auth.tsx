"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ApiClient } from "@/lib/api-client"
import type { User, LoginRequest, RegisterRequest } from "@/lib/api-types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (token) {
          const response = await ApiClient.getCurrentUser()
          if (response.data) {
            setUser(response.data)
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        // Clear invalid token
        localStorage.removeItem("auth_token")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await ApiClient.login(credentials)

      if (response.error) {
        return { success: false, error: response.error.message }
      }

      if (response.data?.user) {
        setUser(response.data.user)
        return { success: true }
      }

      return { success: false, error: "Login failed" }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await ApiClient.register(userData)

      if (response.error) {
        return { success: false, error: response.error.message }
      }

      if (response.data?.user) {
        setUser(response.data.user)
        return { success: true }
      }

      return { success: false, error: "Registration failed" }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    try {
      await ApiClient.logout()
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const refreshUser = async () => {
    try {
      const response = await ApiClient.getCurrentUser()
      if (response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error("User refresh error:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
