import React from 'react';
import HeroSection from '../pages/HeroSection';
import ContactForm from '../pages/ContactoForm';
import CartModal from '../components/CartModal';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Estilos.css';

function Index() {
  return (
    <div className="index-container">
      {/* Sección Hero con imagen del restaurante */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Bienvenidos a Busch Burier</h1>
          <p>La mejor experiencia gastronómica de la ciudad</p>
        </div>
        <div className="restaurant-image">
          <img 
            src="/src/assets/principal.jpeg" 
            alt="Nuestro Restaurante" 
            className="img-fluid rounded shadow"
            style={{
              width: '100%',
              height: '400px',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
        </div>
      </div>

      {/* Sección de Contacto */}
      <div className="contact-section" id="contacto">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="contact-info">
                <h2>Contáctanos</h2>
                <div className="info-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <p>123 Calle Principal, Ciudad</p>
                </div>
                <div className="info-item">
                  <i className="fas fa-phone"></i>
                  <p>+123 456 7890</p>
                </div>
                <div className="info-item">
                  <i className="fas fa-envelope"></i>
                  <p>info@buschburier.com</p>
                </div>
                <div className="info-item">
                  <i className="fas fa-clock"></i>
                  <p>Lunes - Domingo: 11:00 AM - 10:00 PM</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>

      <CartModal />
    </div>
  );
}

export default Index;
