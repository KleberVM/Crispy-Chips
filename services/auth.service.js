const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { generateVerificationToken, sendVerificationEmail, sendPasswordResetEmail } = require("../utils/mailer");

const prisma = new PrismaClient();

class AuthService {
  async registrarUsuario(data) {
    const { email, username, password, nombre, apellido } = data;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      const mensaje = existingUser.email === email 
        ? "El correo electrónico ya está registrado" 
        : "El nombre de usuario ya existe";
      throw new Error(mensaje);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generar token de verificación
    const verificationToken = generateVerificationToken();

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email,
        username,
        password: hashedPassword,
        nombre: nombre || null,
        apellido: apellido || null,
        tokenVerificacion: verificationToken,
        emailVerificado: false
      }
    });

    // Enviar correo de verificación
    await sendVerificationEmail(email, username, verificationToken);

    return {
      message: "Cuenta creada con éxito. Verifica tu correo electrónico para activar tu cuenta.",
      userId: usuario.id
    };
  }

  async verificarEmail(token) {
    const usuario = await prisma.usuario.findFirst({
      where: { tokenVerificacion: token }
    });

    if (!usuario) {
      throw new Error("Token inválido o expirado");
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        emailVerificado: true,
        tokenVerificacion: null
      }
    });

    return { message: "Email verificado correctamente. Ya puedes iniciar sesión." };
  }

  async solicitarResetPassword(email) {
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      // Por seguridad, no revelar si el email existe
      return { message: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña" };
    }

    const resetToken = generateVerificationToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      }
    });

    await sendPasswordResetEmail(email, usuario.username, resetToken);

    return { message: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña" };
  }

  async resetPassword(token, newPassword) {
    const usuario = await prisma.usuario.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!usuario) {
      throw new Error("Token inválido o expirado");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return { message: "Contraseña actualizada correctamente" };
  }
}

module.exports = new AuthService();
