// ========================================
// VARIABLES GLOBALES
// ========================================
let carritoData = null;
const API_BASE_URL = 'http://localhost:3000';

// ========================================
// COMPROBANTE DE PAGO
// ========================================
let comprobanteFile = null;

function inicializarComprobante() {
  const comprobanteInput = document.getElementById('comprobante-input');
  const comprobantePreview = document.getElementById('comprobante-preview');
  const comprobanteImg = document.getElementById('comprobante-img');
  const btnRemove = document.getElementById('btn-remove-comprobante');
  const comprobanteLabel = document.getElementById('comprobante-label');
  
  if (!comprobanteInput) return;
  
  // Manejar selección de archivo
  comprobanteInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      mostrarNotificacion('Por favor selecciona una imagen válida', 'error');
      return;
    }
    
    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      mostrarNotificacion('La imagen no debe superar 5MB', 'error');
      return;
    }
    
    comprobanteFile = file;
    
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      comprobanteImg.src = e.target.result;
      comprobantePreview.style.display = 'inline-block';
      comprobanteLabel.textContent = 'Cambiar Comprobante';
    };
    reader.readAsDataURL(file);
  });
  
  // Eliminar comprobante
  if (btnRemove) {
    btnRemove.addEventListener('click', () => {
      comprobanteFile = null;
      comprobanteInput.value = '';
      comprobantePreview.style.display = 'none';
      comprobanteLabel.textContent = 'Seleccionar Comprobante';
    });
  }
}

function mostrarSeccionComprobante() {
  const comprobanteSection = document.getElementById('comprobante-section');
  if (comprobanteSection) {
    comprobanteSection.style.display = 'block';
  }
}

// ========================================
// PROCEDER AL PAGO
// ========================================
async function procederAlPago() {
  // Validar que haya comprobante
  if (!comprobanteFile) {
    mostrarNotificacion('Por favor sube tu comprobante de pago', 'error');
    return;
  }
  
  // Validar que haya items
  if (!carritoData || !carritoData.items || carritoData.items.length === 0) {
    mostrarNotificacion('El carrito está vacío', 'error');
    return;
  }
  
  const btnCheckout = document.getElementById('btn-checkout');
  btnCheckout.disabled = true;
  btnCheckout.innerHTML = '<span class="btn-loader"></span> Procesando...';
  
  try {
    // Crear FormData
    const formData = new FormData();
    formData.append('comprobante', comprobanteFile);
    
    // Obtener vendedor del primer producto
    const vendedorId = carritoData.items[0].producto.vendedorId;
    formData.append('vendedorId', vendedorId);
    
    // Calcular totales
    const subtotal = carritoData.items.reduce((sum, item) => 
      sum + (parseFloat(item.precio) * item.cantidad), 0
    );
    const envio = 5.00;
    const total = subtotal + envio;
    
    formData.append('subtotal', subtotal.toFixed(2));
    formData.append('envio', envio.toFixed(2));
    formData.append('total', total.toFixed(2));
    
    // Enviar pedido
    const response = await fetch(`${API_BASE_URL}/api/pedidos/crear`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear el pedido');
    }
    
    const data = await response.json();
    
    mostrarNotificacion('¡Pedido realizado exitosamente! 🎉', 'success');
    
    // Esperar 2 segundos y redirigir
    setTimeout(() => {
      window.location.href = '../contenido/index.html';
    }, 2000);
    
  } catch (error) {
    console.error('Error al proceder al pago:', error);
    mostrarNotificacion(error.message || 'Error al procesar el pago', 'error');
    btnCheckout.disabled = false;
    btnCheckout.innerHTML = '<span class="btn-icon">💳</span> Proceder al Pago';
  }
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacion();
  cargarCarrito();
  inicializarEventos();
  inicializarComprobante();
  
  // Event listener para proceder al pago
  const btnCheckout = document.getElementById('btn-checkout');
  if (btnCheckout) {
    btnCheckout.addEventListener('click', procederAlPago);
  }
});

// ========================================
// VERIFICAR AUTENTICACIÓN
// ========================================
function verificarAutenticacion() {
  const username = localStorage.getItem('username');
  const userRol = localStorage.getItem('userRol');
  
  if (!username) {
    alert('Debes iniciar sesión para ver tu carrito');
    window.location.href = '../contenido/index.html';
    return false;
  }
  
  // Verificar que NO sea ADMIN
  if (userRol === 'ADMIN') {
    alert('Los administradores no tienen carrito de compras');
    window.location.href = '../contenido/index.html';
    return false;
  }
  
  return true;
}

// ========================================
// CARGAR CARRITO DESDE API
// ========================================
async function cargarCarrito() {
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const cartContent = document.getElementById('cart-content');
  
  loadingState.style.display = 'block';
  emptyState.style.display = 'none';
  cartContent.style.display = 'none';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/carrito`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar el carrito');
    }
    
    const data = await response.json();
    carritoData = data;
    
    console.log('Carrito cargado:', carritoData);
    
    loadingState.style.display = 'none';
    
    if (!carritoData.items || carritoData.items.length === 0) {
      emptyState.style.display = 'block';
    } else {
      cartContent.style.display = 'block';
      renderizarCarrito();
      actualizarResumen();
    }
    
  } catch (error) {
    console.error('Error al cargar carrito:', error);
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
    alert('Error al cargar el carrito. Por favor, intenta de nuevo.');
  }
}

// ========================================
// RENDERIZAR ITEMS DEL CARRITO
// ========================================
function renderizarCarrito() {
  const cartItems = document.getElementById('cart-items');
  
  if (!cartItems || !carritoData.items) return;
  
  cartItems.innerHTML = '';
  
  carritoData.items.forEach(item => {
    const itemElement = crearItemElement(item);
    cartItems.appendChild(itemElement);
  });
  
  // Obtener QR del vendedor
  obtenerQrVendedor();
}

// ========================================
// CREAR ELEMENTO DE ITEM
// ========================================
function crearItemElement(item) {
  const div = document.createElement('div');
  div.className = 'cart-item';
  div.dataset.itemId = item.id;
  
  const imagenUrl = item.producto.imagen 
    ? `${API_BASE_URL}${item.producto.imagen}` 
    : 'https://i.imgur.com/vkSbQzW.png';
  
  const subtotal = (parseFloat(item.precio) * item.cantidad).toFixed(2);
  
  div.innerHTML = `
    <div class="cart-item-image">
      <img src="${imagenUrl}" alt="${item.producto.nombre}" onerror="this.src='https://i.imgur.com/vkSbQzW.png'">
    </div>
    
    <div class="cart-item-info">
      <h3 class="cart-item-name">${item.producto.nombre}</h3>
      <p class="cart-item-price">Bs. ${parseFloat(item.precio).toFixed(2)} c/u</p>
      
      <div class="cart-item-controls">
        <div class="quantity-controls">
          <button class="qty-btn qty-minus" data-item-id="${item.id}">−</button>
          <span class="qty-value">${item.cantidad}</span>
          <button class="qty-btn qty-plus" data-item-id="${item.id}">+</button>
        </div>
        
        <button class="btn-remove-item" data-item-id="${item.id}">
          🗑️ Eliminar
        </button>
      </div>
    </div>
    
    <div class="cart-item-subtotal">
      <span class="item-subtotal-label">Subtotal</span>
      <span class="item-subtotal-value">Bs. ${subtotal}</span>
    </div>
  `;
  
  return div;
}

// ========================================
// ACTUALIZAR RESUMEN DEL PEDIDO
// ========================================
function actualizarResumen() {
  const subtotalElement = document.getElementById('subtotal');
  const envioElement = document.getElementById('envio');
  const totalElement = document.getElementById('total');
  
  if (!carritoData) return;
  
  const subtotal = parseFloat(carritoData.total || 0);
  const envio = 5.00;
  const total = subtotal + envio;
  
  subtotalElement.textContent = `Bs. ${subtotal.toFixed(2)}`;
  envioElement.textContent = `Bs. ${envio.toFixed(2)}`;
  totalElement.textContent = `Bs. ${total.toFixed(2)}`;
  
  // Actualizar badge del header
  const cartCount = document.getElementById('cartCount');
  if (cartCount && carritoData.items) {
    const totalItems = carritoData.items.reduce((sum, item) => sum + item.cantidad, 0);
    cartCount.textContent = totalItems;
  }
}

// ========================================
// INICIALIZAR EVENTOS
// ========================================
function inicializarEventos() {
  // Botón vaciar carrito
  const btnClearCart = document.getElementById('btn-clear-cart');
  if (btnClearCart) {
    btnClearCart.addEventListener('click', vaciarCarrito);
  }
  
  // Botón seguir comprando
  const btnContinue = document.getElementById('btn-continue-shopping');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      window.location.href = '../contenido/productos.html';
    });
  }
  
  // Delegación de eventos para botones de cantidad y eliminar
  const cartItems = document.getElementById('cart-items');
  if (cartItems) {
    cartItems.addEventListener('click', handleCartItemClick);
  }
}

// ========================================
// MANEJAR CLICKS EN ITEMS DEL CARRITO
// ========================================
async function handleCartItemClick(e) {
  const target = e.target;
  
  // Botón aumentar cantidad
  if (target.classList.contains('qty-plus')) {
    const itemId = target.dataset.itemId;
    await cambiarCantidad(itemId, 1);
  }
  
  // Botón disminuir cantidad
  if (target.classList.contains('qty-minus')) {
    const itemId = target.dataset.itemId;
    await cambiarCantidad(itemId, -1);
  }
  
  // Botón eliminar item
  if (target.classList.contains('btn-remove-item') || target.closest('.btn-remove-item')) {
    const button = target.classList.contains('btn-remove-item') ? target : target.closest('.btn-remove-item');
    const itemId = button.dataset.itemId;
    await eliminarItem(itemId);
  }
}

// ========================================
// CAMBIAR CANTIDAD DE UN ITEM
// ========================================
async function cambiarCantidad(itemId, cambio) {
  try {
    // Encontrar el item actual
    const item = carritoData.items.find(i => i.id == itemId);
    if (!item) return;
    
    const nuevaCantidad = item.cantidad + cambio;
    
    // No permitir cantidad menor a 1
    if (nuevaCantidad < 1) {
      if (confirm('¿Deseas eliminar este producto del carrito?')) {
        await eliminarItem(itemId);
      }
      return;
    }
    
    // Actualizar en el backend
    const response = await fetch(`${API_BASE_URL}/api/carrito/item/${itemId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cantidad: nuevaCantidad })
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar cantidad');
    }
    
    // Recargar carrito
    await cargarCarrito();
    
    mostrarNotificacion('Cantidad actualizada', 'success');
    
  } catch (error) {
    console.error('Error al cambiar cantidad:', error);
    mostrarNotificacion('Error al actualizar cantidad', 'error');
  }
}

// ========================================
// ELIMINAR ITEM DEL CARRITO
// ========================================
async function eliminarItem(itemId) {
  if (!confirm('¿Estás seguro de eliminar este producto del carrito?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/carrito/item/${itemId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar item');
    }
    
    // Recargar carrito
    await cargarCarrito();
    
    mostrarNotificacion('Producto eliminado del carrito', 'success');
    
  } catch (error) {
    console.error('Error al eliminar item:', error);
    mostrarNotificacion('Error al eliminar producto', 'error');
  }
}

// ========================================
// VACIAR CARRITO COMPLETO
// ========================================
async function vaciarCarrito() {
  if (!confirm('¿Estás seguro de vaciar todo el carrito?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/carrito`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al vaciar carrito');
    }
    
    // Recargar carrito
    await cargarCarrito();
    
    mostrarNotificacion('Carrito vaciado', 'success');
    
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    mostrarNotificacion('Error al vaciar carrito', 'error');
  }
}

// ========================================
// OBTENER QR DEL VENDEDOR
// ========================================
async function obtenerQrVendedor() {
  if (!carritoData || !carritoData.items || carritoData.items.length === 0) return;
  
  // Obtener ID del vendedor del primer producto (asumiendo que todos son del mismo vendedor)
  const vendedorId = carritoData.items[0].producto.vendedorId;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${vendedorId}/qr`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.qrPago) {
        mostrarQrPago(data.qrPago);
      }
    }
  } catch (error) {
    console.error('Error al obtener QR del vendedor:', error);
  }
}

// ========================================
// MOSTRAR QR DE PAGO
// ========================================
function mostrarQrPago(qrUrl) {
  const summaryCard = document.querySelector('.summary-card');
  
  if (!summaryCard) return;
  
  // Verificar si ya existe el QR
  let qrSection = document.getElementById('qr-pago-section');
  
  if (!qrSection) {
    qrSection = document.createElement('div');
    qrSection.id = 'qr-pago-section';
    qrSection.className = 'qr-pago-section';
    qrSection.innerHTML = `
      <div class="qr-header">
        <span class="qr-icon">📱</span>
        <h3>Escanea para Pagar</h3>
      </div>
      <div class="qr-image-container">
        <img src="${API_BASE_URL}${qrUrl}" alt="QR de Pago" class="qr-image">
      </div>
      <p class="qr-instructions">
        Escanea este código QR con tu aplicación de banca móvil para completar el pago
      </p>
    `;
    
    // Insertar antes de la sección de comprobante
    const comprobanteSection = document.getElementById('comprobante-section');
    summaryCard.insertBefore(qrSection, comprobanteSection);
  }
  
  // Mostrar sección de comprobante
  mostrarSeccionComprobante();
}

// ========================================
// MOSTRAR NOTIFICACIÓN
// ========================================
function mostrarNotificacion(mensaje, tipo = 'success') {
  const notif = document.createElement('div');
  notif.className = 'notificacion-toast';
  
  const colores = {
    success: 'linear-gradient(135deg, #00b894, #00cec9)',
    error: 'linear-gradient(135deg, #d63031, #ff7675)',
    info: 'linear-gradient(135deg, #0984e3, #74b9ff)'
  };
  
  notif.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${colores[tipo]};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 9999;
    font-weight: 600;
    animation: slideIn 0.3s ease;
  `;
  notif.textContent = mensaje;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// Agregar animaciones CSS
if (!document.getElementById('toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
