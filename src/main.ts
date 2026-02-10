import 'reflect-metadata'; 
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

import './shared/container'; // Configuración del contenedor de inyección
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { container } from 'tsyringe';

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import routes from './infrastructure/http/routes';
import { NotificacionesWebSocketService } from './infrastructure/external-services/NotificacionesWebSocketService';
import { ChatWebSocketService } from './infrastructure/external-services/ChatWebSocketService';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Middlewares Globales
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Headers de seguridad con configuración personalizada

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Recovery-Token', 'X-Requested-With', 'accept']
}));   // Permitir peticiones externas

app.use(express.json({ limit: '50mb' })); // Parsear JSON body
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parsear URL encoded


// Controladores (Ejemplo de controlador) mover a una carpeta controllers más adelante

const swaggerDocument = YAML.load(path.join(__dirname, './infrastructure/config/swagger.yml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', routes);

// Inicializar WebSocket
const wsService = container.resolve(NotificacionesWebSocketService);
wsService.inicializar(httpServer);

// Inicializar Chat WebSocket
const chatWsService = container.resolve(ChatWebSocketService);
chatWsService.inicializar(wsService.obtenerIO()!);

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor MediConnect corriendo en http://localhost:${PORT}`);
  console.log(`📡 WebSocket disponible en ws://localhost:${PORT}`);
  console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
});