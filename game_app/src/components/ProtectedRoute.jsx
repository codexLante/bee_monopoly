"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "white",
          fontSize: "1.5rem",
        }}
      >
        Loading...
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}
