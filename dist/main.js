"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
require("./shared/container"); // Configuración del contenedor de inyección
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const tsyringe_1 = require("tsyringe");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./infrastructure/http/routes"));
const NotificacionesWebSocketService_1 = require("./infrastructure/external-services/NotificacionesWebSocketService");
const ChatWebSocketService_1 = require("./infrastructure/external-services/ChatWebSocketService");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3000;
// Middlewares Globales
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Headers de seguridad con configuración personalizada
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Recovery-Token', 'X-Requested-With', 'accept']
})); // Permitir peticiones externas
app.use(express_1.default.json({ limit: '50mb' })); // Parsear JSON body
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' })); // Parsear URL encoded
// Controladores (Ejemplo de controlador) mover a una carpeta controllers más adelante
const swaggerDocument = yamljs_1.default.load(path_1.default.join(__dirname, './infrastructure/config/swagger.yml'));
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
app.use('/api', routes_1.default);
// Inicializar WebSocket
const wsService = tsyringe_1.container.resolve(NotificacionesWebSocketService_1.NotificacionesWebSocketService);
wsService.inicializar(httpServer);
// Inicializar Chat WebSocket
const chatWsService = tsyringe_1.container.resolve(ChatWebSocketService_1.ChatWebSocketService);
chatWsService.inicializar(wsService.obtenerIO());
// Iniciar servidor
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor MediConnect corriendo en http://localhost:${PORT}`);
    console.log(`📡 WebSocket disponible en ws://localhost:${PORT}`);
    console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
});
