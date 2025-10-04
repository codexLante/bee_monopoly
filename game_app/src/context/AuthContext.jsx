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

  // Get token from browser storage (matching your backend's expected key)
  const getToken = () => localStorage.getItem("jwt")

  // Set up axios defaults
  axios.defaults.baseURL = "http://127.0.0.1:5000"
  
  // Add token to all requests automatically
  axios.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Check if user is logged in when app loads
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      if (token) {
        try {
          // Your backend endpoint: /api/user/get_user
          const response = await axios.get("/user/get_user")
          setUser(response.data)
        } catch (error) {
          console.error("Auth check failed:", error)
          // Token is invalid or expired
          logout()
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  // Login function - matches your backend response structure
  const login = async (email, password) => {
    const response = await axios.post("/user/login", { email, password })
    const { token, user } = response.data

    // Store token with the key your backend expects
    localStorage.setItem("jwt", token)
    setUser(user)

    return user
  }

  // Register function - auto-login after registration
  const register = async (username, email, password) => {
    // First register
    const registerResponse = await axios.post("/user/register", { 
      username, 
      email, 
      password 
    })
    
    // Then automatically login
    const loginResponse = await axios.post("/user/login", { 
      email, 
      password 
    })
    
    const { token, user } = loginResponse.data
    localStorage.setItem("jwt", token)
    setUser(user)

    return user
  }

  // Logout function - client-side only (your backend has no logout endpoint)
  const logout = () => {
    setUser(null)
    localStorage.removeItem("jwt")
    // If you have other stored data, clear it too
    // localStorage.clear() // Use this to clear everything
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}