// ========================================
// VARIABLES GLOBALES
// ========================================
let productoId = null;
let imagenActual = null;
let imagenNueva = null;

// ========================================
// VERIFICAR AUTENTICACIÓN
// ========================================
function verificarAutenticacion() {
  const username = localStorage.getItem('username');
  const userRol = localStorage.getItem('userRol');
  
  if (!username || userRol !== 'ADMIN') {
    alert('Debes iniciar sesión como administrador');
    window.location.href = '../contenido/principal.html';
    return false;
  }
  
  return true;
}

// ========================================
// OBTENER ID DEL PRODUCTO DE LA URL
// ========================================
function obtenerProductoId() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  
  if (!id) {
    alert('ID de producto no especificado');
    window.location.href = 'mis-productos.html';
    return null;
  }
  
  return parseInt(id);
}

// ========================================
// CARGAR DATOS DEL PRODUCTO
// ========================================
async function cargarProducto() {
  try {
    const response = await fetch(`http://localhost:3000/api/productos/${productoId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Producto no encontrado');
    }
    
    const data = await response.json();
    const producto = data.producto || data;
    
    console.log('Producto cargado:', producto);
    
    // Rellenar el formulario
    document.getElementById('nombre').value = producto.nombre || '';
    document.getElementById('descripcion').value = producto.descripcion || '';
    document.getElementById('sku').value = producto.sku || '';
    document.getElementById('precio').value = producto.precio || '';
    document.getElementById('stock').value = producto.stock || 0;
    document.getElementById('destacado').checked = producto.destacado || false;
    document.getElementById('activo').checked = producto.activo !== false;
    
    // Categoría
    if (producto.categoriaId) {
      document.getElementById('categoriaId').value = producto.categoriaId;
    }
    
    // Imagen actual
    if (producto.imagen) {
      imagenActual = producto.imagen;
      mostrarImagenActual(producto.imagen);
    }
    
  } catch (error) {
    console.error('Error al cargar producto:', error);
    alert('Error al cargar el producto. Redirigiendo...');
    window.location.href = 'mis-productos.html';
  }
}

// ========================================
// MOSTRAR IMAGEN ACTUAL
// ========================================
function mostrarImagenActual(imagenUrl) {
  const uploadArea = document.getElementById('uploadArea');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  
  uploadArea.style.display = 'none';
  imagePreview.style.display = 'block';
  previewImg.src = `http://localhost:3000${imagenUrl}`;
}

// ========================================
// CARGAR CATEGORÍAS
// ========================================
async function cargarCategorias() {
  try {
    const response = await fetch('http://localhost:3000/api/categorias', {
      credentials: 'include'
    });
    const data = await response.json();
    const categorias = data.categorias || data;
    
    const select = document.getElementById('categoriaId');
    select.innerHTML = '<option value="">Sin categoría</option>';
    
    categorias.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria.id;
      option.textContent = categoria.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  }
}

// ========================================
// MANEJO DE IMAGEN
// ========================================
function inicializarUploadImagen() {
  const uploadArea = document.getElementById('uploadArea');
  const uploadInput = document.getElementById('imagen');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const btnRemoveImage = document.getElementById('btnRemoveImage');
  
  // Click en el área de upload
  uploadArea.addEventListener('click', () => {
    uploadInput.click();
  });
  
  // Drag & Drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageSelect(files[0]);
    }
  });
  
  // Selección de archivo
  uploadInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageSelect(e.target.files[0]);
    }
  });
  
  // Eliminar imagen
  btnRemoveImage.addEventListener('click', () => {
    uploadInput.value = '';
    imagenNueva = null;
    
    if (imagenActual) {
      // Volver a mostrar la imagen actual
      mostrarImagenActual(imagenActual);
    } else {
      // Mostrar área de upload
      uploadArea.style.display = 'flex';
      imagePreview.style.display = 'none';
      previewImg.src = '';
    }
  });
}

function handleImageSelect(file) {
  if (!file.type.startsWith('image/')) {
    alert('Por favor selecciona una imagen válida');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('La imagen no debe superar los 5MB');
    return;
  }
  
  imagenNueva = file;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const uploadArea = document.getElementById('uploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    uploadArea.style.display = 'none';
    imagePreview.style.display = 'block';
    previewImg.src = e.target.result;
  };
  
  reader.readAsDataURL(file);
}

// ========================================
// ENVIAR FORMULARIO
// ========================================
async function enviarFormulario(e) {
  e.preventDefault();
  
  const btnGuardar = document.getElementById('btnGuardar');
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<span class="btn-icon">⏳</span> Guardando...';
  
  try {
    // 1. Actualizar datos del producto
    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim(),
      sku: document.getElementById('sku').value.trim(),
      precio: parseFloat(document.getElementById('precio').value),
      stock: parseInt(document.getElementById('stock').value) || 0,
      destacado: document.getElementById('destacado').checked,
      activo: document.getElementById('activo').checked,
      categoriaId: document.getElementById('categoriaId').value ? parseInt(document.getElementById('categoriaId').value) : null
    };
    
    const response = await fetch(`http://localhost:3000/api/productos/${productoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar el producto');
    }
    
    // 2. Si hay imagen nueva, subirla
    if (imagenNueva) {
      const imageFormData = new FormData();
      imageFormData.append('image', imagenNueva);
      
      const imageResponse = await fetch(`http://localhost:3000/api/productos/${productoId}/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: imageFormData
      });
      
      if (!imageResponse.ok) {
        console.error('Error al subir imagen, pero el producto se actualizó');
      }
    }
    
    // Mostrar mensaje de éxito
    mostrarExito();
    
  } catch (error) {
    console.error('Error:', error);
    alert(`Error: ${error.message}`);
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = '<span class="btn-icon">💾</span> Guardar Cambios';
  }
}

// ========================================
// MOSTRAR MENSAJE DE ÉXITO
// ========================================
function mostrarExito() {
  const form = document.getElementById('formCrearProducto');
  const successMessage = document.getElementById('successMessage');
  
  form.style.display = 'none';
  successMessage.style.display = 'block';
  
  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Opcional: redirigir después de 3 segundos
  setTimeout(() => {
    window.location.href = 'mis-productos.html';
  }, 2000);
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticación
  if (!verificarAutenticacion()) {
    return;
  }
  
  // Obtener ID del producto
  productoId = obtenerProductoId();
  if (!productoId) {
    return;
  }
  
  // Cargar categorías
  await cargarCategorias();
  
  // Cargar datos del producto
  await cargarProducto();
  
  // Inicializar upload de imagen
  inicializarUploadImagen();
  
  // Manejar envío del formulario
  const form = document.getElementById('formCrearProducto');
  form.addEventListener('submit', enviarFormulario);
});
