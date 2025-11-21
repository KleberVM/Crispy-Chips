const authService = require('../services/auth.service');
const passport = require('passport');

class AuthController {
  async registrar(req, res) {
    try {
      const resultado = await authService.registrarUsuario(req.body);
      res.json(resultado);
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      res.status(400).json({ message: error.message });
    }
  }

  async verificarEmail(req, res) {
    try {
      const resultado = await authService.verificarEmail(req.params.token);
      res.json(resultado);
    } catch (error) {
      console.error("Error al verificar email:", error);
      res.status(400).json({ message: error.message });
    }
  }

  login(req, res, next) {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: "Error en el servidor" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || "Credenciales incorrectas" });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error al iniciar sesión" });
        }
        
        res.json({ 
          message: "Inicio de sesión exitoso",
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            nombre: user.nombre,
            rol: user.rol
          }
        });
      });
    })(req, res, next);
  }

  logout(req, res) {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      // Destruir la sesión completamente
      req.session.destroy((err) => {
        if (err) {
          console.error("Error al destruir sesión:", err);
        }
        // Limpiar cookie de sesión
        res.clearCookie('connect.sid');
        res.json({ message: "Sesión cerrada correctamente" });
      });
    });
  }

  me(req, res) {
    res.json({ user: req.user });
  }

  async solicitarResetPassword(req, res) {
    try {
      const resultado = await authService.solicitarResetPassword(req.body.email);
      res.json(resultado);
    } catch (error) {
      console.error("Error al solicitar restablecimiento:", error);
      res.status(500).json({ message: "Error al procesar la solicitud" });
    }
  }

  async resetPassword(req, res) {
    try {
      const resultado = await authService.resetPassword(req.params.token, req.body.password);
      res.json(resultado);
    } catch (error) {
      console.error("Error al restablecer contraseña:", error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new AuthController();
