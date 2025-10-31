import './MapLayers.css'

const MapLayers = ({ mapType, setMapType, isOpen, onToggle }) => {
  const layers = [
    { id: 'normal', name: 'Normal', icon: '🗺️' },
    { id: 'satelital', name: 'Satelital', icon: '🛰️' },
    { id: 'calles', name: 'Calles', icon: '🏠' },
    { id: 'terreno', name: 'Terreno', icon: '⛰️' }
  ]

  return (
    <div className={`map-layers-card ${isOpen ? 'open' : ''}`}>
      <div className="layers-header">
        <h3>Capas del Mapa</h3>
        <button onClick={onToggle} className="toggle-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
      
      {isOpen && (
        <div className="layers-list">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={`layer-option ${mapType === layer.id ? 'selected' : ''}`}
              onClick={() => setMapType(layer.id)}
            >
              <div className="radio-button">
                {mapType === layer.id && <div className="radio-dot"></div>}
              </div>
              <span className="layer-icon">{layer.icon}</span>
              <span className="layer-name">{layer.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MapLayers

