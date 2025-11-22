// ========================================
// BUSCADOR DEL HEADER - FUNCIONALIDAD GLOBAL
// ========================================

// Inicializar buscador del header
document.addEventListener('DOMContentLoaded', () => {
  const headerSearchInput = document.querySelector('.buscar');
  const searchIcon = document.querySelector('.search-icon');
  
  if (!headerSearchInput) return;
  
  // Función para realizar la búsqueda
  function realizarBusqueda() {
    const termino = headerSearchInput.value.trim();
    
    if (!termino) {
      // Si está vacío, solo redirigir a productos
      window.location.href = '../contenido/productos.html';
      return;
    }
    
    // Redirigir a productos.html con el término de búsqueda en la URL
    window.location.href = `../contenido/productos.html?search=${encodeURIComponent(termino)}`;
  }
  
  // Buscar al presionar Enter
  headerSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      realizarBusqueda();
    }
  });
  
  // Buscar al hacer clic en el ícono de búsqueda
  if (searchIcon) {
    searchIcon.addEventListener('click', () => {
      realizarBusqueda();
    });
    
    // Cambiar cursor para indicar que es clickeable
    searchIcon.style.cursor = 'pointer';
  }
  
  // Si ya estamos en productos.html, leer el parámetro de búsqueda
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  
  if (searchParam && window.location.pathname.includes('productos.html')) {
    headerSearchInput.value = decodeURIComponent(searchParam);
    console.log('🔍 Término de búsqueda cargado:', searchParam);
  }
});
