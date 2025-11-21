const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

class ProductosService {
  // Crear producto
  async crearProducto(data, vendedorId) {
    // Validaciones
    if (!data.nombre || !data.precio) {
      throw new Error("Nombre y precio son requeridos");
    }

    if (data.precio <= 0) {
      throw new Error("El precio debe ser mayor a 0");
    }

    // Verificar SKU único si se proporciona
    if (data.sku) {
      const skuExistente = await prisma.producto.findUnique({
        where: { sku: data.sku }
      });

      if (skuExistente) {
        throw new Error("El SKU ya existe");
      }
    }

    // Crear producto
    const producto = await prisma.producto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        precio: parseFloat(data.precio),
        stock: data.stock ? parseInt(data.stock) : 0,
        categoriaId: data.categoriaId ? parseInt(data.categoriaId) : null,
        vendedorId: vendedorId,
        sku: data.sku || null,
        destacado: data.destacado === true || data.destacado === 'true',
        activo: true
      },
      include: {
        categoria: true,
        vendedor: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      }
    });

    return producto;
  }

  // Actualizar producto
  async actualizarProducto(id, data) {
    // Validaciones
    if (data.precio && data.precio <= 0) {
      throw new Error("El precio debe ser mayor a 0");
    }

    if (data.stock && data.stock < 0) {
      throw new Error("El stock no puede ser negativo");
    }

    // Verificar SKU único si se cambia
    if (data.sku) {
      const skuExistente = await prisma.producto.findFirst({
        where: {
          sku: data.sku,
          NOT: { id: parseInt(id) }
        }
      });

      if (skuExistente) {
        throw new Error("El SKU ya existe");
      }
    }

    // Construir objeto de actualización
    const updateData = {};
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.precio) updateData.precio = parseFloat(data.precio);
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    if (data.categoriaId) updateData.categoriaId = parseInt(data.categoriaId);
    if (data.sku) updateData.sku = data.sku;
    if (data.destacado !== undefined) updateData.destacado = data.destacado === true || data.destacado === 'true';
    if (data.activo !== undefined) updateData.activo = data.activo === true || data.activo === 'true';

    // Actualizar producto
    const producto = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        categoria: true,
        vendedor: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      }
    });

    return producto;
  }

  // Eliminar producto
  async eliminarProducto(id) {
    // Obtener producto para eliminar su imagen
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      select: { imagen: true }
    });

    if (!producto) {
      throw new Error("Producto no encontrado");
    }

    // Eliminar imagen si existe
    if (producto.imagen) {
      const imagePath = path.join(__dirname, '..', producto.imagen);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Eliminar producto
    await prisma.producto.delete({
      where: { id: parseInt(id) }
    });

    return true;
  }

  // Obtener productos del vendedor con paginación
  async obtenerProductosVendedor(vendedorId, filtros = {}) {
    const { page = 1, limit = 12, buscar, categoriaId, destacado } = filtros;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir filtros
    const where = {
      vendedorId: vendedorId,
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar } },
          { descripcion: { contains: buscar } }
        ]
      }),
      ...(categoriaId && { categoriaId: parseInt(categoriaId) }),
      ...(destacado !== undefined && { destacado: destacado === 'true' })
    };

    // Obtener productos con paginación
    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: {
          categoria: true,
          _count: {
            select: { detalles: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.producto.count({ where })
    ]);

    return {
      productos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // Listar productos con paginación (público)
  async listarProductos(filtros = {}) {
    const { page = 1, limit = 12, buscar, categoriaId, destacado, ordenar = 'recientes' } = filtros;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir filtros
    const where = {
      activo: true,
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar } },
          { descripcion: { contains: buscar } }
        ]
      }),
      ...(categoriaId && { categoriaId: parseInt(categoriaId) }),
      ...(destacado !== undefined && { destacado: destacado === 'true' })
    };

    // Determinar ordenamiento
    let orderBy = {};
    switch (ordenar) {
      case 'precio_asc':
        orderBy = { precio: 'asc' };
        break;
      case 'precio_desc':
        orderBy = { precio: 'desc' };
        break;
      case 'nombre':
        orderBy = { nombre: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Obtener productos con paginación
    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: {
          categoria: true,
          vendedor: {
            select: {
              id: true,
              username: true,
              nombre: true
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.producto.count({ where })
    ]);

    return {
      productos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // Obtener un producto por ID
  async obtenerProductoPorId(id) {
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
        vendedor: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      }
    });

    if (!producto) {
      throw new Error("Producto no encontrado");
    }

    return producto;
  }

  // Subir imagen de producto
  async subirImagen(id, file) {
    if (!file) {
      throw new Error("No se ha enviado ningún archivo");
    }

    // Obtener producto actual
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      select: { imagen: true }
    });

    if (!producto) {
      // Eliminar archivo subido
      fs.unlinkSync(file.path);
      throw new Error("Producto no encontrado");
    }

    // Eliminar imagen anterior si existe
    if (producto.imagen) {
      const oldImagePath = path.join(__dirname, '..', producto.imagen);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Guardar ruta relativa de la nueva imagen
    const imagePath = `/uploads/productos/${file.filename}`;

    // Actualizar base de datos
    await prisma.producto.update({
      where: { id: parseInt(id) },
      data: { imagen: imagePath }
    });

    return imagePath;
  }

  // Eliminar imagen de producto
  async eliminarImagen(id) {
    // Obtener producto actual
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      select: { imagen: true }
    });

    if (!producto) {
      throw new Error("Producto no encontrado");
    }

    if (!producto.imagen) {
      throw new Error("No hay imagen para eliminar");
    }

    // Eliminar archivo físico
    const imagePath = path.join(__dirname, '..', producto.imagen);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Actualizar base de datos
    await prisma.producto.update({
      where: { id: parseInt(id) },
      data: { imagen: null }
    });

    return true;
  }

  // Obtener categorías
  async obtenerCategorias() {
    const categorias = await prisma.categoria.findMany({
      where: { activo: true },
      include: {
        _count: {
          select: { productos: { where: { activo: true } } }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    return categorias;
  }
}

module.exports = new ProductosService();
