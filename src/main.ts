import 'reflect-metadata'; 
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

import './shared/container'; // Configuración del contenedor de inyección
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { UsuarioController } from './infrastructure/http/controllers/UsuarioController';


const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globales
app.use(helmet()); // Headers de seguridad
app.use(cors());   // Permitir peticiones externas
app.use(express.json()); // Parsear JSON body


// Controladores (Ejemplo de controlador) mover a una carpeta controllers más adelante
const usuarioController = new UsuarioController();

// Rutas (Ejemplo de ruta para registrar usuario) mover a una carpeta routes más adelante
app.post('/api/usuarios', (req, res) => usuarioController.registrar(req, res));


// Ruta de prueba (Health Check)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    app: 'MediConnect API' 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor MediConnect corriendo en http://localhost:${PORT}`);
});