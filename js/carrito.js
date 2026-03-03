const API_URL = "https://ideas-soft-backend.onrender.com/carrito"; 

// 1. OBTENER PRODUCTOS (Asegúrate de enviar el Token si estás logueado)
async function obtenerCarrito() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Vital para servicio tecnológicos
            }
        });
        return await response.json();
    } catch (error) {
        console.error("Error al obtener el carrito:", error);
    }
}

// 2. AGREGAR AL CARRITO
async function agregarAlCarrito(idSoftware, cantidad) {
    const token = localStorage.getItem('token');
    if (!token) return alert("Por favor, inicia sesión.");

    const bodyData = { id_software: idSoftware, cantidad: cantidad, tipo_operacion: "venta" };

    try {
        const response = await fetch(`${API_URL}/Agregar`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bodyData)
        });
        
        if (response.ok) {
            actualizarBadgeCarrito();
            // Abrir el Offcanvas automáticamente para mostrar que se agregó
            const myOffcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasCarrito'));
            myOffcanvas.show();
        }
    } catch (error) {
        console.error("Error al agregar:", error);
    }
}

// 3. RENDERIZAR EN EL OFFCANVAS DE BOOTSTRAP
async function renderizarCarritoBootstrap() {
    const contenedor = document.getElementById('carrito-body');
    const totalEtiq = document.getElementById('total-carrito');
    const productos = await obtenerCarrito();

    if (!productos || productos.length === 0) {
        contenedor.innerHTML = `<div class="text-center py-5"><p>Carrito vacío</p></div>`;
        totalEtiq.innerText = "$0.00";
        return;
    }

    let html = '<div class="list-group list-group-flush">';
    let total = 0;

    productos.forEach(item => {
        const subtotal = item.cantidad * item.precio;
        total += subtotal;
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center border-0 px-0">
                <div>
                    <h6 class="mb-0 fw-bold">${item.nombre_software}</h6>
                    <small class="text-muted">${item.cantidad} x $${item.precio}</small>
                </div>
                <div class="text-end">
                    <span class="d-block fw-bold">$${subtotal.toFixed(2)}</span>
                    <button class="btn btn-sm text-danger" onclick="eliminarYRefrescar(${item.id_detalle})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>`;
    });

    contenedor.innerHTML = html + '</div>';
    totalEtiq.innerText = `$${total.toFixed(2)}`;
}

// 4. ELIMINAR Y REFRESCAR
async function eliminarYRefrescar(idDetalle) {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/${idDetalle}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    renderizarCarritoBootstrap();
    actualizarBadgeCarrito();
}

// 5. ACTUALIZAR BADGE
async function actualizarBadgeCarrito() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) return;
    const productos = await obtenerCarrito();
    const total = productos ? productos.length : 0;
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
}

// Iniciar al cargar
document.addEventListener('DOMContentLoaded', () => {
    actualizarBadgeCarrito();
    // Listener para cargar datos cuando se abra el panel
    const offcanvasEl = document.getElementById('offcanvasCarrito');
    if (offcanvasEl) {
        offcanvasEl.addEventListener('shown.bs.offcanvas', renderizarCarritoBootstrap);
    }
});