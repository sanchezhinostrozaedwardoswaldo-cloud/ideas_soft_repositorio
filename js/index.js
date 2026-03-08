// Variable global para evitar múltiples llamadas a la API
let productosCargadosGlobal = null;

async function obtenerProductosDeAPI() {
    // Si ya los descargamos una vez, los devolvemos directamente
    if (productosCargadosGlobal) return productosCargadosGlobal;

    try {
        const res = await fetch("https://ideas-soft-backend.onrender.com/software/");
        productosCargadosGlobal = await res.json();
        return productosCargadosGlobal;
    } catch (error) {
        console.error("Error en API:", error);
        return [];
    }
}

async function cargarProductosHome() {
    const container = document.getElementById("product-container-index");
    if (!container) return;

    const productos = await obtenerProductosDeAPI();
    
    // Traer videos (esto sí es específico del Home)
    const resVideo = await fetch("https://ideas-soft-backend.onrender.com/demo_videos/").catch(() => null);
    const videos = resVideo ? await resVideo.json() : [];

    container.innerHTML = "";
    productos.slice(0, 3).forEach(p => {
        const video = videos.find(v => Number(v.id_software) === Number(p.id_software));
        const urlVideo = video ? (video.url || video.video_url) : '';
        
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <span class="category-badge">${p.precio_venta ? 'Venta' : 'Suscripción'}</span>
            <div class="product-img-box" style="position:relative">
                <img src="${p.imagen_url}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/300x200'">
                ${video ? `
                    <button class="btn-play-demo-index" onclick="abrirModalVideo('${urlVideo}', '${p.nombre}')"
                            style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:10; background:rgba(0,123,255,0.8); color:white; border:none; border-radius:20px; padding:5px 15px;">
                        <i class="fas fa-play"></i> Demo
                    </button>` : ''}
            </div>
            <div class="product-info">
                <h3>${p.nombre}</h3>
                <p>${p.descripcion ? p.descripcion.substring(0, 60) + '...' : 'Sin descripción'}</p>
                <div class="price">$${parseFloat(p.precio_venta || p.precio_alquiler || 0).toFixed(2)}</div>
                <a href="/sub/detalle-producto.html?id=${p.id_software}" class="btn-detail">Ver detalles <i class="fas fa-arrow-right"></i></a>
            </div>`;
        container.appendChild(card);
    });
}

async function cargarProductosFooter() {
    const footerList = document.getElementById("footer-products-list");
    if (!footerList) return;

    const productos = await obtenerProductosDeAPI();
    footerList.innerHTML = "";

    productos.slice(0, 5).forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="/sub/detalle-producto.html?id=${p.id_software}">${p.nombre}</a>`;
        footerList.appendChild(li);
    });
}

// FUNCIONES DE SOPORTE (Modal y Acordeón)
function abrirModalVideo(url, nombre) {
    const videoContainer = document.getElementById('videoContainer');
    document.getElementById('videoTitle').innerText = `Demo: ${nombre}`;
    videoContainer.innerHTML = url.includes('cloudinary.com/embed')
        ? `<iframe src="${url}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>`
        : `<video controls autoplay style="width:100%; height:100%; background:#000;"><source src="${url}" type="video/mp4"></video>`;
    new bootstrap.Modal(document.getElementById('videoModal')).show();
}

// Único DOMContentLoaded para todo
document.addEventListener("DOMContentLoaded", () => {
    cargarProductosHome();
    
    // FAQ logic
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.faq-question');
        if (btn) {
            const item = btn.parentElement;
            const answer = item.querySelector('.faq-answer');
            item.classList.toggle('active');
            answer.style.maxHeight = item.classList.contains('active') ? answer.scrollHeight + "px" : null;
        }
    });

    // Limpieza de video al cerrar modal
    const modalElement = document.getElementById('videoModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
            document.getElementById('videoContainer').innerHTML = "";
        });
    }
});