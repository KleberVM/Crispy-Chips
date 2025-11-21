// ========================================
// VARIABLES GLOBALES
// ========================================
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const btnLoginNav = document.getElementById('btn-login-nav');
const btnOpenRegister = document.getElementById('btn-open-register');
const btnOpenLogin = document.getElementById('btn-open-login');
const modalCloses = document.querySelectorAll('.modal-close');
const modalOverlays = document.querySelectorAll('.modal-overlay');
const userDropdown = document.getElementById('userDropdown');
const btnPerfil = document.getElementById('btnPerfil');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

// Abrir modal de login
function openLoginModal() {
  loginModal.classList.add('active');
  registerModal.classList.remove('active');
  document.body.style.overflow = 'hidden';
}

// Abrir modal de registro
function openRegisterModal() {
  registerModal.classList.add('active');
  loginModal.classList.remove('active');
  document.body.style.overflow = 'hidden';
}

// Cerrar todos los modales
function closeModals() {
  loginModal.classList.remove('active');
  registerModal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// ========================================
// USER DROPDOWN & LOGIN BUTTON HANDLER
// ========================================
// Este event listener DEBE estar PRIMERO para manejar correctamente
// el toggle entre modal de login y dropdown de usuario

btnLoginNav?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  const isLoggedIn = localStorage.getItem('username');
  
  if (isLoggedIn) {
    // Si está logueado, toggle dropdown
    userDropdown?.classList.toggle('active');
  } else {
    // Si no está logueado, abrir modal de login
    openLoginModal();
  }
});

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-section')) {
    userDropdown?.classList.remove('active');
  }
});

// Ver perfil
btnPerfil?.addEventListener('click', (e) => {
  e.preventDefault();
  userDropdown?.classList.remove('active');
  
  // Redirigir a la página de perfil
  window.location.href = '../contenido/perfil.html';
});

// Cerrar sesión
btnCerrarSesion?.addEventListener('click', (e) => {
  e.preventDefault();
  
  const confirmar = confirm('¿Estás seguro que deseas cerrar sesión?');
  
  if (confirmar) {
    // Limpiar localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    
    // Cerrar dropdown
    userDropdown?.classList.remove('active');
    
    // Actualizar UI
    updateUserUI();
    
    // Mostrar notificación
    showToast('Sesión cerrada exitosamente', 'success');
    
    // Opcional: recargar página
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
});

// ========================================
// OTROS EVENT LISTENERS DE MODALES
// ========================================
btnOpenRegister?.addEventListener('click', (e) => {
  e.preventDefault();
  openRegisterModal();
});

btnOpenLogin?.addEventListener('click', (e) => {
  e.preventDefault();
  openLoginModal();
});

// Event listeners para cerrar modales
modalCloses.forEach(btn => {
  btn.addEventListener('click', closeModals);
});

modalOverlays.forEach(overlay => {
  overlay.addEventListener('click', closeModals);
});

// Cerrar modal con tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModals();
  }
});

// ========================================
// PASSWORD TOGGLE
// ========================================
const togglePasswordBtns = document.querySelectorAll('.toggle-password');

togglePasswordBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
    } else {
      input.type = 'password';
      btn.textContent = '👁️';
    }
  });
});

// ========================================
// PASSWORD STRENGTH INDICATOR
// ========================================
const registerPassword = document.getElementById('register-password');
const passwordStrength = document.getElementById('password-strength');
const strengthBar = passwordStrength?.querySelector('.strength-bar');

registerPassword?.addEventListener('input', (e) => {
  const password = e.target.value;
  const strength = calculatePasswordStrength(password);
  
  strengthBar.className = 'strength-bar';
  
  if (password.length === 0) {
    strengthBar.style.width = '0';
  } else if (strength < 3) {
    strengthBar.classList.add('weak');
  } else if (strength < 5) {
    strengthBar.classList.add('medium');
  } else {
    strengthBar.classList.add('strong');
  }
});

function calculatePasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  return strength;
}

// ========================================
// LOGIN FORM SUBMISSION
// ========================================
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('login-message');

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  
  // Validación básica
  if (!username || !password) {
    showMessage(loginMessage, 'Por favor completa todos los campos', 'error');
    return;
  }
  
  // Mostrar loading
  const submitBtn = loginForm.querySelector('.btn-submit');
  submitBtn.classList.add('loading');
  
  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Guardar usuario en localStorage
      const userData = data.user || data;
      localStorage.setItem('username', userData.username || username);
      if (userData.email) {
        localStorage.setItem('userEmail', userData.email);
      }
      
      showMessage(loginMessage, '¡Inicio de sesión exitoso!', 'success');
      
      // Actualizar UI
      updateUserUI();
      
      setTimeout(() => {
        closeModals();
        showToast('¡Bienvenido de nuevo!', 'success');
      }, 1500);
    } else {
      showMessage(loginMessage, data.message || data.mensaje || 'Usuario o contraseña incorrectos', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage(loginMessage, 'Error al conectar con el servidor. Intenta nuevamente.', 'error');
  } finally {
    submitBtn.classList.remove('loading');
  }
});

// ========================================
// REGISTER FORM SUBMISSION
// ========================================
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('register-message');

registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('register-email').value.trim();
  const username = document.getElementById('register-username').value.trim();
  const nombre = document.getElementById('register-nombre').value.trim();
  const apellido = document.getElementById('register-apellido').value.trim();
  const password = document.getElementById('register-password').value;
  
  // Limpiar mensajes de error previos
  clearErrors();
  
  // Validación
  let isValid = true;
  
  if (!email || !isValidEmail(email)) {
    showFieldError('register-email', 'Ingresa un email válido');
    isValid = false;
  }
  
  if (!username || username.length < 3) {
    showFieldError('register-username', 'El usuario debe tener al menos 3 caracteres');
    isValid = false;
  }
  
  if (!password || password.length < 6) {
    showFieldError('register-password', 'La contraseña debe tener al menos 6 caracteres');
    isValid = false;
  }
  
  if (!isValid) {
    showMessage(registerMessage, 'Por favor corrige los errores', 'error');
    return;
  }
  
  // Mostrar loading
  const submitBtn = registerForm.querySelector('.btn-submit');
  submitBtn.classList.add('loading');
  
  try {
    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, nombre, apellido, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showMessage(registerMessage, '¡Cuenta creada exitosamente!', 'success');
      registerForm.reset();
      
      // Guardar usuario
      localStorage.setItem('username', username);
      localStorage.setItem('userEmail', email);
      
      // Actualizar UI
      updateUserUI();
      
      setTimeout(() => {
        closeModals();
        showToast('¡Cuenta creada! Ya puedes disfrutar de Crispy Chips', 'success');
      }, 2000);
    } else {
      showMessage(registerMessage, data.mensaje || 'Error al crear la cuenta', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage(registerMessage, 'Error al conectar con el servidor. Intenta nuevamente.', 'error');
  } finally {
    submitBtn.classList.remove('loading');
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================
function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type} active`;
  
  setTimeout(() => {
    element.classList.remove('active');
  }, 5000);
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  field.classList.add('error');
  errorElement.textContent = message;
  errorElement.classList.add('active');
}

function clearErrors() {
  const errorMessages = document.querySelectorAll('.error-message');
  const errorFields = document.querySelectorAll('input.error');
  
  errorMessages.forEach(msg => {
    msg.classList.remove('active');
    msg.textContent = '';
  });
  
  errorFields.forEach(field => {
    field.classList.remove('error');
  });
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ========================================
// UPDATE USER UI
// ========================================
async function updateUserUI() {
  const username = localStorage.getItem('username');
  const userEmail = localStorage.getItem('userEmail');
  const btnLoginNav = document.getElementById('btn-login-nav');
  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const userTextEl = btnLoginNav?.querySelector('.user-text');
  
  // Elementos del sidebar
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserEmail = document.getElementById('sidebarUserEmail');
  
  // Elementos de navegación
  const menu = document.getElementById('menu');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const headerIcons = document.getElementById('header-icons');
  
  if (username) {
    // Usuario logueado
    document.body.classList.add('logged-in');
    
    // Actualizar dropdown del header
    if (userTextEl) {
      userTextEl.textContent = username;
    }
    
    if (userNameEl) {
      userNameEl.textContent = username;
    }
    
    if (userEmailEl && userEmail) {
      userEmailEl.textContent = userEmail;
    }
    
    // Actualizar sidebar
    if (sidebarUserName) {
      sidebarUserName.textContent = username;
    }
    
    if (sidebarUserEmail && userEmail) {
      sidebarUserEmail.textContent = userEmail;
    }
    
    // Cargar y mostrar foto de perfil
    loadUserPhoto();
    
    // Mostrar sidebar toggle y header icons, ocultar menú
    if (menu) menu.style.display = 'none';
    if (sidebarToggle) sidebarToggle.style.display = 'flex';
    if (headerIcons) headerIcons.style.display = 'flex';
  } else {
    // Usuario no logueado
    document.body.classList.remove('logged-in');
    
    if (userTextEl) {
      userTextEl.textContent = 'Iniciar Sesión';
    }
    
    // Mostrar menú, ocultar sidebar toggle y header icons
    if (menu) menu.style.display = 'flex';
    if (sidebarToggle) sidebarToggle.style.display = 'none';
    if (headerIcons) headerIcons.style.display = 'none';
  }
}

// ========================================
// CARGAR FOTO DE PERFIL
// ========================================
async function loadUserPhoto() {
  try {
    const response = await fetch('http://localhost:3000/api/user/profile', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.fotoPerfil) {
        const photoUrl = `http://localhost:3000${data.fotoPerfil}`;
        console.log('Cargando foto de perfil:', photoUrl);
        
        // 1. Foto en el botón del header (icono principal)
        const btnLoginIcon = document.querySelector('#btn-login-nav .user-icon');
        if (btnLoginIcon) {
          btnLoginIcon.innerHTML = `<img src="${photoUrl}" alt="Perfil">`;
          console.log('✓ Foto insertada en botón header');
        }
        
        // 2. Foto en el dropdown del header (avatar grande)
        const userAvatar = document.querySelector('.user-avatar.user-icon');
        if (userAvatar) {
          userAvatar.innerHTML = `<img src="${photoUrl}" alt="Perfil">`;
          console.log('✓ Foto insertada en dropdown avatar');
        }
        
        // 3. Foto en el sidebar
        const sidebarIcon = document.querySelector('.sidebar-user-icon');
        if (sidebarIcon) {
          sidebarIcon.innerHTML = `<img src="${photoUrl}" alt="Perfil">`;
          console.log('✓ Foto insertada en sidebar');
        }
        
        // 4. Foto pequeña en "Ver Perfil"
        const userIconSmall = document.querySelector('.user-icon-small');
        if (userIconSmall) {
          userIconSmall.innerHTML = `<img src="${photoUrl}" alt="Perfil">`;
          console.log('✓ Foto insertada en Ver Perfil');
        }
      } else {
        console.log('Usuario no tiene foto de perfil');
      }
    }
  } catch (error) {
    console.error('Error al cargar foto de perfil:', error);
  }
}

// ========================================
// TOAST NOTIFICATION
// ========================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    animation: slideInRight 0.3s ease;
    font-weight: 600;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========================================
// SIDEBAR MANAGEMENT
// ========================================
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Abrir sidebar
sidebarToggle?.addEventListener('click', () => {
  sidebar?.classList.add('active');
  sidebarOverlay?.classList.add('active');
});

// Cerrar sidebar
sidebarClose?.addEventListener('click', () => {
  sidebar?.classList.remove('active');
  sidebarOverlay?.classList.remove('active');
});

// Cerrar sidebar al hacer click en overlay
sidebarOverlay?.addEventListener('click', () => {
  sidebar?.classList.remove('active');
  sidebarOverlay?.classList.remove('active');
});

// Cerrar sidebar con tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar?.classList.contains('active')) {
    sidebar?.classList.remove('active');
    sidebarOverlay?.classList.remove('active');
  }
});

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  updateUserUI();
});
