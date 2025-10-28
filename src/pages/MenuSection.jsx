import React from 'react';

function MenuSection() {
  return (
    <section id="menu" className="py-5">
      <div className="container">
        <h2 className="text-center mb-4">Nuestro Menú</h2>
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <img src="img1.jpg" className="card-img-top" alt="Hamburguesa" />
              <div className="card-body text-center">
                <h5 className="card-title">Hamburguesa Clásica</h5>
                <p className="card-text">$15.000</p>
                <button className="btn btn-primary" onClick={() => { /* lógica agregar al carrito */ }}>
                  Añadir al carrito
                </button>
              </div>
            </div>
          </div>
          {/* Agrega más tarjetas aquí */}
        </div>
      </div>
    </section>
  );
}

export default MenuSection;
