import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Estilos.css';
import { useCart } from '../context/CartContext';
import CartModal from '../components/CartModal';
import logo from '../assets/logo.jpg';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const cartButtonRef = useRef(null);
  const userMenuRef = useRef(null);
  const { cartItems, updateQuantity, removeFromCart, getTotalItems } = useCart();
  const navigate = useNavigate();

  const isFormPage = window.location.pathname === '/login' || window.location.pathname === '/register';

  // 🔹 Leer usuario directamente de localStorage o sessionStorage
  const storedUser = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || 'null');
  const photoURL = storedUser ? storedUser.photo : "https://static.vecteezy.com/system/resources/previews/007/407/996/non_2x/user-icon-person-icon-client-symbol-login-head-sign-icon-design-vector.jpg";

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
      if (cartButtonRef.current && !cartButtonRef.current.contains(event.target)) setIsCartOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('token');
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const handleNavigation = (e, path) => {
    if (isFormPage) {
      const confirmacion = window.confirm('¿Estás seguro que deseas salir? Los datos ingresados se perderán.');
      if (!confirmacion) {
        e.preventDefault();
        return;
      }
    }
    navigate(path);
  };

  return (
    <nav className="floating-navbar">
      <div className="nav-container">
        <Link className="nav-brand" to="/" onClick={(e) => handleNavigation(e, '/')}>
          <img src={logo} alt="Busch Burier" height="40" />
          <span className="brand-text">Busch Burier</span>
        </Link>
        
        <div className="nav-links">
          {/* Menú principal */}
          <div className="nav-dropdown" ref={menuRef}>
            <button className="nav-link dropdown-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <i className="fas fa-utensils"></i> <span>Menú</span>
            </button>
            <div className={`dropdown-content ${isMenuOpen ? 'show' : ''}`}>
              <Link to="/hamburguesas" onClick={(e) => { setIsMenuOpen(false); handleNavigation(e, '/hamburguesas'); }}>Hamburguesas</Link>
              <Link to="/salchipapas" onClick={(e) => { setIsMenuOpen(false); handleNavigation(e, '/salchipapas'); }}>Salchipapas</Link>
              <Link to="/perros" onClick={(e) => { setIsMenuOpen(false); handleNavigation(e, '/perros'); }}>Perros Calientes</Link>
            </div>
          </div>

          {/* Usuario o login */}
          {storedUser ? (
            <div className="nav-dropdown" ref={userMenuRef}>
              <button className="nav-link user-menu-button" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                <img
                  src={photoURL}
                  alt="avatar"
                  className="rounded-circle me-2"
                  width="30"
                  height="30"
                  style={{ objectFit: "cover", border: "2px solid #fff" }}
                />
                <span>{storedUser.displayName}</span>
              </button>

              <div className={`dropdown-content user-dropdown ${isUserMenuOpen ? 'show' : ''}`}>
                <div className="user-info">
                  <img
                    src={photoURL}
                    alt="avatar"
                    className="rounded-circle me-2"
                    width="40"
                    height="40"
                    style={{ objectFit: "cover", border: "2px solid #ccc" }}
                  />
                  <div>
                    <span>{storedUser.displayName}</span><br />
                    <small>{storedUser.email}</small>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/perfil" onClick={() => setIsUserMenuOpen(false)}><i className="fas fa-user-cog"></i> Mi Perfil</Link>
                <Link to="/pedidos" onClick={() => setIsUserMenuOpen(false)}><i className="fas fa-shopping-bag"></i> Mis Pedidos</Link>
                <button onClick={handleLogout} className="logout-button"><i className="fas fa-sign-out-alt"></i> Cerrar Sesión</button>
              </div>
            </div>
          ) : (
            <Link className="nav-link" to="/login" onClick={(e) => handleNavigation(e, '/login')}>
              <i className="fas fa-user"></i> <span>Iniciar Sesión</span>
            </Link>
          )}

          {/* Carrito */}
          <div ref={cartButtonRef} style={{ position: 'relative' }}>
            <button className="nav-link cart-button" onClick={() => setIsCartOpen(!isCartOpen)}>
              <i className="fas fa-shopping-cart"></i> <span>Carrito</span>
              {getTotalItems() > 0 && <span className="cart-badge">{getTotalItems()}</span>}
            </button>

            <CartModal
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              cartItems={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
