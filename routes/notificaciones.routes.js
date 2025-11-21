const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificaciones.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');

// ========================================
// RUTAS DE NOTIFICACIONES (Protegidas)
// ========================================

// Obtener notificaciones
router.get('/', isAuthenticated, notificacionesController.obtenerNotificaciones);

// Contar no leídas
router.get('/count', isAuthenticated, notificacionesController.contarNoLeidas);

// Marcar como leída
router.put('/:notificacionId/leer', isAuthenticated, notificacionesController.marcarComoLeida);

// Marcar todas como leídas
router.put('/leer-todas', isAuthenticated, notificacionesController.marcarTodasComoLeidas);

// Eliminar notificación
router.delete('/:notificacionId', isAuthenticated, notificacionesController.eliminarNotificacion);

module.exports = router;
