"use client"

import { useEffect } from "react"
import "./MonopolyBoard.css"

const BOARD_TILES = [
  { id: 0, name: "GO", type: "go", color: "#ff0000" },
  { id: 1, name: "Mediterranean Ave", type: "property", price: 60, color: "#8b4513" },
  { id: 2, name: "Community Chest", type: "community_chest", color: "#87ceeb" },
  { id: 3, name: "Baltic Ave", type: "property", price: 60, color: "#8b4513" },
  { id: 4, name: "Income Tax", type: "tax", color: "#ffffff" },
  { id: 5, name: "Reading Railroad", type: "railroad", price: 200, color: "#000000" },
  { id: 6, name: "Oriental Ave", type: "property", price: 100, color: "#add8e6" },
  { id: 7, name: "Chance", type: "chance", color: "#ff6347" },
  { id: 8, name: "Vermont Ave", type: "property", price: 100, color: "#add8e6" },
  { id: 9, name: "Connecticut Ave", type: "property", price: 120, color: "#add8e6" },
  { id: 10, name: "Jail", type: "jail", color: "#ffa500" },
  { id: 11, name: "St. Charles Place", type: "property", price: 140, color: "#ff1493" },
  { id: 12, name: "Electric Company", type: "utility", price: 150, color: "#ffff00" },
  { id: 13, name: "States Ave", type: "property", price: 140, color: "#ff1493" },
  { id: 14, name: "Virginia Ave", type: "property", price: 160, color: "#ff1493" },
  { id: 15, name: "Pennsylvania RR", type: "railroad", price: 200, color: "#000000" },
  { id: 16, name: "St. James Place", type: "property", price: 180, color: "#ffa500" },
  { id: 17, name: "Community Chest", type: "community_chest", color: "#87ceeb" },
  { id: 18, name: "Tennessee Ave", type: "property", price: 180, color: "#ffa500" },
  { id: 19, name: "New York Ave", type: "property", price: 200, color: "#ffa500" },
  { id: 20, name: "Free Parking", type: "free_parking", color: "#90ee90" },
  { id: 21, name: "Kentucky Ave", type: "property", price: 220, color: "#ff0000" },
  { id: 22, name: "Chance", type: "chance", color: "#ff6347" },
  { id: 23, name: "Indiana Ave", type: "property", price: 220, color: "#ff0000" },
  { id: 24, name: "Illinois Ave", type: "property", price: 240, color: "#ff0000" },
  { id: 25, name: "B&O Railroad", type: "railroad", price: 200, color: "#000000" },
  { id: 26, name: "Atlantic Ave", type: "property", price: 260, color: "#ffff00" },
  { id: 27, name: "Ventnor Ave", type: "property", price: 260, color: "#ffff00" },
  { id: 28, name: "Water Works", type: "utility", price: 150, color: "#ffff00" },
  { id: 29, name: "Marvin Gardens", type: "property", price: 280, color: "#ffff00" },
  { id: 30, name: "Go To Jail", type: "go_to_jail", color: "#ff0000" },
  { id: 31, name: "Pacific Ave", type: "property", price: 300, color: "#008000" },
  { id: 32, name: "North Carolina Ave", type: "property", price: 300, color: "#008000" },
  { id: 33, name: "Community Chest", type: "community_chest", color: "#87ceeb" },
  { id: 34, name: "Pennsylvania Ave", type: "property", price: 320, color: "#008000" },
  { id: 35, name: "Short Line RR", type: "railroad", price: 200, color: "#000000" },
  { id: 36, name: "Chance", type: "chance", color: "#ff6347" },
  { id: 37, name: "Park Place", type: "property", price: 350, color: "#0000ff" },
  { id: 38, name: "Luxury Tax", type: "tax", color: "#ffffff" },
  { id: 39, name: "Boardwalk", type: "property", price: 400, color: "#0000ff" },
]

export default function MonopolyBoard({ gameState }) {
  useEffect(() => {
    console.log("MonopolyBoard received gameState update:", gameState)
    console.log("Player positions:", gameState.players.map(p => ({ name: p.name, position: p.position })))
  }, [gameState])

  const renderTile = (tile, index) => {
    const playersOnTile = gameState.players.filter((p) => p.position === tile.id)

    return (
      <div key={tile.id} className={`tile tile-${index}`} data-type={tile.type}>
        <div className="tile-color-bar" style={{ background: tile.color }}></div>
        <div className="tile-content">
          <div className="tile-name">{tile.name}</div>
          {tile.price && <div className="tile-price">${tile.price}</div>}
        </div>
        {playersOnTile.length > 0 && (
          <div className="tile-players">
            {playersOnTile.map((player) => (
              <div key={player.id} className="player-token" style={{ background: player.color }}>
                {player.name[0]}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="monopoly-board">
      <div className="board-grid">
        {BOARD_TILES.map((tile, index) => renderTile(tile, index))}
        <div className="board-center">
          <h2>MONOPOLY</h2>
          <p>Turn {gameState.turn}</p>
        </div>
      </div>
    </div>
  )
}