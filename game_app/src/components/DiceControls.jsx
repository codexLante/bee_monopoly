"use client"

import { useState } from "react"
import "./DiceControls.css"

export default function DiceControls({ gameState, onStateChange }) {
  const [dice, setDice] = useState([0, 0])
  const [rolling, setRolling] = useState(false)

  const rollDice = () => {
    setRolling(true)

    // Animate dice roll
    const interval = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1])
    }, 100)

    setTimeout(() => {
      clearInterval(interval)
      const finalDice = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]
      setDice(finalDice)
      setRolling(false)

      // Move player
      movePlayer(finalDice[0] + finalDice[1])
    }, 1000)
  }

  const movePlayer = (spaces) => {
    const currentPlayerIndex = gameState.currentPlayer
    const currentPlayerData = gameState.players[currentPlayerIndex]

    const newPosition = (currentPlayerData.position + spaces) % 40
    const passedGo = currentPlayerData.position + spaces >= 40

    const updatedPlayers = gameState.players.map((player, index) => {
      if (index === currentPlayerIndex) {
        return {
          ...player,
          position: newPosition,
          money: passedGo ? player.money + 200 : player.money,
        }
      }
      return player
    })

    const newState = {
      ...gameState,
      players: updatedPlayers,
      currentPlayer: (currentPlayerIndex + 1) % gameState.players.length,
      turn: gameState.turn + 1,
      dice: dice,
    }

    onStateChange(newState)
  }

  const currentPlayer = gameState.players[gameState.currentPlayer]

  return (
    <div className="dice-controls">
      <div className="dice-display">
        <div className={`die ${rolling ? "rolling" : ""}`}>{dice[0] || "?"}</div>
        <div className={`die ${rolling ? "rolling" : ""}`}>{dice[1] || "?"}</div>
      </div>

      <div className="controls-info">
        <p>
          <strong>{currentPlayer.name}'s Turn</strong>
        </p>
        {dice[0] > 0 && <p>Last Roll: {dice[0] + dice[1]}</p>}
      </div>

      <button onClick={rollDice} disabled={rolling} className="btn-roll">
        {rolling ? "Rolling..." : "Roll Dice"}
      </button>
    </div>
  )
}
