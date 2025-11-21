const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');
const { uploadProfile, uploadQr } = require('../config/multer.config');

// Obtener perfil del usuario
router.get('/profile', isAuthenticated, userController.obtenerPerfil);

// Actualizar información personal
router.put('/update-profile', isAuthenticated, userController.actualizarPerfil);

// Cambiar contraseña
router.put('/change-password', isAuthenticated, userController.cambiarPassword);

// Subir foto de perfil
router.post('/upload-photo', isAuthenticated, uploadProfile.single('photo'), userController.subirFoto);

// Eliminar foto de perfil
router.delete('/remove-photo', isAuthenticated, userController.eliminarFoto);

// Subir QR de pago
router.post('/upload-qr', isAuthenticated, uploadQr.single('qr'), userController.subirQr);

// Eliminar QR de pago
router.delete('/remove-qr', isAuthenticated, userController.eliminarQr);

// Obtener QR de un vendedor (público para clientes)
router.get('/:vendedorId/qr', isAuthenticated, userController.obtenerQrVendedor);

module.exports = router;
