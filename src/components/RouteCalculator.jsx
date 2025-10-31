import { useState } from 'react'
import './RouteCalculator.css'

const RouteCalculator = ({ onClose, onCalculateRoute, route }) => {
  const [origin, setOrigin] = useState({ latitude: '', longitude: '', name: '' })
  const [destination, setDestination] = useState({ latitude: '', longitude: '', name: '' })
  const [loading, setLoading] = useState(false)

  const handleOriginChange = (field, value) => {
    setOrigin({ ...origin, [field]: value })
  }

  const handleDestinationChange = (field, value) => {
    setDestination({ ...destination, [field]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      alert('Por favor completa las coordenadas de origen y destino')
      return
    }

    setLoading(true)
    await onCalculateRoute(
      {
        latitude: parseFloat(origin.latitude),
        longitude: parseFloat(origin.longitude),
        name: origin.name || undefined
      },
      {
        latitude: parseFloat(destination.latitude),
        longitude: parseFloat(destination.longitude),
        name: destination.name || undefined
      }
    )
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="route-calculator" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Calcular Ruta</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="route-form">
          <div className="form-section">
            <h3>Origen</h3>
            <div className="form-group">
              <label htmlFor="origin-name">Nombre (opcional)</label>
              <input
                type="text"
                id="origin-name"
                value={origin.name}
                onChange={(e) => handleOriginChange('name', e.target.value)}
                placeholder="Nombre del punto de origen"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="origin-lat">Latitud *</label>
                <input
                  type="number"
                  id="origin-lat"
                  value={origin.latitude}
                  onChange={(e) => handleOriginChange('latitude', e.target.value)}
                  required
                  step="any"
                  placeholder="4.6097"
                />
              </div>
              <div className="form-group">
                <label htmlFor="origin-lng">Longitud *</label>
                <input
                  type="number"
                  id="origin-lng"
                  value={origin.longitude}
                  onChange={(e) => handleOriginChange('longitude', e.target.value)}
                  required
                  step="any"
                  placeholder="-74.0817"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Destino</h3>
            <div className="form-group">
              <label htmlFor="dest-name">Nombre (opcional)</label>
              <input
                type="text"
                id="dest-name"
                value={destination.name}
                onChange={(e) => handleDestinationChange('name', e.target.value)}
                placeholder="Nombre del punto de destino"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dest-lat">Latitud *</label>
                <input
                  type="number"
                  id="dest-lat"
                  value={destination.latitude}
                  onChange={(e) => handleDestinationChange('latitude', e.target.value)}
                  required
                  step="any"
                  placeholder="4.6097"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dest-lng">Longitud *</label>
                <input
                  type="number"
                  id="dest-lng"
                  value={destination.longitude}
                  onChange={(e) => handleDestinationChange('longitude', e.target.value)}
                  required
                  step="any"
                  placeholder="-74.0817"
                />
              </div>
            </div>
          </div>

          {route && (
            <div className="route-results">
              <h3>Resultados</h3>
              {route.distance && (
                <div className="result-item">
                  <strong>Distancia:</strong> {route.distance.toFixed(2)} km
                </div>
              )}
              {route.duration && (
                <div className="result-item">
                  <strong>Duración estimada:</strong> {route.duration} minutos
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cerrar
            </button>
            <button type="submit" disabled={loading} className="btn-calculate">
              {loading ? 'Calculando...' : 'Calcular Ruta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RouteCalculator

