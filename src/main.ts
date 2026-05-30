import "reflect-metadata";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Fix para serialización de BigInt en JSON
// Convierte BigInt a string automáticamente cuando se serializa a JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Fix para serialización de Decimal (Prisma) en JSON
// Evita el formato interno {"s":1,"e":3,"d":[...]} y devuelve un número normal
import { Decimal } from "@prisma/client/runtime/library";
(Decimal.prototype as any).toJSON = function () {
  return parseFloat(this.toString());
};

import "./shared/container"; // Configuración del contenedor de inyección
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import { container } from "tsyringe";

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

import routes from "./infrastructure/http/routes";
import { NotificacionesWebSocketService } from "./infrastructure/external-services/NotificacionesWebSocketService";
import { ChatWebSocketService } from "./infrastructure/external-services/ChatWebSocketService";
import { AutoGestionCitasService } from "./infrastructure/jobs/AutoGestionCitasService";
import { NotificarMensajesPendientesService } from "./infrastructure/jobs/NotificarMensajesPendientesService";
import { EnviarNotificacionUseCase } from "./application/use-cases/notificaciones/EnviarNotificacionUseCase";
import { PrismaClient } from "@prisma/client";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Middlewares Globales
app.use(helmet()); // Headers de seguridad
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:8000"],
    credentials: true,
  }),
); // Permitir peticiones externas
app.use(express.json()); // Parsear JSON body

// Error handler para JSON parsing
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && "body" in err) {
    console.error("❌ JSON Parse Error:", err.message);
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
    });
  }
  next(err);
});

// Redirigir la ruta raíz a la documentación
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

// Documentación Swagger
const swaggerDocument = YAML.load(
  path.join(__dirname, "./infrastructure/config/swagger.yml"),
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api", routes);

// Inicializar WebSocket
const wsService = container.resolve(NotificacionesWebSocketService);
wsService.inicializar(httpServer);

// Inicializar Chat WebSocket
const chatWsService = container.resolve(ChatWebSocketService);
chatWsService.inicializar(wsService.obtenerIO()!);

// Iniciar cron de gestión automática de no-shows
const prismaForCron = new PrismaClient();
const enviarNotifUCForCron = container.resolve(EnviarNotificacionUseCase);
const autoGestionCitas = new AutoGestionCitasService(
  prismaForCron,
  enviarNotifUCForCron,
);
autoGestionCitas.iniciar();

// Iniciar cron de notificación de mensajes pendientes (chat)
const notificarMensajesPendientes = new NotificarMensajesPendientesService(
  prismaForCron,
  enviarNotifUCForCron,
);
notificarMensajesPendientes.iniciar();

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor MediConnect corriendo en http://localhost:${PORT}`);
  console.log(`📡 WebSocket disponible en ws://localhost:${PORT}`);
  console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
});
