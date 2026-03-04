const API_URL = "https://ideas-soft-backend.onrender.com";
const idSoftware = new URLSearchParams(window.location.search).get('id');

// Al final de cargarPaginaDetalle()
const token = localStorage.getItem('token');
if (token) {
    fetch(`${API_URL}/licencias/verificar/${idSoftware}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        if (data.activa) {
            // Cambiar botones si ya tiene el software
            const btnPrincipal = document.querySelector('.card-buy-premium .btn-primary');
            if (btnPrincipal) {
                btnPrincipal.innerHTML = '<i class="fas fa-download"></i> Descargar Software';
                btnPrincipal.onclick = () => window.location.href = '/dashboard/descargas';
                btnPrincipal.className = "btn btn-success flex-grow-1";
            }
        }
    });
}

async function cargarPaginaDetalle() {
    if (!idSoftware) return;
    try {
        const res = await fetch(`${API_URL}/software/${idSoftware}`);
        const software = await res.json();

        // Llenar HTML
        document.getElementById('det-titulo').innerText = software.nombre;
        document.getElementById('det-descripcion').innerText = software.descripcion;
        document.getElementById('det-img').src = software.imagen_url;
        document.getElementById('det-precio-perpetuo').innerText = software.precio_venta || "0.00";
        document.getElementById('det-precio-mensual').innerText = software.precio_alquiler || "0.00";

        // Cargar reseñas
        const resResenas = await fetch(`${API_URL}/resenas/software/${idSoftware}`);
        if (resResenas.ok) {
            const resenas = await resResenas.json();
            const containerResenas = document.getElementById('lista-resenas');
            if(containerResenas) {
                containerResenas.innerHTML = resenas.map(r => `
                    <div class="resena-item mb-3 p-2 border-bottom">
                        <div class="text-warning">
                            ${'<i class="fas fa-star"></i>'.repeat(r.calificacion)}
                        </div>
                        <p class="mb-0">${r.comentario}</p>
                    </div>
                `).join('') || '<p class="text-muted">Sin reseñas aún.</p>';
            }
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

// --- CARGAR RESEÑAS ---
async function cargarResenas() {
    try {
        const res = await fetch(`${API_URL}/resenas/software/${idSoftware}`);
        const resenas = await res.json();
        const container = document.getElementById('lista-resenas');
        
        if (!container) return;

        if (resenas.length === 0) {
            container.innerHTML = '<p class="text-muted">Aún no hay reseñas para este software. ¡Sé el primero!</p>';
            return;
        }

        container.innerHTML = resenas.map(r => `
            <div class="resena-card mb-3 p-3 border rounded shadow-sm">
                <div class="d-flex justify-content-between">
                    <strong class="text-dark">${r.nombre_cliente || 'Usuario'}</strong>
                    <div class="text-warning">
                        ${'<i class="fas fa-star"></i>'.repeat(r.calificacion)}${'<i class="far fa-star"></i>'.repeat(5 - r.calificacion)}
                    </div>
                </div>
                <p class="mb-0 mt-2 text-muted italic">"${r.comentario}"</p>
                <small class="text-muted" style="font-size: 0.7rem;">Publicado el: ${new Date(r.fecha_registro).toLocaleDateString()}</small>
            </div>
        `).join('');
    } catch (e) {
        console.error("Error al cargar reseñas:", e);
    }
}

// --- ENVIAR NUEVA RESEÑA ---
async function enviarResena(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Debes iniciar sesión para dejar una reseña.");
        return;
    }

    const data = {
        id_software: parseInt(idSoftware),
        calificacion: parseInt(document.getElementById('res-calificacion').value),
        comentario: document.getElementById('res-comentario').value
    };

    try {
        const res = await fetch(`${API_URL}/resenas/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("¡Gracias por tu opinión!");
            document.getElementById('form-resena').reset();
            cargarResenas(); // Recargar la lista
        } else {
            const err = await res.json();
            alert("Error: " + (err.detail || "No pudimos guardar tu reseña"));
        }
    } catch (e) {
        alert("Error de conexión al enviar reseña.");
    }
}

document.addEventListener("DOMContentLoaded", cargarPaginaDetalle);