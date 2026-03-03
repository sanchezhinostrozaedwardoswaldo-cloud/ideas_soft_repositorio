const API_URL = "https://ideas-soft-backend.onrender.com";

// 1. Función GLOBAL para actualizar el Navbar
window.actualizarNavbar = function() {
    const authSection = document.getElementById('auth-section');
    const email = localStorage.getItem('user_email');
    const token = localStorage.getItem('token');

    if (authSection) {
        if (token && email) {
            // Reemplazamos el Login por el correo del usuario
            authSection.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2;">
                    <span style="color: #365386; font-weight: bold; font-size: 0.85rem;">
                        <i class="fas fa-user-circle"></i> ${email}
                    </span>
                    <a href="javascript:void(0)" onclick="logout()" 
                       style="color: #d9534f; text-decoration: none; font-size: 0.7rem; font-weight: bold; text-transform: uppercase;">
                        Cerrar Sesión
                    </a>
                </div>
            `;
        } else {
            // Si no hay sesión, ruta correcta al login
            const esRaiz = !window.location.pathname.includes('components/');
            const rutaLogin = esRaiz ? 'components/login.html' : 'login.html';
            authSection.innerHTML = `<a href="${rutaLogin}" style="color: #365386; font-weight: bold;">Login</a>`;
        }
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

                // VALIDACIÓN CRÍTICA: 
                // Debe ser response.ok (200-299) 
                // Y NO debe traer un campo "error" 
                // Y DEBE traer el "access_token"
                if (response.ok && !result.error && result.access_token) {
                    localStorage.setItem('token', result.access_token);
                    localStorage.setItem('user_email', email);
                    alert("✅ Bienvenido");
                    window.location.href = "../index.html"; 
                } else {
                    // Si el backend mandó {"error": "..."} o no hay token, mostramos el error real
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

    // Lógica de REGISTRO
    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registroForm.querySelector('button');
            // Aquí iría tu lógica de registro (asegúrate de que coincida con tus campos de HTML)
            // ...
        });
    }

    
    // Ejecutar actualización de navbar al cargar la página
    actualizarNavbar();

});