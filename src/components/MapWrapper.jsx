import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'

function MapController({ center, zoom }) {
  const map = useMap()
  
  useEffect(() => {
    if (center && map) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  
  return null
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e)
      }
    }
  })
  return null
}

const MapWrapper = ({ center, zoom, children, mapType, onMapClick }) => {
  const getTileLayerUrl = () => {
    switch (mapType) {
      case 'satelital':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      case 'calles':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      case 'terreno':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <MapController center={center} zoom={zoom} />
      <MapClickHandler onMapClick={onMapClick} />
      <TileLayer 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={getTileLayerUrl()} 
      />
      {children}
    </MapContainer>
  )
}

export default MapWrapper

