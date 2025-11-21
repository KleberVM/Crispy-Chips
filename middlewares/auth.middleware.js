// Middleware de autenticación
const isAuthenticated = (req, res, next) => {
  console.log('🔐 isAuthenticated middleware');
  console.log('   - URL:', req.url);
  console.log('   - Method:', req.method);
  console.log('   - req.isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : 'N/A');
  console.log('   - req.user:', req.user);
  console.log('   - req.session:', req.session);
  
  if (req.isAuthenticated()) {
    console.log('✅ Usuario autenticado, continuando...');
    return next();
  }
  console.log('❌ Usuario NO autenticado, devolviendo 401');
  res.status(401).json({ message: "No autorizado" });
};

// Middleware para verificar que el usuario sea ADMIN
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.rol === 'ADMIN') {
    return next();
  }
  res.status(403).json({ message: "Acceso denegado. Solo administradores pueden realizar esta acción" });
};

// Middleware para verificar que el usuario sea dueño del producto o ADMIN
const isProductOwner = (prisma) => async (req, res, next) => {
  try {
    const productoId = parseInt(req.params.id);
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      select: { vendedorId: true }
    });

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (producto.vendedorId === req.user.id || req.user.rol === 'ADMIN') {
      return next();
    }

    res.status(403).json({ message: "No tienes permiso para modificar este producto" });
  } catch (error) {
    res.status(500).json({ message: "Error al verificar permisos" });
  }
};

// Middleware para verificar que el usuario solo pueda editar su propio perfil (o ser ADMIN)
const isOwnerOrAdmin = (req, res, next) => {
  const userId = parseInt(req.params.id);
  
  // Si es ADMIN, puede editar cualquier perfil
  if (req.user.rol === 'ADMIN') {
    return next();
  }
  
  // Si no es ADMIN, solo puede editar su propio perfil
  if (req.user.id === userId) {
    return next();
  }
  
  res.status(403).json({ message: "No tienes permiso para modificar este perfil" });
};

// Middleware para verificar que el usuario solo pueda ver/editar su propio perfil
const isOwner = (req, res, next) => {
  const userId = parseInt(req.params.id);
  
  // Solo puede acceder a su propio perfil
  if (req.user.id === userId) {
    return next();
  }
  
  res.status(403).json({ message: "No tienes permiso para acceder a este perfil" });
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isProductOwner,
  isOwnerOrAdmin,
  isOwner
};
