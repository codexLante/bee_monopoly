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

  const createGame = async (playerName) => {
    const response = await axios.post("/api/game/create", { playerName })
    setCurrentGame(response.data.game)
    return response.data
  }

  const loadGame = async (gameId) => {
    const response = await axios.get(`/api/game/${gameId}`)
    setCurrentGame(response.data)
    return response.data
  }

  const updateGameState = async (gameId, state) => {
    const response = await axios.put(`/api/game/${gameId}/state`, { state })
    setCurrentGame(response.data)
    return response.data
  }

  const saveGame = async (gameId, state) => {
    const response = await axios.post(`/api/game/${gameId}/save`, { state })
    return response.data
  }

  const resumeGame = async (gameId) => {
    const response = await axios.post(`/api/game/${gameId}/resume`)
    setCurrentGame(response.data.game)
    return response.data
  }

  const deleteGame = async (gameId) => {
    await axios.delete(`/api/game/${gameId}`)
    setGames(games.filter((g) => g.id !== gameId))
  }

  const fetchMyGames = async () => {
    const response = await axios.get("/api/game/my-games")
    setGames(response.data.games)
    return response.data.games
  }

  const movePlayer = async (gameId, playerId, dice) => {
    const response = await axios.post(`/api/game/${gameId}/move`, {
      player_id: playerId,
      dice: dice,
    })
    setCurrentGame(response.data.state)
    return response.data
  }

  const buildOnProperty = async (gameId, playerId, propertyName) => {
    const response = await axios.post(`/api/game/${gameId}/build`, {
      player_id: playerId,
      property: propertyName,
    })
    setCurrentGame(response.data.state)
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
        saveGame,
        resumeGame,
        deleteGame,
        fetchMyGames,
        movePlayer,
        buildOnProperty,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}
