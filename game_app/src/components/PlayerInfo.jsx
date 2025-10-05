import "./PlayerInfo.css"

export default function PlayerInfo({ players, currentPlayer }) {
  return (
    <div className="player-info-container">
      <h2>Players</h2>
      {players.map((player, index) => (
        <div key={player.id} className={`player-card ${index === currentPlayer ? "active" : ""}`}>
          <div className="player-header">
            <div className="player-avatar" style={{ background: player.color }}>
              {player.name[0]}
            </div>
            <div className="player-details">
              <h3>{player.name}</h3>
              {index === currentPlayer && <span className="current-turn">Current Turn</span>}
            </div>
          </div>
          <div className="player-stats">
            <div className="stat">
              <span className="stat-label">Money</span>
              <span className="stat-value">${player.money}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Properties</span>
              <span className="stat-value">{player.properties?.length || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Position</span>
              <span className="stat-value">{player.position}</span>
            </div>
          </div>
          
          {player.properties && player.properties.length > 0 && (
            <div className="player-properties">
              <h4>Owned Properties:</h4>
              <ul className="properties-list">
                {player.properties.map((prop, i) => (
                  <li key={i} className="property-item">{prop}</li>
                ))}
              </ul>
            </div>
          )}
          
          {player.in_jail && (
            <div className="jail-status">In Jail ({player.jail_turns || 0} turns)</div>
          )}
        </div>
      ))}
    </div>
  )
}