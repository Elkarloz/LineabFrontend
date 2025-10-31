import './Header.css'

const Header = ({ user, onLogout, onAddPoint, onMenuToggle }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-button" onClick={onMenuToggle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1 className="app-title">Mapa Ecológico</h1>
      </div>
      
      <div className="header-right">
        <button className="action-button" onClick={onAddPoint}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Agregar Punto
        </button>
        {user && (
          <div className="user-menu">
            <span className="user-name">{user.nombre || user.email}</span>
            <button onClick={onLogout} className="logout-button">Cerrar sesión</button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

