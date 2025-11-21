const usuariosService = require('../services/usuarios.service');

class UsuariosController {
  // Listar todos los usuarios
  async listar(req, res) {
    try {
      const resultado = await usuariosService.listarUsuarios(req.query);
      
      res.json(resultado);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  }

  // Obtener un usuario por ID
  async obtenerPorId(req, res) {
    try {
      const usuario = await usuariosService.obtenerUsuarioPorId(req.params.id);
      
      res.json({ usuario });
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      res.status(404).json({ message: error.message || "Usuario no encontrado" });
    }
  }

  // Actualizar usuario
  async actualizar(req, res) {
    try {
      const usuario = await usuariosService.actualizarUsuario(req.params.id, req.body);
      
      res.json({
        message: "Usuario actualizado exitosamente",
        usuario
      });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // Cambiar rol
  async cambiarRol(req, res) {
    try {
      const { rol } = req.body;
      
      if (!rol) {
        return res.status(400).json({ message: "Rol es requerido" });
      }
      
      const usuario = await usuariosService.cambiarRol(req.params.id, rol);
      
      res.json({
        message: "Rol cambiado exitosamente",
        usuario
      });
    } catch (error) {
      console.error("Error al cambiar rol:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // Eliminar usuario
  async eliminar(req, res) {
    try {
      await usuariosService.eliminarUsuario(req.params.id);
      
      res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new UsuariosController();
