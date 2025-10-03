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

  /**
   * Creates a new game with human and/or computer players
   * The game is automatically saved to the database
   */
  const createGame = async (playerNames, numHumanPlayers = 1, numComputerPlayers = 0) => {
    const response = await axios.post("/api/game/create", {
      playerNames,
      numHumanPlayers,
      numComputerPlayers,
    })
    setCurrentGame(response.data.game)
    return response.data
  }

  /**
   * Loads a saved game from the database
   * This allows players to resume where they left off
   */
  const loadGame = async (gameId) => {
    const response = await axios.get(`/api/game/${gameId}`)
    setCurrentGame(response.data)
    return response.data
  }

  /**
   * Updates the game state in the database
   * Called after every action to save progress automatically
   */
  const updateGameState = async (gameId, state) => {
    const response = await axios.put(`/api/game/${gameId}/state`, { state })
    setCurrentGame(response.data.game)
    return response.data
  }

  /**
   * Deletes a game from the database
   */
  const deleteGame = async (gameId) => {
    await axios.delete(`/api/game/${gameId}`)
    setGames(games.filter((g) => g.id !== gameId))
  }

  /**
   * Fetches all games owned by the current user
   * Shows both active and finished games
   */
  const fetchMyGames = async () => {
    const response = await axios.get("/api/game/my-games")
    setGames(response.data.games)
    return response.data.games
  }

  /**
   * Moves a player on the board
   * The game state is automatically saved after the move
   */
  const movePlayer = async (gameId, playerId, dice) => {
    const response = await axios.post(`/api/game/${gameId}/move`, {
      player_id: playerId,
      dice: dice,
    })
    setCurrentGame((prev) => ({ ...prev, state: response.data.state }))
    return response.data
  }

  /**
   * Buys a property for a player
   * The game state is automatically saved after purchase
   */
  const buyProperty = async (gameId, playerId, propertyName) => {
    const response = await axios.post(`/api/game/${gameId}/buy`, {
      player_id: playerId,
      property: propertyName,
    })
    setCurrentGame((prev) => ({ ...prev, state: response.data.state }))
    return response.data
  }

  /**
   * Builds a house or hotel on a property
   * The game state is automatically saved after building
   */
  const buildOnProperty = async (gameId, playerId, propertyName) => {
    const response = await axios.post(`/api/game/${gameId}/build`, {
      player_id: playerId,
      property: propertyName,
    })
    setCurrentGame((prev) => ({ ...prev, state: response.data.state }))
    return response.data
  }

  /**
   * Handles AI player actions (buying properties, building houses)
   */
  const aiAction = async (gameId, playerId, action, property = null) => {
    const response = await axios.post(`/api/game/${gameId}/ai-action`, {
      player_id: playerId,
      action: action,
      property: property,
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
