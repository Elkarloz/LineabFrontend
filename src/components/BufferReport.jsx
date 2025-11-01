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
  const [selectedBufferName, setSelectedBufferName] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  // Inicializar o actualizar el buffer seleccionado cuando cambian los datos
  useEffect(() => {
    if (bufferData.length > 0) {
      if (!selectedBufferName) {
        // Si no hay buffer seleccionado, seleccionar el primero
        setSelectedBufferName(bufferData[0].name)
      } else {
        // Verificar si el buffer seleccionado aún existe
        const bufferExists = bufferData.some(b => b.name === selectedBufferName)
        if (!bufferExists) {
          // Si el buffer seleccionado ya no existe, seleccionar el primero
          setSelectedBufferName(bufferData[0].name)
        }
      }
    }
  }, [bufferData, selectedBufferName])

  // Resetear estado de pantalla completa cuando se cierra el panel
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false)
    }
  }, [isOpen])

  // Obtener el buffer seleccionado actualizado desde bufferData
  const currentData = bufferData.find(b => b.name === selectedBufferName) || bufferData[0] || null

  if (!isOpen || bufferData.length === 0 || !currentData) {
    return null
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`buffer-report-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="buffer-report-header">
        <h3>Reporte de Buffers</h3>
        <div className="buffer-report-header-buttons">
          <button 
            className="buffer-report-expand" 
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Contraer' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
          <button className="buffer-report-close" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="buffer-report-content">
        <div className="buffer-selector">
          <label>Seleccionar Buffer:</label>
          <select 
            value={selectedBufferName || ''}
            onChange={(e) => setSelectedBufferName(e.target.value)}
          >
            {bufferData.map((buffer) => (
              <option key={buffer.name} value={buffer.name}>
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

