const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');

// Registrar usuario
router.post('/register', authController.registrar);

// Verificar email
router.get('/verificar-email/:token', authController.verificarEmail);

// Login
router.post('/login', authController.login);

// Logout
router.post('/logout', authController.logout);

// Obtener usuario actual
router.get('/me', isAuthenticated, authController.me);

// Solicitar restablecimiento de contraseña
router.post('/forgot-password', authController.solicitarResetPassword);

// Restablecer contraseña
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
