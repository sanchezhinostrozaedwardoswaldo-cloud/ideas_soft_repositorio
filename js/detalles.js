<a href="detalle-producto.html?id=123" class="btn-ver-detalles">Ver Detalles</a>
const params = new URLSearchParams(window.location.search);
const id = params.get('id');

async function cargarDetalles() {
    const response = await fetch(`https://ideas-soft-backend.onrender.com/productos/${id}`);
    const data = await response.json();

    if (data) {
        document.getElementById('det-titulo').innerText = data.nombre_software;
        document.getElementById('det-descripcion').innerText = data.descripcion;
        document.getElementById('det-precio-perpetuo').innerText = data.precio;
        document.getElementById('det-precio-mensual').innerText = (data.precio / 12).toFixed(2);
        document.getElementById('det-categoria').innerText = data.categoria;
        document.getElementById('bread-name').innerText = data.nombre_software;
    }
}
cargarDetalles();