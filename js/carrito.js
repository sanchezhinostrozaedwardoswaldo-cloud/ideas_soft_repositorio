// carrito.js - Versión corregida y funcional (abril 2025)

(function () {
    const API_URL = "https://ideas-soft-backend.onrender.com";
    const CARRITO_API = `${API_URL}/carrito`;

    function getToken() {
        return localStorage.getItem('token');
    }

    function requiereLogin() {
        alert("Debes iniciar sesión para realizar esta acción.");
        window.location.href = "../components/login.html";
    }

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
            if (Array.isArray(data)) return data;
            if (data && typeof data === 'object' && 'items' in data) return data.items || [];
            return [];
        } catch (err) {
            console.error("Error al obtener carrito:", err);
            return [];
        }
    }

    async function agregarAlCarrito(idSoftware, cantidad = 1, tipo = "venta") {
        if (!idSoftware || isNaN(idSoftware) || idSoftware <= 0) {
            alert("ID de software inválido.");
            return;
        }

        const token = getToken();
        if (!token) return requiereLogin();

        const tipoLower = tipo.trim().toLowerCase();
        if (!['venta', 'suscripcion'].includes(tipoLower)) {
            alert("Tipo de operación inválido. Usa 'venta' o 'suscripcion'.");
            return;
        }

        const bodyData = {
            id_software: Number(idSoftware),
            cantidad: Number(cantidad),
            tipo_operacion: tipoLower
        };

        console.log("Enviando al carrito →", bodyData);

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
                const offcanvasEl = document.getElementById('offcanvasCarrito');
                if (offcanvasEl) {
                    bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl).show();
                }
                await renderizarCarritoBootstrap(); // refresco inmediato
                return;
            }

            let mensaje = `Error ${response.status}`;
            try {
                const errData = await response.json();
                if (errData.detail) {
                    mensaje += ": " + (
                        typeof errData.detail === 'string' 
                            ? errData.detail 
                            : errData.detail.map(e => e.msg || JSON.stringify(e)).join(" • ")
                    );
                } else {
                    mensaje += ": " + JSON.stringify(errData);
                }
            } catch {
                mensaje += " (respuesta no JSON)";
            }

            alert("No se pudo agregar al carrito:\n" + mensaje);
            console.error("Error servidor:", { status: response.status, detalle: mensaje });

        } catch (err) {
            console.error("Error de red:", err);
            alert("Error de conexión. Verifica tu internet.");
        }
    }

    // Las funciones renderizarCarritoBootstrap, eliminarItem y actualizarBadgeCarrito
    // permanecen iguales a tu versión (están bien)

    // ... (copia aquí el resto: renderizarCarritoBootstrap, eliminarItem, actualizarBadgeCarrito)

    window.Carrito = {
        agregar: agregarAlCarrito,
        eliminarItem,
        actualizarBadge: actualizarBadgeCarrito,
        renderizar: renderizarCarritoBootstrap
    };

    document.addEventListener('DOMContentLoaded', () => {
        actualizarBadgeCarrito();
        const offcanvasEl = document.getElementById('offcanvasCarrito');
        if (offcanvasEl) {
            offcanvasEl.addEventListener('shown.bs.offcanvas', renderizarCarritoBootstrap);
        }
    });

})();
// Depuración forzada - debe aparecer siempre si el archivo se carga
console.log("=== carrito.js se cargó exitosamente ===");
console.log("window.Carrito existe ahora:", !!window.Carrito);
console.log("Función agregar disponible:", typeof window.Carrito?.agregar === 'function');

if (!window.Carrito) {
    console.error("ERROR GRAVE: window.Carrito NO se definió. Revisa errores arriba en consola.");
}