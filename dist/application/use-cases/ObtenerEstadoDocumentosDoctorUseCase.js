"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObtenerEstadoDocumentosDoctorUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("../../infrastructure/database/prisma/client");
/**
 * Caso de uso para obtener el estado de los documentos de un doctor
 */
let ObtenerEstadoDocumentosDoctorUseCase = class ObtenerEstadoDocumentosDoctorUseCase {
    async execute(doctorId) {
        // Verificar que el doctor existe
        const doctor = await client_1.prisma.doctor.findUnique({
            where: { usuarioId: doctorId },
            select: {
                usuarioId: true,
                estadoVerificacion: true,
            },
        });
        if (!doctor) {
            throw new Error('Doctor no encontrado');
        }
        // Obtener todos los documentos del doctor con sus acciones
        const documentos = await client_1.prisma.documentoDoctor.findMany({
            where: {
                doctorId,
                estado: 'Activo',
            },
            select: {
                id: true,
                tipoDocumento: true,
                descripcion: true,
                estadoRevision: true,
                creadoEn: true,
                actualizadoEn: true,
                acciones: {
                    where: {
                        estado: { in: ['Pendiente', 'Aprobada', 'Rechazada'] },
                    },
                    orderBy: {
                        fechaEmision: 'desc',
                    },
                    take: 1,
                    select: {
                        id: true,
                        estado: true,
                        comentarioAdmin: true,
                        fechaResolucion: true,
                    },
                },
            },
            orderBy: {
                creadoEn: 'asc',
            },
        });
        // Calcular estadísticas
        const total = documentos.length;
        const aprobados = documentos.filter((d) => d.estadoRevision === 'Aprobado').length;
        const rechazados = documentos.filter((d) => d.estadoRevision === 'Rechazado').length;
        const pendientes = documentos.filter((d) => d.estadoRevision === 'Pendiente').length;
        return {
            estadoVerificacion: doctor.estadoVerificacion,
            estadisticas: {
                total,
                aprobados,
                rechazados,
                pendientes,
                progreso: total > 0 ? Math.round((aprobados / total) * 100) : 0,
            },
            documentos: documentos.map((doc) => ({
                id: doc.id,
                tipoDocumento: doc.tipoDocumento,
                descripcion: doc.descripcion,
                estadoRevision: doc.estadoRevision,
                creadoEn: doc.creadoEn,
                actualizadoEn: doc.actualizadoEn,
                ultimaAccion: doc.acciones[0] || null,
            })),
        };
    }
};
exports.ObtenerEstadoDocumentosDoctorUseCase = ObtenerEstadoDocumentosDoctorUseCase;
exports.ObtenerEstadoDocumentosDoctorUseCase = ObtenerEstadoDocumentosDoctorUseCase = __decorate([
    (0, tsyringe_1.injectable)()
], ObtenerEstadoDocumentosDoctorUseCase);
