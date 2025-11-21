const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // Crear usuario ADMIN (vendedor)
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      username: 'admin2',
      password: hashedPasswordAdmin,
      nombre: 'Administrador',
      apellido: 'Crispy Chips',
      telefono: '71794376',
      rol: 'ADMIN',
      emailVerificado: true,
      activo: true
    }
  });

  console.log('Usuario ADMIN creado:', admin.username);

  // Crear categorías
  const categorias = await Promise.all([
    prisma.categoria.upsert({
      where: { nombre: 'Papas Chips' },
      update: {},
      create: {
        nombre: 'Papas Chips',
        descripcion: 'Papas fritas crujientes en diferentes sabores'
      }
    }),
    prisma.categoria.upsert({
      where: { nombre: 'Snacks' },
      update: {},
      create: {
        nombre: 'Snacks',
        descripcion: 'Variedad de snacks y bocadillos'
      }
    }),
    prisma.categoria.upsert({
      where: { nombre: 'Bebidas' },
      update: {},
      create: {
        nombre: 'Bebidas',
        descripcion: 'Bebidas refrescantes'
      }
    })
  ]);

  console.log('Categorías creadas:', categorias.length);

  // Crear productos del ADMIN
  const productos = [
    {
      nombre: 'Chips Original',
      descripcion: 'Papas chips sabor original, crujientes y deliciosas',
      precio: 3500,
      stock: 100,
      imagen: '../imgs/papas1.jpg',
      categoriaId: categorias[0].id,
      vendedorId: admin.id,
      destacado: true,
      sku: 'CHIP-001'
    },
    {
      nombre: 'Chips BBQ',
      descripcion: 'Papas chips con sabor a BBQ ahumado',
      precio: 3500,
      stock: 80,
      imagen: '/imgs/papas2.jpg',
      categoriaId: categorias[0].id,
      vendedorId: admin.id,
      destacado: true,
      sku: 'CHIP-002'
    },
    {
      nombre: 'Chips Queso',
      descripcion: 'Papas chips con intenso sabor a queso',
      precio: 3500,
      stock: 90,
      imagen: '/imgs/papas1.jpg',
      categoriaId: categorias[0].id,
      vendedorId: admin.id,
      sku: 'CHIP-003'
    },
    {
      nombre: 'Chips Picante',
      descripcion: 'Papas chips con chile picante',
      precio: 3800,
      stock: 75,
      imagen: '/imgs/papas2.jpg',
      categoriaId: categorias[0].id,
      vendedorId: admin.id,
      destacado: true,
      sku: 'CHIP-004'
    },
    {
      nombre: 'Mix de Frutos Secos',
      descripcion: 'Mezcla de nueces, almendras y maní',
      precio: 5000,
      stock: 50,
      imagen: '/imgs/papas1.jpg',
      categoriaId: categorias[1].id,
      vendedorId: admin.id,
      sku: 'SNACK-001'
    },
    {
      nombre: 'Pretzels',
      descripcion: 'Pretzels salados tradicionales',
      precio: 2800,
      stock: 60,
      imagen: '/imgs/papas2.jpg',
      categoriaId: categorias[1].id,
      vendedorId: admin.id,
      sku: 'SNACK-002'
    },
    {
      nombre: 'Coca Cola 350ml',
      descripcion: 'Refresco de cola clásico',
      precio: 2500,
      stock: 150,
      imagen: '/imgs/papas1.jpg',
      categoriaId: categorias[2].id,
      vendedorId: admin.id,
      sku: 'BEB-001'
    },
    {
      nombre: 'Agua Mineral 500ml',
      descripcion: 'Agua mineral natural',
      precio: 2000,
      stock: 200,
      imagen: '/imgs/papas2.jpg',
      categoriaId: categorias[2].id,
      vendedorId: admin.id,
      sku: 'BEB-002'
    }
  ];

  for (const producto of productos) {
    await prisma.producto.upsert({
      where: { sku: producto.sku },
      update: {},
      create: producto
    });
  }

  console.log('Productos creados:', productos.length);

  // Agregar detalles a algunos productos
  const chipOriginal = await prisma.producto.findUnique({
    where: { sku: 'CHIP-001' }
  });

  if (chipOriginal) {
    await prisma.detalleProducto.createMany({
      data: [
        {
          productoId: chipOriginal.id,
          atributo: 'Tamaño',
          valor: 'Grande (200g)',
          precioExtra: 1000
        },
        {
          productoId: chipOriginal.id,
          atributo: 'Tamaño',
          valor: 'Pequeño (100g)',
          precioExtra: 0
        }
      ],
      skipDuplicates: true
    });
  }
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
