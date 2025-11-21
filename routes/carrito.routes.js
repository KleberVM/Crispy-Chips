const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carrito.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');

// ========================================
// RUTAS DEL CARRITO (Protegidas - Solo usuarios autenticados)
// ========================================

// Agregar producto al carrito
router.post('/agregar', isAuthenticated, carritoController.agregar);

// Obtener carrito del usuario
router.get('/', isAuthenticated, carritoController.obtener);

// Actualizar cantidad de un item en el carrito
router.put('/item/:itemId', isAuthenticated, carritoController.actualizarCantidad);

// Eliminar item del carrito
router.delete('/item/:itemId', isAuthenticated, carritoController.eliminarItem);

// Vaciar carrito completamente
router.delete('/', isAuthenticated, carritoController.vaciar);

module.exports = router;
