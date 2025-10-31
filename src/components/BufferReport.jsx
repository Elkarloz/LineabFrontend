import { useMemo } from 'react'
import './BufferReport.css'

// Función para calcular la distancia entre dos puntos en metros (fórmula de Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000 // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const BufferReport = ({ buffers, places, onClose }) => {
  // Calcular qué lugares están dentro de cada buffer
  const bufferData = useMemo(() => {
    if (!buffers || buffers.length === 0) {
      return []
    }

    return buffers.map((buffer, index) => {
      const placesInside = places.filter(place => {
        const distance = calculateDistance(
          buffer.latitude,
          buffer.longitude,
          place.latitude,
          place.longitude
        )
        return distance <= buffer.radius
      })

      // Agrupar por tipo
      const placesByType = placesInside.reduce((acc, place) => {
        const tipo = place.tipo || 'Sin tipo'
        if (!acc[tipo]) {
          acc[tipo] = []
        }
        acc[tipo].push(place)
        return acc
      }, {})

      return {
        ...buffer,
        index: index + 1,
        placesInside,
        placesByType,
        totalPlaces: placesInside.length
      }
    })
  }, [buffers, places])

  if (buffers.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="buffer-report-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Reporte de Buffers</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="report-content">
            <div className="no-buffers">
              <p>No hay buffers creados</p>
              <p className="no-buffers-hint">Crea buffers desde el menú para ver los datos</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="buffer-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reporte de Buffers</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="report-content">
          <div className="report-summary">
            <h3>Resumen General</h3>
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="stat-label">Total de Buffers:</span>
                <span className="stat-value">{buffers.length}</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Total de Lugares:</span>
                <span className="stat-value">
                  {bufferData.reduce((sum, b) => sum + b.totalPlaces, 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="buffers-list">
            {bufferData.map((buffer) => (
              <div key={buffer.index} className="buffer-report-card">
                <div 
                  className="buffer-header"
                  style={{ borderLeftColor: buffer.color }}
                >
                  <div className="buffer-title">
                    <span 
                      className="buffer-color-indicator"
                      style={{ backgroundColor: buffer.color }}
                    ></span>
                    <h4>{buffer.name || `Buffer ${buffer.index}`}</h4>
                  </div>
                  <div className="buffer-info">
                    <span className="buffer-info-item">
                      📍 Lat: {buffer.latitude.toFixed(6)}, Lng: {buffer.longitude.toFixed(6)}
                    </span>
                    <span className="buffer-info-item">
                      📏 Radio: {buffer.radius}m
                    </span>
                  </div>
                </div>

                <div className="buffer-content">
                  <div className="places-count">
                    <strong>Lugares dentro del buffer: {buffer.totalPlaces}</strong>
                  </div>

                  {buffer.totalPlaces > 0 ? (
                    <div className="places-details">
                      {Object.entries(buffer.placesByType).map(([tipo, places]) => (
                        <div key={tipo} className="places-type-group">
                          <h5 className="type-header">
                            {tipo} <span className="type-count">({places.length})</span>
                          </h5>
                          <div className="places-list">
                            {places.map((place) => (
                              <div key={place.id} className="place-item">
                                <div className="place-name">{place.nombre}</div>
                                {place.descripcion && (
                                  <div className="place-description">{place.descripcion}</div>
                                )}
                                <div className="place-location">
                                  📍 {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-places">
                      <p>No hay lugares dentro de este buffer</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BufferReport

