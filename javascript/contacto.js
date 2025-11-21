// Formulario de contacto con validación
const form = document.getElementById('contactForm');
const submitBtn = document.querySelector('.btn-submit');
const message = document.getElementById('message');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const asunto = document.getElementById('asunto').value;
  const mensaje = document.getElementById('mensaje').value.trim();
  
  if (!nombre || !email || !asunto || !mensaje) {
    showMessage('Por favor completa todos los campos obligatorios', 'error');
    return;
  }
  
  // Loading state
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  
  // Simular envío
  setTimeout(() => {
    showMessage('¡Mensaje enviado con éxito! Te responderemos pronto.', 'success');
    form.reset();
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
  }, 2000);
});

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
}
