const API_BASE = "https://ideas-soft-backend.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay token, si no, redirigir al login
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Mostrar email del usuario
    document.getElementById('user-display').innerText = localStorage.getItem('user_email');

    // Cargar sección por defecto
    cargarSeccion('licencias');
});

async function cargarSeccion(tipo) {
    const container = document.getElementById('data-container');
    const loading = document.getElementById('loading');
    const title = document.getElementById('section-title');
    const token = localStorage.getItem('token');

    container.innerHTML = '';
    loading.style.display = 'block';

    let endpoint = "";
    switch(tipo) {
        case 'licencias': 
            endpoint = "/cliente/mis-licencias-detalle"; 
            title.innerText = "Detalle de Licencias";
            break;
        case 'ventas': 
            endpoint = "/cliente/mis-ventas"; 
            title.innerText = "Historial de Ventas";
            break;
        case 'pagos': 
            endpoint = "/panel/pagos"; 
            title.innerText = "Mis Pagos";
            break;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error("Error al obtener datos");

        const data = await response.json();
        loading.style.display = 'none';

        if (tipo === 'licencias') {
            renderizarLicencias(data);
        } else {
            // Render genérico para otros strings de la API
            container.innerHTML = `<div class="alert alert-info">${JSON.stringify(data)}</div>`;
        }

    } catch (error) {
        loading.style.display = 'none';
        container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function renderizarLicencias(licencias) {
    const container = document.getElementById('data-container');
    if (!Array.isArray(licencias) || licencias.length === 0) {
        container.innerHTML = '<p class="text-center">No tienes licencias activas actualmente.</p>';
        return;
    }

    let html = `
        <table class="table table-hover bg-white rounded shadow-sm">
            <thead class="table-dark">
                <tr>
                    <th>Software</th>
                    <th>Clave</th>
                    <th>Tipo</th>
                    <th>Expiración</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;

    licencias.forEach(lic => {
        const estadoClass = lic.estado === 'activo' ? 'bg-success' : 'bg-secondary';
        html += `
            <tr>
                <td><strong>${lic.software}</strong></td>
                <td><code>${lic.clave_licencia}</code></td>
                <td>${lic.tipo_licencia}</td>
                <td>${new Date(lic.fecha_expiracion).toLocaleDateString()}</td>
                <td><span class="badge ${estadoClass}">${lic.estado}</span></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}/*d */