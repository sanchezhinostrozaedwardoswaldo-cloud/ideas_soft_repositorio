fetch(`${API_URL}/software/`)

async function cargarComponentes() {
    // Detectamos si estamos en la carpeta 'sub'
    const rutaRaiz = window.location.pathname.includes('/sub/') ? '../' : '';
    const rutaBase = rutaRaiz + 'components/'; 

    try {
        // 1. Cargar Navbar
        const resNavbar = await fetch(rutaBase + 'navbar.html');
        if (resNavbar.ok) {
            const dataNavbar = await resNavbar.text();
            document.getElementById('navbar').innerHTML = dataNavbar;
            
            // Actualizar estado de login
            if (window.actualizarNavbar) {
                window.actualizarNavbar();
            }
        }

        // 2. Cargar Footer
        const resFooter = await fetch(rutaBase + 'footer.html');
        if (resFooter.ok) {
            const dataFooter = await resFooter.text();
            document.getElementById('footer').innerHTML = dataFooter;
            
        }

    } catch (error) {
        console.error("Error en la carga de componentes:", error);
    }
}

document.addEventListener('DOMContentLoaded', cargarComponentes);

const monthlyBtn = document.getElementById("monthlyBtn");
const annualBtn = document.getElementById("annualBtn");
const prices = document.querySelectorAll(".amount");
const periods = document.querySelectorAll(".period");

if (monthlyBtn && annualBtn) {
    monthlyBtn.addEventListener("click", () => {
        monthlyBtn.classList.add("active");
        annualBtn.classList.remove("active");

        prices.forEach(price => {
            price.textContent = price.dataset.monthly;
        });

        periods.forEach(period => {
            period.textContent = "/mes";
        });
    });

annualBtn.addEventListener("click", () => {
    annualBtn.classList.add("active");
    monthlyBtn.classList.remove("active");

    prices.forEach(price => {
        price.textContent = price.dataset.annual;
    });

    periods.forEach(period => {
        period.textContent = "/mes (facturado anual)";
    });
});
}

async function cargarProductosFooter() {
    const lista = document.getElementById("footer-products-list");
    if (!lista) return;

    try {
        const response = await fetch(`${API_URL}/software/`);
        const productos = await response.json();

        lista.innerHTML = "";

        productos.slice(0,5).forEach(p => {
            const li = document.createElement("li");

            const ruta = window.location.pathname.includes('/sub/')
                ? 'detalle-producto.html'
                : 'sub/detalle-producto.html';

            li.innerHTML = `
                <a href="${ruta}?id=${p.id_software}">
                    ${p.nombre}
                </a>
            `;

            lista.appendChild(li);
        });

    } catch (error) {
        console.error(error);
        lista.innerHTML = `<li>No disponible</li>`;
    }
}

