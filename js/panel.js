document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('user_email');
    
    // Protección de ruta
    if (!token) {
        window.location.href = "../components/login.html";
        return;
    }

    // Actualizar UI del perfil
    const userDisplay = document.getElementById('user-display-email');
    if (userDisplay) {
        userDisplay.innerText = email || 'Usuario';
    }
    
    // Cargar sección por defecto
    cargarSeccion('licencias');
});

async function cargarSeccion(tipo, event = null) {
    if (event) {
        event.preventDefault();
        // CORRECCIÓN: Usamos #panelNav que es el ID del nuevo HTML
        document.querySelectorAll('#panelNav .nav-link').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }

    const container = document.getElementById('data-container');
    const spinner = document.getElementById('loading-spinner');
    const title = document.getElementById('section-title');
    const token = localStorage.getItem('token');

    if (spinner) spinner.style.display = 'block';
    
    const endpoints = {
        licencias: "/cliente/mis-licencias-detalle",
        ventas: "/cliente/mis-ventas",
        pagos: "/panel/pagos"
    };

    try {
        const response = await fetch(`https://ideas-soft-backend.onrender.com${endpoints[tipo]}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("No se pudo obtener la información.");

        const data = await response.json();
        
        // Actualizar título
        if (title) {
            title.innerText = tipo === 'licencias' ? "Mis Licencias Activas" : 
                            tipo === 'ventas' ? "Historial de Compras" : "Mis Pagos";
        }

        renderizar(tipo, data);

    } catch (err) {
        container.innerHTML = `
            <div class="p-5 text-center text-danger">
                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                <p>${err.message}</p>
            </div>`;
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
}

function renderizar(tipo, data) {
    const container = document.getElementById('data-container');
    
    if (!data || data.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-muted">No se encontraron registros en esta sección.</div>`;
        return;
    }

    if (tipo === 'licencias') {
        let html = `
        <table class="table table-hover align-middle mb-0">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Clave de Activación</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody>`;
        
        data.forEach(lic => {
            const statusClass = lic.estado === 'activo' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning';
            html += `
                <tr>
                    <td><span class="fw-bold text-dark">${lic.software}</span></td>
                    <td><code class="bg-light p-2 rounded text-primary">${lic.clave_licencia}</code></td>
                    <td>${new Date(lic.fecha_expiracion).toLocaleDateString()}</td>
                    <td><span class="badge ${statusClass} px-3 py-2 rounded-pill text-uppercase">${lic.estado}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-light border" title="Copiar" onclick="copyToClipboard('${lic.clave_licencia}')">
                            <i class="far fa-copy"></i>
                        </button>
                        <a href="../contacto.html" class="btn btn-sm btn-primary ms-2">
                            <i class="fas fa-headset"></i>
                        </a>
                    </td>
                </tr>`;
        });
        
        html += `</tbody></table>`;
        container.innerHTML = html;
    } else {
        // Para Ventas o Pagos (puedes expandir esto luego)
        container.innerHTML = `<div class="p-5 text-center text-muted">La sección ${tipo} se está procesando.</div>`;
    }
}

// Función auxiliar para copiar
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("¡Clave copiada al portapapeles!");
    });
}