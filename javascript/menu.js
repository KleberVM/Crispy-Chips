// ========================================
// MENU TOGGLE
// ========================================
const menuBtn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');

menuBtn?.addEventListener('click', () => {
  const isExpanded = menu.classList.contains('active');
  menu.classList.toggle('active');
  menuBtn.setAttribute('aria-expanded', !isExpanded);
  
  // Animar hamburger
  const hamburgers = menuBtn.querySelectorAll('.hamburger');
  hamburgers.forEach(bar => bar.classList.toggle('active'));
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (e) => {
  if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
    menu.classList.remove('active');
    menuBtn.setAttribute('aria-expanded', 'false');
    const hamburgers = menuBtn.querySelectorAll('.hamburger');
    hamburgers.forEach(bar => bar.classList.remove('active'));
  }
});

// Cerrar menú al cambiar tamaño de ventana
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    menu?.classList.remove('active');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }
});


