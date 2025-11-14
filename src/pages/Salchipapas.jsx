import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useCart } from '../context/CartContext';
import Breadcrumbs from './Breadcrumbs';
import { useState } from 'react';
import ProductDetail from '../components/ProductDetail.jsx';

function Salchipapas() {
  const { addToCart } = useCart();
  const [selected, setSelected] = useState(null);

  const handleAddToCart = async (salchipapa) => {
    try {
      await addToCart(salchipapa, 'salchipapas');
    } catch (err) {
      console.error('Error al agregar producto:', err.response?.data || err.message);
      alert('No se pudo agregar al carrito.');
    }
  };

  const salchipapas = [
    {
      id: 'sal1',
      nombre: 'Salchipapa Clásica',
      descripcion: 'Papas fritas, salchicha premium, queso cheddar y salsas.',
      precio: 10000,
      imagen: '/src/assets/salchipapas/salchipapa_clasica.jpg'
    },
    {
      id: 'sal2',
      nombre: 'Salchipapa Especial',
      descripcion: 'Papas fritas, doble salchicha, queso cheddar, tocino y huevo.',
      precio: 15000,
      imagen: '/src/assets/salchipapas/salchipapa_especial.jpg'
    },
    {
      id: 'sal3',
      nombre: 'Salchipapa Suprema',
      descripcion: 'Papas fritas, triple salchicha, queso cheddar, tocino, huevo y todas las salsas.',
      precio: 18000,
      imagen: '/src/assets/salchipapas/salchipapa_suprema.jpg'
    },
    {
      id: 'sal4',
      nombre: 'Salchipapa Mexicana',
      descripcion: 'Papas fritas, salchicha, guacamole, nachos, jalapeños y salsa picante.',
      precio: 16000,
      imagen: '/src/assets/salchipapas/salchipapa_mexicana.jpg'
    },
    {
      id: 'sal5',
      nombre: 'Salchipapa Italiana',
      descripcion: 'Papas fritas, salchicha, salsa de tomate, queso mozzarella y albahaca.',
      precio: 17000,
      imagen: '/src/assets/salchipapas/salchipapa_italiana.jpg'
    },
    {
      id: 'sal6',
      nombre: 'Salchipapa Familiar',
      descripcion: 'Porción grande de papas fritas, 4 salchichas, queso cheddar, tocino y todas las salsas.',
      precio: 25000,
      imagen: '/src/assets/salchipapas/salchipapa_familiar.jpg'
    }
  ];

  return (
    <div className="container mt-4 text-white">
      <Breadcrumbs items={[
        { label: 'Inicio', to: '/' },
        { label: 'Salchipapas' }
      ]} />
      <h2 className="text-center mb-4">Nuestras Salchipapas</h2>
      <div className="row">
        {salchipapas.map((salchipapa) => (
          <div className="col-md-4 mb-4" key={salchipapa.id}>
            <div
              className="card bg-dark text-white h-100"
              onClick={() => setSelected(salchipapa)}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => e.key === 'Enter' && setSelected(salchipapa)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={salchipapa.imagen} 
                className="card-img-top" 
                alt={salchipapa.nombre}
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <div className="card-body">
                <h5 className="card-title">{salchipapa.nombre}</h5>
                <p className="card-text">{salchipapa.descripcion}</p>
                <p className="price">${salchipapa.precio.toLocaleString()}</p>
                <button 
                  className="btn btn-primary"
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(salchipapa); }}
                >
                  Agregar al Carrito
                </button>
                {/* Se elimina el botón "Ver detalles" */}
              </div>
            </div>
          </div>
        ))}
      </div>
      <ProductDetail
        product={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onAdd={(p) => { handleAddToCart(p); setSelected(null); }}
      />
    </div>
  );
}

export default Salchipapas;