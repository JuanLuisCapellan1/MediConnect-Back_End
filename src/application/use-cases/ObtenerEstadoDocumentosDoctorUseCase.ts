import { injectable } from 'tsyringe';
import { prisma } from '../../infrastructure/database/prisma/client';

/**
 * Caso de uso para obtener el estado de los documentos de un doctor
 */
@injectable()
export class ObtenerEstadoDocumentosDoctorUseCase {
    async execute(doctorId: number): Promise<any> {
        // Verificar que el doctor existe
        const doctor = await prisma.doctor.findUnique({
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
        const documentos = await prisma.documentoDoctor.findMany({
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
}
