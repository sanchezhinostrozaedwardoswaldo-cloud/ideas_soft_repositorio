const API_URL = "https://ideas-soft-backend.onrender.com";
const idSoftware = new URLSearchParams(window.location.search).get('id');

async function cargarPaginaDetalle() {
    try {
        // 1. Obtener datos del software
        const res = await fetch(`${API_URL}/software/${idSoftware}`);
        const software = await res.json();

        // 2. Obtener reseñas reales (usando tu resena_router)
        const resResenas = await fetch(`${API_URL}/resenas/software/${idSoftware}`);
        const resenas = await resResenas.json();

        // Llenar HTML
        document.getElementById('det-titulo').innerText = software.nombre;
        document.getElementById('det-descripcion').innerText = software.descripcion;
        document.getElementById('det-img').src = software.imagen_url;
        document.getElementById('det-precio-perpetuo').innerText = software.precio_venta || "N/A";
        document.getElementById('det-precio-mensual').innerText = software.precio_alquiler || "N/A";

        // Renderizar reseñas
        const containerResenas = document.getElementById('lista-resenas');
        if(containerResenas) {
            containerResenas.innerHTML = resenas.map(r => `
                <div class="resena-item">
                    <strong>Calificación: ${r.calificacion}/5</strong>
                    <p>${r.comentario}</p>
                </div>
            `).join('') || '<p>Aún no hay reseñas.</p>';
        }

    } catch (e) { console.error("Error cargando detalle", e); }
}

// FUNCION CLAVE: Agregar al carrito con Seguridad
async function agregarCarrito(tipo) {
    // 1. Verificar si el token existe (Nota: asegúrate de usar el mismo nombre que en auth.js, ej: "token")
    const token = localStorage.getItem("token"); 
    
    if (!token) {
        alert("Debes iniciar sesión para comprar.");
        // CORRECCIÓN DE RUTA: Subimos un nivel para entrar a components
        window.location.href = "../components/login.html"; 
        return;
    }

    // Preparar datos para el esquema 'carrito_detalle' de tu SQL
    const data = {
        id_software: parseInt(idSoftware),
        cantidad: 1,
        // El precio lo tomamos del DOM o del objeto 'software' cargado
        precio: tipo === 'venta' 
            ? parseFloat(document.getElementById('det-precio-perpetuo').innerText)
            : parseFloat(document.getElementById('det-precio-mensual').innerText)
    };

    try {
        const res = await fetch(`${API_URL}/carrito/agregar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("¡Producto añadido al carrito!");
            // Opcional: Actualizar el contador del carrito en el navbar
            if(window.actualizarContadorCarrito) window.actualizarContadorCarrito();
        } else {
            const err = await res.json();
            alert("Error: " + (err.detail || "No se pudo agregar al carrito"));
        }
    } catch (e) { 
        alert("Error de conexión con el servidor"); 
    }
}

document.addEventListener("DOMContentLoaded", cargarPaginaDetalle);