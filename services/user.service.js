const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

class UserService {
  // Obtener perfil del usuario
  async obtenerPerfil(usuarioId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        email: true,
        username: true,
        nombre: true,
        apellido: true,
        telefono: true,
        fotoPerfil: true,
        emailVerificado: true,
        rol: true,
        createdAt: true,
        cliente: {
          select: {
            direccion: true,
            ciudad: true,
            codigoPostal: true,
            pais: true
          }
        }
      }
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    return usuario;
  }

  // Actualizar perfil
  async actualizarPerfil(usuarioId, data) {
    const { nombre, apellido, telefono } = data;

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nombre: nombre || null,
        apellido: apellido || null,
        telefono: telefono || null
      },
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true
      }
    });

    return usuario;
  }

  // Cambiar contraseña
  async cambiarPassword(usuarioId, currentPassword, newPassword) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    const passwordMatch = await bcrypt.compare(currentPassword, usuario.password);

    if (!passwordMatch) {
      throw new Error("La contraseña actual es incorrecta");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { password: hashedPassword }
    });

    return true;
  }

  // Subir foto de perfil
  async subirFoto(usuarioId, file) {
    if (!file) {
      throw new Error("No se ha enviado ningún archivo");
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { fotoPerfil: true }
    });

    // Eliminar foto anterior si existe
    if (usuario.fotoPerfil) {
      const oldPhotoPath = path.join(__dirname, '..', usuario.fotoPerfil);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    const photoPath = `/uploads/profiles/${file.filename}`;

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { fotoPerfil: photoPath }
    });

    return photoPath;
  }

  // Eliminar foto de perfil
  async eliminarFoto(usuarioId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { fotoPerfil: true }
    });

    if (!usuario.fotoPerfil) {
      throw new Error("No hay foto para eliminar");
    }

    const photoPath = path.join(__dirname, '..', usuario.fotoPerfil);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { fotoPerfil: null }
    });

    return true;
  }

  // Subir QR de pago
  async subirQr(usuarioId, file) {
    if (!file) {
      throw new Error("No se proporcionó archivo");
    }

    // Eliminar QR anterior si existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { qrPago: true }
    });

    if (usuario.qrPago) {
      const oldQrPath = path.join(__dirname, '..', usuario.qrPago);
      if (fs.existsSync(oldQrPath)) {
        fs.unlinkSync(oldQrPath);
      }
    }

    // Guardar nuevo QR
    const qrPath = `/uploads/qr/${file.filename}`;
    
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { qrPago: qrPath }
    });

    return qrPath;
  }

  // Eliminar QR de pago
  async eliminarQr(usuarioId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { qrPago: true }
    });

    if (!usuario.qrPago) {
      throw new Error("No hay QR para eliminar");
    }

    const qrPath = path.join(__dirname, '..', usuario.qrPago);
    if (fs.existsSync(qrPath)) {
      fs.unlinkSync(qrPath);
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { qrPago: null }
    });

    return true;
  }

  // Obtener QR de un vendedor
  async obtenerQrVendedor(vendedorId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: vendedorId },
      select: { qrPago: true, rol: true }
    });

    if (!usuario) {
      throw new Error("Vendedor no encontrado");
    }

    return usuario.qrPago || null;
  }
}

module.exports = new UserService();
