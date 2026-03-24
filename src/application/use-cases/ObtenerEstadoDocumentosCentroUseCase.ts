import { injectable } from 'tsyringe';
import { prisma } from '../../infrastructure/database/prisma/client';

/**
 * Caso de uso para obtener el estado del documento (certificación sanitaria) de un centro de salud
 */
@injectable()
export class ObtenerEstadoDocumentosCentroUseCase {
    async execute(centroId: number): Promise<any> {
        // Verificar que el centro existe
        const centro = await prisma.centroSalud.findUnique({
            where: { usuarioId: centroId },
            select: {
                usuarioId: true,
                estadoVerificacion: true,
                certificacion_sanitaria: true,
                creadoEn: true,
                actualizadoEn: true,
            },
        });

        if (!centro) {
            throw new Error('Centro de Salud no encontrado');
        }

        // Para centros de salud el único documento es la certificación sanitaria
        // Vamos a buscar la última acción de revisión asociada a este centro
        const ultimaAccion = await prisma.accion.findFirst({
            where: {
                emisorId: centroId,
                tipoAccion: {
                    nombre: 'Registro Centro de Salud'
                }
            },
            orderBy: {
                fechaEmision: 'desc',
            },
            select: {
                id: true,
                estado: true,
                comentarioAdmin: true,
                fechaResolucion: true,
            },
        });

        const estadoRevision = ultimaAccion?.estado === 'Rechazada' ? 'Rechazado' 
            : ultimaAccion?.estado === 'Aprobada' ? 'Aprobado' 
            : 'Pendiente';

        return {
            estadoVerificacion: centro.estadoVerificacion,
            estadisticas: {
                total: 1,
                aprobados: centro.estadoVerificacion === 'Aprobado' ? 1 : 0,
                rechazados: estadoRevision === 'Rechazado' ? 1 : 0,
                pendientes: estadoRevision === 'Pendiente' ? 1 : 0,
                progreso: centro.estadoVerificacion === 'Aprobado' ? 100 : 0,
            },
            documentos: [
                {
                    id: 1, // ID virtual o fijo ya que siempre es el mismo campo
                    tipoDocumento: 'Certificación Sanitaria',
                    urlArchivo: centro.certificacion_sanitaria,
                    estadoRevision,
                    creadoEn: centro.creadoEn,
                    actualizadoEn: centro.actualizadoEn,
                    ultimaAccion: ultimaAccion || null,
                }
            ],
        };
    }
}
