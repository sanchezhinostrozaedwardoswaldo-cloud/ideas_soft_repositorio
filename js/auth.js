const API_URL = "https://ideas-soft-backend.onrender.com";

// 1. Función GLOBAL para actualizar el Navbar
window.actualizarNavbar = function() {
    const authSection = document.getElementById('auth-section');
    const email = localStorage.getItem('user_email');
    const token = localStorage.getItem('token');

    if (!authSection) return;

    const path = window.location.pathname;
    const isInSubfolder = path.includes('/sub/') || path.includes('/components/');

    if (token && email) {
        // --- ESTADO: USUARIO LOGUEADO (Imagen 2) ---
        authSection.innerHTML = `
            <div class="dropdown">
                <button class="nav-icon-btn dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user-circle"></i>
                    <span class="user-email-text">${email}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="${isInSubfolder ? 'panel.html' : 'sub/panel.html'}"><i class="fas fa-th-large me-2"></i> Mi Panel</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i> Salir</a></li>
                </ul>
            </div>`;
    } else {
        // --- ESTADO: USUARIO NO LOGUEADO (Mejora Imagen 1) ---
        const loginPath = isInSubfolder ? '../components/login.html' : 'components/login.html';
        const registerPath = isInSubfolder ? '../components/register.html' : 'components/register.html';

        authSection.innerHTML = `
            <div class="dropdown">
                <button class="btn-login dropdown-toggle" type="button" id="loginDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="far fa-user"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="loginDropdown">
                    <li>
                        <a class="dropdown-item" href="${loginPath}">
                            <i class="fas fa-sign-in-alt me-2"></i> Iniciar Sesión
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="${registerPath}">
                            <i class="fas fa-user-plus me-2"></i> Registrarse
                        </a>
                    </li>
                </ul>
            </div>`;
    }

    // Inicialización de Dropdowns de Bootstrap
    const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    dropdownElementList.map(function (dropdownToggleEl) {
        if (window.bootstrap) {
            return new bootstrap.Dropdown(dropdownToggleEl);
        }
    });
};

// 2. Función GLOBAL para cerrar sesión
window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    alert("Has salido de la cuenta.");
    // Redirección inteligente según la ubicación
    window.location.href = window.location.pathname.includes('components/') || window.location.pathname.includes('sub/') ? '../index.html' : 'index.html';
};

// 3. Listeners para Formularios (DOM Ready)
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');

    // --- LÓGICA DE LOGIN ---
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
                    const mensaje = result.detail || result.error || "Credenciales incorrectas.";
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

    // --- LÓGICA DE REGISTRO (Restaurada) ---
    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registroForm.querySelector('button');
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            btn.disabled = true;
            btn.innerText = "Registrando...";

            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, password })
                });

                if (response.ok) {
                    alert("✅ Registro exitoso. Ahora puedes iniciar sesión.");
                    window.location.href = "login.html";
                } else {
                    const result = await response.json();
                    alert("❌ " + (result.detail || "Error al registrarse"));
                }
            } catch (error) {
                alert("🚨 Error de conexión.");
            } finally {
                btn.disabled = false;
                btn.innerText = "Registrarse";
            }
        });
    }

    // Ejecutar actualización inicial del Navbar
    actualizarNavbar();

}
);