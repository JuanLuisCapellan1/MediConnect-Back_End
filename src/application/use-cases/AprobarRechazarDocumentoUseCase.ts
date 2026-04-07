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

        const esRegistroCentro = ['Registro Centro de Salud', 'Revisión Centro de Salud'].includes(accion.tipoAccion?.nombre ?? '');
        const esDocumentoCentro = accion.id_documento_centro != null;
        const esRegistroDoctor = !accion.documentoId && !esRegistroCentro && !esDocumentoCentro;

        if (!esRegistroCentro && !esRegistroDoctor && !accion.documentoId && !esDocumentoCentro) {
            throw new Error('Esta acción no está vinculada a un documento o registro válido');
        }

        // 3. Obtener información del documento (solo si es revisión de un documento)
        let documentoDoctor: any = null;
        let documentoCentro: any = null;
        
        if (accion.documentoId) {
            documentoDoctor = await prisma.documentoDoctor.findUnique({
                where: { id: accion.documentoId },
                select: { id: true, doctorId: true, tipoDocumento: true },
            });
            if (!documentoDoctor) throw new Error('Documento del doctor no encontrado');
        } else if (accion.id_documento_centro) {
            documentoCentro = await prisma.documentos_centros.findUnique({
                where: { id_documento_centro: accion.id_documento_centro },
                select: { id_documento_centro: true, id_centro_salud: true, tipo_documento: true },
            });
            if (!documentoCentro) throw new Error('Documento del centro no encontrado');
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

            if (esRegistroCentro) {
                // Lógica para Centro de Salud (Aprobado el perfil)
                const nuevoEstadoCentro = dto.decision === 'Aprobada' ? 'Aprobado' : 'Rechazado';
                await tx.centroSalud.update({
                    where: { usuarioId: accion.emisorId },
                    data: { estadoVerificacion: nuevoEstadoCentro, actualizadoEn: new Date() },
                });
            } else if (esDocumentoCentro) {
                // Lógica de Documento de Centro
                const nuevoEstadoDoc = dto.decision === 'Aprobada' ? 'Aprobado' : 'Rechazado';
                await tx.documentos_centros.update({
                    where: { id_documento_centro: accion.id_documento_centro! },
                    data: { estado_revision: nuevoEstadoDoc, actualizado_en: new Date() },
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
            if (esRegistroCentro) {
                if (dto.decision === 'Aprobada') {
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: '¡Perfil del Centro Aprobado!',
                        mensaje: 'Su registro general ha sido aprobado. Espere la validación de sus documentos si aún hay pendientes.',
                        tipoAlerta: 'Exito',
                        tipoEntidad: 'Perfil',
                    });
                } else {
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: 'Revisión del Centro de Salud',
                        mensaje: `Su solicitud de registro ha sido rechazada. ${dto.comentario ? `Motivo: ${dto.comentario}` : 'Por favor póngase en contacto con soporte.'}`,
                        tipoAlerta: 'Importante',
                        tipoEntidad: 'Perfil',
                    });
                }
            } else if (esDocumentoCentro) {
                if (dto.decision === 'Aprobada') {
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: `Documento Aprobado: ${documentoCentro.tipo_documento}`,
                        mensaje: `Su documento ha sido aprobado con éxito.`,
                        tipoAlerta: 'Info',
                        tipoEntidad: 'DocumentoCentro',
                        entidadId: documentoCentro.id_documento_centro,
                    });
                } else {
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: `Revisión de Documento: ${documentoCentro.tipo_documento}`,
                        mensaje: `Su documento fue rechazado. ${dto.comentario ? `Motivo: ${dto.comentario}` : 'Por favor, actualícelo.'}`,
                        tipoAlerta: 'Importante',
                        tipoEntidad: 'DocumentoCentro',
                        entidadId: documentoCentro.id_documento_centro,
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
