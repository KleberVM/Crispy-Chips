const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');
const { isAuthenticated, isAdmin, isProductOwner } = require('../middlewares/auth.middleware');
const { uploadProduct } = require('../config/multer.config');
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ========================================
// RUTAS PÚBLICAS
// ========================================

// Listar productos con paginación
router.get('/', productosController.listar);

// Obtener categorías
router.get('/categorias', productosController.obtenerCategorias);

// ========================================
// RUTAS PROTEGIDAS (ADMIN)
// ========================================

// Obtener productos del vendedor
router.get('/mis-productos', isAdmin, productosController.obtenerMisProductos);

// Crear producto
router.post('/', isAdmin, productosController.crear);

// ========================================
// RUTAS PROTEGIDAS (OWNER O ADMIN)
// ========================================

// Obtener un producto por ID
router.get('/:id', isAuthenticated, productosController.obtenerPorId);

// Actualizar producto
router.put('/:id', isAuthenticated, isProductOwner(prisma), productosController.actualizar);

// Eliminar producto
router.delete('/:id', isAuthenticated, isProductOwner(prisma), productosController.eliminar);

// Subir imagen de producto
router.post('/:id/upload-image', isAuthenticated, isProductOwner(prisma), uploadProduct.single('image'), productosController.subirImagen);

// Eliminar imagen de producto
router.delete('/:id/remove-image', isAuthenticated, isProductOwner(prisma), productosController.eliminarImagen);

module.exports = router;
