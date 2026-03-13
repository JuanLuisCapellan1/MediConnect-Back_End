"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AprobarRechazarDocumentoUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("../../infrastructure/database/prisma/client");
const EnviarNotificacionUseCase_1 = require("./notificaciones/EnviarNotificacionUseCase");
/**
 * Caso de uso para aprobar o rechazar un documento específico.
 * Incluye lógica para aprobar automáticamente al doctor cuando todos sus documentos estén aprobados.
 * Emite notificaciones en tiempo real vía WebSocket usando EnviarNotificacionUseCase.
 */
let AprobarRechazarDocumentoUseCase = class AprobarRechazarDocumentoUseCase {
    constructor(enviarNotifUC) {
        this.enviarNotifUC = enviarNotifUC;
    }
    async execute(adminId, dto) {
        // 1. Verificar que el admin existe y tiene rol Admin
        const admin = await client_1.prisma.usuario.findUnique({
            where: { id: adminId },
            select: { rol: true },
        });
        if (!admin || admin.rol !== 'Admin') {
            throw new Error('Solo los administradores pueden aprobar/rechazar documentos');
        }
        // 2. Verificar que la acción existe y está pendiente
        const accion = await client_1.prisma.accion.findUnique({
            where: { id: dto.accionId },
            select: { id: true, estado: true, documentoId: true, emisorId: true },
        });
        if (!accion)
            throw new Error('Acción no encontrada');
        if (accion.estado !== 'Pendiente')
            throw new Error('Esta acción ya fue procesada');
        if (!accion.documentoId)
            throw new Error('Esta acción no está vinculada a un documento');
        // 3. Obtener información del documento
        const documento = await client_1.prisma.documentoDoctor.findUnique({
            where: { id: accion.documentoId },
            select: { id: true, doctorId: true, tipoDocumento: true },
        });
        if (!documento)
            throw new Error('Documento no encontrado');
        // 4. Actualizar acción y documento en transacción
        let cuentaAprobada = false;
        await client_1.prisma.$transaction(async (tx) => {
            // Actualizar la acción
            await tx.accion.update({
                where: { id: dto.accionId },
                data: {
                    estado: dto.decision,
                    adminRevisorId: adminId,
                    comentarioAdmin: dto.comentario || null,
                    fechaResolucion: new Date(),
                    actualizadoEn: new Date(),
                },
            });
            // Actualizar el estadoRevision del documento
            const nuevoEstadoDoc = dto.decision === 'Aprobada' ? 'Aprobado' : 'Rechazado';
            await tx.documentoDoctor.update({
                where: { id: accion.documentoId },
                data: { estadoRevision: nuevoEstadoDoc, actualizadoEn: new Date() },
            });
            // 5. Si aprobado: verificar si todos los documentos del doctor están aprobados
            if (dto.decision === 'Aprobada') {
                const todosLosDocumentos = await tx.documentoDoctor.findMany({
                    where: { doctorId: documento.doctorId, estado: 'Activo' },
                    select: { id: true, estadoRevision: true },
                });
                const todosAprobados = todosLosDocumentos.every((doc) => doc.estadoRevision === 'Aprobado');
                if (todosAprobados) {
                    await tx.doctor.update({
                        where: { usuarioId: documento.doctorId },
                        data: { estadoVerificacion: 'Aprobado', actualizadoEn: new Date() },
                    });
                    cuentaAprobada = true;
                }
            }
        });
        // 6. Emitir notificaciones DESPUÉS de la transacción (con WS real-time)
        try {
            if (dto.decision === 'Aprobada' && cuentaAprobada) {
                await this.enviarNotifUC.execute({
                    usuarioId: documento.doctorId,
                    titulo: '¡Cuenta Aprobada!',
                    mensaje: 'Tu cuenta de doctor ha sido aprobada. Ya puedes comenzar a ofrecer tus servicios en MediConnect.',
                    tipoAlerta: 'Exito',
                    tipoEntidad: 'Perfil',
                });
            }
            else if (dto.decision === 'Aprobada') {
                await this.enviarNotifUC.execute({
                    usuarioId: documento.doctorId,
                    titulo: 'Documento Aprobado',
                    mensaje: `Tu documento "${documento.tipoDocumento}" ha sido aprobado.`,
                    tipoAlerta: 'Exito',
                    tipoEntidad: 'Perfil',
                });
            }
            else {
                // Rechazada
                await this.enviarNotifUC.execute({
                    usuarioId: documento.doctorId,
                    titulo: 'Actualización de Verificación',
                    mensaje: `Tu documento "${documento.tipoDocumento}" ha sido rechazado. ${dto.comentario ? `Motivo: ${dto.comentario}` : 'Por favor, actualízalo para continuar con el proceso de verificación.'}`,
                    tipoAlerta: 'Importante',
                    tipoEntidad: 'Perfil',
                });
            }
        }
        catch (notifErr) {
            console.error('AprobarRechazarDocumentoUseCase: error al notificar al doctor:', notifErr);
        }
    }
};
exports.AprobarRechazarDocumentoUseCase = AprobarRechazarDocumentoUseCase;
exports.AprobarRechazarDocumentoUseCase = AprobarRechazarDocumentoUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase)),
    __metadata("design:paramtypes", [EnviarNotificacionUseCase_1.EnviarNotificacionUseCase])
], AprobarRechazarDocumentoUseCase);
