import React from 'react';
import './Estilos.css'

function ContactForm() {
  return (
    <section id="contacto" className="contact-form-section">
      <div className="container">
        <h2 className="text-center mb-4">Contáctanos</h2>
        <form className="contact-form">
          <div className="form-group">
            <div className="input-wrapper">
              <input 
                type="text" 
                className="form-control" 
                id="nombre" 
                placeholder=" "
                required 
              />
              <label htmlFor="nombre" className="floating-label">Nombre completo</label>
              <div className="input-guide">Ingresa tu nombre completo</div>
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <input 
                type="email" 
                className="form-control" 
                id="correo" 
                placeholder=" "
                required 
              />
              <label htmlFor="correo" className="floating-label">Correo Electrónico</label>
              <div className="input-guide">Ejemplo: usuario@correo.com</div>
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <textarea 
                className="form-control" 
                id="mensaje" 
                rows="3" 
                placeholder=" "
                required
              ></textarea>
              <label htmlFor="mensaje" className="floating-label">Mensaje</label>
              <div className="input-guide">Escribe tu mensaje o consulta</div>
            </div>
          </div>

          <button type="submit" className="submit-button">
            Enviar Mensaje
            <i className="fas fa-paper-plane ms-2"></i>
          </button>
        </form>
      </div>
    </section>
  );
}

export default ContactForm;
