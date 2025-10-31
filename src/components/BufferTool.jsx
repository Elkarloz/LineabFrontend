import { useState } from 'react'
import './BufferTool.css'

const BufferTool = ({ onClose, onSave, bufferNumber = 1, selectedPlace }) => {
  const [radius, setRadius] = useState(1000)
  const [color, setColor] = useState('#ef4444') // Rojo por defecto

  const colorOptions = [
    { value: '#ef4444', label: 'Rojo' },
    { value: '#3b82f6', label: 'Azul' },
    { value: '#10b981', label: 'Verde' },
    { value: '#f59e0b', label: 'Naranja' },
    { value: '#8b5cf6', label: 'Morado' },
    { value: '#ec4899', label: 'Rosa' },
    { value: '#06b6d4', label: 'Cian' },
    { value: '#84cc16', label: 'Lima' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!selectedPlace) {
      return
    }
    
    onSave({
      radius: parseInt(radius),
      color: color,
      name: `buffer${bufferNumber}`
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="buffer-tool" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crear Buffer</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="buffer-form">
          <div className="form-group">
            <label htmlFor="radius">Radio (metros)</label>
            <input
              type="number"
              id="radius"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              min="1"
              max="10000"
              placeholder="1000"
            />
            <small>Máximo 10,000 metros</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="buffer-color">Color del Buffer</label>
            <select
              id="buffer-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="color-select"
            >
              {colorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {selectedPlace && (
            <div className="buffer-info">
              <p>Ubicación seleccionada:</p>
              <p style={{ marginTop: '4px', fontWeight: '500' }}>
                Lat: {selectedPlace.latitude.toFixed(6)}, Lng: {selectedPlace.longitude.toFixed(6)}
              </p>
            </div>
          )}
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-create" disabled={!selectedPlace}>
              Crear Buffer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BufferTool

