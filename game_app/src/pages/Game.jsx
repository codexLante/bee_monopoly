import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import MonopolyBoard from "../components/MonopolyBoard"
import PlayerInfo from "../components/PlayerInfo"
import DiceControls from "../components/DiceControls"
import "./Game.css"

export default function Game() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const initializeGame = async () => {
      try {
        const token = localStorage.getItem("jwt")
        if (!token) {
          alert("Please login first")
          navigate("/login")
          return
        }

        if (gameId) {
          const response = await axios.get(`http://127.0.0.1:5000/game/${gameId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          console.log("Initial game load response:", response.data)
          setGameState(response.data.state)
        } else {
          const gamesResponse = await axios.get(`http://127.0.0.1:5000/game/my-games`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const activeGame = gamesResponse.data.games.find(g => !g.state?.winner)
          if (activeGame) {
            navigate(`/game/${activeGame.id}`, { replace: true })
          } else {
            const createResponse = await axios.post(
              `http://127.0.0.1:5000/game/create`,
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
            const newGame = createResponse.data.game
            setGameState(newGame.state)
            navigate(`/game/${newGame.id}`, { replace: true })
          }
        }
      } catch (error) {
        console.error("Game setup failed:", error)
        alert(error.response?.data?.error || "Game setup failed")
        navigate("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    initializeGame()
  }, [gameId])

  const handleStateChange = (newState) => setGameState(newState)
  const handleBackToDashboard = () => navigate("/dashboard")

  const addMessage = (msg) => {
    setMessages(prev => [...prev, msg])
    setTimeout(() => {
      setMessages(prev => prev.slice(1))
    }, 5000)
  }

  // ------------------ API ROUTES ------------------

const movePlayer = async (playerId, dice) => {
  try {
    const token = localStorage.getItem("jwt")
    console.log("=== BEFORE MOVE ===")
    console.log("Current gameState:", JSON.stringify(gameState, null, 2))
    
    const response = await axios.post(
      `http://127.0.0.1:5000/game/${gameId}/move`,
      { player_id: playerId, dice },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )
    
    console.log("=== BACKEND RESPONSE ===")
    console.log("Full response:", JSON.stringify(response.data, null, 2))
    
    const { state, messages: apiMessages, actions } = response.data
    
    console.log("=== EXTRACTED STATE ===")
    console.log("State turn:", state.turn)
    console.log("State currentPlayer:", state.currentPlayer)
    console.log("State players:", state.players.map(p => `${p.name} at position ${p.position}`))
    
    apiMessages.forEach(addMessage)
    handleStateChange(state)
    
    console.log("=== AFTER setState ===")
    console.log("Updated gameState:", JSON.stringify(gameState, null, 2))
    
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
      `http://127.0.0.1:5000/game/${gameId}/buy`,
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
    setGameState(state) // ✅ directly update gameState
    return state // ✅ return updated state so DiceControls can continue
  } catch (error) {
    console.error("Buy failed:", error)
    alert(error.response?.data?.error || "Purchase failed")
    return null
  }
}

  const buildProperty = async (playerId, propertyName) => {
    try {
      const token = localStorage.getItem("jwt")
      const response = await axios.post(
        `http://127.0.0.1:5000/game/${gameId}/build`,
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
      const payload = { player_id: playerId, action: actionType }
      if (propertyName) payload.property = propertyName

      const response = await axios.post(
        `http://127.0.0.1:5000/game/${gameId}/ai-move`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const result = response.data
      if (result.action !== "pass") {
        addMessage(`AI ${result.action === "buy" ? "bought" : "built on"} ${result.property}`)
        const gameResponse = await axios.get(`http://127.0.0.1:5000/game/${gameId}`, {
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

  if (!gameState) return null

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
            onBuy={buyProperty}
          />
        </div>
      </div>
    </div>
  )
}