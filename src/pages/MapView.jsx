import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Circle } from 'react-leaflet'
import { placesAPI, routesAPI } from '../services/api'
import Header from '../components/Header'
import MapLayers from '../components/MapLayers'
import Sidebar from '../components/Sidebar'
import PointForm from '../components/PointForm'
import RouteCalculator from '../components/RouteCalculator'
import BufferTool from '../components/BufferTool'
import BufferReport from '../components/BufferReport'
import MapWrapper from '../components/MapWrapper'
import MarkerClusterGroup from '../components/MarkerClusterGroup'
import './MapView.css'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const MapView = () => {
  const { user, logout } = useAuth()
  const [places, setPlaces] = useState([])
  const [filteredPlaces, setFilteredPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState([4.6097, -74.0817]) // Bogotá por defecto
  const [zoom, setZoom] = useState(13)
  const [mapType, setMapType] = useState('normal')
  const [filters, setFilters] = useState({ type: '', search: '' })
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [showPointForm, setShowPointForm] = useState(false)
  const [showRouteCalculator, setShowRouteCalculator] = useState(false)
  const [showBufferTool, setShowBufferTool] = useState(false)
  const [route, setRoute] = useState(null)
  const [buffers, setBuffers] = useState([])
  const [bufferCounter, setBufferCounter] = useState(1)
  const [layersOpen, setLayersOpen] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAddingPoint, setIsAddingPoint] = useState(false)
  const [isAddingBuffer, setIsAddingBuffer] = useState(false)
  const [showBufferReport, setShowBufferReport] = useState(false)

  useEffect(() => {
    loadPlaces()
  }, [])

  useEffect(() => {
    filterPlaces()
  }, [places, filters])

  useEffect(() => {
    // Obtener la ubicación actual del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMapCenter([latitude, longitude])
          setZoom(15) // Zoom más cercano para la ubicación actual
        },
        (error) => {
          console.warn('Error obteniendo ubicación:', error)
          // Mantener Bogotá como fallback si no se puede obtener la ubicación
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    }
  }, [])

  useEffect(() => {
    // Manejar la tecla ESC para cancelar el modo de agregar punto o buffer
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        if (isAddingPoint) {
          setIsAddingPoint(false)
        }
        if (isAddingBuffer) {
          setIsAddingBuffer(false)
          document.body.style.cursor = ''
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isAddingPoint, isAddingBuffer])

  const loadPlaces = async () => {
    try {
      setLoading(true)
      // Primero intentar sin geojson para evitar errores
      const response = await placesAPI.getAll()
      
      // Manejar diferentes formatos de respuesta
      let placesData = []
      
      if (response.data.type === 'FeatureCollection') {
        // Formato GeoJSON
        placesData = response.data.features.map(feature => ({
          id: feature.properties.id,
          nombre: feature.properties.nombre,
          tipo: feature.properties.tipo,
          descripcion: feature.properties.descripcion || '',
          estado: feature.properties.estado || 'activo',
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0]
        }))
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Formato estándar del backend
        placesData = response.data.data.map(place => ({
          id: place.id,
          nombre: place.nombre,
          tipo: place.tipo,
          descripcion: place.descripcion || '',
          estado: place.estado || 'activo',
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude)
        }))
      } else if (Array.isArray(response.data)) {
        // Array directo
        placesData = response.data.map(place => ({
          id: place.id,
          nombre: place.nombre,
          tipo: place.tipo,
          descripcion: place.descripcion || '',
          estado: place.estado || 'activo',
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude)
        }))
      }
      
      setPlaces(placesData)
    } catch (error) {
      console.error('Error cargando puntos:', error)
      // Mostrar mensaje de error al usuario
      if (error.response) {
        console.error('Error del servidor:', error.response.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const filterPlaces = () => {
    let filtered = [...places]

    if (filters.type) {
      filtered = filtered.filter(place => place.tipo === filters.type)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(place =>
        place.nombre.toLowerCase().includes(searchLower) ||
        (place.descripcion && place.descripcion.toLowerCase().includes(searchLower))
      )
    }

    setFilteredPlaces(filtered)
  }

  const handleMapClick = (e) => {
    // Si estamos en modo de agregar punto, capturar las coordenadas y abrir el modal
    if (isAddingPoint) {
      const { lat, lng } = e.latlng
      setSelectedPlace({
        latitude: lat,
        longitude: lng
      })
      setShowPointForm(true)
      setIsAddingPoint(false)
      return
    }
    
    // Si estamos en modo de agregar buffer, capturar las coordenadas y abrir el modal
    if (isAddingBuffer) {
      const { lat, lng } = e.latlng
      setSelectedPlace({
        latitude: lat,
        longitude: lng
      })
      setShowBufferTool(true)
      setIsAddingBuffer(false)
      document.body.style.cursor = ''
      return
    }
  }

  const handleAddPoint = () => {
    setSelectedPlace(null)
    setIsAddingPoint(true)
  }

  const handleAddBuffer = () => {
    setSelectedPlace(null)
    setIsAddingBuffer(true)
    document.body.style.cursor = 'crosshair'
  }

  const handleEditPoint = (place) => {
    setSelectedPlace(place)
    setShowPointForm(true)
    setIsAddingPoint(false)
  }

  const handleDeletePoint = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este punto?')) {
      try {
        await placesAPI.delete(id)
        await loadPlaces()
      } catch (error) {
        alert('Error al eliminar el punto')
      }
    }
  }

  const handleSavePoint = async (pointData) => {
    try {
      if (selectedPlace && selectedPlace.id) {
        await placesAPI.update(selectedPlace.id, pointData)
      } else {
        await placesAPI.create(pointData)
      }
      setShowPointForm(false)
      setSelectedPlace(null)
      setIsAddingPoint(false)
      document.body.style.cursor = ''
      await loadPlaces()
    } catch (error) {
      alert('Error al guardar el punto')
    }
  }


  const getPointIcon = (tipo) => {
    const colors = {
      'parque': '#f97316',        // Naranja
      'reciclaje': '#fbbf24',     // Amarillo
      'zona_verde': '#22c55e'     // Verde
    }
    const color = colors[tipo] || '#6b7280' // Gris por defecto
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
  }

  return (
    <div className="map-view">
      <Header 
        user={user} 
        onLogout={logout}
        onAddPoint={handleAddPoint}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filters={filters}
        setFilters={setFilters}
        places={places}
        onBufferTool={handleAddBuffer}
        onRouteCalculator={() => setShowRouteCalculator(true)}
        onShowReports={() => setShowBufferReport(true)}
      />
      
      <div className={`map-container ${isAddingPoint ? 'adding-point' : ''} ${isAddingBuffer ? 'adding-buffer' : ''}`}>
        {(isAddingPoint || isAddingBuffer) && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(59, 130, 246, 0.95)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {isAddingPoint 
              ? 'Haz clic en el mapa para agregar el punto (ESC para cancelar)'
              : 'Haz clic en el mapa para crear el buffer (ESC para cancelar)'
            }
          </div>
        )}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p>Cargando mapa...</p>
          </div>
        ) : (
          <MapWrapper 
            center={mapCenter} 
            zoom={zoom} 
            mapType={mapType}
            onMapClick={handleMapClick}
          >
            <MarkerClusterGroup
              places={filteredPlaces}
              getPointIcon={getPointIcon}
              handleEditPoint={handleEditPoint}
              handleDeletePoint={handleDeletePoint}
            />
            
            {buffers.map((buffer, idx) => {
              const bufferColor = buffer.color || '#ef4444'
              // Crear una versión más clara del color para el relleno
              const fillColor = bufferColor + '80' // Agregar opacidad hexadecimal
              return (
                <Circle
                  key={`buffer-${idx}`}
                  center={[buffer.latitude, buffer.longitude]}
                  radius={buffer.radius}
                  pathOptions={{ 
                    color: bufferColor, 
                    fillColor: bufferColor, 
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                />
              )
            })}
          </MapWrapper>
        )}

        <MapLayers 
          mapType={mapType} 
          setMapType={setMapType}
          isOpen={layersOpen}
          onToggle={() => setLayersOpen(!layersOpen)}
        />
      </div>

      {showPointForm && (
        <PointForm
          place={selectedPlace}
          onClose={() => {
            setShowPointForm(false)
            setSelectedPlace(null)
            setIsAddingPoint(false)
          }}
          onSave={handleSavePoint}
        />
      )}

      {showRouteCalculator && (
        <RouteCalculator
          onClose={() => setShowRouteCalculator(false)}
          onCalculateRoute={async (origin, destination) => {
            try {
              const response = await routesAPI.calculateRoute(origin, destination)
              setRoute(response.data.data || response.data)
            } catch (error) {
              alert('Error al calcular la ruta')
            }
          }}
          route={route}
        />
      )}

      {showBufferTool && (
        <BufferTool
          onClose={() => {
            setShowBufferTool(false)
            setSelectedPlace(null)
            setIsAddingBuffer(false)
            document.body.style.cursor = ''
          }}
          bufferNumber={bufferCounter}
          selectedPlace={selectedPlace}
          onSave={(bufferData) => {
            setBuffers([...buffers, {
              name: bufferData.name,
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
              radius: bufferData.radius,
              color: bufferData.color
            }])
            setBufferCounter(bufferCounter + 1)
            setShowBufferTool(false)
            setSelectedPlace(null)
            setIsAddingBuffer(false)
            document.body.style.cursor = ''
          }}
        />
      )}

      <BufferReport
        buffers={buffers}
        places={places}
        isOpen={showBufferReport}
        onClose={() => setShowBufferReport(false)}
      />
    </div>
  )
}

export default MapView

