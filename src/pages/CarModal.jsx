import React from 'react';

function CartModal() {
return (
    <div className="modal fade" id="cartModal" tabIndex="-1" aria-labelledby="cartModalLabel" aria-hidden="true">
    <div className="modal-dialog">
        <div className="modal-content">
        <div className="modal-header">
            <h5 className="modal-title" id="cartModalLabel">Carrito de Compras</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div className="modal-body">
            <ul id="cart-items" className="list-group mb-3">
              {/* Aquí irán los productos añadidos al carrito */}
            </ul>
            <p>Total: <span id="cart-total">$0</span></p>
        </div>
        <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" className="btn btn-primary">Pagar</button>
        </div>
        </div>
    </div>
    </div>
);
}

export default CartModal;
