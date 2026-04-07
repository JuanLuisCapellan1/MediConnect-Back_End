import multer from 'multer';

// Guardar en memoria RAM temporalmente
const storage = multer.memoryStorage();

// Filtro de archivos (Seguridad básica)
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no soportado. Solo JPG, PNG, WEBP y PDF.'), false);
  }
};

export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5MB por archivo
  },
  fileFilter: fileFilter
});