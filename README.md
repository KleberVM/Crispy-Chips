# 🍟 Crispy Chips - Plataforma de Ventas

Plataforma de e-commerce para venta de productos con autenticación por correo electrónico, carrito de compras y gestión de pedidos.

## 🚀 Características

- ✅ **Autenticación completa** con Passport.js
- ✅ **Verificación por correo electrónico**
- ✅ **Recuperación de contraseña**
- ✅ **Gestión de productos** con categorías y detalles
- ✅ **Carrito de compras** para usuarios autenticados e invitados
- ✅ **Sistema de pedidos** con cálculo de impuestos y envío
- ✅ **Base de datos robusta** con Prisma ORM
- ✅ **Control de stock** automático
- ✅ **Roles de usuario** (Admin, Empleado, Cliente)

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

## 🛠️ Instalación

### 1. Clonar o descargar el proyecto

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus variables:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
DATABASE_URL="mysql://root:@localhost:3306/crispy"
SESSION_SECRET="tu-secreto-super-seguro-cambialo"

# Configuración de correo (ejemplo con Gmail)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASSWORD="tu-contraseña-de-aplicacion"
EMAIL_FROM="noreply@crispychips.com"

SERVER_URL="http://localhost:3000"
```

> **Nota para Gmail:** Necesitas crear una "Contraseña de Aplicación" en tu cuenta de Google:
> 1. Ve a https://myaccount.google.com/security
> 2. Activa la verificación en 2 pasos
> 3. Busca "Contraseñas de aplicaciones" y genera una nueva

### 4. Crear la base de datos

Crea la base de datos en MySQL:

```sql
CREATE DATABASE crispy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Ejecutar migraciones de Prisma

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Crear las tablas en la base de datos
npm run prisma:migrate

# O usar push para desarrollo rápido (sin historial de migraciones)
npm run prisma:push
```

### 6. Poblar la base de datos con datos de ejemplo

```bash
npm run prisma:seed
```

Esto creará:
- Un usuario administrador (admin@crispychips.com / admin123)
- Categorías de productos
- 8 productos de ejemplo
- Detalles de productos

## 🎯 Uso

### Iniciar el servidor

```bash
# Modo producción
npm start

# Modo desarrollo (con auto-reload)
npm run dev
```

El servidor estará disponible en: http://localhost:3000

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia el servidor en modo producción |
| `npm run dev` | Inicia el servidor con nodemon (auto-reload) |
| `npm run prisma:generate` | Genera el cliente de Prisma |
| `npm run prisma:migrate` | Crea y aplica migraciones |
| `npm run prisma:push` | Sincroniza el esquema sin migraciones |
| `npm run prisma:studio` | Abre Prisma Studio (GUI para la BD) |
| `npm run prisma:seed` | Pobla la BD con datos de ejemplo |

## 📚 Estructura de la Base de Datos

### Modelos principales:

- **Usuario**: Gestión de usuarios con autenticación
- **Cliente**: Información adicional del cliente
- **Producto**: Catálogo de productos
- **Categoria**: Categorización de productos
- **DetalleProducto**: Atributos adicionales (sabor, tamaño, etc)
- **Carrito**: Carritos de compra
- **ItemCarrito**: Productos en el carrito
- **Pedido**: Órdenes de compra
- **ItemPedido**: Productos en el pedido

## 🔐 API Endpoints

### Autenticación

- `POST /register` - Registrar nuevo usuario
- `POST /login` - Iniciar sesión
- `POST /logout` - Cerrar sesión
- `GET /me` - Obtener usuario actual
- `GET /verificar-email/:token` - Verificar correo electrónico
- `POST /forgot-password` - Solicitar recuperación de contraseña
- `POST /reset-password/:token` - Restablecer contraseña

### Productos

- `GET /productos` - Listar todos los productos
- `GET /productos/:id` - Obtener producto específico

### Carrito

- `POST /agregar-carrito` - Agregar producto al carrito
- `GET /carrito` - Obtener carrito actual
- `PUT /carrito/item/:itemId` - Actualizar cantidad
- `DELETE /carrito/item/:itemId` - Eliminar item del carrito
- `DELETE /carrito` - Vaciar carrito

### Pedidos

- `POST /pedidos` - Crear nuevo pedido (requiere autenticación)
- `GET /mis-pedidos` - Obtener pedidos del usuario (requiere autenticación)

## 🔧 Prisma Studio

Para visualizar y editar los datos de forma gráfica:

```bash
npm run prisma:studio
```

Abre automáticamente una interfaz web en http://localhost:5555

## 📝 Notas Importantes

### Seguridad

- Las contraseñas se hashean con bcrypt (10 rounds)
- Las sesiones usan cookies HTTP-only
- Los tokens de verificación son únicos y aleatorios
- La autenticación usa Passport.js con estrategia local

### Configuración de Correo

Para envío de correos en producción, considera usar:
- SendGrid
- AWS SES
- Mailgun
- SMTP de tu servidor

### Desarrollo vs Producción

En producción, asegúrate de:
1. Cambiar `SESSION_SECRET` a algo seguro
2. Configurar `NODE_ENV=production`
3. Usar HTTPS (cookie.secure = true)
4. Configurar CORS apropiadamente
5. Implementar rate limiting
6. Agregar logging profesional

## 🐛 Solución de Problemas

### Error de conexión a MySQL

```bash
Error: Can't connect to MySQL server
```

Verifica que MySQL esté corriendo y las credenciales sean correctas.

### Error al generar Prisma Client

```bash
npm run prisma:generate
```

### Error de permisos en Gmail

Si usas Gmail, asegúrate de usar una "Contraseña de Aplicación" y no tu contraseña normal.

## Próximas Mejoras

- [ ] Panel de administración
- [ ] Métodos de pago (Stripe, PayPal)
- [ ] Tracking de envíos
- [ ] Sistema de reseñas
- [ ] Wishlist
- [ ] Descuentos y cupones
- [ ] Dashboard de estadísticas
- [ ] Notificaciones push

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Haz fork del proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

ISC

---

¿Preguntas o problemas? Abre un issue en el repositorio.
