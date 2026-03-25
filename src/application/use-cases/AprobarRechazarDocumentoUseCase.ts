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

        if (!admin || admin.rol !== 'Administrador') {
            throw new Error('Solo los administradores pueden aprobar/rechazar documentos');
        }

        // 2. Verificar que la acción existe y está pendiente
        const accion = await prisma.accion.findUnique({
            where: { id: dto.accionId },
            include: { tipoAccion: true }, // Incluir tipo de acción para saber si es de Centro
        });

        if (!accion) throw new Error('Acción no encontrada');
        if (accion.estado !== 'Pendiente') throw new Error('Esta acción ya fue procesada');

        const esCentroSalud = accion.tipoAccion?.nombre === 'Registro Centro de Salud';
        const esRegistroDoctor = !accion.documentoId && !esCentroSalud;

        if (!esCentroSalud && !esRegistroDoctor && !accion.documentoId) {
            throw new Error('Esta acción no está vinculada a un documento o registro válido');
        }

        // 3. Obtener información del documento (solo si es revisión de un documento)
        let documentoDoctor: any = null;
        if (!esCentroSalud && !esRegistroDoctor) {
            documentoDoctor = await prisma.documentoDoctor.findUnique({
                where: { id: accion.documentoId! },
                select: { id: true, doctorId: true, tipoDocumento: true },
            });
            if (!documentoDoctor) throw new Error('Documento del doctor no encontrado');
        }

        // 4. Actualizar acción y estado del perfil/documento en transacción
        let cuentaDoctorAprobada = false;

        await prisma.$transaction(async (tx) => {
            // Actualizar la acción (común a todos)
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

            if (esCentroSalud) {
                // Lógica para Centro de Salud
                const nuevoEstadoCentro = dto.decision === 'Aprobada' ? 'Aprobado' : 'Rechazado';
                await tx.centroSalud.update({
                    where: { usuarioId: accion.emisorId },
                    data: { estadoVerificacion: nuevoEstadoCentro, actualizadoEn: new Date() },
                });
            } else if (esRegistroDoctor) {
                // Lógica para aprobación/rechazo del PERFIL/REGISTRO del doctor
                const nuevoEstadoDoctor = dto.decision === 'Aprobada' ? 'Aprobado' : 'Rechazado';
                await tx.doctor.update({
                    where: { usuarioId: accion.emisorId },
                    data: { estadoVerificacion: nuevoEstadoDoctor, actualizadoEn: new Date() },
                });
                cuentaDoctorAprobada = dto.decision === 'Aprobada';
            } else {
                // Lógica de un Documento de Doctor específico
                const nuevoEstadoDoc = dto.decision === 'Aprobada' ? 'Aprobado' : 'Rechazado';
                await tx.documentoDoctor.update({
                    where: { id: accion.documentoId! },
                    data: { estadoRevision: nuevoEstadoDoc, actualizadoEn: new Date() },
                });

                // Si fue aprobado el documento, revisar si TODOS están aprobados para aprobar la cuenta
                if (dto.decision === 'Aprobada') {
                    const todosLosDocumentos = await tx.documentoDoctor.findMany({
                        where: { doctorId: documentoDoctor.doctorId, estado: 'Activo' },
                        select: { id: true, estadoRevision: true },
                    });

                    const todosAprobados = todosLosDocumentos.every(
                        (doc) => doc.estadoRevision === 'Aprobado',
                    );

                    if (todosAprobados) {
                        await tx.doctor.update({
                            where: { usuarioId: documentoDoctor.doctorId },
                            data: { estadoVerificacion: 'Aprobado', actualizadoEn: new Date() },
                        });
                        cuentaDoctorAprobada = true;
                    }
                }
            }
        });

        // 5. Emitir notificaciones DESPUÉS de la transacción
        try {
            if (esCentroSalud) {
                if (dto.decision === 'Aprobada') {
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: '¡Centro de Salud Aprobado!',
                        mensaje: 'La certificación de su Centro de Salud ha sido aprobada. ¡Ya puede operar en MediConnect!',
                        tipoAlerta: 'Exito',
                        tipoEntidad: 'Perfil',
                    });
                } else {
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: 'Revisión de Centro de Salud',
                        mensaje: `Su certificación sanitaria ha sido rechazada. ${dto.comentario ? `Motivo: ${dto.comentario}` : 'Por favor, actualice su documento.'}`,
                        tipoAlerta: 'Importante',
                        tipoEntidad: 'Perfil',
                    });
                }
            } else if (esRegistroDoctor) {
                // Notificación para aprobación/rechazo del registro del doctor
                if (dto.decision === 'Aprobada') {
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: '¡Cuenta Aprobada!',
                        mensaje: 'Tu cuenta de doctor ha sido aprobada. Ya puedes comenzar a ofrecer tus servicios en MediConnect.',
                        tipoAlerta: 'Exito',
                        tipoEntidad: 'Perfil',
                    });
                } else {
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: 'Revisión de Registro',
                        mensaje: `Tu información de registro ha sido rechazada por el administrador. ${dto.comentario ? `Motivo: ${dto.comentario}` : 'Por favor, actualiza tu información para continuar con el proceso.'}`,
                        tipoAlerta: 'Importante',
                        tipoEntidad: 'Perfil',
                    });
                }
            } else {
                // Doctor — notificación de un documento específico
                if (dto.decision === 'Aprobada' && cuentaDoctorAprobada) {
                    await this.enviarNotifUC.execute({
                        usuarioId: documentoDoctor.doctorId,
                        titulo: '¡Todos los documentos aprobados!',
                        mensaje: 'Todos tus documentos han sido aprobados. Tu cuenta está completamente verificada en MediConnect.',
                        tipoAlerta: 'Exito',
                        tipoEntidad: 'Perfil',
                    });
                } else if (dto.decision === 'Aprobada') {
                    await this.enviarNotifUC.execute({
                        usuarioId: documentoDoctor.doctorId,
                        titulo: 'Documento Aprobado',
                        mensaje: `Tu documento "${documentoDoctor.tipoDocumento}" ha sido aprobado.`,
                        tipoAlerta: 'Exito',
                        tipoEntidad: 'Perfil',
                    });
                } else {
                    await this.enviarNotifUC.execute({
                        usuarioId: documentoDoctor.doctorId,
                        titulo: 'Actualización de Verificación',
                        mensaje: `Tu documento "${documentoDoctor.tipoDocumento}" ha sido rechazado. ${dto.comentario ? `Motivo: ${dto.comentario}` : 'Por favor, actualízalo para continuar con el proceso de verificación.'}`,
                        tipoAlerta: 'Importante',
                        tipoEntidad: 'Perfil',
                    });
                }
            }
        } catch (notifErr) {
            console.error('AprobarRechazarDocumentoUseCase: error al notificar al usuario:', notifErr);
        }
    }
}
