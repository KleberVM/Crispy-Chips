// ========================================
// VARIABLES GLOBALES
// ========================================
let usuarioId = null;
let usuarioData = null;

// ========================================
// VERIFICAR AUTENTICACIÓN
// ========================================
function verificarAutenticacion() {
  const username = localStorage.getItem('username');
  const userRol = localStorage.getItem('userRol');
  
  if (!username || userRol !== 'ADMIN') {
    alert('Debes iniciar sesión como administrador');
    window.location.href = '../contenido/index.html';
    return false;
  }
  
  return true;
}

// ========================================
// OBTENER ID DEL USUARIO DE LA URL
// ========================================
function obtenerUsuarioId() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  
  if (!id) {
    alert('ID de usuario no especificado');
    window.location.href = 'usuarios.html';
    return null;
  }
  
  return parseInt(id);
}

// ========================================
// CARGAR DATOS DEL USUARIO
// ========================================
async function cargarUsuario() {
  const loadingState = document.getElementById('loadingState');
  const formContainer = document.getElementById('formContainer');
  
  loadingState.style.display = 'block';
  formContainer.style.display = 'none';
  
  try {
    const response = await fetch(`http://localhost:3000/api/usuarios/${usuarioId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Usuario no encontrado');
    }
    
    const data = await response.json();
    usuarioData = data.usuario || data;
    
    console.log('Usuario cargado:', usuarioData);
    
    // Verificar si es ADMIN (no se puede editar)
    if (usuarioData.rol === 'ADMIN') {
      alert('No puedes editar usuarios ADMIN');
      window.location.href = 'usuarios.html';
      return;
    }
    
    // Rellenar formulario
    poblarFormulario(usuarioData);
    
    loadingState.style.display = 'none';
    formContainer.style.display = 'block';
    
  } catch (error) {
    console.error('Error al cargar usuario:', error);
    loadingState.style.display = 'none';
    alert(`Error: ${error.message}`);
    window.location.href = 'usuarios.html';
  }
}

// ========================================
// POBLAR FORMULARIO
// ========================================
function poblarFormulario(usuario) {
  // Formulario
  document.getElementById('nombre').value = usuario.nombre || '';
  document.getElementById('apellido').value = usuario.apellido || '';
  document.getElementById('username').value = usuario.username || '';
  document.getElementById('email').value = usuario.email || '';
  document.getElementById('emailVerificado').checked = usuario.emailVerificado || false;
  
  // Header card - información de usuario
  document.getElementById('displayUsername').textContent = usuario.username || 'Usuario';
  document.getElementById('displayEmail').textContent = usuario.email || '';
  document.getElementById('displayBadge').textContent = usuario.rol || 'CLIENTE';
  
  // Avatar si tiene foto de perfil
  const avatarLarge = document.getElementById('userAvatarLarge');
  if (usuario.fotoPerfil) {
    const photoUrl = `http://localhost:3000${usuario.fotoPerfil}`;
    avatarLarge.innerHTML = `<img src="${photoUrl}" alt="${usuario.username}">`;
  } else {
    avatarLarge.innerHTML = '👤';
  }
}

// ========================================
// ENVIAR FORMULARIO
// ========================================
async function enviarFormulario(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('.btn-submit-modern');
  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Guardando...';
  
  try {
    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      username: document.getElementById('username').value.trim(),
      email: document.getElementById('email').value.trim(),
      emailVerificado: document.getElementById('emailVerificado').checked
    };
    
    // Validaciones
    if (!formData.username) {
      throw new Error('El username es obligatorio');
    }
    
    if (!formData.email) {
      throw new Error('El email es obligatorio');
    }
    
    // Enviar datos
    const response = await fetch(`http://localhost:3000/api/usuarios/${usuarioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar usuario');
    }
    
    // Mostrar mensaje de éxito
    mostrarExito();
    
  } catch (error) {
    console.error('Error:', error);
    alert(`Error: ${error.message}`);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
}

// ========================================
// MOSTRAR MENSAJE DE ÉXITO
// ========================================
function mostrarExito() {
  const formContainer = document.getElementById('formContainer');
  const successMessage = document.getElementById('successMessage');
  
  formContainer.style.display = 'none';
  successMessage.style.display = 'block';
  
  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Redirigir después de 2 segundos
  setTimeout(() => {
    window.location.href = 'usuarios.html';
  }, 2000);
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded - Inicializando editar usuario...');
  
  // Verificar autenticación
  if (!verificarAutenticacion()) {
    return;
  }
  
  // Obtener ID del usuario
  usuarioId = obtenerUsuarioId();
  if (!usuarioId) {
    return;
  }
  
  console.log('Usuario ID:', usuarioId);
  
  // Cargar datos del usuario
  await cargarUsuario();
  
  // Manejar envío del formulario
  const form = document.getElementById('formEditarUsuario');
  form.addEventListener('submit', enviarFormulario);
  
  console.log('Editar usuario inicializado correctamente');
});
