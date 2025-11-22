// ========================================
// MIS PRODUCTOS - ADMIN
// ========================================

const API_URL = 'http://localhost:3000';

// Estado de la aplicación
const state = {
  productos: [],
  categorias: [],
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  },
  filters: {
    buscar: '',
    categoriaId: '',
    destacado: ''
  },
  productoAEliminar: null
};

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacion();
  cargarCategorias();
  cargarProductos();
  inicializarEventos();
});

// ========================================
// VERIFICAR AUTENTICACIÓN
// ========================================
async function verificarAutenticacion() {
  try {
    const response = await fetch(`${API_URL}/me`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      window.location.href = '../contenido/principal.html';
      return;
    }
    
    const data = await response.json();
    
    if (data.user.rol !== 'ADMIN') {
      alert('Acceso denegado. Solo administradores pueden acceder a esta página.');
      window.location.href = '../contenido/principal.html';
    }
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
    window.location.href = '../contenido/principal.html';
  }
}

// ========================================
// CARGAR CATEGORÍAS
// ========================================
async function cargarCategorias() {
  try {
    const response = await fetch(`${API_URL}/api/productos/categorias`);
    const categorias = await response.json();
    
    state.categorias = categorias;
    
    const select = document.getElementById('filterCategory');
    select.innerHTML = '<option value="">Todas las categorías</option>';
    
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.nombre} (${cat._count.productos})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  }
}

// ========================================
// CARGAR PRODUCTOS
// ========================================
async function cargarProductos() {
  mostrarCargando(true);
  
  try {
    const params = new URLSearchParams({
      page: state.pagination.page,
      limit: state.pagination.limit,
      ...state.filters
    });
    
    // Eliminar parámetros vacíos
    for (let [key, value] of [...params.entries()]) {
      if (!value) params.delete(key);
    }
    
    const response = await fetch(
      `${API_URL}/api/productos/mis-productos?${params}`,
      { credentials: 'include' }
    );
    
    if (!response.ok) {
      throw new Error('Error al cargar productos');
    }
    
    const data = await response.json();
    
    state.productos = data.productos;
    state.pagination = data.pagination;
    
    mostrarCargando(false);
    renderizarProductos();
    renderizarEstadisticas();
    renderizarPaginacion();
    
  } catch (error) {
    console.error('Error al cargar productos:', error);
    mostrarCargando(false);
    mostrarError('Error al cargar los productos');
  }
}

// ========================================
// RENDERIZAR PRODUCTOS
// ========================================
function renderizarProductos() {
  const grid = document.getElementById('productosGrid');
  const emptyState = document.getElementById('emptyState');
  
  if (state.productos.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'flex';
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('paginationSection').style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  
  grid.innerHTML = state.productos.map(producto => `
    <div class="producto-card" data-id="${producto.id}">
      ${producto.destacado ? '<div class="producto-badge">⭐ Destacado</div>' : ''}
      
      ${producto.imagen 
        ? `<img src="${API_URL}${producto.imagen}" alt="${producto.nombre}" class="producto-imagen">`
        : `<div class="producto-imagen no-image"></div>`
      }
      
      <div class="producto-info">
        <div class="producto-header">
          <h3 class="producto-nombre">${producto.nombre}</h3>
        </div>
        
        ${producto.categoria 
          ? `<span class="producto-categoria">${producto.categoria.nombre}</span>`
          : ''
        }
        
        ${producto.descripcion 
          ? `<p class="producto-descripcion">${producto.descripcion}</p>`
          : '<p class="producto-descripcion">Sin descripción</p>'
        }
        
        <div class="producto-detalles">
          <div class="producto-precio">$${parseFloat(producto.precio).toFixed(2)}</div>
          <div class="producto-stock">
            <span class="stock-label">Stock:</span>
            <span class="stock-value ${getStockClass(producto.stock)}">${producto.stock}</span>
          </div>
        </div>
        
        <div class="producto-acciones">
          <button class="btn-accion btn-editar" onclick="editarProducto(${producto.id})">
            ✏️ Editar
          </button>
          <button class="btn-accion btn-imagen" onclick="subirImagen(${producto.id})">
            📷 Imagen
          </button>
          <button class="btn-accion btn-eliminar" onclick="confirmarEliminar(${producto.id})">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// ========================================
// OBTENER CLASE DE STOCK
// ========================================
function getStockClass(stock) {
  if (stock === 0) return 'bajo';
  if (stock < 10) return 'medio';
  return 'alto';
}

// ========================================
// RENDERIZAR ESTADÍSTICAS
// ========================================
function renderizarEstadisticas() {
  if (state.productos.length === 0) return;
  
  const statsSection = document.getElementById('statsSection');
  statsSection.style.display = 'grid';
  
  const totalProductos = state.pagination.total;
  const productosDestacados = state.productos.filter(p => p.destacado).length;
  const totalStock = state.productos.reduce((sum, p) => sum + p.stock, 0);
  
  document.getElementById('totalProductos').textContent = totalProductos;
  document.getElementById('productosDestacados').textContent = productosDestacados;
  document.getElementById('totalStock').textContent = totalStock;
}

// ========================================
// RENDERIZAR PAGINACIÓN
// ========================================
function renderizarPaginacion() {
  const paginationSection = document.getElementById('paginationSection');
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');
  const currentPage = document.getElementById('currentPage');
  const totalPages = document.getElementById('totalPages');
  
  if (state.pagination.totalPages <= 1) {
    paginationSection.style.display = 'none';
    return;
  }
  
  paginationSection.style.display = 'flex';
  currentPage.textContent = state.pagination.page;
  totalPages.textContent = state.pagination.totalPages;
  
  btnPrev.disabled = state.pagination.page === 1;
  btnNext.disabled = state.pagination.page === state.pagination.totalPages;
}

// ========================================
// INICIALIZAR EVENTOS
// ========================================
function inicializarEventos() {
  // Búsqueda
  const searchInput = document.getElementById('searchInput');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.buscar = e.target.value;
      state.pagination.page = 1;
      cargarProductos();
    }, 500);
  });
  
  // Filtro de categoría
  document.getElementById('filterCategory').addEventListener('change', (e) => {
    state.filters.categoriaId = e.target.value;
    state.pagination.page = 1;
    cargarProductos();
  });
  
  // Filtro de destacado
  document.getElementById('filterStatus').addEventListener('change', (e) => {
    state.filters.destacado = e.target.value;
    state.pagination.page = 1;
    cargarProductos();
  });
  
  // Limpiar filtros
  document.getElementById('btnClearFilters').addEventListener('click', () => {
    state.filters = {
      buscar: '',
      categoriaId: '',
      destacado: ''
    };
    state.pagination.page = 1;
    
    document.getElementById('searchInput').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterStatus').value = '';
    
    cargarProductos();
  });
  
  // Paginación
  document.getElementById('btnPrevPage').addEventListener('click', () => {
    if (state.pagination.page > 1) {
      state.pagination.page--;
      cargarProductos();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  
  document.getElementById('btnNextPage').addEventListener('click', () => {
    if (state.pagination.page < state.pagination.totalPages) {
      state.pagination.page++;
      cargarProductos();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  
  // Modal de eliminar
  document.getElementById('btnCancelDelete').addEventListener('click', cerrarModalEliminar);
  document.getElementById('btnConfirmDelete').addEventListener('click', eliminarProducto);
  
  // Cerrar modal al hacer clic fuera
  document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') {
      cerrarModalEliminar();
    }
  });
}

// ========================================
// EDITAR PRODUCTO
// ========================================
function editarProducto(id) {
  // Redirigir a la página de edición con el ID del producto
  window.location.href = `editar-producto.html?id=${id}`;
}

// ========================================
// SUBIR IMAGEN
// ========================================
async function subirImagen(id) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(
        `${API_URL}/api/productos/${id}/upload-image`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al subir imagen');
      }
      
      const data = await response.json();
      alert(data.message);
      cargarProductos();
      
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen');
    }
  };
  
  input.click();
}

// ========================================
// CONFIRMAR ELIMINAR
// ========================================
function confirmarEliminar(id) {
  state.productoAEliminar = id;
  document.getElementById('deleteModal').style.display = 'flex';
}

function cerrarModalEliminar() {
  state.productoAEliminar = null;
  document.getElementById('deleteModal').style.display = 'none';
}

// ========================================
// ELIMINAR PRODUCTO
// ========================================
async function eliminarProducto() {
  if (!state.productoAEliminar) return;
  
  try {
    const response = await fetch(
      `${API_URL}/api/productos/${state.productoAEliminar}`,
      {
        method: 'DELETE',
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      throw new Error('Error al eliminar producto');
    }
    
    const data = await response.json();
    alert(data.message);
    
    cerrarModalEliminar();
    cargarProductos();
    
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    alert('Error al eliminar el producto');
  }
}

// ========================================
// UTILIDADES
// ========================================
function mostrarCargando(mostrar) {
  document.getElementById('loadingState').style.display = mostrar ? 'flex' : 'none';
  document.getElementById('productosGrid').style.display = mostrar ? 'none' : 'grid';
}

function mostrarError(mensaje) {
  alert(mensaje);
}
