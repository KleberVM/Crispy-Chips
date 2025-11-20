const botones = document.querySelectorAll(".producto button:not(.agotado)");
const carritoItems = document.getElementById("carrito-items");
const carritoTotal = document.getElementById("carrito-total");
const carritoVacio = document.getElementById("carrito-vacio");
const carritoLleno = document.getElementById("carrito-lleno");

let carrito = [];

botones.forEach(boton => {
  boton.addEventListener("click", async (e) => {
    const productoDiv = e.target.closest(".producto");
    const nombre = productoDiv.querySelector("img").alt;
    const precioTexto = productoDiv.querySelector("p:nth-of-type(2)").textContent;
    const precio = parseFloat(precioTexto.match(/(\d+,\d+|\d+)/)[0].replace(",", "."));
    const imagen = productoDiv.querySelector("img").src;

    const nuevoProducto = { nombre, precio, cantidad: 1, imagen };

    // Guardar en la base de datos
    try {
      const res = await fetch("http://localhost:3000/agregar-carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProducto)
      });

      const data = await res.json();
      console.log(data.mensaje);
      alert(`${nombre} añadido al carrito 🛒`);
      agregarAlCarritoVisual(nuevoProducto);

    } catch (error) {
      console.error("Error al agregar:", error);
      alert("Hubo un error al agregar el producto.");
    }
  });
});

function agregarAlCarritoVisual(producto) {
  const existente = carrito.find(p => p.nombre === producto.nombre);
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push(producto);
  }

  renderizarCarrito();
}

function renderizarCarrito() {
  carritoItems.innerHTML = "";
  let total = 0;

  carrito.forEach((producto, i) => {
    const subtotal = producto.precio * producto.cantidad;
    total += subtotal;

    const fila = `
      <tr>
        <td>${producto.nombre}</td>
        <td>${producto.precio.toFixed(2)} Bs</td>
        <td>${producto.cantidad}</td>
        <td>${subtotal.toFixed(2)} Bs</td>
        <td><button onclick="eliminarDelCarrito(${i})">❌</button></td>
      </tr>
    `;
    carritoItems.insertAdjacentHTML("beforeend", fila);
  });

  carritoTotal.textContent = `${total.toFixed(2)} Bs`;
  if (carrito.length > 0) {
    carritoVacio.classList.add("oculto");
    carritoLleno.classList.remove("oculto");
  } else {
    carritoVacio.classList.remove("oculto");
    carritoLleno.classList.add("oculto");
  }
}

window.eliminarDelCarrito = (index) => {
  carrito.splice(index, 1);
  renderizarCarrito();
};


// Botón "Finalizar compra" — usa alert para confirmar
const btnComprar = document.querySelector(".btn-comprar");

btnComprar.addEventListener("click", () => {
  const usuario = localStorage.getItem("username");
  const totalTexto = document.getElementById("carrito-total")?.textContent || "0";
  const total = parseFloat(totalTexto.replace(" Bs", "")) || 0;

  if (!usuario) {
    alert("Debes iniciar sesión antes de finalizar la compra 🧑‍💻");
    return;
  }

  if (carrito.length === 0) {
    alert("Tu carrito está vacío 🛒");
    return;
  }

  // Mostrar alerta de confirmación
  alert(`✅ Compra finalizada\n\nUsuario: ${usuario}\nTotal pagado: ${total.toFixed(2)} Bs\n\nGracias por tu compra.`);

  // Vaciar carrito en memoria y actualizar UI
  carrito = [];
  renderizarCarrito();

  // Opcional: si mantienes secciones visuales (carritoLleno/carritoVacio), actualízalas
  if (typeof carritoLleno !== "undefined" && typeof carritoVacio !== "undefined") {
    carritoLleno.classList.add("oculto");
    carritoVacio.classList.remove("oculto");
  }
});

