const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt"); 
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// 🔹 Conexión MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root", // cámbiala si tu MySQL tiene otra contraseña
  database: "crispy"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error de conexión a MySQL:", err);
  } else {
    console.log("✅ Conectado a MySQL");
  }
});

// 🔹 Iniciar servidor
app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});

// 🔹 Ruta para agregar producto al carrito
app.post("/agregar-carrito", (req, res) => {
  const { nombre, precio, cantidad, imagen } = req.body;
  console.log("📦 Datos recibidos:", req.body);

  const query = "INSERT INTO carrito (nombre, precio, cantidad, imagen) VALUES (?, ?, ?, ?)";
  db.query(query, [nombre, precio, cantidad, imagen], (err, result) => {
    if (err) {
      console.error("❌ Error al insertar en MySQL:", err);
      return res.status(500).json({ error: "Error al agregar producto", detalles: err });
    }
    res.json({ mensaje: "✅ Producto agregado correctamente", id: result.insertId });
  });
});

// 🔹 Ruta para obtener productos del carrito
app.get("/carrito", (req, res) => {
  db.query("SELECT * FROM carrito", (err, results) => {
    if (err) {
      console.error("❌ Error al obtener carrito:", err);
      res.status(500).json({ error: "Error al obtener carrito" });
    } else {
      res.json(results);
    }
  });
});


// 🔹 Registrar usuario
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO usuarios (username, password) VALUES (?, ?)";

    db.query(sql, [username, hashedPassword], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "El usuario ya existe" });
        }
        return res.status(500).json({ message: "Error en el servidor" });
      }
      res.json({ message: "Cuenta creada con éxito ✅" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// 🔹 Login usuario
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM usuarios WHERE username = ?";

  db.query(sql, [username], async (err, result) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    if (result.length === 0) return res.status(400).json({ message: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, result[0].password);
    if (valid) {
      res.json({ message: "Inicio de sesión exitoso ✅" });
    } else {
      res.status(401).json({ message: "Contraseña incorrecta" });
    }
  });
});