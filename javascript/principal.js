// ========================================
// CARGAR PRODUCTOS DESTACADOS EN PÁGINA PRINCIPAL
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  cargarProductosDestacados();
  // El contador del carrito se actualiza automáticamente desde auth-modal.js
});

// ========================================
// CARGAR PRODUCTOS DESTACADOS DESDE API
// ========================================
async function cargarProductosDestacados() {
  const loadingState = document.getElementById('productos-loading');
  const gridDestacados = document.getElementById('productos-grid-destacados');
  const emptyState = document.getElementById('productos-empty');
  
  try {
    // Cargar productos desde API
    const response = await fetch('http://localhost:3000/api/productos?page=1&limit=100');
    
    if (!response.ok) {
      throw new Error('Error al cargar productos');
    }
    
    const data = await response.json();
    const productos = data.productos || [];
    
    // Filtrar solo productos destacados y tomar máximo 3
    const productosDestacados = productos
      .filter(p => p.destacado === true)
      .slice(0, 3);
    
    console.log('Productos destacados encontrados:', productosDestacados.length);
    
    // Ocultar loading
    loadingState.style.display = 'none';
    
    if (productosDestacados.length === 0) {
      // Mostrar empty state
      emptyState.style.display = 'block';
    } else {
      // Renderizar productos
      gridDestacados.style.display = 'grid';
      renderizarProductosDestacados(productosDestacados);
    }
    
  } catch (error) {
    console.error('Error al cargar productos destacados:', error);
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
  }
}

// ========================================
// RENDERIZAR PRODUCTOS DESTACADOS
// ========================================
function renderizarProductosDestacados(productos) {
  const grid = document.getElementById('productos-grid-destacados');
  
  if (!grid) {
    console.error('No se encontró el grid de productos destacados');
    return;
  }
  
  grid.innerHTML = '';
  
  productos.forEach((producto, index) => {
    const card = crearProductoDestacadoCard(producto, index);
    grid.appendChild(card);
  });
  
  // Inicializar botones de agregar
  inicializarBotonesAgregar();
}

// ========================================
// CREAR CARD DE PRODUCTO DESTACADO
// ========================================
function crearProductoDestacadoCard(producto, index) {
  const article = document.createElement('article');
  article.className = 'producto';
  article.setAttribute('data-aos', 'zoom-in');
  if (index > 0) {
    article.setAttribute('data-aos-delay', index * 100);
  }
  
  const imagenUrl = producto.imagen 
    ? `http://localhost:3000${producto.imagen}` 
    : '../imgs/papas1.jpg';
  
  // Verificar si el usuario es ADMIN
  const userRol = localStorage.getItem('userRol');
  const isAdmin = userRol === 'ADMIN';
  
  // Botón de acción según el rol
  let botonAccion = '';
  if (isAdmin) {
    // Para ADMIN: mostrar solo texto informativo
    botonAccion = '<span class="producto-vendedor-principal">Disponible para clientes</span>';
  } else {
    // Para CLIENTE: mostrar botón de agregar
    botonAccion = `<button class="btn-producto" data-producto-id="${producto.id}" data-producto="${producto.nombre}" data-precio="${producto.precio}">
      Agregar al carrito
    </button>`;
  }
  
  article.innerHTML = `
    <div class="producto-imagen">
      <img src="${imagenUrl}" alt="${producto.nombre}" loading="lazy" onerror="this.src='../imgs/papas1.jpg'">
      <span class="producto-badge">🔥 Destacado</span>
    </div>
    <div class="producto-info">
      <h3 class="producto-titulo">${producto.nombre}</h3>
      <p class="producto-precio">Bs. ${parseFloat(producto.precio).toFixed(2)}</p>
      ${producto.calorias || producto.grasas || producto.carbohidratos ? `
        <div class="producto-nutri">
          ${producto.calorias ? `<span>🔥 ${producto.calorias} kcal</span>` : ''}
          ${producto.grasas ? `<span>🥑 ${producto.grasas}g grasas</span>` : ''}
          ${producto.carbohidratos ? `<span>🍞 ${producto.carbohidratos}g carbs</span>` : ''}
        </div>
      ` : ''}
      ${botonAccion}
    </div>
  `;
  
  return article;
}

// ========================================
// INICIALIZAR BOTONES AGREGAR
// ========================================
function inicializarBotonesAgregar() {
  const botonesAgregar = document.querySelectorAll('#productos-grid-destacados .btn-producto');
  
  botonesAgregar.forEach(boton => {
    boton.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Deshabilitar botón temporalmente
      boton.disabled = true;
      const textoOriginal = boton.textContent;
      boton.textContent = 'Agregando...';
      
      const productoId = boton.dataset.productoId;
      const nombre = boton.dataset.producto;
      const cantidad = 1;
      
      try {
        // Enviar a backend
        const response = await fetch("http://localhost:3000/api/carrito/agregar", {
          method: "POST",
          credentials: 'include',
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ 
            productoId: parseInt(productoId),
            cantidad: cantidad
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al agregar al carrito');
        }
        
        // Actualizar contador del carrito
        actualizarContadorCarrito();
        
        mostrarNotificacion(`${nombre} agregado al carrito ✅`);
        
      } catch (error) {
        console.error("Error al agregar al carrito:", error);
        
        // Verificar si es error de autenticación
        if (error.message.includes('autenticación') || error.message.includes('sesión')) {
          alert('Debes iniciar sesión para agregar productos al carrito');
        } else {
          mostrarNotificacion(`Error: ${error.message}`, 'error');
        }
      } finally {
        // Rehabilitar botón
        boton.disabled = false;
        boton.textContent = textoOriginal;
      }
    });
  });
}

// ========================================
// AGREGAR AL CARRITO
// ========================================
function agregarAlCarrito(producto) {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  const existe = carrito.find(p => p.nombre === producto.nombre);
  
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push(producto);
  }
  
  localStorage.setItem('carrito', JSON.stringify(carrito));
  // La función actualizarContadorCarrito() está definida en auth-modal.js (global)
  if (typeof actualizarContadorCarrito === 'function') {
    actualizarContadorCarrito();
  }
}

// ========================================
// MOSTRAR NOTIFICACIÓN
// ========================================
function mostrarNotificacion(mensaje) {
  // Crear elemento de notificación
  const notif = document.createElement('div');
  notif.className = 'notificacion-toast';
  notif.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #00b894, #00cec9);
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
  
  // Remover después de 3 segundos
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}
