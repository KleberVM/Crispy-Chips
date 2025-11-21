const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class CarritoService {
  // Agregar producto al carrito
  async agregarProducto(usuarioId, sessionId, productoId, cantidad) {
    // Buscar o crear carrito
    let carrito = await prisma.carrito.findFirst({
      where: usuarioId ? { usuarioId } : { sessionId }
    });

    if (!carrito) {
      carrito = await prisma.carrito.create({
        data: usuarioId ? { usuarioId } : { sessionId }
      });
    }

    // Obtener producto
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(productoId) }
    });

    if (!producto) {
      throw new Error("Producto no encontrado");
    }

    if (producto.stock < cantidad) {
      throw new Error("Stock insuficiente");
    }

    // Verificar si el item ya existe en el carrito
    const itemExistente = await prisma.itemCarrito.findFirst({
      where: {
        carritoId: carrito.id,
        productoId: parseInt(productoId)
      }
    });

    if (itemExistente) {
      // Actualizar cantidad
      await prisma.itemCarrito.update({
        where: { id: itemExistente.id },
        data: { cantidad: itemExistente.cantidad + parseInt(cantidad) }
      });
    } else {
      // Crear nuevo item
      await prisma.itemCarrito.create({
        data: {
          carritoId: carrito.id,
          productoId: parseInt(productoId),
          cantidad: parseInt(cantidad),
          precio: producto.precio
        }
      });
    }

    return true;
  }

  // Obtener carrito
  async obtenerCarrito(usuarioId, sessionId) {
    const carrito = await prisma.carrito.findFirst({
      where: usuarioId ? { usuarioId } : { sessionId },
      include: {
        items: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!carrito) {
      return { items: [], total: 0 };
    }

    const total = carrito.items.reduce((sum, item) => {
      return sum + (parseFloat(item.precio) * item.cantidad);
    }, 0);

    return {
      items: carrito.items,
      total: total.toFixed(2)
    };
  }

  // Actualizar cantidad de un item
  async actualizarCantidad(itemId, cantidad) {
    await prisma.itemCarrito.update({
      where: { id: parseInt(itemId) },
      data: { cantidad: parseInt(cantidad) }
    });

    return true;
  }

  // Eliminar item del carrito
  async eliminarItem(itemId) {
    await prisma.itemCarrito.delete({
      where: { id: parseInt(itemId) }
    });

    return true;
  }

  // Vaciar carrito
  async vaciarCarrito(usuarioId, sessionId) {
    const carrito = await prisma.carrito.findFirst({
      where: usuarioId ? { usuarioId } : { sessionId }
    });

    if (carrito) {
      await prisma.itemCarrito.deleteMany({
        where: { carritoId: carrito.id }
      });
    }

    return true;
  }
}

module.exports = new CarritoService();
