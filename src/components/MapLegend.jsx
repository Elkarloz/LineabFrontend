import './MapLegend.css'

const MapLegend = ({ isOpen, onToggle }) => {
  const tipos = [
    { nombre: 'Parque', color: '#f97316' },
    { nombre: 'Reciclaje', color: '#fbbf24' },
    { nombre: 'Zona Verde', color: '#22c55e' }
  ]

  return (
    <div className={`map-legend ${isOpen ? 'open' : ''}`}>
      <div className="legend-header">
        <h4>Leyenda</h4>
        <button onClick={onToggle} className="toggle-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
      {isOpen && (
        <div className="legend-items">
          {tipos.map((tipo) => (
            <div key={tipo.nombre} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: tipo.color }}
              ></div>
              <span className="legend-label">{tipo.nombre}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MapLegend

