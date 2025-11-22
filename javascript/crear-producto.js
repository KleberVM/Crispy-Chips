// ========================================
// CREAR PRODUCTO - ADMIN
// ========================================

const API_URL = 'http://localhost:3000';

let selectedFile = null;
let createdProductId = null;

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacion();
  cargarCategorias();
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
      window.location.href = '../contenido/index.html';
      return;
    }
    
    const data = await response.json();
    
    if (data.user.rol !== 'ADMIN') {
      alert('Acceso denegado. Solo administradores pueden acceder a esta página.');
      window.location.href = '../contenido/index.html';
    }
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
    window.location.href = '../contenido/index.html';
  }
}

// ========================================
// CARGAR CATEGORÍAS
// ========================================
async function cargarCategorias() {
  try {
    const response = await fetch(`${API_URL}/api/productos/categorias`);
    const categorias = await response.json();
    
    const select = document.getElementById('categoriaId');
    select.innerHTML = '<option value="">Sin categoría</option>';
    
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  }
}

// ========================================
// INICIALIZAR EVENTOS
// ========================================
function inicializarEventos() {
  // Formulario
  const form = document.getElementById('formCrearProducto');
  form.addEventListener('submit', handleSubmit);
  
  // Upload de imagen
  const uploadArea = document.getElementById('uploadArea');
  const uploadInput = document.getElementById('imagen');
  
  uploadArea.addEventListener('click', () => uploadInput.click());
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageSelect(files[0]);
    }
  });
  
  uploadInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageSelect(e.target.files[0]);
    }
  });
  
  // Botón eliminar preview
  document.getElementById('btnRemoveImage').addEventListener('click', (e) => {
    e.stopPropagation();
    removeImage();
  });
  
  // Botón crear otro
  document.getElementById('btnCrearOtro').addEventListener('click', () => {
    resetForm();
  });
  
  // Validación en tiempo real
  document.getElementById('nombre').addEventListener('blur', validarNombre);
  document.getElementById('precio').addEventListener('blur', validarPrecio);
}

// ========================================
// HANDLE IMAGE SELECT
// ========================================
function handleImageSelect(file) {
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    alert('Solo se permiten archivos de imagen');
    return;
  }
  
  // Validar tamaño (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('La imagen no debe superar 5MB');
    return;
  }
  
  selectedFile = file;
  
  // Mostrar preview
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ========================================
// REMOVE IMAGE
// ========================================
function removeImage() {
  selectedFile = null;
  document.getElementById('imagen').value = '';
  document.getElementById('uploadArea').style.display = 'block';
  document.getElementById('imagePreview').style.display = 'none';
}

// ========================================
// VALIDACIONES
// ========================================
function validarNombre() {
  const input = document.getElementById('nombre');
  const error = document.getElementById('error-nombre');
  
  if (!input.value.trim()) {
    error.textContent = 'El nombre es requerido';
    input.style.borderColor = '#f44336';
    return false;
  }
  
  error.textContent = '';
  input.style.borderColor = '';
  return true;
}

function validarPrecio() {
  const input = document.getElementById('precio');
  const error = document.getElementById('error-precio');
  const valor = parseFloat(input.value);
  
  if (!input.value || isNaN(valor) || valor <= 0) {
    error.textContent = 'El precio debe ser mayor a 0';
    input.style.borderColor = '#f44336';
    return false;
  }
  
  error.textContent = '';
  input.style.borderColor = '';
  return true;
}

// ========================================
// HANDLE SUBMIT
// ========================================
async function handleSubmit(e) {
  e.preventDefault();
  
  // Validar
  const nombreValido = validarNombre();
  const precioValido = validarPrecio();
  
  if (!nombreValido || !precioValido) {
    alert('Por favor corrige los errores en el formulario');
    return;
  }
  
  const btnGuardar = document.getElementById('btnGuardar');
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<span class="btn-icon">⏳</span> Creando...';
  
  try {
    // 1. Crear producto
    const productoData = {
      nombre: document.getElementById('nombre').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim() || null,
      precio: parseFloat(document.getElementById('precio').value),
      stock: parseInt(document.getElementById('stock').value) || 0,
      categoriaId: document.getElementById('categoriaId').value || null,
      sku: document.getElementById('sku').value.trim() || null,
      destacado: document.getElementById('destacado').checked,
      activo: document.getElementById('activo').checked
    };
    
    const response = await fetch(`${API_URL}/api/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(productoData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear producto');
    }
    
    const data = await response.json();
    createdProductId = data.producto.id;
    
    // 2. Subir imagen si existe
    if (selectedFile) {
      await subirImagenProducto(createdProductId);
    }
    
    // 3. Mostrar mensaje de éxito
    mostrarExito();
    
  } catch (error) {
    console.error('Error al crear producto:', error);
    alert(error.message || 'Error al crear el producto');
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = '<span class="btn-icon">💾</span> Crear Producto';
  }
}

// ========================================
// SUBIR IMAGEN PRODUCTO
// ========================================
async function subirImagenProducto(productoId) {
  const formData = new FormData();
  formData.append('image', selectedFile);
  
  const response = await fetch(
    `${API_URL}/api/productos/${productoId}/upload-image`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData
    }
  );
  
  if (!response.ok) {
    console.error('Error al subir imagen');
  }
}

// ========================================
// MOSTRAR ÉXITO
// ========================================
function mostrarExito() {
  document.getElementById('formCrearProducto').style.display = 'none';
  document.getElementById('successMessage').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// RESET FORM
// ========================================
function resetForm() {
  // Reset formulario
  document.getElementById('formCrearProducto').reset();
  removeImage();
  selectedFile = null;
  createdProductId = null;
  
  // Limpiar errores
  document.getElementById('error-nombre').textContent = '';
  document.getElementById('error-precio').textContent = '';
  document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
    input.style.borderColor = '';
  });
  
  // Volver al formulario
  document.getElementById('formCrearProducto').style.display = 'block';
  document.getElementById('successMessage').style.display = 'none';
  
  // Habilitar botón
  const btnGuardar = document.getElementById('btnGuardar');
  btnGuardar.disabled = false;
  btnGuardar.innerHTML = '<span class="btn-icon">💾</span> Crear Producto';
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
