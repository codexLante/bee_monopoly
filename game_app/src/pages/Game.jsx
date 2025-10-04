import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import MonopolyBoard from "../components/MonopolyBoard"
import PlayerInfo from "../components/PlayerInfo"
import DiceControls from "../components/DiceControls"
import "./Game.css"

const API_URL = "http://127.0.0.1:5000/game"

export default function Game() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const token = localStorage.getItem("jwt")
        
        if (!token) {
          alert("Please login first")
          navigate("/login")
          return
        }

        // If gameId exists, load that game, otherwise create new one
        if (gameId) {
          const response = await axios.get(`${API_URL}/${gameId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          setGameState(response.data.state)
        } else {
          // Create new game
          const response = await axios.post(
            `${API_URL}/create`,
            {
              numHumanPlayers: 1,
              numComputerPlayers: 1,
              playerNames: ["You"],
              playerColors: ["red", "blue"],
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
          const game = response.data.game
          setGameState(game.state)
          // Update URL with new game ID
          navigate(`/game/${response.data.game_id}`, { replace: true })
        }
      } catch (error) {
        console.error("Failed to load game:", error)
        alert(error.response?.data?.error || "Failed to load game")
        navigate("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchGame()
  }, [gameId])

  const handleStateChange = (newState) => {
    setGameState(newState)
  }

  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg])
    // Auto-clear after 5 seconds
    setTimeout(() => {
      setMessages((prev) => prev.slice(1))
    }, 5000)
  }

  // ------------------ ROUTE CALLS ------------------

  const movePlayer = async (playerId, dice) => {
    try {
      const token = localStorage.getItem("jwt")
      const response = await axios.post(
        `${API_URL}/${gameId}/move`,
        { player_id: playerId, dice },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      const { state, messages: apiMessages, actions } = response.data
      
      // Show messages to user
      apiMessages.forEach((msg) => addMessage(msg))
      
      handleStateChange(state)
      return { state, actions }
    } catch (error) {
      console.error("Move failed:", error)
      alert(error.response?.data?.error || "Move failed")
      throw error
    }
  }

  const buyProperty = async (playerId, propertyName) => {
    try {
      const token = localStorage.getItem("jwt")
      const response = await axios.post(
        `${API_URL}/${gameId}/buy`,
        { player_id: playerId, property: propertyName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      const { state, message } = response.data
      addMessage(message)
      handleStateChange(state)
    } catch (error) {
      console.error("Buy failed:", error)
      alert(error.response?.data?.error || "Purchase failed")
    }
  }

  const buildProperty = async (playerId, propertyName) => {
    try {
      const token = localStorage.getItem("jwt")
      const response = await axios.post(
        `${API_URL}/${gameId}/build`,
        { player_id: playerId, property: propertyName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      const { state, message } = response.data
      addMessage(message)
      handleStateChange(state)
    } catch (error) {
      console.error("Build failed:", error)
      alert(error.response?.data?.error || "Build failed")
    }
  }

  const triggerAIAction = async (playerId, actionType, propertyName = null) => {
    try {
      const token = localStorage.getItem("jwt")
      const payload = {
        player_id: playerId,
        action: actionType,
      }
      if (propertyName) {
        payload.property = propertyName
      }

      const response = await axios.post(
        `${API_URL}/${gameId}/ai-action`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      
      const result = response.data
      if (result.action !== 'pass') {
        addMessage(`AI ${result.action === 'buy' ? 'bought' : 'built on'} ${result.property}`)
        // Refresh game state
        const gameResponse = await axios.get(`${API_URL}/${gameId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        handleStateChange(gameResponse.data.state)
      }
    } catch (error) {
      console.error("AI action failed:", error)
    }
  }

  // ------------------ UI ------------------

  if (loading) {
    return (
      <div className="game-loading">
        <div className="spinner"></div>
        <p>Loading game...</p>
      </div>
    )
  }

  if (!gameState) {
    return null
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button onClick={handleBackToDashboard} className="btn-back">
          ← Back to Dashboard
        </button>
        <h1>Monopoly Game</h1>
        <div className="game-info">
          <span>Turn: {gameState.turn}</span>
          <span>Players: {gameState.players.length}</span>
        </div>
      </div>

      {/* Message Display */}
      {messages.length > 0 && (
        <div className="game-messages">
          {messages.map((msg, index) => (
            <div key={index} className="game-message">
              {msg}
            </div>
          ))}
        </div>
      )}

      <div className="game-content">
        <div className="game-sidebar">
          <PlayerInfo
            players={gameState.players}
            currentPlayer={gameState.currentPlayer}
            onBuy={buyProperty}
            onBuild={buildProperty}
            onAIAction={triggerAIAction}
          />
        </div>

        <div className="game-main">
          <MonopolyBoard gameState={gameState} />
          <DiceControls
            gameState={gameState}
            onStateChange={handleStateChange}
            onMove={movePlayer}
          />
        </div>
      </div>
    </div>
  )
}