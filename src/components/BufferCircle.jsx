import { useCallback, useEffect, useRef } from 'react'
import { Circle, useMap } from 'react-leaflet'
import L from 'leaflet'

const BufferCircle = ({ buffer, index, onEditBuffer, onDeleteBuffer, onRequestDeleteBuffer, isEditing, previewCenter }) => {
  const map = useMap()
  const circleRef = useRef(null)
  const layerRef = useRef(null)
  const popupContentRef = useRef(null)
  const cleanupRef = useRef(null)
  
  // Función para crear/actualizar el contenido del popup
  const createPopupContent = useCallback(() => {
    // Si ya existe el contenido, limpiar los listeners anteriores
    if (popupContentRef.current) {
      const existingContent = popupContentRef.current
      const editBtn = existingContent.querySelector('.btn-edit')
      const deleteBtn = existingContent.querySelector('.btn-delete')
      
      if (editBtn) {
        const newEditBtn = editBtn.cloneNode(true)
        editBtn.parentNode.replaceChild(newEditBtn, editBtn)
      }
      if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true)
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn)
      }
      
      // Actualizar el contenido HTML
      existingContent.innerHTML = `
        <h3>${buffer.name}</h3>
        <p><strong>Radio:</strong> ${buffer.radius}m</p>
        <p><strong>Color:</strong> 
          <span style="display: inline-block; width: 20px; height: 20px; border-radius: 4px; border: 1px solid #cbd5e0; background-color: ${buffer.color || '#ef4444'}; vertical-align: middle; margin-left: 4px;"></span>
        </p>
        <div class="popup-actions">
          <button class="btn-edit" data-buffer-index="${index}">Editar</button>
          <button class="btn-delete" data-buffer-index="${index}">Eliminar</button>
        </div>
      `
      
      return existingContent
    }
    
    // Crear nuevo contenido
    const popupContent = document.createElement('div')
    popupContent.className = 'popup-content'
    popupContent.innerHTML = `
      <h3>${buffer.name}</h3>
      <p><strong>Radio:</strong> ${buffer.radius}m</p>
      <p><strong>Color:</strong> 
        <span style="display: inline-block; width: 20px; height: 20px; border-radius: 4px; border: 1px solid #cbd5e0; background-color: ${buffer.color || '#ef4444'}; vertical-align: middle; margin-left: 4px;"></span>
      </p>
      <div class="popup-actions">
        <button class="btn-edit" data-buffer-index="${index}">Editar</button>
        <button class="btn-delete" data-buffer-index="${index}">Eliminar</button>
      </div>
    `
    popupContentRef.current = popupContent
    return popupContent
  }, [buffer.name, buffer.radius, buffer.color, index])
  
  // Inicializar el popup cuando el layer esté disponible
  useEffect(() => {
    let timeoutId = null
    let attempts = 0
    const maxAttempts = 100 // Máximo 1 segundo (100 * 10ms)
    
    // Esperar a que leafletElement esté disponible
    const checkAndInitialize = () => {
      attempts++
      
      const circle = circleRef.current
      if (!circle) {
        // Si el circle aún no está disponible, reintentar
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkAndInitialize, 10)
        }
        return
      }
      
      const layer = circle.leafletElement
      if (!layer) {
        // Reintentar después de un breve delay
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkAndInitialize, 10)
        }
        return
      }
      
      // Limpiar inicialización anterior si existe
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      
      layerRef.current = layer
      
      // Crear/actualizar el contenido del popup
      const popupContent = createPopupContent()
      
      // Agregar event listeners a los botones
      const editButton = popupContent.querySelector('.btn-edit')
      const deleteButton = popupContent.querySelector('.btn-delete')
      
      const handleEdit = (e) => {
        e.stopPropagation()
        e.preventDefault()
        onEditBuffer(buffer)
        if (layer.closePopup) {
          layer.closePopup()
        }
      }
      
      const handleDelete = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onRequestDeleteBuffer) {
          onRequestDeleteBuffer(buffer)
          if (layer.closePopup) {
            layer.closePopup()
          }
        } else {
          // Fallback si no se proporciona el callback
          if (window.confirm(`¿Estás seguro de eliminar el buffer "${buffer.name}"?`)) {
            onDeleteBuffer(buffer)
            if (layer.closePopup) {
              layer.closePopup()
            }
          }
        }
      }
      
      if (editButton) {
        editButton.addEventListener('click', handleEdit)
      }
      
      if (deleteButton) {
        deleteButton.addEventListener('click', handleDelete)
      }
      
      // Vincular el popup al círculo
      layer.bindPopup(popupContent, {
        className: 'buffer-popup-leaflet',
        autoClose: false,
        closeOnClick: false,
        closeButton: true
      })
      
      // Cambiar el cursor al pasar sobre el buffer
      const handleMouseOver = () => {
        if (!isEditing) {
          map.getContainer().style.cursor = 'pointer'
        }
      }
      
      const handleMouseOut = () => {
        if (!isEditing) {
          map.getContainer().style.cursor = ''
        }
      }
      
      layer.on('mouseover', handleMouseOver)
      layer.on('mouseout', handleMouseOut)
      
      // Agregar listener directo para el clic
      const handleLayerClick = (e) => {
        if (isEditing) return
        
        // Detener la propagación
        L.DomEvent.stopPropagation(e)
        if (e.originalEvent) {
          e.originalEvent.stopPropagation()
        }
        
        // Abrir el popup
        const latlng = e.latlng || layer.getLatLng()
        if (layer.openPopup && latlng) {
          layer.openPopup(latlng)
        } else if (layer._popup && latlng) {
          const popup = layer._popup
          popup.setLatLng(latlng)
          if (!popup.isOpen()) {
            popup.openOn(map)
          }
        }
      }
      
      layer.on('click', handleLayerClick)
      
      // Guardar función de limpieza
      cleanupRef.current = () => {
        layer.off('mouseover', handleMouseOver)
        layer.off('mouseout', handleMouseOut)
        layer.off('click', handleLayerClick)
        if (editButton) {
          editButton.removeEventListener('click', handleEdit)
        }
        if (deleteButton) {
          deleteButton.removeEventListener('click', handleDelete)
        }
        if (layer.unbindPopup) {
          layer.unbindPopup()
        }
      }
    }
    
    // Iniciar verificación después de un pequeño delay para asegurar que el ref esté asignado
    timeoutId = setTimeout(checkAndInitialize, 0)
    
    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      layerRef.current = null
    }
  }, [buffer, map, onEditBuffer, onDeleteBuffer, onRequestDeleteBuffer, isEditing, createPopupContent])
  
  // Handler para el click que abre el popup
  const handleCircleClick = useCallback((e) => {
    if (isEditing) return
    
    // Detener la propagación para evitar que el evento llegue al mapa
    L.DomEvent.stopPropagation(e)
    if (e.originalEvent) {
      e.originalEvent.stopPropagation()
      e.originalEvent.stopImmediatePropagation()
    }
    
    // Intentar obtener el layer desde el evento o desde la referencia
    let layer = e.target || layerRef.current
    if (!layer && circleRef.current) {
      layer = circleRef.current.leafletElement
    }
    
    if (!layer) {
      // Si aún no tenemos el layer, intentar obtenerlo del círculo
      if (circleRef.current?.leafletElement) {
        layer = circleRef.current.leafletElement
        layerRef.current = layer
      } else {
        return
      }
    }
    
    // Asegurar que tenemos el layer de Leaflet
    if (!layer.getLatLng && layerRef.current) {
      layer = layerRef.current
    }
    
    if (!layer || !layer.getLatLng) return
    
    // Si el popup no está vinculado, intentar vincularlo ahora
    if (!layer._popup) {
      const popupContent = createPopupContent()
      
      // Agregar event listeners a los botones
      const editButton = popupContent.querySelector('.btn-edit')
      const deleteButton = popupContent.querySelector('.btn-delete')
      
      const handleEdit = (e) => {
        e.stopPropagation()
        e.preventDefault()
        onEditBuffer(buffer)
        if (layer.closePopup) {
          layer.closePopup()
        }
      }
      
      const handleDelete = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onRequestDeleteBuffer) {
          onRequestDeleteBuffer(buffer)
          if (layer.closePopup) {
            layer.closePopup()
          }
        } else {
          // Fallback si no se proporciona el callback
          if (window.confirm(`¿Estás seguro de eliminar el buffer "${buffer.name}"?`)) {
            onDeleteBuffer(buffer)
            if (layer.closePopup) {
              layer.closePopup()
            }
          }
        }
      }
      
      if (editButton) {
        editButton.addEventListener('click', handleEdit)
      }
      
      if (deleteButton) {
        deleteButton.addEventListener('click', handleDelete)
      }
      
      layer.bindPopup(popupContent, {
        className: 'buffer-popup-leaflet',
        autoClose: false,
        closeOnClick: false,
        closeButton: true
      })
    }
    
    // Abrir el popup en la posición del clic
    const latlng = e.latlng || layer.getLatLng()
    if (layer.openPopup && latlng) {
      layer.openPopup(latlng)
    } else if (layer._popup && latlng) {
      // Fallback: abrir el popup manualmente
      const popup = layer._popup
      popup.setLatLng(latlng)
      if (!popup.isOpen()) {
        popup.openOn(map)
      }
    }
  }, [isEditing, buffer, onEditBuffer, onDeleteBuffer, onRequestDeleteBuffer, createPopupContent, map])
  
  const bufferColor = buffer.color || '#ef4444'
  
  // Si estamos editando este buffer, ocultarlo (el preview se muestra en MapView)
  if (isEditing) {
    return null
  }
  
  return (
    <Circle
      ref={circleRef}
      center={[buffer.latitude, buffer.longitude]}
      radius={buffer.radius}
      pathOptions={{ 
        color: bufferColor, 
        fillColor: bufferColor, 
        fillOpacity: 0.2,
        weight: 2,
        interactive: true
      }}
      eventHandlers={{
        click: handleCircleClick
      }}
    />
  )
}

export default BufferCircle


