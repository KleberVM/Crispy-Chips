// ========================================
// VARIABLES GLOBALES
// ========================================
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let productosData = []; // Almacenar productos cargados de la API
const carritoModal = document.getElementById('carritoModal');
const cartBtn = document.getElementById('cartBtn');
const modalClose = document.getElementById('modalClose');
const modalOverlay = document.getElementById('modalOverlay');
const cartCount = document.getElementById('cartCount');
const searchInput = document.getElementById('searchInput');

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  // El contador del carrito se actualiza automáticamente desde auth-modal.js
  renderizarCarrito();
  await cargarProductos(); // Cargar productos desde API
  inicializarFiltros();
  inicializarBusqueda();
  // La búsqueda desde URL se aplica automáticamente en cargarProductos()
});

// ========================================
// MODAL DEL CARRITO
// ========================================
cartBtn?.addEventListener('click', () => {
  carritoModal.classList.add('active');
  document.body.style.overflow = 'hidden';
});

modalClose?.addEventListener('click', cerrarModal);
modalOverlay?.addEventListener('click', cerrarModal);

function cerrarModal() {
  carritoModal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// ========================================
// CARGAR PRODUCTOS DESDE API
// ========================================
async function cargarProductos() {
  try {
    const response = await fetch('http://localhost:3000/api/productos?page=1&limit=50');
    
    if (!response.ok) {
      throw new Error('Error al cargar productos');
    }
    
    const data = await response.json();
    productosData = data.productos || [];
    
    renderizarProductos(productosData);
    
    // Aplicar búsqueda desde URL si existe (DESPUÉS de renderizar)
    setTimeout(() => {
      aplicarBusquedaDesdeURL();
    }, 100);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    mostrarError('No se pudieron cargar los productos. Intenta recargar la página.');
  }
}

// ========================================
// RENDERIZAR PRODUCTOS
// ========================================
function renderizarProductos(productos) {
  const productosGrid = document.querySelector('.productos-grid');
  
  if (!productosGrid) {
    console.error('No se encontró .productos-grid');
    return;
  }
  
  if (productos.length === 0) {
    productosGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <h3>No hay productos disponibles</h3>
        <p>Pronto agregaremos nuevos productos. ¡Vuelve pronto!</p>
      </div>
    `;
    return;
  }
  
  productosGrid.innerHTML = '';
  
  productos.forEach(producto => {
    const card = crearCardProducto(producto);
    productosGrid.appendChild(card);
  });
  
  // Reinicializar botones de agregar
  inicializarBotonesAgregar();
}

// ========================================
// CREAR CARD DE PRODUCTO
// ========================================
function crearCardProducto(producto) {
  const article = document.createElement('article');
  article.className = 'producto-card';
  article.dataset.category = producto.categoria?.nombre?.toLowerCase() || 'otros';
  
  const imagenUrl = producto.imagen 
    ? `http://localhost:3000${producto.imagen}` 
    : 'https://i.imgur.com/vkSbQzW.png';
  
  // Verificar si el usuario es ADMIN
  const userRol = localStorage.getItem('userRol');
  const isAdmin = userRol === 'ADMIN';
  
  // Botón de acción según el rol
  let botonAccion = '';
  if (isAdmin) {
    // Para ADMIN: mostrar solo el precio, sin botón de agregar
    botonAccion = '<span class="producto-vendedor">Disponible para clientes</span>';
  } else {
    // Para CLIENTE: mostrar botón de agregar al carrito
    botonAccion = `<button class="btn-agregar" data-producto-id="${producto.id}" data-producto="${producto.nombre}" data-precio="${producto.precio}">
      Agregar
    </button>`;
  }
  
  article.innerHTML = `
    ${producto.destacado ? '<div class="producto-badge hot">Popular</div>' : ''}
    <div class="producto-imagen">
      <img src="${imagenUrl}" alt="${producto.nombre}" loading="lazy" onerror="this.src='https://i.imgur.com/vkSbQzW.png'">
    </div>
    <div class="producto-info">
      <h3 class="producto-titulo">${producto.nombre}</h3>
      <p class="producto-peso">(${producto.peso || '100g'})</p>
      <p class="producto-desc">${producto.descripcion || 'Delicioso snack crujiente'}</p>
      ${producto.calorias || producto.grasas || producto.carbohidratos || producto.proteinas ? `
        <div class="producto-nutri">
          ${producto.calorias ? `<span>${producto.calorias} kcal</span>` : ''}
          ${producto.grasas ? `<span>${producto.grasas}g grasas</span>` : ''}
          ${producto.carbohidratos ? `<span>${producto.carbohidratos}g carbs</span>` : ''}
          ${producto.proteinas ? `<span>${producto.proteinas}g proteínas</span>` : ''}
        </div>
      ` : ''}
      <div class="producto-footer">
        <span class="producto-precio">Bs. ${parseFloat(producto.precio).toFixed(2)}</span>
        ${botonAccion}
      </div>
    </div>
  `;
  
  return article;
}

// ========================================
// MOSTRAR ERROR
// ========================================
function mostrarError(mensaje) {
  const productosSection = document.getElementById('productos-section');
  if (productosSection) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 2rem; background: #fee; color: #c33; border-radius: 8px; margin: 2rem 0;';
    errorDiv.innerHTML = `<p><strong>⚠️ ${mensaje}</strong></p>`;
    productosSection.prepend(errorDiv);
  }
}

// ========================================
// FILTROS
// ========================================
function inicializarFiltros() {
  const filtros = document.querySelectorAll('.filtro-btn');
  const productos = document.querySelectorAll('.producto-card');

  filtros.forEach(filtro => {
    filtro.addEventListener('click', () => {
      // Actualizar botón activo
      filtros.forEach(f => f.classList.remove('active'));
      filtro.classList.add('active');

      const categoriaSeleccionada = filtro.dataset.filter;

      // Filtrar productos
      productos.forEach(producto => {
        const categoria = producto.dataset.category;
        
        if (categoriaSeleccionada === 'all' || categoria === categoriaSeleccionada) {
          producto.style.display = 'block';
          producto.style.animation = 'fadeIn 0.5s ease';
        } else {
          producto.style.display = 'none';
        }
      });
    });
  });
}

// ========================================
// BÚSQUEDA
// ========================================
function inicializarBusqueda() {
  searchInput?.addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    const productos = document.querySelectorAll('.producto-card');

    productos.forEach(producto => {
      const titulo = producto.querySelector('.producto-titulo').textContent.toLowerCase();
      const descripcion = producto.querySelector('.producto-desc').textContent.toLowerCase();

      if (titulo.includes(termino) || descripcion.includes(termino)) {
        producto.style.display = 'block';
      } else {
        producto.style.display = 'none';
      }
    });
  });
}

// ========================================
// AGREGAR AL CARRITO
// ========================================
function inicializarBotonesAgregar() {
  const botonesAgregar = document.querySelectorAll('.btn-agregar:not(:disabled)');

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
        
        // Verificar si el usuario no está logueado
        const username = localStorage.getItem('username');
        
        if (!username) {
          // Usuario no logueado - mostrar mensaje amigable
          mostrarModalLogin('⚠️ Para agregar productos al carrito primero debes iniciar sesión');
        } else if (error.message.includes('autenticación') || error.message.includes('sesión')) {
          // Sesión expirada
          mostrarModalLogin('❌ Tu sesión ha expirado. Inicia sesión nuevamente');
        } else {
          // Otro tipo de error
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

function agregarAlCarrito(producto) {
  const existe = carrito.find(p => p.nombre === producto.nombre);
  
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push(producto);
  }

  guardarCarrito();
  renderizarCarrito();
  actualizarContadorCarrito();
}

// ========================================
// RENDERIZAR CARRITO
// ========================================
function renderizarCarrito() {
  const carritoVacio = document.getElementById('carrito-vacio');
  const carritoLleno = document.getElementById('carrito-lleno');
  const carritoItems = document.getElementById('carrito-items');
  const carritoSubtotal = document.getElementById('carrito-subtotal');
  const carritoTotal = document.getElementById('carrito-total');

  if (carrito.length === 0) {
    carritoVacio?.classList.remove('oculto');
    carritoLleno?.classList.add('oculto');
    return;
  }

  carritoVacio?.classList.add('oculto');
  carritoLleno?.classList.remove('oculto');

  // Limpiar items
  carritoItems.innerHTML = '';

  let subtotal = 0;

  carrito.forEach((producto, index) => {
    const itemSubtotal = producto.precio * producto.cantidad;
    subtotal += itemSubtotal;

    const itemHTML = `
      <div class="carrito-item">
        <img src="${producto.imagen}" alt="${producto.nombre}" class="item-img">
        <div class="item-info">
          <div class="item-titulo">${producto.nombre}</div>
          <div class="item-precio">Bs. ${producto.precio.toFixed(2)}</div>
          <div class="item-cantidad">
            <button class="qty-btn" onclick="cambiarCantidad(${index}, -1)">-</button>
            <span>${producto.cantidad}</span>
            <button class="qty-btn" onclick="cambiarCantidad(${index}, 1)">+</button>
          </div>
        </div>
        <button class="item-remove" onclick="eliminarDelCarrito(${index})">🗑️</button>
      </div>
    `;

    carritoItems.insertAdjacentHTML('beforeend', itemHTML);
  });

  const envio = 5.00;
  const total = subtotal + envio;

  carritoSubtotal.textContent = `Bs. ${subtotal.toFixed(2)}`;
  carritoTotal.textContent = `Bs. ${total.toFixed(2)}`;
}

// ========================================
// MODIFICAR CARRITO
// ========================================
window.cambiarCantidad = (index, cambio) => {
  carrito[index].cantidad += cambio;

  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }

  guardarCarrito();
  renderizarCarrito();
  actualizarContadorCarrito();
};

window.eliminarDelCarrito = (index) => {
  const producto = carrito[index];
  mostrarNotificacion(`${producto.nombre} eliminado del carrito`);
  
  carrito.splice(index, 1);
  guardarCarrito();
  renderizarCarrito();
  actualizarContadorCarrito();
};

// ========================================
// FINALIZAR COMPRA
// ========================================
const btnComprar = document.getElementById('btnComprar');
const mensajeCompra = document.getElementById('mensaje-compra');

btnComprar?.addEventListener('click', () => {
  const usuario = localStorage.getItem("username");
  const totalTexto = document.getElementById('carrito-total')?.textContent || "Bs. 5.00";
  const total = parseFloat(totalTexto.replace("Bs. ", ""));

  if (!usuario) {
    mostrarNotificacion("⚠️ Debes iniciar sesión antes de finalizar la compra", "error");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 2000);
    return;
  }

  if (carrito.length === 0) {
    mostrarNotificacion("⚠️ Tu carrito está vacío", "error");
    return;
  }

  // Mostrar mensaje de éxito
  mensajeCompra.classList.remove('oculto');
  btnComprar.disabled = true;

  // Vaciar carrito después de 2 segundos
  setTimeout(() => {
    carrito = [];
    guardarCarrito();
    renderizarCarrito();
    actualizarContadorCarrito();
    mensajeCompra.classList.add('oculto');
    btnComprar.disabled = false;
    cerrarModal();
  }, 3000);
});

// ========================================
// HELPERS
// ========================================
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

// La función actualizarContadorCarrito() está definida en auth-modal.js (global)
// No es necesario duplicarla aquí

function mostrarNotificacion(mensaje, tipo = "success") {
  // Crear notificación toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${tipo === 'error' ? '#f44336' : '#4CAF50'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    animation: slideInRight 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// CSS para animaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

// ========================================
// MOSTRAR MODAL DE LOGIN CON MENSAJE
// ========================================
function mostrarModalLogin(mensaje) {
  // Primero mostrar el toast con el mensaje
  const toast = document.createElement('div');
  toast.className = 'toast toast-warning';
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <span style="font-size: 1.5rem;">🔒</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 0.25rem;">Inicia sesión</div>
        <div style="font-size: 0.9rem; opacity: 0.95;">${mensaje}</div>
      </div>
    </div>
  `;
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.25rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    z-index: 10000;
    animation: slideInRight 0.4s ease;
    max-width: 400px;
    cursor: pointer;
  `;
  
  document.body.appendChild(toast);
  
  // Hacer que el toast sea clickeable para abrir login
  toast.addEventListener('click', () => {
    const btnLogin = document.getElementById('btn-login-nav');
    if (btnLogin) {
      btnLogin.click();
    }
    toast.remove();
  });
  
  // Auto-abrir el modal después de 1 segundo
  setTimeout(() => {
    const btnLogin = document.getElementById('btn-login-nav');
    if (btnLogin) {
      btnLogin.click();
    }
  }, 1000);
  
  // Remover toast después de 5 segundos
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// ========================================
// APLICAR BÚSQUEDA DESDE URL
// ========================================
function aplicarBusquedaDesdeURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchTerm = urlParams.get('search');
  
  if (searchTerm) {
    console.log('🔍 Aplicando búsqueda desde URL:', searchTerm);
    
    // Actualizar el campo de búsqueda si existe
    if (searchInput) {
      searchInput.value = decodeURIComponent(searchTerm);
    }
    
    // Filtrar productos
    const termino = searchTerm.toLowerCase();
    const productos = document.querySelectorAll('.producto-card');
    let productosEncontrados = 0;
    
    productos.forEach(producto => {
      const nombre = producto.querySelector('.producto-titulo')?.textContent.toLowerCase() || '';
      const categoria = producto.getAttribute('data-category')?.toLowerCase() || '';
      
      if (nombre.includes(termino) || categoria.includes(termino)) {
        producto.style.display = 'block';
        productosEncontrados++;
      } else {
        producto.style.display = 'none';
      }
    });
    
    console.log(`✅ ${productosEncontrados} productos encontrados`);
    
    // Mostrar mensaje si no hay resultados
    if (productosEncontrados === 0) {
      mostrarMensajeSinResultados(searchTerm);
    }
  }
}

// ========================================
// MOSTRAR MENSAJE SIN RESULTADOS
// ========================================
function mostrarMensajeSinResultados(termino) {
  const productosSection = document.querySelector('.productos-grid');
  if (!productosSection) return;
  
  // Verificar si ya existe el mensaje
  let mensajeExistente = document.querySelector('.sin-resultados-busqueda');
  if (mensajeExistente) {
    mensajeExistente.remove();
  }
  
  const mensaje = document.createElement('div');
  mensaje.className = 'sin-resultados-busqueda';
  mensaje.innerHTML = `
    <div style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
      <i data-lucide="search-x" style="width: 64px; height: 64px; margin: 0 auto 1rem; opacity: 0.5;"></i>
      <h3>No se encontraron productos</h3>
      <p style="color: var(--text-light); margin-top: 0.5rem;">
        No hay productos que coincidan con "<strong>${termino}</strong>"
      </p>
      <button onclick="window.location.href='productos.html'" style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
        Ver todos los productos
      </button>
    </div>
  `;
  
  productosSection.appendChild(mensaje);
  
  // Inicializar el icono de Lucide
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
