// ========================================
// VARIABLES GLOBALES
// ========================================
const state = {
  usuarios: [],
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  },
  filters: {
    buscar: '',
    rol: '',
    verificado: ''
  },
  selectedUsuarioId: null
};

// ========================================
// VERIFICAR AUTENTICACIÓN
// ========================================
function verificarAutenticacion() {
  const username = localStorage.getItem('username');
  const userRol = localStorage.getItem('userRol');
  
  if (!username || userRol !== 'ADMIN') {
    alert('Debes iniciar sesión como administrador');
    window.location.href = '../contenido/index.html';
    return false;
  }
  
  return true;
}

// ========================================
// CARGAR USUARIOS
// ========================================
async function cargarUsuarios() {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.querySelector('.table-container');
  
  loadingState.style.display = 'block';
  emptyState.style.display = 'none';
  if (tableContainer) tableContainer.style.display = 'none';
  
  try {
    const params = new URLSearchParams({
      page: state.pagination.page,
      limit: state.pagination.limit,
      ...(state.filters.buscar && { buscar: state.filters.buscar }),
      ...(state.filters.rol && { rol: state.filters.rol }),
      ...(state.filters.verificado && { verificado: state.filters.verificado })
    });
    
    console.log('Cargando usuarios con params:', params.toString());
    
    const response = await fetch(`http://localhost:3000/api/usuarios?${params}`, {
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      throw new Error(errorData.message || 'Error al cargar usuarios');
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', data);
    
    state.usuarios = data.usuarios || [];
    state.pagination = data.pagination || state.pagination;
    
    loadingState.style.display = 'none';
    
    if (state.usuarios.length === 0) {
      emptyState.style.display = 'block';
      if (tableContainer) tableContainer.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'block';
      renderizarUsuarios();
      renderizarEstadisticas();
      renderizarPaginacion();
    }
    
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
    if (tableContainer) tableContainer.style.display = 'none';
    alert(`Error al cargar usuarios: ${error.message}`);
  }
}

// ========================================
// RENDERIZAR USUARIOS
// ========================================
function renderizarUsuarios() {
  const usuariosTable = document.getElementById('usuariosTable');
  const tbody = usuariosTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  state.usuarios.forEach(usuario => {
    const row = crearFilaUsuario(usuario);
    tbody.appendChild(row);
  });
  
  // Inicializar iconos de Lucide después de renderizar
  setTimeout(() => {
    lucide.createIcons();
  }, 0);
}

// ========================================
// CREAR FILA DE USUARIO
// ========================================
function crearFilaUsuario(usuario) {
  const tr = document.createElement('tr');
  tr.className = usuario.rol === 'ADMIN' ? 'admin-row' : 'cliente-row';
  
  const esAdmin = usuario.rol === 'ADMIN';
  const fechaRegistro = new Date(usuario.createdAt).toLocaleDateString('es-ES');
  
  const imagenUrl = usuario.fotoPerfil 
    ? `http://localhost:3000${usuario.fotoPerfil}` 
    : null;
  
  tr.innerHTML = `
    <td>
      <div class="user-avatar-cell">
        ${imagenUrl ? `<img src="${imagenUrl}" alt="${usuario.username}">` : '<span class="avatar-icon"><i data-lucide="user" class="lucide"></i></span>'}
      </div>
    </td>
    <td>
      <div class="user-name-cell">
        <strong>${usuario.nombre || usuario.username}</strong>
        <span class="username-text">@${usuario.username}</span>
      </div>
    </td>
    <td>${usuario.email}</td>
    <td>
      <span class="badge badge-${usuario.rol.toLowerCase()}">${usuario.rol}</span>
    </td>
    <td>
      <span class="status-badge ${usuario.emailVerificado ? 'verificado' : 'no-verificado'}">
        ${usuario.emailVerificado ? '<i data-lucide="check-circle" class="lucide"></i> Verificado' : '<i data-lucide="alert-circle" class="lucide"></i> No verificado'}
      </span>
    </td>
    <td>${fechaRegistro}</td>
    <td>
      <div class="action-buttons">
        ${esAdmin ? `
          <button class="btn-action btn-view" onclick="verUsuario(${usuario.id})" title="Ver información">
            <i data-lucide="eye" class="lucide"></i>
          </button>
        ` : `
          <button class="btn-action btn-edit" onclick="editarUsuario(${usuario.id})" title="Editar">
            <i data-lucide="edit" class="lucide"></i>
          </button>
          <button class="btn-action btn-delete" onclick="confirmarEliminar(${usuario.id}, '${usuario.username}')" title="Eliminar">
            <i data-lucide="trash" class="lucide"></i>
          </button>
        `}
      </div>
    </td>
  `;
  
  return tr;
}

// ========================================
// RENDERIZAR ESTADÍSTICAS
// ========================================
function renderizarEstadisticas() {
  if (state.usuarios.length === 0) return;
  
  const statsSection = document.getElementById('statsSection');
  statsSection.style.display = 'grid';
  
  const totalUsuarios = state.pagination.total;
  const totalAdmins = state.usuarios.filter(u => u.rol === 'ADMIN').length;
  const totalClientes = state.usuarios.filter(u => u.rol === 'CLIENTE').length;
  const totalVerificados = state.usuarios.filter(u => u.emailVerificado).length;
  
  document.getElementById('totalUsuarios').textContent = totalUsuarios;
  document.getElementById('totalAdmins').textContent = totalAdmins;
  document.getElementById('totalClientes').textContent = totalClientes;
  document.getElementById('totalVerificados').textContent = totalVerificados;
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
  const searchInput = document.getElementById('searchInputUsers');
  let searchTimeout;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.buscar = e.target.value;
      state.pagination.page = 1;
      cargarUsuarios();
    }, 500);
  });
  
  // Filtro por rol
  const filterRol = document.getElementById('filterRol');
  filterRol.addEventListener('change', (e) => {
    state.filters.rol = e.target.value;
    state.pagination.page = 1;
    cargarUsuarios();
  });
  
  // Filtro por verificado
  const filterVerificado = document.getElementById('filterVerificado');
  filterVerificado.addEventListener('change', (e) => {
    state.filters.verificado = e.target.value;
    state.pagination.page = 1;
    cargarUsuarios();
  });
  
  // Limpiar filtros
  const btnClearFilters = document.getElementById('btnClearFilters');
  btnClearFilters.addEventListener('click', () => {
    searchInput.value = '';
    filterRol.value = '';
    filterVerificado.value = '';
    
    state.filters = {
      buscar: '',
      rol: '',
      verificado: ''
    };
    state.pagination.page = 1;
    
    cargarUsuarios();
  });
  
  // Paginación
  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');
  
  btnPrevPage.addEventListener('click', () => {
    if (state.pagination.page > 1) {
      state.pagination.page--;
      cargarUsuarios();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  
  btnNextPage.addEventListener('click', () => {
    if (state.pagination.page < state.pagination.totalPages) {
      state.pagination.page++;
      cargarUsuarios();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

// ========================================
// VER USUARIO
// ========================================
function verUsuario(id) {
  const usuario = state.usuarios.find(u => u.id === id);
  if (!usuario) return;
  
  alert(`Información de Usuario ADMIN\n\nNombre: ${usuario.nombre || 'N/A'}\nApellido: ${usuario.apellido || 'N/A'}\nUsername: ${usuario.username}\nEmail: ${usuario.email}\nRol: ${usuario.rol}\nEstado: ${usuario.emailVerificado ? 'Verificado' : 'No verificado'}\nRegistrado: ${new Date(usuario.createdAt).toLocaleDateString('es-ES')}\n\nNo puedes editar usuarios ADMIN`);
}

// ========================================
// EDITAR USUARIO
// ========================================
function editarUsuario(id) {
  // Redirigir a página de edición
  window.location.href = `editar-usuario.html?id=${id}`;
}

// Función de cambiar rol eliminada - ya no se permite cambiar roles

// ========================================
// CONFIRMAR ELIMINAR
// ========================================
function confirmarEliminar(id, username) {
  state.selectedUsuarioId = id;
  
  const deleteModal = document.getElementById('deleteModal');
  deleteModal.style.display = 'flex';
}

// ========================================
// ELIMINAR USUARIO
// ========================================
async function eliminarUsuario() {
  if (!state.selectedUsuarioId) return;
  
  const btnConfirmDelete = document.getElementById('btnConfirmDelete');
  btnConfirmDelete.disabled = true;
  btnConfirmDelete.textContent = 'Eliminando...';
  
  try {
    const response = await fetch(`http://localhost:3000/api/usuarios/${state.selectedUsuarioId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar usuario');
    }
    
    cerrarModalEliminar();
    alert('Usuario eliminado exitosamente');
    cargarUsuarios();
    
  } catch (error) {
    console.error('Error:', error);
    alert(`Error: ${error.message}`);
    btnConfirmDelete.disabled = false;
    btnConfirmDelete.textContent = 'Eliminar';
  }
}

// ========================================
// CERRAR MODALES
// ========================================
function cerrarModalEliminar() {
  const deleteModal = document.getElementById('deleteModal');
  deleteModal.style.display = 'none';
  state.selectedUsuarioId = null;
  
  const btnConfirmDelete = document.getElementById('btnConfirmDelete');
  btnConfirmDelete.disabled = false;
  btnConfirmDelete.textContent = 'Eliminar';
}

// ========================================
// EVENT LISTENERS MODALES
// ========================================
function inicializarModales() {
  const btnCancelDelete = document.getElementById('btnCancelDelete');
  const btnConfirmDelete = document.getElementById('btnConfirmDelete');
  const deleteModal = document.getElementById('deleteModal');
  
  btnCancelDelete.addEventListener('click', cerrarModalEliminar);
  btnConfirmDelete.addEventListener('click', eliminarUsuario);
  
  // Cerrar al hacer click fuera
  deleteModal.addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') {
      cerrarModalEliminar();
    }
  });
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== USUARIOS.JS INICIALIZADO ===');
  console.log('URL:', window.location.href);
  console.log('Username:', localStorage.getItem('username'));
  console.log('Rol:', localStorage.getItem('userRol'));
  
  // Verificar autenticación
  if (!verificarAutenticacion()) {
    console.log('Autenticación fallida');
    return;
  }
  
  console.log('Autenticación correcta');
  console.log('Cargando usuarios...');
  
  // Cargar usuarios
  cargarUsuarios();
  
  // Inicializar eventos
  inicializarEventos();
  inicializarModales();
  
  console.log('Eventos y modales inicializados');
});
