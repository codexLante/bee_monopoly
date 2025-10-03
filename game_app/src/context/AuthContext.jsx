"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

// Create context to share auth data across app
const AuthContext = createContext(null)

// Hook to use auth in any component
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Get tokens from browser storage
  const getAccessToken = () => localStorage.getItem("accessToken")
  const getRefreshToken = () => localStorage.getItem("refreshToken")

  axios.defaults.baseURL = "http://localhost:5000"
  axios.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Check if user is logged in when app loads
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken()
      if (token) {
        try {
          const response = await axios.get("/api/auth/me")
          setUser(response.data)
        } catch (error) {
          // Token expired, try to refresh
          const refreshToken = getRefreshToken()
          if (refreshToken) {
            try {
              const res = await axios.post(
                "/api/auth/refresh",
                {},
                {
                  headers: { Authorization: `Bearer ${refreshToken}` },
                },
              )
              localStorage.setItem("accessToken", res.data.access_token)
              const userRes = await axios.get("/api/auth/me")
              setUser(userRes.data)
            } catch {
              logout()
            }
          }
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  // Login function
  const login = async (email, password) => {
    const response = await axios.post("/api/auth/login", { email, password })
    const { access_token, refresh_token, user } = response.data

    localStorage.setItem("accessToken", access_token)
    localStorage.setItem("refreshToken", refresh_token)
    setUser(user)

    return user
  }

  // Register function
  const register = async (username, email, password) => {
    const response = await axios.post("/api/auth/register", { username, email, password })
    const { access_token, refresh_token, user } = response.data

    localStorage.setItem("accessToken", access_token)
    localStorage.setItem("refreshToken", refresh_token)
    setUser(user)

    return user
  }

  // Logout function
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout")
    } catch (error) {
      console.error("Logout error:", error)
    }

    setUser(null)
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
