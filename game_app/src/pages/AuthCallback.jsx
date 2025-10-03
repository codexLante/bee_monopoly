"use client"

import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)

      // Set axios default header for future requests
      const axios = require("axios")
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`

      // Fetch user info and update context
      axios
        .get("/api/auth/me")
        .then((response) => {
          setUser(response.data)
          navigate("/dashboard")
        })
        .catch(() => {
          navigate("/login")
        })
    } else {
      navigate("/login")
    }
  }, [searchParams, navigate, setUser])

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
