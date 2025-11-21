const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class UsuariosService {
  // Listar todos los usuarios (solo ADMIN)
  async listarUsuarios(filtros = {}) {
    const { page = 1, limit = 12, buscar, rol, verificado } = filtros;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir filtros
    const where = {
      ...(buscar && {
        OR: [
          { username: { contains: buscar } },
          { email: { contains: buscar } },
          { nombre: { contains: buscar } },
          { apellido: { contains: buscar } }
        ]
      }),
      ...(rol && { rol: rol }),
      ...(verificado !== undefined && { emailVerificado: verificado === 'true' })
    };

    // Obtener usuarios con paginación
    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          nombre: true,
          apellido: true,
          rol: true,
          emailVerificado: true,
          fotoPerfil: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.usuario.count({ where })
    ]);

    return {
      usuarios,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // Obtener un usuario por ID
  async obtenerUsuarioPorId(id) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        emailVerificado: true,
        fotoPerfil: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    return usuario;
  }

  // Actualizar usuario (solo ADMIN puede editar)
  async actualizarUsuario(id, data) {
    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    // No permitir editar ADMIN
    if (usuario.rol === 'ADMIN') {
      throw new Error("No puedes editar usuarios ADMIN");
    }

    // Validar email único si se cambia
    if (data.email && data.email !== usuario.email) {
      const emailExistente = await prisma.usuario.findUnique({
        where: { email: data.email }
      });

      if (emailExistente) {
        throw new Error("El email ya está en uso");
      }
    }

    // Validar username único si se cambia
    if (data.username && data.username !== usuario.username) {
      const usernameExistente = await prisma.usuario.findUnique({
        where: { username: data.username }
      });

      if (usernameExistente) {
        throw new Error("El username ya está en uso");
      }
    }

    // Construir objeto de actualización
    const updateData = {};
    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.apellido !== undefined) updateData.apellido = data.apellido;
    if (data.emailVerificado !== undefined) updateData.emailVerificado = data.emailVerificado === true || data.emailVerificado === 'true';

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        emailVerificado: true,
        fotoPerfil: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return usuarioActualizado;
  }

  // Cambiar rol de usuario
  async cambiarRol(id, nuevoRol) {
    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    // No permitir cambiar rol de ADMIN
    if (usuario.rol === 'ADMIN') {
      throw new Error("No puedes cambiar el rol de un ADMIN");
    }

    // Validar que el rol es válido
    if (nuevoRol !== 'ADMIN' && nuevoRol !== 'CLIENTE') {
      throw new Error("Rol inválido. Debe ser ADMIN o CLIENTE");
    }

    // Actualizar rol
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { rol: nuevoRol },
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        emailVerificado: true,
        fotoPerfil: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return usuarioActualizado;
  }

  // Eliminar usuario
  async eliminarUsuario(id) {
    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    // No permitir eliminar ADMIN
    if (usuario.rol === 'ADMIN') {
      throw new Error("No puedes eliminar usuarios ADMIN");
    }

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id: parseInt(id) }
    });

    return { message: "Usuario eliminado correctamente" };
  }
}

module.exports = new UsuariosService();
