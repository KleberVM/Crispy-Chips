const userService = require('../services/user.service');
const fs = require('fs');

class UserController {
  // Obtener perfil
  async obtenerPerfil(req, res) {
    try {
      const usuario = await userService.obtenerPerfil(req.user.id);
      res.json(usuario);
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      res.status(404).json({ message: error.message });
    }
  }

  // Actualizar perfil
  async actualizarPerfil(req, res) {
    try {
      const usuario = await userService.actualizarPerfil(req.user.id, req.body);
      
      res.json({
        message: "Perfil actualizado correctamente",
        user: usuario
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      res.status(500).json({ message: error.message });
    }
  }

  // Cambiar contraseña
  async cambiarPassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      await userService.cambiarPassword(req.user.id, currentPassword, newPassword);
      
      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      const statusCode = error.message === "La contraseña actual es incorrecta" ? 401 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  }

  // Subir foto
  async subirFoto(req, res) {
    try {
      const photoPath = await userService.subirFoto(req.user.id, req.file);
      
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
      res.status(400).json({ message: error.message });
    }
  }

  // Eliminar foto
  async eliminarFoto(req, res) {
    try {
      await userService.eliminarFoto(req.user.id);
      
      res.json({ message: "Foto eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar foto:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // Subir QR de pago
  async subirQr(req, res) {
    try {
      const qrPath = await userService.subirQr(req.user.id, req.file);
      
      res.json({ 
        message: "QR de pago actualizado correctamente",
        qrUrl: qrPath
      });
    } catch (error) {
      console.error("Error al subir QR:", error);
      // Si hubo error, eliminar el archivo subido
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ message: error.message });
    }
  }

  // Eliminar QR de pago
  async eliminarQr(req, res) {
    try {
      await userService.eliminarQr(req.user.id);
      
      res.json({ message: "QR de pago eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar QR:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // Obtener QR de pago de un vendedor
  async obtenerQrVendedor(req, res) {
    try {
      const { vendedorId } = req.params;
      const qrPago = await userService.obtenerQrVendedor(parseInt(vendedorId));
      
      res.json({ qrPago });
    } catch (error) {
      console.error("Error al obtener QR del vendedor:", error);
      res.status(404).json({ message: error.message });
    }
  }
}

module.exports = new UserController();
