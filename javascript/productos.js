// ========================================
// VARIABLES GLOBALES
// ========================================
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
const carritoModal = document.getElementById('carritoModal');
const cartBtn = document.getElementById('cartBtn');
const modalClose = document.getElementById('modalClose');
const modalOverlay = document.getElementById('modalOverlay');
const cartCount = document.getElementById('cartCount');
const searchInput = document.getElementById('searchInput');

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  actualizarContadorCarrito();
  renderizarCarrito();
  inicializarFiltros();
  inicializarBusqueda();
  inicializarBotonesAgregar();
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
      const card = e.target.closest('.producto-card');
      const nombre = boton.dataset.producto;
      const precio = parseFloat(boton.dataset.precio);
      const imagen = card.querySelector('img').src;

      const producto = {
        nombre,
        precio,
        cantidad: 1,
        imagen
      };

      agregarAlCarrito(producto);
      mostrarNotificacion(`${nombre} agregado al carrito ✅`);

      // Opcional: Enviar a backend
      try {
        await fetch("http://localhost:3000/agregar-carrito", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(producto)
        });
      } catch (error) {
        console.log("Backend no disponible, guardando solo en localStorage");
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

function actualizarContadorCarrito() {
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  cartCount.textContent = total;
}

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
