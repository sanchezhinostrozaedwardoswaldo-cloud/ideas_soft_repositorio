const API_URL = "https://ideas-soft-backend.onrender.com";

// 1. Función GLOBAL para actualizar el Navbar
window.actualizarNavbar = function() {
    const authSection = document.getElementById('auth-section');
    const email = localStorage.getItem('user_email');
    const token = localStorage.getItem('token');

    if (!authSection) return;

    if (token && email) {
        // Estructura de Dropdown de Bootstrap 5
        // Busca esta parte en tu auth.js y reemplaza el innerHTML del if  s(token && email)
           if (token && email) {
   // Dentro de window.actualizarNavbar, en la parte de (token && email)
authSection.innerHTML = `
    <div class="dropdown">
        <button class="nav-icon-btn dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fas fa-user-circle"></i>
            <span class="user-email-text">${email}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="/sub/panel.html"><i class="fas fa-th-large me-2"></i> Mi Panel</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i> Salir</a></li>
        </ul>
    </div>
`;
    // Inicialización de Bootstrap (mantén la que ya pusimos)
    const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    dropdownElementList.map(dropdownToggleEl => new bootstrap.Dropdown(dropdownToggleEl));
}
        // --- AÑADIDO: Inicialización manual para Dropdowns inyectados ---
        const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
        dropdownElementList.map(function (dropdownToggleEl) {
            return new bootstrap.Dropdown(dropdownToggleEl);
        });
        // ---------------------------------------------------------------

    } else {
        // Usuario NO logueado (Mantener tu lógica de rutas)
        const path = window.location.pathname;
        const isInSubfolder = path.includes('/sub/') || path.includes('/components/');
        const loginPath = isInSubfolder ? '../components/login.html' : 'components/login.html';

        authSection.innerHTML = `
            <a href="${loginPath}" class="btn-login">
                <i class="far fa-user"></i> Ingresar
            </a>
        `;
    }
};

// 2. Función GLOBAL para cerrar sesión
window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    alert("Has salido de la cuenta.");
    window.location.href = window.location.pathname.includes('components/') ? '../index.html' : 'index.html';
};

// 3. Listeners para Formularios
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');

    // Lógica de LOGIN REFORZADA
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            btn.disabled = true;
            btn.innerText = "Cargando...";

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (response.ok && !result.error && result.access_token) {
                    localStorage.setItem('token', result.access_token);
                    localStorage.setItem('user_email', email);
                    alert("✅ Bienvenido");
                    window.location.href = "../index.html"; 
                } else {
                    const mensaje = result.detail || result.error || "Credenciales incorrectas. Intente de nuevo.";
                    alert("❌ " + mensaje);
                }
            } catch (error) {
                alert("🚨 El servidor está despertando, reintente en unos segundos.");
            } finally {
                btn.disabled = false;
                btn.innerText = "Ingresar";
            }
        });
    }


    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Tu lógica de registro...
        });
    }



    actualizarNavbar();
    
});
