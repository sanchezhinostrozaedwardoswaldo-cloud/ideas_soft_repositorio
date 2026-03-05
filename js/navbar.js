function initHeader() {
    console.log("Inicializando Header..."); // Para ver en la consola (F12) si corre

    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('navMenu');
    const icon = document.getElementById('hamburger-icon');

    if (!toggle || !menu) {
        console.error("No se encontró el botón o el menú en el DOM");
        return;
    }

    // Usamos onclick directo para evitar duplicidad de eventos
    toggle.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isNowActive = menu.classList.toggle('active');
        console.log("¿Menú activo?:", isNowActive);

        // Cambiar el ícono de barras a X
        if (icon) {
            icon.className = isNowActive ? 'fas fa-times' : 'fas fa-bars';
        }
        
        toggle.setAttribute('aria-expanded', isNowActive);
    };

    // Cerrar al clickear cualquier link
    const links = menu.querySelectorAll('a');
    links.forEach(link => {
        link.onclick = () => {
            menu.classList.remove('active');
            if (icon) icon.className = 'fas fa-bars';
        };
    });
}

// ESTO ES LO MÁS IMPORTANTE:
// Si el header se carga dinámicamente, asegúrate de llamar a initHeader() 
// DESPUÉS de insertarlo. Si es un HTML estático, usa esto:
document.addEventListener('DOMContentLoaded', initHeader);