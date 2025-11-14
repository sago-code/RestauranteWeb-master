import { useCart } from '../context/CartContext';
import Breadcrumbs from './Breadcrumbs';
import { useState } from 'react';
import ProductDetail from '../components/ProductDetail.jsx';

function Hamburguesas() {
  const { addToCart } = useCart();
  const [selected, setSelected] = useState(null);

  const handleAddToCart = async (hamburguesa) => {
    try {
      await addToCart(hamburguesa, 'hamburguesas');
    } catch (err) {
      console.error('Error al agregar producto:', err.response?.data || err.message);
      alert('No se pudo agregar al carrito.');
    }
  };
  
  const hamburguesas = [
    {
      id: 'hamb1',
      nombre: 'Hamburguesa Clásica',
      descripcion: 'Pan artesanal, carne de res 200g, lechuga, tomate, cebolla y queso cheddar.',
      precio: 15000,
      imagen: './src/assets/hamburguesas/hamburguesa_clasica.jpg'
    },
    {
      id: 'hamb2',
      nombre: 'Hamburguesa Doble',
      descripcion: 'Doble carne de res 200g, doble queso cheddar, bacon, lechuga, tomate y salsa especial.',
      precio: 20000,
      imagen: '/src/assets/hamburguesas/hamburguesa_doble.jpg'
    },
    {
      id: 'hamb3',
      nombre: 'Hamburguesa BBQ',
      descripcion: 'Carne de res 200g, queso cheddar, bacon, cebolla caramelizada y salsa BBQ casera.',
      precio: 18000,
      imagen: '/src/assets/hamburguesas/hamburguesa_bbq.jpg'
    },
    {
      id: 'hamb4',
      nombre: 'Hamburguesa Mexicana',
      descripcion: 'Carne de res 200g, queso pepper jack, jalapeños, guacamole y salsa picante.',
      precio: 19000,
      imagen: '/src/assets/hamburguesas/hamburguesa_mexicana.jpg'
    },
    {
      id: 'hamb5',
      nombre: 'Hamburguesa Pollo',
      descripcion: 'Pechuga de pollo a la parrilla, lechuga, tomate, cebolla y mayonesa de hierbas.',
      precio: 16000,
      imagen: '/src/assets/hamburguesas/hamburguesa_pollo.jpg'
    },
    {
      id: 'hamb6',
      nombre: 'Hamburguesa Vegetariana',
      descripcion: 'Medallón de garbanzos y quinoa, lechuga, tomate, aguacate y salsa de yogur.',
      precio: 17000,
      imagen: '/src/assets/hamburguesas/hamburguesa_vegetariana.jpg'
    },
    {
      id: 'hamb7',
      nombre: 'Hamburguesa Especial',
      descripcion: 'Carne de res 200g, queso azul, bacon, cebolla caramelizada y salsa de vino tinto.',
      precio: 22000,
      imagen: '/src/assets/hamburguesas/hamburguesa_especial.jpg'
    },
    {
      id: 'hamb8',
      nombre: 'Hamburguesa Hawaiana',
      descripcion: 'Carne de res 200g, queso suizo, piña a la parrilla, bacon y salsa teriyaki.',
      precio: 21000,
      imagen: '/src/assets/hamburguesas/hamburguesa_hawaiana.jpg'
    },
    {
      id: 'hamb9',
      nombre: 'Hamburguesa Triple',
      descripcion: 'Triple carne de res 200g, triple queso cheddar, bacon, lechuga, tomate y salsa especial.',
      precio: 25000,
      imagen: '/src/assets/hamburguesas/hamburguesa_triple_carne.jpg'
    }
  ];

  return (
    <div className="container mt-4 text-white">
      <Breadcrumbs items={[
        { label: 'Inicio', to: '/' },
        { label: 'Hamburguesas' }
      ]} />
      <h2 className="text-center mb-4">Nuestras Hamburguesas</h2>
      <div className="row">
        {hamburguesas.map((hamburguesa) => (
          <div className="col-md-4 mb-4" key={hamburguesa.id}>
            <div
              className="card bg-dark text-white h-100"
              onClick={() => setSelected(hamburguesa)}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => e.key === 'Enter' && setSelected(hamburguesa)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={hamburguesa.imagen} 
                className="card-img-top" 
                alt={hamburguesa.nombre}
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <div className="card-body">
                <h5 className="card-title">{hamburguesa.nombre}</h5>
                <p className="card-text">{hamburguesa.descripcion}</p>
                <p className="price">${hamburguesa.precio.toLocaleString()}</p>
                <button 
                  className="btn btn-primary"
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(hamburguesa); }}
                >
                  Agregar al Carrito
                </button>
                {/* Se elimina el botón "Ver detalles" */}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal de detalles */}
      <ProductDetail
        product={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onAdd={(p) => { handleAddToCart(p); setSelected(null); }}
      />
    </div>
  );
}

export default Hamburguesas;