// ========================================
// CONFIGURACIÓN
// ========================================
const API_BASE_URL = 'http://localhost:3000';

// ========================================
// VERIFICAR AUTENTICACIÓN
// ========================================
function verificarAutenticacion() {
  const username = localStorage.getItem('username');
  const userRol = localStorage.getItem('userRol');
  
  console.log('Verificando autenticación...');
  console.log('   Username:', username);
  console.log('   Rol:', userRol);
  
  if (!username) {
    console.error('Usuario no autenticado');
    alert('Debes iniciar sesión para ver esta sección.');
    window.location.href = '../contenido/index.html';
    return false;
  }
  
  if (userRol !== 'CLIENTE') {
    console.error('Usuario no es CLIENTE');
    alert('Esta sección es solo para clientes.');
    window.location.href = '../contenido/index.html';
    return false;
  }
  
  console.log('Autenticación verificada correctamente');
  return true;
}

// ========================================
// ESTADO DE LAS COMPRAS
// ========================================
let comprasOriginales = [];
let comprasFiltradas = [];

// ========================================
// CARGAR COMPRAS
// ========================================
async function cargarCompras() {
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const comprasList = document.getElementById('compras-list');
  const statsSection = document.getElementById('statsSection');
  
  if (!loadingState || !emptyState || !comprasList) {
    console.error('No se encontraron elementos del DOM');
    return;
  }
  
  loadingState.style.display = 'flex';
  emptyState.style.display = 'none';
  comprasList.innerHTML = '';
  if (statsSection) statsSection.style.display = 'none';
  
  try {
    const url = `${API_BASE_URL}/api/pedidos/mis-compras`;
    
    console.log('Cargando compras desde:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      console.error('Status code:', response.status);
      
      if (response.status === 401) {
        throw new Error('401 - No autorizado');
      } else if (response.status === 403) {
        throw new Error('403 - Acceso denegado');
      } else {
        throw new Error(`Error ${response.status} al cargar compras`);
      }
    }
    
    const data = await response.json();
    console.log('Compras recibidas:', data);
    
    loadingState.style.display = 'none';
    
    if (!data.compras || data.compras.length === 0) {
      emptyState.style.display = 'flex';
      comprasList.innerHTML = '';
    } else {
      comprasOriginales = data.compras;
      comprasFiltradas = [...comprasOriginales];
      emptyState.style.display = 'none';
      actualizarEstadisticas(comprasOriginales);
      renderizarCompras(comprasFiltradas);
      if (statsSection) statsSection.style.display = 'grid';
    }
    
  } catch (error) {
    console.error('Error al cargar compras:', error);
    console.error('Error completo:', error.message);
    loadingState.style.display = 'none';
    emptyState.style.display = 'flex';
    
    // Verificar si es un error de autenticación
    if (error.message.includes('401') || error.message.includes('autorizado')) {
      // Limpiar localStorage y redirigir al login
      const emptyStateEl = document.getElementById('empty-state');
      if (emptyStateEl) {
        emptyStateEl.innerHTML = `
          <div class="empty-icon"><i data-lucide="alert-circle" class="lucide"></i></div>
          <h2>Sesión Expirada</h2>
          <p>Tu sesión ha expirado. Por favor, inicia sesión de nuevo.</p>
          <button class="btn-primary" onclick="location.reload()">
            <i data-lucide="log-in" class="lucide"></i>
            Iniciar Sesión
          </button>
        `;
        lucide.createIcons();
      }
      
      // Limpiar datos de sesión
      setTimeout(() => {
        localStorage.removeItem('username');
        localStorage.removeItem('userRol');
        window.location.href = '../contenido/index.html';
      }, 2000);
    } else {
      alert('Error al cargar las compras: ' + error.message);
    }
  }
}

// ========================================
// ACTUALIZAR ESTADÍSTICAS
// ========================================
function actualizarEstadisticas(compras) {
  const totalCompras = compras.length;
  const pendientes = compras.filter(c => c.estado === 'PENDIENTE' || c.estado === 'ACEPTADO' || c.estado === 'EN_CAMINO').length;
  const entregadas = compras.filter(c => c.estado === 'ENTREGADO').length;
  
  const totalComprasEl = document.getElementById('totalCompras');
  const comprasPendientesEl = document.getElementById('comprasPendientes');
  const comprasEntregadasEl = document.getElementById('comprasEntregadas');
  
  if (totalComprasEl) totalComprasEl.textContent = totalCompras;
  if (comprasPendientesEl) comprasPendientesEl.textContent = pendientes;
  if (comprasEntregadasEl) comprasEntregadasEl.textContent = entregadas;
}

// ========================================
// APLICAR FILTROS
// ========================================
function aplicarFiltros() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const filtroEstado = document.getElementById('filtro-estado').value;
  
  comprasFiltradas = comprasOriginales.filter(compra => {
    const matchSearch = !searchInput || compra.id.toString().includes(searchInput);
    const matchEstado = !filtroEstado || compra.estado === filtroEstado;
    
    return matchSearch && matchEstado;
  });
  
  renderizarCompras(comprasFiltradas);
}

// ========================================
// LIMPIAR FILTROS
// ========================================
function limpiarFiltros() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filtro-estado').value = '';
  
  comprasFiltradas = [...comprasOriginales];
  renderizarCompras(comprasFiltradas);
}

// ========================================
// RENDERIZAR COMPRAS
// ========================================
function renderizarCompras(compras) {
  const comprasList = document.getElementById('compras-list');
  const emptyState = document.getElementById('empty-state');
  comprasList.innerHTML = '';
  
  if (compras.length === 0 && comprasOriginales.length > 0) {
    // Hay compras pero los filtros no coinciden
    comprasList.innerHTML = `
      <div class="no-results">
        <div class="empty-icon"><i data-lucide="search-x" class="lucide"></i></div>
        <h2>No se encontraron resultados</h2>
        <p>Intenta ajustar los filtros de búsqueda</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  compras.forEach(compra => {
    const card = crearCompraCard(compra);
    comprasList.appendChild(card);
  });
  
  // Inicializar iconos de Lucide
  setTimeout(() => {
    lucide.createIcons();
  }, 0);
}

// ========================================
// CREAR CARD DE COMPRA
// ========================================
function crearCompraCard(compra) {
  console.log('crearCompraCard - compra:', compra);
  console.log('crearCompraCard - compra.id:', compra.id);
  
  const div = document.createElement('div');
  div.className = 'compra-card';
  
  const fecha = new Date(compra.createdAt).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const nombreVendedor = compra.vendedor.nombre && compra.vendedor.apellido
    ? `${compra.vendedor.nombre} ${compra.vendedor.apellido}`
    : compra.vendedor.username;
  
  const estadoClases = {
    'PENDIENTE': 'estado-pendiente',
    'ACEPTADO': 'estado-aceptado',
    'EN_CAMINO': 'estado-en-camino',
    'ENTREGADO': 'estado-entregado',
    'CANCELADO': 'estado-cancelado'
  };
  
  const estadoTextos = {
    'PENDIENTE': 'Pendiente',
    'ACEPTADO': 'Aceptado',
    'EN_CAMINO': 'En Camino',
    'ENTREGADO': 'Entregado',
    'CANCELADO': 'Cancelado'
  };
  
  const estadoIconos = {
    'PENDIENTE': 'clock',
    'ACEPTADO': 'check',
    'EN_CAMINO': 'truck',
    'ENTREGADO': 'package-check',
    'CANCELADO': 'x-circle'
  };
  
  const estadoClase = estadoClases[compra.estado] || 'estado-pendiente';
  const estadoTexto = estadoTextos[compra.estado] || compra.estado;
  const estadoIcono = estadoIconos[compra.estado] || 'help-circle';
  
  const cantidadProductos = compra.items.reduce((total, item) => total + item.cantidad, 0);
  
  div.innerHTML = `
    <div class="compra-header">
      <div class="compra-info">
        <div class="compra-id">
          <i data-lucide="file-text" class="lucide icon-sm"></i>
          <span>Pedido #${compra.id}</span>
        </div>
        <div class="compra-fecha">
          <i data-lucide="calendar" class="lucide icon-sm"></i>
          <span>${fecha}</span>
        </div>
      </div>
      <span class="estado-badge ${estadoClase}">
        <i data-lucide="${estadoIcono}" class="lucide"></i>
        ${estadoTexto}
      </span>
    </div>
    
    <div class="compra-body">
      <div class="compra-detalle">
        <div class="detalle-item">
          <span class="detalle-label">
            <i data-lucide="user" class="lucide icon-sm"></i>
            Vendedor
          </span>
          <span class="detalle-value">${nombreVendedor}</span>
        </div>
        <div class="detalle-item">
          <span class="detalle-label">
            <i data-lucide="package" class="lucide icon-sm"></i>
            Productos
          </span>
          <span class="detalle-value">${cantidadProductos} producto${cantidadProductos !== 1 ? 's' : ''}</span>
        </div>
        <div class="detalle-item">
          <span class="detalle-label">
            <i data-lucide="dollar-sign" class="lucide icon-sm"></i>
            Total
          </span>
          <span class="detalle-value total">Bs. ${parseFloat(compra.total).toFixed(2)}</span>
        </div>
      </div>
      
      <div class="compra-acciones">
        <button class="btn-ver-detalle" onclick="mostrarDetalleCompra(${compra.id})">
          <i data-lucide="eye" class="lucide"></i>
          Ver Detalles
        </button>
      </div>
    </div>
  `;
  
  return div;
}

// ========================================
// MOSTRAR DETALLE DE COMPRA
// ========================================
async function mostrarDetalleCompra(compraId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pedidos/mis-compras/${compraId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar detalle');
    }
    
    const data = await response.json();
    const compra = data.pedido;
    
    const modal = document.getElementById('modal-detalle');
    const modalBody = document.getElementById('modal-body');
    
    const nombreVendedor = compra.vendedor.nombre && compra.vendedor.apellido
      ? `${compra.vendedor.nombre} ${compra.vendedor.apellido}`
      : compra.vendedor.username;
    
    const fecha = new Date(compra.createdAt).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const estadoTextos = {
      'PENDIENTE': 'Pendiente',
      'ACEPTADO': 'Aceptado',
      'EN_CAMINO': 'En Camino',
      'ENTREGADO': 'Entregado',
      'CANCELADO': 'Cancelado'
    };
    
    modalBody.innerHTML = `
      <div class="detalle-section">
        <h3><i data-lucide="file-text" class="lucide"></i> Información del Pedido</h3>
        <div class="detalle-grid">
          <div class="detalle-item">
            <p class="detalle-label">ID del Pedido</p>
            <p class="detalle-value">#${compra.id}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Estado</p>
            <p class="detalle-value">${estadoTextos[compra.estado] || compra.estado}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Fecha</p>
            <p class="detalle-value">${fecha}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Total</p>
            <p class="detalle-value">Bs. ${parseFloat(compra.total).toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div class="detalle-section">
        <h3><i data-lucide="user" class="lucide"></i> Información del Vendedor</h3>
        <div class="detalle-grid">
          <div class="detalle-item">
            <p class="detalle-label">Nombre</p>
            <p class="detalle-value">${nombreVendedor}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Email</p>
            <p class="detalle-value">${compra.vendedor.email}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Usuario</p>
            <p class="detalle-value">@${compra.vendedor.username}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Teléfono</p>
            <p class="detalle-value">${compra.vendedor.telefono || 'No especificado'}</p>
          </div>
        </div>
      </div>
      
      <div class="detalle-section">
        <h3><i data-lucide="package" class="lucide"></i> Productos</h3>
        <table class="productos-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${compra.items.map(item => `
              <tr>
                <td>${item.producto.nombre}</td>
                <td>${item.cantidad}</td>
                <td>Bs. ${parseFloat(item.precio).toFixed(2)}</td>
                <td>Bs. ${parseFloat(item.subtotal).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: 600;">Subtotal:</td>
              <td style="font-weight: 600;">Bs. ${parseFloat(compra.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: 600;">Envío:</td>
              <td style="font-weight: 600;">Bs. ${parseFloat(compra.envio).toFixed(2)}</td>
            </tr>
            <tr style="background: var(--bg-light);">
              <td colspan="3" style="text-align: right; font-weight: 700; font-size: 1.1rem;">Total:</td>
              <td style="font-weight: 700; font-size: 1.1rem; color: var(--primary-color);">Bs. ${parseFloat(compra.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="detalle-section">
        <h3><i data-lucide="paperclip" class="lucide"></i> Comprobante de Pago</h3>
        <div class="comprobante-container">
          ${compra.comprobantePago ? `
            <img src="${API_BASE_URL}${compra.comprobantePago}" alt="Comprobante" class="comprobante-image">
          ` : `
            <p class="no-comprobante">No se ha subido comprobante</p>
          `}
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Reinicializar iconos de Lucide
    lucide.createIcons();
    
  } catch (error) {
    console.error('Error al mostrar detalle:', error);
    alert('Error al cargar el detalle de la compra');
  }
}

// ========================================
// INICIALIZACIÓN
// ========================================
console.log('Registrando DOMContentLoaded...');
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded disparado');
  
  // Asegurar que el modal esté oculto al inicio
  const modal = document.getElementById('modal-detalle');
  if (modal) {
    modal.style.display = 'none';
    console.log('Modal oculto al inicio');
  }
  
  if (!verificarAutenticacion()) {
    console.log('Autenticación falló, deteniendo...');
    return;
  }
  
  console.log('Llamando a cargarCompras()...');
  cargarCompras();
  
  // Búsqueda en tiempo real
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      aplicarFiltros();
    });
  }
  
  // Filtro de estado
  const filtroEstado = document.getElementById('filtro-estado');
  if (filtroEstado) {
    filtroEstado.addEventListener('change', () => {
      console.log('Filtro cambiado a:', filtroEstado.value);
      aplicarFiltros();
    });
  }
  
  // Botón limpiar filtros
  const btnClearFilters = document.getElementById('btnClearFilters');
  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', () => {
      limpiarFiltros();
    });
  }
  
  // Cerrar modal con botón X
  const closeModal = document.getElementById('close-modal');
  if (closeModal && modal) {
    closeModal.addEventListener('click', (e) => {
      console.log('Cerrando modal (botón X)');
      e.stopPropagation();
      modal.style.display = 'none';
      document.body.style.overflow = '';
    });
  }
  
  // Cerrar modal haciendo click fuera
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('Cerrando modal (click fuera)');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }
  
  // Cerrar modal con tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
      console.log('Cerrando modal (ESC)');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
  
  console.log('Inicialización completada');
});
