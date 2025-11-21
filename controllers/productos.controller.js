const productosService = require('../services/productos.service');
const fs = require('fs');

class ProductosController {
  // Crear producto
  async crear(req, res) {
    try {
      const producto = await productosService.crearProducto(req.body, req.user.id);
      
      res.status(201).json({
        message: "Producto creado exitosamente",
        producto
      });
    } catch (error) {
      console.error("Error al crear producto:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // Actualizar producto
  async actualizar(req, res) {
    try {
      const producto = await productosService.actualizarProducto(req.params.id, req.body);
      
      res.json({
        message: "Producto actualizado exitosamente",
        producto
      });
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // Eliminar producto
  async eliminar(req, res) {
    try {
      await productosService.eliminarProducto(req.params.id);
      
      res.json({ message: "Producto eliminado exitosamente" });
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // Obtener productos del vendedor
  async obtenerMisProductos(req, res) {
    try {
      const resultado = await productosService.obtenerProductosVendedor(
        req.user.id,
        req.query
      );
      
      res.json(resultado);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  }

  // Listar productos (público)
  async listar(req, res) {
    try {
      const resultado = await productosService.listarProductos(req.query);
      
      res.json(resultado);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  }

  // Obtener un producto por ID
  async obtenerPorId(req, res) {
    try {
      const producto = await productosService.obtenerProductoPorId(req.params.id);
      
      res.json({ producto });
    } catch (error) {
      console.error("Error al obtener producto:", error);
      res.status(404).json({ message: error.message || "Producto no encontrado" });
    }
  }

  // Subir imagen
  async subirImagen(req, res) {
    try {
      const imagePath = await productosService.subirImagen(req.params.id, req.file);
      
      res.json({ 
        message: "Imagen actualizada correctamente",
        imageUrl: imagePath
      });
    } catch (error) {
      console.error("Error al subir imagen:", error);
      // Si hubo error, eliminar el archivo subido
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ message: error.message });
    }
  }

  // Eliminar imagen
  async eliminarImagen(req, res) {
    try {
      await productosService.eliminarImagen(req.params.id);
      
      res.json({ message: "Imagen eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // Obtener categorías
  async obtenerCategorias(req, res) {
    try {
      const categorias = await productosService.obtenerCategorias();
      
      res.json(categorias);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ message: "Error al obtener categorías" });
    }
  }
}

module.exports = new ProductosController();
