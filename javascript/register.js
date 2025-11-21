// ========================================
// ELEMENTOS DEL DOM
// ========================================
const form = document.getElementById("registerForm");
const message = document.getElementById("message");
const emailInput = document.getElementById("email");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.querySelector(".toggle-password");
const strengthBar = document.querySelector(".strength-bar");
const submitBtn = document.querySelector(".btn-submit");

// ========================================
// TOGGLE PASSWORD VISIBILITY
// ========================================
togglePasswordBtn?.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePasswordBtn.textContent = type === "password" ? "👁️" : "🙈";
});

// ========================================
// PASSWORD STRENGTH INDICATOR
// ========================================
passwordInput.addEventListener("input", (e) => {
    const password = e.target.value;
    const strength = calculatePasswordStrength(password);
    
    strengthBar.className = "strength-bar";
    
    if (password.length === 0) {
        strengthBar.style.width = "0";
    } else if (strength < 40) {
        strengthBar.classList.add("weak");
    } else if (strength < 70) {
        strengthBar.classList.add("medium");
    } else {
        strengthBar.classList.add("strong");
    }
});

function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 6) strength += 20;
    if (password.length >= 10) strength += 20;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    
    return strength;
}

// ========================================
// REAL-TIME VALIDATION
// ========================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

emailInput.addEventListener("blur", () => {
    const email = emailInput.value.trim();
    const errorElement = document.getElementById("email-error");
    
    if (email && !validateEmail(email)) {
        emailInput.classList.add("error");
        emailInput.classList.remove("success");
        errorElement.textContent = "Correo electrónico inválido";
    } else if (email) {
        emailInput.classList.remove("error");
        emailInput.classList.add("success");
        errorElement.textContent = "";
    }
});

usernameInput.addEventListener("blur", () => {
    const username = usernameInput.value.trim();
    const errorElement = document.getElementById("username-error");
    
    if (username && username.length < 3) {
        usernameInput.classList.add("error");
        usernameInput.classList.remove("success");
        errorElement.textContent = "Mínimo 3 caracteres";
    } else if (username) {
        usernameInput.classList.remove("error");
        usernameInput.classList.add("success");
        errorElement.textContent = "";
    }
});

passwordInput.addEventListener("blur", () => {
    const password = passwordInput.value;
    const errorElement = document.getElementById("password-error");
    
    if (password && password.length < 6) {
        passwordInput.classList.add("error");
        passwordInput.classList.remove("success");
        errorElement.textContent = "Mínimo 6 caracteres";
    } else if (password) {
        passwordInput.classList.remove("error");
        passwordInput.classList.add("success");
        errorElement.textContent = "";
    }
});

// ========================================
// FORM SUBMISSION
// ========================================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const username = usernameInput.value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const password = passwordInput.value;

    // Clear previous message
    message.textContent = "";
    message.className = "message";

    // Validaciones
    if (!email || !username || !password) {
        showMessage("Por favor completa todos los campos obligatorios (*)", "error");
        return;
    }

    if (!validateEmail(email)) {
        showMessage("Por favor ingresa un correo electrónico válido", "error");
        emailInput.focus();
        return;
    }

    if (username.length < 3) {
        showMessage("El nombre de usuario debe tener al menos 3 caracteres", "error");
        usernameInput.focus();
        return;
    }

    if (password.length < 6) {
        showMessage("La contraseña debe tener al menos 6 caracteres", "error");
        passwordInput.focus();
        return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");

    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                email, 
                username, 
                password,
                nombre: nombre || undefined,
                apellido: apellido || undefined
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, "success");
            form.reset();
            strengthBar.style.width = "0";
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 2000);
        } else {
            showMessage(data.message, "error");
        }
    } catch (error) {
        console.error("Error al registrar:", error);
        showMessage("Error de conexión con el servidor. Por favor intenta de nuevo.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove("loading");
    }
});

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
}
