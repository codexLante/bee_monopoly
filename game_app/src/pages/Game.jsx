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
  const { loadGame, updateGameState, saveGame, currentGame } = useGame()
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const game = await loadGame(gameId)
        setGameState(game.state)
      } catch (error) {
        console.error("[v0] Failed to load game:", error)
        alert("Failed to load game")
        navigate("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchGame()
  }, [gameId])

  const handleStateChange = async (newState) => {
    setGameState(newState)
    try {
      await updateGameState(gameId, newState)
    } catch (error) {
      console.error("[v0] Failed to update game state:", error)
    }
  }

  const handleSaveGame = async () => {
    try {
      await saveGame(gameId, gameState)
      alert("Game saved successfully!")
    } catch (error) {
      console.error("[v0] Failed to save game:", error)
      alert("Failed to save game")
    }
  }

  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

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
        <button onClick={handleSaveGame} className="btn-save">
          Save Game
        </button>
      </div>

      <div className="game-content">
        <div className="game-sidebar">
          <PlayerInfo players={gameState.players} currentPlayer={gameState.currentPlayer} />
        </div>

        <div className="game-main">
          <MonopolyBoard gameState={gameState} />
          <DiceControls gameState={gameState} onStateChange={handleStateChange} />
        </div>
      </div>
    </div>
  )
}
