import { injectable, inject } from 'tsyringe';
import { AprobarRechazarDocumentoDto } from '../dtos/AprobarRechazarDocumentoDto';
import { prisma } from '../../infrastructure/database/prisma/client';
import { EnviarNotificacionUseCase } from './notificaciones/EnviarNotificacionUseCase';

/**
 * Caso de uso para aprobar o rechazar un documento específico.
 * Incluye lógica para aprobar automáticamente al doctor cuando todos sus documentos estén aprobados.
 * Emite notificaciones en tiempo real vía WebSocket usando EnviarNotificacionUseCase.
 */
@injectable()
export class AprobarRechazarDocumentoUseCase {
    constructor(
        @inject(EnviarNotificacionUseCase)
        private readonly enviarNotifUC: EnviarNotificacionUseCase,
    ) { }

    async execute(adminId: number, dto: AprobarRechazarDocumentoDto): Promise<void> {
        // 1. Verificar que el admin existe y tiene rol Admin
        const admin = await prisma.usuario.findUnique({
            where: { id: adminId },
            select: { rol: true },
        });

        if (!admin || admin.rol !== 'Admin') {
            throw new Error('Solo los administradores pueden aprobar/rechazar documentos');
        }

        // 2. Verificar que la acción existe y está pendiente
        const accion = await prisma.accion.findUnique({
            where: { id: dto.accionId },
            select: { id: true, estado: true, documentoId: true, emisorId: true },
        });

        if (!accion) throw new Error('Acción no encontrada');
        if (accion.estado !== 'Pendiente') throw new Error('Esta acción ya fue procesada');
        if (!accion.documentoId) throw new Error('Esta acción no está vinculada a un documento');

        // 3. Obtener información del documento
        const documento = await prisma.documentoDoctor.findUnique({
            where: { id: accion.documentoId },
            select: { id: true, doctorId: true, tipoDocumento: true },
        });

        if (!documento) throw new Error('Documento no encontrado');

        // 4. Actualizar acción y documento en transacción
        let cuentaAprobada = false;

        await prisma.$transaction(async (tx) => {
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
                where: { id: accion.documentoId! },
                data: { estadoRevision: nuevoEstadoDoc, actualizadoEn: new Date() },
            });

            // 5. Si aprobado: verificar si todos los documentos del doctor están aprobados
            if (dto.decision === 'Aprobada') {
                const todosLosDocumentos = await tx.documentoDoctor.findMany({
                    where: { doctorId: documento.doctorId, estado: 'Activo' },
                    select: { id: true, estadoRevision: true },
                });

                const todosAprobados = todosLosDocumentos.every(
                    (doc) => doc.estadoRevision === 'Aprobado',
                );

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
            } else if (dto.decision === 'Aprobada') {
                await this.enviarNotifUC.execute({
                    usuarioId: documento.doctorId,
                    titulo: 'Documento Aprobado',
                    mensaje: `Tu documento "${documento.tipoDocumento}" ha sido aprobado.`,
                    tipoAlerta: 'Exito',
                    tipoEntidad: 'Perfil',
                });
            } else {
                // Rechazada
                await this.enviarNotifUC.execute({
                    usuarioId: documento.doctorId,
                    titulo: 'Actualización de Verificación',
                    mensaje: `Tu documento "${documento.tipoDocumento}" ha sido rechazado. ${dto.comentario ? `Motivo: ${dto.comentario}` : 'Por favor, actualízalo para continuar con el proceso de verificación.'}`,
                    tipoAlerta: 'Importante',
                    tipoEntidad: 'Perfil',
                });
            }
        } catch (notifErr) {
            console.error('AprobarRechazarDocumentoUseCase: error al notificar al doctor:', notifErr);
        }
    }
}
