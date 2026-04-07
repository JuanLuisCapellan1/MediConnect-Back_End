"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeleconsultaController = void 0;
const tsyringe_1 = require("tsyringe");
const tsyringe_2 = require("tsyringe");
const IniciarTeleconsultaUseCase_1 = require("../../../application/use-cases/teleconsultas/IniciarTeleconsultaUseCase");
const FinalizarTeleconsultaUseCase_1 = require("../../../application/use-cases/teleconsultas/FinalizarTeleconsultaUseCase");
const ChatWebSocketService_1 = require("../../external-services/ChatWebSocketService");
let TeleconsultaController = class TeleconsultaController {
    constructor(iniciarUseCase, finalizarUseCase) {
        this.iniciarUseCase = iniciarUseCase;
        this.finalizarUseCase = finalizarUseCase;
    }
    /**
     * POST /teleconsultas/:citaId/iniciar
     * Solo accesible por el Doctor dueño de la cita.
     * Crea la sala en Daily.co, registra el log y retorna la URL de acceso.
     */
    async iniciar(req, res) {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado.' });
                return;
            }
            const citaId = Number(req.params.citaId);
            if (isNaN(citaId) || citaId <= 0) {
                res.status(400).json({ success: false, message: 'El parámetro citaId debe ser un número válido.' });
                return;
            }
            const data = await this.iniciarUseCase.ejecutar(citaId, doctorId);
            res.status(200).json({
                success: true,
                message: 'Teleconsulta iniciada exitosamente.',
                data,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /teleconsultas/:citaId/finalizar
     * Accesible por el Doctor O el Paciente (cualquiera puede colgar).
     * Calcula duración, marca el LogTeleconsulta como 'Finalizada',
     * destruye la sala en Daily.co y notifica al otro participante por WebSocket.
     */
    async finalizar(req, res) {
        try {
            const usuarioId = req.user?.userId;
            if (!usuarioId) {
                res.status(401).json({ success: false, message: 'No autenticado.' });
                return;
            }
            const citaId = Number(req.params.citaId);
            if (isNaN(citaId) || citaId <= 0) {
                res.status(400).json({ success: false, message: 'El parámetro citaId debe ser un número válido.' });
                return;
            }
            const resultado = await this.finalizarUseCase.ejecutar(citaId, usuarioId);
            // ── Emitir evento WebSocket para que el otro extremo cierre el video ──
            try {
                const chatWS = tsyringe_2.container.resolve(ChatWebSocketService_1.ChatWebSocketService);
                const io = chatWS.obtenerIO();
                if (io) {
                    // Notificar a la "sala" de la cita — usamos cita:{id} como canal dedicado
                    io.to(`cita:${citaId}`).emit('llamada-finalizada', {
                        citaId,
                        duracionMinutos: resultado.duracionMinutos,
                        finalizadoPor: usuarioId,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
            catch (wsErr) {
                // No bloquear la respuesta HTTP si el socket falla
                console.error('Error al emitir llamada-finalizada por WebSocket:', wsErr);
            }
            res.status(200).json({
                success: true,
                message: resultado.mensaje,
                data: { duracionMinutos: resultado.duracionMinutos },
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /teleconsultas/:citaId/url-acceso
     * Solo el Paciente dueño de la cita puede consultar su URL.
     * Retorna la URL de Daily.co con el token de participante almacenado en el log.
     */
    async obtenerUrlPaciente(req, res) {
        try {
            const pacienteId = req.user?.userId;
            if (!pacienteId) {
                res.status(401).json({ success: false, message: 'No autenticado.' });
                return;
            }
            const citaId = Number(req.params.citaId);
            if (isNaN(citaId) || citaId <= 0) {
                res.status(400).json({ success: false, message: 'El parámetro citaId debe ser un número válido.' });
                return;
            }
            // Verificar que el paciente pertenece a la cita
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const cita = await prisma.cita.findUnique({
                where: { id: citaId },
                select: { pacienteId: true, estado: true },
            });
            if (!cita) {
                await prisma.$disconnect();
                res.status(404).json({ success: false, message: 'Cita no encontrada.' });
                return;
            }
            if (cita.pacienteId !== pacienteId) {
                await prisma.$disconnect();
                res.status(403).json({ success: false, message: 'No tienes permisos para acceder a esta teleconsulta.' });
                return;
            }
            // Buscar el log activo (el más reciente Iniciada o En Progreso)
            const log = await prisma.logTeleconsulta.findFirst({
                where: {
                    citaId,
                    estado: { in: ['Iniciada', 'En Progreso'] },
                },
                orderBy: { inicio: 'desc' },
                select: { urlPaciente: true, estado: true, inicio: true },
            });
            await prisma.$disconnect();
            if (!log || !log.urlPaciente) {
                res.status(404).json({
                    success: false,
                    message: 'No hay una teleconsulta activa para esta cita. Espera a que el doctor inicie la sala.',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'URL de acceso obtenida exitosamente.',
                data: {
                    urlAcceso: log.urlPaciente,
                    citaId,
                    estado: log.estado,
                    inicio: log.inicio,
                },
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    manejarError(error, res) {
        const msg = error?.message ?? 'Error interno del servidor';
        if (msg.includes('no encontrad') || msg.includes('no existe')) {
            res.status(404).json({ success: false, message: msg });
            return;
        }
        if (msg.includes('No tienes permisos')) {
            res.status(403).json({ success: false, message: msg });
            return;
        }
        if (msg.includes('Solo se puede iniciar') ||
            msg.includes('Solo se puede finalizar') ||
            msg.includes('Aún no puedes iniciar') ||
            msg.includes('ventana de inicio') ||
            msg.includes('No existe una teleconsulta activa') ||
            msg.includes('DAILY_API_KEY') ||
            msg.includes('inválido') ||
            msg.includes('requerido')) {
            res.status(400).json({ success: false, message: msg });
            return;
        }
        if (msg.includes('Daily.co')) {
            res.status(502).json({ success: false, message: msg });
            return;
        }
        console.error('Error en TeleconsultaController:', error);
        res.status(500).json({ success: false, message: msg });
    }
};
exports.TeleconsultaController = TeleconsultaController;
exports.TeleconsultaController = TeleconsultaController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(IniciarTeleconsultaUseCase_1.IniciarTeleconsultaUseCase)),
    __param(1, (0, tsyringe_1.inject)(FinalizarTeleconsultaUseCase_1.FinalizarTeleconsultaUseCase)),
    __metadata("design:paramtypes", [IniciarTeleconsultaUseCase_1.IniciarTeleconsultaUseCase,
        FinalizarTeleconsultaUseCase_1.FinalizarTeleconsultaUseCase])
], TeleconsultaController);
