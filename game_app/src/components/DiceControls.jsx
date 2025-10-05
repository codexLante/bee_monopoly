"use client"

import { useState, useEffect } from "react"
import "./DiceControls.css"

export default function DiceControls({ gameState, onStateChange, onMove, onBuy }) {
  const [dice, setDice] = useState([0, 0])
  const [rolling, setRolling] = useState(false)
  const [messages, setMessages] = useState([])
  const [canBuyProperty, setCanBuyProperty] = useState(null)

  const currentPlayer = gameState.players[gameState.currentPlayer]

  useEffect(() => {
    if (currentPlayer?.is_computer && !rolling && !canBuyProperty) {
      const timer = setTimeout(() => {
        rollDice()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, rolling, canBuyProperty])

  const rollDice = async () => {
    setRolling(true)
    setMessages([])
    setCanBuyProperty(null)

    const interval = setInterval(() => {
      setDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ])
    }, 100)

    setTimeout(async () => {
      clearInterval(interval)
      const finalDice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]
      setDice(finalDice)

      try {
        const response = await onMove(currentPlayer.id, finalDice)
        const { state, actions } = response

        if (actions?.can_buy) {
          setCanBuyProperty(actions.can_buy)

          if (currentPlayer.is_computer) {
            setTimeout(async () => {
              const updatedState = await onBuy(currentPlayer.id, actions.can_buy.property)
              if (updatedState) onStateChange(updatedState)
              setCanBuyProperty(null)
            }, 1000)
          }
        } else {
          onStateChange(state)
        }
      } catch (error) {
        console.error("Dice roll error:", error)
        setMessages([`Error: ${error.message}`])
      }

      setRolling(false)
    }, 1000)
  }

  const handleBuyProperty = async () => {
    if (!canBuyProperty) return
    const updatedState = await onBuy(currentPlayer.id, canBuyProperty.property)
    if (updatedState) {
      onStateChange(updatedState)
      setCanBuyProperty(null)
      setTimeout(() => rollDice(), 1000) // ✅ advance turn
    }
  }

  const handleDeclineBuy = async () => {
    setCanBuyProperty(null)
    setTimeout(() => rollDice(), 1000) // ✅ advance turn
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
          {currentPlayer.is_computer ? (
            <span className="ai-badge">🤖 AI</span>
          ) : (
            <span className="human-badge">👤 Human</span>
          )}
          {currentPlayer.in_jail && <span className="jail-badge">🔒 In Jail</span>}
        </p>

        {dice[0] > 0 && <p>Last Roll: {dice[0] + dice[1]}</p>}

        {messages.length > 0 && (
          <div className="game-messages">
            {messages.map((msg, i) => (
              <p key={i} className="message">{msg}</p>
            ))}
          </div>
        )}

          {/* ✅ DEBUG LOG */}
          {console.log("Buy prompt check:", {
            canBuyProperty,
            isComputer: currentPlayer?.is_computer,
            currentPlayer
          })}

        {canBuyProperty && !currentPlayer.is_computer && (
          <div className="buy-property-prompt">
            <p>Buy {canBuyProperty.property} for ${canBuyProperty.price}?</p>
            <div className="buy-buttons">
              <button onClick={handleBuyProperty} className="btn-buy">Buy</button>
              <button onClick={handleDeclineBuy} className="btn-decline">Pass</button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={rollDice}
        disabled={rolling || currentPlayer.is_computer || canBuyProperty !== null}
        className="btn-roll"
      >
        {rolling
          ? "Rolling..."
          : currentPlayer.is_computer
          ? "AI Playing..."
          : "Roll Dice"}
      </button>
    </div>
  )
}
