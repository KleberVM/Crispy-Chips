const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Estrategia local de Passport (username y password)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        // Buscar usuario por email o username
        const usuario = await prisma.usuario.findFirst({
          where: {
            OR: [
              { email: email },
              { username: email }
            ]
          }
        });

        if (!usuario) {
          return done(null, false, { message: 'Usuario no encontrado' });
        }

        if (!usuario.activo) {
          return done(null, false, { message: 'Cuenta desactivada' });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, usuario.password);

        if (!passwordMatch) {
          return done(null, false, { message: 'Contraseña incorrecta' });
        }

        // Si la autenticación es exitosa
        return done(null, usuario);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serializar usuario (guardar en sesión)
passport.serializeUser((usuario, done) => {
  done(null, usuario.id);
});

// Deserializar usuario (recuperar de sesión)
passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        nombre: true,
        apellido: true,
        rol: true,
        emailVerificado: true
      }
    });
    done(null, usuario);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
