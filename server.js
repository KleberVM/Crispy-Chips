require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const { PrismaClient } = require("@prisma/client");

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const userRoutes = require('./routes/user.routes');
const carritoRoutes = require('./routes/carrito.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const prisma = new PrismaClient();
const app = express();

// ========================================
// CONFIGURACIÓN DE MIDDLEWARE
// ========================================

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

// ========================================
// VERIFICAR CONEXIÓN A BD
// ========================================

prisma.$connect()
  .then(() => console.log("Conectado a MySQL con Prisma"))
  .catch(err => console.error(" Error de conexión:", err));

// ========================================
// RUTAS
// ========================================

// Rutas de autenticación
app.use('/', authRoutes);

// Rutas de productos
app.use('/api/productos', productosRoutes);

// Rutas de usuario
app.use('/api/user', userRoutes);

// Rutas de carrito
app.use('/api/carrito', carritoRoutes);

// Rutas de pedidos
const pedidosRoutes = require('./routes/pedidos.routes');
app.use('/api/pedidos', pedidosRoutes);

// Rutas de notificaciones
const notificacionesRoutes = require('./routes/notificaciones.routes');
app.use('/api/notificaciones', notificacionesRoutes);

// Rutas de usuarios (solo ADMIN)
app.use('/api/usuarios', usuariosRoutes);

// Ruta legacy para agregar al carrito (usa el nuevo controlador)
const carritoController = require('./controllers/carrito.controller');
app.post("/agregar-carrito", carritoController.agregar);

// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// Cerrar Prisma al terminar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
