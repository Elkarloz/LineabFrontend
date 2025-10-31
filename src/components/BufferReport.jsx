import { useState, useEffect, useMemo } from 'react'
import './BufferReport.css'

// Función para calcular distancia entre dos puntos usando Haversine
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000 // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distancia en metros
}

const BufferReport = ({ buffers, places, isOpen, onClose }) => {
  const [selectedBuffer, setSelectedBuffer] = useState(null)

  // Calcular puntos dentro de cada buffer
  const bufferData = useMemo(() => {
    return buffers.map(buffer => {
      const pointsInside = places.filter(place => {
        const distance = calculateDistance(
          buffer.latitude,
          buffer.longitude,
          place.latitude,
          place.longitude
        )
        return distance <= buffer.radius
      })

      // Agrupar por tipo
      const byType = {}
      pointsInside.forEach(point => {
        const tipo = point.tipo || 'Sin tipo'
        byType[tipo] = (byType[tipo] || 0) + 1
      })

      return {
        ...buffer,
        pointsInside,
        totalPoints: pointsInside.length,
        byType
      }
    })
  }, [buffers, places])

  useEffect(() => {
    if (bufferData.length > 0 && !selectedBuffer) {
      setSelectedBuffer(bufferData[0])
    }
  }, [bufferData])

  if (!isOpen || bufferData.length === 0) {
    return null
  }

  const currentData = selectedBuffer || bufferData[0]

  return (
    <div className="buffer-report-container">
      <div className="buffer-report-header">
        <h3>Reporte de Buffers</h3>
        <button className="buffer-report-close" onClick={onClose}>×</button>
      </div>

      <div className="buffer-report-content">
        <div className="buffer-selector">
          <label>Seleccionar Buffer:</label>
          <select 
            value={bufferData.findIndex(b => b.name === currentData.name)}
            onChange={(e) => setSelectedBuffer(bufferData[parseInt(e.target.value)])}
          >
            {bufferData.map((buffer, idx) => (
              <option key={idx} value={idx}>
                {buffer.name} ({buffer.totalPoints} puntos)
              </option>
            ))}
          </select>
        </div>

        <div className="buffer-info">
          <div className="buffer-details">
            <div className="buffer-detail-item">
              <span className="buffer-detail-label">Nombre:</span>
              <span className="buffer-detail-value">{currentData.name}</span>
            </div>
            <div className="buffer-detail-item">
              <span className="buffer-detail-label">Radio:</span>
              <span className="buffer-detail-value">{currentData.radius}m</span>
            </div>
            <div className="buffer-detail-item">
              <span className="buffer-detail-label">Total de puntos:</span>
              <span className="buffer-detail-value">{currentData.totalPoints}</span>
            </div>
          </div>

          {currentData.totalPoints > 0 && (
            <>
              <div className="buffer-types">
                <h4>Puntos por Tipo</h4>
                <div className="types-list">
                  {Object.entries(currentData.byType).map(([tipo, count]) => (
                    <div key={tipo} className="type-item">
                      <span className="type-name">{tipo}</span>
                      <span className="type-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="buffer-points-list">
                <h4>Puntos dentro del Buffer</h4>
                <div className="points-container">
                  {currentData.pointsInside.map((point, idx) => (
                    <div key={point.id || idx} className="point-item">
                      <div className="point-name">{point.nombre}</div>
                      <div className="point-type">{point.tipo || 'Sin tipo'}</div>
                      {point.descripcion && (
                        <div className="point-description">{point.descripcion}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {currentData.totalPoints === 0 && (
            <div className="no-points-message">
              No hay puntos dentro de este buffer
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BufferReport

