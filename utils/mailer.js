const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configurar transportador de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true para puerto 465, false para otros
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generar token de verificación
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Enviar correo de verificación
const sendVerificationEmail = async (email, username, token) => {
  const verificationUrl = `${process.env.SERVER_URL}/verificar-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@crispychips.com',
    to: email,
    subject: 'Verifica tu cuenta - Crispy Chips',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">¡Bienvenido a Crispy Chips, ${username}!</h2>
        <p>Gracias por registrarte en nuestra plataforma.</p>
        <p>Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Verificar mi correo
        </a>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p>Este enlace expirará en 24 horas.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar correo de verificación:', error);
    return { success: false, error };
  }
};

// Enviar correo de restablecimiento de contraseña
const sendPasswordResetEmail = async (email, username, token) => {
  const resetUrl = `${process.env.SERVER_URL}/restablecer-password/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@crispychips.com',
    to: email,
    subject: 'Restablece tu contraseña - Crispy Chips',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">Restablecer contraseña</h2>
        <p>Hola ${username},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Restablecer contraseña
        </a>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p>Este enlace expirará en 1 hora.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar correo de restablecimiento:', error);
    return { success: false, error };
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail
};
