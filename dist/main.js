"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
// Fix para serialización de BigInt en JSON
// Convierte BigInt a string automáticamente cuando se serializa a JSON
BigInt.prototype.toJSON = function () {
    return this.toString();
};
// Fix para serialización de Decimal (Prisma) en JSON
// Evita el formato interno {"s":1,"e":3,"d":[...]} y devuelve un número normal
const library_1 = require("@prisma/client/runtime/library");
library_1.Decimal.prototype.toJSON = function () {
    return parseFloat(this.toString());
};
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
const AutoGestionCitasService_1 = require("./infrastructure/jobs/AutoGestionCitasService");
const NotificarMensajesPendientesService_1 = require("./infrastructure/jobs/NotificarMensajesPendientesService");
const EnviarNotificacionUseCase_1 = require("./application/use-cases/notificaciones/EnviarNotificacionUseCase");
const client_1 = require("@prisma/client");
const TranslationWarmUpService_1 = require("./infrastructure/services/TranslationWarmUpService");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3000;
// Middlewares Globales
app.use((0, helmet_1.default)()); // Headers de seguridad
app.use((0, cors_1.default)()); // Permitir peticiones externas
app.use(express_1.default.json()); // Parsear JSON body
// Error handler para JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        console.error('❌ JSON Parse Error:', err.message);
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format in request body'
        });
    }
    next(err);
});
// Controladores (Ejemplo de controlador) mover a una carpeta controllers más adelante
const swaggerDocument = yamljs_1.default.load(path_1.default.join(process.cwd(), 'src/infrastructure/config/swagger.yml'));
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
app.use('/api', routes_1.default);
// Inicializar WebSocket
const wsService = tsyringe_1.container.resolve(NotificacionesWebSocketService_1.NotificacionesWebSocketService);
wsService.inicializar(httpServer);
// Inicializar Chat WebSocket
const chatWsService = tsyringe_1.container.resolve(ChatWebSocketService_1.ChatWebSocketService);
chatWsService.inicializar(wsService.obtenerIO());
// Iniciar cron de gestión automática de no-shows
const prismaForCron = new client_1.PrismaClient();
const enviarNotifUCForCron = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
const autoGestionCitas = new AutoGestionCitasService_1.AutoGestionCitasService(prismaForCron, enviarNotifUCForCron);
autoGestionCitas.iniciar();
// Iniciar cron de notificación de mensajes pendientes (chat)
const notificarMensajesPendientes = new NotificarMensajesPendientesService_1.NotificarMensajesPendientesService(prismaForCron, enviarNotifUCForCron);
notificarMensajesPendientes.iniciar();
// Precalentar caché de traducción (fire-and-forget, no bloquea el arranque)
const warmUpService = new TranslationWarmUpService_1.TranslationWarmUpService(prismaForCron);
warmUpService.run().catch(err => console.error('❌ [WarmUp] Error no capturado:', err));
// Iniciar servidor
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor MediConnect corriendo en http://localhost:${PORT}`);
    console.log(`📡 WebSocket disponible en ws://localhost:${PORT}`);
    console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
});
