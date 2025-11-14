import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useCart } from '../context/CartContext';
import Breadcrumbs from './Breadcrumbs';
import { useState } from 'react';
import ProductDetail from '../components/ProductDetail.jsx';

function Perros() {
  const { addToCart } = useCart();
  const [selected, setSelected] = useState(null);

  const handleAddToCart = async (perro) => {
    try {
      await addToCart(perro, 'perros');
    } catch (err) {
      console.error('Error al agregar producto:', err.response?.data || err.message);
      alert('No se pudo agregar al carrito.');
    }
  };

  const perros = [
    {
      id: 'per1',
      nombre: 'Perro Clásico',
      descripcion: 'Pan suave, salchicha premium, cebolla, tomate, mostaza y ketchup.',
      precio: 8000,
      imagen: '/src/assets/perros/perro_clasico.jpg'
    },
    {
      id: 'per2',
      nombre: 'Perro Especial',
      descripcion: 'Pan suave, salchicha premium, queso cheddar, tocino, cebolla caramelizada y salsa BBQ.',
      precio: 12000,
      imagen: '/src/assets/perros/perro_especial.png'
    },
    {
      id: 'per3',
      nombre: 'Perro Supremo',
      descripcion: 'Doble salchicha premium, queso cheddar, tocino, huevo, papas fritas y salsa de la casa.',
      precio: 15000,
      imagen: '/src/assets/perros/perro_supremo.jpg'
    },
    {
      id: 'per4',
      nombre: 'Perro Mexicano',
      descripcion: 'Pan suave, salchicha premium, guacamole, nachos, jalapeños y salsa picante.',
      precio: 13000,
      imagen: '/src/assets/perros/perro_mexicano.jpeg'
    },
    {
      id: 'per5',
      nombre: 'Perro Italiano',
      descripcion: 'Pan suave, salchicha premium, salsa de tomate, queso mozzarella y albahaca.',
      precio: 14000,
      imagen: '/src/assets/perros/perro_italiano.jpeg'
    },
    {
      id: 'per6',
      nombre: 'Perro Completo',
      descripcion: 'Doble salchicha premium, queso cheddar, tocino, huevo, papas fritas y todas las salsas.',
      precio: 18000,
      imagen: '/src/assets/perros/perro_completo.jpg'
    }
  ];

  return (
    <div className="container mt-4 text-white">
      <Breadcrumbs items={[
        { label: 'Inicio', to: '/' },
        { label: 'Perros Calientes' }
      ]} />
      <h2 className="text-center mb-4">Nuestros Perros Calientes</h2>
      <div className="row">
        {perros.map((perro) => (
          <div className="col-md-4 mb-4" key={perro.id}>
            <div
              className="card bg-dark text-white h-100"
              onClick={() => setSelected(perro)}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => e.key === 'Enter' && setSelected(perro)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={perro.imagen} 
                className="card-img-top" 
                alt={perro.nombre}
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <div className="card-body">
                <h5 className="card-title">{perro.nombre}</h5>
                <p className="card-text">{perro.descripcion}</p>
                <p className="price">${perro.precio.toLocaleString()}</p>
                <button 
                  className="btn btn-primary"
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(perro); }}
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

export default Perros;