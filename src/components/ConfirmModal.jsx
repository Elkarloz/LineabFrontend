import './ConfirmModal.css'

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel, title = 'Confirmar eliminación' }) => {
  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  return (
    <div className="confirm-modal-backdrop" onClick={handleBackdropClick}>
      <div className="confirm-modal-content">
        <div className="confirm-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button className="confirm-modal-btn cancel-btn" onClick={onCancel}>
            Cancelar
          </button>
          <button className="confirm-modal-btn confirm-btn" onClick={onConfirm}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal

