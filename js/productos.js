
const productContainer = document.getElementById("product-container");

// Objeto para mantener el estado de los filtros actuales
let filtrosActuales = {
    categoria: "",
    orden: "",
    buscar: ""
};

// Variable global para guardar los videos y no re-consultar innecesariamente
let listaVideosDemo = [];

/**
 * Función principal para cargar productos y videos simultáneamente
 */
async function cargarProductos() {
    productContainer.innerHTML = `
        <div class="text-center w-100 mt-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Buscando soluciones...</p>
        </div>`;

    const params = new URLSearchParams();
    if (filtrosActuales.categoria) params.append("categoria", filtrosActuales.categoria);
    if (filtrosActuales.orden) params.append("orden", filtrosActuales.orden);
    if (filtrosActuales.buscar) params.append("buscar", filtrosActuales.buscar);

    try {
        // Ejecutamos ambas peticiones al mismo tiempo
        // Nota: Si aún no creas el endpoint /demo_videos/ en el backend, 
        // el catch evitará que el código se rompa.
        const [prodResponse, videoResponse] = await Promise.all([
            fetch(`${API_URL}/software/?${params.toString()}`),
            fetch(`${API_URL}/demo_videos/`).catch(() => null) 
        ]);

        if (!prodResponse.ok) throw new Error("Error en la respuesta de productos");
        
        const productos = await prodResponse.json();
        
        // Guardamos videos en la variable global si la petición fue exitosa
        if (videoResponse && videoResponse.ok) {
            listaVideosDemo = await videoResponse.json();
        }

        renderizarProductos(productos);
    } catch (error) {
        console.error("Error:", error);
        productContainer.innerHTML = `<div class="alert alert-danger">No se pudieron cargar los datos del servidor.</div>`;
    }
}

/**
 * Renderiza las tarjetas incluyendo el botón de Demo si existe video
 */
function renderizarProductos(productos) {
    productContainer.innerHTML = "";
    
    // LOG DE DEPURACIÓN: Abre la consola (F12) para ver esto
    console.log("Productos recibidos:", productos);
    console.log("Videos disponibles:", listaVideosDemo);

    if (productos.length === 0) {
        productContainer.innerHTML = '<p class="text-center w-100">No hay productos.</p>';
        return;
    }

    productos.forEach(p => {
        // CORRECCIÓN 1: Forzamos que ambos IDs sean números para la comparación (==)
        // CORRECCIÓN 2: Verificamos si tu API de videos usa 'id_software' o 'software_id'
        const videoAsociado = listaVideosDemo.find(v => 
            Number(v.id_software) === Number(p.id_software) || 
            Number(v.software_id) === Number(p.id_software)
        );

        const precio = p.precio_venta || p.precio_alquiler || 0;
        const card = document.createElement("div");
        card.className = "product-card";
        const urlVideo = videoAsociado ? (videoAsociado.url || videoAsociado.video_url) : '';
        
        // CORRECCIÓN 3: Aseguramos que el botón no tenga 'opacity: 0' permanente en el CSS
        card.innerHTML = `
            <div class="product-img-container">
        <img src="${p.imagen_url}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/300x200'">
                
                ${videoAsociado ? `
            <button class="btn-play-demo" 
                    onclick="abrirModalVideo('${urlVideo}', '${p.nombre}')">
                <i class="fas fa-play"></i> Ver Demo
            </button>
        ` : ''}
            </div>
            <div class="product-body">
                <span class="category-tag">${p.precio_venta ? 'Venta' : 'Suscripción'}</span>
                <h3>${p.nombre}</h3>
                <p>${p.descripcion ? p.descripcion.substring(0, 80) + '...' : 'Sin descripción'}</p>
                <div class="product-footer">
                    <div class="price-box">
                        <span class="currency">$</span>
                        <span class="amount">${parseFloat(precio).toFixed(2)}</span>
                    </div>
                    <a href="detalle-producto.html?id=${p.id_software}" class="btn-view-details">Detalles</a>
                </div>
            </div>
        `;
        productContainer.appendChild(card);
    });
}
/**
 * Función para manejar el Modal de Video
 */
function abrirModalVideo(url, nombre) {
    const videoContainer = document.getElementById('videoContainer');
    const videoTitle = document.getElementById('videoTitle');
    
    if (!videoContainer || !videoTitle) return;

    videoTitle.innerText = `Demostración: ${nombre}`;
    videoContainer.innerHTML = '';

    // Si la URL contiene "cloudinary.com/embed", usamos un IFRAME
    if (url.includes('cloudinary.com/embed')) {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
        iframe.allowFullscreen = true;
        videoContainer.appendChild(iframe);
    } else {
        // Si es un link directo a .mp4 u otro, usamos la etiqueta VIDEO
        const videoElement = document.createElement('video');
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.className = 'w-100 h-100';
        videoElement.style.background = '#000';

        const source = document.createElement('source');
        source.src = url;
        source.type = 'video/mp4';

        videoElement.appendChild(source);
        videoContainer.appendChild(videoElement);
        videoElement.load();
    }

    const modalElement = document.getElementById('videoModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Limpiar al cerrar para que el video no siga sonando en el fondo
    modalElement.addEventListener('hidden.bs.modal', () => {
        videoContainer.innerHTML = "";
    }, { once: true });
}
/**
 * Configuración de Eventos Iniciales
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Filtros por Categoría
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filtrosActuales.categoria = btn.getAttribute("data-categoria");
            cargarProductos();
        });
    });

    // 2. Ordenamiento
    const selectOrden = document.getElementById("ordenar-productos");
    if (selectOrden) {
        selectOrden.addEventListener("change", (e) => {
            filtrosActuales.orden = e.target.value;
            cargarProductos();
        });
    }

    // 3. Buscador
    const inputBuscar = document.getElementById("input-buscar");
    if (inputBuscar) {
        inputBuscar.addEventListener("input", (e) => {
            filtrosActuales.buscar = e.target.value;
            cargarProductos();
        });
    }

    cargarProductos();
});