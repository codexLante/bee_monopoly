"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import axios from "axios"
import "./Dashboard.css"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [numHumans, setNumHumans] = useState(1)
  const [numComputers, setNumComputers] = useState(0)
  const [playerNames, setPlayerNames] = useState([user?.username || "Player 1"])
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserGames()
  }, [])

  const fetchUserGames = async () => {
    try {
      const token = localStorage.getItem("jwt")
      const res = await axios.get("http://127.0.0.1:5000/game/my-games", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setGames(res.data.games)
    } catch (error) {
      console.error("Failed to fetch games:", error)
    }
  }

  const handleCreateGame = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("jwt")
      const res = await axios.post(
        "http://127.0.0.1:5000/game/create",
        {
          playerNames,
          numHumanPlayers: numHumans,
          numComputerPlayers: numComputers,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      navigate(`/game/${res.data.game_id}`)
      setShowCreateModal(false)
    } catch (error) {
      console.error("Failed to create game:", error)
      alert("Failed to create game")
    } finally {
      setLoading(false)
    }
  }

  const handleResumeGame = (gameId) => {
    navigate(`/game/${gameId}`)
  }

  const handleDeleteGame = async (gameId) => {
    if (window.confirm("Are you sure you want to delete this game?")) {
      try {
        const token = localStorage.getItem("jwt")
        await axios.delete(`http://127.0.0.1:5000/game/${gameId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setGames((prev) => prev.filter((g) => g.id !== gameId))
      } catch (error) {
        console.error("Failed to delete game:", error)
        alert("Failed to delete game")
      }
    }
  }

  const handleNumHumansChange = (num) => {
    setNumHumans(num)
    const newNames = []
    for (let i = 0; i < num; i++) {
      if (i === 0) {
        newNames.push(user?.username || "Player 1")
      } else {
        newNames.push(playerNames[i] || `Player ${i + 1}`)
      }
    }
    setPlayerNames(newNames)
  }

  const handlePlayerNameChange = (index, name) => {
    const newNames = [...playerNames]
    newNames[index] = name
    setPlayerNames(newNames)
  }

  const formatLastPlayed = (updatedAt) => {
    const date = new Date(updatedAt)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
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
          <button onClick={() => setShowCreateModal(true)} className="btn-create-game">
            + New Game
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
                    <h3>Game #{game.id}</h3>
                    <span className={`status-badge ${game.status}`}>{game.status}</span>
                  </div>
                  <div className="game-card-body">
                    <p>Players: {game.players?.length || 0}</p>
                    <p>Turn: {game.state?.turn || 1}</p>
                    <p className="last-played">Last played: {formatLastPlayed(game.updated_at)}</p>
                  </div>
                  <div className="game-card-actions">
                    <button onClick={() => handleResumeGame(game.id)} className="btn-resume">
                      Resume Game
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

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Game</h2>
            <div className="modal-body">
              <label>
                Number of Human Players:
                <select value={numHumans} onChange={(e) => handleNumHumansChange(Number(e.target.value))}>
                  <option value={1}>1 Player</option>
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                </select>
              </label>

              {numHumans > 0 && (
                <div className="player-names-section">
                  <p>Player Names:</p>
                  {playerNames.map((name, index) => (
                    <input
                      key={index}
                      type="text"
                      value={name}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      placeholder={`Player ${index + 1} name`}
                      className="player-name-input"
                    />
                  ))}
                </div>
              )}

              <label>
                Number of Computer Opponents:
                <select
                  value={numComputers}
                  onChange={(e) => setNumComputers(Number(e.target.value))}
                  disabled={numHumans >= 4}
                >
                  <option value={0}>0 Computers</option>
                  {numHumans < 4 && <option value={1}>1 Computer</option>}
                  {numHumans < 3 && <option value={2}>2 Computers</option>}
                  {numHumans < 2 && <option value={3}>3 Computers</option>}
                </select>
              </label>

              <p className="help-text">
                {numHumans > 1
                  ? "Multiple players can play on the same device, taking turns!"
                  : "Your game progress is automatically saved. You can resume anytime from the dashboard!"}
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleCreateGame} disabled={loading} className="btn-create">
                {loading ? "Creating..." : "Create Game"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}