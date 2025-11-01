import { useState } from 'react'
import './BufferPopup.css'
import ConfirmModal from './ConfirmModal'

const BufferPopup = ({ buffer, onEdit, onDelete, onClose, position }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleEdit = () => {
    onEdit(buffer)
    onClose()
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    onDelete(buffer)
    setShowDeleteConfirm(false)
    onClose()
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <div 
      className="buffer-popup" 
      style={{ 
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      <div className="buffer-popup-content">
        <div className="buffer-popup-header">
          <h4>{buffer.name}</h4>
          <button className="buffer-popup-close" onClick={onClose}>×</button>
        </div>
        <div className="buffer-popup-body">
          <div className="buffer-popup-info">
            <p><strong>Radio:</strong> {buffer.radius}m</p>
            <p><strong>Color:</strong> 
              <span 
                className="buffer-color-preview" 
                style={{ backgroundColor: buffer.color }}
              ></span>
            </p>
          </div>
          <div className="buffer-popup-actions">
            <button className="btn-edit-buffer" onClick={handleEdit}>
              ✏️ Editar
            </button>
            <button className="btn-delete-buffer" onClick={handleDeleteClick}>
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        message={`¿Estás seguro de eliminar el buffer "${buffer.name}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}

export default BufferPopup

