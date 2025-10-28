import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function Navbar() {
return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
    <div className="container">
        <a className="navbar-brand" href="#inicio">
        <img src="logo.jpg" alt="Busch Burier" height="50" />
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
            <li className="nav-item"><a className="nav-link" href="#inicio">Inicio</a></li>
            <li className="nav-item dropdown">
            <a className="nav-link dropdown-toggle" href="#menu" data-bs-toggle="dropdown">Menú</a>
            <ul className="dropdown-menu dropdown-menu-dark">
                <li><a className="dropdown-item" href="hamburguesas.html">Hamburguesas</a></li>
                <li><a className="dropdown-item" href="salchipapas.html">Salchipapas</a></li>
                <li><a className="dropdown-item" href="perros.html">Perros Calientes</a></li>
            </ul>
            </li>
            <li className="nav-item"><a className="nav-link" href="#contacto">Contacto</a></li>
            <li className="nav-item">
            <a className="nav-link" href="login.html"><i className="fas fa-user"></i> Iniciar Sesión</a>
            </li>
            <li className="nav-item">
            <button className="btn btn-outline-light cart-button" data-bs-toggle="modal" data-bs-target="#cartModal">
                <i className="fas fa-shopping-cart"></i>
                <span className="cart-badge" id="cart-badge">0</span>
            </button>
            </li>
        </ul>
        </div>
    </div>
    </nav>
);
}

export default Navbar;
