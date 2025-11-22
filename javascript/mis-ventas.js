// ========================================
// VARIABLES GLOBALES
// ========================================
console.log('🚀 mis-ventas.js cargado');
const API_BASE_URL = 'http://localhost:3000';
let pedidosData = [];
let filtroEstado = '';
console.log('✅ Variables globales inicializadas');

// ========================================
// VERIFICAR AUTENTICACIÓN Y ROL
// ========================================
function verificarAutenticacion() {
  const username = localStorage.getItem('username');
  const userRol = localStorage.getItem('userRol');
  
  console.log('🔐 Verificando autenticación...');
  console.log('   Username:', username);
  console.log('   Rol:', userRol);
  
  if (!username) {
    console.error('❌ Usuario no autenticado');
    alert('Debes iniciar sesión para ver esta sección.');
    window.location.href = '../contenido/principal.html';
    return false;
  }
  
  if (userRol !== 'ADMIN') {
    console.error('❌ Usuario no es ADMIN');
    alert('Acceso no autorizado. Solo administradores pueden ver esta sección.');
    window.location.href = '../contenido/principal.html';
    return false;
  }
  
  console.log('✅ Autenticación verificada correctamente');
  return true;
}

// ========================================
// CARGAR VENTAS
// ========================================
async function cargarVentas() {
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const ventasList = document.getElementById('ventas-list');
  
  if (!loadingState || !emptyState || !ventasList) {
    console.error('❌ No se encontraron elementos del DOM');
    return;
  }
  
  loadingState.style.display = 'block';
  emptyState.style.display = 'none';
  ventasList.style.display = 'none';
  
  try {
    let url = `${API_BASE_URL}/api/pedidos/ventas`;
    if (filtroEstado) {
      url += `?estado=${filtroEstado}`;
    }
    
    console.log('🔄 Cargando ventas desde:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      console.error('❌ Response completo:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Error al cargar ventas: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Data recibida:', data);
    pedidosData = data.pedidos;
    console.log('pedidosData asignado:', pedidosData);
    
    console.log('Pedidos recibidos:', pedidosData.length);
    
    console.log('Ventas cargadas:', pedidosData);
    
    loadingState.style.display = 'none';
    
    if (pedidosData.length === 0) {
      emptyState.style.display = 'block';
    } else {
      ventasList.style.display = 'block';
      renderizarVentas();
    }
    
    // Cargar estadísticas
    await cargarEstadisticas();
    
  } catch (error) {
    console.error('Error al cargar ventas:', error);
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
  }
}

// ========================================
// RENDERIZAR VENTAS
// ========================================
function renderizarVentas() {
  const ventasList = document.getElementById('ventas-list');
  ventasList.innerHTML = '';
  
  pedidosData.forEach(pedido => {
    const ventaCard = crearVentaCard(pedido);
    ventasList.appendChild(ventaCard);
  });
}

// ========================================
// CREAR CARD DE VENTA
// ========================================
function crearVentaCard(pedido) {
  const div = document.createElement('div');
  div.className = 'venta-card';
  
  const nombreCliente = pedido.usuario.nombre && pedido.usuario.apellido
    ? `${pedido.usuario.nombre} ${pedido.usuario.apellido}`
    : pedido.usuario.username;
  
  const fecha = new Date(pedido.createdAt).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const estadoClass = `estado-${pedido.estado.toLowerCase()}`;
  const estadoTexto = {
    'PENDIENTE': 'Pendiente',
    'PROCESANDO': 'Procesando',
    'ENVIADO': 'Enviado',
    'ENTREGADO': 'Entregado',
    'CANCELADO': 'Cancelado'
  }[pedido.estado];
  
  div.innerHTML = `
    <div class="venta-card-header">
      <div class="venta-info">
        <p class="venta-id">Pedido #${pedido.id}</p>
        <h3 class="venta-cliente">${nombreCliente}</h3>
        <p class="venta-fecha">${fecha}</p>
      </div>
      <span class="venta-estado ${estadoClass}">${estadoTexto}</span>
    </div>
    
    <div class="venta-card-body">
      <div class="venta-productos">
        ${pedido.items.slice(0, 3).map(item => `
          <div class="producto-item">
            <span class="producto-cantidad">x${item.cantidad}</span>
            <span>${item.producto.nombre}</span>
          </div>
        `).join('')}
        ${pedido.items.length > 3 ? `<p style="color: var(--text-light); font-size: 0.85rem; margin: 0.5rem 0 0 0;">+${pedido.items.length - 3} productos más</p>` : ''}
      </div>
      
      <div class="venta-total">
        <p class="venta-total-label">Total</p>
        <p class="venta-total-value">Bs. ${parseFloat(pedido.total).toFixed(2)}</p>
      </div>
      
      <div class="venta-actions">
        <button class="btn-ver-detalle" data-pedido-id="${pedido.id}">
          Ver Detalle →
        </button>
        <button class="btn-cambiar-estado" data-pedido-id="${pedido.id}">
          Cambiar Estado
        </button>
      </div>
    </div>
  `;
  
  // Event listeners
  const btnDetalle = div.querySelector('.btn-ver-detalle');
  btnDetalle.addEventListener('click', () => mostrarDetallePedido(pedido.id));
  
  const btnEstado = div.querySelector('.btn-cambiar-estado');
  btnEstado.addEventListener('click', () => cambiarEstadoPedido(pedido.id, pedido.estado));
  
  return div;
}

// ========================================
// MOSTRAR DETALLE DEL PEDIDO
// ========================================
async function mostrarDetallePedido(pedidoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pedidos/ventas/${pedidoId}`, {
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
    const pedido = data.pedido;
    
    const modal = document.getElementById('modal-detalle');
    const modalBody = document.getElementById('modal-body');
    
    const nombreCliente = pedido.usuario.nombre && pedido.usuario.apellido
      ? `${pedido.usuario.nombre} ${pedido.usuario.apellido}`
      : pedido.usuario.username;
    
    const fecha = new Date(pedido.createdAt).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    modalBody.innerHTML = `
      <div class="detalle-section">
        <h3>📋 Información del Pedido</h3>
        <div class="detalle-grid">
          <div class="detalle-item">
            <p class="detalle-label">ID del Pedido</p>
            <p class="detalle-value">#${pedido.id}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Estado</p>
            <p class="detalle-value">${pedido.estado}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Fecha</p>
            <p class="detalle-value">${fecha}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Total</p>
            <p class="detalle-value">Bs. ${parseFloat(pedido.total).toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div class="detalle-section">
        <h3>👤 Información del Cliente</h3>
        <div class="detalle-grid">
          <div class="detalle-item">
            <p class="detalle-label">Nombre</p>
            <p class="detalle-value">${nombreCliente}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Email</p>
            <p class="detalle-value">${pedido.usuario.email}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Usuario</p>
            <p class="detalle-value">@${pedido.usuario.username}</p>
          </div>
          <div class="detalle-item">
            <p class="detalle-label">Teléfono</p>
            <p class="detalle-value">${pedido.usuario.telefono || 'No especificado'}</p>
          </div>
        </div>
      </div>
      
      <div class="detalle-section">
        <h3>🛍️ Productos</h3>
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
            ${pedido.items.map(item => `
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
              <td style="font-weight: 600;">Bs. ${parseFloat(pedido.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: 600;">Envío:</td>
              <td style="font-weight: 600;">Bs. ${parseFloat(pedido.envio).toFixed(2)}</td>
            </tr>
            <tr style="background: var(--bg-light);">
              <td colspan="3" style="text-align: right; font-weight: 700; font-size: 1.1rem;">Total:</td>
              <td style="font-weight: 700; font-size: 1.1rem; color: var(--primary-color);">Bs. ${parseFloat(pedido.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="detalle-section">
        <h3>📎 Comprobante de Pago</h3>
        <div class="comprobante-container">
          ${pedido.comprobantePago ? `
            <img src="${API_BASE_URL}${pedido.comprobantePago}" alt="Comprobante" class="comprobante-image">
          ` : `
            <p class="no-comprobante">No se ha subido comprobante</p>
          `}
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    
  } catch (error) {
    console.error('Error al mostrar detalle:', error);
    alert('Error al cargar el detalle del pedido');
  }
}

// ========================================
// CAMBIAR ESTADO DEL PEDIDO
// ========================================
function cambiarEstadoPedido(pedidoId, estadoActual) {
  const estados = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'PROCESANDO', label: 'Procesando' },
    { value: 'ENVIADO', label: 'Enviado' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'CANCELADO', label: 'Cancelado' }
  ];
  
  const opciones = estados
    .filter(e => e.value !== estadoActual)
    .map((e, i) => `${i + 1}. ${e.label}`)
    .join('\n');
  
  const seleccion = prompt(`Estado actual: ${estadoActual}\n\nSelecciona el nuevo estado:\n${opciones}\n\nIngresa el número:`);
  
  if (!seleccion) return;
  
  const indice = parseInt(seleccion) - 1;
  const estadosFiltrados = estados.filter(e => e.value !== estadoActual);
  
  if (indice < 0 || indice >= estadosFiltrados.length) {
    alert('Selección inválida');
    return;
  }
  
  const nuevoEstado = estadosFiltrados[indice].value;
  
  confirmarCambioEstado(pedidoId, nuevoEstado);
}

async function confirmarCambioEstado(pedidoId, nuevoEstado) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pedidos/ventas/${pedidoId}/estado`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    
    if (!response.ok) {
      throw new Error('Error al cambiar estado');
    }
    
    alert('Estado actualizado correctamente');
    cargarVentas();
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cambiar el estado');
  }
}

// ========================================
// CARGAR ESTADÍSTICAS
// ========================================
async function cargarEstadisticas() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pedidos/estadisticas`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const stats = await response.json();
      document.getElementById('total-pedidos').textContent = stats.totalPedidos;
      document.getElementById('total-pendientes').textContent = stats.pendientes;
      document.getElementById('total-completados').textContent = stats.completados;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// ========================================
// INICIALIZACIÓN
// ========================================
console.log('📌 Registrando DOMContentLoaded...');
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOMContentLoaded disparado');
  
  // Asegurar que el modal esté oculto al inicio
  const modal = document.getElementById('modal-detalle');
  if (modal) {
    modal.style.display = 'none';
    console.log('✅ Modal oculto al inicio');
  }
  
  if (!verificarAutenticacion()) {
    console.log('❌ Autenticación falló, deteniendo...');
    return;
  }
  
  console.log('🔄 Llamando a cargarVentas()...');
  cargarVentas();
  
  // Filtro de estado
  const filterEstado = document.getElementById('filter-estado');
  if (filterEstado) {
    filterEstado.addEventListener('change', (e) => {
      filtroEstado = e.target.value;
      cargarVentas();
    });
  }
  
  // Botón refresh
  const btnRefresh = document.getElementById('btn-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', cargarVentas);
  }
  
  // Cerrar modal
  const closeModal = document.getElementById('close-modal');
  if (closeModal && modal) {
    closeModal.addEventListener('click', (e) => {
      console.log('🔴 Cerrando modal (botón X)');
      e.stopPropagation();
      modal.style.display = 'none';
      document.body.style.overflow = ''; // Restaurar scroll
    });
  }
  
  // Cerrar modal al hacer click fuera
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('🔴 Cerrando modal (click fuera)');
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll
      }
    });
  }
  
  // Prevenir que clicks dentro del modal lo cierren
  const modalContainer = document.querySelector('.modal-container');
  if (modalContainer) {
    modalContainer.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  // Cerrar modal con tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
      console.log('🔴 Cerrando modal (ESC)');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
});
