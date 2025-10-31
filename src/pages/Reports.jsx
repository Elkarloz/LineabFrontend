import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { placesAPI } from '../services/api'
import Header from '../components/Header'
import './Reports.css'

const Reports = () => {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState('tipo')

  useEffect(() => {
    loadStats()
  }, [groupBy])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await placesAPI.getStats(groupBy)
      setStats(response.data.data || response.data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGroupByLabel = () => {
    switch (groupBy) {
      case 'tipo': return 'Tipo'
      case 'estado': return 'Estado'
      case 'ciudad': return 'Ciudad'
      default: return 'Categoría'
    }
  }

  return (
    <div className="reports-page">
      <Header user={user} onLogout={logout} />
      
      <div className="reports-container">
        <div className="reports-header">
          <h1>Reportes y Estadísticas</h1>
          <Link to="/map" className="back-link">← Volver al Mapa</Link>
        </div>

        <div className="reports-controls">
          <label htmlFor="groupBy">Agrupar por:</label>
          <select
            id="groupBy"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
          >
            <option value="tipo">Tipo</option>
            <option value="estado">Estado</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Cargando estadísticas...</div>
        ) : stats && stats.length > 0 ? (
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-value">{stat.count || stat.cantidad || 0}</div>
                <div className="stat-label">
                  {stat[groupBy] || stat.categoria || 'Sin categoría'}
                </div>
                {stat.percentage && (
                  <div className="stat-percentage">{stat.percentage.toFixed(1)}%</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-stats">
            <p>No hay estadísticas disponibles</p>
          </div>
        )}

        <div className="reports-summary">
          <h2>Resumen General</h2>
          {stats && stats.length > 0 && (
            <div className="summary-content">
              <div className="summary-item">
                <span className="summary-label">Total de Puntos:</span>
                <span className="summary-value">
                  {stats.reduce((sum, stat) => sum + (stat.count || stat.cantidad || 0), 0)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Categorías:</span>
                <span className="summary-value">{stats.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports

