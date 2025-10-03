"use client"

import { useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import axios from "axios" // Import at top for better perf

export default function AuthCallback() {
  const { setUser } = useAuth()

  useEffect(() => {
    // Native way to grab URL params—no hook needed!
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get("access_token")
    const refreshToken = urlParams.get("refresh_token")

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)

      // Set axios default header
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`

      // Fetch user info and update context
      axios
        .get("/api/auth/me")
        .then((response) => {
          setUser(response.data)
          // Simple redirect—no navigate hook
          window.location.href = "/dashboard"
        })
        .catch((error) => {
          console.error("Auth fetch failed:", error)
          window.location.href = "/login"
        })
    } else {
      // No tokens? Redirect
      window.location.href = "/login"
    }

    // Optional: Clean up URL (remove params after processing)
    window.history.replaceState({}, document.title, window.location.pathname)
  }, [setUser]) // Only depend on setUser—params are static on mount

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        color: "#667eea",
        fontSize: "1.5rem",
        fontWeight: "600",
      }}
    >
      Completing authentication...
    </div>
  )
}