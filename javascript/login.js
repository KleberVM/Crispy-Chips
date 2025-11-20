
// Espera a que el DOM esté cargado antes de acceder al formulario
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const message = document.getElementById("message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      message.textContent = "Por favor completa todos los campos.";
      message.style.color = "red";
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar el usuario en localStorage
        localStorage.setItem("username", username);

        message.textContent = data.message;
        message.style.color = "green";

        // Redirigir después de un breve retraso
        setTimeout(() => {
          window.location.href = "contenido/principal.html";
        }, 1000);
      } else {
        message.textContent = data.message;
        message.style.color = "red";
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      message.textContent = "Error de conexión con el servidor.";
      message.style.color = "red";
    }
  });
});
