const pedidosService = require('../services/pedidos.service');
const carritoService = require('../services/carrito.service');

class PedidosController {
  // Crear pedido
  async crearPedido(req, res) {
    try {
      const usuarioId = req.user.id;
      const { vendedorId, subtotal, envio, total } = req.body;

      // Validar comprobante
      if (!req.file) {
        return res.status(400).json({ message: 'Comprobante de pago requerido' });
      }

      // Obtener carrito del usuario
      const carrito = await carritoService.obtenerCarrito(usuarioId);

      if (!carrito || !carrito.items || carrito.items.length === 0) {
        return res.status(400).json({ message: 'El carrito está vacío' });
      }

      const comprobantePath = `/uploads/comprobantes/${req.file.filename}`;

      const totales = {
        subtotal,
        envio,
        total
      };

      // Crear pedido
      const pedido = await pedidosService.crearPedido(
        usuarioId,
        parseInt(vendedorId),
        carrito,
        comprobantePath,
        totales
      );

      res.status(201).json({
        message: 'Pedido creado exitosamente',
        pedido
      });

    } catch (error) {
      console.error('Error al crear pedido:', error);
      res.status(500).json({ message: error.message || 'Error al crear pedido' });
    }
  }

  // Obtener pedidos del vendedor (Mis Ventas)
  async obtenerPedidosVendedor(req, res) {
    try {
      console.log('🔍 obtenerPedidosVendedor - req.user:', req.user);
      console.log('🔍 obtenerPedidosVendedor - req.isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : 'N/A');
      
      const vendedorId = req.user.id;
      console.log('🔍 VendedorId:', vendedorId);
      
      const { estado } = req.query;

      const filtros = {};
      if (estado) {
        filtros.estado = estado;
      }

      console.log('🔍 Llamando a pedidosService.obtenerPedidosVendedor con:', { vendedorId, filtros });
      const pedidos = await pedidosService.obtenerPedidosVendedor(vendedorId, filtros);
      console.log('✅ Pedidos encontrados:', pedidos.length);

      res.json({ pedidos });

    } catch (error) {
      console.error('❌ Error al obtener pedidos:', error);
      res.status(500).json({ message: error.message || 'Error al obtener pedidos' });
    }
  }

  // Obtener detalle de un pedido
  async obtenerPedido(req, res) {
    try {
      const vendedorId = req.user.id;
      const { pedidoId } = req.params;

      const pedido = await pedidosService.obtenerPedidoPorId(parseInt(pedidoId), vendedorId);

      res.json({ pedido });

    } catch (error) {
      console.error('Error al obtener pedido:', error);
      const status = error.message === 'Pedido no encontrado' ? 404 : 500;
      res.status(status).json({ message: error.message });
    }
  }

  // Cambiar estado del pedido
  async cambiarEstado(req, res) {
    try {
      const vendedorId = req.user.id;
      const { pedidoId } = req.params;
      const { estado } = req.body;

      // Validar estado
      const estadosValidos = ['PENDIENTE', 'PROCESANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: 'Estado inválido' });
      }

      const pedido = await pedidosService.cambiarEstado(parseInt(pedidoId), vendedorId, estado);

      res.json({
        message: 'Estado actualizado correctamente',
        pedido
      });

    } catch (error) {
      console.error('Error al cambiar estado:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Obtener estadísticas
  async obtenerEstadisticas(req, res) {
    try {
      const vendedorId = req.user.id;

      const estadisticas = await pedidosService.obtenerEstadisticas(vendedorId);

      res.json(estadisticas);

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new PedidosController();
