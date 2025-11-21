const notificacionesService = require('../services/notificaciones.service');

class NotificacionesController {
  // Obtener notificaciones del usuario
  async obtenerNotificaciones(req, res) {
    try {
      const usuarioId = req.user.id;
      const { soloNoLeidas } = req.query;

      const notificaciones = await notificacionesService.obtenerNotificaciones(
        usuarioId,
        soloNoLeidas === 'true'
      );

      res.json({ notificaciones });

    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Contar notificaciones no leídas
  async contarNoLeidas(req, res) {
    try {
      const usuarioId = req.user.id;

      const count = await notificacionesService.contarNoLeidas(usuarioId);

      res.json({ count });

    } catch (error) {
      console.error('Error al contar notificaciones:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Marcar notificación como leída
  async marcarComoLeida(req, res) {
    try {
      const usuarioId = req.user.id;
      const { notificacionId } = req.params;

      await notificacionesService.marcarComoLeida(parseInt(notificacionId), usuarioId);

      res.json({ message: 'Notificación marcada como leída' });

    } catch (error) {
      console.error('Error al marcar notificación:', error);
      const status = error.message === 'Notificación no encontrada' ? 404 : 500;
      res.status(status).json({ message: error.message });
    }
  }

  // Marcar todas como leídas
  async marcarTodasComoLeidas(req, res) {
    try {
      const usuarioId = req.user.id;

      await notificacionesService.marcarTodasComoLeidas(usuarioId);

      res.json({ message: 'Todas las notificaciones marcadas como leídas' });

    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Eliminar notificación
  async eliminarNotificacion(req, res) {
    try {
      const usuarioId = req.user.id;
      const { notificacionId } = req.params;

      await notificacionesService.eliminarNotificacion(parseInt(notificacionId), usuarioId);

      res.json({ message: 'Notificación eliminada' });

    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      const status = error.message === 'Notificación no encontrada' ? 404 : 500;
      res.status(status).json({ message: error.message });
    }
  }
}

module.exports = new NotificacionesController();
