const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificacionesService = require('./notificaciones.service');

class PedidosService {
  // Crear pedido con comprobante
  async crearPedido(usuarioId, vendedorId, carritoData, comprobantePath, totales) {
    try {
      // Crear el pedido
      const pedido = await prisma.pedido.create({
        data: {
          usuarioId: usuarioId,
          vendedorId: vendedorId,
          subtotal: parseFloat(totales.subtotal),
          envio: parseFloat(totales.envio),
          total: parseFloat(totales.total),
          comprobantePago: comprobantePath,
          estado: 'PENDIENTE',
          items: {
            create: carritoData.items.map(item => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              precio: parseFloat(item.precio),
              subtotal: parseFloat(item.precio) * item.cantidad
            }))
          }
        },
        include: {
          items: {
            include: {
              producto: true
            }
          },
          usuario: {
            select: {
              id: true,
              username: true,
              email: true,
              nombre: true,
              apellido: true
            }
          }
        }
      });

      // Vaciar el carrito después de crear el pedido
      await prisma.itemCarrito.deleteMany({
        where: {
          carrito: {
            usuarioId: usuarioId
          }
        }
      });

      // Crear notificación para el vendedor
      const nombreCliente = pedido.usuario.nombre && pedido.usuario.apellido
        ? `${pedido.usuario.nombre} ${pedido.usuario.apellido}`
        : pedido.usuario.username;

      const cantidadProductos = pedido.items.reduce((sum, item) => sum + item.cantidad, 0);

      await notificacionesService.crearNotificacion(
        vendedorId,
        'NUEVA_VENTA',
        '🛒 Nueva Venta Realizada',
        `${nombreCliente} realizó una compra de ${cantidadProductos} producto(s) por Bs. ${parseFloat(totales.total).toFixed(2)}. Pedido #${pedido.id}`,
        pedido.id
      );

      return pedido;
    } catch (error) {
      console.error('Error al crear pedido:', error);
      throw new Error('Error al crear el pedido');
    }
  }

  // Obtener pedidos del vendedor (para Mis Ventas)
  async obtenerPedidosVendedor(vendedorId, filtros = {}) {
    try {
      const where = {
        vendedorId: vendedorId
      };

      if (filtros.estado) {
        where.estado = filtros.estado;
      }

      const pedidos = await prisma.pedido.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              email: true,
              nombre: true,
              apellido: true
            }
          },
          items: {
            include: {
              producto: {
                select: {
                  id: true,
                  nombre: true,
                  precio: true,
                  imagen: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return pedidos;
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      throw new Error('Error al obtener pedidos');
    }
  }

  // Obtener detalle de un pedido específico
  async obtenerPedidoPorId(pedidoId, vendedorId) {
    try {
      const pedido = await prisma.pedido.findFirst({
        where: {
          id: pedidoId,
          vendedorId: vendedorId
        },
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              email: true,
              nombre: true,
              apellido: true,
              telefono: true
            }
          },
          items: {
            include: {
              producto: true
            }
          }
        }
      });

      if (!pedido) {
        throw new Error('Pedido no encontrado');
      }

      return pedido;
    } catch (error) {
      console.error('Error al obtener pedido:', error);
      throw error;
    }
  }

  // Cambiar estado del pedido
  async cambiarEstado(pedidoId, vendedorId, nuevoEstado) {
    try {
      // Verificar que el pedido pertenece al vendedor
      const pedido = await prisma.pedido.findFirst({
        where: {
          id: pedidoId,
          vendedorId: vendedorId
        }
      });

      if (!pedido) {
        throw new Error('Pedido no encontrado o no autorizado');
      }

      // Actualizar estado
      const pedidoActualizado = await prisma.pedido.update({
        where: { id: pedidoId },
        data: { estado: nuevoEstado },
        include: {
          usuario: {
            select: {
              username: true,
              email: true
            }
          }
        }
      });

      return pedidoActualizado;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      throw error;
    }
  }

  // Obtener estadísticas del vendedor
  async obtenerEstadisticas(vendedorId) {
    try {
      const totalPedidos = await prisma.pedido.count({
        where: { vendedorId }
      });

      const pendientes = await prisma.pedido.count({
        where: { vendedorId, estado: 'PENDIENTE' }
      });

      const completados = await prisma.pedido.count({
        where: { vendedorId, estado: 'ENTREGADO' }
      });

      return {
        totalPedidos,
        pendientes,
        completados
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error('Error al obtener estadísticas');
    }
  }
}

module.exports = new PedidosService();
