import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Circle, Polyline, Marker } from 'react-leaflet'
import { placesAPI, routesAPI } from '../services/api'
import Header from '../components/Header'
import MapLayers from '../components/MapLayers'
import Sidebar from '../components/Sidebar'
import PointForm from '../components/PointForm'
import RouteCalculator from '../components/RouteCalculator'
import BufferTool from '../components/BufferTool'
import BufferReport from '../components/BufferReport'
import BufferCircle from '../components/BufferCircle'
import MapWrapper from '../components/MapWrapper'
import MarkerClusterGroup from '../components/MarkerClusterGroup'
import ConfirmModal from '../components/ConfirmModal'
import MapLegend from '../components/MapLegend'
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
  const [layersOpen, setLayersOpen] = useState(false)
  const [legendOpen, setLegendOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAddingPoint, setIsAddingPoint] = useState(false)
  const [isAddingBuffer, setIsAddingBuffer] = useState(false)
  const [showBufferReport, setShowBufferReport] = useState(false)
  const [isEditingBuffer, setIsEditingBuffer] = useState(false)
  const [editingBufferIndex, setEditingBufferIndex] = useState(null)
  const [previewBufferCenter, setPreviewBufferCenter] = useState(null)
  const [isAddingRoute, setIsAddingRoute] = useState(false)
  const [routeOrigin, setRouteOrigin] = useState(null)
  const [routeDestination, setRouteDestination] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePointId, setDeletePointId] = useState(null)
  const [showDeleteBufferConfirm, setShowDeleteBufferConfirm] = useState(false)
  const [bufferToDelete, setBufferToDelete] = useState(null)

  useEffect(() => {
    loadPlaces()
  }, [])

  useEffect(() => {
    filterPlaces()
  }, [places, filters])

  useEffect(() => {
    // Obtener la ubicación actual del usuario
    if (navigator.geolocation) {
      const getLocationWithFallback = (options) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setMapCenter([latitude, longitude])
            setZoom(15) // Zoom más cercano para la ubicación actual
          },
          (error) => {
            // Solo intentar fallback si el error es de señal/timeout (no si es permiso denegado)
            // No mostramos errores en consola ya que es un comportamiento esperado cuando
            // la geolocalización no está disponible (localhost, GPS desactivado, etc.)
            if (options.enableHighAccuracy && (error.code === 2 || error.code === 3)) {
              // Intentar con configuración más permisiva (sin alta precisión, mayor timeout)
              getLocationWithFallback({
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 300000 // Aceptar ubicación de hasta 5 minutos
              })
            }
            // Si falla o es permiso denegado, simplemente mantener Bogotá como fallback
          },
          options
        )
      }

      // Intentar primero con alta precisión
      getLocationWithFallback({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    } else {
      console.warn('Geolocalización no está disponible en este navegador')
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
        if (isAddingRoute) {
          setIsAddingRoute(false)
          setRouteOrigin(null)
          setRouteDestination(null)
          document.body.style.cursor = ''
        }
        if (isEditingBuffer) {
          cancelBufferEdit()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isAddingPoint, isAddingBuffer, isAddingRoute, isEditingBuffer])
  
  // Manejar movimiento del mouse cuando estamos editando
  useEffect(() => {
    if (!isEditingBuffer) return
    
    const handleMouseMove = (e) => {
      // Esto se manejará en el MapWrapper con el evento de mousemove
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isEditingBuffer])

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
    // Si estamos editando un buffer, guardar la nueva posición
    if (isEditingBuffer && editingBufferIndex !== null) {
      const { lat, lng } = e.latlng
      const updatedBuffers = [...buffers]
      updatedBuffers[editingBufferIndex] = {
        ...updatedBuffers[editingBufferIndex],
        latitude: lat,
        longitude: lng
      }
      setBuffers(updatedBuffers)
      setIsEditingBuffer(false)
      setEditingBufferIndex(null)
      setPreviewBufferCenter(null)
      document.body.style.cursor = ''
      return
    }
    
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

    // Si estamos en modo de agregar ruta, capturar los dos puntos
    if (isAddingRoute) {
      const { lat, lng } = e.latlng
      const point = { latitude: lat, longitude: lng }
      
      if (!routeOrigin) {
        // Primer punto seleccionado (origen)
        setRouteOrigin(point)
      } else {
        // Segundo punto seleccionado (destino) - calcular ruta automáticamente
        setRouteDestination(point)
        calculateRouteAutomatically(routeOrigin, point)
      }
      return
    }
    
  }

  const calculateRouteAutomatically = async (origin, destination) => {
    try {
      const response = await routesAPI.calculateRoute(origin, destination)
      const routeData = response.data.data || response.data
      setRoute(routeData)
      setIsAddingRoute(false)
      setRouteOrigin(null)
      setRouteDestination(null)
      document.body.style.cursor = ''
    } catch (error) {
      console.error('Error al calcular la ruta:', error)
      alert('Error al calcular la ruta')
      setIsAddingRoute(false)
      setRouteOrigin(null)
      setRouteDestination(null)
      document.body.style.cursor = ''
    }
  }
  
  const handleMapMouseMove = (e) => {
    // Si estamos editando, actualizar la posición de preview
    if (isEditingBuffer && e.latlng) {
      setPreviewBufferCenter([e.latlng.lat, e.latlng.lng])
    }
  }
  
  const handleEditBuffer = (buffer) => {
    const bufferIndex = buffers.findIndex(b => b.name === buffer.name && 
      b.latitude === buffer.latitude && 
      b.longitude === buffer.longitude)
    
    if (bufferIndex !== -1) {
      setEditingBufferIndex(bufferIndex)
      setIsEditingBuffer(true)
      setPreviewBufferCenter([buffer.latitude, buffer.longitude])
      document.body.style.cursor = 'crosshair'
    }
  }
  
  const handleRequestDeleteBuffer = (buffer) => {
    setBufferToDelete(buffer)
    setShowDeleteBufferConfirm(true)
  }

  const handleDeleteBuffer = (buffer) => {
    const bufferIndex = buffers.findIndex(b => b.name === buffer.name && 
      b.latitude === buffer.latitude && 
      b.longitude === buffer.longitude)
    
    if (bufferIndex !== -1) {
      const updatedBuffers = buffers.filter((_, idx) => idx !== bufferIndex)
      setBuffers(updatedBuffers)
    }
  }

  const handleDeleteBufferConfirm = () => {
    if (bufferToDelete) {
      handleDeleteBuffer(bufferToDelete)
    }
    setShowDeleteBufferConfirm(false)
    setBufferToDelete(null)
  }

  const handleDeleteBufferCancel = () => {
    setShowDeleteBufferConfirm(false)
    setBufferToDelete(null)
  }
  
  const cancelBufferEdit = () => {
    setIsEditingBuffer(false)
    setEditingBufferIndex(null)
    setPreviewBufferCenter(null)
    document.body.style.cursor = ''
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
  
  const handleAddRoute = () => {
    setIsAddingRoute(true)
    setRouteOrigin(null)
    setRouteDestination(null)
    setRoute(null)
    document.body.style.cursor = 'crosshair'
  }

  const handleEditPoint = (place) => {
    setSelectedPlace(place)
    setShowPointForm(true)
    setIsAddingPoint(false)
  }

  const handleDeletePoint = (id) => {
    setDeletePointId(id)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (deletePointId) {
      try {
        await placesAPI.delete(deletePointId)
        await loadPlaces()
      } catch (error) {
        alert('Error al eliminar el punto')
      }
    }
    setShowDeleteConfirm(false)
    setDeletePointId(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setDeletePointId(null)
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
      'Parque': '#f97316',        // Naranja
      'Reciclaje': '#fbbf24',     // Amarillo
      'Zona Verde': '#22c55e'     // Verde
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
        onRouteCalculator={handleAddRoute}
        onShowReports={() => setShowBufferReport(true)}
        user={user}
        onLogout={logout}
      />
      
      <div className={`map-container ${isAddingPoint ? 'adding-point' : ''} ${isAddingBuffer ? 'adding-buffer' : ''} ${isAddingRoute ? 'adding-route' : ''}`}>
        {(isAddingPoint || isAddingBuffer || isAddingRoute) && (
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
              : isAddingBuffer
              ? 'Haz clic en el mapa para crear el buffer (ESC para cancelar)'
              : routeOrigin
              ? 'Haz clic en el mapa para seleccionar el destino (ESC para cancelar)'
              : 'Haz clic en el mapa para seleccionar el origen (ESC para cancelar)'
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
            onMapMouseMove={handleMapMouseMove}
          >
            <MarkerClusterGroup
              places={filteredPlaces}
              getPointIcon={getPointIcon}
              handleEditPoint={handleEditPoint}
              handleDeletePoint={handleDeletePoint}
            />
            
            {buffers.map((buffer, idx) => (
              <BufferCircle
                key={`buffer-${idx}`}
                buffer={buffer}
                index={idx}
                onEditBuffer={handleEditBuffer}
                onDeleteBuffer={handleDeleteBuffer}
                onRequestDeleteBuffer={handleRequestDeleteBuffer}
                isEditing={isEditingBuffer && editingBufferIndex === idx}
                previewCenter={null}
              />
            ))}
            
            {/* Buffer preview cuando estamos editando - sigue el mouse */}
            {isEditingBuffer && editingBufferIndex !== null && previewBufferCenter && (
                <Circle
                center={previewBufferCenter}
                radius={buffers[editingBufferIndex].radius}
                pathOptions={{ 
                  color: buffers[editingBufferIndex].color || '#ef4444', 
                  fillColor: buffers[editingBufferIndex].color || '#ef4444', 
                  fillOpacity: 0.4,
                  weight: 3,
                  dashArray: '10, 5'
                }}
              />
            )}

            {/* Mostrar marcadores temporales para origen y destino durante la selección */}
            {routeOrigin && (
              <Marker
                position={[routeOrigin.latitude, routeOrigin.longitude]}
                icon={L.divIcon({
                  className: 'route-marker',
                  html: '<div style="background-color: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              />
            )}
            {routeDestination && (
              <Marker
                position={[routeDestination.latitude, routeDestination.longitude]}
                icon={L.divIcon({
                  className: 'route-marker',
                  html: '<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              />
            )}

            {/* Mostrar la ruta calculada */}
            {route && route.origin && route.destination && (
              <>
                <Marker
                  position={[route.origin.latitude, route.origin.longitude]}
                  icon={L.divIcon({
                    className: 'route-marker',
                    html: '<div style="background-color: #22c55e; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [18, 18],
                    iconAnchor: [9, 9]
                  })}
                />
                <Marker
                  position={[route.destination.latitude, route.destination.longitude]}
                  icon={L.divIcon({
                    className: 'route-marker',
                    html: '<div style="background-color: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [18, 18],
                    iconAnchor: [9, 9]
                  })}
                />
                <Polyline
                  positions={
                    route.waypoints && route.waypoints.length > 0
                      ? route.waypoints.map(point => [point[0], point[1]])
                      : [
                          [route.origin.latitude, route.origin.longitude],
                          [route.destination.latitude, route.destination.longitude]
                        ]
                  }
                  pathOptions={{ 
                    color: '#3b82f6',
                    weight: 5,
                    opacity: 0.8
                  }}
                />
              </>
            )}
          </MapWrapper>
        )}

        <MapLayers 
          mapType={mapType} 
          setMapType={setMapType}
          isOpen={layersOpen}
          onToggle={() => setLayersOpen(!layersOpen)}
        />
        
        <MapLegend 
          isOpen={legendOpen}
          onToggle={() => setLegendOpen(!legendOpen)}
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
      
      {isEditingBuffer && (
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
          Haz clic en el mapa para mover el buffer (ESC para cancelar)
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        message="¿Estás seguro de eliminar este punto?"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <ConfirmModal
        isOpen={showDeleteBufferConfirm}
        message={bufferToDelete ? `¿Estás seguro de eliminar el buffer "${bufferToDelete.name}"?` : ''}
        onConfirm={handleDeleteBufferConfirm}
        onCancel={handleDeleteBufferCancel}
      />
    </div>
  )
}

export default MapView

