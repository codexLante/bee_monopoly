"use client"

import { useState, useEffect } from "react"
import { useGame } from "../context/GameContext"
import { useParams } from "react-router-dom"
import "./DiceControls.css"

export default function DiceControls({ gameState, onStateChange }) {
  const [dice, setDice] = useState([0, 0])
  const [rolling, setRolling] = useState(false)
  const [messages, setMessages] = useState([])
  const [canBuyProperty, setCanBuyProperty] = useState(null)
  const { movePlayer, buyProperty, updateGameState } = useGame()
  const { gameId } = useParams()

  const currentPlayer = gameState.players[gameState.currentPlayer]

  useEffect(() => {
    if (currentPlayer?.is_computer && !rolling) {
      const timer = setTimeout(() => {
        rollDice()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, rolling])

  const rollDice = async () => {
    setRolling(true)
    setMessages([])
    setCanBuyProperty(null)

    // Animate dice rolling
    const interval = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1])
    }, 100)

    setTimeout(async () => {
      clearInterval(interval)
      const finalDice = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]
      setDice(finalDice)

      try {
        const response = await movePlayer(gameId, currentPlayer.id, finalDice)

        // Update the game state with the response
        onStateChange(response.state)
        setMessages(response.messages)

        // Check if player can buy property
        if (response.actions?.can_buy) {
          setCanBuyProperty(response.actions.can_buy)

          // AI automatically buys if it wants to
          if (currentPlayer.is_computer) {
            setTimeout(() => handleBuyProperty(), 1000)
          }
        }
      } catch (error) {
        setMessages([`Error: ${error.message}`])
      }

      setRolling(false)
    }, 1000)
  }

  const handleBuyProperty = async () => {
    if (!canBuyProperty) return

    try {
      const response = await buyProperty(gameId, currentPlayer.id, canBuyProperty.property)
      onStateChange(response.state)
      setMessages([...messages, response.message])
      setCanBuyProperty(null)
    } catch (error) {
      setMessages([...messages, `Error: ${error.message}`])
    }
  }

  const handleDeclineBuy = () => {
    setCanBuyProperty(null)
  }

  return (
    <div className="dice-controls">
      <div className="dice-display">
        <div className={`die ${rolling ? "rolling" : ""}`}>{dice[0] || "?"}</div>
        <div className={`die ${rolling ? "rolling" : ""}`}>{dice[1] || "?"}</div>
      </div>

      <div className="controls-info">
        <p className="current-turn">
          <strong>{currentPlayer.name}'s Turn</strong>
          {currentPlayer.is_computer && <span className="ai-badge">🤖 AI</span>}
          {!currentPlayer.is_computer && <span className="human-badge">👤 Human</span>}
          {currentPlayer.in_jail && <span className="jail-badge">🔒 In Jail</span>}
        </p>
        {dice[0] > 0 && <p>Last Roll: {dice[0] + dice[1]}</p>}

        {messages.length > 0 && (
          <div className="game-messages">
            {messages.map((msg, i) => (
              <p key={i} className="message">
                {msg}
              </p>
            ))}
          </div>
        )}

        {canBuyProperty && !currentPlayer.is_computer && (
          <div className="buy-property-prompt">
            <p>
              Buy {canBuyProperty.property} for ${canBuyProperty.price}?
            </p>
            <div className="buy-buttons">
              <button onClick={handleBuyProperty} className="btn-buy">
                Buy
              </button>
              <button onClick={handleDeclineBuy} className="btn-decline">
                Pass
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={rollDice}
        disabled={rolling || currentPlayer.is_computer || canBuyProperty !== null}
        className="btn-roll"
      >
        {rolling ? "Rolling..." : currentPlayer.is_computer ? "AI Playing..." : "Roll Dice"}
      </button>
    </div>
  )
}
