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
exports.GestionarResenasUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const EnviarNotificacionUseCase_1 = require("./notificaciones/EnviarNotificacionUseCase");
let GestionarResenasUseCase = class GestionarResenasUseCase {
    constructor(resenaRepo, enviarNotifUC) {
        this.resenaRepo = resenaRepo;
        this.enviarNotifUC = enviarNotifUC;
    }
    // ===================================================================
    // PACIENTE: Crear una reseña para un servicio
    // ===================================================================
    async crearResena(pacienteId, dto) {
        // Validar rango de calificación
        if (!Number.isInteger(dto.calificacion) || dto.calificacion < 1 || dto.calificacion > 5) {
            throw new Error('La calificación debe ser un número entero del 1 al 5.');
        }
        // Verificar que el servicio existe y obtener el doctorId
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const servicio = await prisma.servicio.findUnique({
            where: { id: dto.servicioId },
            select: { id: true, doctorId: true, estado: true }
        });
        if (!servicio) {
            await prisma.$disconnect();
            throw new Error('El servicio no existe.');
        }
        if (servicio.estado !== 'Activo') {
            await prisma.$disconnect();
            throw new Error('No puedes reseñar un servicio que no está activo.');
        }
        // Si se proporciona citaId, verificar que la cita esté Completada y le pertenezca al paciente
        if (dto.citaId) {
            const cita = await prisma.cita.findUnique({
                where: { id: dto.citaId },
                select: { id: true, pacienteId: true, estado: true, servicioId: true }
            });
            if (!cita) {
                await prisma.$disconnect();
                throw new Error('La cita referenciada no existe.');
            }
            if (cita.pacienteId !== pacienteId) {
                await prisma.$disconnect();
                throw new Error('No tienes permisos para reseñar usando esa cita.');
            }
            if (cita.estado !== 'Completada') {
                await prisma.$disconnect();
                throw new Error('Solo puedes reseñar una cita que haya sido completada.');
            }
            if (cita.servicioId !== dto.servicioId) {
                await prisma.$disconnect();
                throw new Error('La cita no corresponde al servicio indicado.');
            }
        }
        await prisma.$disconnect();
        // Verificar que el paciente no haya reseñado este servicio antes
        const yaReseñado = await this.resenaRepo.existeResena(pacienteId, dto.servicioId);
        if (yaReseñado) {
            throw new Error('Ya has calificado este servicio anteriormente.');
        }
        const resena = await this.resenaRepo.crear({
            servicioId: dto.servicioId,
            pacienteId,
            doctorId: servicio.doctorId,
            calificacion: dto.calificacion,
            comentario: dto.comentario ?? null,
            citaId: dto.citaId ?? null,
        });
        // ─ Notificar al doctor ────────────────────────────────────────────────
        this.enviarNotifUC.execute({
            usuarioId: servicio.doctorId,
            titulo: 'Nueva Reseña Recibida',
            mensaje: 'Un paciente ha calificado su última consulta contigo.',
            tipoAlerta: 'Informacion',
            tipoEntidad: 'Resena',
            entidadId: resena.id ?? dto.servicioId,
        }).catch((e) => console.error('notif crearResena:', e));
        return resena;
    }
    // ===================================================================
    // PÚBLICO: Listar reseñas de un servicio
    // ===================================================================
    async listarPorServicio(servicioId, filtros) {
        return await this.resenaRepo.listarPorServicio(servicioId, filtros.pagina, filtros.limite);
    }
    // ===================================================================
    // PÚBLICO: Listar reseñas de un doctor (a través de sus servicios)
    // ===================================================================
    async listarPorDoctor(doctorId, filtros) {
        return await this.resenaRepo.listarPorDoctor(doctorId, filtros.pagina, filtros.limite);
    }
    // ===================================================================
    // PACIENTE: Ver sus propias reseñas
    // ===================================================================
    async misResenas(pacienteId) {
        return await this.resenaRepo.listarMias(pacienteId);
    }
    // ===================================================================
    // PACIENTE: Eliminar su propia reseña
    // ===================================================================
    async eliminarResena(resenaId, pacienteId) {
        const resena = await this.resenaRepo.buscarPorId(resenaId);
        if (!resena)
            throw new Error('Reseña no encontrada.');
        if (resena.pacienteId !== pacienteId) {
            throw new Error('No tienes permisos para eliminar esta reseña.');
        }
        await this.resenaRepo.eliminar(resenaId);
    }
};
exports.GestionarResenasUseCase = GestionarResenasUseCase;
exports.GestionarResenasUseCase = GestionarResenasUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('ResenaRepository')),
    __param(1, (0, tsyringe_1.inject)(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase)),
    __metadata("design:paramtypes", [Object, EnviarNotificacionUseCase_1.EnviarNotificacionUseCase])
], GestionarResenasUseCase);
