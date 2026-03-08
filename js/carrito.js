// carrito.js - Versión unificada y sin errores de sintaxis
(function () {
    const API_URL = "https://ideas-soft-backend.onrender.com";
    const CARRITO_API = `${API_URL}/carrito`;

    function getToken() {
        return localStorage.getItem('token'); // Estandarizado a 'token'
    }

    function requiereLogin() {
        alert("Debes iniciar sesión para realizar esta acción.");
        window.location.href = "../components/login.html"; // Ruta corregida para carpetas /sub/
    }

    // --- 1. OBTENER ITEMS DEL CARRITO ---
    async function obtenerCarrito() {
        const token = getToken();
        if (!token) return [];
        try {
            const res = await fetch(`${CARRITO_API}/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : (data.items || []);
        } catch (err) {
            console.error("Error al obtener carrito:", err);
            return [];
        }
    }

    // --- 2. AGREGAR AL CARRITO (Corregida la lógica duplicada) ---
    async function agregarAlCarrito(idSoftware, cantidad = 1, tipo = "venta") {
        if (!idSoftware || isNaN(idSoftware)) {
            alert("ID de software no válido.");
            return;
        }

        const token = getToken();
        if (!token) return requiereLogin();

        const bodyData = {
            id_software: Number(idSoftware),
            cantidad: Number(cantidad),
            tipo_operacion: tipo.toLowerCase() // 'venta' o 'suscripcion'
        };

        try {
            const response = await fetch(`${CARRITO_API}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });

            if (response.ok) {
                alert("¡Agregado al carrito con éxito!");
                await actualizarBadgeCarrito();
                
                // Abrir el panel lateral automáticamente
                const offcanvasEl = document.getElementById('offcanvasCarrito');
                if (offcanvasEl) {
                    const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
                    bsOffcanvas.show();
                }
            } else {
                const errData = await response.json();
                alert("Error: " + (errData.detail || "No se pudo agregar"));
            }
        } catch (err) {
            console.error("Error de red:", err);
        }
    }

    // --- 3. ELIMINAR ITEM ---
    async function eliminarItem(idDetalle) {
    if (!idDetalle) {
        console.error("ID de detalle no proporcionado");
        return;
    }

    const token = localStorage.getItem('token');
    if (!confirm("¿Eliminar este producto?")) return;

    try {
        // Probamos con la ruta estándar de eliminación de items
        const res = await fetch(`${API_URL}/carrito/${idDetalle}`, { 
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            console.log("Producto eliminado correctamente");
            // IMPORTANTE: Refrescar los datos localmente
            await actualizarBadgeCarrito(); 
            await renderizarCarritoBootstrap();
        } else {
            const errorData = await res.json();
            console.error("Error del servidor al eliminar:", errorData);
            alert("No se pudo eliminar: " + (errorData.detail || "Error desconocido"));
        }
    } catch (err) {
        console.error("Error de red al intentar eliminar:", err);
        alert("Error de conexión al servidor.");
    }
}

    // --- 4. ACTUALIZAR BADGE (El numerito del icono) ---
    async function actualizarBadgeCarrito() {
        const items = await obtenerCarrito();
        const badge = document.querySelector('.cart-badge');
        if (badge) {
            badge.innerText = items.length;
        }
    }

    // --- 5. RENDERIZAR EN EL PANEL LATERAL (Offcanvas) ---
    async function renderizarCarritoBootstrap() {
    const container = document.getElementById('carrito-body');
    const totalEtiq = document.getElementById('total-carrito');
    
    // Si el contenedor no existe todavía, salimos sin error
    if (!container) return;

    try {
        const items = await obtenerCarrito(); // Esta función ya la tienes en carrito.js

        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-shopping-cart fa-3x mb-3"></i>
                    <p>Tu carrito está vacío</p>
                    <a href="/sub/productos.html" class="btn btn-sm btn-outline-primary">Ver productos</a>
                </div>`;
            if (totalEtiq) totalEtiq.innerText = "$0.00";
            return;
        }

        let total = 0;
        let html = '<div class="list-group list-group-flush">';

        items.forEach(item => {
            // Ajuste de nombres según tu base de datos
            const nombre = item.nombre_software || item.nombre || "Software";
            const precio = parseFloat(item.precio) || 0;
            const subtotal = precio * (item.cantidad || 1);
            total += subtotal;

            html += `
                <div class="list-group-item py-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="me-2">
                            <h6 class="mb-1 fw-bold" style="font-size: 0.9rem;">${nombre}</h6>
                            <small class="text-primary d-block">${item.tipo_operacion || 'Venta'}</small>
                            <small class="text-muted">$${precio.toFixed(2)} x ${item.cantidad}</small>
                        </div>
                        <button class="btn btn-link text-danger p-0" onclick="Carrito.eliminarItem(${item.id_detalle})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>`;
        });

        html += '</div>';
        container.innerHTML = html;
        if (totalEtiq) totalEtiq.innerText = `$${total.toFixed(2)}`;

    } catch (err) {
        console.error("Error al renderizar:", err);
        container.innerHTML = '<p class="text-center text-danger p-4">Error al conectar con el servidor.</p>';
    }
}

    // EXPOSICIÓN GLOBAL
    window.Carrito = {
        agregar: agregarAlCarrito,
        eliminarItem: eliminarItem,
        actualizarBadge: actualizarBadgeCarrito,
        renderizar: renderizarCarritoBootstrap,
        obtener: obtenerCarrito
    };

    document.addEventListener('DOMContentLoaded', () => {
        actualizarBadgeCarrito();
        const offcanvasEl = document.getElementById('offcanvasCarrito');
        if (offcanvasEl) {
            offcanvasEl.addEventListener('shown.bs.offcanvas', renderizarCarritoBootstrap);
        }
    });

    // Listener Global para detectar cuando se abre el Offcanvas
document.addEventListener('click', function (event) {
    // Si el clic fue en el contenedor del carrito o en el icono
    if (event.target.closest('.cart-container')) {
        // Esperamos un momento a que Bootstrap abra el panel y luego renderizamos
        setTimeout(() => {
            if (window.Carrito && typeof window.Carrito.renderizar === 'function') {
                window.Carrito.renderizar();
            }
        }, 150);
    }
});

})();