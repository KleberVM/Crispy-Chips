// ========================================
// VARIABLES GLOBALES
// ========================================
const API_BASE_URL = 'http://localhost:3000';
let notificacionesData = [];
let intervalId = null;

// ========================================
// CREAR DROPDOWN DE NOTIFICACIONES
// ========================================
function crearDropdownNotificaciones() {
  const dropdown = document.createElement('div');
  dropdown.className = 'notifications-dropdown';
  dropdown.id = 'notifications-dropdown';
  dropdown.innerHTML = `
    <div class="notifications-header">
      <h3>Notificaciones</h3>
      <button class="btn-mark-all-read" id="btn-mark-all-read">Marcar todas</button>
    </div>
    <div class="notifications-body" id="notifications-body">
      <div class="notifications-empty">
        <div class="notifications-empty-icon"><i data-lucide="bell" class="lucide icon-lg icon-light"></i></div>
        <p>No tienes notificaciones</p>
      </div>
    </div>
  `;
  
  // Insertar dentro del header container, al final
  const headerContainer = document.querySelector('.header-container');
  if (headerContainer) {
    headerContainer.appendChild(dropdown);
  } else {
    // Fallback: insertar después del header
    const header = document.querySelector('.encabezado');
    if (header) {
      header.parentNode.insertBefore(dropdown, header.nextSibling);
    } else {
      document.body.appendChild(dropdown);
    }
  }
  
  // Inicializar iconos de Lucide para el dropdown
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  return dropdown;
}

// ========================================
// INICIALIZAR NOTIFICACIONES
// ========================================
let notificacionesInicializadas = false;

function inicializarNotificaciones() {
  const userRol = localStorage.getItem('userRol');
  
  // Solo para usuarios autenticados
  if (!localStorage.getItem('username')) {
    console.log('⚠️ No hay usuario autenticado, saltando inicialización de notificaciones');
    return;
  }
  
  console.log('🔔 Inicializando notificaciones...');
  
  // Determinar qué botón de notificaciones usar
  const btnNotifications = userRol === 'ADMIN' 
    ? document.getElementById('btn-notifications-admin')
    : document.getElementById('btn-notifications');
  
  if (!btnNotifications) {
    console.log('⚠️ Botón de notificaciones no encontrado');
    return;
  }
  
  // Crear dropdown si no existe
  let notificationsDropdown = document.getElementById('notifications-dropdown');
  if (!notificationsDropdown) {
    notificationsDropdown = crearDropdownNotificaciones();
  }
  
  const btnMarkAllRead = document.getElementById('btn-mark-all-read');
  
  if (!notificationsDropdown) return;
  
  // Si ya se inicializaron los event listeners, solo actualizar el contador
  if (notificacionesInicializadas) {
    console.log('✅ Notificaciones ya inicializadas, solo actualizando contador');
    actualizarContadorNotificaciones();
    return;
  }
  
  console.log('✅ Configurando event listeners de notificaciones');
  
  // Toggle dropdown
  btnNotifications.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationsDropdown.classList.toggle('active');
    
    // Cargar notificaciones al abrir
    if (notificationsDropdown.classList.contains('active')) {
      cargarNotificaciones();
    }
  });
  
  // Cerrar dropdown al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!notificationsDropdown.contains(e.target) && e.target !== btnNotifications) {
      notificationsDropdown.classList.remove('active');
    }
  });
  
  // Marcar todas como leídas
  if (btnMarkAllRead) {
    btnMarkAllRead.addEventListener('click', marcarTodasComoLeidas);
  }
  
  // Marcar como inicializadas
  notificacionesInicializadas = true;
  
  // Limpiar interval anterior si existe
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  // Cargar contador inicial
  actualizarContadorNotificaciones();
  
  // Actualizar cada 30 segundos
  intervalId = setInterval(() => {
    actualizarContadorNotificaciones();
  }, 30000);
  
  console.log('✅ Notificaciones inicializadas correctamente');
}

// ========================================
// CARGAR NOTIFICACIONES
// ========================================
async function cargarNotificaciones() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notificaciones`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar notificaciones');
    }
    
    const data = await response.json();
    notificacionesData = data.notificaciones;
    
    renderizarNotificaciones();
    
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
  }
}

// ========================================
// RENDERIZAR NOTIFICACIONES
// ========================================
function renderizarNotificaciones() {
  const notificationsBody = document.getElementById('notifications-body');
  
  if (!notificationsBody) return;
  
  if (notificacionesData.length === 0) {
    notificationsBody.innerHTML = `
      <div class="notifications-empty">
        <div class="notifications-empty-icon">🔔</div>
        <p>No tienes notificaciones</p>
      </div>
    `;
    return;
  }
  
  notificationsBody.innerHTML = '';
  
  notificacionesData.forEach(notif => {
    const notifElement = crearNotificacionElement(notif);
    notificationsBody.appendChild(notifElement);
  });
}

// ========================================
// CREAR ELEMENTO DE NOTIFICACIÓN
// ========================================
function crearNotificacionElement(notif) {
  const div = document.createElement('div');
  div.className = `notification-item ${!notif.leida ? 'unread' : ''}`;
  div.dataset.id = notif.id;
  
  const tiempoAtras = calcularTiempoAtras(notif.createdAt);
  
  // Mapeo de iconos según el tipo de notificación
  const iconos = {
    'NUEVA_VENTA': 'shopping-cart',
    'ESTADO_PEDIDO': 'package'
  };
  
  const iconoNombre = iconos[notif.tipo] || 'bell';
  
  div.innerHTML = `
    <div class="notification-icon">
      <i data-lucide="${iconoNombre}" class="lucide"></i>
    </div>
    <div class="notification-content">
      <h4 class="notification-title">${notif.titulo}</h4>
      <p class="notification-message">${notif.mensaje}</p>
      <span class="notification-time">${tiempoAtras}</span>
    </div>
    ${!notif.leida ? '<div class="notification-badge"></div>' : ''}
  `;
  
  // Click en notificación
  div.addEventListener('click', () => {
    if (!notif.leida) {
      marcarComoLeida(notif.id);
    }
    
    // Redirigir según el rol y tipo de notificación
    if (notif.pedidoId) {
      const userRol = localStorage.getItem('userRol');
      
      // Solo admins pueden acceder a Mis Ventas
      if (userRol === 'ADMIN') {
        window.location.href = '../contenido/mis-ventas.html';
      } else {
        // Para clientes, solo cerrar el dropdown
        // En el futuro, aquí se puede redirigir a "Mis Pedidos" cuando exista
        const dropdown = document.getElementById('notifications-dropdown');
        if (dropdown) {
          dropdown.classList.remove('active');
        }
      }
    }
  });
  
  // Inicializar iconos de Lucide para esta notificación
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({ nameAttr: 'data-lucide' });
  }
  
  return div;
}

// ========================================
// ACTUALIZAR CONTADOR
// ========================================
async function actualizarContadorNotificaciones() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notificaciones/count`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) return;
    
    const data = await response.json();
    const count = data.count;
    
    // Actualizar badge según el rol
    const userRol = localStorage.getItem('userRol');
    const badge = userRol === 'ADMIN'
      ? document.getElementById('notif-badge-admin')
      : document.getElementById('notif-badge');
    
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
    
  } catch (error) {
    console.error('Error al actualizar contador:', error);
  }
}

// ========================================
// MARCAR COMO LEÍDA
// ========================================
async function marcarComoLeida(notificacionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notificaciones/${notificacionId}/leer`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // Actualizar en el array local
      const notif = notificacionesData.find(n => n.id === notificacionId);
      if (notif) {
        notif.leida = true;
      }
      
      // Re-renderizar
      renderizarNotificaciones();
      actualizarContadorNotificaciones();
    }
    
  } catch (error) {
    console.error('Error al marcar como leída:', error);
  }
}

// ========================================
// MARCAR TODAS COMO LEÍDAS
// ========================================
async function marcarTodasComoLeidas() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notificaciones/leer-todas`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // Actualizar todas en el array local
      notificacionesData.forEach(notif => {
        notif.leida = true;
      });
      
      // Re-renderizar
      renderizarNotificaciones();
      actualizarContadorNotificaciones();
    }
    
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
  }
}

// ========================================
// UTILIDADES
// ========================================
function calcularTiempoAtras(fecha) {
  const ahora = new Date();
  const notifFecha = new Date(fecha);
  const diferencia = ahora - notifFecha;
  
  const segundos = Math.floor(diferencia / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  
  if (dias > 0) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  if (horas > 0) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
  if (minutos > 0) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  return 'Justo ahora';
}

// ========================================
// LIMPIAR NOTIFICACIONES
// ========================================
function limpiarNotificaciones() {
  console.log('🧹 Limpiando notificaciones...');
  
  // Limpiar interval
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  // Resetear bandera
  notificacionesInicializadas = false;
  
  // Limpiar array de notificaciones
  notificacionesData = [];
  
  // Ocultar badges
  const badges = document.querySelectorAll('#notif-badge, #notif-badge-admin');
  badges.forEach(badge => {
    if (badge) {
      badge.textContent = '0';
      badge.style.display = 'none';
    }
  });
  
  console.log('✅ Notificaciones limpiadas');
}

// ========================================
// LIMPIAR AL SALIR
// ========================================
window.addEventListener('beforeunload', () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

// ========================================
// AUTO-INICIALIZACIÓN
// ========================================
// Se ejecutará cuando se cargue cualquier página
document.addEventListener('DOMContentLoaded', () => {
  // Esperar un poco para asegurar que auth-modal ya inicializó la sesión
  setTimeout(() => {
    inicializarNotificaciones();
  }, 500);
});
