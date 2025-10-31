import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const MarkerClusterGroup = ({ places, getPointIcon, handleEditPoint, handleDeletePoint }) => {
  const map = useMap()
  const clusterGroupRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!map) return

    // Crear el grupo de clusters
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        let size = 'small'
        
        if (count > 100) size = 'large'
        else if (count > 50) size = 'medium'

        return L.divIcon({
          html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: ${size === 'large' ? '50px' : size === 'medium' ? '40px' : '30px'}; height: ${size === 'large' ? '50px' : size === 'medium' ? '40px' : '30px'}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: ${size === 'large' ? '16px' : size === 'medium' ? '14px' : '12px'}; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${count}</div>`,
          className: 'marker-cluster-custom',
          iconSize: L.point(size === 'large' ? 50 : size === 'medium' ? 40 : 30, size === 'large' ? 50 : size === 'medium' ? 40 : 30)
        })
      }
    })

    clusterGroupRef.current = clusterGroup
    map.addLayer(clusterGroup)

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current)
        clusterGroupRef.current.clearLayers()
      }
    }
  }, [map])

  useEffect(() => {
    if (!clusterGroupRef.current || !places || !getPointIcon) return

    // Limpiar marcadores anteriores
    clusterGroupRef.current.clearLayers()
    markersRef.current.forEach(marker => {
      if (marker._popup && marker._popup._contentNode) {
        marker._popup._contentNode = null
      }
    })
    markersRef.current = []

    // Crear y agregar marcadores
    const validPlaces = places.filter(place => place.latitude && place.longitude)
    
    validPlaces.forEach((place) => {
      const marker = L.marker([place.latitude, place.longitude], {
        icon: getPointIcon(place.tipo)
      })

      // Crear el contenido del popup
      const popupContent = document.createElement('div')
      popupContent.className = 'popup-content'
      popupContent.innerHTML = `
        <h3>${place.nombre}</h3>
        <p><strong>Tipo:</strong> ${place.tipo}</p>
        ${place.descripcion ? `<p>${place.descripcion}</p>` : ''}
        <p><strong>Estado:</strong> ${place.estado}</p>
        <div class="popup-actions">
          <button class="btn-edit" data-place-id="${place.id}">Editar</button>
          <button class="btn-delete" data-place-id="${place.id}">Eliminar</button>
        </div>
      `

      // Agregar event listeners para los botones
      popupContent.querySelector('.btn-edit')?.addEventListener('click', () => {
        handleEditPoint(place)
      })
      popupContent.querySelector('.btn-delete')?.addEventListener('click', () => {
        handleDeletePoint(place.id)
      })

      marker.bindPopup(popupContent)
      clusterGroupRef.current.addLayer(marker)
      markersRef.current.push(marker)
    })
  }, [places, getPointIcon, handleEditPoint, handleDeletePoint])

  return null
}

export default MarkerClusterGroup

