require('dotenv').config();
const express = require("express");
const bcrypt = require("bcrypt"); 
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { 
  generateVerificationToken, 
  sendVerificationEmail, 
  sendPasswordResetEmail 
} = require("./utils/mailer");

const prisma = new PrismaClient();
const app = express();

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer para subir fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: fileFilter
});

// Middleware
app.use(cors({
  origin: process.env.SERVER_URL || "http://localhost:3000",
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Configurar sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu-secreto-super-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware de autenticación
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "No autorizado" });
};

// Verificar conexión a BD
prisma.$connect()
  .then(() => console.log(" Conectado a MySQL con Prisma"))
  .catch(err => console.error("Error de conexión:", err));

// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

// 🔹 Registrar usuario con verificación por correo
app.post("/register", async (req, res) => {
  const { email, username, password, nombre, apellido } = req.body;

  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email 
          ? "El correo electrónico ya está registrado" 
          : "El nombre de usuario ya existe" 
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generar token de verificación
    const verificationToken = generateVerificationToken();

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email,
        username,
        password: hashedPassword,
        nombre: nombre || null,
        apellido: apellido || null,
        tokenVerificacion: verificationToken,
        emailVerificado: false
      }
    });

    // Enviar correo de verificación
    await sendVerificationEmail(email, username, verificationToken);

    res.json({ 
      message: "Cuenta creada con éxito  Verifica tu correo electrónico para activar tu cuenta.",
      userId: usuario.id 
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// 🔹 Verificar email
app.get("/verificar-email/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { tokenVerificacion: token }
    });

    if (!usuario) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        emailVerificado: true,
        tokenVerificacion: null
      }
    });

    res.json({ message: " Email verificado correctamente. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("Error al verificar email:", error);
    res.status(500).json({ message: "Error al verificar email" });
  }
});

// 🔹 Login con Passport
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" });
    }
    
    if (!user) {
      return res.status(401).json({ message: info.message || "Credenciales incorrectas" });
    }

    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error al iniciar sesión" });
      }
      
      res.json({ 
        message: "Inicio de sesión exitoso ",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          nombre: user.nombre,
          rol: user.rol
        }
      });
    });
  })(req, res, next);
});

// 🔹 Logout
app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Error al cerrar sesión" });
    }
    res.json({ message: "Sesión cerrada correctamente" });
  });
});

// 🔹 Obtener usuario actual
app.get("/me", isAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

// 🔹 Solicitar restablecimiento de contraseña
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      // Por seguridad, no revelar si el email existe
      return res.json({ message: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña" });
    }

    const resetToken = generateVerificationToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      }
    });

    await sendPasswordResetEmail(email, usuario.username, resetToken);

    res.json({ message: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña" });
  } catch (error) {
    console.error("Error al solicitar restablecimiento:", error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});

// 🔹 Restablecer contraseña
app.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const usuario = await prisma.usuario.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!usuario) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.json({ message: " Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ message: "Error al restablecer contraseña" });
  }
});

// ========================================
// RUTAS DE CARRITO
// ========================================

// 🔹 Agregar producto al carrito
app.post("/agregar-carrito", async (req, res) => {
  const { productoId, cantidad } = req.body;
  const usuarioId = req.user?.id;
  const sessionId = req.sessionID;

  try {
    // Buscar o crear carrito
    let carrito = await prisma.carrito.findFirst({
      where: usuarioId ? { usuarioId } : { sessionId }
    });

    if (!carrito) {
      carrito = await prisma.carrito.create({
        data: usuarioId ? { usuarioId } : { sessionId }
      });
    }

    // Obtener producto
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(productoId) }
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (producto.stock < cantidad) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    // Verificar si el item ya existe en el carrito
    const itemExistente = await prisma.itemCarrito.findFirst({
      where: {
        carritoId: carrito.id,
        productoId: parseInt(productoId)
      }
    });

    if (itemExistente) {
      // Actualizar cantidad
      await prisma.itemCarrito.update({
        where: { id: itemExistente.id },
        data: { cantidad: itemExistente.cantidad + parseInt(cantidad) }
      });
    } else {
      // Crear nuevo item
      await prisma.itemCarrito.create({
        data: {
          carritoId: carrito.id,
          productoId: parseInt(productoId),
          cantidad: parseInt(cantidad),
          precio: producto.precio
        }
      });
    }

    res.json({ mensaje: " Producto agregado al carrito" });
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    res.status(500).json({ error: "Error al agregar producto al carrito" });
  }
});

// 🔹 Obtener carrito
app.get("/carrito", async (req, res) => {
  const usuarioId = req.user?.id;
  const sessionId = req.sessionID;

  try {
    const carrito = await prisma.carrito.findFirst({
      where: usuarioId ? { usuarioId } : { sessionId },
      include: {
        items: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!carrito) {
      return res.json({ items: [], total: 0 });
    }

    const total = carrito.items.reduce((sum, item) => {
      return sum + (parseFloat(item.precio) * item.cantidad);
    }, 0);

    res.json({
      items: carrito.items,
      total: total.toFixed(2)
    });
  } catch (error) {
    console.error("Error al obtener carrito:", error);
    res.status(500).json({ error: "Error al obtener carrito" });
  }
});

// 🔹 Actualizar cantidad en carrito
app.put("/carrito/item/:itemId", async (req, res) => {
  const { itemId } = req.params;
  const { cantidad } = req.body;

  try {
    await prisma.itemCarrito.update({
      where: { id: parseInt(itemId) },
      data: { cantidad: parseInt(cantidad) }
    });

    res.json({ mensaje: " Cantidad actualizada" });
  } catch (error) {
    console.error("Error al actualizar item:", error);
    res.status(500).json({ error: "Error al actualizar cantidad" });
  }
});

// 🔹 Eliminar item del carrito
app.delete("/carrito/item/:itemId", async (req, res) => {
  const { itemId } = req.params;

  try {
    await prisma.itemCarrito.delete({
      where: { id: parseInt(itemId) }
    });

    res.json({ mensaje: " Producto eliminado del carrito" });
  } catch (error) {
    console.error("Error al eliminar item:", error);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

// 🔹 Vaciar carrito
app.delete("/carrito", async (req, res) => {
  const usuarioId = req.user?.id;
  const sessionId = req.sessionID;

  try {
    const carrito = await prisma.carrito.findFirst({
      where: usuarioId ? { usuarioId } : { sessionId }
    });

    if (carrito) {
      await prisma.itemCarrito.deleteMany({
        where: { carritoId: carrito.id }
      });
    }

    res.json({ mensaje: " Carrito vaciado" });
  } catch (error) {
    console.error("Error al vaciar carrito:", error);
    res.status(500).json({ error: "Error al vaciar carrito" });
  }
});

// ========================================
// RUTAS DE PRODUCTOS
// ========================================

// 🔹 Obtener todos los productos
app.get("/productos", async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      include: {
        categoria: true,
        detalles: true
      }
    });

    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// 🔹 Obtener producto por ID
app.get("/productos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
        detalles: true
      }
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

// ========================================
// RUTAS DE PEDIDOS
// ========================================

// 🔹 Crear pedido desde carrito
app.post("/pedidos", isAuthenticated, async (req, res) => {
  const { direccionEnvio, ciudadEnvio, codigoPostalEnvio, telefonoContacto, notas } = req.body;
  const usuarioId = req.user.id;

  try {
    // Obtener carrito con items
    const carrito = await prisma.carrito.findFirst({
      where: { usuarioId },
      include: {
        items: {
          include: { producto: true }
        }
      }
    });

    if (!carrito || carrito.items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    // Calcular totales
    const subtotal = carrito.items.reduce((sum, item) => {
      return sum + (parseFloat(item.precio) * item.cantidad);
    }, 0);

    const impuestos = subtotal * 0.19; // IVA 19%
    const envio = 5000; // Costo fijo de envío
    const total = subtotal + impuestos + envio;

    // Crear pedido
    const pedido = await prisma.pedido.create({
      data: {
        usuarioId,
        subtotal,
        impuestos,
        envio,
        total,
        direccionEnvio,
        ciudadEnvio,
        codigoPostalEnvio,
        telefonoContacto,
        notas,
        items: {
          create: carrito.items.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precio: item.precio,
            subtotal: parseFloat(item.precio) * item.cantidad
          }))
        }
      },
      include: {
        items: {
          include: { producto: true }
        }
      }
    });

    // Actualizar stock y vaciar carrito
    for (const item of carrito.items) {
      await prisma.producto.update({
        where: { id: item.productoId },
        data: { stock: { decrement: item.cantidad } }
      });
    }

    await prisma.itemCarrito.deleteMany({
      where: { carritoId: carrito.id }
    });

    res.json({ 
      mensaje: "Pedido creado exitosamente",
      pedido 
    });
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res.status(500).json({ error: "Error al crear pedido" });
  }
});

// 🔹 Obtener pedidos del usuario
app.get("/mis-pedidos", isAuthenticated, async (req, res) => {
  const usuarioId = req.user.id;

  try {
    const pedidos = await prisma.pedido.findMany({
      where: { usuarioId },
      include: {
        items: {
          include: { producto: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(pedidos);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});
// RUTAS DE PERFIL DE USUARIO
// ========================================

// 🔹 Obtener perfil del usuario
app.get("/api/user/profile", isAuthenticated, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        nombre: true,
        apellido: true,
        telefono: true,
        fotoPerfil: true,
        emailVerificado: true,
        rol: true,
        createdAt: true,
        cliente: {
          select: {
            direccion: true,
            ciudad: true,
            codigoPostal: true,
            pais: true
          }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// 🔹 Actualizar información personal
app.put("/api/user/update-profile", isAuthenticated, async (req, res) => {
  const { nombre, apellido, telefono } = req.body;

  try {
    const usuario = await prisma.usuario.update({
      where: { id: req.user.id },
      data: {
        nombre: nombre || null,
        apellido: apellido || null,
        telefono: telefono || null
      },
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true
      }
    });

    res.json({
      message: "Perfil actualizado correctamente",
      user: usuario
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
});

// 🔹 Cambiar contraseña
app.put("/api/user/change-password", isAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Obtener usuario actual
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id }
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(currentPassword, usuario.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "La contraseña actual es incorrecta" });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ message: "Error al cambiar contraseña" });
  }
});

// 🔹 Actualizar dirección
app.put("/api/user/update-address", isAuthenticated, async (req, res) => {
  const { direccion, ciudad, codigoPostal, pais } = req.body;

  try {
    // Verificar si ya existe un cliente asociado
    const clienteExistente = await prisma.cliente.findUnique({
      where: { usuarioId: req.user.id }
    });

    if (clienteExistente) {
      // Actualizar cliente existente
      await prisma.cliente.update({
        where: { usuarioId: req.user.id },
        data: {
          direccion: direccion || null,
          ciudad: ciudad || null,
          codigoPostal: codigoPostal || null,
          pais: pais || "Colombia"
        }
      });
    } else {
      // Crear nuevo cliente
      await prisma.cliente.create({
        data: {
          usuarioId: req.user.id,
          direccion: direccion || null,
          ciudad: ciudad || null,
          codigoPostal: codigoPostal || null,
          pais: pais || "Colombia"
        }
      });
    }

    res.json({ message: "Dirección actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar dirección:", error);
    res.status(500).json({ message: "Error al actualizar dirección" });
  }
});

// 🔹 Subir foto de perfil
app.post("/api/user/upload-photo", isAuthenticated, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se ha enviado ningún archivo" });
    }

    // Obtener usuario actual
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { fotoPerfil: true }
    });

    // Eliminar foto anterior si existe
    if (usuario.fotoPerfil) {
      const oldPhotoPath = path.join(__dirname, usuario.fotoPerfil);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Guardar ruta relativa de la nueva foto
    const photoPath = `/uploads/profiles/${req.file.filename}`;

    // Actualizar base de datos
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { fotoPerfil: photoPath }
    });

    res.json({ 
      message: "Foto actualizada correctamente",
      photoUrl: photoPath
    });
  } catch (error) {
    console.error("Error al subir foto:", error);
    // Si hubo error, eliminar el archivo subido
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Error al subir la foto" });
  }
});

// 🔹 Eliminar foto de perfil
app.delete("/api/user/remove-photo", isAuthenticated, async (req, res) => {
  try {
    // Obtener usuario actual
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { fotoPerfil: true }
    });

    if (!usuario.fotoPerfil) {
      return res.status(400).json({ message: "No hay foto para eliminar" });
    }

    // Eliminar archivo físico
    const photoPath = path.join(__dirname, usuario.fotoPerfil);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Actualizar base de datos
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { fotoPerfil: null }
    });

    res.json({ message: "Foto eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar foto:", error);
    res.status(500).json({ message: "Error al eliminar la foto" });
  }
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});

// Cerrar Prisma al terminar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});