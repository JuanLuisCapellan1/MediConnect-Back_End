import { injectable, inject } from 'tsyringe';
import { AprobarRechazarDocumentoDto } from '../dtos/AprobarRechazarDocumentoDto';
import { prisma } from '../../infrastructure/database/prisma/client';
import { EnviarNotificacionUseCase } from './notificaciones/EnviarNotificacionUseCase';

/**
 * Caso de uso para aprobar o rechazar un documento o la información personal de un doctor.
 *
 * Regla de negocio:
 *   - `estadoInfoPersonal` refleja el estado de la revisión de los datos personales.
 *   - `estadoRevision` de cada DocumentoDoctor refleja el estado de cada documento.
 *   - `estadoVerificacion` (cuenta general) pasa a 'Aprobado' SOLO cuando:
 *       · estadoInfoPersonal === 'Aprobado'  Y
 *       · todos los DocumentoDoctor activos tienen estadoRevision === 'Aprobado'
 *   - Cualquier rechazo vuelve el campo afectado a 'Rechazado' y estadoVerificacion a 'En revisión',
 *     permitiendo que el doctor corrija y reenvíe.
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
            include: { tipoAccion: true },
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
                // Lógica para Centro de Salud
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
                // ── Aprobación/rechazo de INFORMACIÓN PERSONAL del doctor ──────────────
                // Actualiza estadoInfoPersonal y recalcula estadoVerificacion global.
                const nuevoEstadoInfoPersonal = dto.decision === 'Aprobada' ? 'Aprobado' : 'Rechazado';

                if (dto.decision === 'Aprobada') {
                    // Info personal aprobada → comprobar si todos los docs también están aprobados
                    const documentos = await tx.documentoDoctor.findMany({
                        where: { doctorId: accion.emisorId, estado: 'Activo' },
                        select: { estadoRevision: true },
                    });

                    const todosDocumentosAprobados =
                        documentos.length > 0 &&
                        documentos.every((doc) => doc.estadoRevision === 'Aprobado');

                    const nuevoEstadoVerif = todosDocumentosAprobados ? 'Aprobado' : 'En revisión';
                    await tx.doctor.update({
                        where: { usuarioId: accion.emisorId },
                        data: {
                            estadoInfoPersonal: nuevoEstadoInfoPersonal,
                            estadoVerificacion: nuevoEstadoVerif,
                            actualizadoEn: new Date(),
                        },
                    });
                    cuentaDoctorAprobada = todosDocumentosAprobados;
                } else {
                    // Info personal rechazada → estadoInfoPersonal = 'Rechazado', cuenta pasa a 'Rechazado'
                    // para que el doctor sepa que debe corregir y reenviar su información personal.
                    await tx.doctor.update({
                        where: { usuarioId: accion.emisorId },
                        data: {
                            estadoInfoPersonal: nuevoEstadoInfoPersonal,
                            estadoVerificacion: 'Rechazado',
                            actualizadoEn: new Date(),
                        },
                    });
                }

            } else {
                // ── Aprobación/rechazo de un DOCUMENTO específico del doctor ──────────
                const nuevoEstadoDoc = dto.decision === 'Aprobada' ? 'Aprobado' : 'Rechazado';
                await tx.documentoDoctor.update({
                    where: { id: accion.documentoId! },
                    data: { estadoRevision: nuevoEstadoDoc, actualizadoEn: new Date() },
                });

                if (dto.decision === 'Aprobada') {
                    // Documento aprobado → comprobar si todos los docs Y la info personal están aprobados
                    const documentos = await tx.documentoDoctor.findMany({
                        where: { doctorId: documentoDoctor.doctorId, estado: 'Activo' },
                        select: { estadoRevision: true },
                    });

                    const todosDocumentosAprobados = documentos.every(
                        (doc) => doc.estadoRevision === 'Aprobado',
                    );

                    if (todosDocumentosAprobados) {
                        // Verificar también que la info personal esté aprobada
                        const doctorActual = await tx.doctor.findUnique({
                            where: { usuarioId: documentoDoctor.doctorId },
                            select: { estadoInfoPersonal: true },
                        });

                        if (doctorActual?.estadoInfoPersonal === 'Aprobado') {
                            await tx.doctor.update({
                                where: { usuarioId: documentoDoctor.doctorId },
                                data: { estadoVerificacion: 'Aprobado', actualizadoEn: new Date() },
                            });
                            cuentaDoctorAprobada = true;
                        }
                        // Si la info personal no está aprobada, estadoVerificacion se queda en 'En revisión'
                    }
                } else {
                    // Documento rechazado → cuenta vuelve a 'En revisión' para que corrija y reenvíe
                    await tx.doctor.update({
                        where: { usuarioId: documentoDoctor.doctorId },
                        data: { estadoVerificacion: 'En revisión', actualizadoEn: new Date() },
                    });
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
                // Notificaciones de información personal
                if (dto.decision === 'Aprobada' && cuentaDoctorAprobada) {
                    // Info personal + todos los docs aprobados → cuenta completa
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: '¡Cuenta Completamente Aprobada!',
                        mensaje: '¡Felicidades! Tu información personal y todos tus documentos han sido aprobados. Ya puedes comenzar a ofrecer tus servicios en MediConnect.',
                        tipoAlerta: 'Exito',
                        tipoEntidad: 'Perfil',
                    });
                } else if (dto.decision === 'Aprobada') {
                    // Info personal aprobada, aún hay docs pendientes
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: 'Información Personal Aprobada',
                        mensaje: 'Tu información personal ha sido aprobada. Tu cuenta quedará completamente verificada una vez que tus documentos sean revisados.',
                        tipoAlerta: 'Exito',
                        tipoEntidad: 'Perfil',
                    });
                } else {
                    // Info personal rechazada
                    await this.enviarNotifUC.execute({
                        usuarioId: accion.emisorId,
                        titulo: 'Información Personal Rechazada',
                        mensaje: `Tu información personal ha sido rechazada. ${dto.comentario ? `Motivo: ${dto.comentario}` : 'Por favor, corrígela y vuelve a enviarla para continuar con el proceso de verificación.'}`,
                        tipoAlerta: 'Importante',
                        tipoEntidad: 'Perfil',
                    });
                }
            } else {
                // Notificaciones de documento específico del doctor
                if (dto.decision === 'Aprobada' && cuentaDoctorAprobada) {
                    await this.enviarNotifUC.execute({
                        usuarioId: documentoDoctor.doctorId,
                        titulo: '¡Cuenta Completamente Aprobada!',
                        mensaje: 'Todos tus documentos e información personal han sido aprobados. Tu cuenta está completamente verificada en MediConnect.',
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
                        titulo: 'Documento Rechazado',
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
