const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

// ========================================
// TODAS LAS RUTAS REQUIEREN SER ADMIN
// ========================================

// Listar todos los usuarios
router.get('/', isAdmin, usuariosController.listar);

// Obtener un usuario por ID
router.get('/:id', isAdmin, usuariosController.obtenerPorId);

// Actualizar usuario
router.put('/:id', isAdmin, usuariosController.actualizar);

// Cambiar rol de usuario
router.put('/:id/rol', isAdmin, usuariosController.cambiarRol);

// Eliminar usuario
router.delete('/:id', isAdmin, usuariosController.eliminar);

module.exports = router;
