import { useState, useEffect } from 'react'
import './PointForm.css'

const PointForm = ({ place, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    descripcion: '',
    estado: 'activo',
    latitude: '',
    longitude: ''
  })

  useEffect(() => {
    if (place) {
      setFormData({
        nombre: place.nombre || '',
        tipo: place.tipo || '',
        descripcion: place.descripcion || '',
        estado: place.estado || 'activo',
        latitude: place.latitude !== undefined && place.latitude !== null ? String(place.latitude) : '',
        longitude: place.longitude !== undefined && place.longitude !== null ? String(place.longitude) : ''
      })
    } else {
      // Resetear el formulario cuando no hay place
      setFormData({
        nombre: '',
        tipo: '',
        descripcion: '',
        estado: 'activo',
        latitude: '',
        longitude: ''
      })
    }
  }, [place])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nombre || !formData.tipo || !formData.latitude || !formData.longitude) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }
    onSave(formData)
  }

  const tipos = ['Parque', 'Reciclaje', 'Zona Verde']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{place?.id ? 'Editar Punto' : 'Agregar Punto'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="point-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Nombre del punto"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tipo">Tipo *</label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un tipo</option>
              {tipos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="3"
              placeholder="Descripción del punto"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">Latitud *</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                step="any"
                placeholder="4.6097"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="longitude">Longitud *</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                step="any"
                placeholder="-74.0817"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {place?.id ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PointForm

