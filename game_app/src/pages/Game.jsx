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
  const { loadGame, currentGame } = useGame()
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)

  // This is what allows players to resume from where they left off
  useEffect(() => {
    const fetchGame = async () => {
      try {
        // Load the complete game state from the database
        const game = await loadGame(gameId)
        // Set the local state with the loaded game
        // This includes all player positions, money, properties, and the board state
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
  }, [gameId])

  /**
   * Updates the game state both locally and in the database
   * This ensures progress is saved automatically after every action
   */
  const handleStateChange = (newState) => {
    // Update local state immediately for responsive UI
    setGameState(newState)
    // The state is automatically saved to the database by the DiceControls component
    // after each move, so players can always resume from their last action
  }

  const handleBackToDashboard = () => {
    // Game state is already saved, safe to navigate away
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
        <div className="game-info">
          <span>Turn: {gameState.turn}</span>
          <span>Players: {gameState.players.length}</span>
        </div>
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
