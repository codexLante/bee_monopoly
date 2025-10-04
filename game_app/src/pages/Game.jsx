"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useGame } from "../context/GameContext"
import MonopolyBoard from "../components/MonopolyBoard"
import PlayerInfo from "../components/PlayerInfo"
import DiceControls from "../components/DiceControls"
import "./Game.css"

export default function Game() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { currentGame } = useGame()
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const token = localStorage.getItem("jwt")
        const response = await axios.post(
          "http://127.0.0.1:5000/api/game/create",
          {
            numHumanPlayers: 1,
            numComputerPlayers: 1,
            playerNames: ["You"],
            playerColors: ["red", "blue"]
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        )
        const game = response.data.game
        setGameState(game.state)
      } catch (error) {
        console.error("Failed to load game:", error)
        alert("Failed to load game")
        navigate("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchGame()
  }, [])

  const handleStateChange = (newState) => {
    setGameState(newState)
  }

  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  // ------------------ ROUTE CALLS ------------------

  const movePlayer = async (playerId, dice) => {
    const token = localStorage.getItem("jwt")
    const response = await axios.post(
      `http://127.0.0.1:5000/api/game/${gameId}/move`,
      { player_id: playerId, dice },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    )
    const { state, messages, actions } = response.data
    console.log("Move messages:", messages)
    handleStateChange(state)
  }

  const buyProperty = async (playerId, propertyName) => {
    const token = localStorage.getItem("jwt")
    const response = await axios.post(
      `http://127.0.0.1:5000/api/game/${gameId}/buy`,
      { player_id: playerId, property: propertyName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    )
    const { state, message } = response.data
    console.log(message)
    handleStateChange(state)
  }

  const buildProperty = async (playerId, propertyName) => {
    const token = localStorage.getItem("jwt")
    const response = await axios.post(
      `http://127.0.0.1:5000/api/game/${gameId}/build`,
      { player_id: playerId, property: propertyName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    )
    const { state, message } = response.data
    console.log(message)
    handleStateChange(state)
  }

  const triggerAIAction = async (playerId, actionType, propertyName = null) => {
    const token = localStorage.getItem("jwt")
    const payload = {
      player_id: playerId,
      action: actionType
    }
    if (propertyName) {
      payload.property = propertyName
    }

    const response = await axios.post(
      `http://127.0.0.1:5000/api/game/${gameId}/ai-action`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    )
    console.log("AI action result:", response.data)
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