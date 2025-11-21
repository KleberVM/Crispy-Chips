// ========================================
// VARIABLES GLOBALES
// ========================================
const API_BASE_URL = 'http://localhost:3000';
let notificacionesData = [];
let intervalId = null;

// ========================================
// INICIALIZAR NOTIFICACIONES
// ========================================
function inicializarNotificaciones() {
  const userRol = localStorage.getItem('userRol');
  
  // Solo para usuarios autenticados
  if (!localStorage.getItem('username')) return;
  
  // Determinar qué botón de notificaciones usar
  const btnNotifications = userRol === 'ADMIN' 
    ? document.getElementById('btn-notifications-admin')
    : document.getElementById('btn-notifications');
  
  const notificationsDropdown = document.getElementById('notifications-dropdown');
  const btnMarkAllRead = document.getElementById('btn-mark-all-read');
  
  if (!btnNotifications || !notificationsDropdown) return;
  
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
  
  // Cargar contador inicial
  actualizarContadorNotificaciones();
  
  // Actualizar cada 30 segundos
  intervalId = setInterval(() => {
    actualizarContadorNotificaciones();
  }, 30000);
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
  
  const icono = notif.tipo === 'NUEVA_VENTA' ? '🛒' : '📦';
  
  div.innerHTML = `
    <div class="notification-icon">${icono}</div>
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
    
    // Si tiene pedidoId, redirigir a mis ventas
    if (notif.pedidoId) {
      window.location.href = '../contenido/mis-ventas.html';
    }
  });
  
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
