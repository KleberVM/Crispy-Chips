const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');
const { uploadComprobante } = require('../config/multer.config');

// ========================================
// RUTAS DE PEDIDOS (Protegidas)
// ========================================

// Crear pedido (CLIENTE)
router.post('/crear', isAuthenticated, uploadComprobante.single('comprobante'), pedidosController.crearPedido);

// Obtener pedidos del vendedor (ADMIN)
router.get('/ventas', isAuthenticated, pedidosController.obtenerPedidosVendedor);

// Obtener detalle de un pedido (ADMIN)
router.get('/ventas/:pedidoId', isAuthenticated, pedidosController.obtenerPedido);

// Cambiar estado del pedido (ADMIN)
router.put('/ventas/:pedidoId/estado', isAuthenticated, pedidosController.cambiarEstado);

// Obtener estadísticas (ADMIN)
router.get('/estadisticas', isAuthenticated, pedidosController.obtenerEstadisticas);

// Obtener pedidos del cliente (CLIENTE)
router.get('/mis-compras', isAuthenticated, pedidosController.obtenerMisCompras);

// Obtener detalle de un pedido del cliente (CLIENTE)
router.get('/mis-compras/:pedidoId', isAuthenticated, pedidosController.obtenerDetalleCompra);

module.exports = router;
