const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NotificacionesService {
  // Crear notificación
  async crearNotificacion(usuarioId, tipo, titulo, mensaje, pedidoId = null) {
    try {
      const notificacion = await prisma.notificacion.create({
        data: {
          usuarioId,
          tipo,
          titulo,
          mensaje,
          pedidoId,
          leida: false
        }
      });

      return notificacion;
    } catch (error) {
      console.error('Error al crear notificación:', error);
      throw new Error('Error al crear notificación');
    }
  }

  // Obtener notificaciones del usuario
  async obtenerNotificaciones(usuarioId, soloNoLeidas = false) {
    try {
      const where = {
        usuarioId
      };

      if (soloNoLeidas) {
        where.leida = false;
      }

      const notificaciones = await prisma.notificacion.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Últimas 50 notificaciones
      });

      return notificaciones;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw new Error('Error al obtener notificaciones');
    }
  }

  // Marcar notificación como leída
  async marcarComoLeida(notificacionId, usuarioId) {
    try {
      // Verificar que la notificación pertenece al usuario
      const notificacion = await prisma.notificacion.findFirst({
        where: {
          id: notificacionId,
          usuarioId
        }
      });

      if (!notificacion) {
        throw new Error('Notificación no encontrada');
      }

      const notificacionActualizada = await prisma.notificacion.update({
        where: { id: notificacionId },
        data: { leida: true }
      });

      return notificacionActualizada;
    } catch (error) {
      console.error('Error al marcar notificación:', error);
      throw error;
    }
  }

  // Marcar todas como leídas
  async marcarTodasComoLeidas(usuarioId) {
    try {
      await prisma.notificacion.updateMany({
        where: {
          usuarioId,
          leida: false
        },
        data: {
          leida: true
        }
      });

      return true;
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      throw new Error('Error al marcar notificaciones como leídas');
    }
  }

  // Contar notificaciones no leídas
  async contarNoLeidas(usuarioId) {
    try {
      const count = await prisma.notificacion.count({
        where: {
          usuarioId,
          leida: false
        }
      });

      return count;
    } catch (error) {
      console.error('Error al contar notificaciones:', error);
      return 0;
    }
  }

  // Eliminar notificación
  async eliminarNotificacion(notificacionId, usuarioId) {
    try {
      // Verificar que la notificación pertenece al usuario
      const notificacion = await prisma.notificacion.findFirst({
        where: {
          id: notificacionId,
          usuarioId
        }
      });

      if (!notificacion) {
        throw new Error('Notificación no encontrada');
      }

      await prisma.notificacion.delete({
        where: { id: notificacionId }
      });

      return true;
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      throw error;
    }
  }
}

module.exports = new NotificacionesService();
