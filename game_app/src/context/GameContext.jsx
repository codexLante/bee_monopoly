"use client"

import { createContext, useContext, useState } from "react"
import axios from "axios"

const GameContext = createContext(null)

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within GameProvider")
  }
  return context
}

export const GameProvider = ({ children }) => {
  const [currentGame, setCurrentGame] = useState(null)
  const [games, setGames] = useState([])

  const createGame = async (playerNames, numHumanPlayers = 1, numComputerPlayers = 0) => {
    const token = localStorage.getItem("jwt")
    const response = await axios.post("http://127.0.0.1:5000/game/create", {
      playerNames,
      numHumanPlayers,
      numComputerPlayers,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setCurrentGame(response.data.game)
    return response.data
  }

  const loadGame = async (gameId) => {
    const token = localStorage.getItem("jwt")
    const response = await axios.get(`http://127.0.0.1:5000/game/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setCurrentGame(response.data)
    return response.data
  }

  const updateGameState = async (gameId, state) => {
    const token = localStorage.getItem("jwt")
    const response = await axios.put(`http://127.0.0.1:5000/game/${gameId}/state`, { state }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setCurrentGame(response.data.game)
    return response.data
  }

  const deleteGame = async (gameId) => {
    const token = localStorage.getItem("jwt")
    await axios.delete(`http://127.0.0.1:5000/game/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setGames(games.filter((g) => g.id !== gameId))
  }

  const fetchMyGames = async () => {
    const token = localStorage.getItem("jwt")
    const response = await axios.get("http://127.0.0.1:5000/game/my-games", {
      headers: { Authorization: `Bearer ${token}` }
    })
    setGames(response.data.games)
    return response.data.games
  }

  const movePlayer = async (gameId, playerId, dice) => {
    const token = localStorage.getItem("jwt")
    const response = await axios.post(`http://127.0.0.1:5000/game/${gameId}/move`, {
      player_id: playerId,
      dice: dice,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setCurrentGame((prev) => ({ ...prev, state: response.data.state }))
    return response.data
  }

  const buyProperty = async (gameId, playerId, propertyName) => {
    const token = localStorage.getItem("jwt")
    const response = await axios.post(`http://127.0.0.1:5000/game/${gameId}/buy`, {
      player_id: playerId,
      property: propertyName,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setCurrentGame((prev) => ({ ...prev, state: response.data.state }))
    return response.data
  }

  const buildOnProperty = async (gameId, playerId, propertyName) => {
    const token = localStorage.getItem("jwt")
    const response = await axios.post(`http://127.0.0.1:5000/game/${gameId}/build`, {
      player_id: playerId,
      property: propertyName,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setCurrentGame((prev) => ({ ...prev, state: response.data.state }))
    return response.data
  }

  const aiAction = async (gameId, playerId, action, property = null) => {
    const token = localStorage.getItem("jwt")
    const response = await axios.post(`http://127.0.0.1:5000/game/${gameId}/ai-move`, {
      player_id: playerId,
      action: action,
      property: property,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }

  return (
    <GameContext.Provider
      value={{
        currentGame,
        games,
        createGame,
        loadGame,
        updateGameState,
        deleteGame,
        fetchMyGames,
        movePlayer,
        buyProperty,
        buildOnProperty,
        aiAction,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}