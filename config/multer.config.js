const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Crear directorios de uploads si no existen
const uploadsProfilesDir = path.join(__dirname, '../uploads', 'profiles');
const uploadsProductsDir = path.join(__dirname, '../uploads', 'productos');
const uploadsQrDir = path.join(__dirname, '../uploads', 'qr');
const uploadsComprobantesDir = path.join(__dirname, '../uploads', 'comprobantes');

if (!fs.existsSync(uploadsProfilesDir)) {
  fs.mkdirSync(uploadsProfilesDir, { recursive: true });
}

if (!fs.existsSync(uploadsProductsDir)) {
  fs.mkdirSync(uploadsProductsDir, { recursive: true });
}

if (!fs.existsSync(uploadsQrDir)) {
  fs.mkdirSync(uploadsQrDir, { recursive: true });
}

if (!fs.existsSync(uploadsComprobantesDir)) {
  fs.mkdirSync(uploadsComprobantesDir, { recursive: true });
}

// Configuración de multer para fotos de perfil
const storageProfile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsProfilesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configuración de multer para imágenes de productos
const storageProduct = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsProductsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

// Configuración de multer para QR de pago
const storageQr = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsQrDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qr-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configurar uploads
const uploadProfile = multer({ 
  storage: storageProfile,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: fileFilter
});

const uploadProduct = multer({ 
  storage: storageProduct,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: fileFilter
});

const uploadQr = multer({ 
  storage: storageQr,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: fileFilter
});

// Configuración de multer para comprobantes de pago
const storageComprobante = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsComprobantesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user ? req.user.id : 'guest';
    cb(null, 'comprobante-' + userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadComprobante = multer({ 
  storage: storageComprobante,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: fileFilter
});

module.exports = {
  uploadProfile,
  uploadProduct,
  uploadQr,
  uploadComprobante
};
