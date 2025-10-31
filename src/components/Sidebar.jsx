import { useState } from 'react'
import './Sidebar.css'

const Sidebar = ({ isOpen, onClose, filters, setFilters, places, onBufferTool, onRouteCalculator, onBufferReport }) => {
  const [types, setTypes] = useState([])

  // Obtener tipos únicos de los lugares
  const uniqueTypes = [...new Set(places.map(p => p.tipo))].filter(Boolean)

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menú</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="sidebar-content">
          {/* Sección de Filtros */}
          <div className="sidebar-section">
            <h3>Filtros y Búsqueda</h3>
            <div className="filter-group">
              <label htmlFor="search">Buscar por nombre</label>
              <input
                type="text"
                id="search"
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="type">Filtrar por tipo</label>
              <select
                id="type"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">Todos los tipos</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-info">
              <span>Total de puntos: {places.length}</span>
            </div>
          </div>

          {/* Sección de Herramientas */}
          <div className="sidebar-section">
            <h3>Herramientas de Análisis</h3>
            <button 
              className="tool-button-full"
              onClick={() => {
                onRouteCalculator()
                onClose()
              }}
            >
              🗺️ Calcular Ruta
            </button>
            <button 
              className="tool-button-full"
              onClick={() => {
                onBufferTool()
                onClose()
              }}
            >
              ⭕ Crear Buffer
            </button>
            <button 
              className="tool-button-full"
              onClick={() => {
                onBufferReport()
                onClose()
              }}
            >
              📊 Reporte de Buffers
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar

