// ========================================
// PERFIL - VARIABLES GLOBALES
// ========================================
let currentUserId = null;
let currentUserData = null;
let selectedPhotoFile = null;

// ========================================
// VERIFICAR AUTENTICACIÓN
// ========================================
function checkAuthentication() {
  const username = localStorage.getItem('username');
  
  if (!username) {
    // Redirigir a principal si no hay sesión
    window.location.href = '../contenido/principal.html';
    return false;
  }
  
  return true;
}

// ========================================
// NAVEGACIÓN ENTRE SECCIONES
// ========================================
function initNavigation() {
  const navItems = document.querySelectorAll('.profile-nav-item');
  const sections = document.querySelectorAll('.profile-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      
      // Actualizar navegación activa
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Mostrar sección correspondiente
      sections.forEach(section => section.classList.remove('active'));
      document.getElementById(`section-${sectionId}`).classList.add('active');
    });
  });
}

// ========================================
// CARGAR DATOS DEL USUARIO
// ========================================
async function loadUserData() {
  const username = localStorage.getItem('username');
  const userEmail = localStorage.getItem('userEmail');
  
  console.log('Cargando datos del usuario...');
  console.log('Username en localStorage:', username);
  
  try {
    const response = await fetch(`http://localhost:3000/api/user/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Respuesta del servidor:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Datos recibidos:', data);
      currentUserData = data;
      currentUserId = data.id;
      populateUserData(data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al obtener perfil:', response.status, errorData);
      alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
      window.location.href = '../contenido/principal.html';
    }
  } catch (error) {
    console.error('Error al cargar datos:', error);
    alert('Error de conexión con el servidor');
  }
}

function populateUserData(data) {
  console.log('Poblando datos en formulario:', data);
  
  // Información personal
  document.getElementById('info-nombre').value = data.nombre || '';
  document.getElementById('info-apellido').value = data.apellido || '';
  document.getElementById('info-username').value = data.username || '';
  document.getElementById('info-email').value = data.email || '';
  document.getElementById('info-telefono').value = data.telefono || '';
  
  // Sidebar del perfil - usuario y foto
  const profileSidebarName = document.getElementById('profile-sidebar-name');
  const profileSidebarEmail = document.getElementById('profile-sidebar-email');
  const profileSidebarAvatar = document.getElementById('profile-sidebar-avatar');
  
  if (profileSidebarName) {
    profileSidebarName.textContent = data.username || 'Usuario';
  }
  
  if (profileSidebarEmail) {
    profileSidebarEmail.textContent = data.email || '';
  }
  
  if (profileSidebarAvatar && data.fotoPerfil) {
    const photoUrl = `http://localhost:3000${data.fotoPerfil}`;
    profileSidebarAvatar.innerHTML = `<img src="${photoUrl}" alt="Perfil">`;
    console.log('✓ Foto cargada en sidebar de perfil');
  }
  
  // Foto de perfil (sección de foto)
  document.getElementById('photo-name').textContent = data.username || 'Usuario';
  document.getElementById('photo-email').textContent = data.email || '';
  
  if (data.fotoPerfil) {
    const photoImg = document.getElementById('photo-img');
    // Construir URL completa para la foto
    photoImg.src = `http://localhost:3000${data.fotoPerfil}`;
    photoImg.style.display = 'block';
    document.querySelector('.photo-placeholder').style.display = 'none';
  }
}

// ========================================
// FORMULARIO: INFORMACIÓN PERSONAL
// ========================================
function initFormInfo() {
  const formInfo = document.getElementById('form-info');
  if (!formInfo) return;

  formInfo.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('info-nombre').value.trim();
  const apellido = document.getElementById('info-apellido').value.trim();
  const telefono = document.getElementById('info-telefono').value.trim();
  
  // Validación
  let isValid = true;
  
  if (nombre && nombre.length < 2) {
    showError('info-nombre-error', 'El nombre debe tener al menos 2 caracteres');
    isValid = false;
  } else {
    hideError('info-nombre-error');
  }
  
  if (apellido && apellido.length < 2) {
    showError('info-apellido-error', 'El apellido debe tener al menos 2 caracteres');
    isValid = false;
  } else {
    hideError('info-apellido-error');
  }
  
  if (!isValid) return;
  
  // Mostrar loading
  const submitBtn = formInfo.querySelector('.btn-primary');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  
  try {
    const response = await fetch('http://localhost:3000/api/user/update-profile', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, apellido, telefono })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showFormMessage('info-message', 'Información actualizada correctamente', 'success');
      
      // Actualizar localStorage si es necesario
      if (data.user && data.user.username) {
        localStorage.setItem('username', data.user.username);
      }
    } else {
      showFormMessage('info-message', data.message || 'Error al actualizar información', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showFormMessage('info-message', 'Error de conexión con el servidor', 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
  });
}

// ========================================
// FORMULARIO: FOTO DE PERFIL
// ========================================
function initFormPhoto() {
  const photoInput = document.getElementById('photo-input');
  const btnSavePhoto = document.getElementById('btn-save-photo');
  const btnRemovePhoto = document.getElementById('btn-remove-photo');
  const formPhoto = document.getElementById('form-photo');
  
  if (!photoInput || !formPhoto) return;

photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  
  if (!file) return;
  
  // Validar tipo de archivo
  if (!file.type.match('image/(jpeg|jpg|png)')) {
    showFormMessage('photo-message', 'Solo se permiten imágenes JPG o PNG', 'error');
    return;
  }
  
  // Validar tamaño (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showFormMessage('photo-message', 'La imagen no debe superar los 5MB', 'error');
    return;
  }
  
  selectedPhotoFile = file;
  
  // Previsualizar imagen
  const reader = new FileReader();
  reader.onload = (e) => {
    const photoImg = document.getElementById('photo-img');
    photoImg.src = e.target.result;
    photoImg.style.display = 'block';
    document.querySelector('.photo-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
  
  // Habilitar botón de guardar
  btnSavePhoto.disabled = false;
  hideFormMessage('photo-message');
});

formPhoto.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!selectedPhotoFile) {
    showFormMessage('photo-message', 'Por favor selecciona una foto', 'error');
    return;
  }
  
  // Mostrar loading
  btnSavePhoto.classList.add('loading');
  btnSavePhoto.disabled = true;
  
  try {
    const formData = new FormData();
    formData.append('photo', selectedPhotoFile);
    
    const response = await fetch('http://localhost:3000/api/user/upload-photo', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showFormMessage('photo-message', 'Foto actualizada correctamente', 'success');
      
      // Actualizar la URL de la foto en la vista
      const photoImg = document.getElementById('photo-img');
      photoImg.src = `http://localhost:3000${data.photoUrl}`;
      
      // Actualizar foto en sidebar de perfil
      const profileSidebarAvatar = document.getElementById('profile-sidebar-avatar');
      if (profileSidebarAvatar) {
        const photoUrl = `http://localhost:3000${data.photoUrl}`;
        profileSidebarAvatar.innerHTML = `<img src="${photoUrl}" alt="Perfil">`;
        console.log('✓ Foto actualizada en sidebar de perfil');
      }
      
      // Actualizar foto en sidebar y header del sitio
      if (typeof loadUserPhoto === 'function') {
        loadUserPhoto();
        console.log('Actualizando foto en sidebar y header del sitio...');
      }
      
      selectedPhotoFile = null;
      btnSavePhoto.disabled = true;
    } else {
      showFormMessage('photo-message', data.message || 'Error al subir la foto', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showFormMessage('photo-message', 'Error de conexión con el servidor', 'error');
  } finally {
    btnSavePhoto.classList.remove('loading');
  }
});

btnRemovePhoto.addEventListener('click', async () => {
  if (!confirm('¿Estás seguro de eliminar tu foto de perfil?')) return;
  
  try {
    const response = await fetch('http://localhost:3000/api/user/remove-photo', {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      // Restaurar placeholder
      const photoImg = document.getElementById('photo-img');
      photoImg.style.display = 'none';
      photoImg.src = '';
      document.querySelector('.photo-placeholder').style.display = 'block';
      
      // Restaurar icono en sidebar de perfil
      const profileSidebarAvatar = document.getElementById('profile-sidebar-avatar');
      if (profileSidebarAvatar) {
        profileSidebarAvatar.innerHTML = '👤';
        console.log('✓ Icono restaurado en sidebar de perfil');
      }
      
      // Restaurar iconos por defecto en sidebar y header del sitio
      const btnLoginIcon = document.querySelector('#btn-login-nav .user-icon');
      if (btnLoginIcon) btnLoginIcon.innerHTML = '👤';
      
      const userAvatar = document.querySelector('.user-avatar.user-icon');
      if (userAvatar) userAvatar.innerHTML = '👤';
      
      const sidebarIcon = document.querySelector('.sidebar-user-icon');
      if (sidebarIcon) sidebarIcon.innerHTML = '👤';
      
      const userIconSmall = document.querySelector('.user-icon-small');
      if (userIconSmall) userIconSmall.innerHTML = '👤';
      
      showFormMessage('photo-message', 'Foto eliminada correctamente', 'success');
    } else {
      const data = await response.json();
      showFormMessage('photo-message', data.message || 'Error al eliminar la foto', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showFormMessage('photo-message', 'Error de conexión con el servidor', 'error');
  }
  });
}

// ========================================
// FORMULARIO: CAMBIAR CONTRASEÑA
// ========================================
function initFormPassword() {
  const formPassword = document.getElementById('form-password');
  const passwordNew = document.getElementById('password-new');
  const passwordStrength = document.getElementById('password-strength');
  
  if (!formPassword || !passwordNew || !passwordStrength) return;
  
  const strengthBar = passwordStrength.querySelector('.strength-bar');

  // Toggle password visibility
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');

  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });

  // Password strength indicator
  passwordNew.addEventListener('input', (e) => {
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
    
    // Actualizar requisitos
    updatePasswordRequirements(password);
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

  function updatePasswordRequirements(password) {
    const reqLength = document.getElementById('req-length');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqNumber = document.getElementById('req-number');
    
    reqLength.classList.toggle('valid', password.length >= 6);
    reqLowercase.classList.toggle('valid', /[a-z]/.test(password));
    reqUppercase.classList.toggle('valid', /[A-Z]/.test(password));
    reqNumber.classList.toggle('valid', /[0-9]/.test(password));
  }

  formPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password-new').value;
    const confirmPassword = document.getElementById('password-confirm').value;
    
    // Validación
    let isValid = true;
    
    if (!currentPassword) {
      showError('password-current-error', 'Ingresa tu contraseña actual');
      isValid = false;
    } else {
      hideError('password-current-error');
    }
    
    if (newPassword.length < 6) {
      showError('password-new-error', 'La contraseña debe tener al menos 6 caracteres');
      isValid = false;
    } else if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      showError('password-new-error', 'La contraseña debe cumplir todos los requisitos');
      isValid = false;
    } else {
      hideError('password-new-error');
    }
    
    if (newPassword !== confirmPassword) {
      showError('password-confirm-error', 'Las contraseñas no coinciden');
      isValid = false;
    } else {
      hideError('password-confirm-error');
    }
    
    if (!isValid) return;
    
    // Mostrar loading
    const submitBtn = formPassword.querySelector('.btn-primary');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
      const response = await fetch('http://localhost:3000/api/user/change-password', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showFormMessage('password-message', 'Contraseña actualizada correctamente', 'success');
        formPassword.reset();
        strengthBar.style.width = '0';
        updatePasswordRequirements('');
      } else {
        showFormMessage('password-message', data.message || 'Error al cambiar la contraseña', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showFormMessage('password-message', 'Error de conexión con el servidor', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.classList.add('show');
  errorElement.parentElement.classList.add('error');
}

function hideError(elementId) {
  const errorElement = document.getElementById(elementId);
  errorElement.classList.remove('show');
  errorElement.parentElement.classList.remove('error');
}

function showFormMessage(elementId, message, type) {
  const messageElement = document.getElementById(elementId);
  messageElement.textContent = message;
  messageElement.className = `form-message ${type} show`;
  
  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    hideFormMessage(elementId);
  }, 5000);
}

function hideFormMessage(elementId) {
  const messageElement = document.getElementById(elementId);
  messageElement.classList.remove('show');
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded - Inicializando perfil...');
  
  // Verificar autenticación
  if (!checkAuthentication()) return;
  
  // Inicializar navegación
  initNavigation();
  
  // Inicializar formularios
  initFormInfo();
  initFormPhoto();
  initFormPassword();
  
  // Cargar datos del usuario
  loadUserData();
  
  // Cargar foto de perfil en sidebar y header (de auth-modal.js)
  if (typeof loadUserPhoto === 'function') {
    loadUserPhoto();
    console.log('Cargando foto de perfil en sidebar y header...');
  }
  
  console.log('Perfil inicializado correctamente');
});
