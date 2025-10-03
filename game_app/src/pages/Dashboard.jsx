"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useGame } from "../context/GameContext"
import "./Dashboard.css"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { games, createGame, fetchMyGames, resumeGame, deleteGame } = useGame()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMyGames()
  }, [])

  const handleCreateGame = async () => {
    setLoading(true)
    try {
      const result = await createGame(user.username)
      navigate(`/game/${result.game_id}`)
    } catch (error) {
      console.error("[v0] Failed to create game:", error)
      alert("Failed to create game")
    } finally {
      setLoading(false)
    }
  }

  const handleResumeGame = async (gameId) => {
    try {
      await resumeGame(gameId)
      navigate(`/game/${gameId}`)
    } catch (error) {
      console.error("[v0] Failed to resume game:", error)
      alert("Failed to resume game")
    }
  }

  const handleDeleteGame = async (gameId) => {
    if (window.confirm("Are you sure you want to delete this game?")) {
      try {
        await deleteGame(gameId)
      } catch (error) {
        console.error("[v0] Failed to delete game:", error)
        alert("Failed to delete game")
      }
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Monopoly Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}!</span>
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="create-game-section">
          <button onClick={handleCreateGame} disabled={loading} className="btn-create-game">
            {loading ? "Creating..." : "+ New Game"}
          </button>
        </div>

        <div className="games-section">
          <h2>Your Games</h2>
          {games.length === 0 ? (
            <p className="no-games">No games yet. Create one to get started!</p>
          ) : (
            <div className="games-grid">
              {games.map((game) => (
                <div key={game.id} className="game-card">
                  <div className="game-card-header">
                    <h3>Game #{game.id.split("_")[1]}</h3>
                    <span className={`status-badge ${game.status}`}>{game.status}</span>
                  </div>
                  <div className="game-card-body">
                    <p>Players: {game.players.length}</p>
                    <p>Turn: {game.state.turn}</p>
                  </div>
                  <div className="game-card-actions">
                    <button onClick={() => handleResumeGame(game.id)} className="btn-resume">
                      {game.status === "active" ? "Continue" : "Resume"}
                    </button>
                    <button onClick={() => handleDeleteGame(game.id)} className="btn-delete">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
