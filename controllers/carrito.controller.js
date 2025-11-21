const carritoService = require('../services/carrito.service');

class CarritoController {
  // Agregar producto al carrito
  async agregar(req, res) {
    try {
      const { productoId, cantidad } = req.body;
      const usuarioId = req.user?.id;
      const sessionId = req.sessionID;

      await carritoService.agregarProducto(usuarioId, sessionId, productoId, cantidad);

      res.json({ mensaje: "Producto agregado al carrito" });
    } catch (error) {
      console.error("Error al agregar al carrito:", error);
      const statusCode = error.message === "Producto no encontrado" ? 404 : 400;
      res.status(statusCode).json({ error: error.message });
    }
  }

  // Obtener carrito
  async obtener(req, res) {
    try {
      const usuarioId = req.user?.id;
      const sessionId = req.sessionID;

      const carrito = await carritoService.obtenerCarrito(usuarioId, sessionId);

      res.json(carrito);
    } catch (error) {
      console.error("Error al obtener carrito:", error);
      res.status(500).json({ error: "Error al obtener carrito" });
    }
  }

  // Actualizar cantidad
  async actualizarCantidad(req, res) {
    try {
      const { itemId } = req.params;
      const { cantidad } = req.body;

      await carritoService.actualizarCantidad(itemId, cantidad);

      res.json({ mensaje: "Cantidad actualizada" });
    } catch (error) {
      console.error("Error al actualizar item:", error);
      res.status(500).json({ error: "Error al actualizar cantidad" });
    }
  }

  // Eliminar item
  async eliminarItem(req, res) {
    try {
      const { itemId } = req.params;

      await carritoService.eliminarItem(itemId);

      res.json({ mensaje: "Producto eliminado del carrito" });
    } catch (error) {
      console.error("Error al eliminar item:", error);
      res.status(500).json({ error: "Error al eliminar producto" });
    }
  }

  // Vaciar carrito
  async vaciar(req, res) {
    try {
      const usuarioId = req.user?.id;
      const sessionId = req.sessionID;

      await carritoService.vaciarCarrito(usuarioId, sessionId);

      res.json({ mensaje: "Carrito vaciado" });
    } catch (error) {
      console.error("Error al vaciar carrito:", error);
      res.status(500).json({ error: "Error al vaciar carrito" });
    }
  }
}

module.exports = new CarritoController();
