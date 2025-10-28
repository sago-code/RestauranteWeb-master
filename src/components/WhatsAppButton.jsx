import React from 'react';

const WhatsAppButton = () => {
  const phoneNumber = '573123456789'; // Reemplaza con tu número de WhatsApp
  const message = 'Hola, me gustaría hacer un pedido'; // Mensaje predeterminado

  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      className="whatsapp-float"
      onClick={handleClick}
      title="Contactar por WhatsApp"
    >
      <i className="fab fa-whatsapp"></i>
    </button>
  );
};

export default WhatsAppButton; 